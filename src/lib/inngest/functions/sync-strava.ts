import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  platformConnections,
  activities,
  dailyMetrics,
  sportProfiles,
  athleteProfiles,
} from "@/lib/db/schema";
import type { StreamDataBlob } from "@/lib/db/schema/activities";
import { eq, and, desc, lt } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivities,
  fetchActivityDetail,
  fetchActivityStreams,
  processStravaActivity,
} from "@/lib/integrations/strava";
import type { StravaStreamSet, StravaActivity } from "@/lib/integrations/strava";
import { calculateTSS, estimateTSSFromAvgPower } from "@/lib/engine/cycling/tss";
import { calculateNormalizedPower } from "@/lib/engine/cycling/normalized-power";
import { thresholdHistory } from "@/lib/db/schema";
import { calculateRTSS, estimateRTSSFromAvgPace } from "@/lib/engine/running/rtss";
import { calculateNGP } from "@/lib/engine/running/normalized-graded-pace";
import { calculateSTSS } from "@/lib/engine/swimming/stss";
import { calculateHrTSS } from "@/lib/engine/shared/trimp";
import { updateDailyMetrics as computeDailyUpdate } from "@/lib/engine/shared/fatigue-model";
import { calculatePeakPowers } from "@/lib/engine/cycling/power-profile";
import { findCrossPlatformDuplicate } from "@/lib/engine/shared/activity-dedup";

/**
 * Process a Strava webhook event.
 * Fetches the activity, calculates metrics, and stores in DB.
 */
export const processStravaWebhook = inngest.createFunction(
  { id: "process-strava-webhook", retries: 3 },
  { event: "strava/webhook.received" },
  async ({ event, step }) => {
    const { objectId, aspectType, ownerId } = event.data;

    // Handle delete
    if (aspectType === "delete") {
      await step.run("delete-activity", async () => {
        await db
          .delete(activities)
          .where(
            and(
              eq(activities.externalId, String(objectId)),
              eq(activities.platform, "strava")
            )
          );
      });
      return { status: "deleted" };
    }

    // Get user's Strava connection
    const connection = await step.run("get-connection", async () => {
      const [conn] = await db
        .select()
        .from(platformConnections)
        .where(
          and(
            eq(platformConnections.platformUserId, String(ownerId)),
            eq(platformConnections.platform, "strava"),
            eq(platformConnections.isActive, true)
          )
        )
        .limit(1);
      return conn;
    });

    if (!connection?.accessTokenEncrypted || !connection?.refreshTokenEncrypted) {
      return { status: "no_connection" };
    }

    // Get valid token (refresh if needed)
    const { accessToken, refreshed, newTokens } = await step.run(
      "get-token",
      async () => {
        const expiresAt = connection.tokenExpiresAt
          ? new Date(connection.tokenExpiresAt)
          : new Date(Date.now());
        return getValidToken(
          connection.accessTokenEncrypted!,
          connection.refreshTokenEncrypted!,
          expiresAt
        );
      }
    );

    // Save refreshed tokens
    if (refreshed && newTokens) {
      await step.run("save-tokens", async () => {
        const encrypted = encryptTokens(newTokens);
        await db
          .update(platformConnections)
          .set({
            accessTokenEncrypted: encrypted.accessTokenEncrypted,
            refreshTokenEncrypted: encrypted.refreshTokenEncrypted,
            tokenExpiresAt: encrypted.tokenExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(platformConnections.id, connection.id));
      });
    }

    // Fetch activity from Strava
    const stravaActivity = await step.run("fetch-activity", async () => {
      return fetchActivityDetail(accessToken, objectId);
    });

    // Process and store
    const processed = processStravaActivity(stravaActivity);
    if (!processed) {
      return { status: "unsupported_sport" };
    }

    // Get sport profile + athlete profile for thresholds
    const { profile, restingHr } = await step.run("get-sport-profile", async () => {
      const [[sp], [ap]] = await Promise.all([
        db
          .select()
          .from(sportProfiles)
          .where(
            and(
              eq(sportProfiles.userId, connection.userId),
              eq(sportProfiles.sport, processed.sport)
            )
          )
          .limit(1),
        db
          .select({ restingHr: athleteProfiles.restingHr })
          .from(athleteProfiles)
          .where(eq(athleteProfiles.userId, connection.userId))
          .limit(1),
      ]);
      return { profile: sp, restingHr: ap?.restingHr ?? null };
    });

    // Fetch streams for detailed analysis
    const streams = await step.run("fetch-streams", async () => {
      try {
        return await fetchActivityStreams(accessToken, objectId);
      } catch {
        // Streams may not be available for all activities
        return null;
      }
    });

    // Auto-detect FTP from this activity's NP (stable — no decay)
    const ftpResult = await step.run("auto-detect-ftp", async () => {
      if (processed.sport !== "cycling") return { profile, effectiveFtp: profile?.ftp ?? 0 };
      const np = stravaActivity.weighted_average_watts;
      if (!np) return { profile, effectiveFtp: profile?.ftp ?? 0 };
      return autoDetectCyclingFTP(
        connection.userId,
        np,
        profile,
        new Date(stravaActivity.start_date),
        String(objectId)
      );
    });

    // Calculate sport-specific metrics from streams (using effective FTP)
    const metrics = await step.run("calculate-metrics", async () => {
      const profileForMetrics = processed.sport === "cycling"
        ? { ...ftpResult.profile, ftp: ftpResult.effectiveFtp } as SportProfileRow
        : ftpResult.profile;
      return calculateActivityMetrics(
        processed.sport,
        stravaActivity,
        streams,
        profileForMetrics,
        restingHr
      );
    });

    // Store activity with calculated metrics
    const storedActivityId = await step.run("store-activity", async () => {
      const activityData = {
        ...processed,
        userId: connection.userId,
        normalizedPower: metrics.normalizedPower,
        normalizedGradedPace: metrics.normalizedGradedPace,
        intensityFactor: metrics.intensityFactor,
        tss: metrics.tss,
        trimp: metrics.trimp,
        ftpUsed: processed.sport === "cycling" ? ftpResult.effectiveFtp || null : null,
      };

      // Upsert: update if exists, insert if new
      const [existing] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.externalId, String(objectId)),
            eq(activities.platform, "strava")
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(activities)
          .set(activityData)
          .where(eq(activities.id, existing.id));
        return existing.id;
      } else {
        // Cross-platform dedup: skip if same ride already synced from Garmin/Wahoo
        const crossDupe = await findCrossPlatformDuplicate(
          connection.userId,
          "strava",
          activityData.startedAt,
          activityData.durationSeconds
        );
        if (crossDupe) return crossDupe;

        const [inserted] = await db
          .insert(activities)
          .values(activityData)
          .returning({ id: activities.id });
        return inserted.id;
      }
    });

    // Store streams if available
    if (streams) {
      await step.run("store-streams", async () => {
        await storeActivityStreams(storedActivityId, stravaActivity, streams);
      });
    }

    // Update daily metrics (CTL/ATL/TSB)
    if (metrics.tss && metrics.tss > 0) {
      await step.run("update-daily-metrics", async () => {
        await upsertDailyMetrics(
          connection.userId,
          processed.sport,
          new Date(stravaActivity.start_date),
          metrics.tss ?? 0
        );
      });
    }

    return { status: "processed", activityId: storedActivityId };
  }
);

/**
 * Backfill historical activities from Strava on first connect.
 */
export const backfillStravaActivities = inngest.createFunction(
  {
    id: "backfill-strava-activities",
    retries: 2,
    concurrency: [{ limit: 1, key: "event.data.userId" }],
  },
  { event: "strava/backfill.requested" },
  async ({ event, step }) => {
    const { userId, connectionId } = event.data;

    const connection = await step.run("get-connection", async () => {
      const [conn] = await db
        .select()
        .from(platformConnections)
        .where(eq(platformConnections.id, connectionId))
        .limit(1);
      return conn;
    });

    if (!connection?.accessTokenEncrypted || !connection?.refreshTokenEncrypted) {
      return { status: "no_connection" };
    }

    // Get valid token
    const { accessToken, refreshed, newTokens } = await step.run(
      "get-token",
      async () => {
        const expiresAt = connection.tokenExpiresAt
          ? new Date(connection.tokenExpiresAt)
          : new Date(Date.now());
        return getValidToken(
          connection.accessTokenEncrypted!,
          connection.refreshTokenEncrypted!,
          expiresAt
        );
      }
    );

    if (refreshed && newTokens) {
      await step.run("save-tokens", async () => {
        const encrypted = encryptTokens(newTokens);
        await db
          .update(platformConnections)
          .set({
            accessTokenEncrypted: encrypted.accessTokenEncrypted,
            refreshTokenEncrypted: encrypted.refreshTokenEncrypted,
            tokenExpiresAt: encrypted.tokenExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(platformConnections.id, connection.id));
      });
    }

    // Fetch full activity history for accurate CTL/ATL/TSB calculation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allStravaActivities: StravaActivity[] = [];
    const perPage = 200;
    const maxPages = 50; // 50 × 200 = 10,000 activities max

    for (let page = 1; page <= maxPages; page++) {
      const pageActivities = await step.run(
        `fetch-page-${page}`,
        async () => {
          return fetchActivities(accessToken, page, perPage);
        }
      );

      if (pageActivities.length === 0) break;
      allStravaActivities.push(...pageActivities);
      // Don't break on short pages — Strava may return fewer than perPage
      // due to deleted/hidden activities. Only break on truly empty pages.
    }

    // Sort oldest-first for chronological FTP auto-detection
    allStravaActivities.sort(
      (a, b) =>
        new Date(a.start_date as string).getTime() -
        new Date(b.start_date as string).getTime()
    );

    // Process activities in batches (avoid serverless timeout)
    const BATCH = 50;
    let totalImported = 0;

    for (let b = 0; b < allStravaActivities.length; b += BATCH) {
      const batch = allStravaActivities.slice(b, b + BATCH);
      const batchImported = await step.run(
        `process-batch-${Math.floor(b / BATCH)}`,
        async () => {
          let imported = 0;

          for (const stravaActivity of batch) {
            const processed = processStravaActivity(stravaActivity);
            if (!processed) continue;

            // Skip duplicates
            const [existing] = await db
              .select({ id: activities.id })
              .from(activities)
              .where(
                and(
                  eq(activities.externalId, String(stravaActivity.id)),
                  eq(activities.platform, "strava")
                )
              )
              .limit(1);
            if (existing) continue;

            // Cross-platform dedup
            const crossDupe = await findCrossPlatformDuplicate(
              userId,
              "strava",
              processed.startedAt,
              processed.durationSeconds
            );
            if (crossDupe) continue;

            // Auto-detect FTP from this activity's NP (stable — no decay)
            let effectiveFtp = 0;
            if (processed.sport === "cycling") {
              const np =
                (stravaActivity as { weighted_average_watts?: number })
                  .weighted_average_watts;
              if (np) {
                const [currentProfile] = await db
                  .select()
                  .from(sportProfiles)
                  .where(
                    and(
                      eq(sportProfiles.userId, userId),
                      eq(sportProfiles.sport, "cycling")
                    )
                  )
                  .limit(1);
                const result = await autoDetectCyclingFTP(
                  userId,
                  np,
                  currentProfile,
                  new Date(stravaActivity.start_date as string),
                  String(stravaActivity.id)
                );
                effectiveFtp = result.effectiveFtp;
              }
            }

            // Fetch fresh profile (may have just been updated)
            const [[profile], [ap]] = await Promise.all([
              db
                .select()
                .from(sportProfiles)
                .where(
                  and(
                    eq(sportProfiles.userId, userId),
                    eq(sportProfiles.sport, processed.sport)
                  )
                )
                .limit(1),
              db
                .select({ restingHr: athleteProfiles.restingHr })
                .from(athleteProfiles)
                .where(eq(athleteProfiles.userId, userId))
                .limit(1),
            ]);

            // Use the time-appropriate FTP for metrics
            const profileForMetrics =
              processed.sport === "cycling" && effectiveFtp > 0
                ? ({ ...profile, ftp: effectiveFtp } as SportProfileRow)
                : profile;

            const metrics = calculateActivityMetrics(
              processed.sport,
              stravaActivity,
              null,
              profileForMetrics,
              ap?.restingHr ?? null
            );

            await db.insert(activities).values({
              ...processed,
              userId,
              normalizedPower: metrics.normalizedPower,
              normalizedGradedPace: metrics.normalizedGradedPace,
              intensityFactor: metrics.intensityFactor,
              tss: metrics.tss,
              trimp: metrics.trimp,
              ftpUsed:
                processed.sport === "cycling" ? effectiveFtp || null : null,
            });

            imported++;
          }
          return imported;
        }
      );
      totalImported += batchImported;
    }

    // Build daily_metrics chronologically from all imported activities
    const dailyTss = await step.run("aggregate-daily-tss", async () => {
      return db.execute<{
        day: string;
        cycling_tss: number;
        running_tss: number;
        swimming_tss: number;
        total_tss: number;
      }>(/* sql */ `
        SELECT DATE(started_at) AS day,
          COALESCE(SUM(CASE WHEN sport='cycling' THEN tss ELSE 0 END),0) AS cycling_tss,
          COALESCE(SUM(CASE WHEN sport='running' THEN tss ELSE 0 END),0) AS running_tss,
          COALESCE(SUM(CASE WHEN sport='swimming' THEN tss ELSE 0 END),0) AS swimming_tss,
          COALESCE(SUM(tss),0) AS total_tss
        FROM activities WHERE user_id = '${userId}' AND tss IS NOT NULL
        GROUP BY DATE(started_at) ORDER BY day ASC
      `);
    });

    if (dailyTss.length > 0) {
      await step.run("clear-old-metrics", async () => {
        await db.delete(dailyMetrics).where(eq(dailyMetrics.userId, userId));
      });

      const tssMap = new Map<string, { c: number; r: number; s: number; t: number }>();
      for (const row of dailyTss) {
        const key = new Date(row.day).toISOString().split("T")[0];
        tssMap.set(key, {
          c: Number(row.cycling_tss),
          r: Number(row.running_tss),
          s: Number(row.swimming_tss),
          t: Number(row.total_tss),
        });
      }

      // Build all rows in memory, then batch-insert
      const firstDay = new Date(dailyTss[0].day);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      let ctl = 0;
      let atl = 0;
      const current = new Date(firstDay);
      const allRows: Array<{
        userId: string; date: Date;
        totalTss: number; cyclingTss: number; runningTss: number; swimmingTss: number;
        ctl: number; atl: number; tsb: number;
      }> = [];

      while (current <= today) {
        const key = current.toISOString().split("T")[0];
        const d = tssMap.get(key) ?? { c: 0, r: 0, s: 0, t: 0 };
        ctl = ctl + (d.t - ctl) / 42;
        atl = atl + (d.t - atl) / 7;
        const tsb = ctl - atl;
        allRows.push({
          userId,
          date: new Date(current),
          totalTss: Math.round(d.t * 10) / 10,
          cyclingTss: Math.round(d.c * 10) / 10,
          runningTss: Math.round(d.r * 10) / 10,
          swimmingTss: Math.round(d.s * 10) / 10,
          ctl: Math.round(ctl * 10) / 10,
          atl: Math.round(atl * 10) / 10,
          tsb: Math.round(tsb * 10) / 10,
        });
        current.setUTCDate(current.getUTCDate() + 1);
      }

      // Insert in batches of 500
      const METRICS_BATCH = 500;
      for (let i = 0; i < allRows.length; i += METRICS_BATCH) {
        const chunk = allRows.slice(i, i + METRICS_BATCH);
        await step.run(`insert-metrics-${Math.floor(i / METRICS_BATCH)}`, async () => {
          await db.insert(dailyMetrics).values(chunk);
        });
      }
    }

    // Update last sync time
    await step.run("update-sync-time", async () => {
      await db
        .update(platformConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(platformConnections.id, connectionId));
    });

    // Auto-trigger stream backfill so new users get streams without admin action
    if (totalImported > 0) {
      await step.run("trigger-stream-backfill", async () => {
        await inngest.send({
          name: "streams/backfill.requested",
          data: { userId, platform: "strava" },
        });
      });
    }

    return { status: "completed", totalImported };
  }
);

// ── Helper functions ────────────────────────────────────────────────

type SportProfileRow = {
  ftp: number | null;
  thresholdPaceSPerKm: number | null;
  cssSPer100m: number | null;
  lthr: number | null;
  sportMaxHr: number | null;
} | null | undefined;

type CalculatedMetrics = {
  normalizedPower: number | null;
  normalizedGradedPace: number | null;
  intensityFactor: number | null;
  tss: number | null;
  trimp: number | null;
};

function calculateActivityMetrics(
  sport: "cycling" | "running" | "swimming",
  activity: {
    moving_time: number;
    distance: number;
    average_heartrate?: number;
    max_heartrate?: number;
    average_watts?: number;
    weighted_average_watts?: number;
    average_speed: number;
  },
  streams: StravaStreamSet | null,
  profile: SportProfileRow,
  athleteRestingHr?: number | null
): CalculatedMetrics {
  const result: CalculatedMetrics = {
    normalizedPower: null,
    normalizedGradedPace: null,
    intensityFactor: null,
    tss: null,
    trimp: null,
  };

  if (sport === "cycling") {
    const ftp = profile?.ftp;

    // Always capture NP (needed for FTP auto-detect even without current FTP)
    if (streams?.watts?.data && streams.watts.data.length >= 30) {
      result.normalizedPower = calculateNormalizedPower(streams.watts.data);
    }
    if (!result.normalizedPower && activity.weighted_average_watts) {
      result.normalizedPower = Math.round(activity.weighted_average_watts);
    }

    // TSS calculation requires FTP
    if (ftp) {
      // Try stream-based TSS first
      if (streams?.watts?.data && streams.watts.data.length >= 30) {
        const tssResult = calculateTSS(streams.watts.data, ftp);
        if (tssResult) {
          result.intensityFactor = tssResult.intensityFactor;
          result.tss = tssResult.tss;
        }
      }

      // Fall back to NP or average power
      if (!result.tss) {
        const power = result.normalizedPower ?? activity.average_watts;
        if (power) {
          result.intensityFactor = Math.round((power / ftp) * 1000) / 1000;
          result.tss = Math.round(
            result.intensityFactor ** 2 * (activity.moving_time / 3600) * 100 * 10
          ) / 10;
        }
      }
    }
  } else if (sport === "running") {
    const thresholdPace = profile?.thresholdPaceSPerKm;

    // Always capture NGP even without threshold
    if (
      streams?.velocity_smooth?.data &&
      streams.velocity_smooth.data.length >= 30
    ) {
      const gradeStream = streams.grade_smooth?.data;
      const ngp = calculateNGP(streams.velocity_smooth.data, gradeStream);
      if (ngp) {
        result.normalizedGradedPace = ngp;
        if (thresholdPace) {
          const rtssResult = calculateRTSS(
            streams.velocity_smooth.data,
            thresholdPace,
            gradeStream
          );
          if (rtssResult) {
            result.intensityFactor = rtssResult.intensityFactor;
            result.tss = rtssResult.rtss;
          }
        }
      }
    }

    // Fall back to average pace estimate
    if (!result.tss && thresholdPace && activity.distance > 0) {
      const avgPaceSecPerKm = (activity.moving_time / activity.distance) * 1000;
      result.tss = estimateRTSSFromAvgPace(
        avgPaceSecPerKm,
        activity.moving_time,
        thresholdPace
      );
      result.normalizedGradedPace = Math.round(avgPaceSecPerKm * 10) / 10;
    }
  } else if (sport === "swimming") {
    const css = profile?.cssSPer100m;

    if (css && activity.distance > 0) {
      const stssResult = calculateSTSS(
        activity.distance,
        activity.moving_time,
        css
      );
      if (stssResult) {
        result.intensityFactor = stssResult.intensityFactor;
        result.tss = stssResult.stss;
      }
    }
  }

  // HR-based TRIMP as fallback or supplement
  if (activity.average_heartrate && activity.max_heartrate) {
    const restingHr = athleteRestingHr ?? 60;
    result.trimp = calculateHrTSS(
      activity.average_heartrate,
      activity.moving_time,
      profile?.lthr ?? Math.round(activity.max_heartrate * 0.93),
      restingHr,
      activity.max_heartrate
    );

    // If no power/pace TSS, use hrTSS
    if (!result.tss && result.trimp) {
      result.tss = result.trimp;
    }
  }

  return result;
}

async function storeActivityStreams(
  activityId: string,
  _activity: { start_date: string },
  streams: StravaStreamSet
) {
  const timeData = streams.time?.data;
  if (!timeData || timeData.length === 0) return;

  const blob: StreamDataBlob = { time: timeData };
  if (streams.watts?.data) blob.watts = streams.watts.data;
  if (streams.heartrate?.data) blob.heartrate = streams.heartrate.data;
  if (streams.cadence?.data) blob.cadence = streams.cadence.data;
  if (streams.velocity_smooth?.data) blob.velocity_smooth = streams.velocity_smooth.data;
  if (streams.altitude?.data) blob.altitude = streams.altitude.data;
  if (streams.distance?.data) blob.distance = streams.distance.data;
  if (streams.latlng?.data) blob.latlng = streams.latlng.data;
  if (streams.grade_smooth?.data) blob.grade_smooth = streams.grade_smooth.data;

  const update: Record<string, unknown> = { streamData: blob };

  // Calculate peak powers if this is a cycling activity with power data
  if (blob.watts?.length) {
    const peaks = calculatePeakPowers(blob.watts);
    if (peaks.peak5s != null) update.peak5s = peaks.peak5s;
    if (peaks.peak15s != null) update.peak15s = peaks.peak15s;
    if (peaks.peak30s != null) update.peak30s = peaks.peak30s;
    if (peaks.peak1m != null) update.peak1m = peaks.peak1m;
    if (peaks.peak5m != null) update.peak5m = peaks.peak5m;
    if (peaks.peak10m != null) update.peak10m = peaks.peak10m;
    if (peaks.peak20m != null) update.peak20m = peaks.peak20m;
    if (peaks.peak60m != null) update.peak60m = peaks.peak60m;
  }

  await db
    .update(activities)
    .set(update)
    .where(eq(activities.id, activityId));
}

/**
 * Auto-detect cycling FTP from a ride's NP.
 * Uses stable FTP — no decay between activities.
 * Breakthrough when NP × 0.95 > current stable FTP.
 */
async function autoDetectCyclingFTP(
  userId: string,
  np: number,
  currentProfile: SportProfileRow,
  activityDate: Date,
  activityExternalId?: string
): Promise<{ profile: SportProfileRow; effectiveFtp: number }> {
  const currentFtp = currentProfile?.ftp ?? 0;

  // Candidate FTP from this ride's NP
  const candidateFtp = Math.round(np * 0.95);

  if (candidateFtp > currentFtp) {
    // Breakthrough — update profile and record
    if (currentProfile) {
      await db
        .update(sportProfiles)
        .set({ ftp: candidateFtp, updatedAt: new Date() })
        .where(
          and(
            eq(sportProfiles.userId, userId),
            eq(sportProfiles.sport, "cycling")
          )
        );
    } else {
      await db.insert(sportProfiles).values({
        userId,
        sport: "cycling",
        ftp: candidateFtp,
      });
    }

    await db.insert(thresholdHistory).values({
      userId,
      sport: "cycling",
      metricName: "ftp",
      value: candidateFtp,
      source: "auto_detect",
      activityId: activityExternalId,
      detectedAt: activityDate,
    });

    return {
      profile: { ...currentProfile, ftp: candidateFtp } as SportProfileRow,
      effectiveFtp: candidateFtp,
    };
  }

  return {
    profile: currentProfile,
    effectiveFtp: currentFtp,
  };
}

async function upsertDailyMetrics(
  userId: string,
  sport: "cycling" | "running" | "swimming",
  activityDate: Date,
  tss: number
) {
  const date = new Date(activityDate);
  date.setUTCHours(0, 0, 0, 0);

  // Get existing daily metric for this date
  const [existing] = await db
    .select()
    .from(dailyMetrics)
    .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date)))
    .limit(1);

  const sportTssField =
    sport === "cycling"
      ? "cyclingTss"
      : sport === "running"
        ? "runningTss"
        : "swimmingTss";

  // Find most recent metric BEFORE today (handles gaps & timezone mismatches)
  const [prev] = await db
    .select({ ctl: dailyMetrics.ctl, atl: dailyMetrics.atl, date: dailyMetrics.date })
    .from(dailyMetrics)
    .where(
      and(eq(dailyMetrics.userId, userId), lt(dailyMetrics.date, date))
    )
    .orderBy(desc(dailyMetrics.date))
    .limit(1);

  let prevCtl = prev?.ctl ?? 0;
  let prevAtl = prev?.atl ?? 0;

  // Decay through any gap days (rest days with TSS=0)
  if (prev?.date) {
    const prevDate = new Date(prev.date);
    const gapMs = date.getTime() - prevDate.getTime();
    const gapDays = Math.max(0, Math.round(gapMs / (24 * 3600_000)) - 1);
    for (let i = 0; i < gapDays; i++) {
      const decayed = computeDailyUpdate(0, prevCtl, prevAtl);
      prevCtl = decayed.ctl;
      prevAtl = decayed.atl;
    }
  }

  if (existing) {
    const currentSportTss = (existing[sportTssField] as number) ?? 0;
    const newTotalTss = (existing.totalTss ?? 0) - currentSportTss + tss;

    const updated = computeDailyUpdate(newTotalTss, prevCtl, prevAtl);

    await db
      .update(dailyMetrics)
      .set({
        [sportTssField]: tss,
        totalTss: newTotalTss,
        ctl: updated.ctl,
        atl: updated.atl,
        tsb: updated.tsb,
      })
      .where(eq(dailyMetrics.id, existing.id));
  } else {
    const updated = computeDailyUpdate(tss, prevCtl, prevAtl);

    await db.insert(dailyMetrics).values({
      userId,
      date,
      [sportTssField]: tss,
      totalTss: tss,
      cyclingTss: sport === "cycling" ? tss : 0,
      runningTss: sport === "running" ? tss : 0,
      swimmingTss: sport === "swimming" ? tss : 0,
      ctl: updated.ctl,
      atl: updated.atl,
      tsb: updated.tsb,
    });
  }
}

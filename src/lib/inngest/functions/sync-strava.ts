import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  platformConnections,
  activities,
  activityStreams,
  dailyMetrics,
  sportProfiles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivities,
  fetchActivityDetail,
  fetchActivityStreams,
  processStravaActivity,
} from "@/lib/integrations/strava";
import type { StravaStreamSet } from "@/lib/integrations/strava";
import { calculateTSS, estimateTSSFromAvgPower, estimateFTPFrom20Min } from "@/lib/engine/cycling/tss";
import { calculateNormalizedPower } from "@/lib/engine/cycling/normalized-power";
import { calculateRTSS, estimateRTSSFromAvgPace } from "@/lib/engine/running/rtss";
import { calculateNGP } from "@/lib/engine/running/normalized-graded-pace";
import { calculateSTSS } from "@/lib/engine/swimming/stss";
import { calculateHrTSS } from "@/lib/engine/shared/trimp";
import { updateDailyMetrics as computeDailyUpdate } from "@/lib/engine/shared/fatigue-model";

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

    // Get sport profile for thresholds
    const profile = await step.run("get-sport-profile", async () => {
      const [sp] = await db
        .select()
        .from(sportProfiles)
        .where(
          and(
            eq(sportProfiles.userId, connection.userId),
            eq(sportProfiles.sport, processed.sport)
          )
        )
        .limit(1);
      return sp;
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

    // Calculate sport-specific metrics from streams
    const metrics = await step.run("calculate-metrics", async () => {
      return calculateActivityMetrics(
        processed.sport,
        stravaActivity,
        streams,
        profile
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

    // Fetch activities from Jan 1 2025 onwards (200 per page, up to 10 pages)
    let totalImported = 0;
    const perPage = 200;
    const maxPages = 10;
    const after = Math.floor(new Date("2025-01-01T00:00:00Z").getTime() / 1000);

    for (let page = 1; page <= maxPages; page++) {
      const pageActivities = await step.run(
        `fetch-page-${page}`,
        async () => {
          return fetchActivities(accessToken, page, perPage, after);
        }
      );

      if (pageActivities.length === 0) break;

      // Process each activity in the page
      await step.run(`process-page-${page}`, async () => {
        for (const stravaActivity of pageActivities) {
          const processed = processStravaActivity(stravaActivity);
          if (!processed) continue;

          // Check if already exists
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

          if (existing) continue; // Skip duplicates

          // Get sport profile for thresholds
          const [profile] = await db
            .select()
            .from(sportProfiles)
            .where(
              and(
                eq(sportProfiles.userId, userId),
                eq(sportProfiles.sport, processed.sport)
              )
            )
            .limit(1);

          // Calculate basic metrics from summary data (no streams for backfill)
          const metrics = calculateActivityMetrics(
            processed.sport,
            stravaActivity,
            null,
            profile
          );

          await db.insert(activities).values({
            ...processed,
            userId,
            normalizedPower: metrics.normalizedPower,
            normalizedGradedPace: metrics.normalizedGradedPace,
            intensityFactor: metrics.intensityFactor,
            tss: metrics.tss,
            trimp: metrics.trimp,
          });

          totalImported++;
        }
      });

      if (pageActivities.length < perPage) break; // Last page
    }

    // Update last sync time
    await step.run("update-sync-time", async () => {
      await db
        .update(platformConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(platformConnections.id, connectionId));
    });

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
} | undefined;

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
  profile: SportProfileRow
): CalculatedMetrics {
  const result: CalculatedMetrics = {
    normalizedPower: null,
    normalizedGradedPace: null,
    intensityFactor: null,
    tss: null,
    trimp: null,
  };

  if (sport === "cycling") {
    const ftp = profile?.ftp ?? 200;

    // Try stream-based NP/TSS first
    if (streams?.watts?.data && streams.watts.data.length >= 30) {
      const tssResult = calculateTSS(streams.watts.data, ftp);
      if (tssResult) {
        result.normalizedPower = tssResult.normalizedPower;
        result.intensityFactor = tssResult.intensityFactor;
        result.tss = tssResult.tss;
      }
    }

    // Fall back to Strava's weighted_average_watts or average power
    if (!result.tss) {
      const power = activity.weighted_average_watts ?? activity.average_watts;
      if (power) {
        result.normalizedPower = activity.weighted_average_watts
          ? Math.round(activity.weighted_average_watts)
          : null;
        result.tss = estimateTSSFromAvgPower(power, activity.moving_time, ftp);
        result.intensityFactor = Math.round((power / ftp) * 1000) / 1000;
      }
    }
  } else if (sport === "running") {
    const thresholdPace = profile?.thresholdPaceSPerKm ?? 300;

    // Try stream-based NGP/rTSS
    if (
      streams?.velocity_smooth?.data &&
      streams.velocity_smooth.data.length >= 30
    ) {
      const gradeStream = streams.grade_smooth?.data;
      const ngp = calculateNGP(streams.velocity_smooth.data, gradeStream);
      if (ngp) {
        result.normalizedGradedPace = ngp;
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

    // Fall back to average pace estimate
    if (!result.tss && activity.distance > 0) {
      const avgPaceSecPerKm = (activity.moving_time / activity.distance) * 1000;
      result.tss = estimateRTSSFromAvgPace(
        avgPaceSecPerKm,
        activity.moving_time,
        thresholdPace
      );
      result.normalizedGradedPace = Math.round(avgPaceSecPerKm * 10) / 10;
    }
  } else if (sport === "swimming") {
    const css = profile?.cssSPer100m ?? 110;

    if (activity.distance > 0) {
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
    const restingHr = 60; // Default if unknown
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
  activity: { start_date: string },
  streams: StravaStreamSet
) {
  const timeData = streams.time?.data;
  if (!timeData || timeData.length === 0) return;

  const startTime = new Date(activity.start_date);
  const rows = timeData.map((secondOffset, i) => ({
    activityId,
    timestamp: new Date(startTime.getTime() + secondOffset * 1000),
    secondOffset,
    powerWatts: streams.watts?.data?.[i] ?? null,
    heartRate: streams.heartrate?.data?.[i] ?? null,
    cadenceRpm: streams.cadence?.data?.[i] ?? null,
    speedMps: streams.velocity_smooth?.data?.[i] ?? null,
    paceSecPerKm:
      streams.velocity_smooth?.data?.[i] && streams.velocity_smooth.data[i] > 0
        ? Math.round((1000 / streams.velocity_smooth.data[i]) * 10) / 10
        : null,
    altitudeMeters: streams.altitude?.data?.[i] ?? null,
    distanceMeters: streams.distance?.data?.[i] ?? null,
    latitudeDeg: streams.latlng?.data?.[i]?.[0] ?? null,
    longitudeDeg: streams.latlng?.data?.[i]?.[1] ?? null,
    gradePercent: streams.grade_smooth?.data?.[i] ?? null,
    strokeCount: null,
    swolf: null,
  }));

  // Insert in batches of 1000
  for (let i = 0; i < rows.length; i += 1000) {
    const batch = rows.slice(i, i + 1000);
    await db.insert(activityStreams).values(batch);
  }
}

async function upsertDailyMetrics(
  userId: string,
  sport: "cycling" | "running" | "swimming",
  activityDate: Date,
  tss: number
) {
  const date = new Date(activityDate);
  date.setHours(0, 0, 0, 0);

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

  if (existing) {
    const currentSportTss = (existing[sportTssField] as number) ?? 0;
    const newTotalTss = (existing.totalTss ?? 0) - currentSportTss + tss;

    // Recalculate CTL/ATL/TSB
    const prevCtl = existing.ctl ?? 0;
    const prevAtl = existing.atl ?? 0;
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
    // Get previous day's metrics for CTL/ATL
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const [prev] = await db
      .select({ ctl: dailyMetrics.ctl, atl: dailyMetrics.atl })
      .from(dailyMetrics)
      .where(
        and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, yesterday))
      )
      .limit(1);

    const updated = computeDailyUpdate(tss, prev?.ctl ?? 0, prev?.atl ?? 0);

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

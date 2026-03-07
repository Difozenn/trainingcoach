/**
 * Garmin Sync — Inngest Functions
 *
 * processGarminWebhook: handles activity push events
 * processGarminHealth: writes dailies/sleep/HRV to dailyMetrics
 * backfillGarminActivities: pulls historical activities on first connect
 * garminHealthCron: daily 06:00 UTC fallback for missed health deliveries
 */

import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  platformConnections,
  activities,
  dailyMetrics,
  sportProfiles,
  athleteProfiles,
} from "@/lib/db/schema";
import { eq, and, desc, lt } from "drizzle-orm";
import {
  getGarminTokens,
  fetchActivities,
  fetchDailies,
  fetchSleep,
  fetchHrvSummaries,
  processGarminActivity,
  processHealthData,
} from "@/lib/integrations/garmin";
import type { GarminActivity, GarminDaily, GarminSleep, GarminHrvSummary } from "@/lib/integrations/garmin";
import { estimateTSSFromAvgPower } from "@/lib/engine/cycling/tss";
import { estimateRTSSFromAvgPace } from "@/lib/engine/running/rtss";
import { calculateSTSS } from "@/lib/engine/swimming/stss";
import { calculateHrTSS } from "@/lib/engine/shared/trimp";
import { updateDailyMetrics as computeDailyUpdate } from "@/lib/engine/shared/fatigue-model";
import { findCrossPlatformDuplicate } from "@/lib/engine/shared/activity-dedup";

// ── Activity Webhook ────────────────────────────────────────────────

export const processGarminWebhook = inngest.createFunction(
  { id: "process-garmin-webhook", retries: 3 },
  { event: "garmin/webhook.activities" },
  async ({ event, step }) => {
    const garminActivities: GarminActivity[] = event.data.activities;
    let processed = 0;

    for (const garminActivity of garminActivities) {
      const result = await step.run(
        `process-activity-${garminActivity.activityId}`,
        async () => {
          return processOneGarminActivity(garminActivity);
        }
      );
      if (result === "processed") processed++;
    }

    return { status: "completed", processed };
  }
);

async function processOneGarminActivity(
  garminActivity: GarminActivity
): Promise<string> {
  const processed = processGarminActivity(garminActivity);
  if (!processed) return "unsupported_sport";

  // Find connection by Garmin user identifier (access token stored as platformUserId)
  // Garmin webhook includes userAccessToken in health data, but for activities
  // we match by externalId during backfill. For webhooks, activities come with
  // context that lets us find the user.
  // Note: Garmin webhooks group by user — find connection via any active Garmin conn
  const connections = await db
    .select()
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.platform, "garmin"),
        eq(platformConnections.isActive, true)
      )
    );

  // Try to match activity to user (for single-user this is straightforward;
  // for multi-user, we'd use the userAccessToken from the webhook payload)
  for (const connection of connections) {
    // Check if activity already exists for any user
    const [existing] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(
          eq(activities.externalId, processed.externalId),
          eq(activities.platform, "garmin")
        )
      )
      .limit(1);

    if (existing) return "duplicate";

    // Cross-platform dedup: skip if same ride already synced from Strava/Wahoo
    const crossDupe = await findCrossPlatformDuplicate(
      connection.userId,
      "garmin",
      processed.startedAt,
      processed.durationSeconds
    );
    if (crossDupe) return "cross_platform_duplicate";

    const [[profile], [ap]] = await Promise.all([
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

    const metrics = calculateGarminMetrics(processed, profile, ap?.restingHr);

    await db.insert(activities).values({
      userId: connection.userId,
      externalId: processed.externalId,
      platform: processed.platform,
      sport: processed.sport,
      name: processed.name,
      description: processed.description,
      startedAt: processed.startedAt,
      durationSeconds: processed.durationSeconds,
      movingTimeSeconds: processed.movingTimeSeconds,
      elapsedTimeSeconds: processed.elapsedTimeSeconds,
      distanceMeters: processed.distanceMeters,
      elevationGainMeters: processed.elevationGainMeters,
      averageHr: processed.averageHr,
      maxHr: processed.maxHr,
      averagePowerWatts: processed.averagePowerWatts,
      maxPowerWatts: processed.maxPowerWatts,
      averageCadence: processed.averageCadence,
      averageSpeedMps: processed.averageSpeedMps,
      poolLengthMeters: processed.poolLengthMeters,
      averageSwolf: processed.averageSwolf,
      gearId: processed.gearId,
      normalizedPower: metrics.normalizedPower,
      normalizedGradedPace: metrics.normalizedGradedPace,
      intensityFactor: metrics.intensityFactor,
      tss: metrics.tss,
      trimp: metrics.trimp,
    });

    if (metrics.tss && metrics.tss > 0) {
      await upsertDailyMetrics(
        connection.userId,
        processed.sport,
        processed.startedAt,
        metrics.tss
      );
    }

    return "processed";
  }

  return "no_connection";
}

// ── Health Data Webhook ─────────────────────────────────────────────

export const processGarminHealth = inngest.createFunction(
  { id: "process-garmin-health", retries: 3 },
  { event: "garmin/webhook.health" },
  async ({ event, step }) => {
    const { dailies, sleeps, hrvSummaries } = event.data as {
      dailies: GarminDaily[];
      sleeps: GarminSleep[];
      hrvSummaries: GarminHrvSummary[];
    };

    // Group health data by userAccessToken to find connections
    const userTokens = new Set<string>();
    for (const d of dailies) userTokens.add(d.userAccessToken);
    for (const s of sleeps) userTokens.add(s.userAccessToken);
    for (const h of hrvSummaries) userTokens.add(h.userAccessToken);

    let updated = 0;

    for (const userAccessToken of userTokens) {
      await step.run(`health-${userAccessToken.slice(0, 8)}`, async () => {
        // Find connection by platformUserId (which stores the access token)
        const [connection] = await db
          .select()
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.platformUserId, userAccessToken),
              eq(platformConnections.platform, "garmin"),
              eq(platformConnections.isActive, true)
            )
          )
          .limit(1);

        if (!connection) return;

        // Filter health data for this user
        const userDailies = dailies.filter(
          (d) => d.userAccessToken === userAccessToken
        );
        const userSleeps = sleeps.filter(
          (s) => s.userAccessToken === userAccessToken
        );
        const userHrvs = hrvSummaries.filter(
          (h) => h.userAccessToken === userAccessToken
        );

        const healthUpdates = processHealthData(userDailies, userSleeps, userHrvs);

        for (const [dateStr, update] of healthUpdates) {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);

          const [existing] = await db
            .select()
            .from(dailyMetrics)
            .where(
              and(
                eq(dailyMetrics.userId, connection.userId),
                eq(dailyMetrics.date, date)
              )
            )
            .limit(1);

          const healthFields: Record<string, number | null> = {};
          if (update.hrv !== undefined) healthFields.hrv = update.hrv;
          if (update.restingHr !== undefined) healthFields.restingHr = update.restingHr;
          if (update.sleepScore !== undefined) healthFields.sleepScore = update.sleepScore;
          if (update.bodyBattery !== undefined) healthFields.bodyBattery = update.bodyBattery;
          if (update.stressLevel !== undefined) healthFields.stressLevel = update.stressLevel;

          if (Object.keys(healthFields).length === 0) continue;

          if (existing) {
            await db
              .update(dailyMetrics)
              .set(healthFields)
              .where(eq(dailyMetrics.id, existing.id));
          } else {
            await db.insert(dailyMetrics).values({
              userId: connection.userId,
              date,
              totalTss: 0,
              cyclingTss: 0,
              runningTss: 0,
              swimmingTss: 0,
              ctl: 0,
              atl: 0,
              tsb: 0,
              ...healthFields,
            });
          }

          updated++;
        }
      });
    }

    return { status: "completed", updated };
  }
);

// ── Backfill on First Connect ───────────────────────────────────────

export const backfillGarminActivities = inngest.createFunction(
  {
    id: "backfill-garmin-activities",
    retries: 2,
    concurrency: [{ limit: 1, key: "event.data.userId" }],
  },
  { event: "garmin/backfill.requested" },
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

    const tokens = getGarminTokens(
      connection.accessTokenEncrypted,
      connection.refreshTokenEncrypted
    );

    // Fetch last 90 days of activities in 30-day chunks
    let totalImported = 0;
    const now = Math.floor(Date.now() / 1000);
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60;

    for (let chunk = 0; chunk < 3; chunk++) {
      const startTime = ninetyDaysAgo + chunk * 30 * 24 * 60 * 60;
      const endTime = Math.min(startTime + 30 * 24 * 60 * 60, now);

      const garminActivities = await step.run(
        `fetch-chunk-${chunk}`,
        async () => {
          try {
            return await fetchActivities(tokens, startTime, endTime);
          } catch {
            return [];
          }
        }
      );

      if (garminActivities.length === 0) continue;

      await step.run(`process-chunk-${chunk}`, async () => {
        for (const garminActivity of garminActivities) {
          const processed = processGarminActivity(garminActivity);
          if (!processed) continue;

          const [existing] = await db
            .select({ id: activities.id })
            .from(activities)
            .where(
              and(
                eq(activities.externalId, processed.externalId),
                eq(activities.platform, "garmin")
              )
            )
            .limit(1);

          if (existing) continue;

          // Cross-platform dedup
          const crossDupe = await findCrossPlatformDuplicate(
            userId,
            "garmin",
            processed.startedAt,
            processed.durationSeconds
          );
          if (crossDupe) continue;

          const [[profile], [apBack]] = await Promise.all([
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

          const metrics = calculateGarminMetrics(processed, profile, apBack?.restingHr);

          await db.insert(activities).values({
            userId,
            externalId: processed.externalId,
            platform: processed.platform,
            sport: processed.sport,
            name: processed.name,
            description: processed.description,
            startedAt: processed.startedAt,
            durationSeconds: processed.durationSeconds,
            movingTimeSeconds: processed.movingTimeSeconds,
            elapsedTimeSeconds: processed.elapsedTimeSeconds,
            distanceMeters: processed.distanceMeters,
            elevationGainMeters: processed.elevationGainMeters,
            averageHr: processed.averageHr,
            maxHr: processed.maxHr,
            averagePowerWatts: processed.averagePowerWatts,
            maxPowerWatts: processed.maxPowerWatts,
            averageCadence: processed.averageCadence,
            averageSpeedMps: processed.averageSpeedMps,
            poolLengthMeters: processed.poolLengthMeters,
            averageSwolf: processed.averageSwolf,
            gearId: processed.gearId,
            normalizedPower: metrics.normalizedPower,
            normalizedGradedPace: metrics.normalizedGradedPace,
            intensityFactor: metrics.intensityFactor,
            tss: metrics.tss,
            trimp: metrics.trimp,
          });

          totalImported++;
        }
      });
    }

    // Also backfill last 30 days of health data
    await step.run("backfill-health", async () => {
      try {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
        const [garminDailies, garminSleeps, garminHrvs] = await Promise.all([
          fetchDailies(tokens, thirtyDaysAgo, now),
          fetchSleep(tokens, thirtyDaysAgo, now),
          fetchHrvSummaries(tokens, thirtyDaysAgo, now),
        ]);

        const healthUpdates = processHealthData(garminDailies, garminSleeps, garminHrvs);

        for (const [dateStr, update] of healthUpdates) {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);

          const [existing] = await db
            .select()
            .from(dailyMetrics)
            .where(
              and(
                eq(dailyMetrics.userId, userId),
                eq(dailyMetrics.date, date)
              )
            )
            .limit(1);

          const healthFields: Record<string, number | null> = {};
          if (update.hrv !== undefined) healthFields.hrv = update.hrv;
          if (update.restingHr !== undefined) healthFields.restingHr = update.restingHr;
          if (update.sleepScore !== undefined) healthFields.sleepScore = update.sleepScore;
          if (update.bodyBattery !== undefined) healthFields.bodyBattery = update.bodyBattery;
          if (update.stressLevel !== undefined) healthFields.stressLevel = update.stressLevel;

          if (Object.keys(healthFields).length === 0) continue;

          if (existing) {
            await db
              .update(dailyMetrics)
              .set(healthFields)
              .where(eq(dailyMetrics.id, existing.id));
          } else {
            await db.insert(dailyMetrics).values({
              userId,
              date,
              totalTss: 0,
              cyclingTss: 0,
              runningTss: 0,
              swimmingTss: 0,
              ctl: 0,
              atl: 0,
              tsb: 0,
              ...healthFields,
            });
          }
        }
      } catch (err) {
        console.error("Garmin health backfill error:", err);
      }
    });

    await step.run("update-sync-time", async () => {
      await db
        .update(platformConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(platformConnections.id, connectionId));
    });

    return { status: "completed", totalImported };
  }
);

// ── Daily Health Cron (Fallback) ────────────────────────────────────

export const garminHealthCron = inngest.createFunction(
  { id: "garmin-health-cron", retries: 2 },
  { cron: "0 6 * * *" }, // Daily at 06:00 UTC
  async ({ step }) => {
    // Get all active Garmin connections
    const connections = await step.run("get-connections", async () => {
      return db
        .select()
        .from(platformConnections)
        .where(
          and(
            eq(platformConnections.platform, "garmin"),
            eq(platformConnections.isActive, true)
          )
        );
    });

    let updated = 0;

    for (const connection of connections) {
      if (!connection.accessTokenEncrypted || !connection.refreshTokenEncrypted) {
        continue;
      }

      await step.run(`health-${connection.userId}`, async () => {
        try {
          const tokens = getGarminTokens(
            connection.accessTokenEncrypted!,
            connection.refreshTokenEncrypted!
          );

          // Fetch yesterday's health data (covers missed webhook deliveries)
          const now = Math.floor(Date.now() / 1000);
          const yesterdayStart = now - 2 * 24 * 60 * 60; // 2 days back for safety

          const [garminDailies, garminSleeps, garminHrvs] = await Promise.all([
            fetchDailies(tokens, yesterdayStart, now),
            fetchSleep(tokens, yesterdayStart, now),
            fetchHrvSummaries(tokens, yesterdayStart, now),
          ]);

          const healthUpdates = processHealthData(
            garminDailies,
            garminSleeps,
            garminHrvs
          );

          for (const [dateStr, update] of healthUpdates) {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);

            const [existing] = await db
              .select()
              .from(dailyMetrics)
              .where(
                and(
                  eq(dailyMetrics.userId, connection.userId),
                  eq(dailyMetrics.date, date)
                )
              )
              .limit(1);

            const healthFields: Record<string, number | null> = {};
            if (update.hrv !== undefined) healthFields.hrv = update.hrv;
            if (update.restingHr !== undefined)
              healthFields.restingHr = update.restingHr;
            if (update.sleepScore !== undefined)
              healthFields.sleepScore = update.sleepScore;
            if (update.bodyBattery !== undefined)
              healthFields.bodyBattery = update.bodyBattery;
            if (update.stressLevel !== undefined)
              healthFields.stressLevel = update.stressLevel;

            if (Object.keys(healthFields).length === 0) continue;

            if (existing) {
              await db
                .update(dailyMetrics)
                .set(healthFields)
                .where(eq(dailyMetrics.id, existing.id));
            } else {
              await db.insert(dailyMetrics).values({
                userId: connection.userId,
                date,
                totalTss: 0,
                cyclingTss: 0,
                runningTss: 0,
                swimmingTss: 0,
                ctl: 0,
                atl: 0,
                tsb: 0,
                ...healthFields,
              });
            }
          }

          updated++;
        } catch (err) {
          console.error(
            `Garmin health cron error for user ${connection.userId}:`,
            err
          );
        }
      });
    }

    return { status: "completed", usersUpdated: updated };
  }
);

// ── Helpers ─────────────────────────────────────────────────────────

type SportProfileRow =
  | {
      ftp: number | null;
      thresholdPaceSPerKm: number | null;
      cssSPer100m: number | null;
      lthr: number | null;
      sportMaxHr: number | null;
    }
  | undefined;

type CalculatedMetrics = {
  normalizedPower: number | null;
  normalizedGradedPace: number | null;
  intensityFactor: number | null;
  tss: number | null;
  trimp: number | null;
};

function calculateGarminMetrics(
  processed: ReturnType<typeof processGarminActivity> & {},
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

  if (processed.sport === "cycling") {
    const ftp = profile?.ftp;

    // Use Garmin's NP/TSS when available
    if (processed.garminTss && processed.garminTss > 0) {
      result.normalizedPower = processed.garminNp;
      result.tss = processed.garminTss;
      result.intensityFactor = processed.garminIf;
    } else if (ftp && processed.averagePowerWatts) {
      result.tss = estimateTSSFromAvgPower(
        processed.averagePowerWatts,
        processed.durationSeconds,
        ftp
      );
      result.intensityFactor =
        Math.round((processed.averagePowerWatts / ftp) * 1000) / 1000;
    }
  } else if (processed.sport === "running") {
    const thresholdPace = profile?.thresholdPaceSPerKm;

    if (thresholdPace && processed.distanceMeters > 0) {
      const avgPaceSecPerKm =
        (processed.durationSeconds / processed.distanceMeters) * 1000;
      result.tss = estimateRTSSFromAvgPace(
        avgPaceSecPerKm,
        processed.durationSeconds,
        thresholdPace
      );
      result.normalizedGradedPace = Math.round(avgPaceSecPerKm * 10) / 10;
    }
  } else if (processed.sport === "swimming") {
    const css = profile?.cssSPer100m;

    if (css && processed.distanceMeters > 0) {
      const stssResult = calculateSTSS(
        processed.distanceMeters,
        processed.durationSeconds,
        css
      );
      if (stssResult) {
        result.intensityFactor = stssResult.intensityFactor;
        result.tss = stssResult.stss;
      }
    }
  }

  // HR-based TRIMP as fallback
  if (processed.averageHr && processed.maxHr) {
    const restingHr = athleteRestingHr ?? 60;
    result.trimp = calculateHrTSS(
      processed.averageHr,
      processed.durationSeconds,
      profile?.lthr ?? Math.round(processed.maxHr * 0.93),
      restingHr,
      processed.maxHr
    );

    if (!result.tss && result.trimp) {
      result.tss = result.trimp;
    }
  }

  return result;
}

async function upsertDailyMetrics(
  userId: string,
  sport: "cycling" | "running" | "swimming",
  activityDate: Date,
  tss: number
) {
  const date = new Date(activityDate);
  date.setUTCHours(0, 0, 0, 0);

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

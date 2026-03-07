/**
 * Wahoo Sync — Inngest Functions
 *
 * processWahooWebhook: handles incoming workout_summary webhook events
 * backfillWahooActivities: pages through historical workouts on first connect
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
  getValidToken,
  encryptTokens,
  fetchWorkouts,
  fetchWorkoutSummary,
  processWahooWorkout,
} from "@/lib/integrations/wahoo";
import { estimateTSSFromAvgPower } from "@/lib/engine/cycling/tss";
import { estimateRTSSFromAvgPace } from "@/lib/engine/running/rtss";
import { calculateSTSS } from "@/lib/engine/swimming/stss";
import { calculateHrTSS } from "@/lib/engine/shared/trimp";
import { updateDailyMetrics as computeDailyUpdate } from "@/lib/engine/shared/fatigue-model";
import { findCrossPlatformDuplicate } from "@/lib/engine/shared/activity-dedup";

/**
 * Process a Wahoo webhook event (workout completed).
 */
export const processWahooWebhook = inngest.createFunction(
  { id: "process-wahoo-webhook", retries: 3 },
  { event: "wahoo/webhook.received" },
  async ({ event, step }) => {
    const { wahooUserId, workoutId } = event.data;

    // Get user's Wahoo connection
    const connection = await step.run("get-connection", async () => {
      const [conn] = await db
        .select()
        .from(platformConnections)
        .where(
          and(
            eq(platformConnections.platformUserId, String(wahooUserId)),
            eq(platformConnections.platform, "wahoo"),
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

    // Fetch full workout detail
    const wahooWorkout = await step.run("fetch-workout", async () => {
      return fetchWorkoutSummary(accessToken, workoutId);
    });

    const processed = processWahooWorkout(wahooWorkout);
    if (!processed) {
      return { status: "unsupported_sport" };
    }

    // Get sport profile + athlete profile in parallel
    const [profile, athleteProfile] = await Promise.all([
      step.run("get-sport-profile", async () => {
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
      }),
      step.run("get-athlete-profile", async () => {
        const [ap] = await db
          .select({ restingHr: athleteProfiles.restingHr })
          .from(athleteProfiles)
          .where(eq(athleteProfiles.userId, connection.userId))
          .limit(1);
        return ap;
      }),
    ]);

    // Calculate metrics
    const metrics = calculateWahooMetrics(processed, profile, athleteProfile?.restingHr);

    // Store activity
    const storedActivityId = await step.run("store-activity", async () => {
      const activityData = {
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
      };

      // Upsert
      const [existing] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.externalId, processed.externalId),
            eq(activities.platform, "wahoo")
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
        // Cross-platform dedup
        const crossDupe = await findCrossPlatformDuplicate(
          connection.userId,
          "wahoo",
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

    // Update daily metrics (CTL/ATL/TSB)
    if (metrics.tss && metrics.tss > 0) {
      await step.run("update-daily-metrics", async () => {
        await upsertDailyMetrics(
          connection.userId,
          processed.sport,
          processed.startedAt,
          metrics.tss ?? 0
        );
      });
    }

    return { status: "processed", activityId: storedActivityId };
  }
);

/**
 * Backfill historical Wahoo workouts on first connect.
 */
export const backfillWahooActivities = inngest.createFunction(
  {
    id: "backfill-wahoo-activities",
    retries: 2,
    concurrency: [{ limit: 1, key: "event.data.userId" }],
  },
  { event: "wahoo/backfill.requested" },
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

    // Fetch athlete resting HR once before the loop
    const athleteProfile = await step.run("get-athlete-profile", async () => {
      const [ap] = await db
        .select({ restingHr: athleteProfiles.restingHr })
        .from(athleteProfiles)
        .where(eq(athleteProfiles.userId, userId))
        .limit(1);
      return ap;
    });

    let totalImported = 0;
    for (let page = 1; page <= 10; page++) {
      const pageWorkouts = await step.run(`fetch-page-${page}`, async () => {
        return fetchWorkouts(accessToken, page, 50);
      });

      if (pageWorkouts.length === 0) break;

      await step.run(`process-page-${page}`, async () => {
        for (const workout of pageWorkouts) {
          const processed = processWahooWorkout(workout);
          if (!processed) continue;

          // Skip duplicates
          const [existing] = await db
            .select({ id: activities.id })
            .from(activities)
            .where(
              and(
                eq(activities.externalId, processed.externalId),
                eq(activities.platform, "wahoo")
              )
            )
            .limit(1);

          if (existing) continue;

          // Cross-platform dedup
          const crossDupe = await findCrossPlatformDuplicate(
            userId,
            "wahoo",
            processed.startedAt,
            processed.durationSeconds
          );
          if (crossDupe) continue;

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

          const metrics = calculateWahooMetrics(processed, profile, athleteProfile?.restingHr);

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

      if (pageWorkouts.length < 50) break;
    }

    await step.run("update-sync-time", async () => {
      await db
        .update(platformConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(platformConnections.id, connectionId));
    });

    return { status: "completed", totalImported };
  }
);

// ── Helpers ─────────────────────────────────────────────────────────

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

function calculateWahooMetrics(
  processed: ReturnType<typeof processWahooWorkout> & {},
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

    // Use Wahoo's NP and TSS when available
    if (processed.wahooTss && processed.wahooTss > 0) {
      result.normalizedPower = processed.normalizedPower;
      result.tss = processed.wahooTss;
      if (ftp && processed.normalizedPower) {
        result.intensityFactor =
          Math.round((processed.normalizedPower / ftp) * 1000) / 1000;
      }
    } else if (ftp && processed.averagePowerWatts) {
      result.normalizedPower = processed.normalizedPower;
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

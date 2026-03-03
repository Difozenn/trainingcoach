import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  activities,
  activityStreams,
  platformConnections,
  sportProfiles,
  thresholdHistory,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivityStreams,
} from "@/lib/integrations/strava";
import { StravaRateLimitError } from "@/lib/integrations/strava/client";
import type { StravaStreamSet } from "@/lib/integrations/strava";
import { calculateNormalizedPower } from "@/lib/engine/cycling/normalized-power";
import { calculateTSS } from "@/lib/engine/cycling/tss";
import { estimateFTPFrom20Min } from "@/lib/engine/cycling/tss";
import { getEffectiveFTP, detectFTPFromActivity } from "@/lib/engine/cycling/ftp-model";

/**
 * Fetch streams for a single activity from Strava.
 * Throttled at the app level: 80 req / 15 min (leaves headroom for webhooks).
 * High retry count to survive daily rate limit resets.
 */
export const fetchSingleStream = inngest.createFunction(
  {
    id: "fetch-single-stream",
    retries: 10,
    throttle: {
      limit: 80,
      period: "15m",
      key: "event.data.platform",
    },
    concurrency: [{ limit: 5 }],
  },
  { event: "streams/fetch.single" },
  async ({ event, step, logger }) => {
    const { activityId, externalId, platform, userId } = event.data;

    logger.info("Starting stream fetch", { activityId, externalId, platform });

    // Check if streams already exist
    const existing = await step.run("check-existing", async () => {
      const [row] = await db
        .select({ activityId: activityStreams.activityId })
        .from(activityStreams)
        .where(eq(activityStreams.activityId, activityId))
        .limit(1);
      return !!row;
    });

    if (existing) {
      logger.info("Streams already exist, skipping", { activityId });
      return { status: "already_exists", activityId };
    }

    // Get platform connection + valid token
    const tokenResult = await step.run("get-token", async () => {
      const [connection] = await db
        .select()
        .from(platformConnections)
        .where(
          and(
            eq(platformConnections.userId, userId),
            eq(platformConnections.platform, platform),
            eq(platformConnections.isActive, true)
          )
        )
        .limit(1);

      if (!connection?.accessTokenEncrypted || !connection?.refreshTokenEncrypted) {
        return { status: "no_connection" as const };
      }

      const expiresAt = connection.tokenExpiresAt
        ? new Date(connection.tokenExpiresAt)
        : new Date();

      const { accessToken, refreshed, newTokens } = await getValidToken(
        connection.accessTokenEncrypted,
        connection.refreshTokenEncrypted,
        expiresAt
      );

      if (refreshed && newTokens) {
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
        logger.info("Token refreshed", { userId });
      }

      return { status: "ok" as const, accessToken };
    });

    if (tokenResult.status === "no_connection") {
      logger.warn("No active connection found", { userId, platform });
      return { status: "no_connection", activityId };
    }

    // Fetch streams from Strava (separate step for observability + retries)
    const streams = await step.run("fetch-from-strava", async () => {
      try {
        return await fetchActivityStreams(tokenResult.accessToken, Number(externalId));
      } catch (err) {
        if (err instanceof StravaRateLimitError) {
          logger.warn("Strava rate limit hit", {
            retryAfter: err.retryAfterSeconds,
            fifteenMin: err.fifteenMinUsage,
            daily: err.dailyUsage,
          });
          // Rethrow — Inngest will retry with backoff
          throw err;
        }
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("404") || msg.includes("Not Found")) {
          logger.info("Activity not found on Strava (404)", { externalId });
          return null; // Signal: skip this activity
        }
        logger.error("Strava API error", { error: msg, externalId });
        throw err;
      }
    });

    if (!streams) {
      return { status: "not_available", activityId };
    }

    const timeData = (streams as StravaStreamSet).time?.data;
    if (!timeData || timeData.length === 0) {
      logger.info("No time stream data", { activityId });
      return { status: "no_streams", activityId };
    }

    // Get activity metadata
    const activity = await step.run("get-activity", async () => {
      const [row] = await db
        .select({
          startedAt: activities.startedAt,
          sport: activities.sport,
          durationSeconds: activities.durationSeconds,
          movingTimeSeconds: activities.movingTimeSeconds,
        })
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);
      return row;
    });

    if (!activity) {
      logger.warn("Activity not found in DB", { activityId });
      return { status: "activity_gone", activityId };
    }

    // Store streams in DB
    const pointCount = await step.run("store-streams", async () => {
      const typedStreams = streams as StravaStreamSet;
      const startTime = new Date(activity.startedAt);
      const rows = timeData.map((secondOffset: number, i: number) => ({
        activityId,
        timestamp: new Date(startTime.getTime() + secondOffset * 1000),
        secondOffset,
        powerWatts: typedStreams.watts?.data?.[i] ?? null,
        heartRate: typedStreams.heartrate?.data?.[i] ?? null,
        cadenceRpm: typedStreams.cadence?.data?.[i] ?? null,
        speedMps: typedStreams.velocity_smooth?.data?.[i] ?? null,
        paceSecPerKm:
          typedStreams.velocity_smooth?.data?.[i] && typedStreams.velocity_smooth.data[i] > 0
            ? Math.round((1000 / typedStreams.velocity_smooth.data[i]) * 10) / 10
            : null,
        altitudeMeters: typedStreams.altitude?.data?.[i] ?? null,
        distanceMeters: typedStreams.distance?.data?.[i] ?? null,
        latitudeDeg: typedStreams.latlng?.data?.[i]?.[0] ?? null,
        longitudeDeg: typedStreams.latlng?.data?.[i]?.[1] ?? null,
        gradePercent: typedStreams.grade_smooth?.data?.[i] ?? null,
        strokeCount: null,
        swolf: null,
      }));

      for (let i = 0; i < rows.length; i += 1000) {
        await db.insert(activityStreams).values(rows.slice(i, i + 1000));
      }

      return rows.length;
    });

    // Recalculate cycling metrics from real stream data
    const metricsUpdate = await step.run("recalculate-metrics", async () => {
      const typedStreams = streams as StravaStreamSet;
      if (activity.sport !== "cycling" || !typedStreams.watts?.data?.length) {
        return null;
      }

      const powerStream = typedStreams.watts.data;
      const np = calculateNormalizedPower(powerStream);

      const [lastThreshold] = await db
        .select({ value: thresholdHistory.value, detectedAt: thresholdHistory.detectedAt })
        .from(thresholdHistory)
        .where(
          and(
            eq(thresholdHistory.userId, userId),
            eq(thresholdHistory.sport, "cycling"),
            eq(thresholdHistory.metricName, "ftp")
          )
        )
        .orderBy(desc(thresholdHistory.detectedAt))
        .limit(1);

      const activityDate = new Date(activity.startedAt);
      const effectiveFtp = lastThreshold
        ? getEffectiveFTP(lastThreshold.value, lastThreshold.detectedAt, activityDate)
        : 0;

      const ftpFrom20 = estimateFTPFrom20Min(powerStream);
      let ftpForTss = effectiveFtp;

      if (ftpFrom20 && ftpFrom20 > effectiveFtp) {
        await db.insert(thresholdHistory).values({
          userId,
          sport: "cycling",
          metricName: "ftp",
          value: ftpFrom20,
          source: "auto_detect",
          activityId: externalId,
          detectedAt: activityDate,
        });
        ftpForTss = ftpFrom20;

        await db
          .update(sportProfiles)
          .set({ ftp: ftpFrom20, updatedAt: new Date() })
          .where(
            and(
              eq(sportProfiles.userId, userId),
              eq(sportProfiles.sport, "cycling")
            )
          );

        logger.info("FTP breakthrough detected", {
          activityId,
          oldFtp: effectiveFtp,
          newFtp: ftpFrom20,
        });
      }

      if (np && ftpForTss > 0) {
        const tssResult = calculateTSS(powerStream, ftpForTss);
        return {
          normalizedPower: np,
          intensityFactor: tssResult?.intensityFactor ?? null,
          tss: tssResult?.tss ?? null,
          ftpUsed: ftpForTss,
        };
      } else if (np) {
        return { normalizedPower: np };
      }

      return null;
    });

    if (metricsUpdate && Object.keys(metricsUpdate).length > 0) {
      await step.run("update-activity", async () => {
        await db
          .update(activities)
          .set(metricsUpdate)
          .where(eq(activities.id, activityId));
      });
    }

    logger.info("Stream fetch complete", { activityId, points: pointCount });
    return { status: "fetched", activityId, points: pointCount };
  }
);

/**
 * Dispatcher: find all activities missing streams and enqueue fetch events.
 * Can be triggered per-user (after connect) or globally (backfill).
 */
export const backfillStreams = inngest.createFunction(
  {
    id: "backfill-streams",
    retries: 1,
    concurrency: [{ limit: 1, key: "event.data.userId" }],
  },
  { event: "streams/backfill.requested" },
  async ({ event, step, logger }) => {
    const { userId, platform } = event.data;

    // Find all activities without streams
    const missing = await step.run("find-missing", async () => {
      const result = await db.execute<{ id: string; external_id: string }>(sql`
        SELECT a.id, a.external_id
        FROM activities a
        WHERE a.user_id = ${userId}
          AND a.platform = ${platform}
          AND a.external_id IS NOT NULL
          AND a.id NOT IN (SELECT DISTINCT activity_id FROM activity_streams)
        ORDER BY a.started_at ASC
      `);

      return result.map((r) => ({ id: r.id, externalId: r.external_id }));
    });

    logger.info("Backfill: found missing activities", {
      userId,
      platform,
      count: missing.length,
    });

    if (missing.length === 0) {
      return { status: "nothing_to_do" };
    }

    // Enqueue fetch events in batches
    const BATCH_SIZE = 100;
    let enqueued = 0;

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);

      await step.run(`enqueue-batch-${i}`, async () => {
        const events = batch.map((a) => ({
          name: "streams/fetch.single" as const,
          data: {
            activityId: a.id,
            externalId: a.externalId!,
            platform,
            userId,
          },
        }));
        await inngest.send(events);
      });

      enqueued += batch.length;
      logger.info(`Enqueued batch ${i / BATCH_SIZE + 1}`, {
        batchSize: batch.length,
        totalEnqueued: enqueued,
      });
    }

    return { status: "enqueued", total: missing.length, enqueued };
  }
);

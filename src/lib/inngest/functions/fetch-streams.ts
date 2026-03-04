import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  activities,
  platformConnections,
  sportProfiles,
  thresholdHistory,
} from "@/lib/db/schema";
import type { StreamDataBlob } from "@/lib/db/schema/activities";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivityStreams,
} from "@/lib/integrations/strava";
import { StravaRateLimitError } from "@/lib/integrations/strava/client";
import type { StravaStreamSet } from "@/lib/integrations/strava";
import { calculateNormalizedPower } from "@/lib/engine/cycling/normalized-power";
import { calculateTSS, estimateFTPFrom20MinWithHR } from "@/lib/engine/cycling/tss";
import { calculatePeakPowers } from "@/lib/engine/cycling/power-profile";

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

    // Check if streams already exist (streamData column is not null)
    const existing = await step.run("check-existing", async () => {
      const [row] = await db
        .select({ streamData: activities.streamData })
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);
      return !!row?.streamData;
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

    // Fetch streams from Strava
    const streams = await step.run("fetch-from-strava", async () => {
      try {
        return await fetchActivityStreams(tokenResult.accessToken, Number(externalId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("404") || msg.includes("Not Found")) {
          logger.info("Activity not found on Strava (404)", { externalId });
          return null;
        }
        throw err; // Middleware classifies DB/API/auth errors
      }
    });

    if (!streams) {
      return { status: "not_available", activityId };
    }

    const typedStreams = streams as StravaStreamSet;
    const timeData = typedStreams.time?.data;
    if (!timeData || timeData.length === 0) {
      logger.info("No time stream data", { activityId });
      return { status: "no_streams", activityId };
    }

    // Build JSONB blob from Strava response
    const streamBlob: StreamDataBlob = { time: timeData };
    if (typedStreams.watts?.data) streamBlob.watts = typedStreams.watts.data;
    if (typedStreams.heartrate?.data) streamBlob.heartrate = typedStreams.heartrate.data;
    if (typedStreams.cadence?.data) streamBlob.cadence = typedStreams.cadence.data;
    if (typedStreams.velocity_smooth?.data) streamBlob.velocity_smooth = typedStreams.velocity_smooth.data;
    if (typedStreams.altitude?.data) streamBlob.altitude = typedStreams.altitude.data;
    if (typedStreams.distance?.data) streamBlob.distance = typedStreams.distance.data;
    if (typedStreams.latlng?.data) streamBlob.latlng = typedStreams.latlng.data;
    if (typedStreams.grade_smooth?.data) streamBlob.grade_smooth = typedStreams.grade_smooth.data;

    // Get activity metadata
    const activity = await step.run("get-activity", async () => {
      const [row] = await db
        .select({
          startedAt: activities.startedAt,
          sport: activities.sport,
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

    // Store stream blob + recalculate cycling metrics (stable FTP — no decay)
    const metricsUpdate = await step.run("store-and-calculate", async () => {
      const update: Record<string, unknown> = { streamData: streamBlob };

        if (activity.sport === "cycling" && streamBlob.watts?.length) {
          const powerStream = streamBlob.watts;
          const np = calculateNormalizedPower(powerStream);

          // Get current stable FTP from sport profile
          const [profile] = await db
            .select({ ftp: sportProfiles.ftp })
            .from(sportProfiles)
            .where(
              and(
                eq(sportProfiles.userId, userId),
                eq(sportProfiles.sport, "cycling")
              )
            )
            .limit(1);

          let currentFtp = profile?.ftp ?? 0;

          // Check for FTP breakthrough from best 20-min power (HR-adjusted)
          const [athleteProfile] = await db
            .select({ maxHr: sql<number | null>`(SELECT max_hr FROM athlete_profiles WHERE user_id = ${userId})` })
            .from(sportProfiles)
            .where(and(eq(sportProfiles.userId, userId), eq(sportProfiles.sport, "cycling")))
            .limit(1);
          const hrResult = estimateFTPFrom20MinWithHR(
            powerStream,
            streamBlob.heartrate,
            athleteProfile?.maxHr,
          );
          const ftpFrom20 = hrResult?.ftpHrAdjusted ?? hrResult?.ftp ?? null;
          if (ftpFrom20 && ftpFrom20 > currentFtp) {
            await db.insert(thresholdHistory).values({
              userId,
              sport: "cycling",
              metricName: "ftp",
              value: ftpFrom20,
              source: "auto_detect",
              activityId: externalId,
              detectedAt: new Date(activity.startedAt),
            });

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
              oldFtp: currentFtp,
              newFtp: ftpFrom20,
            });
            currentFtp = ftpFrom20;
          }

          if (np && currentFtp > 0) {
            const tssResult = calculateTSS(powerStream, currentFtp);
            Object.assign(update, {
              normalizedPower: np,
              intensityFactor: tssResult?.intensityFactor ?? null,
              tss: tssResult?.tss ?? null,
              ftpUsed: currentFtp,
            });
          } else if (np) {
            update.normalizedPower = np;
          }

          // Calculate peak powers (MMP) at standard durations
          const peaks = calculatePeakPowers(powerStream);
          if (peaks.peak5s != null) update.peak5s = peaks.peak5s;
          if (peaks.peak15s != null) update.peak15s = peaks.peak15s;
          if (peaks.peak30s != null) update.peak30s = peaks.peak30s;
          if (peaks.peak1m != null) update.peak1m = peaks.peak1m;
          if (peaks.peak5m != null) update.peak5m = peaks.peak5m;
          if (peaks.peak10m != null) update.peak10m = peaks.peak10m;
          if (peaks.peak20m != null) update.peak20m = peaks.peak20m;
          if (peaks.peak60m != null) update.peak60m = peaks.peak60m;
        }

        await db.update(activities).set(update).where(eq(activities.id, activityId));
        return Object.keys(update);
    });

    // After storing peak powers, recalculate rolling 90-day FTP
    // This allows FTP to naturally decrease as old peaks expire
    if (activity.sport === "cycling") {
      await step.run("update-rolling-ftp", async () => {
        const [best] = await db
          .select({ maxPeak: sql<number>`MAX(${activities.peak20m})` })
          .from(activities)
          .where(
            and(
              eq(activities.userId, userId),
              eq(activities.sport, "cycling"),
              sql`${activities.peak20m} IS NOT NULL`,
              sql`${activities.startedAt} > NOW() - INTERVAL '90 days'`
            )
          );

        if (!best?.maxPeak) return;

        const rollingFtp = Math.round(best.maxPeak * 0.95);
        const [profile] = await db
          .select({ ftp: sportProfiles.ftp })
          .from(sportProfiles)
          .where(
            and(
              eq(sportProfiles.userId, userId),
              eq(sportProfiles.sport, "cycling")
            )
          )
          .limit(1);

        if (profile && profile.ftp !== rollingFtp) {
          await db
            .update(sportProfiles)
            .set({ ftp: rollingFtp, updatedAt: new Date() })
            .where(
              and(
                eq(sportProfiles.userId, userId),
                eq(sportProfiles.sport, "cycling")
              )
            );
          logger.info("Rolling FTP updated", {
            oldFtp: profile.ftp,
            newFtp: rollingFtp,
            bestPeak20m: best.maxPeak,
          });
        }
      });
    }

    logger.info("Stream fetch complete", {
      activityId,
      points: timeData.length,
      updatedFields: metricsUpdate,
    });
    return { status: "fetched", activityId, points: timeData.length };
  }
);

/**
 * Dispatcher: find all activities missing streams and enqueue fetch events.
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

    const missing = await step.run("find-missing", async () => {
      const result = await db
        .select({ id: activities.id, externalId: activities.externalId })
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            eq(activities.platform, platform),
            isNull(activities.streamData)
          )
        )
        .orderBy(activities.startedAt);

      return result
        .filter((r) => r.externalId)
        .map((r) => ({ id: r.id, externalId: r.externalId! }));
    });

    logger.info("Backfill: found missing activities", {
      userId,
      platform,
      count: missing.length,
    });

    if (missing.length === 0) {
      return { status: "nothing_to_do" };
    }

    const BATCH_SIZE = 100;
    let enqueued = 0;

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);

      await step.run(`enqueue-batch-${i}`, async () => {
        const events = batch.map((a) => ({
          name: "streams/fetch.single" as const,
          data: {
            activityId: a.id,
            externalId: a.externalId,
            platform,
            userId,
          },
        }));
        await inngest.send(events);
      });

      enqueued += batch.length;
      logger.info(`Enqueued batch ${Math.floor(i / BATCH_SIZE) + 1}`, {
        batchSize: batch.length,
        totalEnqueued: enqueued,
      });
    }

    return { status: "enqueued", total: missing.length, enqueued };
  }
);

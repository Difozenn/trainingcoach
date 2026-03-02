import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  activities,
  activityStreams,
  platformConnections,
  sportProfiles,
  thresholdHistory,
} from "@/lib/db/schema";
import { eq, and, isNull, notInArray, sql, desc } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivityStreams,
} from "@/lib/integrations/strava";
import type { StravaStreamSet } from "@/lib/integrations/strava";
import { calculateNormalizedPower } from "@/lib/engine/cycling/normalized-power";
import { calculateTSS } from "@/lib/engine/cycling/tss";
import { estimateFTPFrom20Min } from "@/lib/engine/cycling/tss";
import { getEffectiveFTP, detectFTPFromActivity } from "@/lib/engine/cycling/ftp-model";

/**
 * Fetch streams for a single activity from Strava.
 * Rate-limited at the app level: 80 req / 15 min (leaves headroom for webhooks).
 */
export const fetchSingleStream = inngest.createFunction(
  {
    id: "fetch-single-stream",
    retries: 3,
    rateLimit: {
      limit: 80,
      period: "15m",
      key: "event.data.platform",
    },
    concurrency: [{ limit: 5 }],
  },
  { event: "streams/fetch.single" },
  async ({ event }) => {
    const { activityId, externalId, platform, userId } = event.data;

    // Check if streams already exist
    const [existing] = await db
      .select({ activityId: activityStreams.activityId })
      .from(activityStreams)
      .where(eq(activityStreams.activityId, activityId))
      .limit(1);

    if (existing) return { status: "already_exists", activityId };

    // Get platform connection
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
      return { status: "no_connection", activityId };
    }

    // Get valid token
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
    }

    // Fetch streams from Strava
    let streams: StravaStreamSet;
    try {
      streams = await fetchActivityStreams(accessToken, Number(externalId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("404") || msg.includes("Not Found")) {
        return { status: "not_available", activityId };
      }
      throw err; // Let Inngest retry on transient errors
    }

    const timeData = streams.time?.data;
    if (!timeData || timeData.length === 0) {
      return { status: "no_streams", activityId };
    }

    // Get activity start time
    const [activity] = await db
      .select({
        startedAt: activities.startedAt,
        sport: activities.sport,
        durationSeconds: activities.durationSeconds,
        movingTimeSeconds: activities.movingTimeSeconds,
      })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activity) return { status: "activity_gone", activityId };

    // Store streams in batches
    const startTime = activity.startedAt;
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

    for (let i = 0; i < rows.length; i += 1000) {
      await db.insert(activityStreams).values(rows.slice(i, i + 1000));
    }

    // Recalculate metrics from real stream data
    let metricsUpdate: Record<string, number | null> = {};

    if (activity.sport === "cycling" && streams.watts?.data?.length) {
      const powerStream = streams.watts.data;

      // Real NP from stream
      const np = calculateNormalizedPower(powerStream);

      // Get current FTP for this activity's date
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

      const effectiveFtp = lastThreshold
        ? getEffectiveFTP(lastThreshold.value, lastThreshold.detectedAt, activity.startedAt)
        : 0;

      // FTP detection from 20-min best power (the proper way)
      const ftpFrom20 = estimateFTPFrom20Min(powerStream);
      let ftpForTss = effectiveFtp;

      if (ftpFrom20 && ftpFrom20 > effectiveFtp) {
        // Breakthrough — record it
        await db.insert(thresholdHistory).values({
          userId,
          sport: "cycling",
          metricName: "ftp",
          value: ftpFrom20,
          source: "auto_detect",
          activityId: externalId,
          detectedAt: activity.startedAt,
        });
        ftpForTss = ftpFrom20;

        // Update sport profile to latest
        await db
          .update(sportProfiles)
          .set({ ftp: ftpFrom20, updatedAt: new Date() })
          .where(
            and(
              eq(sportProfiles.userId, userId),
              eq(sportProfiles.sport, "cycling")
            )
          );
      }

      if (np && ftpForTss > 0) {
        const tssResult = calculateTSS(powerStream, ftpForTss);
        metricsUpdate = {
          normalizedPower: np,
          intensityFactor: tssResult?.intensityFactor ?? null,
          tss: tssResult?.tss ?? null,
          ftpUsed: ftpForTss,
        };
      } else if (np) {
        metricsUpdate = { normalizedPower: np };
      }
    }

    // Update activity with recalculated metrics
    if (Object.keys(metricsUpdate).length > 0) {
      await db
        .update(activities)
        .set(metricsUpdate)
        .where(eq(activities.id, activityId));
    }

    return { status: "fetched", activityId, points: rows.length };
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
  async ({ event, step }) => {
    const { userId, platform } = event.data;

    // Find all activities without streams
    const missing = await step.run("find-missing", async () => {
      const activitiesWithStreams = db
        .select({ activityId: activityStreams.activityId })
        .from(activityStreams);

      const result = await db
        .select({
          id: activities.id,
          externalId: activities.externalId,
        })
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            eq(activities.platform, platform),
            sql`${activities.externalId} IS NOT NULL`,
            sql`${activities.id} NOT IN (SELECT DISTINCT activity_id FROM activity_streams)`
          )
        )
        .orderBy(activities.startedAt);

      return result;
    });

    if (missing.length === 0) {
      return { status: "nothing_to_do" };
    }

    // Enqueue fetch events in batches to avoid overwhelming Inngest
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
    }

    return { status: "enqueued", total: missing.length, enqueued };
  }
);

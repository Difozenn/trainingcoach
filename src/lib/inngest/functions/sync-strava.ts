import { inngest } from "../client";
import { db } from "@/lib/db";
import { platformConnections, activities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivityDetail,
  fetchActivityStreams,
  processStravaActivity,
} from "@/lib/integrations/strava";

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
        return getValidToken(
          connection.accessTokenEncrypted!,
          connection.refreshTokenEncrypted!,
          connection.tokenExpiresAt instanceof Date
            ? connection.tokenExpiresAt
            : new Date(connection.tokenExpiresAt ?? Date.now())
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

    await step.run("store-activity", async () => {
      const activityData = {
        ...processed,
        userId: connection.userId,
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
      } else {
        await db.insert(activities).values(activityData);
      }
    });

    // Fetch streams for detailed analysis
    await step.run("fetch-streams", async () => {
      try {
        await fetchActivityStreams(accessToken, objectId);
        // TODO: Store streams and calculate sport-specific metrics
        // (NP/TSS for cycling, NGP/rTSS for running, CSS/sTSS for swimming)
      } catch {
        // Streams may not be available for all activities
        console.warn(`No streams available for activity ${objectId}`);
      }
    });

    return { status: "processed", activityId: objectId };
  }
);

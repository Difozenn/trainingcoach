/**
 * Cross-platform activity deduplication.
 *
 * When a user connects both Strava and Garmin, the same ride can arrive
 * from both platforms with different external IDs. We detect duplicates by
 * matching on start time (±5 min) and duration (±20%) for the same user.
 * First one in wins — the duplicate is silently skipped.
 */

import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { and, eq, gte, lte, ne } from "drizzle-orm";

/**
 * Check if an activity from a different platform already exists
 * with a similar start time and duration.
 *
 * Returns the existing activity ID if a duplicate is found, null otherwise.
 */
export async function findCrossPlatformDuplicate(
  userId: string,
  platform: "strava" | "garmin" | "wahoo",
  startedAt: Date,
  durationSeconds: number
): Promise<string | null> {
  const WINDOW_MS = 5 * 60 * 1000; // ±5 minutes
  const DURATION_TOLERANCE = 0.2; // ±20%

  const minStart = new Date(startedAt.getTime() - WINDOW_MS);
  const maxStart = new Date(startedAt.getTime() + WINDOW_MS);
  const minDuration = Math.floor(durationSeconds * (1 - DURATION_TOLERANCE));
  const maxDuration = Math.ceil(durationSeconds * (1 + DURATION_TOLERANCE));

  const [match] = await db
    .select({ id: activities.id, platform: activities.platform })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        ne(activities.platform, platform),
        gte(activities.startedAt, minStart),
        lte(activities.startedAt, maxStart),
        gte(activities.durationSeconds, minDuration),
        lte(activities.durationSeconds, maxDuration)
      )
    )
    .limit(1);

  return match?.id ?? null;
}

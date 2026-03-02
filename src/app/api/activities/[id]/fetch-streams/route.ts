import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  activities,
  activityStreams,
  platformConnections,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivityStreams,
} from "@/lib/integrations/strava";
import type { StravaStreamSet } from "@/lib/integrations/strava";

/**
 * Lazy-fetch activity streams from Strava.
 * Called when viewing an activity that was backfilled without stream data.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // 1. Get the activity — verify ownership + Strava origin
  const [activity] = await db
    .select({
      id: activities.id,
      externalId: activities.externalId,
      platform: activities.platform,
      startedAt: activities.startedAt,
    })
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, userId)))
    .limit(1);

  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  if (activity.platform !== "strava" || !activity.externalId) {
    return NextResponse.json(
      { error: "Only Strava activities support stream fetching" },
      { status: 400 }
    );
  }

  // 2. Check if streams already exist
  const [existing] = await db
    .select({ activityId: activityStreams.activityId })
    .from(activityStreams)
    .where(eq(activityStreams.activityId, id))
    .limit(1);

  if (existing) {
    return NextResponse.json({ status: "already_exists" });
  }

  // 3. Get user's Strava connection with tokens
  const [connection] = await db
    .select()
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.userId, userId),
        eq(platformConnections.platform, "strava"),
        eq(platformConnections.isActive, true)
      )
    )
    .limit(1);

  if (!connection?.accessTokenEncrypted || !connection?.refreshTokenEncrypted) {
    return NextResponse.json(
      { error: "No active Strava connection" },
      { status: 400 }
    );
  }

  // 4. Get valid token (refresh if expired)
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

  // 5. Fetch streams from Strava
  let streams: StravaStreamSet;
  try {
    streams = await fetchActivityStreams(
      accessToken,
      Number(activity.externalId)
    );
  } catch (err) {
    console.error("Failed to fetch streams from Strava:", err);
    return NextResponse.json(
      { error: "Failed to fetch streams from Strava" },
      { status: 502 }
    );
  }

  // 6. Store streams
  const timeData = streams.time?.data;
  if (!timeData || timeData.length === 0) {
    return NextResponse.json({ status: "no_streams_available" });
  }

  const startTime = activity.startedAt;
  const rows = timeData.map((secondOffset, i) => ({
    activityId: activity.id,
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

  return NextResponse.json({
    status: "fetched",
    points: rows.length,
  });
}

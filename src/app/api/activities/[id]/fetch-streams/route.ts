import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  activities,
  platformConnections,
} from "@/lib/db/schema";
import type { StreamDataBlob } from "@/lib/db/schema/activities";
import { eq, and } from "drizzle-orm";
import {
  getValidToken,
  encryptTokens,
  fetchActivityStreams,
} from "@/lib/integrations/strava";

/**
 * Lazy-fetch activity streams from Strava.
 * Called when viewing an activity that doesn't have stream data yet.
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
      streamData: activities.streamData,
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
  if (activity.streamData) {
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
  let streams;
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

  // 6. Store as JSONB blob
  const timeData = streams.time?.data;
  if (!timeData || timeData.length === 0) {
    return NextResponse.json({ status: "no_streams_available" });
  }

  const blob: StreamDataBlob = { time: timeData };
  if (streams.watts?.data) blob.watts = streams.watts.data;
  if (streams.heartrate?.data) blob.heartrate = streams.heartrate.data;
  if (streams.cadence?.data) blob.cadence = streams.cadence.data;
  if (streams.velocity_smooth?.data) blob.velocity_smooth = streams.velocity_smooth.data;
  if (streams.altitude?.data) blob.altitude = streams.altitude.data;
  if (streams.distance?.data) blob.distance = streams.distance.data;
  if (streams.latlng?.data) blob.latlng = streams.latlng.data;
  if (streams.grade_smooth?.data) blob.grade_smooth = streams.grade_smooth.data;

  await db
    .update(activities)
    .set({ streamData: blob })
    .where(eq(activities.id, id));

  return NextResponse.json({
    status: "fetched",
    points: timeData.length,
  });
}

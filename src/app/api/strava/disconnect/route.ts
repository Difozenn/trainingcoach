import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { platformConnections } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Disconnect Strava — deactivate the connection.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(platformConnections)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(platformConnections.userId, session.user.id),
        eq(platformConnections.platform, "strava")
      )
    );

  return NextResponse.redirect(new URL("/settings", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

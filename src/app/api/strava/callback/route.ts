import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections } from "@/lib/db/schema";
import { exchangeCode, encryptTokens } from "@/lib/integrations/strava/client";
import { and, eq } from "drizzle-orm";

/**
 * Strava OAuth callback — exchange code for tokens and store encrypted.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=strava_denied`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCode(code);
    const encrypted = encryptTokens(tokens);

    // Get athlete info from Strava
    const athleteRes = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    const athlete = await athleteRes.json();

    // Deactivate any existing Strava connection
    await db
      .update(platformConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(platformConnections.userId, state),
          eq(platformConnections.platform, "strava")
        )
      );

    // Create new connection
    await db.insert(platformConnections).values({
      userId: state,
      platform: "strava",
      platformUserId: String(athlete.id),
      accessTokenEncrypted: encrypted.accessTokenEncrypted,
      refreshTokenEncrypted: encrypted.refreshTokenEncrypted,
      tokenExpiresAt: encrypted.tokenExpiresAt,
      scopes: "read,activity:read_all,profile:read_all",
      isActive: true,
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?connected=strava`
    );
  } catch (err) {
    console.error("Strava OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=strava_failed`
    );
  }
}

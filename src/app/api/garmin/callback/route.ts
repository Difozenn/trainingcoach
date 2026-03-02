import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { platformConnections } from "@/lib/db/schema";
import { exchangeVerifier, encryptTokens } from "@/lib/integrations/garmin/client";
import { decrypt } from "@/lib/security/encryption";
import { and, eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

/**
 * Garmin OAuth 1.0a Step 3:
 * Exchange the verifier for permanent access tokens.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthToken = url.searchParams.get("oauth_token");
  const oauthVerifier = url.searchParams.get("oauth_verifier");

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=garmin_denied`
    );
  }

  // Retrieve encrypted cookie with request token secret + userId
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("garmin_oauth")?.value;
  if (!cookieValue) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=garmin_expired`
    );
  }

  try {
    const { secret: oauthTokenSecret, userId } = JSON.parse(
      decrypt(cookieValue)
    ) as { secret: string; userId: string };

    // Exchange verifier for permanent access tokens
    const tokens = await exchangeVerifier(
      oauthToken,
      oauthTokenSecret,
      oauthVerifier
    );
    const encrypted = encryptTokens(tokens);

    // Deactivate any existing Garmin connection
    await db
      .update(platformConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(platformConnections.userId, userId),
          eq(platformConnections.platform, "garmin")
        )
      );

    // Create new connection
    // platformUserId = oauth access token (Garmin's user identifier in webhooks)
    const [newConn] = await db
      .insert(platformConnections)
      .values({
        userId,
        platform: "garmin",
        platformUserId: tokens.accessToken, // Garmin uses access token as user identifier
        accessTokenEncrypted: encrypted.accessTokenEncrypted,
        refreshTokenEncrypted: encrypted.refreshTokenEncrypted, // stores accessTokenSecret
        tokenExpiresAt: encrypted.tokenExpiresAt, // null for permanent tokens
        scopes: "activities,dailies,sleep,stress,hrv",
        isActive: true,
      })
      .returning({ id: platformConnections.id });

    // Clear the OAuth cookie
    cookieStore.delete("garmin_oauth");

    // Trigger historical backfill
    await inngest.send({
      name: "garmin/backfill.requested",
      data: { userId, connectionId: newConn.id },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?connected=garmin`
    );
  } catch (err) {
    console.error("Garmin OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=garmin_failed`
    );
  }
}

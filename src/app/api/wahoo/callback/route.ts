import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections } from "@/lib/db/schema";
import { exchangeCode, encryptTokens, wahooFetch } from "@/lib/integrations/wahoo/client";
import type { WahooUser } from "@/lib/integrations/wahoo/types";
import { and, eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=wahoo_denied`
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const encrypted = encryptTokens(tokens);

    // Get Wahoo user ID
    const wahooUser = await wahooFetch<{ user: WahooUser }>(
      tokens.accessToken,
      "/v1/user"
    );

    // Deactivate any existing Wahoo connection
    await db
      .update(platformConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(platformConnections.userId, state),
          eq(platformConnections.platform, "wahoo")
        )
      );

    // Create new connection
    const [newConn] = await db
      .insert(platformConnections)
      .values({
        userId: state,
        platform: "wahoo",
        platformUserId: String(wahooUser.user.id),
        accessTokenEncrypted: encrypted.accessTokenEncrypted,
        refreshTokenEncrypted: encrypted.refreshTokenEncrypted,
        tokenExpiresAt: encrypted.tokenExpiresAt,
        scopes: "user_read workouts_read power_zones_read offline_data",
        isActive: true,
      })
      .returning({ id: platformConnections.id });

    // Trigger historical backfill
    await inngest.send({
      name: "wahoo/backfill.requested",
      data: { userId: state, connectionId: newConn.id },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?connected=wahoo`
    );
  } catch (err) {
    console.error("Wahoo OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=wahoo_failed`
    );
  }
}

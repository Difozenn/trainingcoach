import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getRequestToken, buildAuthorizeUrl } from "@/lib/integrations/garmin/client";
import { encrypt } from "@/lib/security/encryption";

/**
 * Garmin OAuth 1.0a Step 1:
 * Get a request token, store the secret in an encrypted cookie,
 * then redirect the user to Garmin's authorization page.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { oauthToken, oauthTokenSecret } = await getRequestToken();

    // Store request token secret + userId in encrypted cookie (10min TTL)
    const cookieValue = encrypt(
      JSON.stringify({
        secret: oauthTokenSecret,
        userId: session.user.id,
      })
    );

    const cookieStore = await cookies();
    cookieStore.set("garmin_oauth", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/api/garmin/callback",
    });

    return NextResponse.redirect(buildAuthorizeUrl(oauthToken));
  } catch (err) {
    console.error("Garmin connect error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=garmin_failed`
    );
  }
}

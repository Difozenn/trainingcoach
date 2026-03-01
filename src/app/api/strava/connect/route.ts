import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Redirect user to Strava OAuth authorization page.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`,
    response_type: "code",
    scope: "read,activity:read_all,profile:read_all",
    state: session.user.id,
  });

  return NextResponse.redirect(
    `https://www.strava.com/oauth/authorize?${params}`
  );
}

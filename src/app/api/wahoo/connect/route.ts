import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: process.env.WAHOO_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/wahoo/callback`,
    response_type: "code",
    scope: "user_read workouts_read power_zones_read offline_data",
    state: session.user.id,
  });

  return NextResponse.redirect(
    `https://api.wahooligan.com/oauth/authorize?${params}`
  );
}

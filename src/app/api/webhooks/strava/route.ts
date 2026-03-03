import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { platformConnections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { StravaWebhookEvent } from "@/lib/integrations/strava/types";

/**
 * Strava Webhook — GET for verification, POST for events.
 *
 * Strava sends a GET request to verify the webhook subscription,
 * and POST requests for activity create/update/delete events.
 */

// Webhook verification (subscription setup)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
  ) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Webhook event handler
export async function POST(request: Request) {
  try {
    const event: StravaWebhookEvent = await request.json();

    // Only process activity events
    if (event.object_type !== "activity") {
      return NextResponse.json({ received: true });
    }

    // Validate owner_id belongs to a known user before dispatching
    const [connection] = await db
      .select({ id: platformConnections.id })
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.platformUserId, String(event.owner_id)),
          eq(platformConnections.platform, "strava"),
          eq(platformConnections.isActive, true)
        )
      )
      .limit(1);

    if (!connection) {
      return NextResponse.json({ received: true }); // Silently ignore unknown owners
    }

    // Send to Inngest for async processing
    await inngest.send({
      name: "strava/webhook.received",
      data: {
        objectType: event.object_type,
        objectId: event.object_id,
        aspectType: event.aspect_type,
        ownerId: event.owner_id,
        eventTime: event.event_time,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Strava webhook error:", error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

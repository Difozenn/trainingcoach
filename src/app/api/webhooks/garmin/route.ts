import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { inngest } from "@/lib/inngest/client";
import type { GarminWebhookPayload } from "@/lib/integrations/garmin/types";

/**
 * Garmin Webhook Endpoint
 *
 * Receives push data for activities + health metrics.
 * Verifies HMAC-SHA256 signature before processing.
 */
export async function POST(request: Request) {
  const body = await request.text();

  // Verify signature
  const signature = request.headers.get("x-garmin-signature");
  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    const payload: GarminWebhookPayload = JSON.parse(body);

    // Process activities
    if (payload.activities && payload.activities.length > 0) {
      await inngest.send({
        name: "garmin/webhook.activities",
        data: { activities: payload.activities },
      });
    }

    // Process activity details (includes samples/streams)
    if (payload.activityDetails && payload.activityDetails.length > 0) {
      await inngest.send({
        name: "garmin/webhook.activities",
        data: {
          activities: payload.activityDetails.map((d) => d.summary),
        },
      });
    }

    // Process health data (dailies, sleep, HRV)
    const hasHealth =
      (payload.dailies && payload.dailies.length > 0) ||
      (payload.sleeps && payload.sleeps.length > 0) ||
      (payload.hrvs && payload.hrvs.length > 0);

    if (hasHealth) {
      await inngest.send({
        name: "garmin/webhook.health",
        data: {
          dailies: payload.dailies ?? [],
          sleeps: payload.sleeps ?? [],
          hrvSummaries: payload.hrvs ?? [],
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Garmin webhook error:", error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.GARMIN_CONSUMER_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(body).digest("base64");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expected, "base64")
    );
  } catch {
    return false;
  }
}

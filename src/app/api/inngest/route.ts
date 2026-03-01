import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processStravaWebhook } from "@/lib/inngest/functions/sync-strava";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processStravaWebhook],
});

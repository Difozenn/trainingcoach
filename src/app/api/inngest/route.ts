import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processStravaWebhook,
  backfillStravaActivities,
} from "@/lib/inngest/functions/sync-strava";
import { generateWeeklyPlans } from "@/lib/inngest/functions/weekly-plan-cron";
import { sendWeeklySummary } from "@/lib/inngest/functions/email-cron";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processStravaWebhook,
    backfillStravaActivities,
    generateWeeklyPlans,
    sendWeeklySummary,
  ],
});

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processStravaWebhook,
  backfillStravaActivities,
} from "@/lib/inngest/functions/sync-strava";
import {
  processWahooWebhook,
  backfillWahooActivities,
} from "@/lib/inngest/functions/sync-wahoo";
import {
  processGarminWebhook,
  processGarminHealth,
  backfillGarminActivities,
  garminHealthCron,
} from "@/lib/inngest/functions/sync-garmin";
import { generateWeeklyPlans } from "@/lib/inngest/functions/weekly-plan-cron";
import { sendWeeklySummary } from "@/lib/inngest/functions/email-cron";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processStravaWebhook,
    backfillStravaActivities,
    processWahooWebhook,
    backfillWahooActivities,
    processGarminWebhook,
    processGarminHealth,
    backfillGarminActivities,
    garminHealthCron,
    generateWeeklyPlans,
    sendWeeklySummary,
  ],
});

/**
 * Email Cron Jobs — Inngest
 *
 * - Weekly summary: Monday 7:00 UTC
 *   Sends each user their past week stats + upcoming plan
 * - Overtraining alert: checked during weekly plan generation
 *   Sent when TSB < -30 and conditions warrant
 */

import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  users,
  athleteProfiles,
  activities,
  dailyMetrics,
  weeklyPlans,
  plannedWorkouts,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  sendWeeklySummaryEmail,
  sendOvertrainingAlert,
} from "@/lib/email/send";
import type { WeeklySummaryData } from "@/lib/email/templates";

export const sendWeeklySummary = inngest.createFunction(
  {
    id: "send-weekly-summary",
    retries: 2,
  },
  { cron: "0 7 * * 1" }, // Monday 7:00 UTC
  async ({ step }) => {
    // Get all users with completed onboarding
    const activeUsers = await step.run("get-users", async () => {
      return db
        .select({
          userId: athleteProfiles.userId,
        })
        .from(athleteProfiles)
        .where(eq(athleteProfiles.onboardingCompleted, true));
    });

    let sent = 0;

    for (const { userId } of activeUsers) {
      await step.run(`email-${userId}`, async () => {
        try {
          await sendSummaryToUser(userId);
          sent++;
        } catch (err) {
          console.error(`Failed to send summary to ${userId}:`, err);
        }
      });
    }

    return { status: "completed", emailsSent: sent };
  }
);

async function sendSummaryToUser(userId: string) {
  // Get user email and name
  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) return;

  // Get last week's date range (Mon-Sun)
  const now = new Date();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - 7 - ((now.getDay() + 6) % 7));
  lastMonday.setHours(0, 0, 0, 0);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  // Get week's TSS totals
  const [weekTss] = await db
    .select({
      total: sql<number>`coalesce(sum(${dailyMetrics.totalTss}), 0)`,
      cycling: sql<number>`coalesce(sum(${dailyMetrics.cyclingTss}), 0)`,
      running: sql<number>`coalesce(sum(${dailyMetrics.runningTss}), 0)`,
      swimming: sql<number>`coalesce(sum(${dailyMetrics.swimmingTss}), 0)`,
    })
    .from(dailyMetrics)
    .where(
      and(
        eq(dailyMetrics.userId, userId),
        gte(dailyMetrics.date, lastMonday),
        lte(dailyMetrics.date, lastSunday)
      )
    );

  // Get activity count + duration
  const [activityStats] = await db
    .select({
      count: sql<number>`count(*)`,
      totalDuration: sql<number>`coalesce(sum(${activities.durationSeconds}), 0)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        gte(activities.startedAt, lastMonday),
        lte(activities.startedAt, lastSunday)
      )
    );

  // Get latest metrics
  const [latest] = await db
    .select({
      ctl: dailyMetrics.ctl,
      atl: dailyMetrics.atl,
      tsb: dailyMetrics.tsb,
    })
    .from(dailyMetrics)
    .where(eq(dailyMetrics.userId, userId))
    .orderBy(desc(dailyMetrics.date))
    .limit(1);

  // Get this week's plan and workouts
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  thisMonday.setHours(0, 0, 0, 0);

  const [currentPlan] = await db
    .select()
    .from(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.userId, userId),
        gte(weeklyPlans.weekStartDate, thisMonday)
      )
    )
    .orderBy(weeklyPlans.weekStartDate)
    .limit(1);

  let upcomingWorkouts: string[] = [];
  let targetTss: number | null = null;

  if (currentPlan) {
    targetTss = currentPlan.targetTss;
    const workouts = await db
      .select({ title: plannedWorkouts.title, sport: plannedWorkouts.sport })
      .from(plannedWorkouts)
      .where(eq(plannedWorkouts.weeklyPlanId, currentPlan.id))
      .orderBy(plannedWorkouts.sortOrder);

    upcomingWorkouts = workouts.map(
      (w) => `${w.title} (${w.sport})`
    );
  }

  // Generate coaching note based on form
  const tsb = latest?.tsb ?? 0;
  const ctl = latest?.ctl ?? 0;
  const atl = latest?.atl ?? 0;

  let coachingNote = "";
  if (tsb > 10) {
    coachingNote =
      "You're well rested. This is a good time to push into some harder sessions.";
  } else if (tsb > 0) {
    coachingNote =
      "Good form — fresh enough for quality training. Stay consistent this week.";
  } else if (tsb > -15) {
    coachingNote =
      "Absorbing training well. Keep the hard/easy pattern and trust the process.";
  } else if (tsb > -30) {
    coachingNote =
      "Significant training load building up. Make sure you're recovering well between hard sessions.";
  } else {
    coachingNote =
      "Deep fatigue accumulated. Consider extra rest this week to let your body absorb the work.";
  }

  const summaryData: WeeklySummaryData = {
    name: user.name ?? "",
    weekTss: weekTss ?? { total: 0, cycling: 0, running: 0, swimming: 0 },
    targetTss,
    ctl,
    atl,
    tsb,
    activityCount: activityStats?.count ?? 0,
    totalDurationMinutes: Math.round((activityStats?.totalDuration ?? 0) / 60),
    upcomingWorkouts,
    coachingNote,
  };

  await sendWeeklySummaryEmail(user.email, summaryData);

  // Check if overtraining alert needed
  if (tsb < -30) {
    await sendOvertrainingAlert(
      user.email,
      user.name ?? "",
      tsb,
      ctl,
      "Your training load has pushed your form below -30. " +
        "This is normal during hard training blocks, but your body needs recovery to absorb the work."
    );
  }
}

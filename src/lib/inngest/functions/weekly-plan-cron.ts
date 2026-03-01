/**
 * Weekly Plan Generation — Inngest Cron
 *
 * Runs every Sunday at 20:00 UTC.
 * For each active user with a subscription + completed onboarding:
 *   1. Fetch current CTL/ATL/TSB
 *   2. Get sport profiles + thresholds
 *   3. Determine current phase (event or auto-progressive)
 *   4. Generate workout pool via coaching engine
 *   5. Store weekly plan + planned workouts
 *   6. Generate nutrition targets for the week
 */

import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  athleteProfiles,
  sportProfiles,
  dailyMetrics,
  trainingPlans,
  weeklyPlans,
  plannedWorkouts,
  targetEvents,
  dailyNutritionTargets,
  subscriptions,
} from "@/lib/db/schema";
import { eq, and, desc, gte, inArray } from "drizzle-orm";
import { generateWeeklyPlan } from "@/lib/engine/coaching/weekly-planner";
import {
  generateAutoProgressivePlan,
  generateEventPeriodization,
} from "@/lib/engine/coaching/periodization";
import type { AthleteState } from "@/lib/engine/coaching/decision-engine";
import { calculateDailyMacros, getTrainingDayType } from "@/lib/engine/nutrition/daily-macros";

export const generateWeeklyPlans = inngest.createFunction(
  {
    id: "generate-weekly-plans",
    retries: 2,
  },
  { cron: "0 20 * * 0" }, // Sunday 20:00 UTC
  async ({ step }) => {
    // Get all Pro users with completed onboarding
    const users = await step.run("get-active-users", async () => {
      // Get active Pro subscriber user IDs
      const proUsers = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(
          inArray(subscriptions.status, ["active", "trialing"])
        );
      const proUserIds = proUsers.map((u) => u.userId);
      if (proUserIds.length === 0) return [];

      return db
        .select({
          userId: athleteProfiles.userId,
          weightKg: athleteProfiles.weightKg,
          weeklyHoursAvailable: athleteProfiles.weeklyHoursAvailable,
          goalType: athleteProfiles.goalType,
          experienceLevel: athleteProfiles.experienceLevel,
        })
        .from(athleteProfiles)
        .where(
          and(
            eq(athleteProfiles.onboardingCompleted, true),
            inArray(athleteProfiles.userId, proUserIds)
          )
        );
    });

    let generated = 0;

    for (const user of users) {
      await step.run(`plan-${user.userId}`, async () => {
        try {
          await generatePlanForUser(user);
          generated++;
        } catch (err) {
          console.error(
            `Failed to generate plan for user ${user.userId}:`,
            err
          );
        }
      });
    }

    return { status: "completed", usersProcessed: users.length, plansGenerated: generated };
  }
);

async function generatePlanForUser(user: {
  userId: string;
  weightKg: number | null;
  weeklyHoursAvailable: number | null;
  goalType: "event" | "fitness_gain" | null;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite" | null;
}) {
  // Get sport profiles
  const profiles = await db
    .select()
    .from(sportProfiles)
    .where(
      and(eq(sportProfiles.userId, user.userId), eq(sportProfiles.isActive, true))
    );

  if (profiles.length === 0) return;

  const sports = profiles.map((p) => p.sport) as ("cycling" | "running" | "swimming")[];

  // Get latest daily metrics for athlete state
  const [latest] = await db
    .select()
    .from(dailyMetrics)
    .where(eq(dailyMetrics.userId, user.userId))
    .orderBy(desc(dailyMetrics.date))
    .limit(1);

  // Get recent metrics for consecutive hard days calc
  const recentDays = await db
    .select({ totalTss: dailyMetrics.totalTss })
    .from(dailyMetrics)
    .where(eq(dailyMetrics.userId, user.userId))
    .orderBy(desc(dailyMetrics.date))
    .limit(7);

  const consecutiveHardDays = countConsecutiveHardDays(
    recentDays.map((d) => d.totalTss ?? 0)
  );

  const athleteState: AthleteState = {
    ctl: latest?.ctl ?? 0,
    atl: latest?.atl ?? 0,
    tsb: latest?.tsb ?? 0,
    rampRate: latest?.rampRate ?? 0,
    consecutiveHardDays,
    hrv7DayTrend: "unknown",
    restingHrDelta: 0,
    sleepScore: latest?.sleepScore ?? null,
    bodyBattery: latest?.bodyBattery ?? null,
  };

  // Determine phase based on goal type
  const baseWeeklyTss = estimateBaseWeeklyTss(
    user.weeklyHoursAvailable ?? 8,
    user.experienceLevel ?? "intermediate"
  );

  let phase: "base" | "build" | "peak" | "race" | "recovery" | "transition" =
    "build";
  let tssMultiplier = 1.0;

  if (user.goalType === "event") {
    // Check for upcoming events
    const [event] = await db
      .select()
      .from(targetEvents)
      .where(
        and(
          eq(targetEvents.userId, user.userId),
          gte(targetEvents.eventDate, new Date())
        )
      )
      .orderBy(targetEvents.eventDate)
      .limit(1);

    if (event) {
      const phases = generateEventPeriodization(event.eventDate, new Date());
      if (phases.length > 0) {
        phase = phases[0].phase;
        tssMultiplier = phases[0].tssMultiplier;
      }
    }
  } else {
    // Auto-progressive: determine current week in 4-week block
    const [activePlan] = await db
      .select()
      .from(trainingPlans)
      .where(
        and(
          eq(trainingPlans.userId, user.userId),
          eq(trainingPlans.isActive, true)
        )
      )
      .limit(1);

    if (activePlan) {
      const weeksSinceStart = Math.floor(
        (Date.now() - activePlan.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const phases = generateAutoProgressivePlan(baseWeeklyTss, weeksSinceStart + 1);
      if (phases.length > 0) {
        const currentPhase = phases[phases.length - 1];
        phase = currentPhase.phase;
        tssMultiplier = currentPhase.tssMultiplier;
      }
    }
  }

  // Get thresholds from sport profiles
  const cyclingProfile = profiles.find((p) => p.sport === "cycling");
  const runningProfile = profiles.find((p) => p.sport === "running");
  const swimmingProfile = profiles.find((p) => p.sport === "swimming");

  // Generate the weekly plan
  const plan = generateWeeklyPlan({
    sports,
    phase,
    baseWeeklyTss,
    tssMultiplier,
    weeklyHoursAvailable: user.weeklyHoursAvailable ?? 8,
    athleteState,
    ftp: cyclingProfile?.ftp ?? undefined,
    thresholdPaceSecPerKm: runningProfile?.thresholdPaceSPerKm ?? undefined,
    cssSPer100m: swimmingProfile?.cssSPer100m ?? undefined,
  });

  // Calculate week dates
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Store weekly plan
  const [newWeeklyPlan] = await db
    .insert(weeklyPlans)
    .values({
      userId: user.userId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      targetTss: plan.targetTss,
      phase,
      adaptationNotes: plan.adaptationNotes,
    })
    .returning({ id: weeklyPlans.id });

  // Store planned workouts
  for (let i = 0; i < plan.workouts.length; i++) {
    const w = plan.workouts[i];
    await db.insert(plannedWorkouts).values({
      weeklyPlanId: newWeeklyPlan.id,
      userId: user.userId,
      sport: w.sport as "cycling" | "running" | "swimming",
      workoutType: w.workoutType as never, // enum type
      title: w.title,
      description: w.description,
      targetDurationMinutes: w.targetDurationMinutes,
      targetTss: w.targetTss,
      targetIntensityFactor: w.targetIf,
      structure: w.structure,
      coachingTip: w.coachingTip,
      whyThisWorkout: w.whyThisWorkout,
      sortOrder: i,
    });
  }

  // Generate nutrition targets for each day of the week
  if (user.weightKg) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);

      const hasWorkout = d < plan.workouts.length;
      const workoutTss = hasWorkout ? (plan.workouts[d]?.targetTss ?? 0) : 0;
      const dayType = getTrainingDayType(workoutTss);
      const macros = calculateDailyMacros(user.weightKg, dayType);

      await db.insert(dailyNutritionTargets).values({
        userId: user.userId,
        date: day,
        carbsGrams: macros.carbsGrams,
        proteinGrams: macros.proteinGrams,
        fatGrams: macros.fatGrams,
        totalCalories: macros.totalCalories,
        carbsPerKg: macros.carbsPerKg,
        proteinPerKg: macros.proteinPerKg,
        fatPerKg: macros.fatPerKg,
        trainingDayType: dayType,
        plannedTss: workoutTss,
        explanation: macros.explanation,
      });
    }
  }
}

function countConsecutiveHardDays(recentTss: number[]): number {
  let count = 0;
  for (const tss of recentTss) {
    if (tss >= 80) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function estimateBaseWeeklyTss(
  weeklyHours: number,
  experience: string
): number {
  // Rough TSS/hour by experience level
  const tssPerHour: Record<string, number> = {
    beginner: 40,
    intermediate: 55,
    advanced: 65,
    elite: 75,
  };
  return Math.round(weeklyHours * (tssPerHour[experience] ?? 55));
}

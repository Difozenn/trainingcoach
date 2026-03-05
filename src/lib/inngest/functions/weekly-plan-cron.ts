/**
 * Weekly Plan Generation — Inngest Cron
 *
 * Runs every Sunday at 20:00 UTC.
 * For each active user with a subscription + completed onboarding:
 *   1. Fetch current CTL/ATL/TSB
 *   2. Detect athlete level from CTL + experience
 *   3. Compute weeklyTargetTss = (CTL + rampRate) × 7 × phaseMultiplier × safetyMultiplier
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
import { getCoachingDecision } from "@/lib/engine/coaching/decision-engine";
import { calculateDailyMacros, getTrainingDayType } from "@/lib/engine/nutrition/daily-macros";
import { computeHrv7DayTrend, computeRestingHrDelta } from "@/lib/engine/shared/health-trends";
import type { AthleteLevel } from "@/lib/engine/coaching/progression";

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

// ============ ATHLETE LEVEL DETECTION ============

/**
 * Detect athlete level from CTL + onboarding experience setting.
 * Combines objective fitness (CTL) with self-reported experience.
 */
export function detectAthleteLevel(
  ctl: number,
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite" | null
): AthleteLevel {
  // CTL-based level detection
  let ctlLevel: AthleteLevel;
  if (ctl < 25) ctlLevel = "novice";
  else if (ctl < 40) ctlLevel = "beginner";
  else if (ctl < 70) ctlLevel = "intermediate";
  else if (ctl < 100) ctlLevel = "advanced";
  else ctlLevel = "competitive";

  // Experience-based level
  const expMap: Record<string, AthleteLevel> = {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
    elite: "competitive",
  };
  const expLevel = expMap[experienceLevel ?? "intermediate"] ?? "intermediate";

  // Use the LOWER of CTL-detected and experience-reported
  // This prevents a strong rider who's detrained from getting overwhelming workouts,
  // and prevents a beginner who's somehow built CTL from getting advanced intervals
  const levelOrder: AthleteLevel[] = ["novice", "beginner", "intermediate", "advanced", "competitive"];
  const ctlIdx = levelOrder.indexOf(ctlLevel);
  const expIdx = levelOrder.indexOf(expLevel);

  return levelOrder[Math.min(ctlIdx, expIdx)];
}

// ============ RAMP RATE ============

/**
 * Get safe ramp rate (CTL points/week) based on level.
 * Conservative by default — athletes earn aggressive ramp rates.
 */
export function getRampRate(level: AthleteLevel): number {
  switch (level) {
    case "novice": return 3;      // conservative: 2-3, we use 3
    case "beginner": return 4;    // conservative-normal: 3-5
    case "intermediate": return 5; // normal: 5-7
    case "advanced": return 6;    // normal: 5-7
    case "competitive": return 7;  // normal-aggressive: 5-8
  }
}

// ============ MAIN PLAN GENERATION ============

export async function generatePlanForUser(user: {
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

  // Get recent metrics for consecutive hard days calc + health trends
  const recentDays = await db
    .select({
      totalTss: dailyMetrics.totalTss,
      hrv: dailyMetrics.hrv,
      restingHr: dailyMetrics.restingHr,
    })
    .from(dailyMetrics)
    .where(eq(dailyMetrics.userId, user.userId))
    .orderBy(desc(dailyMetrics.date))
    .limit(30);

  const consecutiveHardDays = countConsecutiveHardDays(
    recentDays.map((d) => d.totalTss ?? 0)
  );

  // Compute health trends from Garmin data (gracefully falls back when no data)
  const last7Hrv = recentDays
    .slice(0, 7)
    .reverse()
    .map((d) => d.hrv);
  const last30RestingHr = recentDays
    .reverse()
    .map((d) => d.restingHr);

  const ctl = latest?.ctl ?? 0;
  const atl = latest?.atl ?? 0;
  const tsb = latest?.tsb ?? 0;

  const athleteState: AthleteState = {
    ctl,
    atl,
    tsb,
    rampRate: latest?.rampRate ?? 0,
    consecutiveHardDays,
    hrv7DayTrend: computeHrv7DayTrend(last7Hrv),
    restingHrDelta: computeRestingHrDelta(last30RestingHr),
    sleepScore: latest?.sleepScore ?? null,
    bodyBattery: latest?.bodyBattery ?? null,
  };

  // ============ CTL-BASED TARGETING ============

  // 1. Detect level
  const level = detectAthleteLevel(ctl, user.experienceLevel);

  // 2. Get ramp rate
  const rampRate = getRampRate(level);

  // 3. Core formula: weeklyTargetTss = (CTL + rampRate) × 7
  //    With CTL=0 floor: brand new athletes start at 100-150 TSS/week
  let weeklyTargetTss: number;
  if (ctl === 0) {
    // Bootstrap: 3 easy Z2 rides of 45-60min ≈ 100-150 TSS
    weeklyTargetTss = 120;
  } else {
    weeklyTargetTss = Math.round((ctl + rampRate) * 7);
  }

  // 4. Get coaching decision (safety + health → tsbMultiplier)
  const decision = getCoachingDecision(athleteState);

  // 5. Determine phase
  let phaseMultiplier = 1.0;
  let phase: "base" | "build" | "peak" | "race" | "recovery" | "transition" = "base";
  let subPhase: "base1" | "base2" | "base3" | "build1" | "build2" | "peak" | "race" | "recovery" | "transition" = "base1";

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
      const phases = generateEventPeriodization(event.eventDate, new Date(), level);
      if (phases.length > 0) {
        const currentPhase = phases[0]; // first phase = current week
        phase = currentPhase.phase;
        subPhase = currentPhase.subPhase;
        phaseMultiplier = currentPhase.tssMultiplier;
      }
    }
  } else {
    // Auto-progressive: determine phase from CTL + training age
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

    let weeksSinceStart = 0;
    if (activePlan) {
      weeksSinceStart = Math.floor(
        (Date.now() - activePlan.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
    }

    const phaseConfig = generateAutoProgressivePlan(ctl, weeksSinceStart, level);
    phase = phaseConfig.phase;
    subPhase = phaseConfig.subPhase;
    phaseMultiplier = phaseConfig.tssMultiplier;
  }

  // 6. Apply multipliers
  weeklyTargetTss = Math.round(weeklyTargetTss * phaseMultiplier * decision.tsbMultiplier);

  // 7. Floor: never go below 50 TSS (that's basically nothing)
  weeklyTargetTss = Math.max(50, weeklyTargetTss);

  // Get thresholds from sport profiles
  const cyclingProfile = profiles.find((p) => p.sport === "cycling");
  const runningProfile = profiles.find((p) => p.sport === "running");
  const swimmingProfile = profiles.find((p) => p.sport === "swimming");

  // Generate the weekly plan
  const plan = generateWeeklyPlan({
    sports,
    subPhase,
    weeklyTargetTss,
    weeklyHoursAvailable: user.weeklyHoursAvailable ?? 8,
    athleteState,
    level,
    ftp: cyclingProfile?.ftp ?? undefined,
    thresholdPaceSecPerKm: runningProfile?.thresholdPaceSPerKm ?? undefined,
    cssSPer100m: swimmingProfile?.cssSPer100m ?? undefined,
  });

  // Calculate week dates (Monday–Sunday containing today)
  const now = new Date();
  const weekStart = new Date(now);
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(now.getDate() + daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Build adaptation notes combining decision engine + planner
  let adaptationNotes = plan.adaptationNotes;
  if (decision.action !== "proceed") {
    adaptationNotes += ` | Safety: ${decision.reason}`;
  }

  // Store weekly plan
  const [newWeeklyPlan] = await db
    .insert(weeklyPlans)
    .values({
      userId: user.userId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      targetTss: plan.targetTss,
      phase,
      adaptationNotes,
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

export function countConsecutiveHardDays(recentTss: number[]): number {
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

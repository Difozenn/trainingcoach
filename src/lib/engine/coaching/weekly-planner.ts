/**
 * Weekly Planner — Level-Aware Workout Distribution
 *
 * Generates a pool of workouts for the week with proper hard/easy patterns.
 * Receives a pre-calculated weeklyTargetTss from the cron.
 *
 * Rules:
 * - Hard days separated by 36-48h (easy day between)
 * - Never 2 VO2max sessions on consecutive days
 * - Long ride on weekend, next day easy
 * - Session count determined by weeklyHoursAvailable
 * - TSS distribution: long ride 30-35%, hard 15-20% each, easy fills remainder
 * - Workout durations calculated from TSS and IF
 */

import type { AthleteLevel } from "./progression";
import type { SubPhase } from "./periodization";
import {
  generateCyclingWorkout,
  generateRunningWorkout,
  generateSwimmingWorkout,
} from "./workout-generator";
import type { WorkoutTemplate } from "./workout-generator";
import type { AthleteState } from "./decision-engine";

type Sport = "cycling" | "running" | "swimming";

export type WeeklyPlanInput = {
  sports: Sport[];
  subPhase: SubPhase;
  weeklyTargetTss: number; // pre-calculated by cron, already includes safety multiplier
  weeklyHoursAvailable: number;
  athleteState: AthleteState;
  level: AthleteLevel;
  // Sport-specific thresholds
  ftp?: number;
  thresholdPaceSecPerKm?: number;
  cssSPer100m?: number;
};

export type WeeklyPlanOutput = {
  targetTss: number;
  workouts: WorkoutTemplate[];
  restDays: number;
  adaptationNotes: string;
};

/** Key (hard) sessions allowed per athlete level */
function getKeySessions(level: AthleteLevel): number {
  switch (level) {
    case "novice": return 0;
    case "beginner": return 1;
    case "intermediate": return 2;
    case "advanced": return 3;
    case "competitive": return 3;
  }
}

/** Total training sessions from weekly hours available */
function getSessionCount(weeklyHours: number): number {
  if (weeklyHours <= 5) return 3;
  if (weeklyHours <= 8) return 4;
  if (weeklyHours <= 12) return 5;
  return 6;
}

/**
 * Select which hard workout types are appropriate for the current sub-phase + level.
 */
function selectHardWorkouts(
  subPhase: SubPhase,
  level: AthleteLevel,
  primarySport: Sport
): string[] {
  const workouts: string[] = [];

  // Novice: no hard sessions regardless of phase
  if (level === "novice") return [];

  switch (subPhase) {
    case "base1":
      // Z2 only, no hard sessions
      break;

    case "base2":
      // Sweet spot introduced
      if (primarySport === "cycling") workouts.push("sweet_spot");
      if (primarySport === "running") workouts.push("fartlek");
      if (primarySport === "swimming") workouts.push("threshold_swim");
      break;

    case "base3":
      // Sweet spot + tempo
      if (primarySport === "cycling") workouts.push("sweet_spot");
      if (primarySport === "running") workouts.push("tempo_run");
      if (primarySport === "swimming") workouts.push("threshold_swim");
      break;

    case "build1":
      // Threshold added
      if (primarySport === "cycling") {
        workouts.push("threshold_ride");
        if (level !== "beginner") workouts.push("sweet_spot");
      }
      if (primarySport === "running") {
        workouts.push("threshold_intervals_run");
        if (level !== "beginner") workouts.push("tempo_run");
      }
      if (primarySport === "swimming") {
        workouts.push("threshold_swim");
      }
      break;

    case "build2":
      // VO2max added (not for beginners)
      if (primarySport === "cycling") {
        workouts.push("threshold_ride");
        if (level !== "beginner") workouts.push("vo2max_ride");
        if (level === "advanced" || level === "competitive") workouts.push("sweet_spot");
      }
      if (primarySport === "running") {
        workouts.push("threshold_intervals_run");
        if (level !== "beginner") workouts.push("vo2max_intervals_run");
      }
      if (primarySport === "swimming") {
        workouts.push("threshold_swim");
        if (level !== "beginner") workouts.push("vo2max_swim");
      }
      break;

    case "peak":
      // Race-specific intensity
      if (primarySport === "cycling") {
        workouts.push("vo2max_ride");
        workouts.push("threshold_ride");
        if (level === "competitive") workouts.push("anaerobic_ride");
      }
      if (primarySport === "running") {
        workouts.push("vo2max_intervals_run");
        workouts.push("threshold_intervals_run");
      }
      if (primarySport === "swimming") {
        workouts.push("vo2max_swim");
        workouts.push("threshold_swim");
      }
      break;

    case "race":
      // Short sharp openers
      if (primarySport === "cycling") workouts.push("threshold_ride");
      if (primarySport === "running") workouts.push("tempo_run");
      if (primarySport === "swimming") workouts.push("threshold_swim");
      break;

    case "recovery":
    case "transition":
      // No hard sessions
      break;
  }

  return workouts;
}

/**
 * Get the easy workout type for a sport.
 */
function getEasyWorkout(sport: Sport): string {
  switch (sport) {
    case "cycling": return "endurance_ride";
    case "running": return "easy_run";
    case "swimming": return "endurance_swim";
  }
}

/**
 * Get a recovery workout type for a sport.
 */
function getRecoveryWorkout(sport: Sport): string {
  switch (sport) {
    case "cycling": return "recovery_ride";
    case "running": return "easy_run";
    case "swimming": return "drill_technique";
  }
}

/**
 * Generate a weekly workout pool with proper hard/easy sequencing.
 */
export function generateWeeklyPlan(input: WeeklyPlanInput): WeeklyPlanOutput {
  const {
    sports,
    subPhase,
    weeklyTargetTss,
    weeklyHoursAvailable,
    level,
    ftp,
    thresholdPaceSecPerKm,
    cssSPer100m,
  } = input;

  const targetTss = weeklyTargetTss;
  const sessionCount = getSessionCount(weeklyHoursAvailable);
  const keySessions = Math.min(getKeySessions(level), sessionCount - 1); // leave room for easy
  const restDays = 7 - sessionCount;
  const primarySport = sports[0];

  // Determine which hard workouts are appropriate
  const hardWorkoutPool = selectHardWorkouts(subPhase, level, primarySport);
  const actualKeySessions = Math.min(keySessions, hardWorkoutPool.length);

  // TSS distribution:
  // - Long ride: 30-35% of weekly TSS
  // - Each hard session: 15-20%
  // - Easy sessions fill remainder
  const longRideTssPct = sessionCount >= 4 ? 0.32 : 0.35;
  const hardTssPct = 0.18;
  const longRideTss = Math.round(targetTss * longRideTssPct);
  const hardTssTotal = Math.round(targetTss * hardTssPct * actualKeySessions);
  const easyTssTotal = targetTss - longRideTss - hardTssTotal;
  const easySessions = sessionCount - actualKeySessions - 1; // -1 for long ride
  const easyTssPerSession = easySessions > 0 ? Math.round(easyTssTotal / easySessions) : 0;

  const workouts: WorkoutTemplate[] = [];

  const thresholds = { ftp, thresholdPaceSecPerKm, cssSPer100m };

  // 1. Long endurance session (always present, weekend slot)
  const longSport = primarySport;
  const longWorkout = generateWorkout(longSport, getEasyWorkout(longSport), longRideTss, level, subPhase, thresholds);
  if (longWorkout) workouts.push(longWorkout);

  // 2. Hard sessions (spaced with easy days between)
  for (let i = 0; i < actualKeySessions; i++) {
    const workoutType = hardWorkoutPool[i % hardWorkoutPool.length];
    const hardSport = sports.length > 1 ? sports[(i + 1) % sports.length] : primarySport;
    const hardTssPerSession = Math.round(targetTss * hardTssPct);

    const hardWorkout = generateWorkout(hardSport, workoutType, hardTssPerSession, level, subPhase, thresholds);
    if (hardWorkout) workouts.push(hardWorkout);
  }

  // 3. Easy / recovery sessions to fill remaining slots
  for (let i = 0; i < easySessions; i++) {
    const easySport = sports[i % sports.length];
    const isRecoveryPhase = subPhase === "recovery" || subPhase === "transition";
    const workoutType = isRecoveryPhase
      ? getRecoveryWorkout(easySport)
      : getEasyWorkout(easySport);

    const easyWorkout = generateWorkout(easySport, workoutType, easyTssPerSession, level, subPhase, thresholds);
    if (easyWorkout) workouts.push(easyWorkout);
  }

  // Sort: long ride first (weekend), then hard sessions, then easy (for display order)
  // The athlete can rearrange, but this gives a sensible default

  // Build adaptation notes
  const phaseLabel = subPhase.replace(/(\d)/, " $1");
  const adaptationNotes =
    `${phaseLabel.charAt(0).toUpperCase() + phaseLabel.slice(1)} phase — ` +
    `${actualKeySessions} key session${actualKeySessions !== 1 ? "s" : ""}, ` +
    `${easySessions} easy session${easySessions !== 1 ? "s" : ""}, ` +
    `1 long ride. Target: ${targetTss} TSS.`;

  return {
    targetTss,
    workouts,
    restDays,
    adaptationNotes,
  };
}

/**
 * Route to the correct sport-specific workout generator.
 */
function generateWorkout(
  sport: Sport,
  workoutType: string,
  targetTss: number,
  level: AthleteLevel,
  subPhase: SubPhase,
  thresholds: {
    ftp?: number;
    thresholdPaceSecPerKm?: number;
    cssSPer100m?: number;
  }
): WorkoutTemplate | null {
  switch (sport) {
    case "cycling":
      if (!thresholds.ftp) return null;
      return generateCyclingWorkout(workoutType, thresholds.ftp, targetTss, level, subPhase);
    case "running":
      if (!thresholds.thresholdPaceSecPerKm) return null;
      return generateRunningWorkout(workoutType, thresholds.thresholdPaceSecPerKm, targetTss, level, subPhase);
    case "swimming":
      if (!thresholds.cssSPer100m) return null;
      return generateSwimmingWorkout(workoutType, thresholds.cssSPer100m, targetTss, level, subPhase);
  }
}

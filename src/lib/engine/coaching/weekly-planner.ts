/**
 * Weekly Planner — Workout Pool Generation
 *
 * Generates a pool of workouts for the week. The athlete decides
 * when to do each workout — we provide the what, they control the when.
 *
 * Rules:
 * - Hard days separated by 48h minimum (easy day between)
 * - Long sessions on weekends (if preferred)
 * - Weekly TSS target set by periodization phase
 * - Recovery week every 4th week (auto-progressive) or per mesocycle
 * - Mid-week adaptation: if athlete is behind/ahead on TSS, adjust
 *
 * The pool concept gives structure without rigidity.
 */

import type { Phase } from "./periodization";
import {
  generateCyclingWorkout,
  generateRunningWorkout,
  generateSwimmingWorkout,
} from "./workout-generator";
import type { WorkoutTemplate } from "./workout-generator";
import type { AthleteState } from "./decision-engine";
import { getCoachingDecision } from "./decision-engine";

type Sport = "cycling" | "running" | "swimming";

export type WeeklyPlanInput = {
  sports: Sport[];
  phase: Phase;
  baseWeeklyTss: number;
  tssMultiplier: number;
  weeklyHoursAvailable: number;
  athleteState: AthleteState;
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

/**
 * Phase-specific workout type distributions.
 */
const PHASE_WORKOUT_MIX: Record<Phase, Record<string, number>> = {
  base: {
    endurance: 0.6,
    easy: 0.25,
    tempo: 0.1,
    threshold: 0.05,
  },
  build: {
    endurance: 0.3,
    easy: 0.2,
    threshold: 0.25,
    vo2max: 0.15,
    sweet_spot: 0.1,
  },
  peak: {
    endurance: 0.2,
    easy: 0.2,
    threshold: 0.2,
    vo2max: 0.25,
    race_specific: 0.15,
  },
  race: {
    easy: 0.5,
    threshold: 0.2,
    vo2max: 0.1,
    endurance: 0.2,
  },
  recovery: {
    easy: 0.5,
    endurance: 0.3,
    recovery: 0.2,
  },
  transition: {
    easy: 0.4,
    endurance: 0.3,
    recovery: 0.3,
  },
};

/**
 * Map generic workout categories to sport-specific workout types.
 */
function mapToSportWorkout(
  category: string,
  sport: Sport
): string {
  const mapping: Record<string, Record<Sport, string>> = {
    recovery: {
      cycling: "recovery_ride",
      running: "easy_run",
      swimming: "endurance_swim",
    },
    easy: {
      cycling: "endurance_ride",
      running: "easy_run",
      swimming: "endurance_swim",
    },
    endurance: {
      cycling: "endurance_ride",
      running: "long_run",
      swimming: "endurance_swim",
    },
    tempo: {
      cycling: "sweet_spot",
      running: "tempo_run",
      swimming: "threshold_swim",
    },
    sweet_spot: {
      cycling: "sweet_spot",
      running: "tempo_run",
      swimming: "threshold_swim",
    },
    threshold: {
      cycling: "threshold_ride",
      running: "threshold_intervals_run",
      swimming: "threshold_swim",
    },
    vo2max: {
      cycling: "vo2max_ride",
      running: "vo2max_intervals_run",
      swimming: "vo2max_swim",
    },
    race_specific: {
      cycling: "threshold_ride",
      running: "tempo_run",
      swimming: "threshold_swim",
    },
  };

  return mapping[category]?.[sport] ?? mapping.easy[sport];
}

/**
 * Generate a weekly workout pool.
 */
export function generateWeeklyPlan(input: WeeklyPlanInput): WeeklyPlanOutput {
  const {
    sports,
    phase,
    baseWeeklyTss,
    tssMultiplier,
    weeklyHoursAvailable,
    athleteState,
    ftp,
    thresholdPaceSecPerKm,
    cssSPer100m,
  } = input;

  // Check coaching decision (safety + health)
  const decision = getCoachingDecision(athleteState);

  // Calculate target TSS for the week
  let targetTss = Math.round(baseWeeklyTss * tssMultiplier);

  // Apply coaching decision
  if (decision.action === "force_rest") {
    targetTss = Math.round(targetTss * 0.4); // -60% for forced recovery
  } else if (decision.action === "reduce_intensity") {
    targetTss = Math.round(targetTss * 0.75); // -25% for reduced intensity
  }

  // Cap by max TSS if decision engine limits it
  if (decision.maxTssAllowed !== null) {
    targetTss = Math.min(
      targetTss,
      decision.maxTssAllowed * 7 // maxTss is per day, multiply by 7
    );
  }

  // Determine number of training days (based on hours available)
  const avgSessionMinutes = 60;
  const maxSessions = Math.min(
    Math.floor((weeklyHoursAvailable * 60) / avgSessionMinutes),
    7
  );
  const trainingDays = Math.min(maxSessions, decision.action === "force_rest" ? 3 : 6);
  const restDays = 7 - trainingDays;

  // Get phase-specific workout mix
  const workoutMix = PHASE_WORKOUT_MIX[phase] || PHASE_WORKOUT_MIX.base;

  // Distribute workouts across sports
  const workouts: WorkoutTemplate[] = [];
  const tssPerWorkout = targetTss / trainingDays;

  // Round-robin through sports and workout types
  const entries = Object.entries(workoutMix).sort(([, a], [, b]) => b - a);
  let workoutCount = 0;

  for (const [category, proportion] of entries) {
    const count = Math.max(1, Math.round(trainingDays * proportion));
    for (let i = 0; i < count && workoutCount < trainingDays; i++) {
      const sport = sports[workoutCount % sports.length];
      const workoutType = mapToSportWorkout(category, sport);
      const duration = Math.round(
        (tssPerWorkout / 0.7) // rough TSS→minutes conversion
      );

      let workout: WorkoutTemplate;
      switch (sport) {
        case "cycling":
          workout = generateCyclingWorkout(workoutType, ftp || 200, duration);
          break;
        case "running":
          workout = generateRunningWorkout(
            workoutType,
            thresholdPaceSecPerKm || 300,
            duration
          );
          break;
        case "swimming":
          workout = generateSwimmingWorkout(
            workoutType,
            cssSPer100m || 100,
            duration
          );
          break;
      }

      workouts.push(workout);
      workoutCount++;
    }
  }

  // Build adaptation notes
  let adaptationNotes = decision.reason;
  if (decision.action !== "proceed") {
    adaptationNotes +=
      ` Weekly target adjusted from ${Math.round(baseWeeklyTss * tssMultiplier)} to ${targetTss} TSS.`;
  }

  return {
    targetTss,
    workouts: workouts.slice(0, trainingDays),
    restDays,
    adaptationNotes,
  };
}

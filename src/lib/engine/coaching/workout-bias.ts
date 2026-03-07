/**
 * Workout Bias — Rider-Type Personalization
 *
 * Multipliers adjust the probability of selecting each workout type.
 * 1.0 = neutral, >1 = more likely, <1 = less likely.
 *
 * Three training modes:
 * - "strengths": use multipliers as-is (race your strengths)
 * - "weaknesses": invert multipliers (train your weaknesses)
 * - "balanced": all multipliers = 1.0 (default)
 *
 * Reference: rider-type-training-research.md
 */

import type { RiderType } from "../cycling/power-profile";

export type TrainingFocus = "strengths" | "weaknesses" | "balanced";

/** Workout bias multipliers by rider type */
const BIAS_TABLE: Record<string, Record<RiderType, number>> = {
  recovery_ride:       { Climber: 1.0, "Time Trialist": 1.0, Sprinter: 1.0, Puncheur: 1.0, "All-Rounder": 1.0, "Crit Racer": 1.0 },
  endurance_ride:      { Climber: 1.3, "Time Trialist": 1.2, Sprinter: 0.8, Puncheur: 0.9, "All-Rounder": 1.0, "Crit Racer": 0.8 },
  long_endurance_ride: { Climber: 1.5, "Time Trialist": 1.3, Sprinter: 0.5, Puncheur: 0.7, "All-Rounder": 1.0, "Crit Racer": 0.5 },
  sweet_spot:          { Climber: 1.5, "Time Trialist": 1.5, Sprinter: 0.5, Puncheur: 1.0, "All-Rounder": 1.0, "Crit Racer": 0.8 },
  threshold_ride:      { Climber: 1.3, "Time Trialist": 1.8, Sprinter: 0.4, Puncheur: 0.8, "All-Rounder": 1.0, "Crit Racer": 0.7 },
  over_unders:         { Climber: 1.2, "Time Trialist": 1.5, Sprinter: 0.5, Puncheur: 1.2, "All-Rounder": 1.0, "Crit Racer": 1.3 },
  vo2max_ride:         { Climber: 1.3, "Time Trialist": 0.8, Sprinter: 0.6, Puncheur: 1.8, "All-Rounder": 1.0, "Crit Racer": 1.3 },
  anaerobic_ride:      { Climber: 0.5, "Time Trialist": 0.4, Sprinter: 1.5, Puncheur: 1.5, "All-Rounder": 1.0, "Crit Racer": 1.8 },
  sprint_ride:         { Climber: 0.3, "Time Trialist": 0.3, Sprinter: 2.0, Puncheur: 0.8, "All-Rounder": 1.0, "Crit Racer": 1.5 },
};

/**
 * Get the workout bias multiplier for a given workout type and rider type.
 */
export function getWorkoutBias(
  workoutType: string,
  riderType: RiderType,
  trainingFocus: TrainingFocus
): number {
  if (trainingFocus === "balanced") return 1.0;

  const row = BIAS_TABLE[workoutType];
  if (!row) return 1.0;

  const strengthMult = row[riderType] ?? 1.0;

  if (trainingFocus === "strengths") return strengthMult;

  // Weakness mode: invert multiplier, clamped to [0.3, 2.0]
  return Math.max(0.3, Math.min(2.0, 2.0 - strengthMult));
}

/**
 * Apply bias to a pool of workout type candidates.
 * Returns the selected workout type using weighted random selection.
 */
export function selectBiasedWorkout(
  candidates: string[],
  riderType: RiderType,
  trainingFocus: TrainingFocus
): string {
  if (candidates.length === 0) return "endurance_ride";
  if (candidates.length === 1 || trainingFocus === "balanced") {
    return candidates[0];
  }

  const weights = candidates.map((c) => getWorkoutBias(c, riderType, trainingFocus));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Deterministic selection: pick highest weight (no randomness in server components)
  let bestIdx = 0;
  let bestWeight = weights[0];
  for (let i = 1; i < weights.length; i++) {
    if (weights[i] > bestWeight) {
      bestWeight = weights[i];
      bestIdx = i;
    }
  }

  return candidates[bestIdx];
}

/** Rider type labels for display */
export const RIDER_TYPE_LABELS: Record<RiderType, string> = {
  Sprinter: "Sprinter",
  Puncheur: "Puncheur",
  Climber: "Climber",
  "Time Trialist": "Time Trialist",
  "Crit Racer": "Crit Racer",
  "All-Rounder": "All-Rounder",
};

/** Training focus labels for display */
export const TRAINING_FOCUS_LABELS: Record<TrainingFocus, string> = {
  strengths: "Train Strengths",
  weaknesses: "Train Weaknesses",
  balanced: "Balanced",
};

/** Short descriptions for each rider type */
export const RIDER_TYPE_DESCRIPTIONS: Record<RiderType, string> = {
  Sprinter: "Explosive power, strong 5s-1min",
  Puncheur: "Repeated surges, strong 1-5min VO2max",
  Climber: "Sustained power, strong 5-20min W/kg",
  "Time Trialist": "Threshold endurance, strong 20-60min",
  "Crit Racer": "Anaerobic capacity, repeated accelerations",
  "All-Rounder": "Balanced across all durations",
};

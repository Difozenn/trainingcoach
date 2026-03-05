/**
 * Workout Progression — Level-Based Interval Ladders
 *
 * Maps athlete level to appropriate interval structures.
 * Each workout type has a progression ladder from easy to hard.
 * No DB changes needed — uses athlete level detection from CTL + experience.
 *
 * Reference:
 * - TrainerRoad Progression Levels concept (simplified)
 * - Coggan power zones + periodization
 */

export type AthleteLevel =
  | "novice"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "competitive";

export type ProgressionStep = {
  reps: number;
  durationSeconds: number;
  restSeconds: number;
  /** Power target as % of FTP (cycling) */
  powerPctFtp?: number;
  /** Pace target as multiplier of threshold pace (running, <1 = faster) */
  paceFactor?: number;
};

// ============ CYCLING PROGRESSION LADDERS ============

export const SWEET_SPOT_LADDER: ProgressionStep[] = [
  { reps: 3, durationSeconds: 300, restSeconds: 300, powerPctFtp: 0.88 },  // L1: 3×5min
  { reps: 3, durationSeconds: 480, restSeconds: 300, powerPctFtp: 0.89 },  // L2: 3×8min
  { reps: 3, durationSeconds: 600, restSeconds: 300, powerPctFtp: 0.90 },  // L3: 3×10min
  { reps: 3, durationSeconds: 720, restSeconds: 240, powerPctFtp: 0.91 },  // L4: 3×12min
  { reps: 2, durationSeconds: 900, restSeconds: 300, powerPctFtp: 0.92 },  // L5: 2×15min
  { reps: 3, durationSeconds: 900, restSeconds: 300, powerPctFtp: 0.92 },  // L6: 3×15min
  { reps: 2, durationSeconds: 1200, restSeconds: 300, powerPctFtp: 0.93 }, // L7: 2×20min
  { reps: 3, durationSeconds: 1200, restSeconds: 300, powerPctFtp: 0.94 }, // L8: 3×20min
];

export const THRESHOLD_LADDER: ProgressionStep[] = [
  { reps: 4, durationSeconds: 300, restSeconds: 300, powerPctFtp: 0.95 },  // L1: 4×5min
  { reps: 3, durationSeconds: 480, restSeconds: 300, powerPctFtp: 0.97 },  // L2: 3×8min
  { reps: 4, durationSeconds: 480, restSeconds: 240, powerPctFtp: 0.98 },  // L3: 4×8min
  { reps: 3, durationSeconds: 600, restSeconds: 300, powerPctFtp: 0.99 },  // L4: 3×10min
  { reps: 4, durationSeconds: 600, restSeconds: 240, powerPctFtp: 1.0 },   // L5: 4×10min
  { reps: 3, durationSeconds: 720, restSeconds: 240, powerPctFtp: 1.0 },   // L6: 3×12min
  { reps: 3, durationSeconds: 900, restSeconds: 300, powerPctFtp: 1.0 },   // L7: 3×15min
  { reps: 2, durationSeconds: 1200, restSeconds: 600, powerPctFtp: 1.0 },  // L8: 2×20min
];

export const VO2MAX_LADDER: ProgressionStep[] = [
  { reps: 8, durationSeconds: 30, restSeconds: 30, powerPctFtp: 1.15 },   // L1: 8×30/30
  { reps: 6, durationSeconds: 120, restSeconds: 120, powerPctFtp: 1.15 }, // L2: 6×2min
  { reps: 5, durationSeconds: 180, restSeconds: 180, powerPctFtp: 1.15 }, // L3: 5×3min
  { reps: 6, durationSeconds: 180, restSeconds: 150, powerPctFtp: 1.15 }, // L4: 6×3min
  { reps: 5, durationSeconds: 240, restSeconds: 180, powerPctFtp: 1.12 }, // L5: 5×4min
  { reps: 4, durationSeconds: 300, restSeconds: 240, powerPctFtp: 1.10 }, // L6: 4×5min
];

export const OVER_UNDER_LADDER: ProgressionStep[] = [
  // Each "rep" = one over-under block (3min under + 1min over)
  // Total block = reps × (3+1)min
  { reps: 2, durationSeconds: 600, restSeconds: 300, powerPctFtp: 0.90 },  // L1: 2×10min
  { reps: 2, durationSeconds: 720, restSeconds: 300, powerPctFtp: 0.90 },  // L2: 2×12min
  { reps: 3, durationSeconds: 720, restSeconds: 240, powerPctFtp: 0.90 },  // L3: 3×12min
  { reps: 2, durationSeconds: 900, restSeconds: 300, powerPctFtp: 0.90 },  // L4: 2×15min
];

// ============ RUNNING PROGRESSION LADDERS ============

export const TEMPO_RUN_LADDER: ProgressionStep[] = [
  { reps: 1, durationSeconds: 1200, restSeconds: 0, paceFactor: 1.08 }, // L1: 20min tempo
  { reps: 1, durationSeconds: 1500, restSeconds: 0, paceFactor: 1.06 }, // L2: 25min tempo
  { reps: 1, durationSeconds: 1800, restSeconds: 0, paceFactor: 1.05 }, // L3: 30min tempo
  { reps: 1, durationSeconds: 2400, restSeconds: 0, paceFactor: 1.05 }, // L4: 40min tempo
];

export const THRESHOLD_RUN_LADDER: ProgressionStep[] = [
  { reps: 4, durationSeconds: 300, restSeconds: 120, paceFactor: 1.0 },  // L1: 4×5min
  { reps: 3, durationSeconds: 480, restSeconds: 120, paceFactor: 1.0 },  // L2: 3×8min
  { reps: 4, durationSeconds: 480, restSeconds: 120, paceFactor: 1.0 },  // L3: 4×8min
  { reps: 3, durationSeconds: 600, restSeconds: 120, paceFactor: 1.0 },  // L4: 3×10min
  { reps: 4, durationSeconds: 600, restSeconds: 120, paceFactor: 1.0 },  // L5: 4×10min
];

export const VO2MAX_RUN_LADDER: ProgressionStep[] = [
  { reps: 5, durationSeconds: 180, restSeconds: 120, paceFactor: 0.92 }, // L1: 5×3min
  { reps: 6, durationSeconds: 180, restSeconds: 120, paceFactor: 0.92 }, // L2: 6×3min
  { reps: 5, durationSeconds: 240, restSeconds: 150, paceFactor: 0.93 }, // L3: 5×4min
  { reps: 5, durationSeconds: 300, restSeconds: 180, paceFactor: 0.93 }, // L4: 5×5min
];

export const HILL_REPEATS_LADDER: ProgressionStep[] = [
  { reps: 6, durationSeconds: 60, restSeconds: 120, paceFactor: 0.90 },  // L1: 6×60s
  { reps: 8, durationSeconds: 60, restSeconds: 120, paceFactor: 0.90 },  // L2: 8×60s
  { reps: 6, durationSeconds: 90, restSeconds: 120, paceFactor: 0.90 },  // L3: 6×90s
  { reps: 8, durationSeconds: 90, restSeconds: 120, paceFactor: 0.90 },  // L4: 8×90s
];

// ============ LEVEL → PROGRESSION INDEX MAPPING ============

/**
 * Get the starting progression index for a given athlete level.
 * Returns an index into the progression ladder arrays.
 */
export function getProgressionIndex(
  level: AthleteLevel,
  ladder: ProgressionStep[]
): number {
  const maxIndex = ladder.length - 1;

  switch (level) {
    case "novice":
      return 0; // novice shouldn't do intervals, but if they do, start at L1
    case "beginner":
      return Math.min(0, maxIndex);
    case "intermediate":
      return Math.min(Math.floor(maxIndex * 0.4), maxIndex); // ~40% up the ladder
    case "advanced":
      return Math.min(Math.floor(maxIndex * 0.65), maxIndex); // ~65% up
    case "competitive":
      return Math.min(Math.floor(maxIndex * 0.85), maxIndex); // near top
  }
}

/**
 * Get the progression step for a given level from a ladder.
 */
export function getProgression(
  level: AthleteLevel,
  ladder: ProgressionStep[]
): ProgressionStep {
  return ladder[getProgressionIndex(level, ladder)];
}

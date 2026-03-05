/**
 * Periodization — Phase Planning
 *
 * Event mode: backward-plan from target event date.
 * Fitness gain mode: auto-progressive based on CTL + training age.
 *
 * Auto-progressive phases (determined by CTL + weeks training):
 * - Base 1: Z2 only (novices), aerobic foundation
 * - Base 2: Introduce sweet spot / tempo
 * - Base 3: Add tempo, longer sessions
 * - Build 1: Add threshold work
 * - Build 2: Add VO2max, peak volume
 * - Recovery weeks inserted per level pattern (2:1 / 3:1 / 4:1)
 *
 * Reference:
 * - Issurin (2010) "New Horizons for the Methodology of Training"
 * - Seiler (2010) "What is best practice for training intensity and duration?"
 * - Coggan/Allen: Training and Racing with Power
 */

import type { AthleteLevel } from "./progression";

export type Phase =
  | "base"
  | "build"
  | "peak"
  | "race"
  | "recovery"
  | "transition";

export type SubPhase =
  | "base1"
  | "base2"
  | "base3"
  | "build1"
  | "build2"
  | "peak"
  | "race"
  | "recovery"
  | "transition";

export type PhaseConfig = {
  phase: Phase;
  subPhase: SubPhase;
  weekNumber: number;
  totalWeeks: number;
  tssMultiplier: number; // applied to weeklyTargetTss from CTL formula
  intensityDistribution: {
    zone1_2Pct: number; // easy %
    zone3Pct: number; // tempo / sweet spot %
    zone4_5Pct: number; // threshold + VO2max %
  };
  keyWorkoutTypes: string[];
  description: string;
  level: AthleteLevel;
};

/** Phase multipliers (fraction of CTL-based weekly target TSS) */
const PHASE_MULTIPLIERS: Record<SubPhase, number> = {
  transition: 0.35,
  base1: 0.80,
  base2: 0.88,
  base3: 0.93,
  build1: 0.95,
  build2: 1.0,
  peak: 0.65,
  race: 0.45,
  recovery: 0.62,
};

/** Intensity distributions per sub-phase */
const PHASE_DISTRIBUTIONS: Record<SubPhase, PhaseConfig["intensityDistribution"]> = {
  transition: { zone1_2Pct: 95, zone3Pct: 5, zone4_5Pct: 0 },
  base1: { zone1_2Pct: 85, zone3Pct: 10, zone4_5Pct: 5 },
  base2: { zone1_2Pct: 80, zone3Pct: 15, zone4_5Pct: 5 },
  base3: { zone1_2Pct: 78, zone3Pct: 15, zone4_5Pct: 7 },
  build1: { zone1_2Pct: 72, zone3Pct: 12, zone4_5Pct: 16 },
  build2: { zone1_2Pct: 68, zone3Pct: 12, zone4_5Pct: 20 },
  peak: { zone1_2Pct: 65, zone3Pct: 10, zone4_5Pct: 25 },
  race: { zone1_2Pct: 70, zone3Pct: 10, zone4_5Pct: 20 },
  recovery: { zone1_2Pct: 92, zone3Pct: 8, zone4_5Pct: 0 },
};

/** Key workouts per sub-phase */
const PHASE_WORKOUTS: Record<SubPhase, string[]> = {
  transition: ["recovery_ride", "easy_run", "drill_technique"],
  base1: ["endurance_ride", "easy_run", "endurance_swim"],
  base2: ["endurance_ride", "sweet_spot", "easy_run", "endurance_swim"],
  base3: ["endurance_ride", "sweet_spot", "tempo_run", "endurance_swim", "threshold_swim"],
  build1: ["endurance_ride", "sweet_spot", "threshold_ride", "tempo_run", "threshold_intervals_run", "threshold_swim"],
  build2: ["endurance_ride", "threshold_ride", "vo2max_ride", "threshold_intervals_run", "vo2max_intervals_run", "vo2max_swim"],
  peak: ["vo2max_ride", "threshold_ride", "vo2max_intervals_run", "vo2max_swim"],
  race: ["endurance_ride", "threshold_ride", "easy_run", "threshold_swim"],
  recovery: ["recovery_ride", "easy_run", "endurance_swim", "drill_technique"],
};

/**
 * Detect the appropriate sub-phase for auto-progressive training.
 * Uses both CTL (current fitness) and training age (weeks since start).
 */
export function detectSubPhase(ctl: number, weeksSinceStart: number): SubPhase {
  // CTL < 30 or first 8 weeks: Base 1 (Z2 only for novices)
  if (ctl < 30 || weeksSinceStart < 8) {
    return "base1";
  }
  // CTL 30-50 or weeks 8-16: Base 2 (introduce sweet spot)
  if (ctl < 50 || weeksSinceStart < 16) {
    return "base2";
  }
  // CTL 50-60 or weeks 16-24: Base 3 (add tempo)
  if (ctl < 60 || weeksSinceStart < 24) {
    return "base3";
  }
  // CTL >= 60 and weeks > 24: Build 1 (add threshold)
  if (ctl < 75 || weeksSinceStart < 32) {
    return "build1";
  }
  // CTL >= 75 and weeks > 32: Build 2 (add VO2max)
  return "build2";
}

/**
 * Map sub-phase to base phase for DB storage.
 */
function subPhaseToPhase(sub: SubPhase): Phase {
  if (sub.startsWith("base")) return "base";
  if (sub.startsWith("build")) return "build";
  return sub as Phase;
}

/**
 * Recovery week pattern by athlete level.
 */
export function getRecoveryPattern(level: AthleteLevel): { loadWeeks: number; recoveryRatio: number } {
  switch (level) {
    case "novice":
      return { loadWeeks: 2, recoveryRatio: 0.62 }; // 2:1
    case "beginner":
      return { loadWeeks: 2, recoveryRatio: 0.62 }; // 2:1
    case "intermediate":
      return { loadWeeks: 3, recoveryRatio: 0.62 }; // 3:1
    case "advanced":
      return { loadWeeks: 4, recoveryRatio: 0.62 }; // 4:1
    case "competitive":
      return { loadWeeks: 4, recoveryRatio: 0.62 }; // 4:1
  }
}

/**
 * Check if current week is a recovery week.
 */
export function isRecoveryWeek(
  weeksSinceStart: number,
  pattern: { loadWeeks: number }
): boolean {
  const cycleLength = pattern.loadWeeks + 1; // e.g. 3:1 = cycle of 4
  const weekInCycle = weeksSinceStart % cycleLength;
  return weekInCycle === pattern.loadWeeks; // last week of cycle is recovery
}

/**
 * Generate auto-progressive plan phase config for the current week.
 *
 * Unlike the old version that always returned "build" phase, this detects
 * the appropriate sub-phase from CTL and training age, applies the right
 * phase multiplier, and inserts recovery weeks based on athlete level.
 */
export function generateAutoProgressivePlan(
  ctl: number,
  weeksSinceStart: number,
  level: AthleteLevel
): PhaseConfig {
  const pattern = getRecoveryPattern(level);
  const recovery = isRecoveryWeek(weeksSinceStart, pattern);

  const subPhase = recovery ? "recovery" : detectSubPhase(ctl, weeksSinceStart);
  const phase = recovery ? "recovery" : subPhaseToPhase(subPhase);
  const multiplier = PHASE_MULTIPLIERS[subPhase];
  const distribution = PHASE_DISTRIBUTIONS[subPhase];
  const workouts = PHASE_WORKOUTS[subPhase];

  const description = recovery
    ? `Recovery week — reduced to ${Math.round(multiplier * 100)}% volume, easy intensity only`
    : getPhaseDescription(subPhase);

  return {
    phase,
    subPhase,
    weekNumber: weeksSinceStart + 1,
    totalWeeks: 0, // unknown for auto-progressive
    tssMultiplier: multiplier,
    intensityDistribution: distribution,
    keyWorkoutTypes: workouts,
    description,
    level,
  };
}

function getPhaseDescription(subPhase: SubPhase): string {
  switch (subPhase) {
    case "base1":
      return "Base 1 — aerobic foundation, zone 2 focus. Building your engine.";
    case "base2":
      return "Base 2 — introducing sweet spot work alongside Z2 endurance.";
    case "base3":
      return "Base 3 — tempo and sweet spot sessions, longer endurance rides.";
    case "build1":
      return "Build 1 — threshold intervals added. Pushing your FTP higher.";
    case "build2":
      return "Build 2 — VO2max work added. Peak training volume.";
    default:
      return "Training continues.";
  }
}

// ============ EVENT PERIODIZATION ============

/**
 * Generate mesocycle phases working backward from event date.
 * Returns the current week's phase config.
 */
export function generateEventPeriodization(
  eventDate: Date,
  startDate: Date,
  level: AthleteLevel = "intermediate"
): PhaseConfig[] {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.floor(
    (eventDate.getTime() - startDate.getTime()) / msPerWeek
  );

  if (totalWeeks < 4) {
    return generateShortPlan(totalWeeks, level);
  }

  const phases: PhaseConfig[] = [];

  // Work backward from event
  const taperWeeks = totalWeeks >= 12 ? 2 : 1;
  const peakWeeks = totalWeeks >= 16 ? 3 : totalWeeks >= 10 ? 2 : 1;
  const buildWeeks = Math.min(
    Math.floor((totalWeeks - taperWeeks - peakWeeks) * 0.4),
    8
  );
  const baseWeeks = totalWeeks - taperWeeks - peakWeeks - buildWeeks;

  let weekNum = 1;
  const pattern = getRecoveryPattern(level);

  // Base phase
  for (let i = 0; i < baseWeeks; i++) {
    const recovery = isRecoveryWeek(i, pattern);
    const sub: SubPhase = recovery
      ? "recovery"
      : i < baseWeeks * 0.4
        ? "base1"
        : i < baseWeeks * 0.7
          ? "base2"
          : "base3";

    phases.push({
      phase: recovery ? "recovery" : "base",
      subPhase: sub,
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: recovery ? PHASE_MULTIPLIERS.recovery : PHASE_MULTIPLIERS[sub],
      intensityDistribution: PHASE_DISTRIBUTIONS[sub],
      keyWorkoutTypes: PHASE_WORKOUTS[sub],
      description: recovery
        ? "Recovery week — reduced volume, easy intensity"
        : getPhaseDescription(sub),
      level,
    });
  }

  // Build phase
  for (let i = 0; i < buildWeeks; i++) {
    const recovery = isRecoveryWeek(i, pattern);
    const sub: SubPhase = recovery
      ? "recovery"
      : i < buildWeeks * 0.5
        ? "build1"
        : "build2";

    phases.push({
      phase: recovery ? "recovery" : "build",
      subPhase: sub,
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: recovery ? PHASE_MULTIPLIERS.recovery : PHASE_MULTIPLIERS[sub],
      intensityDistribution: PHASE_DISTRIBUTIONS[sub],
      keyWorkoutTypes: PHASE_WORKOUTS[sub],
      description: recovery
        ? "Recovery week — absorb build-phase training"
        : getPhaseDescription(sub),
      level,
    });
  }

  // Peak phase — volume drops, intensity maintained
  for (let i = 0; i < peakWeeks; i++) {
    phases.push({
      phase: "peak",
      subPhase: "peak",
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: PHASE_MULTIPLIERS.peak,
      intensityDistribution: PHASE_DISTRIBUTIONS.peak,
      keyWorkoutTypes: PHASE_WORKOUTS.peak,
      description: "Peak phase — race-specific intensity, reduced volume",
      level,
    });
  }

  // Taper — evidence-based 41-60% exponential decrease, maintain intensity
  for (let i = 0; i < taperWeeks; i++) {
    const taperMultiplier = i === 0 ? 0.55 : 0.40; // progressive reduction
    phases.push({
      phase: "race",
      subPhase: "race",
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: taperMultiplier,
      intensityDistribution: PHASE_DISTRIBUTIONS.race,
      keyWorkoutTypes: PHASE_WORKOUTS.race,
      description:
        i === 0
          ? "Taper week — volume reduced ~45%, short sharp efforts to maintain fitness"
          : "Race week — volume reduced ~60%, openers and activation only",
      level,
    });
  }

  return phases;
}

function generateShortPlan(totalWeeks: number, level: AthleteLevel): PhaseConfig[] {
  const phases: PhaseConfig[] = [];
  for (let i = 1; i <= totalWeeks; i++) {
    if (i === totalWeeks) {
      phases.push({
        phase: "race",
        subPhase: "race",
        weekNumber: i,
        totalWeeks,
        tssMultiplier: PHASE_MULTIPLIERS.race,
        intensityDistribution: PHASE_DISTRIBUTIONS.race,
        keyWorkoutTypes: PHASE_WORKOUTS.race,
        description: "Race week — reduced volume, maintain intensity",
        level,
      });
    } else {
      phases.push({
        phase: "build",
        subPhase: "build1",
        weekNumber: i,
        totalWeeks,
        tssMultiplier: PHASE_MULTIPLIERS.build1,
        intensityDistribution: PHASE_DISTRIBUTIONS.build1,
        keyWorkoutTypes: PHASE_WORKOUTS.build1,
        description: "Short plan — mixed build training",
        level,
      });
    }
  }
  return phases;
}

/**
 * Workout Generator — Sport-Specific Structured Workouts
 *
 * All TSS is CALCULATED from workout structure, never hardcoded.
 * Workout difficulty is level-appropriate via progression ladders.
 *
 * TSS = Σ(segment_IF² × segment_hours) × 100
 *
 * Reference:
 * - Coggan power zones + TSS formula
 * - Seiler (2010) polarized training
 * - Billat: 30/30 VO2max intervals
 */

import type { WorkoutInterval } from "@/lib/db/schema/training";
import type { AthleteLevel } from "./progression";
import {
  getProgression,
  SWEET_SPOT_LADDER,
  THRESHOLD_LADDER,
  VO2MAX_LADDER,
  OVER_UNDER_LADDER,
  TEMPO_RUN_LADDER,
  THRESHOLD_RUN_LADDER,
  VO2MAX_RUN_LADDER,
  HILL_REPEATS_LADDER,
} from "./progression";
import type { SubPhase } from "./periodization";

type Sport = "cycling" | "running" | "swimming";

export type WorkoutTemplate = {
  sport: Sport;
  workoutType: string;
  title: string;
  description: string;
  targetDurationMinutes: number;
  targetTss: number;
  targetIf: number;
  structure: WorkoutInterval[];
  coachingTip: string;
  whyThisWorkout: string;
};

// ============ TSS CALCULATION ============

/**
 * Calculate TSS from a flat list of workout intervals.
 * TSS = Σ(IF² × hours) × 100
 */
export function calculateWorkoutTss(structure: WorkoutInterval[], ftp: number): number {
  let totalWeightedSeconds = 0;

  for (const interval of flattenIntervals(structure)) {
    const pctFtp = interval.powerTargetPctFtp ?? 0.65;
    totalWeightedSeconds += pctFtp * pctFtp * interval.durationSeconds;
  }

  return Math.round(totalWeightedSeconds / 36); // IF² × hours × 100
}

/**
 * Calculate running TSS from intervals using pace-based IF.
 * rTSS = IF² × hours × 100
 */
function calculateRunTss(structure: WorkoutInterval[], thresholdPace: number): number {
  let totalWeightedSeconds = 0;

  for (const interval of flattenIntervals(structure)) {
    const pace = interval.paceTargetSecPerKm ?? Math.round(thresholdPace * 1.2);
    const ifactor = thresholdPace / pace; // faster pace = higher IF
    totalWeightedSeconds += ifactor * ifactor * interval.durationSeconds;
  }

  return Math.round(totalWeightedSeconds / 36);
}

/**
 * Calculate swimming TSS. sTSS = IF³ × hours × 100
 */
function calculateSwimTss(structure: WorkoutInterval[], css: number): number {
  let totalWeightedSeconds = 0;

  for (const interval of flattenIntervals(structure)) {
    const pace = interval.paceTargetSecPer100m ?? Math.round(css * 1.15);
    const ifactor = css / pace;
    totalWeightedSeconds += ifactor * ifactor * ifactor * interval.durationSeconds;
  }

  return Math.round(totalWeightedSeconds / 36);
}

/**
 * Flatten nested intervals (handle repeat blocks).
 */
function flattenIntervals(structure: WorkoutInterval[]): WorkoutInterval[] {
  const flat: WorkoutInterval[] = [];

  for (const interval of structure) {
    if (interval.intervals && interval.repeat) {
      for (let r = 0; r < interval.repeat; r++) {
        flat.push(...flattenIntervals(interval.intervals));
      }
    } else {
      flat.push(interval);
    }
  }

  return flat;
}

/**
 * Calculate total duration of a workout structure in minutes.
 */
function totalDurationMinutes(structure: WorkoutInterval[]): number {
  return Math.round(
    flattenIntervals(structure).reduce((sum, i) => sum + i.durationSeconds, 0) / 60
  );
}

/**
 * Calculate overall IF from structure.
 */
function overallIf(structure: WorkoutInterval[]): number {
  const flat = flattenIntervals(structure);
  const totalSeconds = flat.reduce((sum, i) => sum + i.durationSeconds, 0);
  if (totalSeconds === 0) return 0;

  const weightedPower = flat.reduce((sum, i) => {
    const pct = i.powerTargetPctFtp ?? 0.65;
    return sum + pct * i.durationSeconds;
  }, 0);

  return weightedPower / totalSeconds;
}

// ============ CYCLING WORKOUTS ============

export function generateCyclingWorkout(
  type: string,
  ftp: number,
  targetTss: number,
  level: AthleteLevel,
  _subPhase: SubPhase = "base1"
): WorkoutTemplate {
  switch (type) {
    case "recovery_ride":
      return buildRecoveryRide(ftp);
    case "endurance_ride":
      return buildEnduranceRide(ftp, targetTss, false);
    case "long_endurance_ride":
      return buildEnduranceRide(ftp, targetTss, true);
    case "sweet_spot":
      return buildSweetSpot(ftp, level);
    case "threshold_ride":
      return buildThreshold(ftp, level);
    case "vo2max_ride":
      return buildVo2max(ftp, level);
    case "over_unders":
      return buildOverUnders(ftp, level);
    case "anaerobic_ride":
      return buildAnaerobicRide(ftp);
    case "sprint_ride":
      return buildSprintRide(ftp);
    default:
      return buildEnduranceRide(ftp, targetTss, false);
  }
}

function buildRecoveryRide(ftp: number): WorkoutTemplate {
  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 300, powerTargetPctFtp: 0.45 },
    { type: "work", durationSeconds: 1800, powerTargetPctFtp: 0.50, notes: "Easy spinning, keep it smooth" },
    { type: "cooldown", durationSeconds: 300, powerTargetPctFtp: 0.40 },
  ];

  return {
    sport: "cycling",
    workoutType: "recovery_ride",
    title: "Recovery Ride",
    description: "40min easy spin — legs loose, no hard efforts",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateWorkoutTss(structure, ftp),
    targetIf: overallIf(structure),
    structure,
    coachingTip: "Recovery rides should feel genuinely easy. If you're struggling to keep power low, that's a sign you need the recovery.",
    whyThisWorkout: "Active recovery promotes blood flow without adding training stress. Helps clear fatigue from hard sessions.",
  };
}

function buildEnduranceRide(ftp: number, targetTss: number, isLong: boolean): WorkoutTemplate {
  // Calculate duration from target TSS and Z2 IF (~0.68)
  const ifTarget = 0.68;
  const durationHours = targetTss / (ifTarget * ifTarget * 100);
  const durationMinutes = Math.max(60, Math.min(isLong ? 240 : 150, Math.round(durationHours * 60)));

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
    {
      type: "work",
      durationSeconds: (durationMinutes - 20) * 60,
      powerTargetPctFtp: ifTarget,
      notes: "Steady zone 2 effort, conversational pace",
    },
    { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.50 },
  ];

  const tss = calculateWorkoutTss(structure, ftp);

  return {
    sport: "cycling",
    workoutType: "endurance_ride",
    title: isLong ? "Long Endurance Ride" : "Endurance Ride",
    description: `${durationMinutes}min zone 2 endurance`,
    targetDurationMinutes: durationMinutes,
    targetTss: tss,
    targetIf: overallIf(structure),
    structure,
    coachingTip: isLong
      ? "Long rides build endurance. Fuel with carbs every 30min after the first hour. Stay hydrated."
      : "Zone 2 builds your aerobic engine. You should be able to hold a conversation. If you can't talk, you're going too hard.",
    whyThisWorkout: "Aerobic base training drives mitochondrial development and fat oxidation. The foundation for all other adaptations.",
  };
}

function buildSweetSpot(ftp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, SWEET_SPOT_LADDER);
  const pctFtp = prog.powerPctFtp ?? 0.90;

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
    {
      type: "work",
      durationSeconds: prog.durationSeconds,
      powerTargetPctFtp: pctFtp,
      repeat: prog.reps,
      intervals: [
        { type: "work", durationSeconds: prog.durationSeconds, powerTargetPctFtp: pctFtp, notes: "Sweet spot — hard but sustainable" },
        { type: "rest", durationSeconds: prog.restSeconds, powerTargetPctFtp: 0.50 },
      ],
    },
    { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.50 },
  ];

  const repLabel = `${prog.reps}×${Math.round(prog.durationSeconds / 60)}min`;

  return {
    sport: "cycling",
    workoutType: "sweet_spot",
    title: "Sweet Spot Intervals",
    description: `${repLabel} at ${Math.round(pctFtp * 100)}% FTP`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateWorkoutTss(structure, ftp),
    targetIf: overallIf(structure),
    structure,
    coachingTip: "Sweet spot training gives ~90% of the benefit of threshold work with much less fatigue. Great training efficiency.",
    whyThisWorkout: `Sweet spot (${Math.round(pctFtp * 100)}% FTP) maximizes aerobic adaptations while keeping recovery cost manageable.`,
  };
}

function buildThreshold(ftp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, THRESHOLD_LADDER);
  const pctFtp = prog.powerPctFtp ?? 1.0;

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
    {
      type: "work",
      durationSeconds: prog.durationSeconds,
      powerTargetPctFtp: pctFtp,
      repeat: prog.reps,
      intervals: [
        { type: "work", durationSeconds: prog.durationSeconds, powerTargetPctFtp: pctFtp, notes: "At or just below FTP" },
        { type: "rest", durationSeconds: prog.restSeconds, powerTargetPctFtp: 0.50 },
      ],
    },
    { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.50 },
  ];

  const repLabel = `${prog.reps}×${Math.round(prog.durationSeconds / 60)}min`;

  return {
    sport: "cycling",
    workoutType: "threshold_ride",
    title: "Threshold Intervals",
    description: `${repLabel} at ${Math.round(pctFtp * 100)}% FTP`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateWorkoutTss(structure, ftp),
    targetIf: overallIf(structure),
    structure,
    coachingTip: "Threshold work is hard by design. Target steady power — don't surge at the start. If you can't hold the power, drop by 5%.",
    whyThisWorkout: "Threshold intervals push your FTP up by training at the boundary of aerobic and anaerobic metabolism.",
  };
}

function buildVo2max(ftp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, VO2MAX_LADDER);
  const pctFtp = prog.powerPctFtp ?? 1.15;

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
    {
      type: "work",
      durationSeconds: prog.durationSeconds,
      powerTargetPctFtp: pctFtp,
      repeat: prog.reps,
      intervals: [
        { type: "work", durationSeconds: prog.durationSeconds, powerTargetPctFtp: pctFtp, notes: "Hard! Should be very uncomfortable" },
        { type: "rest", durationSeconds: prog.restSeconds, powerTargetPctFtp: 0.45 },
      ],
    },
    { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.50 },
  ];

  const repLabel = prog.durationSeconds >= 60
    ? `${prog.reps}×${Math.round(prog.durationSeconds / 60)}min`
    : `${prog.reps}×${prog.durationSeconds}s/${prog.restSeconds}s`;

  return {
    sport: "cycling",
    workoutType: "vo2max_ride",
    title: "VO2max Intervals",
    description: `${repLabel} at ${Math.round(pctFtp * 100)}% FTP`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateWorkoutTss(structure, ftp),
    targetIf: overallIf(structure),
    structure,
    coachingTip: "VO2max intervals should feel very hard — breathing heavily, wanting to stop. Full recovery between intervals.",
    whyThisWorkout: "VO2max training increases maximal oxygen uptake, the ceiling for all endurance performance.",
  };
}

function buildOverUnders(ftp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, OVER_UNDER_LADDER);
  const underPct = 0.90;
  const overPct = 1.10;

  // Each rep = one over-under block with alternating 3min under / 1min over
  const blockDuration = prog.durationSeconds;
  const cyclesPerBlock = Math.floor(blockDuration / 240); // each cycle = 4min (3+1)
  const blockIntervals: WorkoutInterval[] = [];
  for (let c = 0; c < cyclesPerBlock; c++) {
    blockIntervals.push(
      { type: "work", durationSeconds: 180, powerTargetPctFtp: underPct, notes: "Under — steady" },
      { type: "work", durationSeconds: 60, powerTargetPctFtp: overPct, notes: "Over — push!" }
    );
  }

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
    {
      type: "work",
      durationSeconds: blockDuration,
      powerTargetPctFtp: underPct,
      repeat: prog.reps,
      intervals: [
        ...blockIntervals,
        { type: "rest", durationSeconds: prog.restSeconds, powerTargetPctFtp: 0.50 },
      ],
    },
    { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.50 },
  ];

  return {
    sport: "cycling",
    workoutType: "threshold_ride", // maps to existing DB enum
    title: "Over-Under Intervals",
    description: `${prog.reps}×${Math.round(blockDuration / 60)}min over-unders (90%/110% FTP)`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateWorkoutTss(structure, ftp),
    targetIf: overallIf(structure),
    structure,
    coachingTip: "Over-unders teach your body to clear lactate while still riding hard. The 'overs' should feel tough but manageable.",
    whyThisWorkout: "Over-under intervals improve lactate clearance at threshold, making your FTP feel more sustainable.",
  };
}

function buildAnaerobicRide(ftp: number): WorkoutTemplate {
  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 900, powerTargetPctFtp: 0.55 },
    {
      type: "work",
      durationSeconds: 60,
      powerTargetPctFtp: 1.50,
      repeat: 8,
      intervals: [
        { type: "work", durationSeconds: 60, powerTargetPctFtp: 1.50, notes: "All out! 150% FTP" },
        { type: "rest", durationSeconds: 240, powerTargetPctFtp: 0.40 },
      ],
    },
    { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.50 },
  ];

  return {
    sport: "cycling",
    workoutType: "anaerobic_ride",
    title: "Anaerobic Repeats",
    description: "8×1min at 150% FTP, 4min recovery",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateWorkoutTss(structure, ftp),
    targetIf: overallIf(structure),
    structure,
    coachingTip: "These are maximal efforts. If you can't maintain target power, rest longer between reps.",
    whyThisWorkout: "Anaerobic capacity work improves your ability to sustain efforts above FTP, crucial for attacks and surges.",
  };
}

function buildSprintRide(ftp: number): WorkoutTemplate {
  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 900, powerTargetPctFtp: 0.55 },
    {
      type: "work",
      durationSeconds: 20,
      powerTargetPctFtp: 2.0,
      repeat: 6,
      intervals: [
        { type: "work", durationSeconds: 20, powerTargetPctFtp: 2.0, notes: "MAX EFFORT sprint!" },
        { type: "rest", durationSeconds: 300, powerTargetPctFtp: 0.40 },
      ],
    },
    { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.50 },
  ];

  return {
    sport: "cycling",
    workoutType: "sprint_ride",
    title: "Sprint Training",
    description: "6×20s max sprints, 5min recovery",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateWorkoutTss(structure, ftp),
    targetIf: overallIf(structure),
    structure,
    coachingTip: "Pure neuromuscular power. Go all-out for each sprint. Full recovery between — these should be fresh efforts.",
    whyThisWorkout: "Sprint training develops peak neuromuscular power and fast-twitch recruitment.",
  };
}

// ============ RUNNING WORKOUTS ============

export function generateRunningWorkout(
  type: string,
  thresholdPaceSecPerKm: number,
  targetTss: number,
  level: AthleteLevel,
  _subPhase: SubPhase = "base1"
): WorkoutTemplate {
  switch (type) {
    case "easy_run":
      return buildEasyRun(thresholdPaceSecPerKm, targetTss);
    case "long_run":
      return buildLongRun(thresholdPaceSecPerKm, targetTss);
    case "tempo_run":
      return buildTempoRun(thresholdPaceSecPerKm, level);
    case "threshold_intervals_run":
      return buildThresholdRun(thresholdPaceSecPerKm, level);
    case "vo2max_intervals_run":
      return buildVo2maxRun(thresholdPaceSecPerKm, level);
    case "hill_repeats":
      return buildHillRepeats(thresholdPaceSecPerKm, level);
    case "fartlek":
      return buildFartlek(thresholdPaceSecPerKm);
    default:
      return buildEasyRun(thresholdPaceSecPerKm, targetTss);
  }
}

function buildEasyRun(tp: number, targetTss: number): WorkoutTemplate {
  const easyPace = Math.round(tp * 1.20);
  // Duration from TSS: rTSS = IF² × hours × 100, IF = tp/easyPace
  const ifactor = tp / easyPace;
  const durationHours = targetTss / (ifactor * ifactor * 100);
  const durationMinutes = Math.max(30, Math.min(60, Math.round(durationHours * 60)));

  const structure: WorkoutInterval[] = [
    { type: "work", durationSeconds: durationMinutes * 60, paceTargetSecPerKm: easyPace, notes: "Conversational pace, relaxed" },
  ];

  return {
    sport: "running",
    workoutType: "easy_run",
    title: "Easy Run",
    description: `${durationMinutes}min easy effort`,
    targetDurationMinutes: durationMinutes,
    targetTss: calculateRunTss(structure, tp),
    targetIf: tp / easyPace,
    structure,
    coachingTip: "Easy runs build aerobic base without adding fatigue. Run by feel — if you can't talk, slow down.",
    whyThisWorkout: "80% of training should be easy. This builds mitochondrial density and aerobic capacity without injury risk.",
  };
}

function buildLongRun(tp: number, targetTss: number): WorkoutTemplate {
  const steadyPace = Math.round(tp * 1.15);
  const ifactor = tp / steadyPace;
  const durationHours = targetTss / (ifactor * ifactor * 100);
  const durationMinutes = Math.max(60, Math.min(150, Math.round(durationHours * 60)));

  const structure: WorkoutInterval[] = [
    { type: "work", durationSeconds: durationMinutes * 60, paceTargetSecPerKm: steadyPace, notes: "Steady effort, even splits" },
  ];

  return {
    sport: "running",
    workoutType: "long_run",
    title: "Long Run",
    description: `${durationMinutes}min steady endurance`,
    targetDurationMinutes: durationMinutes,
    targetTss: calculateRunTss(structure, tp),
    targetIf: tp / steadyPace,
    structure,
    coachingTip: "Start conservative. The last 30 minutes should feel harder but pace should stay even. Fuel with carbs if >90 minutes.",
    whyThisWorkout: "Long runs develop endurance, teach the body to burn fat, and build mental resilience for race day.",
  };
}

function buildTempoRun(tp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, TEMPO_RUN_LADDER);
  const tempoPace = Math.round(tp * (prog.paceFactor ?? 1.06));
  const warmCoolPace = Math.round(tp * 1.20);

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
    {
      type: "work",
      durationSeconds: prog.durationSeconds,
      paceTargetSecPerKm: tempoPace,
      notes: "Comfortably hard — you can say short sentences",
    },
    { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
  ];

  return {
    sport: "running",
    workoutType: "tempo_run",
    title: "Tempo Run",
    description: `${Math.round(prog.durationSeconds / 60)}min at tempo pace`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateRunTss(structure, tp),
    targetIf: tp / tempoPace,
    structure,
    coachingTip: "Tempo pace should feel comfortably hard. You can say short phrases but not hold a full conversation.",
    whyThisWorkout: "Tempo work improves lactate clearance and running economy at moderate intensity.",
  };
}

function buildThresholdRun(tp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, THRESHOLD_RUN_LADDER);
  const warmCoolPace = Math.round(tp * 1.20);
  const jogPace = Math.round(tp * 1.30);

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
    {
      type: "work",
      durationSeconds: prog.durationSeconds,
      paceTargetSecPerKm: tp,
      repeat: prog.reps,
      intervals: [
        { type: "work", durationSeconds: prog.durationSeconds, paceTargetSecPerKm: tp, notes: "At threshold — hard but controlled" },
        { type: "rest", durationSeconds: prog.restSeconds, paceTargetSecPerKm: jogPace },
      ],
    },
    { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
  ];

  const repLabel = `${prog.reps}×${Math.round(prog.durationSeconds / 60)}min`;

  return {
    sport: "running",
    workoutType: "threshold_intervals_run",
    title: "Threshold Intervals",
    description: `${repLabel} at threshold pace`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateRunTss(structure, tp),
    targetIf: 0.95,
    structure,
    coachingTip: "Threshold intervals build your ability to sustain a hard effort. Aim for even splits across all intervals.",
    whyThisWorkout: "Training at lactate threshold pace raises the speed you can sustain before lactate accumulation.",
  };
}

function buildVo2maxRun(tp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, VO2MAX_RUN_LADDER);
  const vo2Pace = Math.round(tp * (prog.paceFactor ?? 0.92));
  const warmCoolPace = Math.round(tp * 1.20);
  const jogPace = Math.round(tp * 1.30);

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
    {
      type: "work",
      durationSeconds: prog.durationSeconds,
      paceTargetSecPerKm: vo2Pace,
      repeat: prog.reps,
      intervals: [
        { type: "work", durationSeconds: prog.durationSeconds, paceTargetSecPerKm: vo2Pace, notes: "Hard effort — breathing heavily" },
        { type: "rest", durationSeconds: prog.restSeconds, paceTargetSecPerKm: jogPace },
      ],
    },
    { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
  ];

  const repLabel = `${prog.reps}×${Math.round(prog.durationSeconds / 60)}min`;

  return {
    sport: "running",
    workoutType: "vo2max_intervals_run",
    title: "VO2max Intervals",
    description: `${repLabel} at VO2max pace`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateRunTss(structure, tp),
    targetIf: 0.92,
    structure,
    coachingTip: "VO2max intervals are very hard. Focus on consistency — last interval should be as fast as the first.",
    whyThisWorkout: "VO2max training raises your aerobic ceiling. Essential for 5K-10K performance and overall fitness gains.",
  };
}

function buildHillRepeats(tp: number, level: AthleteLevel): WorkoutTemplate {
  const prog = getProgression(level, HILL_REPEATS_LADDER);
  const hillPace = Math.round(tp * (prog.paceFactor ?? 0.90));
  const warmCoolPace = Math.round(tp * 1.20);
  const jogPace = Math.round(tp * 1.40); // slow jog downhill

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
    {
      type: "work",
      durationSeconds: prog.durationSeconds,
      paceTargetSecPerKm: hillPace,
      repeat: prog.reps,
      intervals: [
        { type: "work", durationSeconds: prog.durationSeconds, paceTargetSecPerKm: hillPace, notes: "Hard uphill — drive with arms" },
        { type: "rest", durationSeconds: prog.restSeconds, paceTargetSecPerKm: jogPace },
      ],
    },
    { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
  ];

  const repLabel = `${prog.reps}×${prog.durationSeconds}s`;

  return {
    sport: "running",
    workoutType: "hill_repeats",
    title: "Hill Repeats",
    description: `${repLabel} uphill efforts`,
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateRunTss(structure, tp),
    targetIf: 0.88,
    structure,
    coachingTip: "Drive your knees up and pump your arms on the hills. Jog easily back down for recovery.",
    whyThisWorkout: "Hill repeats build running-specific strength, power, and VO2max with lower injury risk than flat intervals.",
  };
}

function buildFartlek(tp: number): WorkoutTemplate {
  const easyPace = Math.round(tp * 1.15);
  const surgePace = Math.round(tp * 0.95);
  const warmCoolPace = Math.round(tp * 1.20);

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
    {
      type: "work",
      durationSeconds: 120,
      paceTargetSecPerKm: surgePace,
      repeat: 6,
      intervals: [
        { type: "work", durationSeconds: 120, paceTargetSecPerKm: surgePace, notes: "Surge — hard but not all-out" },
        { type: "rest", durationSeconds: 180, paceTargetSecPerKm: easyPace },
      ],
    },
    { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: warmCoolPace },
  ];

  return {
    sport: "running",
    workoutType: "fartlek",
    title: "Fartlek Run",
    description: "6×2min surges with 3min easy jog",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateRunTss(structure, tp),
    targetIf: 0.85,
    structure,
    coachingTip: "Fartlek means 'speed play'. The surges should feel hard but fun — don't overthink the pace.",
    whyThisWorkout: "Fartlek introduces intensity in an unstructured way, great for building speed without the pressure of strict intervals.",
  };
}

// ============ SWIMMING WORKOUTS ============

export function generateSwimmingWorkout(
  type: string,
  cssSPer100m: number,
  targetTss: number,
  level: AthleteLevel,
  _subPhase: SubPhase = "base1"
): WorkoutTemplate {
  switch (type) {
    case "endurance_swim":
      return buildEnduranceSwim(cssSPer100m, targetTss);
    case "threshold_swim":
      return buildThresholdSwim(cssSPer100m, level);
    case "vo2max_swim":
      return buildVo2maxSwim(cssSPer100m, level);
    case "drill_technique":
      return buildDrillSession(cssSPer100m);
    case "sprint_swim":
      return buildSprintSwim(cssSPer100m);
    default:
      return buildEnduranceSwim(cssSPer100m, targetTss);
  }
}

function buildEnduranceSwim(css: number, targetTss: number): WorkoutTemplate {
  const aerobicPace = Math.round(css * 1.12);
  // Swim TSS calc is different (IF³), so estimate duration differently
  const ifactor = css / aerobicPace;
  const durationHours = targetTss / (ifactor * ifactor * ifactor * 100);
  const durationMinutes = Math.max(30, Math.min(60, Math.round(durationHours * 60)));

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 300, paceTargetSecPer100m: Math.round(css * 1.20), notes: "Easy warm-up" },
    {
      type: "work",
      durationSeconds: (durationMinutes - 10) * 60,
      paceTargetSecPer100m: aerobicPace,
      notes: "Steady aerobic pace — focus on form",
    },
    { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(css * 1.25), notes: "Easy cool-down" },
  ];

  return {
    sport: "swimming",
    workoutType: "endurance_swim",
    title: "Endurance Swim",
    description: `${durationMinutes}min steady aerobic swimming`,
    targetDurationMinutes: durationMinutes,
    targetTss: calculateSwimTss(structure, css),
    targetIf: ifactor,
    structure,
    coachingTip: "Focus on stroke efficiency. Count strokes per length — fewer strokes at the same speed = better technique.",
    whyThisWorkout: "Builds aerobic swimming fitness and reinforces good technique under low fatigue.",
  };
}

function buildThresholdSwim(css: number, _level: AthleteLevel): WorkoutTemplate {
  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPer100m: Math.round(css * 1.20) },
    {
      type: "work",
      durationSeconds: Math.round(css * 2),
      paceTargetSecPer100m: css,
      repeat: 8,
      intervals: [
        { type: "work", durationSeconds: Math.round(css * 2), paceTargetSecPer100m: css, notes: "Hold CSS pace — steady and controlled" },
        { type: "rest", durationSeconds: 20 },
      ],
    },
    { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(css * 1.20) },
  ];

  return {
    sport: "swimming",
    workoutType: "threshold_swim",
    title: "CSS Threshold Set",
    description: "8×200m at CSS pace, 20s rest",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateSwimTss(structure, css),
    targetIf: 1.0,
    structure,
    coachingTip: "CSS pace should feel sustainably hard. Consistent splits are the goal.",
    whyThisWorkout: "Training at CSS develops your aerobic threshold in the water.",
  };
}

function buildVo2maxSwim(css: number, _level: AthleteLevel): WorkoutTemplate {
  const fastPace = Math.round(css * 0.90);

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPer100m: Math.round(css * 1.20) },
    {
      type: "work",
      durationSeconds: fastPace,
      paceTargetSecPer100m: fastPace,
      repeat: 8,
      intervals: [
        { type: "work", durationSeconds: fastPace, paceTargetSecPer100m: fastPace, notes: "Hard effort — faster than CSS" },
        { type: "rest", durationSeconds: 30 },
      ],
    },
    { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(css * 1.20) },
  ];

  return {
    sport: "swimming",
    workoutType: "vo2max_swim",
    title: "VO2max Swim Set",
    description: "8×100m fast, 30s rest",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateSwimTss(structure, css),
    targetIf: 1.1,
    structure,
    coachingTip: "These should be hard. Maintain good form even when tired.",
    whyThisWorkout: "VO2max swim sets push your aerobic ceiling and improve speed at high intensities.",
  };
}

function buildDrillSession(css: number): WorkoutTemplate {
  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 300, paceTargetSecPer100m: Math.round(css * 1.30), notes: "Easy warm-up" },
    {
      type: "work",
      durationSeconds: 1800,
      paceTargetSecPer100m: Math.round(css * 1.20),
      notes: "Drill work: catch-up, finger-tip drag, fist drill, single-arm. Focus on feel.",
    },
    { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(css * 1.30) },
  ];

  return {
    sport: "swimming",
    workoutType: "drill_technique",
    title: "Technique & Drill Session",
    description: "Mixed drills, form work, and easy swimming",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateSwimTss(structure, css),
    targetIf: 0.7,
    structure,
    coachingTip: "Drill sessions aren't about speed. Concentrate on one thing per drill: catch, pull, rotation.",
    whyThisWorkout: "Technique is everything in swimming. Small improvements in form = big improvements in speed.",
  };
}

function buildSprintSwim(css: number): WorkoutTemplate {
  const sprintPace = Math.round(css * 0.80);

  const structure: WorkoutInterval[] = [
    { type: "warmup", durationSeconds: 600, paceTargetSecPer100m: Math.round(css * 1.20) },
    {
      type: "work",
      durationSeconds: Math.round(sprintPace * 0.5), // 50m rep
      paceTargetSecPer100m: sprintPace,
      repeat: 8,
      intervals: [
        { type: "work", durationSeconds: Math.round(sprintPace * 0.5), paceTargetSecPer100m: sprintPace, notes: "All-out sprint!" },
        { type: "rest", durationSeconds: 60 },
      ],
    },
    { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(css * 1.20) },
  ];

  return {
    sport: "swimming",
    workoutType: "sprint_swim",
    title: "Sprint Swim Set",
    description: "8×50m all-out sprints, 60s rest",
    targetDurationMinutes: totalDurationMinutes(structure),
    targetTss: calculateSwimTss(structure, css),
    targetIf: 1.2,
    structure,
    coachingTip: "Max effort each rep. Focus on explosive starts and maintaining stroke rate.",
    whyThisWorkout: "Sprint training develops neuromuscular power and fast-twitch recruitment in the water.",
  };
}

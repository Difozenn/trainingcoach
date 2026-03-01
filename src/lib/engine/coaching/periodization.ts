/**
 * Periodization — Phase Planning
 *
 * Event mode: backward-plan from target event date.
 * Fitness gain mode: auto-progressive or target-based.
 *
 * Phases:
 * - Base (6-12 weeks): Build aerobic foundation, Z1-Z2 focus, gradual volume
 * - Build (4-8 weeks): Introduce intensity, threshold + VO2max work
 * - Peak (2-4 weeks): Race-specific intensity, reduce volume slightly
 * - Taper (1-2 weeks): Dramatic volume reduction, maintain intensity
 * - Race: Event week
 * - Recovery (1-2 weeks): Easy, unstructured
 *
 * Auto-taper logic:
 * - 2 weeks out: -40-60% volume
 * - 1 week out: -60-80% volume
 * - Target race-day TSB: +5 to +15
 *
 * Reference:
 * - Issurin (2010) "New Horizons for the Methodology of Training"
 * - Seiler (2010) "What is best practice for training intensity and duration?"
 */

export type Phase =
  | "base"
  | "build"
  | "peak"
  | "race"
  | "recovery"
  | "transition";

export type PhaseConfig = {
  phase: Phase;
  weekNumber: number;
  totalWeeks: number;
  tssMultiplier: number; // relative to baseline
  intensityDistribution: {
    zone1_2Pct: number; // easy %
    zone3Pct: number; // tempo %
    zone4_5Pct: number; // hard %
  };
  keyWorkoutTypes: string[];
  description: string;
};

/**
 * Generate mesocycle phases working backward from event date.
 *
 * @param eventDate - Target event date
 * @param startDate - Start date for training plan
 * @returns Array of phase configurations, one per week
 */
export function generateEventPeriodization(
  eventDate: Date,
  startDate: Date
): PhaseConfig[] {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.floor(
    (eventDate.getTime() - startDate.getTime()) / msPerWeek
  );

  if (totalWeeks < 4) {
    // Too short — just build and taper
    return generateShortPlan(totalWeeks);
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

  // Base phase
  for (let i = 0; i < baseWeeks; i++) {
    const isRecoveryWeek = (i + 1) % 4 === 0;
    phases.push({
      phase: isRecoveryWeek ? "recovery" : "base",
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: isRecoveryWeek ? 0.6 : 0.7 + (i / baseWeeks) * 0.2,
      intensityDistribution: {
        zone1_2Pct: 80,
        zone3Pct: 15,
        zone4_5Pct: 5,
      },
      keyWorkoutTypes: ["endurance_ride", "long_run", "endurance_swim"],
      description: isRecoveryWeek
        ? "Recovery week — reduced volume, easy intensity"
        : "Base building — aerobic foundation, gradual volume increase",
    });
  }

  // Build phase
  for (let i = 0; i < buildWeeks; i++) {
    const isRecoveryWeek = (i + 1) % 4 === 0;
    phases.push({
      phase: isRecoveryWeek ? "recovery" : "build",
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: isRecoveryWeek ? 0.7 : 0.9 + (i / buildWeeks) * 0.15,
      intensityDistribution: {
        zone1_2Pct: 70,
        zone3Pct: 10,
        zone4_5Pct: 20,
      },
      keyWorkoutTypes: [
        "threshold_ride",
        "vo2max_ride",
        "tempo_run",
        "threshold_intervals_run",
        "threshold_swim",
      ],
      description: isRecoveryWeek
        ? "Recovery week — absorb build-phase training"
        : "Build phase — introducing threshold and VO2max work",
    });
  }

  // Peak phase
  for (let i = 0; i < peakWeeks; i++) {
    phases.push({
      phase: "peak",
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: 0.9 - (i / peakWeeks) * 0.1,
      intensityDistribution: {
        zone1_2Pct: 65,
        zone3Pct: 10,
        zone4_5Pct: 25,
      },
      keyWorkoutTypes: [
        "vo2max_ride",
        "threshold_ride",
        "vo2max_intervals_run",
        "vo2max_swim",
      ],
      description: "Peak phase — race-specific intensity, slightly reduced volume",
    });
  }

  // Taper
  for (let i = 0; i < taperWeeks; i++) {
    const volumeReduction = i === 0 ? 0.5 : 0.3; // -50% then -70%
    phases.push({
      phase: "race",
      weekNumber: weekNum++,
      totalWeeks,
      tssMultiplier: volumeReduction,
      intensityDistribution: {
        zone1_2Pct: 70,
        zone3Pct: 10,
        zone4_5Pct: 20,
      },
      keyWorkoutTypes: ["threshold_ride", "tempo_run", "threshold_swim"],
      description:
        i === 0
          ? "Taper week 2 — volume reduced 40-50%, keep some intensity"
          : "Race week — volume reduced 60-70%, short sharp efforts only",
    });
  }

  return phases;
}

function generateShortPlan(totalWeeks: number): PhaseConfig[] {
  const phases: PhaseConfig[] = [];
  for (let i = 1; i <= totalWeeks; i++) {
    if (i === totalWeeks) {
      phases.push({
        phase: "race",
        weekNumber: i,
        totalWeeks,
        tssMultiplier: 0.4,
        intensityDistribution: { zone1_2Pct: 70, zone3Pct: 10, zone4_5Pct: 20 },
        keyWorkoutTypes: ["threshold_ride", "tempo_run"],
        description: "Race week — reduced volume, maintain intensity",
      });
    } else {
      phases.push({
        phase: "build",
        weekNumber: i,
        totalWeeks,
        tssMultiplier: 0.85,
        intensityDistribution: { zone1_2Pct: 70, zone3Pct: 10, zone4_5Pct: 20 },
        keyWorkoutTypes: ["threshold_ride", "vo2max_ride", "tempo_run"],
        description: "Short plan — mixed build training",
      });
    }
  }
  return phases;
}

/**
 * Generate auto-progressive plan (no target event).
 * 3 weeks loading + 1 week recovery, repeating.
 * TSS increases 5-10% per loading block.
 */
export function generateAutoProgressivePlan(
  baseWeeklyTss: number,
  weeks: number
): PhaseConfig[] {
  const phases: PhaseConfig[] = [];

  for (let i = 0; i < weeks; i++) {
    const block = Math.floor(i / 4); // which 4-week block
    const weekInBlock = i % 4;
    const isRecoveryWeek = weekInBlock === 3;

    // 7.5% increase per 4-week block
    const progressionMultiplier = 1 + block * 0.075;
    const weekMultiplier = isRecoveryWeek ? 0.6 : progressionMultiplier;

    phases.push({
      phase: isRecoveryWeek ? "recovery" : "build",
      weekNumber: i + 1,
      totalWeeks: weeks,
      tssMultiplier: weekMultiplier,
      intensityDistribution: {
        zone1_2Pct: 75,
        zone3Pct: 10,
        zone4_5Pct: 15,
      },
      keyWorkoutTypes: isRecoveryWeek
        ? ["recovery_ride", "easy_run", "endurance_swim"]
        : [
            "endurance_ride",
            "threshold_ride",
            "long_run",
            "tempo_run",
            "endurance_swim",
          ],
      description: isRecoveryWeek
        ? `Recovery week — reduced to ${Math.round(weekMultiplier * baseWeeklyTss)} TSS`
        : `Progressive build — target ${Math.round(weekMultiplier * baseWeeklyTss)} TSS this week`,
    });
  }

  return phases;
}

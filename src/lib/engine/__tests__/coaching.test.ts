import { describe, it, expect } from "vitest";
import {
  checkSafety,
  checkHealth,
  getCoachingDecision,
} from "../coaching/decision-engine";
import type { AthleteState } from "../coaching/decision-engine";
import {
  generateEventPeriodization,
  generateAutoProgressivePlan,
} from "../coaching/periodization";
import {
  generateCyclingWorkout,
  generateRunningWorkout,
  generateSwimmingWorkout,
  calculateWorkoutTss,
} from "../coaching/workout-generator";
import { generateWeeklyPlan } from "../coaching/weekly-planner";

// ============ DECISION ENGINE ============

const healthyState: AthleteState = {
  ctl: 60,
  atl: 65,
  tsb: -5,
  rampRate: 5,
  consecutiveHardDays: 1,
  hrv7DayTrend: "stable",
  restingHrDelta: 0,
  sleepScore: 80,
  bodyBattery: 70,
};

describe("Decision Engine — Safety Layer", () => {
  it("proceeds when all metrics are normal", () => {
    const decision = checkSafety(healthyState);
    expect(decision.action).toBe("proceed");
    expect(decision.tsbMultiplier).toBe(1.0);
  });

  it("forces rest when TSB < -30", () => {
    const decision = checkSafety({ ...healthyState, tsb: -35 });
    expect(decision.action).toBe("force_rest");
    expect(decision.tsbMultiplier).toBeLessThanOrEqual(0.6);
  });

  it("emergency rest when TSB < -40", () => {
    const decision = checkSafety({ ...healthyState, tsb: -45 });
    expect(decision.action).toBe("force_rest");
    expect(decision.tsbMultiplier).toBe(0.4);
  });

  it("reduces intensity when ramp rate > 10%", () => {
    const decision = checkSafety({ ...healthyState, rampRate: 12 });
    expect(decision.action).toBe("reduce_intensity");
    expect(decision.tsbMultiplier).toBeLessThan(1.0);
  });

  it("forces rest after 3+ consecutive hard days", () => {
    const decision = checkSafety({ ...healthyState, consecutiveHardDays: 3 });
    expect(decision.action).toBe("force_rest");
    expect(decision.maxTssAllowed).toBe(40);
  });

  it("detects high ACWR (ATL/CTL > 1.5)", () => {
    const decision = checkSafety({ ...healthyState, ctl: 40, atl: 70 });
    expect(decision.action).toBe("reduce_intensity");
    expect(decision.tsbMultiplier).toBeLessThan(1.0);
  });

  it("detects extreme ACWR (ATL/CTL > 2.0)", () => {
    const decision = checkSafety({ ...healthyState, ctl: 30, atl: 65 });
    expect(decision.action).toBe("force_rest");
    expect(decision.tsbMultiplier).toBeLessThanOrEqual(0.5);
  });
});

describe("Decision Engine — Health Layer", () => {
  it("proceeds when health metrics are good", () => {
    const decision = checkHealth(healthyState);
    expect(decision.action).toBe("proceed");
    expect(decision.tsbMultiplier).toBe(1.0);
  });

  it("forces rest when HRV declining + poor sleep", () => {
    const decision = checkHealth({
      ...healthyState,
      hrv7DayTrend: "declining",
      sleepScore: 50,
    });
    expect(decision.action).toBe("force_rest");
    expect(decision.tsbMultiplier).toBeLessThanOrEqual(0.5);
  });

  it("reduces intensity when HRV declining alone", () => {
    const decision = checkHealth({
      ...healthyState,
      hrv7DayTrend: "declining",
      sleepScore: 80,
    });
    expect(decision.action).toBe("reduce_intensity");
  });

  it("reduces intensity when resting HR elevated > 5bpm", () => {
    const decision = checkHealth({ ...healthyState, restingHrDelta: 7 });
    expect(decision.action).toBe("reduce_intensity");
  });

  it("forces rest when body battery < 25", () => {
    const decision = checkHealth({ ...healthyState, bodyBattery: 20 });
    expect(decision.action).toBe("force_rest");
  });
});

describe("Decision Engine — Combined", () => {
  it("safety override beats health proceed", () => {
    const decision = getCoachingDecision({ ...healthyState, tsb: -35 });
    expect(decision.action).toBe("force_rest");
    expect(decision.tsbMultiplier).toBeLessThanOrEqual(0.6);
  });

  it("health override beats safety proceed", () => {
    const decision = getCoachingDecision({
      ...healthyState,
      hrv7DayTrend: "declining",
      sleepScore: 40,
    });
    expect(decision.action).toBe("force_rest");
  });

  it("returns proceed when both layers are clear", () => {
    const decision = getCoachingDecision(healthyState);
    expect(decision.action).toBe("proceed");
    expect(decision.tsbMultiplier).toBe(1.0);
  });

  it("uses most restrictive multiplier", () => {
    const decision = getCoachingDecision({
      ...healthyState,
      tsb: -35,
      hrv7DayTrend: "declining",
      sleepScore: 40,
    });
    // Both layers should return force_rest, multiplier should be minimum of both
    expect(decision.tsbMultiplier).toBeLessThanOrEqual(0.5);
  });
});

// ============ PERIODIZATION ============

describe("Event Periodization", () => {
  it("generates phases for 16-week plan", () => {
    const start = new Date("2026-01-01");
    const event = new Date("2026-04-23"); // ~16 weeks
    const phases = generateEventPeriodization(event, start);
    expect(phases.length).toBe(16);
    expect(phases[0].phase).toMatch(/base|build|recovery/);
    expect(phases[phases.length - 1].phase).toBe("race");
  });

  it("includes recovery weeks", () => {
    const start = new Date("2026-01-01");
    const event = new Date("2026-06-01"); // ~21 weeks
    const phases = generateEventPeriodization(event, start);
    const recoveryWeeks = phases.filter((p) => p.phase === "recovery");
    expect(recoveryWeeks.length).toBeGreaterThan(0);
  });

  it("handles short plans (< 4 weeks)", () => {
    const start = new Date("2026-01-01");
    const event = new Date("2026-01-22"); // 3 weeks
    const phases = generateEventPeriodization(event, start);
    expect(phases.length).toBe(3);
    expect(phases[phases.length - 1].phase).toBe("race");
  });

  it("taper weeks have lower TSS multiplier", () => {
    const start = new Date("2026-01-01");
    const event = new Date("2026-04-23");
    const phases = generateEventPeriodization(event, start);
    const racePhases = phases.filter((p) => p.phase === "race");
    for (const rp of racePhases) {
      expect(rp.tssMultiplier).toBeLessThanOrEqual(0.55);
    }
  });

  it("includes subPhase and level in config", () => {
    const start = new Date("2026-01-01");
    const event = new Date("2026-04-23");
    const phases = generateEventPeriodization(event, start, "advanced");
    expect(phases[0].subPhase).toBeDefined();
    expect(phases[0].level).toBe("advanced");
  });
});

describe("Auto-Progressive Plan", () => {
  it("returns base1 for low CTL", () => {
    const phase = generateAutoProgressivePlan(20, 4, "beginner");
    expect(phase.subPhase).toBe("base1");
    expect(phase.phase).toBe("base");
  });

  it("returns base2 for moderate CTL after 8 weeks", () => {
    const phase = generateAutoProgressivePlan(35, 10, "intermediate");
    expect(phase.subPhase).toBe("base2");
  });

  it("returns build phases for high CTL and training age", () => {
    const phase = generateAutoProgressivePlan(65, 26, "advanced");
    expect(phase.subPhase).toMatch(/build/);
  });

  it("inserts recovery weeks per level pattern", () => {
    // Intermediate: 3:1 pattern, recovery at week 3 (0-indexed)
    const phase = generateAutoProgressivePlan(50, 3, "intermediate");
    expect(phase.phase).toBe("recovery");
  });

  it("recovery weeks have reduced multiplier", () => {
    const phase = generateAutoProgressivePlan(50, 3, "intermediate");
    expect(phase.tssMultiplier).toBeLessThan(0.7);
  });
});

// ============ WORKOUT GENERATOR ============

describe("Cycling Workout Generator", () => {
  it("generates recovery ride with calculated TSS", () => {
    const workout = generateCyclingWorkout("recovery_ride", 250, 30, "beginner");
    expect(workout.sport).toBe("cycling");
    expect(workout.workoutType).toBe("recovery_ride");
    expect(workout.targetIf).toBeLessThan(0.7);
    expect(workout.targetTss).toBeGreaterThan(0);
    expect(workout.structure.length).toBeGreaterThan(0);
  });

  it("generates progressive sweet spot based on level", () => {
    const beginner = generateCyclingWorkout("sweet_spot", 250, 60, "beginner");
    const advanced = generateCyclingWorkout("sweet_spot", 250, 60, "advanced");
    // Advanced should have longer/harder intervals
    expect(advanced.targetTss).toBeGreaterThanOrEqual(beginner.targetTss);
  });

  it("generates threshold intervals", () => {
    const workout = generateCyclingWorkout("threshold_ride", 250, 70, "intermediate");
    expect(workout.targetIf).toBeGreaterThanOrEqual(0.7);
    expect(workout.structure.length).toBeGreaterThanOrEqual(3);
  });

  it("generates VO2max intervals", () => {
    const workout = generateCyclingWorkout("vo2max_ride", 250, 60, "intermediate");
    const hasHighPower = workout.structure.some(
      (s) => s.intervals?.some((i) => (i.powerTargetPctFtp ?? 0) > 1.0)
    );
    expect(hasHighPower).toBe(true);
  });

  it("defaults to endurance for unknown type", () => {
    const workout = generateCyclingWorkout("unknown_type", 250, 50, "intermediate");
    expect(workout.workoutType).toBe("endurance_ride");
  });

  it("calculateWorkoutTss matches formula", () => {
    // Simple structure: 1 hour at FTP (IF=1.0) should be TSS=100
    const structure = [
      { type: "work" as const, durationSeconds: 3600, powerTargetPctFtp: 1.0 },
    ];
    const tss = calculateWorkoutTss(structure, 250);
    expect(tss).toBe(100);
  });
});

describe("Running Workout Generator", () => {
  it("generates easy run", () => {
    const workout = generateRunningWorkout("easy_run", 270, 40, "beginner");
    expect(workout.sport).toBe("running");
    expect(workout.targetIf).toBeLessThan(0.9);
  });

  it("generates threshold intervals with pace targets", () => {
    const workout = generateRunningWorkout("threshold_intervals_run", 270, 60, "intermediate");
    expect(workout.structure.length).toBeGreaterThanOrEqual(3);
    const hasThresholdPace = workout.structure.some(
      (s) => s.intervals?.some((i) => i.paceTargetSecPerKm === 270)
    );
    expect(hasThresholdPace).toBe(true);
  });

  it("generates fartlek", () => {
    const workout = generateRunningWorkout("fartlek", 270, 50, "beginner");
    expect(workout.workoutType).toBe("fartlek");
    expect(workout.targetTss).toBeGreaterThan(0);
  });

  it("generates hill repeats", () => {
    const workout = generateRunningWorkout("hill_repeats", 270, 50, "intermediate");
    expect(workout.workoutType).toBe("hill_repeats");
  });

  it("defaults to easy run for unknown type", () => {
    const workout = generateRunningWorkout("bogus", 270, 40, "beginner");
    expect(workout.workoutType).toBe("easy_run");
  });
});

describe("Swimming Workout Generator", () => {
  it("generates endurance swim", () => {
    const workout = generateSwimmingWorkout("endurance_swim", 95, 30, "beginner");
    expect(workout.sport).toBe("swimming");
    expect(workout.structure.length).toBeGreaterThan(0);
  });

  it("generates threshold swim with CSS pace", () => {
    const workout = generateSwimmingWorkout("threshold_swim", 95, 50, "intermediate");
    const hasCSS = workout.structure.some(
      (s) => s.intervals?.some((i) => i.paceTargetSecPer100m === 95)
    );
    expect(hasCSS).toBe(true);
  });

  it("generates drill/technique session", () => {
    const workout = generateSwimmingWorkout("drill_technique", 95, 20, "beginner");
    expect(workout.targetTss).toBeLessThan(50);
    expect(workout.targetIf).toBeLessThan(0.8);
  });

  it("generates sprint swim", () => {
    const workout = generateSwimmingWorkout("sprint_swim", 95, 40, "competitive");
    expect(workout.workoutType).toBe("sprint_swim");
    expect(workout.targetTss).toBeGreaterThan(0);
  });
});

// ============ WEEKLY PLANNER ============

describe("Weekly Planner", () => {
  it("generates a workout pool for single sport", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling"],
      subPhase: "base1",
      weeklyTargetTss: 300,
      weeklyHoursAvailable: 10,
      athleteState: healthyState,
      level: "intermediate",
      ftp: 250,
    });
    expect(plan.targetTss).toBe(300);
    expect(plan.workouts.length).toBeGreaterThan(0);
    expect(plan.restDays).toBeGreaterThanOrEqual(1);
    expect(plan.workouts.every((w) => w.sport === "cycling")).toBe(true);
  });

  it("generates multi-sport workouts", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling", "running", "swimming"],
      subPhase: "build2",
      weeklyTargetTss: 400,
      weeklyHoursAvailable: 12,
      athleteState: healthyState,
      level: "intermediate",
      ftp: 250,
      thresholdPaceSecPerKm: 270,
      cssSPer100m: 95,
    });
    const sports = new Set(plan.workouts.map((w) => w.sport));
    expect(sports.size).toBeGreaterThan(1);
  });

  it("novice gets zero hard sessions", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling"],
      subPhase: "base1",
      weeklyTargetTss: 120,
      weeklyHoursAvailable: 5,
      athleteState: { ...healthyState, ctl: 10 },
      level: "novice",
      ftp: 200,
    });
    // All workouts should be endurance/recovery (no threshold/VO2max/sweet spot)
    const hardTypes = ["threshold_ride", "vo2max_ride", "sweet_spot", "anaerobic_ride"];
    const hasHardWorkout = plan.workouts.some((w) => hardTypes.includes(w.workoutType));
    expect(hasHardWorkout).toBe(false);
  });

  it("intermediate gets hard sessions in build phase", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling"],
      subPhase: "build2",
      weeklyTargetTss: 400,
      weeklyHoursAvailable: 10,
      athleteState: healthyState,
      level: "intermediate",
      ftp: 250,
    });
    const hardTypes = ["threshold_ride", "vo2max_ride", "sweet_spot"];
    const hasHardWorkout = plan.workouts.some((w) => hardTypes.includes(w.workoutType));
    expect(hasHardWorkout).toBe(true);
  });

  it("includes adaptation notes", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling"],
      subPhase: "base1",
      weeklyTargetTss: 300,
      weeklyHoursAvailable: 10,
      athleteState: healthyState,
      level: "intermediate",
      ftp: 250,
    });
    expect(plan.adaptationNotes).toBeTruthy();
  });
});

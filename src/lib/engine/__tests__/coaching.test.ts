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
  });

  it("forces rest when TSB < -30", () => {
    const decision = checkSafety({ ...healthyState, tsb: -35 });
    expect(decision.action).toBe("force_rest");
    expect(decision.maxTssAllowed).toBe(30);
  });

  it("reduces intensity when ramp rate > 10%", () => {
    const decision = checkSafety({ ...healthyState, rampRate: 12 });
    expect(decision.action).toBe("reduce_intensity");
  });

  it("forces rest after 3+ consecutive hard days", () => {
    const decision = checkSafety({ ...healthyState, consecutiveHardDays: 3 });
    expect(decision.action).toBe("force_rest");
    expect(decision.maxTssAllowed).toBe(40);
  });
});

describe("Decision Engine — Health Layer", () => {
  it("proceeds when health metrics are good", () => {
    const decision = checkHealth(healthyState);
    expect(decision.action).toBe("proceed");
  });

  it("forces rest when HRV declining + poor sleep", () => {
    const decision = checkHealth({
      ...healthyState,
      hrv7DayTrend: "declining",
      sleepScore: 50,
    });
    expect(decision.action).toBe("force_rest");
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

  it("includes recovery weeks every 4th week in base", () => {
    const start = new Date("2026-01-01");
    const event = new Date("2026-06-01"); // ~21 weeks
    const phases = generateEventPeriodization(event, start);
    const baseRecoveryWeeks = phases.filter(
      (p) => p.phase === "recovery" && p.weekNumber <= 12
    );
    expect(baseRecoveryWeeks.length).toBeGreaterThan(0);
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
      expect(rp.tssMultiplier).toBeLessThanOrEqual(0.5);
    }
  });
});

describe("Auto-Progressive Plan", () => {
  it("generates correct number of weeks", () => {
    const phases = generateAutoProgressivePlan(400, 12);
    expect(phases).toHaveLength(12);
  });

  it("every 4th week is recovery", () => {
    const phases = generateAutoProgressivePlan(400, 12);
    expect(phases[3].phase).toBe("recovery");
    expect(phases[7].phase).toBe("recovery");
    expect(phases[11].phase).toBe("recovery");
  });

  it("recovery weeks have lower TSS multiplier", () => {
    const phases = generateAutoProgressivePlan(400, 8);
    const recovery = phases.filter((p) => p.phase === "recovery");
    for (const r of recovery) {
      expect(r.tssMultiplier).toBe(0.6);
    }
  });

  it("TSS multiplier increases across blocks", () => {
    const phases = generateAutoProgressivePlan(400, 12);
    // Week 1 (block 0) vs week 5 (block 1)
    expect(phases[4].tssMultiplier).toBeGreaterThan(phases[0].tssMultiplier);
  });
});

// ============ WORKOUT GENERATOR ============

describe("Cycling Workout Generator", () => {
  it("generates recovery ride", () => {
    const workout = generateCyclingWorkout("recovery_ride", 250);
    expect(workout.sport).toBe("cycling");
    expect(workout.workoutType).toBe("recovery_ride");
    expect(workout.targetIf).toBeLessThan(0.7);
    expect(workout.structure.length).toBeGreaterThan(0);
  });

  it("generates threshold intervals", () => {
    const workout = generateCyclingWorkout("threshold_ride", 250);
    expect(workout.targetIf).toBeGreaterThanOrEqual(0.9);
    expect(workout.structure.length).toBeGreaterThanOrEqual(3);
  });

  it("generates VO2max intervals", () => {
    const workout = generateCyclingWorkout("vo2max_ride", 250);
    const hasHighPower = workout.structure.some(
      (s) => s.intervals?.some((i) => (i.powerTargetPctFtp ?? 0) > 1.0)
    );
    expect(hasHighPower).toBe(true);
  });

  it("defaults to endurance for unknown type", () => {
    const workout = generateCyclingWorkout("unknown_type", 250);
    expect(workout.workoutType).toBe("endurance_ride");
  });
});

describe("Running Workout Generator", () => {
  it("generates easy run", () => {
    const workout = generateRunningWorkout("easy_run", 270);
    expect(workout.sport).toBe("running");
    expect(workout.targetIf).toBeLessThan(0.8);
  });

  it("generates threshold intervals with pace targets", () => {
    const workout = generateRunningWorkout("threshold_intervals_run", 270);
    expect(workout.structure.length).toBeGreaterThanOrEqual(3);
    // Should have work intervals at threshold pace
    const hasThresholdPace = workout.structure.some(
      (s) => s.intervals?.some((i) => i.paceTargetSecPerKm === 270)
    );
    expect(hasThresholdPace).toBe(true);
  });

  it("defaults to easy run for unknown type", () => {
    const workout = generateRunningWorkout("bogus", 270);
    expect(workout.workoutType).toBe("easy_run");
  });
});

describe("Swimming Workout Generator", () => {
  it("generates endurance swim", () => {
    const workout = generateSwimmingWorkout("endurance_swim", 95);
    expect(workout.sport).toBe("swimming");
    expect(workout.structure.length).toBeGreaterThan(0);
  });

  it("generates threshold swim with CSS pace", () => {
    const workout = generateSwimmingWorkout("threshold_swim", 95);
    const hasCSS = workout.structure.some(
      (s) => s.intervals?.some((i) => i.paceTargetSecPer100m === 95)
    );
    expect(hasCSS).toBe(true);
  });

  it("generates drill/technique session", () => {
    const workout = generateSwimmingWorkout("drill_technique", 95);
    expect(workout.targetTss).toBeLessThan(30);
    expect(workout.targetIf).toBeLessThan(0.8);
  });
});

// ============ WEEKLY PLANNER ============

describe("Weekly Planner", () => {
  it("generates a workout pool for single sport", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling"],
      phase: "base",
      baseWeeklyTss: 400,
      tssMultiplier: 1.0,
      weeklyHoursAvailable: 10,
      athleteState: healthyState,
      ftp: 250,
    });
    expect(plan.targetTss).toBeGreaterThan(0);
    expect(plan.workouts.length).toBeGreaterThan(0);
    expect(plan.restDays).toBeGreaterThanOrEqual(1);
    expect(plan.workouts.every((w) => w.sport === "cycling")).toBe(true);
  });

  it("generates multi-sport workouts", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling", "running", "swimming"],
      phase: "build",
      baseWeeklyTss: 500,
      tssMultiplier: 1.0,
      weeklyHoursAvailable: 12,
      athleteState: healthyState,
      ftp: 250,
      thresholdPaceSecPerKm: 270,
      cssSPer100m: 95,
    });
    const sports = new Set(plan.workouts.map((w) => w.sport));
    expect(sports.size).toBeGreaterThan(1);
  });

  it("reduces TSS when force_rest decision", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling"],
      phase: "build",
      baseWeeklyTss: 500,
      tssMultiplier: 1.0,
      weeklyHoursAvailable: 10,
      athleteState: { ...healthyState, tsb: -35 },
      ftp: 250,
    });
    // Should be 40% of 500 = 200
    expect(plan.targetTss).toBeLessThanOrEqual(210);
  });

  it("reduces TSS when reduce_intensity decision", () => {
    const normal = generateWeeklyPlan({
      sports: ["cycling"],
      phase: "build",
      baseWeeklyTss: 500,
      tssMultiplier: 1.0,
      weeklyHoursAvailable: 10,
      athleteState: healthyState,
      ftp: 250,
    });
    const reduced = generateWeeklyPlan({
      sports: ["cycling"],
      phase: "build",
      baseWeeklyTss: 500,
      tssMultiplier: 1.0,
      weeklyHoursAvailable: 10,
      athleteState: { ...healthyState, rampRate: 12 },
      ftp: 250,
    });
    expect(reduced.targetTss).toBeLessThan(normal.targetTss);
  });

  it("includes adaptation notes", () => {
    const plan = generateWeeklyPlan({
      sports: ["cycling"],
      phase: "base",
      baseWeeklyTss: 400,
      tssMultiplier: 1.0,
      weeklyHoursAvailable: 10,
      athleteState: healthyState,
      ftp: 250,
    });
    expect(plan.adaptationNotes).toBeTruthy();
  });
});

/**
 * Daily Macro Targets — Live TSS-Based
 *
 * Computes nutrition targets from actual training stress, not pre-planned.
 * Includes weight-loss deficit when athlete is above ideal weight.
 *
 * References:
 * - Impey et al. (2018) "Fuel for the work required" (FFTWR)
 * - ISSN Position Stand on nutrition (2024 update)
 * - Stellingwerff et al. (2019) periodized nutrition for endurance
 * - Mujika et al. (2018) safe weight loss in athletes
 */

export type TrainingDayType =
  | "rest"
  | "easy"
  | "endurance"
  | "hard"
  | "race"
  | "carb_load";

export type MacroTargets = {
  carbsGrams: number;
  proteinGrams: number;
  fatGrams: number;
  totalCalories: number;
  carbsPerKg: number;
  proteinPerKg: number;
  fatPerKg: number;
  trainingDayType: TrainingDayType;
  deficit: number; // kcal deficit applied (0 if none)
  explanation: string;
};

type MacroRanges = {
  carbsPerKg: [number, number];
  proteinPerKg: [number, number];
  fatPerKg: [number, number];
};

/**
 * Macro ranges by training day type (g/kg body weight).
 *
 * Sources:
 * - Rest/easy: ACSM general guidelines, lowered for deficit-friendly days
 * - Endurance: ISSN 2024
 * - Hard intervals: UCI 2025 Morton et al.
 * - Race/4hr+: Pro peloton data, UCI 2025
 */
const MACRO_RANGES: Record<TrainingDayType, MacroRanges> = {
  rest: {
    carbsPerKg: [1.5, 2.5],
    proteinPerKg: [1.8, 2.0], // higher protein on rest to aid recovery
    fatPerKg: [0.8, 1.0],
  },
  easy: {
    carbsPerKg: [3.0, 4.0],
    proteinPerKg: [1.6, 1.8],
    fatPerKg: [0.8, 1.0],
  },
  endurance: {
    carbsPerKg: [5, 7],
    proteinPerKg: [1.6, 1.8],
    fatPerKg: [0.9, 1.1],
  },
  hard: {
    carbsPerKg: [7, 9],
    proteinPerKg: [1.8, 2.0],
    fatPerKg: [0.9, 1.1],
  },
  race: {
    carbsPerKg: [10, 12],
    proteinPerKg: [1.8, 2.0],
    fatPerKg: [1.0, 1.2],
  },
  carb_load: {
    carbsPerKg: [8, 10],
    proteinPerKg: [1.6, 1.8],
    fatPerKg: [0.8, 1.0],
  },
};

const DAY_TYPE_LABELS: Record<TrainingDayType, string> = {
  rest: "Rest day",
  easy: "Easy / recovery",
  endurance: "Endurance session",
  hard: "Hard intervals",
  race: "Race / 4hr+",
  carb_load: "Carb loading",
};

/**
 * Determine training day type from actual TSS.
 */
export function getTrainingDayType(tss: number): TrainingDayType {
  if (tss === 0) return "rest";
  if (tss < 60) return "easy";
  if (tss < 150) return "endurance";
  if (tss < 250) return "hard";
  return "race";
}

/**
 * After a hard week, rest day nutrition shifts: more protein, moderate carbs
 * for glycogen replenishment and muscle repair.
 */
function adjustForWeeklyLoad(
  dayType: TrainingDayType,
  weeklyTss: number
): TrainingDayType {
  // Hard week (>400 TSS) + rest day → upgrade to easy-level fueling
  // so the athlete recovers properly instead of under-eating
  if (dayType === "rest" && weeklyTss > 400) return "easy";
  return dayType;
}

/**
 * Calculate ideal weight from height using a simple formula.
 * height_cm - 100 = ideal weight in kg.
 * This is approximate — used only for mild deficit calculation.
 */
export function getIdealWeight(heightCm: number): number {
  return heightCm - 100;
}

/**
 * Calculate daily deficit based on weight vs ideal weight.
 * 250 kcal/day ≈ 0.25kg/week loss — safe for athletes.
 * Only applied on rest/easy days. Hard training days = full fuel.
 */
export function getWeightDeficit(
  weightKg: number,
  heightCm: number | null,
  dayType: TrainingDayType
): number {
  if (!heightCm) return 0;

  const ideal = getIdealWeight(heightCm);
  if (weightKg <= ideal) return 0;

  // Only apply deficit on rest and easy days — fuel hard days fully
  if (dayType === "rest" || dayType === "easy") return 250;

  return 0;
}

/**
 * Calculate daily macro targets from actual TSS.
 */
export function calculateDailyMacros(
  weightKg: number,
  dayType: TrainingDayType,
  options?: {
    heightCm?: number | null;
    weeklyTss?: number;
  }
): MacroTargets {
  const weeklyTss = options?.weeklyTss ?? 0;

  // Adjust day type based on weekly load context
  const adjustedType = adjustForWeeklyLoad(dayType, weeklyTss);
  const ranges = MACRO_RANGES[adjustedType];

  // Use midpoint of ranges
  const carbsPerKg = (ranges.carbsPerKg[0] + ranges.carbsPerKg[1]) / 2;
  const proteinPerKg = (ranges.proteinPerKg[0] + ranges.proteinPerKg[1]) / 2;
  const fatPerKg = (ranges.fatPerKg[0] + ranges.fatPerKg[1]) / 2;

  const carbsGrams = Math.round(weightKg * carbsPerKg);
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const fatGrams = Math.round(weightKg * fatPerKg);

  // Base calories
  let totalCalories = Math.round(
    carbsGrams * 4 + proteinGrams * 4 + fatGrams * 9
  );

  // Weight-loss deficit
  const deficit = getWeightDeficit(
    weightKg,
    options?.heightCm ?? null,
    adjustedType
  );
  totalCalories = Math.max(1200, totalCalories - deficit);

  // Explanation
  const parts: string[] = [DAY_TYPE_LABELS[adjustedType]];
  if (adjustedType !== dayType && dayType === "rest") {
    parts.push("(recovery fueling — hard week)");
  }

  return {
    carbsGrams,
    proteinGrams,
    fatGrams,
    totalCalories,
    carbsPerKg: Math.round(carbsPerKg * 10) / 10,
    proteinPerKg: Math.round(proteinPerKg * 10) / 10,
    fatPerKg: Math.round(fatPerKg * 10) / 10,
    trainingDayType: adjustedType,
    deficit,
    explanation: parts.join(" \u00B7 "),
  };
}

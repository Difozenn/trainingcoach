/**
 * Daily Macro Targets — FFTWR Framework
 *
 * Periodized nutrition based on training day type.
 * No food logging — display targets only.
 *
 * References:
 * - Impey et al. (2018) "Fuel for the work required" (FFTWR)
 * - Morton et al. (2025) UCI consensus on athlete nutrition
 * - ISSN Position Stand on nutrition (2024 update)
 * - ACSM Joint Position Statement on nutrition for athletes
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
 * - Rest/easy: ACSM general guidelines
 * - Endurance: ISSN 2024
 * - Hard intervals: UCI 2025 Morton et al.
 * - Race/4hr+: Pro peloton data, UCI 2025
 * - Carb load (3d pre-race): Morton 2025
 */
const MACRO_RANGES: Record<TrainingDayType, MacroRanges> = {
  rest: {
    carbsPerKg: [3, 4],
    proteinPerKg: [1.8, 2.0],
    fatPerKg: [1.0, 1.2],
  },
  easy: {
    carbsPerKg: [4, 5],
    proteinPerKg: [1.6, 1.8],
    fatPerKg: [1.0, 1.2],
  },
  endurance: {
    carbsPerKg: [5, 7],
    proteinPerKg: [1.6, 1.8],
    fatPerKg: [1.0, 1.2],
  },
  hard: {
    carbsPerKg: [8, 10],
    proteinPerKg: [1.8, 2.0],
    fatPerKg: [1.0, 1.2],
  },
  race: {
    carbsPerKg: [10, 12],
    proteinPerKg: [1.8, 2.0],
    fatPerKg: [1.0, 1.2],
  },
  carb_load: {
    carbsPerKg: [7, 10],
    proteinPerKg: [1.6, 1.6],
    fatPerKg: [1.0, 1.0],
  },
};

const DAY_TYPE_DESCRIPTIONS: Record<TrainingDayType, string> = {
  rest: "Rest day — lower carbs, maintenance protein",
  easy: "Easy/recovery day — moderate carbs, good protein",
  endurance: "Endurance day (2-3hr) — elevated carbs to fuel aerobic work",
  hard: "Hard training day — high carbs to fuel intense intervals and recovery",
  race: "Race or 4hr+ day — maximum carb loading for peak performance",
  carb_load:
    "Carb loading (3 days pre-race) — elevated carbs, moderate other macros",
};

/**
 * Determine training day type from planned TSS.
 */
export function getTrainingDayType(plannedTss: number): TrainingDayType {
  if (plannedTss === 0) return "rest";
  if (plannedTss < 60) return "easy";
  if (plannedTss < 150) return "endurance";
  if (plannedTss < 250) return "hard";
  return "race";
}

/**
 * Calculate daily macro targets.
 *
 * @param weightKg - Athlete body weight in kg
 * @param dayType - Training day type
 * @returns Macro targets in grams and total calories
 */
export function calculateDailyMacros(
  weightKg: number,
  dayType: TrainingDayType
): MacroTargets {
  const ranges = MACRO_RANGES[dayType];

  // Use midpoint of ranges
  const carbsPerKg = (ranges.carbsPerKg[0] + ranges.carbsPerKg[1]) / 2;
  const proteinPerKg = (ranges.proteinPerKg[0] + ranges.proteinPerKg[1]) / 2;
  const fatPerKg = (ranges.fatPerKg[0] + ranges.fatPerKg[1]) / 2;

  const carbsGrams = Math.round(weightKg * carbsPerKg);
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const fatGrams = Math.round(weightKg * fatPerKg);

  // Calories: carbs 4 kcal/g, protein 4 kcal/g, fat 9 kcal/g
  const totalCalories = Math.round(
    carbsGrams * 4 + proteinGrams * 4 + fatGrams * 9
  );

  // Plain-English summary
  const explanation =
    `${DAY_TYPE_DESCRIPTIONS[dayType]}. ` +
    `Today: ~${carbsGrams}g carbs, ${proteinGrams}g protein, ` +
    `${fatGrams}g fat = ~${totalCalories.toLocaleString()} calories.`;

  return {
    carbsGrams,
    proteinGrams,
    fatGrams,
    totalCalories,
    carbsPerKg: Math.round(carbsPerKg * 10) / 10,
    proteinPerKg: Math.round(proteinPerKg * 10) / 10,
    fatPerKg: Math.round(fatPerKg * 10) / 10,
    trainingDayType: dayType,
    explanation,
  };
}

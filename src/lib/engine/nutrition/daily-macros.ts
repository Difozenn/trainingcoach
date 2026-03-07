/**
 * Daily Macro Targets — BMR + TDEE Model
 *
 * Computes nutrition from BMR (Mifflin-St Jeor) + actual exercise calories,
 * with periodized macro splits by training day type.
 *
 * References:
 * - Mifflin-St Jeor (1990): most accurate BMR predictor
 * - kJ ≈ kcal for cycling (CTS, TrainingPeaks)
 * - ISSN Position Stand (2024): protein 1.4-2.0 g/kg
 * - Impey et al. (2018) "Fuel for the work required"
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
  deficit: number;
  explanation: string;
};

/**
 * Macro split percentages by training day type.
 * [carb%, protein%, fat%] — must sum to 100.
 */
const MACRO_SPLITS: Record<TrainingDayType, [number, number, number]> = {
  rest:      [37, 33, 30],
  easy:      [47, 28, 25],
  endurance: [57, 23, 20],
  hard:      [62, 20, 18],
  race:      [67, 18, 15],
  carb_load: [65, 18, 17],
};

export const DAY_TYPE_LABELS: Record<TrainingDayType, string> = {
  rest: "Rest",
  easy: "Low load",
  endurance: "Moderate load",
  hard: "High load",
  race: "Very high load",
  carb_load: "Carb loading",
};

/** Protein floor: minimum g/kg regardless of percentage split */
const PROTEIN_FLOOR_G_KG = 1.6;
/** Protein cap: diminishing returns above this */
const PROTEIN_CAP_G_KG = 2.2;

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
 * BMR via Mifflin-St Jeor equation.
 * Falls back to weight-only estimate when age/sex unavailable.
 */
export function calculateBmr(
  weightKg: number,
  heightCm: number | null,
  age: number | null,
  sex: "male" | "female" | null
): number {
  if (heightCm && age && sex) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === "male" ? base + 5 : base - 161;
  }
  // Fallback: rough estimate (Katch-McArdle simplified)
  return 22 * weightKg;
}

/**
 * Ideal weight from height (Devine formula simplified).
 * height_cm - 100 = approximate ideal weight.
 */
export function getIdealWeight(heightCm: number): number {
  return heightCm - 100;
}

/**
 * Weight for BMR calculation: average of current and ideal when overweight.
 * Prevents BMR from being inflated by excess body fat.
 */
function getBmrWeight(weightKg: number, heightCm: number | null): number {
  if (!heightCm) return weightKg;
  const ideal = getIdealWeight(heightCm);
  if (weightKg <= ideal) return weightKg;
  return (weightKg + ideal) / 2;
}

/**
 * Deficit on rest/easy days when overweight.
 * 250 kcal/day on rest/easy — safe for athletes.
 */
export function getWeightDeficit(
  weightKg: number,
  heightCm: number | null,
  dayType: TrainingDayType
): number {
  if (!heightCm) return 0;
  const ideal = getIdealWeight(heightCm);
  if (weightKg <= ideal) return 0;
  if (dayType === "rest" || dayType === "easy") return 250;
  return 0;
}

/**
 * After a hard week, rest day → easy-level fueling for proper recovery.
 */
function adjustForWeeklyLoad(
  dayType: TrainingDayType,
  weeklyTss: number
): TrainingDayType {
  if (dayType === "rest" && weeklyTss > 400) return "easy";
  return dayType;
}

/**
 * Calculate daily macro targets from BMR + actual exercise calories.
 *
 * TDEE = (BMR × 1.3 + exerciseCal) × 1.1
 *   - BMR × 1.3 = NEAT (sedentary multiplier, training added separately)
 *   - × 1.1 = TEF (thermic effect of food ~10%)
 *   - exerciseCal: kJ from power data (kJ ≈ kcal for cycling)
 */
export function calculateDailyMacros(
  weightKg: number,
  dayType: TrainingDayType,
  options?: {
    heightCm?: number | null;
    age?: number | null;
    sex?: "male" | "female" | null;
    exerciseCal?: number;
    weeklyTss?: number;
  }
): MacroTargets {
  const heightCm = options?.heightCm ?? null;
  const age = options?.age ?? null;
  const sex = options?.sex ?? null;
  const exerciseCal = options?.exerciseCal ?? 0;
  const weeklyTss = options?.weeklyTss ?? 0;

  // Adjust day type based on weekly load context
  const adjustedType = adjustForWeeklyLoad(dayType, weeklyTss);

  // BMR using adjusted weight (average of current+ideal when overweight)
  const bmrWeight = getBmrWeight(weightKg, heightCm);
  const bmr = calculateBmr(bmrWeight, heightCm, age, sex);

  // Simple model: BMR + exercise calories burned
  // Deficit applied on rest/easy days when overweight
  const deficit = getWeightDeficit(weightKg, heightCm, adjustedType);
  let tdee = Math.max(1200, Math.round(bmr + exerciseCal - deficit));

  // Macro split by day type
  const [carbPct, protPct, fatPct] = MACRO_SPLITS[adjustedType];

  // Start with percentage-based macros
  let proteinGrams = Math.round((tdee * protPct / 100) / 4);
  let carbsGrams = Math.round((tdee * carbPct / 100) / 4);
  let fatGrams = Math.round((tdee * fatPct / 100) / 9);

  // Enforce protein floor and cap
  const proteinFloor = Math.round(weightKg * PROTEIN_FLOOR_G_KG);
  const proteinCap = Math.round(weightKg * PROTEIN_CAP_G_KG);
  if (proteinGrams < proteinFloor) {
    const extraProteinCal = (proteinFloor - proteinGrams) * 4;
    proteinGrams = proteinFloor;
    // Reduce carbs to compensate
    carbsGrams = Math.max(50, carbsGrams - Math.round(extraProteinCal / 4));
  }
  if (proteinGrams > proteinCap) {
    proteinGrams = proteinCap;
  }

  // Recalculate total from actual grams
  const totalCalories = carbsGrams * 4 + proteinGrams * 4 + fatGrams * 9;

  // Explanation
  const parts: string[] = [DAY_TYPE_LABELS[adjustedType]];
  if (adjustedType !== dayType && dayType === "rest") {
    parts.push("(recovery fueling \u2014 hard week)");
  }

  return {
    carbsGrams,
    proteinGrams,
    fatGrams,
    totalCalories,
    carbsPerKg: Math.round((carbsGrams / weightKg) * 10) / 10,
    proteinPerKg: Math.round((proteinGrams / weightKg) * 10) / 10,
    fatPerKg: Math.round((fatGrams / weightKg) * 10) / 10,
    trainingDayType: adjustedType,
    deficit,
    explanation: parts.join(" \u00B7 "),
  };
}

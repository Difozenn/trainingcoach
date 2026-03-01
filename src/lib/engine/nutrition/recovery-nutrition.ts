/**
 * Recovery Nutrition — Post-Workout Window
 *
 * Evidence-based recovery nutrition targets:
 * - Protein: 0.4-0.5g/kg within 2 hours post-exercise
 * - Carbs: 1.0-1.2g/kg within 2 hours (glycogen resynthesis)
 * - Timing: First 30 min is optimal, but 2hr window is practical
 *
 * References:
 * - ISSN Position Stand on Nutrient Timing (2024)
 * - Kerksick et al. (2017) Journal of ISSN
 * - Moore et al. (2015) Protein requirements in athletes
 */

export type RecoveryNutrition = {
  proteinGrams: number;
  carbsGrams: number;
  windowMinutes: number;
  explanation: string;
};

/**
 * Calculate post-workout recovery nutrition targets.
 *
 * @param weightKg - Body weight in kg
 * @param durationMinutes - Workout duration in minutes
 * @param tss - Training Stress Score of the workout
 * @returns Recovery nutrition targets
 */
export function calculateRecoveryNutrition(
  weightKg: number,
  durationMinutes: number,
  tss: number
): RecoveryNutrition {
  // Protein: 0.4-0.5g/kg (higher for harder sessions)
  const proteinPerKg = tss > 100 ? 0.5 : 0.4;
  const proteinGrams = Math.round(weightKg * proteinPerKg);

  // Carbs: 1.0-1.2g/kg (higher for longer/harder sessions)
  let carbsPerKg: number;
  if (durationMinutes < 60 && tss < 50) {
    carbsPerKg = 0.5; // Easy session — minimal recovery carbs
  } else if (tss > 150) {
    carbsPerKg = 1.2; // Hard session — maximize glycogen resynthesis
  } else {
    carbsPerKg = 1.0;
  }
  const carbsGrams = Math.round(weightKg * carbsPerKg);

  // Recovery window
  const windowMinutes = 120; // 2 hours

  // Plain-English
  let explanation: string;
  if (durationMinutes < 60 && tss < 50) {
    explanation =
      `Easy session — have a small recovery snack: ~${proteinGrams}g protein ` +
      `and ~${carbsGrams}g carbs within 2 hours. Your next meal can cover this.`;
  } else {
    explanation =
      `Post-workout: aim for ~${proteinGrams}g protein and ~${carbsGrams}g carbs ` +
      `within 2 hours. The sooner the better for glycogen replenishment. ` +
      `A protein shake with banana, or chocolate milk, covers this well.`;
  }

  return {
    proteinGrams,
    carbsGrams,
    windowMinutes,
    explanation,
  };
}

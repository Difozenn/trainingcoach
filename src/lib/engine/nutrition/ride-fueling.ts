/**
 * Ride/Run Fueling Calculator
 *
 * During-exercise carbohydrate and fluid recommendations.
 *
 * Key 2025 update: glucose:fructose ratio is now 1:0.8 (not the old 2:1).
 * This allows higher total carb absorption via separate transporters.
 *
 * References:
 * - Sports Medicine 2025: High-carb during exercise review
 * - UCI 2025 Morton et al. consensus
 * - ACSM Joint Position Statement
 * - Jeukendrup (2014): Multiple transportable carbohydrates
 */

export type FuelingPlan = {
  durationMinutes: number;
  carbsPerHour: number;
  totalCarbsGrams: number;
  glucoseFructoseRatio: string;
  hydrationMlPerHour: number;
  sodiumMgPerHour: number;
  timingGuide: { minuteMark: number; carbsGrams: number; fluidMl: number }[];
  explanation: string;
};

type IntensityLevel = "easy" | "moderate" | "hard" | "race";

/**
 * Calculate fueling plan for a workout.
 *
 * @param durationMinutes - Planned workout duration in minutes
 * @param intensity - Intensity level
 * @param isGutTrained - Whether athlete has practiced high-carb intake
 * @returns Fueling plan with timing guide
 */
export function calculateFuelingPlan(
  durationMinutes: number,
  intensity: IntensityLevel = "moderate",
  isGutTrained = false
): FuelingPlan {
  // Determine carbs/hr based on duration and intensity
  let carbsPerHour: number;
  let ratio: string;

  if (durationMinutes < 60) {
    // < 1hr: mouth rinse or 0-30g
    carbsPerHour = intensity === "race" ? 30 : 0;
    ratio = "single source OK";
  } else if (durationMinutes < 150) {
    // 1-2.5hr: 30-60g/hr
    carbsPerHour = intensity === "easy" ? 30 : 60;
    ratio = "single or mixed source";
  } else if (durationMinutes < 180) {
    // 2.5-3hr: 60-90g/hr, mixed source required
    carbsPerHour = intensity === "easy" ? 60 : 90;
    ratio = "1:0.8 glucose:fructose";
  } else {
    // 3hr+: 90-120g/hr for gut-trained athletes
    if (isGutTrained) {
      carbsPerHour = intensity === "race" ? 120 : 100;
    } else {
      carbsPerHour = 90;
    }
    ratio = "1:0.8 maltodextrin:fructose";
  }

  // Total carbs
  const durationHours = durationMinutes / 60;
  const totalCarbsGrams = Math.round(carbsPerHour * durationHours);

  // Hydration: 200-250ml every 15-20 minutes ≈ 750-1000ml/hr
  const hydrationMlPerHour = 800; // moderate climate default

  // Sodium: 600-1000mg/hr
  const sodiumMgPerHour = 800;

  // Generate timing guide (every 20 minutes)
  const timingGuide: FuelingPlan["timingGuide"] = [];
  const feedingInterval = 20; // minutes
  const carbsPerFeeding = Math.round(
    (carbsPerHour / 60) * feedingInterval
  );
  const fluidPerFeeding = Math.round(
    (hydrationMlPerHour / 60) * feedingInterval
  );

  for (
    let minute = feedingInterval;
    minute <= durationMinutes;
    minute += feedingInterval
  ) {
    timingGuide.push({
      minuteMark: minute,
      carbsGrams: carbsPerFeeding,
      fluidMl: fluidPerFeeding,
    });
  }

  // Build explanation
  let explanation: string;
  if (durationMinutes < 60) {
    explanation =
      "Short session — water is sufficient. A small carb snack is optional for high-intensity efforts.";
  } else if (durationMinutes < 150) {
    explanation = `Aim for ${carbsPerHour}g carbs/hr. A gel or energy bar every 30 min works well. Sip ${hydrationMlPerHour}ml fluid/hr.`;
  } else {
    explanation =
      `Aim for ${carbsPerHour}g carbs/hr using a ${ratio} mix. ` +
      `This maximizes absorption through both SGLT1 and GLUT5 transporters. ` +
      `Drink ${hydrationMlPerHour}ml/hr with ${sodiumMgPerHour}mg sodium/hr.`;
  }

  return {
    durationMinutes,
    carbsPerHour,
    totalCarbsGrams,
    glucoseFructoseRatio: ratio,
    hydrationMlPerHour,
    sodiumMgPerHour,
    timingGuide,
    explanation,
  };
}

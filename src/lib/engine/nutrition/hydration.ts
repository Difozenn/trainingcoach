/**
 * Hydration Calculator
 *
 * Guidelines for fluid and electrolyte intake during exercise.
 *
 * Base recommendation: 200-250ml every 15-20 minutes.
 * Adjusted for temperature and humidity.
 *
 * References:
 * - ACSM Position Stand on Exercise and Fluid Replacement (2007, still current)
 * - Sawka et al. (2007) Exercise and Fluid Replacement
 */

export type HydrationPlan = {
  fluidPerHourMl: number;
  sodiumPerHourMg: number;
  totalFluidMl: number;
  totalSodiumMg: number;
  explanation: string;
};

type Conditions = {
  temperatureCelsius?: number;
  humidityPercent?: number;
};

/**
 * Calculate hydration targets for a workout.
 *
 * @param durationMinutes - Workout duration
 * @param conditions - Environmental conditions (optional)
 * @returns Hydration plan
 */
export function calculateHydration(
  durationMinutes: number,
  conditions?: Conditions
): HydrationPlan {
  // Base: 600-800ml/hr
  let fluidPerHourMl = 700;

  // Adjust for temperature
  const temp = conditions?.temperatureCelsius;
  if (temp !== undefined) {
    if (temp > 30) {
      fluidPerHourMl = 1000; // Hot
    } else if (temp > 25) {
      fluidPerHourMl = 900; // Warm
    } else if (temp < 10) {
      fluidPerHourMl = 500; // Cold
    }
  }

  // Adjust for humidity
  const humidity = conditions?.humidityPercent;
  if (humidity !== undefined && humidity > 70) {
    fluidPerHourMl = Math.round(fluidPerHourMl * 1.15); // +15% for high humidity
  }

  // Sodium: 600-1000mg/hr depending on sweat rate
  // Heavy sweaters may need 1000-1500mg/hr
  let sodiumPerHourMg = 800;
  if (temp !== undefined && temp > 28) {
    sodiumPerHourMg = 1000;
  }

  const durationHours = durationMinutes / 60;
  const totalFluidMl = Math.round(fluidPerHourMl * durationHours);
  const totalSodiumMg = Math.round(sodiumPerHourMg * durationHours);

  const explanation =
    `Drink ~${Math.round(fluidPerHourMl / 4)}ml every 15 minutes ` +
    `(${fluidPerHourMl}ml/hr). Include ${sodiumPerHourMg}mg sodium/hr ` +
    `via electrolyte drink or salt capsules.`;

  return {
    fluidPerHourMl,
    sodiumPerHourMg,
    totalFluidMl,
    totalSodiumMg,
    explanation,
  };
}

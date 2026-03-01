/**
 * Swimming Training Stress Score (sTSS)
 *
 * sTSS = IF³ × duration_hours × 100
 *
 * IMPORTANT: sTSS uses IF **CUBED** (not squared like cycling/running).
 *
 * Rationale: Water resistance increases with the cube of velocity,
 * so the metabolic cost of swimming faster scales cubically.
 * A 10% increase in swimming speed requires ~33% more power.
 *
 * Reference: swimanalytics.app sTSS model;
 * Toussaint & Hollander (1994) "Energetics of competitive swimming"
 */

import { calculateSwimmingIF } from "./css";

export type STSSResult = {
  stss: number;
  avgPaceSPer100m: number;
  intensityFactor: number;
};

/**
 * Calculate sTSS from swimming data.
 *
 * @param distanceMeters - Total distance swum in meters
 * @param durationSeconds - Total duration in seconds
 * @param cssSPer100m - Critical Swim Speed in seconds per 100m
 * @returns sTSS result or null if invalid
 */
export function calculateSTSS(
  distanceMeters: number,
  durationSeconds: number,
  cssSPer100m: number
): STSSResult | null {
  if (distanceMeters <= 0 || durationSeconds <= 0 || cssSPer100m <= 0) {
    return null;
  }

  // Calculate actual pace
  const avgPaceSPer100m = (durationSeconds / distanceMeters) * 100;
  const intensityFactor = calculateSwimmingIF(avgPaceSPer100m, cssSPer100m);
  const durationHours = durationSeconds / 3600;

  // sTSS = IF³ × hours × 100 (CUBED, not squared!)
  const stss = intensityFactor ** 3 * durationHours * 100;

  return {
    stss: Math.round(stss * 10) / 10,
    avgPaceSPer100m: Math.round(avgPaceSPer100m * 10) / 10,
    intensityFactor: Math.round(intensityFactor * 1000) / 1000,
  };
}

/**
 * Estimate sTSS from summary data.
 */
export function estimateSTSSFromPace(
  avgPaceSPer100m: number,
  durationSeconds: number,
  cssSPer100m: number
): number {
  if (cssSPer100m <= 0 || avgPaceSPer100m <= 0) return 0;
  const intensityFactor = calculateSwimmingIF(avgPaceSPer100m, cssSPer100m);
  const durationHours = durationSeconds / 3600;
  return Math.round(intensityFactor ** 3 * durationHours * 100 * 10) / 10;
}

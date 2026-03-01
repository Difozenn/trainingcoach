/**
 * Running Training Stress Score (rTSS)
 *
 * rTSS = IF² × duration_hours × 100
 *
 * Where IF = NGP_speed / threshold_speed
 * (NGP = Normalized Graded Pace)
 *
 * Note: rTSS uses IF SQUARED (same as cycling TSS).
 * This differs from sTSS for swimming which uses IF CUBED.
 *
 * Reference: TrainingPeaks rTSS documentation;
 * Skiba et al. "Modeling the expenditure and reconstitution of work capacity"
 */

import {
  calculateNGP,
  calculateRunningIF,
} from "./normalized-graded-pace";

export type RTSSResult = {
  rtss: number;
  ngpSecPerKm: number;
  intensityFactor: number;
};

/**
 * Calculate rTSS from speed and grade stream data.
 *
 * @param speedStream - Speed in m/s per second
 * @param gradeStream - Grade in % per second (optional)
 * @param thresholdPaceSecPerKm - Threshold pace in seconds per km
 * @returns rTSS result or null if insufficient data
 */
export function calculateRTSS(
  speedStream: number[],
  thresholdPaceSecPerKm: number,
  gradeStream?: number[]
): RTSSResult | null {
  if (thresholdPaceSecPerKm <= 0) return null;

  const ngp = calculateNGP(speedStream, gradeStream);
  if (ngp === null) return null;

  const intensityFactor = calculateRunningIF(ngp, thresholdPaceSecPerKm);
  const durationSeconds = speedStream.length;
  const durationHours = durationSeconds / 3600;

  // rTSS = IF² × hours × 100
  const rtss = intensityFactor ** 2 * durationHours * 100;

  return {
    rtss: Math.round(rtss * 10) / 10,
    ngpSecPerKm: ngp,
    intensityFactor: Math.round(intensityFactor * 1000) / 1000,
  };
}

/**
 * Estimate rTSS from average pace (less accurate).
 */
export function estimateRTSSFromAvgPace(
  avgPaceSecPerKm: number,
  durationSeconds: number,
  thresholdPaceSecPerKm: number
): number {
  if (thresholdPaceSecPerKm <= 0 || avgPaceSecPerKm <= 0) return 0;
  const intensityFactor = calculateRunningIF(
    avgPaceSecPerKm,
    thresholdPaceSecPerKm
  );
  const durationHours = durationSeconds / 3600;
  return Math.round(intensityFactor ** 2 * durationHours * 100 * 10) / 10;
}

/**
 * Estimate threshold pace from best 30-40 minute run effort.
 * Threshold pace ≈ best 30min average pace.
 *
 * @param paceStream - Pace values in seconds per km
 * @returns Estimated threshold pace in s/km, or null
 */
export function estimateThresholdPace(
  paceStream: number[]
): number | null {
  const windowSize = 30 * 60; // 30 minutes
  if (paceStream.length < windowSize) return null;

  // Filter out zero/stopped pace values
  const filteredPace = paceStream.filter((p) => p > 0 && p < 600); // <10min/km
  if (filteredPace.length < windowSize) return null;

  // Find best (lowest) 30-minute window average
  let minAvg = Infinity;
  let windowSum = 0;

  for (let i = 0; i < filteredPace.length; i++) {
    windowSum += filteredPace[i];
    if (i >= windowSize) {
      windowSum -= filteredPace[i - windowSize];
    }
    if (i >= windowSize - 1) {
      const avg = windowSum / windowSize;
      if (avg < minAvg) minAvg = avg;
    }
  }

  return minAvg === Infinity ? null : Math.round(minAvg * 10) / 10;
}

/**
 * Normalized Power (NP) — Coggan
 *
 * Algorithm:
 * 1. Calculate 30-second rolling average of power
 * 2. Raise each averaged value to the 4th power
 * 3. Take the mean of those values
 * 4. Take the 4th root of the result
 *
 * This weights high-intensity efforts more heavily, reflecting their
 * greater physiological cost compared to steady-state power.
 *
 * Reference: Coggan, A.R. (2003). Training and Racing Using a Power Meter.
 */

const ROLLING_WINDOW_SECONDS = 30;

/**
 * Calculate Normalized Power from a power stream.
 * @param powerStream - Array of power values in watts (1-second intervals)
 * @returns NP in watts, or null if insufficient data
 */
export function calculateNormalizedPower(
  powerStream: number[]
): number | null {
  if (powerStream.length < ROLLING_WINDOW_SECONDS) {
    return null;
  }

  // Step 1: Calculate 30-second rolling average
  const rollingAvg: number[] = [];
  let windowSum = 0;

  for (let i = 0; i < powerStream.length; i++) {
    windowSum += powerStream[i];

    if (i >= ROLLING_WINDOW_SECONDS) {
      windowSum -= powerStream[i - ROLLING_WINDOW_SECONDS];
    }

    if (i >= ROLLING_WINDOW_SECONDS - 1) {
      rollingAvg.push(windowSum / ROLLING_WINDOW_SECONDS);
    }
  }

  if (rollingAvg.length === 0) return null;

  // Step 2 & 3: Raise to 4th power and take mean
  let sum4thPower = 0;
  for (const avg of rollingAvg) {
    sum4thPower += avg ** 4;
  }
  const mean4thPower = sum4thPower / rollingAvg.length;

  // Step 4: Take 4th root
  const np = mean4thPower ** 0.25;

  return Math.round(np);
}

/**
 * Calculate Intensity Factor (IF) = NP / FTP
 */
export function calculateIntensityFactor(
  normalizedPower: number,
  ftp: number
): number {
  if (ftp <= 0) return 0;
  return normalizedPower / ftp;
}

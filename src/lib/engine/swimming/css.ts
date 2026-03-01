/**
 * Critical Swim Speed (CSS)
 *
 * CSS is the swimming analog to FTP/threshold pace.
 * It represents the theoretical fastest pace that can be sustained
 * without accumulating fatigue.
 *
 * From a test set:
 *   CSS = 200m / (T400 - T200)
 *
 * Where T400 and T200 are the times (in seconds) for a 400m and 200m
 * time trial (all-out efforts).
 *
 * Alternatively estimated from lap data of pool swims.
 *
 * Reference: Wakayoshi et al. (1992) "Determination of critical velocity
 * as a parameter of the distance-time relationship of swimming."
 */

/**
 * Calculate CSS from 400m and 200m test times.
 *
 * @param t400Seconds - Time for 400m all-out effort in seconds
 * @param t200Seconds - Time for 200m all-out effort in seconds
 * @returns CSS in seconds per 100m
 */
export function calculateCSSFromTest(
  t400Seconds: number,
  t200Seconds: number
): number | null {
  if (t400Seconds <= t200Seconds || t200Seconds <= 0) return null;

  // CSS speed = 200m / (T400 - T200)
  const cssSpeedMps = 200 / (t400Seconds - t200Seconds);

  // Convert to pace: seconds per 100m
  const cssPace = 100 / cssSpeedMps;

  return Math.round(cssPace * 10) / 10;
}

/**
 * Estimate CSS from a set of lap times.
 * Uses the best sustained effort over 400m+ of continuous swimming.
 *
 * @param lapTimesSeconds - Array of lap times in seconds
 * @param lapLengthMeters - Pool length in meters (typically 25 or 50)
 * @returns Estimated CSS in seconds per 100m, or null
 */
export function estimateCSSFromLaps(
  lapTimesSeconds: number[],
  lapLengthMeters: number
): number | null {
  if (lapTimesSeconds.length < 4) return null;

  // Find best 400m equivalent (best N consecutive laps)
  const lapsFor400m = Math.ceil(400 / lapLengthMeters);
  if (lapTimesSeconds.length < lapsFor400m) return null;

  let bestAvgPer100m = Infinity;

  for (let i = 0; i <= lapTimesSeconds.length - lapsFor400m; i++) {
    let totalTime = 0;
    for (let j = i; j < i + lapsFor400m; j++) {
      totalTime += lapTimesSeconds[j];
    }
    const totalDistance = lapsFor400m * lapLengthMeters;
    const pacePer100m = (totalTime / totalDistance) * 100;
    if (pacePer100m < bestAvgPer100m) {
      bestAvgPer100m = pacePer100m;
    }
  }

  if (bestAvgPer100m === Infinity) return null;

  // CSS is roughly 5-8% slower than best 400m pace
  // This is a rough estimate; the test method is preferred
  const estimatedCss = bestAvgPer100m * 1.05;

  return Math.round(estimatedCss * 10) / 10;
}

/**
 * Calculate swimming Intensity Factor.
 * IF = CSS_speed / actual_speed (inverted because lower pace = faster)
 * Same concept as running IF.
 */
export function calculateSwimmingIF(
  actualPaceSPer100m: number,
  cssSPer100m: number
): number {
  if (cssSPer100m <= 0 || actualPaceSPer100m <= 0) return 0;
  // Speed = 100 / pace
  const actualSpeed = 100 / actualPaceSPer100m;
  const cssSpeed = 100 / cssSPer100m;
  return actualSpeed / cssSpeed;
}

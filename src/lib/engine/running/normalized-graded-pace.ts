/**
 * Normalized Graded Pace (NGP)
 *
 * Adjusts GPS pace for elevation changes. Running uphill is harder than
 * flat ground at the same pace, and downhill is (somewhat) easier.
 *
 * Grade adjustment factor: ~3.3% speed reduction per 1% positive grade
 * (up to ~10% grade). Beyond 10%, the relationship is less linear.
 *
 * Formula: NGP = adjusted_pace after grade correction, then
 * 30-second rolling average → 4th power → mean → 4th root
 * (same smoothing as cycling NP)
 *
 * Reference: TrainingPeaks NGP documentation; Minetti et al. (2002)
 * "Energy cost of walking and running at extreme uphill and downhill slopes"
 */

const ROLLING_WINDOW_SECONDS = 30;

/**
 * Calculate grade-adjusted speed from raw speed and grade.
 *
 * Uses the Minetti cost-of-transport curve simplified:
 * At +1% grade, flat-equivalent speed is ~3.3% faster than actual speed
 * At -1% grade, flat-equivalent speed is ~1.8% slower than actual speed
 * (downhill helps less than uphill hurts)
 *
 * @param speedMps - Ground speed in meters/second
 * @param gradePercent - Grade as percentage (positive = uphill)
 * @returns Grade-adjusted speed in m/s
 */
export function gradeAdjustedSpeed(
  speedMps: number,
  gradePercent: number
): number {
  if (speedMps <= 0) return 0;

  // Clamp grade to reasonable range
  const grade = Math.max(-20, Math.min(20, gradePercent));

  // Cost of transport adjustment factor
  // Positive grade: each 1% adds ~3.3% metabolic cost
  // Negative grade: each 1% subtracts ~1.8% metabolic cost (less benefit)
  let adjustmentFactor: number;
  if (grade >= 0) {
    adjustmentFactor = 1 + grade * 0.033;
  } else {
    // Downhill: less benefit, and steep downhill actually costs more
    if (grade > -10) {
      adjustmentFactor = 1 + grade * 0.018;
    } else {
      // Very steep downhill: braking costs increase
      adjustmentFactor = 1 + (-10 * 0.018) + (grade + 10) * 0.01;
    }
  }

  // Grade-adjusted speed = actual speed × adjustment factor
  return speedMps * adjustmentFactor;
}

/**
 * Calculate Normalized Graded Pace from speed and grade streams.
 *
 * @param speedStream - Speed in m/s per second
 * @param gradeStream - Grade in % per second (optional, defaults to 0)
 * @returns NGP in seconds per km, or null if insufficient data
 */
export function calculateNGP(
  speedStream: number[],
  gradeStream?: number[]
): number | null {
  if (speedStream.length < ROLLING_WINDOW_SECONDS) return null;

  // Step 1: Grade-adjust all speeds
  const adjustedSpeeds = speedStream.map((speed, i) => {
    const grade = gradeStream?.[i] ?? 0;
    return gradeAdjustedSpeed(speed, grade);
  });

  // Step 2: 30-second rolling average
  const rollingAvg: number[] = [];
  let windowSum = 0;

  for (let i = 0; i < adjustedSpeeds.length; i++) {
    windowSum += adjustedSpeeds[i];
    if (i >= ROLLING_WINDOW_SECONDS) {
      windowSum -= adjustedSpeeds[i - ROLLING_WINDOW_SECONDS];
    }
    if (i >= ROLLING_WINDOW_SECONDS - 1) {
      rollingAvg.push(windowSum / ROLLING_WINDOW_SECONDS);
    }
  }

  if (rollingAvg.length === 0) return null;

  // Step 3: 4th power → mean → 4th root (same as NP)
  let sum4thPower = 0;
  for (const avg of rollingAvg) {
    sum4thPower += avg ** 4;
  }
  const mean4thPower = sum4thPower / rollingAvg.length;
  const ngpSpeed = mean4thPower ** 0.25; // m/s

  if (ngpSpeed <= 0) return null;

  // Convert to pace: seconds per km
  const ngpPace = 1000 / ngpSpeed;

  return Math.round(ngpPace * 10) / 10;
}

/**
 * Calculate running Intensity Factor.
 * IF = threshold_pace / NGP (note: inverted because lower pace = faster)
 * Actually: IF = NGP_speed / threshold_speed
 */
export function calculateRunningIF(
  ngpSecPerKm: number,
  thresholdPaceSecPerKm: number
): number {
  if (thresholdPaceSecPerKm <= 0 || ngpSecPerKm <= 0) return 0;
  // Convert to speeds for proper ratio
  const ngpSpeed = 1000 / ngpSecPerKm;
  const thresholdSpeed = 1000 / thresholdPaceSecPerKm;
  return ngpSpeed / thresholdSpeed;
}

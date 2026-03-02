/**
 * Health Trends Engine
 *
 * Computes HRV 7-day trend and resting HR delta from daily metrics.
 * Used by the weekly plan cron to inform coaching decisions.
 */

export type HrvTrend = "rising" | "stable" | "declining" | "unknown";

/**
 * Compute the 7-day HRV trend using linear regression.
 *
 * Uses a ±0.5 ms/day slope threshold to suppress noise.
 * - slope > +0.5 ms/day → "rising" (recovery improving)
 * - slope < -0.5 ms/day → "declining" (accumulated fatigue)
 * - |slope| ≤ 0.5 ms/day → "stable"
 * - < 3 data points → "unknown"
 */
export function computeHrv7DayTrend(
  hrvValues: (number | null)[]
): HrvTrend {
  // Filter to valid values, keeping index order (oldest → newest)
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < hrvValues.length; i++) {
    const v = hrvValues[i];
    if (v != null && v > 0) {
      points.push({ x: i, y: v });
    }
  }

  if (points.length < 3) return "unknown";

  // Simple linear regression: y = mx + b
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return "stable";

  const slope = (n * sumXY - sumX * sumY) / denominator;

  // Threshold: ±0.5 ms/day
  if (slope > 0.5) return "rising";
  if (slope < -0.5) return "declining";
  return "stable";
}

/**
 * Compute resting HR delta: today's resting HR minus 30-day baseline average.
 *
 * Positive delta → HR elevated (fatigue/illness/overtraining).
 * Negative delta → HR below baseline (well-recovered).
 *
 * Returns 0 if insufficient data.
 */
export function computeRestingHrDelta(
  restingHrValues: (number | null)[]
): number {
  const valid = restingHrValues.filter(
    (v): v is number => v != null && v > 0
  );

  if (valid.length < 2) return 0;

  // Most recent value (today or yesterday)
  const current = valid[valid.length - 1];

  // Baseline: average of all values except the last one
  const baseline = valid.slice(0, -1);
  const avg = baseline.reduce((sum, v) => sum + v, 0) / baseline.length;

  return Math.round((current - avg) * 10) / 10;
}

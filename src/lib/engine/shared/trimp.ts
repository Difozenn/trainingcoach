/**
 * TRIMP (Training Impulse) — Banister
 *
 * HR-based training load metric. Used as fallback when no power/pace data.
 *
 * TRIMP = duration_minutes × ΔHR_ratio × weighting_factor
 *
 * Where:
 * - ΔHR_ratio = (avg_HR - resting_HR) / (max_HR - resting_HR)
 * - weighting_factor = 0.64 × e^(1.92 × ΔHR_ratio) for males
 *                      0.86 × e^(1.67 × ΔHR_ratio) for females
 *
 * hrTSS (HR-based TSS):
 * hrTSS = TRIMP × (1 / TRIMP_threshold_per_hour) × 100
 * Approximation: hrTSS ≈ (duration_hours) × (avgHR - restHR) / (LTHR - restHR)² × 100
 *
 * Reference:
 * - Banister, E.W. (1991). "Modeling Elite Athletic Performance."
 * - Edwards, S. (1993). Heart Rate Monitor Book.
 */

/**
 * Calculate exponential TRIMP (Banister method).
 *
 * @param avgHr - Average heart rate during activity
 * @param durationMinutes - Duration in minutes
 * @param restingHr - Resting heart rate
 * @param maxHr - Maximum heart rate
 * @param sex - "male" or "female" for gender-specific weighting
 * @returns TRIMP value
 */
export function calculateTRIMP(
  avgHr: number,
  durationMinutes: number,
  restingHr: number,
  maxHr: number,
  sex: "male" | "female" = "male"
): number {
  if (maxHr <= restingHr || avgHr < restingHr) return 0;

  const hrRatio = (avgHr - restingHr) / (maxHr - restingHr);

  // Gender-specific weighting factors (Banister 1991)
  const a = sex === "male" ? 0.64 : 0.86;
  const b = sex === "male" ? 1.92 : 1.67;
  const weightingFactor = a * Math.exp(b * hrRatio);

  return Math.round(durationMinutes * hrRatio * weightingFactor * 10) / 10;
}

/**
 * Calculate hrTSS — HR-based Training Stress Score.
 * Used when no power meter or GPS pace data available.
 *
 * Formula: hrTSS = (duration_hours × HRR × 0.64 × e^(1.92 × HRR)) / (LTHR_HRR × 0.64 × e^(1.92 × LTHR_HRR)) × 100
 *
 * Simplified approximation for practical use.
 *
 * @param avgHr - Average heart rate
 * @param durationSeconds - Duration in seconds
 * @param lthr - Lactate Threshold Heart Rate
 * @param restingHr - Resting heart rate
 * @param maxHr - Maximum heart rate
 */
export function calculateHrTSS(
  avgHr: number,
  durationSeconds: number,
  lthr: number,
  restingHr: number,
  maxHr: number
): number {
  if (maxHr <= restingHr || lthr <= restingHr) return 0;

  const durationMinutes = durationSeconds / 60;

  // Activity TRIMP
  const activityTrimp = calculateTRIMP(
    avgHr,
    durationMinutes,
    restingHr,
    maxHr
  );

  // 1-hour at LTHR TRIMP (reference value)
  const lthrTrimp = calculateTRIMP(lthr, 60, restingHr, maxHr);

  if (lthrTrimp <= 0) return 0;

  // hrTSS = (activity TRIMP / 1hr@LTHR TRIMP) × 100
  return Math.round((activityTrimp / lthrTrimp) * 100 * 10) / 10;
}

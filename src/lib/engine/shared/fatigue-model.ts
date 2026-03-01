/**
 * Fatigue Model — Unified CTL / ATL / TSB (Banister Impulse-Response Model)
 *
 * This implements the Performance Management Chart (PMC) used by
 * TrainingPeaks, intervals.icu, and similar platforms.
 *
 * CTL (Chronic Training Load / "Fitness"):
 *   42-day exponentially weighted moving average of daily TSS.
 *   Represents long-term training adaptation.
 *
 * ATL (Acute Training Load / "Fatigue"):
 *   7-day exponentially weighted moving average of daily TSS.
 *   Represents short-term fatigue.
 *
 * TSB (Training Stress Balance / "Form"):
 *   TSB = CTL - ATL
 *   Positive = fresh, negative = fatigued.
 *   Optimal race range: +5 to +15.
 *   Overreaching warning: < -30.
 *
 * EMA formula: today = yesterday × (1 - 1/τ) + todayTSS × (1/τ)
 * Where τ = time constant (42 for CTL, 7 for ATL)
 *
 * Multi-sport: Daily TSS is the SUM of all sports' TSS for that day.
 * This is the same approach used by TrainingPeaks and intervals.icu.
 *
 * Reference:
 * - Banister, E.W. (1975). Modeling elite athletic performance.
 * - Coggan, A.R. Performance Management Chart.
 * - Science to Sport monitoring framework.
 */

const CTL_TIME_CONSTANT = 42;
const ATL_TIME_CONSTANT = 7;

export type DailyLoadMetrics = {
  date: string; // ISO date string
  totalTss: number;
  cyclingTss: number;
  runningTss: number;
  swimmingTss: number;
  ctl: number;
  atl: number;
  tsb: number;
  rampRate: number; // weekly CTL change
};

/**
 * Calculate CTL/ATL/TSB for a series of daily TSS values.
 *
 * @param dailyTss - Array of { date, totalTss, cyclingTss?, runningTss?, swimmingTss? }
 *                   sorted by date ascending
 * @param initialCtl - Starting CTL value (default 0)
 * @param initialAtl - Starting ATL value (default 0)
 * @returns Array of daily load metrics with CTL/ATL/TSB
 */
export function calculateFatigueModel(
  dailyTss: {
    date: string;
    totalTss: number;
    cyclingTss?: number;
    runningTss?: number;
    swimmingTss?: number;
  }[],
  initialCtl = 0,
  initialAtl = 0
): DailyLoadMetrics[] {
  const ctlDecay = 1 - 1 / CTL_TIME_CONSTANT;
  const ctlImpact = 1 / CTL_TIME_CONSTANT;
  const atlDecay = 1 - 1 / ATL_TIME_CONSTANT;
  const atlImpact = 1 / ATL_TIME_CONSTANT;

  let ctl = initialCtl;
  let atl = initialAtl;
  const results: DailyLoadMetrics[] = [];

  for (let i = 0; i < dailyTss.length; i++) {
    const day = dailyTss[i];

    // EMA update
    ctl = ctl * ctlDecay + day.totalTss * ctlImpact;
    atl = atl * atlDecay + day.totalTss * atlImpact;
    const tsb = ctl - atl;

    // Ramp rate: change in CTL over the last 7 days
    let rampRate = 0;
    if (i >= 7) {
      rampRate = ctl - results[i - 7].ctl;
    }

    results.push({
      date: day.date,
      totalTss: day.totalTss,
      cyclingTss: day.cyclingTss ?? 0,
      runningTss: day.runningTss ?? 0,
      swimmingTss: day.swimmingTss ?? 0,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      rampRate: Math.round(rampRate * 10) / 10,
    });
  }

  return results;
}

/**
 * Calculate a single day's CTL/ATL/TSB update.
 * Used for real-time incremental updates.
 */
export function updateDailyMetrics(
  todayTss: number,
  previousCtl: number,
  previousAtl: number
): { ctl: number; atl: number; tsb: number } {
  const ctl =
    previousCtl * (1 - 1 / CTL_TIME_CONSTANT) +
    todayTss * (1 / CTL_TIME_CONSTANT);
  const atl =
    previousAtl * (1 - 1 / ATL_TIME_CONSTANT) +
    todayTss * (1 / ATL_TIME_CONSTANT);
  const tsb = ctl - atl;

  return {
    ctl: Math.round(ctl * 10) / 10,
    atl: Math.round(atl * 10) / 10,
    tsb: Math.round(tsb * 10) / 10,
  };
}

/**
 * Predict future TSB if the athlete rests (TSS=0) for N days.
 * Useful for taper planning.
 */
export function predictRestDays(
  currentCtl: number,
  currentAtl: number,
  days: number
): { ctl: number; atl: number; tsb: number }[] {
  const predictions: { ctl: number; atl: number; tsb: number }[] = [];
  let ctl = currentCtl;
  let atl = currentAtl;

  for (let i = 0; i < days; i++) {
    const result = updateDailyMetrics(0, ctl, atl);
    ctl = result.ctl;
    atl = result.atl;
    predictions.push(result);
  }

  return predictions;
}

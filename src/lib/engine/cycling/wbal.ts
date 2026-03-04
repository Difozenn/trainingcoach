/**
 * W'bal (W-prime balance) — Differential Model (Skiba et al. 2012)
 *
 * Models the depletion and recovery of anaerobic work capacity (W').
 * W' = total work capacity above CP (Critical Power ≈ FTP).
 *
 * Depletion: when P > CP, W'bal decreases by (P - CP) per second
 * Recovery:  when P < CP, W'bal recovers exponentially toward W'max
 *            dW'bal = (W'max - W'bal) × (1 - e^(-1/tau))
 *            tau = 546 × e^(-0.01 × (CP - P)) + 316.18  (Skiba 2012)
 *
 * MPA (Maximal Power Available) = CP + (PP - CP) × (W'bal / W'max)
 *   where PP = Peak Power (highest ~5s power the rider can produce)
 * Breakthrough = power exceeds MPA (suggests fitness signature underestimated)
 *
 * Reference: Skiba PF, et al. "Modeling the expenditure and reconstitution
 * of work capacity above critical power." Med Sci Sports Exerc. 2012.
 */

export type WbalPoint = {
  time: number; // seconds from start
  power: number;
  wbal: number; // joules remaining
  mpa: number; // max power available (watts)
  isBreakthrough: boolean;
};

/**
 * Estimate W' (anaerobic work capacity) from FTP alone.
 * Fallback when no peak 5-min data is available.
 * Typical range: 15-30 kJ for trained cyclists.
 */
function estimateWPrimeFromFtp(ftp: number): number {
  // Rough approximation: W' ~ 200 * FTP^0.5
  // At FTP=250 → ~19.9kJ, FTP=330 → ~22.9kJ
  const wPrime = 200 * Math.sqrt(ftp);
  return Math.max(10000, Math.min(35000, Math.round(wPrime)));
}

/**
 * Calculate peak N-second average power from a power stream.
 * Used as PP (Peak Power) fallback when no profile data is available.
 */
export function peakPowerFromStream(
  powerStream: number[],
  windowSeconds: number = 5
): number {
  if (powerStream.length < windowSeconds) {
    return Math.max(...powerStream, 0);
  }
  let sum = 0;
  let maxAvg = 0;
  for (let i = 0; i < powerStream.length; i++) {
    sum += powerStream[i];
    if (i >= windowSeconds) sum -= powerStream[i - windowSeconds];
    if (i >= windowSeconds - 1) {
      const avg = sum / windowSeconds;
      if (avg > maxAvg) maxAvg = avg;
    }
  }
  return Math.round(maxAvg);
}

/**
 * Calculate W'bal for an entire power stream using the differential model.
 *
 * @param powerStream - Second-by-second power in watts
 * @param ftp - Functional Threshold Power (used as CP)
 * @param opts.pMax - Peak 5s power (for MPA ceiling); falls back to stream peak
 * @param opts.peak5m - Peak 5-min power (for W' derivation via CP model)
 * @param opts.wPrime - Explicit W' in joules (overrides peak5m derivation)
 */
export function calculateWbal(
  powerStream: number[],
  ftp: number,
  opts?: { pMax?: number; peak5m?: number; wPrime?: number }
): WbalPoint[] {
  if (powerStream.length === 0 || ftp <= 0) return [];

  const cp = ftp;

  // W' priority: explicit > derived from peak 5min > generic estimate
  let wMax: number;
  if (opts?.wPrime != null && opts.wPrime > 0) {
    wMax = opts.wPrime;
  } else if (opts?.peak5m != null && opts.peak5m > cp) {
    // P(t) = CP + W'/t → W' = (P5min - CP) × 300
    wMax = (opts.peak5m - cp) * 300;
  } else {
    wMax = estimateWPrimeFromFtp(ftp);
  }

  // PP (peak power for MPA ceiling)
  const pp = opts?.pMax ?? peakPowerFromStream(powerStream, 5);
  const effectivePP = Math.max(pp, cp + 100);

  let wbal = wMax;
  const results: WbalPoint[] = [];

  for (let i = 0; i < powerStream.length; i++) {
    const power = powerStream[i];

    if (power > cp) {
      // Depletion: linear, 1 joule per watt above CP per second
      wbal -= (power - cp);
    } else {
      // Recovery: Skiba exponential model with power-dependent tau
      // tau = 546 × e^(-0.01 × (CP - P)) + 316.18
      const tau = 546 * Math.exp(-0.01 * (cp - power)) + 316.18;
      const recovery = (wMax - wbal) * (1 - Math.exp(-1 / tau));
      wbal += recovery;
    }

    // Clamp W'bal to [0, W'max]
    wbal = Math.max(0, Math.min(wMax, wbal));

    // MPA = CP + (PP - CP) × (W'bal / W'max)
    const mpa = cp + (effectivePP - cp) * (wbal / wMax);

    // Breakthrough: power exceeds MPA
    const isBreakthrough = power > mpa;

    results.push({
      time: i,
      power,
      wbal: Math.round(wbal),
      mpa: Math.round(mpa),
      isBreakthrough,
    });
  }

  return results;
}

/**
 * Downsample W'bal results for chart rendering.
 * Uses max-power-preserving downsampling to keep peaks visible.
 */
export function downsampleWbal(
  data: WbalPoint[],
  maxPoints: number = 500
): WbalPoint[] {
  if (data.length <= maxPoints) return data;

  const bucketSize = Math.ceil(data.length / maxPoints);
  const result: WbalPoint[] = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    // Pick the point with highest power in this bucket (preserves peaks)
    let maxPowerPoint = bucket[0];
    for (const point of bucket) {
      if (point.power > maxPowerPoint.power) {
        maxPowerPoint = point;
      }
    }
    result.push(maxPowerPoint);
  }

  return result;
}

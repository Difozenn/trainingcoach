/**
 * W'bal (W-prime balance) — Differential Model (Skiba et al. 2012)
 *
 * Models the depletion and recovery of anaerobic work capacity (W').
 * W' = total work capacity above CP (Critical Power ≈ FTP).
 *
 * Depletion: when P > CP, W'bal decreases by (P - CP) per second
 * Recovery:  when P < CP, W'bal recovers proportionally to remaining deficit
 *
 * MPA (Maximal Power Available) = CP + (PP - CP) × (W'bal / W'max)
 *   where PP = Peak Power (highest instantaneous power the rider can produce)
 * Breakthrough = power exceeds MPA (suggests fitness signature underestimated)
 *
 * Reference: Skiba PF, et al. "Modeling the expenditure and reconstitution
 * of work capacity above critical power." Med Sci Sports Exerc. 2012.
 */

const W_PRIME_RECOVERY_TAU = 546; // seconds — recovery time constant (Skiba)

export type WbalPoint = {
  time: number; // seconds from start
  power: number;
  wbal: number; // joules remaining
  mpa: number; // max power available (watts)
  isBreakthrough: boolean;
};

/**
 * Estimate W' (anaerobic work capacity) from FTP.
 * Typical range: 12-26 kJ for trained cyclists.
 * Uses a linear approximation clamped to a reasonable range.
 */
export function estimateWPrime(ftp: number): number {
  // Linear approximation: higher FTP → higher W'
  const wPrimeJ = 7500 + ftp * 45;
  return Math.max(12000, Math.min(26000, Math.round(wPrimeJ)));
}

/**
 * Calculate peak 5-second average power from a power stream.
 * Used as PP (Peak Power) for the MPA model when no profile data is available.
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
 * @param ftp - Functional Threshold Power (used as CP approximation)
 * @param pMax - Peak Power in watts (used for MPA calculation; estimated from stream if not provided)
 * @param wPrime - W' in joules (optional, estimated from FTP if not provided)
 * @returns Array of WbalPoint with time, power, W'bal, MPA, and breakthrough flags
 */
export function calculateWbal(
  powerStream: number[],
  ftp: number,
  pMax?: number,
  wPrime?: number
): WbalPoint[] {
  if (powerStream.length === 0 || ftp <= 0) return [];

  const cp = ftp;
  const wMax = wPrime ?? estimateWPrime(ftp);
  const pp = pMax ?? peakPowerFromStream(powerStream, 5);

  // Ensure PP > CP (at minimum CP + 100W as fallback)
  const effectivePP = Math.max(pp, cp + 100);

  let wbal = wMax;
  const results: WbalPoint[] = [];

  for (let i = 0; i < powerStream.length; i++) {
    const power = powerStream[i];

    if (power > cp) {
      // Depletion: W'bal decreases by power above CP
      wbal -= (power - cp);
    } else {
      // Recovery: Skiba differential model
      // dW'/dt = (CP - P) × (W'max - W'bal) / (W'max × τ)
      const recovery =
        ((cp - power) * (wMax - wbal)) / (wMax * W_PRIME_RECOVERY_TAU);
      wbal += recovery;
    }

    // Clamp W'bal
    wbal = Math.max(0, Math.min(wMax, wbal));

    // MPA = CP + (PP - CP) × (W'bal / W'max)
    // At full W'bal: MPA = PP (peak power)
    // At empty W'bal: MPA = CP (threshold)
    const mpa = cp + (effectivePP - cp) * (wbal / wMax);

    // Breakthrough: power exceeds MPA — suggests fitness signature is too low
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

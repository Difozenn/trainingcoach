/**
 * W'bal (W-prime balance) — Differential Model (Skiba et al. 2012)
 *
 * Models the depletion and recovery of anaerobic work capacity (W').
 * W' = total work capacity above CP (Critical Power ≈ FTP).
 *
 * Depletion: when P > CP, W'bal decreases by (P - CP) per second
 * Recovery:  when P < CP, W'bal recovers proportionally to remaining deficit
 *
 * MPA (Maximal Power Available) = CP + W'bal / τ_mpa
 * Breakthrough = power exceeds MPA with W'bal < 5% of W'max
 *
 * Reference: Skiba PF, et al. "Modeling the expenditure and reconstitution
 * of work capacity above critical power." Med Sci Sports Exerc. 2012.
 */

const W_PRIME_RECOVERY_TAU = 546; // seconds — recovery time constant (Skiba)
const MPA_TAU = 20; // seconds — MPA smoothing window

export type WbalPoint = {
  time: number; // seconds from start
  power: number;
  wbal: number; // joules remaining
  mpa: number; // max power available (watts)
  isBreakthrough: boolean;
};

/**
 * Estimate W' (anaerobic work capacity) from FTP.
 * Typical range: 15-25 kJ for trained cyclists.
 *
 * Uses the relationship: W' ≈ 2.5 × (FTP)^0.535 × 1000
 * Clamped to 10-30 kJ range.
 */
export function estimateWPrime(ftp: number): number {
  // Empirical approximation
  const wPrimeKJ = 2.5 * Math.pow(ftp, 0.535);
  const clamped = Math.max(10, Math.min(30, wPrimeKJ));
  return Math.round(clamped * 1000); // return in joules
}

/**
 * Calculate W'bal for an entire power stream using the differential model.
 *
 * @param powerStream - Second-by-second power in watts
 * @param ftp - Functional Threshold Power (used as CP approximation)
 * @param wPrime - W' in joules (optional, estimated from FTP if not provided)
 * @returns Array of WbalPoint with time, power, W'bal, MPA, and breakthrough flags
 */
export function calculateWbal(
  powerStream: number[],
  ftp: number,
  wPrime?: number
): WbalPoint[] {
  if (powerStream.length === 0 || ftp <= 0) return [];

  const cp = ftp; // CP ≈ FTP for practical purposes
  const wMax = wPrime ?? estimateWPrime(ftp);
  let wbal = wMax;

  const results: WbalPoint[] = [];

  for (let i = 0; i < powerStream.length; i++) {
    const power = powerStream[i];

    if (power > cp) {
      // Depletion: W'bal decreases by power above CP
      wbal -= (power - cp);
    } else {
      // Recovery: Skiba differential model
      // dW'/dt = (CP - P) × (W'max - W'bal) / W'max × (1/τ)
      const recovery =
        ((cp - power) * (wMax - wbal)) / (wMax * W_PRIME_RECOVERY_TAU);
      wbal += recovery;
    }

    // Clamp W'bal
    wbal = Math.max(0, Math.min(wMax, wbal));

    // MPA = CP + W'bal / τ_mpa
    // This represents the maximum power that could be sustained RIGHT NOW
    const mpa = cp + wbal / MPA_TAU;

    // Breakthrough: power exceeds MPA AND W'bal is critically low
    const isBreakthrough = power > mpa && wbal < wMax * 0.05;

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

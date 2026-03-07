/**
 * W'bal (W-prime balance) — Differential Model
 *
 * Models the depletion and recovery of anaerobic work capacity (W').
 * W' = total work capacity above CP (Critical Power ≈ FTP).
 *
 * Depletion: when P > CP, W'bal decreases by (P - CP) per second
 *   (after PCr buffer — first ~10s of any surge uses phosphocreatine, not W')
 *
 * Recovery: when P < CP, W'bal recovers proportionally to depletion depth:
 *   dW'bal = (CP - P) × (W'max - W'bal) / W'max
 *   Implicit tau = W'max / (CP - P), giving fast recovery at rest (~70s)
 *   and slow recovery near CP. This matches PCr resynthesis kinetics
 *   and produces realistic W'bal dynamics during interval training.
 *
 * MPA (Maximal Power Available) = CP + (PP - CP) × (W'bal / W'max)
 *   where PP = Peak Power (highest ~5s power the rider can produce)
 *   Based on Morton's 3-parameter critical power model (1996).
 *
 * Breakthrough = power exceeds MPA for sustained period at near-threshold
 *   intensity (suggests fitness signature is underestimated).
 *
 * References:
 *   Morton RH. "A 3-parameter critical power model." Ergonomics. 1996.
 *   Skiba PF, et al. "Modeling the expenditure and reconstitution of work
 *     capacity above critical power." Med Sci Sports Exerc. 2012.
 *   Kontro H, et al. "Maximum Power Available." J Sci Cycling. 2024.
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
 *
 * Research ranges (Skiba 2012, Morton 2006):
 *   Recreational: 10-15 kJ
 *   Trained:      15-25 kJ
 *   Elite:        25-35 kJ
 *
 * Uses FTP as a proxy for training level. Linear interpolation:
 *   FTP 150 → 12kJ, FTP 250 → 18kJ, FTP 350 → 24kJ, FTP 450 → 30kJ
 */
function estimateWPrimeFromFtp(ftp: number): number {
  // 60J per watt of FTP above a 150W baseline, starting at 12kJ
  const wPrime = 12000 + Math.max(0, ftp - 150) * 60;
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

  // Phosphocreatine (PCr) buffer: the alactic energy system powers the first
  // ~10s of any above-CP surge (PCr half-life ~25s). Without this buffer,
  // accumulated micro-surges falsely deplete W'bal on endurance rides.
  const PCR_BUFFER = 10;
  const MIN_BREACH_SECONDS = 10;
  const MAX_BREACH_POWER_RATIO = 2.0;
  const CONTEXT_WINDOW = 300;
  const MIN_CONTEXT_RATIO = 0.80;

  let wbal = wMax;
  let consecutiveAboveCp = 0;
  const results: WbalPoint[] = [];

  for (let i = 0; i < powerStream.length; i++) {
    const power = powerStream[i];

    if (power > cp) {
      consecutiveAboveCp++;
      // Only deplete W'bal after PCr buffer — the phosphocreatine system
      // handles the initial seconds of any above-CP surge.
      if (consecutiveAboveCp > PCR_BUFFER) {
        wbal -= (power - cp);
      }
    } else {
      consecutiveAboveCp = 0;
      // Recovery proportional to depletion depth and distance below CP.
      // Implicit time constant tau = W'max / (CP - P):
      //   At rest (P=0):   tau ≈ W'max/CP ≈ 70s  (fast, matches PCr resynthesis)
      //   Near CP (P≈CP):  tau → ∞                (slow, realistic for threshold work)
      // This avoids false breakthroughs during interval sessions where Skiba's
      // slower empirical tau (316-862s) prevents adequate inter-interval recovery.
      const recovery = (cp - power) * (wMax - wbal) / wMax;
      wbal += recovery;
    }

    // Clamp W'bal to [0, W'max]
    wbal = Math.max(0, Math.min(wMax, wbal));

    // MPA = CP + (PP - CP) × (W'bal / W'max)
    // Morton's 3-parameter model: MPA scales linearly with remaining W'
    const mpa = cp + (effectivePP - cp) * (wbal / wMax);

    results.push({
      time: i,
      power,
      wbal: Math.round(wbal),
      mpa: Math.round(mpa),
      isBreakthrough: false,
    });
  }

  // Find breach zones: continuous periods where power > MPA
  // Only mark as breakthrough if sustained and not a pure sprint
  let bestZonePeakIdx = -1;
  let bestZonePeakDelta = 0;
  let zoneStart = -1;
  const sprintCeiling = cp * MAX_BREACH_POWER_RATIO;

  for (let i = 0; i <= results.length; i++) {
    const breaching = i < results.length && results[i].power > results[i].mpa;

    if (breaching && zoneStart < 0) {
      zoneStart = i; // start of a new breach zone
    } else if (!breaching && zoneStart >= 0) {
      // End of breach zone — check if it qualifies as a threshold breakthrough
      const zoneDuration = i - zoneStart;
      if (zoneDuration >= MIN_BREACH_SECONDS) {
        // Compute average power in the breach zone
        let zoneSum = 0;
        for (let j = zoneStart; j < i; j++) zoneSum += results[j].power;
        const zoneAvgPower = zoneSum / zoneDuration;

        // Skip sprint-driven breaches: avg power > 2×CP is anaerobic, not threshold
        if (zoneAvgPower > sprintCeiling) {
          zoneStart = -1;
          continue;
        }

        // Context check: avg power in the 5 min before breach must be near-threshold.
        // This prevents false breakthroughs on endurance rides where W'bal depletes
        // from accumulated micro-surges rather than sustained hard effort.
        const contextStart = Math.max(0, zoneStart - CONTEXT_WINDOW);
        let contextSum = 0;
        for (let j = contextStart; j < zoneStart; j++) contextSum += results[j].power;
        const contextLen = zoneStart - contextStart;
        const contextAvg = contextLen > 0 ? contextSum / contextLen : 0;
        if (contextAvg < cp * MIN_CONTEXT_RATIO) {
          zoneStart = -1;
          continue;
        }

        // Find peak delta within this zone
        for (let j = zoneStart; j < i; j++) {
          const delta = results[j].power - results[j].mpa;
          if (delta > bestZonePeakDelta) {
            bestZonePeakDelta = delta;
            bestZonePeakIdx = j;
          }
        }
      }
      zoneStart = -1;
    }
  }

  // Mark only the single most significant breakthrough point
  if (bestZonePeakIdx >= 0) {
    results[bestZonePeakIdx].isBreakthrough = true;
  }

  return results;
}

/**
 * Binary-search for the lowest CP (FTP) where the ride produces 0 breakthroughs.
 * Searches from currentFtp upward in 1W steps (max +50W).
 * Returns the new FTP or null if no breakthrough at current FTP.
 */
export function calculateBreakthroughFtp(
  powerStream: number[],
  currentFtp: number,
  opts?: { pMax?: number; peak5m?: number; wPrime?: number }
): number | null {
  // First check: does current FTP even produce a breakthrough?
  const baseline = calculateWbal(powerStream, currentFtp, opts);
  if (!baseline.some((p) => p.isBreakthrough)) return null;

  // Binary search: find lowest CP in [currentFtp+1, currentFtp+50] with 0 breakthroughs
  let lo = currentFtp + 1;
  let hi = currentFtp + 50;
  let result = hi; // fallback to max if nothing clears it

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const run = calculateWbal(powerStream, mid, opts);
    const hasBreakthrough = run.some((p) => p.isBreakthrough);

    if (!hasBreakthrough) {
      result = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  // If even +50W still has breakthrough, return the cap
  return result;
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

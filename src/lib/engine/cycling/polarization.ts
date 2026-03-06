/**
 * Polarization Index (Treff et al. 2019)
 *
 * PI = log10((Z_low / Z_mid) × Z_high × 100)
 *
 * Grouped from 7 Coggan zones:
 *   Green (low):  Z1-Z2  < 76% FTP
 *   Orange (mid): Z3-Z4  76-105% FTP
 *   Red (high):   Z5+    > 105% FTP
 *
 * PI > 2.0 = polarized training distribution
 * Polarized requires: low > high > mid
 *
 * Reference: Treff et al. (2019) Frontiers in Physiology
 */

export type PolarizationResult = {
  /** Percentage of time in Z1-Z2 (low intensity) */
  low: number;
  /** Percentage of time in Z3-Z4 (threshold) */
  mid: number;
  /** Percentage of time in Z5+ (high intensity) */
  high: number;
  /** Polarization Index score */
  pi: number | null;
  /** Classification label */
  label: "polarized" | "pyramidal" | "threshold" | "mixed";
};

/**
 * Group 7-zone distribution into 3 PI zones.
 * @param zones Array of 7 zone percentages (Z1-Z7)
 */
export function groupZones(zones: number[]): {
  low: number;
  mid: number;
  high: number;
} {
  const low = (zones[0] ?? 0) + (zones[1] ?? 0);
  const mid = (zones[2] ?? 0) + (zones[3] ?? 0);
  const high =
    (zones[4] ?? 0) + (zones[5] ?? 0) + (zones[6] ?? 0);
  return { low, mid, high };
}

/**
 * Calculate the Polarization Index from a 7-zone distribution.
 * @param zones Array of 7 zone percentages (must sum to ~100)
 */
export function calculatePolarizationIndex(
  zones: number[]
): PolarizationResult {
  const { low, mid, high } = groupZones(zones);

  // Need at least 1% in each group to compute PI
  let pi: number | null = null;
  if (mid >= 1 && high >= 1 && low >= 1) {
    const raw = (low / mid) * high * 100;
    pi = Math.round(Math.log10(raw) * 100) / 100;
  }

  // Classification
  let label: PolarizationResult["label"];
  if (pi !== null && pi > 2.0 && low > high && high > mid) {
    label = "polarized";
  } else if (low > mid && mid > high) {
    label = "pyramidal";
  } else if (mid > low && mid > high) {
    label = "threshold";
  } else {
    label = "mixed";
  }

  return {
    low: Math.round(low * 10) / 10,
    mid: Math.round(mid * 10) / 10,
    high: Math.round(high * 10) / 10,
    pi,
    label,
  };
}

/**
 * Aggregate multiple activity zone distributions into a single distribution.
 * Weighted by number of data points (seconds) per activity.
 */
export function aggregateZoneDistributions(
  distributions: { zones: number[]; seconds: number }[]
): number[] {
  const totalSeconds = distributions.reduce((a, d) => a + d.seconds, 0);
  if (totalSeconds === 0) return [0, 0, 0, 0, 0, 0, 0];

  const weighted = [0, 0, 0, 0, 0, 0, 0];
  for (const d of distributions) {
    const weight = d.seconds / totalSeconds;
    for (let i = 0; i < 7; i++) {
      weighted[i] += (d.zones[i] ?? 0) * weight;
    }
  }

  return weighted.map((v) => Math.round(v * 10) / 10);
}

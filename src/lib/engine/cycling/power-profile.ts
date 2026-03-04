/**
 * Power Profile — MMP calculation, Coggan classification, rider type determination
 *
 * Peak powers are calculated via sliding-window max-average at standard durations.
 * Classification uses Coggan's published W/kg table for male riders.
 * Rider type is determined by comparing relative category levels across durations.
 */

// ── Types ──────────────────────────────────────────────────────────

export type PeakPowers = {
  peak5s: number | null;
  peak15s: number | null;
  peak30s: number | null;
  peak1m: number | null;
  peak5m: number | null;
  peak10m: number | null;
  peak20m: number | null;
  peak60m: number | null;
};

export type PowerCategory = {
  level: number; // 0-7 (Untrained → World Class)
  label: string;
  percentile: number; // 0-100 within category
  wPerKg: number;
};

export type RiderType =
  | "Sprinter"
  | "Pursuiter"
  | "Time Trialist"
  | "Climber"
  | "All-Rounder";

export type PowerProfileResult = {
  peaks: Record<string, { watts: number; wPerKg: number; category: PowerCategory }>;
  riderType: RiderType;
  overallLevel: number;
  overallLabel: string;
};

// ── Constants ──────────────────────────────────────────────────────

const DURATIONS_SECONDS = [5, 15, 30, 60, 300, 600, 1200, 3600] as const;
const DURATION_KEYS = ["5s", "15s", "30s", "1m", "5m", "10m", "20m", "60m"] as const;

const CATEGORY_LABELS = [
  "Untrained",
  "Fair",
  "Moderate",
  "Good",
  "Very Good",
  "Excellent",
  "Exceptional",
  "World Class",
] as const;

/**
 * Coggan male W/kg classification at 4 anchor durations.
 * Each entry: [minWkg, maxWkg] for that category level.
 * Categories 0-7: Untrained → World Class.
 *
 * Source: Coggan, A.R. & Allen, H. "Training and Racing with a Power Meter"
 */
const COGGAN_MALE: Record<string, [number, number][]> = {
  "5s": [
    [6.0, 10.07],
    [10.08, 12.73],
    [12.74, 14.51],
    [14.52, 16.58],
    [16.59, 18.65],
    [18.66, 20.43],
    [20.44, 22.21],
    [22.22, 25.18],
  ],
  "1m": [
    [3.0, 5.63],
    [5.64, 6.43],
    [6.44, 7.12],
    [7.13, 8.16],
    [8.17, 8.96],
    [8.97, 9.65],
    [9.66, 10.34],
    [10.35, 11.50],
  ],
  "5m": [
    [1.5, 2.32],
    [2.33, 2.94],
    [2.95, 3.66],
    [3.67, 4.59],
    [4.60, 5.32],
    [5.33, 5.94],
    [5.95, 6.56],
    [6.57, 7.60],
  ],
  "ftp": [
    [1.2, 1.85],
    [1.86, 2.12],
    [2.13, 2.92],
    [2.93, 3.81],
    [3.82, 4.43],
    [4.44, 4.97],
    [4.98, 5.50],
    [5.51, 6.40],
  ],
};

// ── Peak Power Calculation ─────────────────────────────────────────

/**
 * Calculate peak (best average) power at standard durations using sliding window.
 */
export function calculatePeakPowers(powerStream: number[]): PeakPowers {
  const result: PeakPowers = {
    peak5s: null,
    peak15s: null,
    peak30s: null,
    peak1m: null,
    peak5m: null,
    peak10m: null,
    peak20m: null,
    peak60m: null,
  };

  const keys: (keyof PeakPowers)[] = [
    "peak5s",
    "peak15s",
    "peak30s",
    "peak1m",
    "peak5m",
    "peak10m",
    "peak20m",
    "peak60m",
  ];

  for (let d = 0; d < DURATIONS_SECONDS.length; d++) {
    const windowSize = DURATIONS_SECONDS[d];
    if (powerStream.length < windowSize) continue;

    let windowSum = 0;
    let maxAvg = 0;

    for (let i = 0; i < powerStream.length; i++) {
      windowSum += powerStream[i];
      if (i >= windowSize) {
        windowSum -= powerStream[i - windowSize];
      }
      if (i >= windowSize - 1) {
        const avg = windowSum / windowSize;
        if (avg > maxAvg) maxAvg = avg;
      }
    }

    if (maxAvg > 0) {
      result[keys[d]] = Math.round(maxAvg);
    }
  }

  return result;
}

// ── Classification ─────────────────────────────────────────────────

/**
 * Interpolate Coggan table for intermediate durations.
 * Uses log-linear interpolation between the 4 anchor durations (5s, 1m, 5m, FTP/60m).
 */
function getTableForDuration(durationKey: string): [number, number][] {
  // Direct match
  if (COGGAN_MALE[durationKey]) return COGGAN_MALE[durationKey];

  // Map duration key to seconds for interpolation
  const durationMap: Record<string, number> = {
    "5s": 5,
    "15s": 15,
    "30s": 30,
    "1m": 60,
    "5m": 300,
    "10m": 600,
    "20m": 1200,
    "60m": 3600,
  };
  const secs = durationMap[durationKey];
  if (!secs) return COGGAN_MALE["ftp"]; // fallback

  // Anchor points in seconds
  const anchors = [
    { secs: 5, key: "5s" },
    { secs: 60, key: "1m" },
    { secs: 300, key: "5m" },
    { secs: 3600, key: "ftp" },
  ];

  // Find bounding anchors
  let lower = anchors[0];
  let upper = anchors[anchors.length - 1];
  for (let i = 0; i < anchors.length - 1; i++) {
    if (secs >= anchors[i].secs && secs <= anchors[i + 1].secs) {
      lower = anchors[i];
      upper = anchors[i + 1];
      break;
    }
  }

  // Log-linear interpolation factor
  const t =
    Math.log(secs / lower.secs) / Math.log(upper.secs / lower.secs);

  const lowerTable = COGGAN_MALE[lower.key];
  const upperTable = COGGAN_MALE[upper.key];

  return lowerTable.map((_, i) => [
    lowerTable[i][0] + t * (upperTable[i][0] - lowerTable[i][0]),
    lowerTable[i][1] + t * (upperTable[i][1] - lowerTable[i][1]),
  ]) as [number, number][];
}

/**
 * Classify a power value into a Coggan category.
 */
export function classifyPower(
  watts: number,
  weightKg: number,
  durationKey: string
): PowerCategory {
  const wPerKg = watts / weightKg;
  const table = getTableForDuration(durationKey);

  // Find which category this W/kg falls into
  for (let i = table.length - 1; i >= 0; i--) {
    const [min, max] = table[i];
    if (wPerKg >= min) {
      const percentile = Math.min(100, Math.max(0, ((wPerKg - min) / (max - min)) * 100));
      return {
        level: i,
        label: CATEGORY_LABELS[i],
        percentile: Math.round(percentile),
        wPerKg: Math.round(wPerKg * 100) / 100,
      };
    }
  }

  // Below untrained
  const [min, max] = table[0];
  const percentile = Math.max(0, ((wPerKg - min) / (max - min)) * 100);
  return {
    level: 0,
    label: CATEGORY_LABELS[0],
    percentile: Math.max(0, Math.round(percentile)),
    wPerKg: Math.round(wPerKg * 100) / 100,
  };
}

// ── Rider Type ─────────────────────────────────────────────────────

/**
 * Determine rider type by comparing relative strengths at key durations.
 * Uses intervals.icu-style approach.
 */
export function determineRiderType(
  categories: Record<string, PowerCategory>
): RiderType {
  const sprint = categories["5s"];
  const anaerobic = categories["1m"];
  const vo2max = categories["5m"];
  const ftp = categories["60m"] ?? categories["20m"];

  if (!sprint || !anaerobic || !vo2max || !ftp) return "All-Rounder";

  // Continuous level = category index + percentile fraction
  const levels = {
    sprint: sprint.level + sprint.percentile / 100,
    anaerobic: anaerobic.level + anaerobic.percentile / 100,
    vo2max: vo2max.level + vo2max.percentile / 100,
    ftp: ftp.level + ftp.percentile / 100,
  };

  const vals = Object.values(levels);
  const maxLevel = Math.max(...vals);
  const minLevel = Math.min(...vals);

  // All-Rounder: all within 1 category level
  if (maxLevel - minLevel <= 1) return "All-Rounder";

  // Find which is highest
  if (levels.sprint === maxLevel) return "Sprinter";
  if (levels.anaerobic === maxLevel) return "Pursuiter";
  if (levels.vo2max === maxLevel) return "Climber";
  if (levels.ftp === maxLevel) return "Time Trialist";

  return "All-Rounder";
}

// ── Decay ──────────────────────────────────────────────────────────

const PEAK_TAU = 90; // days
const PEAK_FLOOR_RATIO = 0.6;

/**
 * Apply decay to a peak power value (same model as FTP decay).
 */
export function getEffectivePeakPower(
  lastPeak: number,
  lastDate: Date,
  currentDate: Date
): number {
  const daysSince =
    (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 0) return lastPeak;

  const decayed = lastPeak * Math.exp(-daysSince / PEAK_TAU);
  const floor = lastPeak * PEAK_FLOOR_RATIO;
  return Math.round(Math.max(decayed, floor));
}

// ── Full Profile Builder ───────────────────────────────────────────

/**
 * Build a complete power profile from peak power data.
 */
export function buildPowerProfile(
  peaks: Record<string, number>, // e.g. { "5s": 850, "1m": 420, ... }
  weightKg: number
): PowerProfileResult {
  const categories: Record<
    string,
    { watts: number; wPerKg: number; category: PowerCategory }
  > = {};

  let totalLevel = 0;
  let count = 0;

  for (const [key, watts] of Object.entries(peaks)) {
    if (watts <= 0) continue;
    const category = classifyPower(watts, weightKg, key);
    categories[key] = {
      watts,
      wPerKg: category.wPerKg,
      category,
    };
    totalLevel += category.level + category.percentile / 100;
    count++;
  }

  const overallLevel = count > 0 ? totalLevel / count : 0;
  const overallCategoryIndex = Math.min(7, Math.floor(overallLevel));

  // Build categories map for rider type determination
  const categoryMap: Record<string, PowerCategory> = {};
  for (const [key, entry] of Object.entries(categories)) {
    categoryMap[key] = entry.category;
  }

  return {
    peaks: categories,
    riderType: determineRiderType(categoryMap),
    overallLevel,
    overallLabel: CATEGORY_LABELS[overallCategoryIndex],
  };
}

export { DURATION_KEYS, CATEGORY_LABELS };

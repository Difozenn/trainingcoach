/**
 * Power Profile — MMP calculation, percentile classification, rider type
 *
 * Peak powers are calculated via sliding-window max-average at standard durations.
 * Classification uses dual thresholds: absolute watts AND W/kg, taking the higher
 * level. This ensures heavy riders get credit for raw power while light riders
 * benefit from W/kg. Thresholds approximate Strava/intervals.icu percentile ranks.
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
  level: number; // 0-7 (Beginner → World Tour)
  label: string;
  percentile: number; // 0-100 within category
  wPerKg: number;
};

export type RiderType =
  | "Sprinter"
  | "Puncheur"
  | "Time Trialist"
  | "Climber"
  | "Crit Racer"
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
  "Beginner",
  "Recreational",
  "Fitness",
  "Sportive",
  "Competitive",
  "Elite",
  "Semi-Pro",
  "World Tour",
] as const;

/**
 * Absolute watt thresholds for male riders.
 * 7 thresholds per duration → maps to levels 1-7.
 * Below threshold[0] = level 0 (Beginner), above threshold[6] = level 7 (World Tour).
 * Derived from cycling analytics population percentile data.
 */
const WATTS_THRESHOLDS_MALE: Record<string, number[]> = {
  "5s":  [500,  700,  950,  1200, 1400, 1600, 1900],
  "15s": [350,  500,  700,  900,  1100, 1300, 1550],
  "30s": [275,  400,  575,  750,  900,  1050, 1250],
  "1m":  [200,  300,  420,  540,  660,  780,  950],
  "5m":  [150,  215,  280,  340,  400,  460,  530],
  "10m": [130,  190,  250,  310,  365,  420,  490],
  "20m": [120,  175,  230,  285,  330,  385,  450],
  "60m": [100,  150,  200,  250,  290,  340,  420],
};

/**
 * W/kg thresholds for male riders.
 * Same structure as watts thresholds.
 * Benefits lighter riders whose absolute watts don't reflect their W/kg dominance.
 */
const WKG_THRESHOLDS_MALE: Record<string, number[]> = {
  "5s":  [8.0,  10.0, 12.5, 15.0, 17.5, 20.0, 23.0],
  "15s": [6.0,  7.5,  9.5,  12.0, 14.5, 17.0, 20.0],
  "30s": [4.5,  6.0,  7.5,  9.5,  11.5, 13.5, 16.0],
  "1m":  [3.0,  4.0,  5.5,  7.0,  8.5,  10.0, 12.0],
  "5m":  [2.0,  2.8,  3.5,  4.3,  5.0,  5.7,  6.5],
  "10m": [1.8,  2.5,  3.2,  4.0,  4.7,  5.4,  6.2],
  "20m": [1.6,  2.3,  3.0,  3.7,  4.3,  5.0,  5.8],
  "60m": [1.4,  2.0,  2.6,  3.2,  3.8,  4.4,  5.2],
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
 * Classify a value against a threshold array.
 * Returns { level, percentile } where level is 0-7 and percentile is 0-100 within that level.
 */
function classifyAgainstThresholds(
  value: number,
  thresholds: number[]
): { level: number; percentile: number } {
  // Above all thresholds → top level
  if (value >= thresholds[thresholds.length - 1]) {
    const lastThreshold = thresholds[thresholds.length - 1];
    const headroom = lastThreshold * 0.2; // 20% above last threshold = 100%
    const pct = Math.min(100, Math.round(((value - lastThreshold) / headroom) * 100));
    return { level: thresholds.length, percentile: pct };
  }

  // Find which level
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i]) {
      const lower = thresholds[i];
      const upper = i < thresholds.length - 1 ? thresholds[i + 1] : lower * 1.2;
      const pct = Math.round(((value - lower) / (upper - lower)) * 100);
      return { level: i + 1, percentile: Math.min(99, Math.max(0, pct)) };
    }
  }

  // Below all thresholds → level 0
  const pct = Math.round((value / thresholds[0]) * 100);
  return { level: 0, percentile: Math.min(99, Math.max(0, pct)) };
}

/**
 * Classify power using absolute watt thresholds (like Strava).
 * W/kg is shown as supplementary info but doesn't affect the level.
 */
export function classifyPower(
  watts: number,
  weightKg: number,
  durationKey: string
): PowerCategory {
  const wPerKg = watts / weightKg;

  const wattsTable = WATTS_THRESHOLDS_MALE[durationKey];
  if (!wattsTable) {
    return { level: 0, label: CATEGORY_LABELS[0], percentile: 0, wPerKg: Math.round(wPerKg * 100) / 100 };
  }

  const result = classifyAgainstThresholds(watts, wattsTable);

  return {
    level: result.level,
    label: CATEGORY_LABELS[result.level],
    percentile: result.percentile,
    wPerKg: Math.round(wPerKg * 100) / 100,
  };
}

// ── Rider Type ─────────────────────────────────────────────────────

/**
 * Determine rider type by comparing relative strengths at key durations.
 * Uses weighted scoring across 6 rider types (Sprinter, Puncheur, Climber,
 * Time Trialist, Crit Racer, All-Rounder).
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
  const spread = maxLevel - minLevel;

  // All-Rounder: all within 0.8 category levels
  if (spread <= 0.8) return "All-Rounder";

  // Compute relative scores (each level minus mean)
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const rel = {
    sprint: levels.sprint - mean,
    anaerobic: levels.anaerobic - mean,
    vo2max: levels.vo2max - mean,
    ftp: levels.ftp - mean,
  };

  // Weighted scoring per rider type
  const scores: Record<string, number> = {
    Climber: 0.4 * rel.vo2max + 0.4 * rel.ftp + 0.2 * -rel.sprint,
    "Time Trialist": 0.6 * rel.ftp + 0.3 * rel.vo2max + 0.1 * -rel.sprint,
    Sprinter: 0.5 * rel.sprint + 0.3 * rel.anaerobic + 0.2 * -rel.ftp,
    Puncheur: 0.4 * rel.anaerobic + 0.4 * rel.vo2max + 0.2 * -rel.ftp,
    "Crit Racer": 0.4 * rel.anaerobic + 0.3 * rel.sprint + 0.3 * rel.vo2max,
  };

  // Find highest scoring type
  let bestType: RiderType = "All-Rounder";
  let bestScore = -Infinity;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type as RiderType;
    }
  }

  // If top score is weak, default to All-Rounder
  if (bestScore < 0.15) return "All-Rounder";

  return bestType;
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

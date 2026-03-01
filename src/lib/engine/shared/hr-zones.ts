/**
 * Heart Rate Zones — Sport-Specific
 *
 * 5-zone HR model based on % of max HR, with sport-specific max HR offsets.
 *
 * Running max HR is typically 5-10 bpm higher than cycling max HR.
 * Swimming max HR is typically 10-15 bpm lower than cycling max HR
 * (due to horizontal position and water cooling).
 *
 * Zone 1 - Recovery:    50-60% max HR
 * Zone 2 - Endurance:   60-70% max HR
 * Zone 3 - Tempo:       70-80% max HR
 * Zone 4 - Threshold:   80-90% max HR
 * Zone 5 - VO2max+:     90-100% max HR
 *
 * Reference:
 * - ACSM Guidelines for Exercise Testing and Prescription (11th ed.)
 * - Robergs & Landwehr (2002) — max HR estimation
 * - Londeree & Moeschberger (1982) — sport-specific HR differences
 */

export type HrZone = {
  zone: number;
  name: string;
  minHr: number;
  maxHr: number;
  description: string;
};

type Sport = "cycling" | "running" | "swimming";

/**
 * Sport-specific max HR offset from cycling max HR.
 * Running: +5 to +10 bpm (use +7 as default)
 * Swimming: -10 to -15 bpm (use -12 as default)
 * Cycling: baseline (0)
 */
const SPORT_MAX_HR_OFFSET: Record<Sport, number> = {
  cycling: 0,
  running: 7,
  swimming: -12,
};

const ZONE_DEFINITIONS = [
  { zone: 1, name: "Recovery", minPct: 0.50, maxPct: 0.60, description: "Active recovery, warm-up" },
  { zone: 2, name: "Endurance", minPct: 0.60, maxPct: 0.70, description: "Aerobic base, fat burning" },
  { zone: 3, name: "Tempo", minPct: 0.70, maxPct: 0.80, description: "Moderate effort, threshold approach" },
  { zone: 4, name: "Threshold", minPct: 0.80, maxPct: 0.90, description: "Hard, sustainable for ~1hr" },
  { zone: 5, name: "VO2max+", minPct: 0.90, maxPct: 1.00, description: "Very hard to maximal effort" },
] as const;

/**
 * Get sport-specific max HR.
 * If sport-specific max HR is not provided, applies offset to cycling max HR.
 */
export function getSportMaxHr(
  cyclingMaxHr: number,
  sport: Sport,
  sportSpecificMaxHr?: number
): number {
  if (sportSpecificMaxHr) return sportSpecificMaxHr;
  return cyclingMaxHr + SPORT_MAX_HR_OFFSET[sport];
}

/**
 * Calculate HR zones for a specific sport.
 */
export function getHrZones(maxHr: number): HrZone[] {
  return ZONE_DEFINITIONS.map((def) => ({
    zone: def.zone,
    name: def.name,
    minHr: Math.round(maxHr * def.minPct),
    maxHr: Math.round(maxHr * def.maxPct),
    description: def.description,
  }));
}

/**
 * Determine which HR zone a given heart rate falls into.
 */
export function getHrZoneNumber(hr: number, maxHr: number): number {
  const pct = hr / maxHr;
  if (pct < 0.60) return 1;
  if (pct < 0.70) return 2;
  if (pct < 0.80) return 3;
  if (pct < 0.90) return 4;
  return 5;
}

/**
 * Calculate HR zone distribution from an HR stream.
 * @returns Array of 5 values (zones 1-5) as percentage of total time.
 */
export function calculateHrZoneDistribution(
  hrStream: number[],
  maxHr: number
): number[] {
  const zoneCounts = [0, 0, 0, 0, 0];
  const total = hrStream.length;

  if (total === 0) return zoneCounts;

  for (const hr of hrStream) {
    const zone = getHrZoneNumber(hr, maxHr);
    zoneCounts[zone - 1]++;
  }

  return zoneCounts.map((count) =>
    Math.round((count / total) * 1000) / 10
  );
}

/**
 * Estimate max HR using the Tanaka formula (more accurate than 220-age).
 * Max HR = 208 - (0.7 × age)
 *
 * Reference: Tanaka, Monahan & Seals (2001)
 */
export function estimateMaxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

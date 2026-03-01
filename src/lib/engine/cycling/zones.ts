/**
 * Coggan 7-Zone Power Model
 *
 * Based on % of FTP:
 * Zone 1 - Active Recovery:  < 55% FTP
 * Zone 2 - Endurance:        55-75% FTP
 * Zone 3 - Tempo:            76-90% FTP
 * Zone 4 - Threshold:        91-105% FTP
 * Zone 5 - VO2max:           106-120% FTP
 * Zone 6 - Anaerobic:        121-150% FTP
 * Zone 7 - Neuromuscular:    > 150% FTP
 *
 * Reference: Coggan, A.R. & Allen, H. Training and Racing with a Power Meter.
 */

export type PowerZone = {
  zone: number;
  name: string;
  minWatts: number;
  maxWatts: number | null; // null = no upper limit
  minPctFtp: number;
  maxPctFtp: number | null;
  description: string;
};

const ZONE_DEFINITIONS = [
  { zone: 1, name: "Active Recovery", minPct: 0, maxPct: 0.55, description: "Easy spinning, recovery" },
  { zone: 2, name: "Endurance", minPct: 0.55, maxPct: 0.75, description: "All-day pace, aerobic base" },
  { zone: 3, name: "Tempo", minPct: 0.76, maxPct: 0.90, description: "Moderate effort, group rides" },
  { zone: 4, name: "Threshold", minPct: 0.91, maxPct: 1.05, description: "Race pace, ~1hr sustainable" },
  { zone: 5, name: "VO2max", minPct: 1.06, maxPct: 1.20, description: "Hard intervals, 3-8min efforts" },
  { zone: 6, name: "Anaerobic", minPct: 1.21, maxPct: 1.50, description: "Short, intense efforts, 30s-2min" },
  { zone: 7, name: "Neuromuscular", minPct: 1.51, maxPct: null, description: "Max sprints, <30s" },
] as const;

/**
 * Calculate cycling power zones based on FTP.
 */
export function getCyclingPowerZones(ftp: number): PowerZone[] {
  return ZONE_DEFINITIONS.map((def) => ({
    zone: def.zone,
    name: def.name,
    minWatts: Math.round(ftp * def.minPct),
    maxWatts: def.maxPct !== null ? Math.round(ftp * def.maxPct) : null,
    minPctFtp: def.minPct,
    maxPctFtp: def.maxPct,
    description: def.description,
  }));
}

/**
 * Determine which zone a given power value falls into.
 */
export function getPowerZone(watts: number, ftp: number): number {
  const pctFtp = watts / ftp;
  if (pctFtp < 0.55) return 1;
  if (pctFtp <= 0.75) return 2;
  if (pctFtp <= 0.90) return 3;
  if (pctFtp <= 1.05) return 4;
  if (pctFtp <= 1.20) return 5;
  if (pctFtp <= 1.50) return 6;
  return 7;
}

/**
 * Calculate time-in-zone distribution from a power stream.
 * @returns Array of 7 values (zone 1-7), each as percentage of total time.
 */
export function calculateZoneDistribution(
  powerStream: number[],
  ftp: number
): number[] {
  const zoneCounts = [0, 0, 0, 0, 0, 0, 0]; // zones 1-7
  const total = powerStream.length;

  if (total === 0) return zoneCounts;

  for (const watts of powerStream) {
    const zone = getPowerZone(watts, ftp);
    zoneCounts[zone - 1]++;
  }

  return zoneCounts.map((count) =>
    Math.round((count / total) * 1000) / 10
  );
}

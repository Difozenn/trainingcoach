/**
 * Running 6-Zone Pace Model
 *
 * Based on threshold pace (also known as lactate threshold pace).
 *
 * Zone 1 - Recovery:    > 129% threshold pace (slower)
 * Zone 2 - Endurance:   114-129% threshold pace
 * Zone 3 - Tempo:       106-113% threshold pace
 * Zone 4 - Threshold:   99-105% threshold pace
 * Zone 5a - VO2max:     97-98% threshold pace (faster)
 * Zone 5b - Anaerobic:  < 97% threshold pace
 *
 * Note: Higher pace numbers = slower. Zone percentages are inverted from power.
 *
 * Reference: Joe Friel's pace zones; Jack Daniels' VDOT-based training zones.
 */

export type PaceZone = {
  zone: string;
  name: string;
  minPaceSecPerKm: number | null; // null = no lower limit (fastest)
  maxPaceSecPerKm: number | null; // null = no upper limit (slowest)
  paceRangeFormatted: string;
  description: string;
};

const ZONE_DEFINITIONS = [
  { zone: "1", name: "Recovery", minPctOfThreshold: 1.29, maxPctOfThreshold: null, description: "Easy jog, active recovery" },
  { zone: "2", name: "Endurance", minPctOfThreshold: 1.14, maxPctOfThreshold: 1.29, description: "Aerobic base, long runs" },
  { zone: "3", name: "Tempo", minPctOfThreshold: 1.06, maxPctOfThreshold: 1.13, description: "Comfortably hard, marathon pace" },
  { zone: "4", name: "Threshold", minPctOfThreshold: 0.99, maxPctOfThreshold: 1.05, description: "Lactate threshold, ~1hr race pace" },
  { zone: "5a", name: "VO2max", minPctOfThreshold: 0.90, maxPctOfThreshold: 0.98, description: "Hard intervals, 3-5min efforts" },
  { zone: "5b", name: "Anaerobic", minPctOfThreshold: null, maxPctOfThreshold: 0.90, description: "Sprint intervals, <2min efforts" },
] as const;

/**
 * Format pace as min:sec per km.
 */
export function formatPace(secPerKm: number): string {
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate running pace zones based on threshold pace.
 * @param thresholdPaceSecPerKm - Threshold pace in seconds per km
 */
export function getRunningPaceZones(
  thresholdPaceSecPerKm: number
): PaceZone[] {
  return ZONE_DEFINITIONS.map((def) => {
    const minPace =
      def.minPctOfThreshold !== null
        ? Math.round(thresholdPaceSecPerKm * def.minPctOfThreshold)
        : null;
    const maxPace =
      def.maxPctOfThreshold !== null
        ? Math.round(thresholdPaceSecPerKm * def.maxPctOfThreshold)
        : null;

    // For pace, min number = fastest, max number = slowest
    // Zone display: faster - slower
    const fastPace = maxPace; // lower number = faster
    const slowPace = minPace; // higher number = slower

    let paceRange: string;
    if (fastPace === null) {
      paceRange = `< ${formatPace(slowPace!)} /km`;
    } else if (slowPace === null) {
      paceRange = `> ${formatPace(fastPace)} /km`;
    } else {
      paceRange = `${formatPace(fastPace)} - ${formatPace(slowPace)} /km`;
    }

    return {
      zone: def.zone,
      name: def.name,
      minPaceSecPerKm: slowPace, // slowest (highest number)
      maxPaceSecPerKm: fastPace, // fastest (lowest number)
      paceRangeFormatted: paceRange,
      description: def.description,
    };
  });
}

/**
 * Determine which zone a given pace falls into.
 * @param paceSecPerKm - Pace in seconds per km
 * @param thresholdPaceSecPerKm - Threshold pace in seconds per km
 */
export function getRunningZone(
  paceSecPerKm: number,
  thresholdPaceSecPerKm: number
): string {
  const ratio = paceSecPerKm / thresholdPaceSecPerKm;
  if (ratio > 1.29) return "1";
  if (ratio > 1.13) return "2";
  if (ratio > 1.05) return "3";
  if (ratio > 0.98) return "4";
  if (ratio > 0.90) return "5a";
  return "5b";
}

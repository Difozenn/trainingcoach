/**
 * Swimming 5-Zone CSS Model
 *
 * Based on % of CSS (Critical Swim Speed):
 *
 * Zone 1 - Recovery:    > 115% CSS pace (slower)
 * Zone 2 - Endurance:   100-115% CSS pace
 * Zone 3 - Threshold:   92-99% CSS pace (around CSS)
 * Zone 4 - VO2max:      85-91% CSS pace (faster)
 * Zone 5 - Sprint:      < 85% CSS pace (much faster)
 *
 * Note: Like running, higher pace = slower. Zone percentages relate
 * to pace (not speed), so higher % = slower pace = easier.
 *
 * Reference: swimsmooth.com zone model; British Swimming training zones.
 */

export type SwimZone = {
  zone: number;
  name: string;
  minPaceSPer100m: number | null; // fastest (lowest) pace, null = no limit
  maxPaceSPer100m: number | null; // slowest (highest) pace, null = no limit
  paceRangeFormatted: string;
  description: string;
};

const ZONE_DEFINITIONS = [
  { zone: 1, name: "Recovery", minPctOfCss: 1.15, maxPctOfCss: null, description: "Easy swimming, drills, warm-up" },
  { zone: 2, name: "Endurance", minPctOfCss: 1.00, maxPctOfCss: 1.15, description: "Aerobic base, steady swimming" },
  { zone: 3, name: "Threshold", minPctOfCss: 0.92, maxPctOfCss: 0.99, description: "CSS pace, sustainable hard effort" },
  { zone: 4, name: "VO2max", minPctOfCss: 0.85, maxPctOfCss: 0.91, description: "High intensity, 200-400m intervals" },
  { zone: 5, name: "Sprint", minPctOfCss: null, maxPctOfCss: 0.85, description: "Max effort, 25-100m sprints" },
] as const;

/**
 * Format swim pace as min:sec per 100m.
 */
export function formatSwimPace(secPer100m: number): string {
  const mins = Math.floor(secPer100m / 60);
  const secs = Math.round(secPer100m % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate swimming zones based on CSS.
 * @param cssSPer100m - CSS in seconds per 100m
 */
export function getSwimmingZones(cssSPer100m: number): SwimZone[] {
  return ZONE_DEFINITIONS.map((def) => {
    const slowPace =
      def.minPctOfCss !== null
        ? Math.round(cssSPer100m * def.minPctOfCss)
        : null;
    const fastPace =
      def.maxPctOfCss !== null
        ? Math.round(cssSPer100m * def.maxPctOfCss)
        : null;

    let paceRange: string;
    if (fastPace === null) {
      paceRange = `< ${formatSwimPace(slowPace!)} /100m`;
    } else if (slowPace === null) {
      paceRange = `> ${formatSwimPace(fastPace)} /100m`;
    } else {
      paceRange = `${formatSwimPace(fastPace)} - ${formatSwimPace(slowPace)} /100m`;
    }

    return {
      zone: def.zone,
      name: def.name,
      minPaceSPer100m: slowPace,
      maxPaceSPer100m: fastPace,
      paceRangeFormatted: paceRange,
      description: def.description,
    };
  });
}

/**
 * Determine which zone a given swim pace falls into.
 */
export function getSwimZone(
  paceSPer100m: number,
  cssSPer100m: number
): number {
  const ratio = paceSPer100m / cssSPer100m;
  if (ratio > 1.15) return 1;
  if (ratio > 0.99) return 2;
  if (ratio > 0.91) return 3;
  if (ratio > 0.85) return 4;
  return 5;
}

/**
 * MRC/ERG Generator — Smart Trainer Workout Files
 *
 * MRC format: Power as % of FTP (portable across athletes)
 * ERG format: Absolute watts (athlete-specific)
 *
 * Both are simple text formats with [COURSE HEADER] and [COURSE DATA] sections.
 * Time in minutes, power as % FTP (MRC) or watts (ERG).
 *
 * Compatible with: TrainerRoad, Wahoo SYSTM, most smart trainers
 */

import type { WorkoutInterval } from "@/lib/db/schema/training";

/**
 * Generate an MRC file (% FTP based).
 */
export function generateMRC(
  name: string,
  description: string,
  structure: WorkoutInterval[]
): string {
  const dataLines = buildDataLines(structure, "pct");

  return `[COURSE HEADER]
VERSION = 2
UNITS = ENGLISH
DESCRIPTION = ${description}
FILE NAME = ${name}
MINUTES PERCENT
[END COURSE HEADER]
[COURSE DATA]
${dataLines}
[END COURSE DATA]`;
}

/**
 * Generate an ERG file (absolute watts).
 */
export function generateERG(
  name: string,
  description: string,
  structure: WorkoutInterval[],
  ftp: number
): string {
  const dataLines = buildDataLines(structure, "watts", ftp);

  return `[COURSE HEADER]
VERSION = 2
UNITS = ENGLISH
DESCRIPTION = ${description}
FILE NAME = ${name}
MINUTES WATTS
FTP = ${ftp}
[END COURSE HEADER]
[COURSE DATA]
${dataLines}
[END COURSE DATA]`;
}

function buildDataLines(
  structure: WorkoutInterval[],
  mode: "pct" | "watts",
  ftp?: number
): string {
  const lines: string[] = [];
  let currentMinute = 0;

  function flattenIntervals(intervals: WorkoutInterval[]): WorkoutInterval[] {
    const flat: WorkoutInterval[] = [];
    for (const interval of intervals) {
      if (interval.repeat && interval.intervals) {
        for (let i = 0; i < interval.repeat; i++) {
          flat.push(...flattenIntervals(interval.intervals));
        }
      } else {
        flat.push(interval);
      }
    }
    return flat;
  }

  const flatIntervals = flattenIntervals(structure);

  for (const interval of flatIntervals) {
    const durationMinutes = interval.durationSeconds / 60;
    const pctFtp = (interval.powerTargetPctFtp ?? 0.5) * 100;
    const value = mode === "watts" && ftp ? Math.round(pctFtp / 100 * ftp) : Math.round(pctFtp);

    // Start of segment
    lines.push(`${currentMinute.toFixed(2)}\t${value}`);

    // Handle ramps
    if (interval.type === "warmup" || interval.type === "ramp") {
      const endValue = mode === "watts" && ftp ? Math.round(pctFtp / 100 * ftp) : Math.round(pctFtp);
      currentMinute += durationMinutes;
      lines.push(`${currentMinute.toFixed(2)}\t${endValue}`);
    } else {
      // End of segment (same power for steady state)
      currentMinute += durationMinutes;
      lines.push(`${currentMinute.toFixed(2)}\t${value}`);
    }
  }

  return lines.join("\n");
}

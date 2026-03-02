/**
 * ZWO Generator — Zwift Workout Files
 *
 * ZWO is XML-based. Power targets are expressed as decimal % of FTP
 * (e.g., 0.75 = 75% FTP). Zwift calculates absolute watts based on
 * the rider's in-game FTP.
 *
 * Supported elements: Warmup, SteadyState, IntervalsT, Cooldown, FreeRide
 * Text events can display coaching tips at specific timestamps.
 */

import type { WorkoutInterval } from "@/lib/db/schema/training";

/**
 * Generate a ZWO file from workout structure.
 *
 * @param name - Workout name
 * @param description - Workout description
 * @param structure - Array of workout intervals
 * @returns ZWO XML string
 */
export function generateZWO(
  name: string,
  description: string,
  structure: WorkoutInterval[]
): string {
  const segments = structure
    .flatMap((interval) => intervalToZWO(interval))
    .join("\n        ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
    <author>Paincave</author>
    <name>${escapeXml(name)}</name>
    <description>${escapeXml(description)}</description>
    <sportType>bike</sportType>
    <workout>
        ${segments}
    </workout>
</workout_file>`;
}

function intervalToZWO(interval: WorkoutInterval): string[] {
  const segments: string[] = [];
  const power = interval.powerTargetPctFtp ?? 0.5;

  // Handle repeated intervals
  if (interval.repeat && interval.intervals) {
    const innerSegments = interval.intervals
      .flatMap((sub) => intervalToZWO(sub))
      .join("\n            ");

    // Use IntervalsT for repeated work/rest blocks
    if (interval.intervals.length === 2) {
      const work = interval.intervals[0];
      const rest = interval.intervals[1];
      segments.push(
        `<IntervalsT Repeat="${interval.repeat}" OnDuration="${work.durationSeconds}" OffDuration="${rest.durationSeconds}" OnPower="${work.powerTargetPctFtp ?? 1.0}" OffPower="${rest.powerTargetPctFtp ?? 0.5}"${work.cadenceTarget ? ` Cadence="${work.cadenceTarget}"` : ""} />`
      );
    } else {
      // For complex repeated blocks, unroll them
      for (let i = 0; i < interval.repeat; i++) {
        segments.push(innerSegments);
      }
    }
    return segments;
  }

  switch (interval.type) {
    case "warmup":
      segments.push(
        `<Warmup Duration="${interval.durationSeconds}" PowerLow="0.25" PowerHigh="${power}"${interval.cadenceTarget ? ` Cadence="${interval.cadenceTarget}"` : ""} />`
      );
      break;

    case "cooldown":
      segments.push(
        `<Cooldown Duration="${interval.durationSeconds}" PowerLow="${power}" PowerHigh="0.25"${interval.cadenceTarget ? ` Cadence="${interval.cadenceTarget}"` : ""} />`
      );
      break;

    case "ramp":
      segments.push(
        `<Ramp Duration="${interval.durationSeconds}" PowerLow="${power * 0.8}" PowerHigh="${power}"${interval.cadenceTarget ? ` Cadence="${interval.cadenceTarget}"` : ""} />`
      );
      break;

    case "work":
    case "rest":
    default:
      segments.push(
        `<SteadyState Duration="${interval.durationSeconds}" Power="${power}"${interval.cadenceTarget ? ` Cadence="${interval.cadenceTarget}"` : ""} />`
      );
      if (interval.notes) {
        segments.push(
          `<textevent timeoffset="0" message="${escapeXml(interval.notes)}" />`
        );
      }
      break;
  }

  return segments;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

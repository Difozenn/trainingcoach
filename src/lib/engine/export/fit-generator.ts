/**
 * FIT Generator — Garmin Workout Files
 *
 * FIT is a binary format. For full FIT file generation,
 * use @garmin/fitsdk. This module provides the abstraction layer.
 *
 * Generates workout FIT files that can be imported to Garmin Connect
 * and synced to Garmin devices (Edge, Forerunner, Fenix, etc).
 *
 * Note: @garmin/fitsdk handles the binary encoding.
 * This module converts our WorkoutInterval structure to FIT workout steps.
 */

import type { WorkoutInterval } from "@/lib/db/schema/training";

export type FITWorkoutStep = {
  messageIndex: number;
  durationType: "time" | "distance" | "open";
  durationValue: number; // milliseconds for time, meters for distance
  targetType: "power" | "heart_rate" | "speed" | "open";
  targetValue: number;
  intensity: "warmup" | "active" | "recovery" | "cooldown" | "rest";
  notes?: string;
};

/**
 * Convert workout intervals to FIT workout steps.
 * The actual binary FIT encoding should use @garmin/fitsdk.
 */
export function convertToFITSteps(
  structure: WorkoutInterval[],
  ftp?: number
): FITWorkoutStep[] {
  const steps: FITWorkoutStep[] = [];
  let messageIndex = 0;

  function processInterval(interval: WorkoutInterval) {
    if (interval.repeat && interval.intervals) {
      for (let i = 0; i < interval.repeat; i++) {
        for (const sub of interval.intervals) {
          processInterval(sub);
        }
      }
      return;
    }

    const step: FITWorkoutStep = {
      messageIndex: messageIndex++,
      durationType: "time",
      durationValue: interval.durationSeconds * 1000, // FIT uses milliseconds
      targetType: "open",
      targetValue: 0,
      intensity: mapIntensity(interval.type),
      notes: interval.notes,
    };

    // Set power target if available
    if (interval.powerTargetPctFtp !== undefined && ftp) {
      step.targetType = "power";
      step.targetValue = Math.round(interval.powerTargetPctFtp * ftp);
    } else if (interval.powerTargetWatts !== undefined) {
      step.targetType = "power";
      step.targetValue = interval.powerTargetWatts;
    } else if (interval.hrTargetBpm !== undefined) {
      step.targetType = "heart_rate";
      step.targetValue = interval.hrTargetBpm;
    }

    steps.push(step);
  }

  for (const interval of structure) {
    processInterval(interval);
  }

  return steps;
}

function mapIntensity(
  type: WorkoutInterval["type"]
): FITWorkoutStep["intensity"] {
  switch (type) {
    case "warmup":
      return "warmup";
    case "cooldown":
      return "cooldown";
    case "rest":
      return "rest";
    case "work":
      return "active";
    case "ramp":
      return "active";
    default:
      return "active";
  }
}

/**
 * Generate a simple FIT-compatible JSON representation.
 * For actual binary FIT output, use @garmin/fitsdk with these steps.
 */
export function generateFITWorkoutJSON(
  name: string,
  sport: "cycling" | "running" | "swimming",
  structure: WorkoutInterval[],
  ftp?: number
) {
  return {
    fileType: "workout",
    manufacturer: "development",
    product: 0,
    serialNumber: 0,
    workout: {
      workoutName: name,
      sport: sport === "cycling" ? "cycling" : sport === "running" ? "running" : "swimming",
      numValidSteps: structure.length,
    },
    workoutSteps: convertToFITSteps(structure, ftp),
  };
}

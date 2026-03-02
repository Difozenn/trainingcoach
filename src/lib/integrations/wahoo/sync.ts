/**
 * Wahoo Workout Sync
 *
 * Fetches and processes Wahoo workouts into our standard activity format.
 */

import { wahooFetch } from "./client";
import type { WahooWorkout } from "./types";
import { mapWahooToSport } from "./types";

type WahooWorkoutsResponse = {
  workouts: WahooWorkout[];
  total: number;
  page: number;
  per_page: number;
};

export async function fetchWorkouts(
  accessToken: string,
  page = 1,
  perPage = 50
): Promise<WahooWorkout[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const data = await wahooFetch<WahooWorkoutsResponse>(
    accessToken,
    `/v1/workouts?${params}`
  );
  return data.workouts;
}

export async function fetchWorkoutSummary(
  accessToken: string,
  workoutId: number
): Promise<WahooWorkout> {
  return wahooFetch<WahooWorkout>(
    accessToken,
    `/v1/workouts/${workoutId}`
  );
}

export function processWahooWorkout(workout: WahooWorkout) {
  const sport = mapWahooToSport(workout.workout_type_id);
  if (!sport) return null;

  const summary = workout.workout_summary;

  return {
    externalId: String(workout.id),
    platform: "wahoo" as const,
    sport,
    name: workout.name || `Wahoo ${sport}`,
    description: null,
    startedAt: new Date(workout.starts),
    durationSeconds: summary?.duration_active_accum ?? Math.round(workout.minutes * 60),
    movingTimeSeconds: summary?.duration_active_accum ?? Math.round(workout.minutes * 60),
    elapsedTimeSeconds: summary?.duration_total_accum ?? Math.round(workout.minutes * 60),
    distanceMeters: summary?.distance_accum ?? 0,
    elevationGainMeters: summary?.ascent_accum ?? 0,
    averageHr: summary?.heart_rate_avg ? Math.round(summary.heart_rate_avg) : null,
    maxHr: summary?.heart_rate_max ? Math.round(summary.heart_rate_max) : null,
    averagePowerWatts: summary?.power_avg ? Math.round(summary.power_avg) : null,
    maxPowerWatts: summary?.power_max ? Math.round(summary.power_max) : null,
    averageCadence: summary?.cadence_avg ?? null,
    averageSpeedMps: summary?.speed_avg ?? 0,
    poolLengthMeters: null,
    averageSwolf: null,
    gearId: null,
    // Wahoo-specific power data for TSS calculation
    normalizedPower: summary?.power_bike_np_last ? Math.round(summary.power_bike_np_last) : null,
    wahooTss: summary?.power_bike_tss_last ? Math.round(summary.power_bike_tss_last) : null,
  };
}

/**
 * Wahoo Cloud API Response Types
 *
 * Wahoo is cycling-focused. Their API returns workout summaries
 * with power, HR, and TSS data when available.
 */

export type WahooUser = {
  id: number;
  email: string;
  first: string;
  last: string;
  created_at: string;
  updated_at: string;
};

export type WahooWorkout = {
  id: number;
  starts: string; // ISO 8601
  minutes: number;
  name: string;
  workout_token: string;
  workout_type_id: number; // 0=cycling, 1=running, etc.
  workout_summary?: WahooWorkoutSummary;
  created_at: string;
  updated_at: string;
};

export type WahooWorkoutSummary = {
  id: number;
  ascent_accum: number | null; // meters
  calories_accum: number | null;
  distance_accum: number | null; // meters
  duration_active_accum: number | null; // seconds
  duration_paused_accum: number | null;
  duration_total_accum: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  power_avg: number | null;
  power_max: number | null;
  power_bike_np_last: number | null; // Normalized Power
  power_bike_tss_last: number | null; // TSS from Wahoo
  cadence_avg: number | null;
  speed_avg: number | null; // m/s
  speed_max: number | null;
  created_at: string;
  updated_at: string;
};

export type WahooWebhookEvent = {
  event_type: "workout_summary";
  webhook_token: string;
  user: { id: number };
  workout_summary: WahooWorkoutSummary;
  workout: WahooWorkout;
};

/**
 * Map Wahoo workout_type_id to our sport enum.
 * Wahoo: 0=cycling, 1=running, 2=swimming, 5=e-bike, 12=indoor cycling
 */
export function mapWahooToSport(
  workoutTypeId: number
): "cycling" | "running" | "swimming" | null {
  const cyclingTypes = [0, 5, 12];
  if (cyclingTypes.includes(workoutTypeId)) return "cycling";
  if (workoutTypeId === 1) return "running";
  if (workoutTypeId === 2) return "swimming";
  return null;
}

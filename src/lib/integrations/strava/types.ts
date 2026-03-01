/**
 * Strava API Response Types
 *
 * Subset of Strava API v3 types used by TrainingCoach.
 */

export type StravaActivity = {
  id: number;
  name: string;
  description: string | null;
  type: string; // "Ride", "Run", "Swim", etc.
  sport_type: string; // More specific: "MountainBikeRide", "TrailRun", etc.
  start_date: string; // ISO 8601
  start_date_local: string;
  timezone: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number; // Strava's NP calculation
  kilojoules?: number;
  average_cadence?: number;
  gear_id?: string;
  device_watts?: boolean; // true = real power meter
  has_heartrate: boolean;
  // Swimming-specific
  average_swolf?: number;
  pool_length?: number;
};

export type StravaStream = {
  type: string;
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
};

export type StravaStreamSet = {
  time?: StravaStream;
  watts?: StravaStream;
  heartrate?: StravaStream;
  cadence?: StravaStream;
  velocity_smooth?: StravaStream;
  altitude?: StravaStream;
  distance?: StravaStream;
  latlng?: { type: string; data: [number, number][] };
  grade_smooth?: StravaStream;
};

export type StravaWebhookEvent = {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, string>;
};

/**
 * Map Strava activity types to our sport enum.
 */
export function mapStravaToSport(
  type: string
): "cycling" | "running" | "swimming" | null {
  const cyclingTypes = [
    "Ride",
    "VirtualRide",
    "MountainBikeRide",
    "GravelRide",
    "EBikeRide",
    "Velodrome",
  ];
  const runningTypes = [
    "Run",
    "VirtualRun",
    "TrailRun",
  ];
  const swimmingTypes = ["Swim"];

  if (cyclingTypes.includes(type)) return "cycling";
  if (runningTypes.includes(type)) return "running";
  if (swimmingTypes.includes(type)) return "swimming";
  return null;
}

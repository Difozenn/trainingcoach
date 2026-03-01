/**
 * Strava Activity Sync
 *
 * Handles fetching activities and streams from Strava,
 * detecting sport type, storing data, and triggering
 * metric calculations.
 */

import { stravaFetch } from "./client";
import type { StravaActivity, StravaStreamSet } from "./types";
import { mapStravaToSport } from "./types";

/**
 * Fetch a page of activities from Strava.
 */
export async function fetchActivities(
  accessToken: string,
  page = 1,
  perPage = 50,
  after?: number // Unix timestamp
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (after) params.set("after", String(after));

  return stravaFetch<StravaActivity[]>(
    accessToken,
    `/athlete/activities?${params}`
  );
}

/**
 * Fetch detailed activity data including streams.
 */
export async function fetchActivityDetail(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  return stravaFetch<StravaActivity>(
    accessToken,
    `/activities/${activityId}`
  );
}

/**
 * Fetch activity streams (second-by-second data).
 */
export async function fetchActivityStreams(
  accessToken: string,
  activityId: number
): Promise<StravaStreamSet> {
  const streamTypes = [
    "time",
    "watts",
    "heartrate",
    "cadence",
    "velocity_smooth",
    "altitude",
    "distance",
    "latlng",
    "grade_smooth",
  ].join(",");

  const streams = await stravaFetch<StravaStreamSet>(
    accessToken,
    `/activities/${activityId}/streams?keys=${streamTypes}&key_by_type=true`
  );

  return streams;
}

/**
 * Process a Strava activity: detect sport, extract metrics.
 */
export function processStravaActivity(activity: StravaActivity) {
  const sport = mapStravaToSport(activity.type);
  if (!sport) return null;

  return {
    externalId: String(activity.id),
    platform: "strava" as const,
    sport,
    name: activity.name,
    description: activity.description,
    startedAt: new Date(activity.start_date),
    durationSeconds: activity.moving_time,
    movingTimeSeconds: activity.moving_time,
    elapsedTimeSeconds: activity.elapsed_time,
    distanceMeters: activity.distance,
    elevationGainMeters: activity.total_elevation_gain,
    averageHr: activity.average_heartrate
      ? Math.round(activity.average_heartrate)
      : null,
    maxHr: activity.max_heartrate
      ? Math.round(activity.max_heartrate)
      : null,
    averagePowerWatts: activity.average_watts
      ? Math.round(activity.average_watts)
      : null,
    maxPowerWatts: activity.max_watts
      ? Math.round(activity.max_watts)
      : null,
    averageCadence: activity.average_cadence ?? null,
    averageSpeedMps: activity.average_speed,
    poolLengthMeters: activity.pool_length ?? null,
    averageSwolf: activity.average_swolf ?? null,
    gearId: activity.gear_id ?? null,
  };
}

/**
 * Garmin Activity & Health Data Sync
 *
 * Activities: fetched from Garmin Health API, processed into our standard format.
 * Health: dailies (resting HR, body battery, stress), sleep (HRV, sleep score).
 */

import { garminFetch } from "./client";
import type { GarminTokens } from "./client";
import type {
  GarminActivity,
  GarminDaily,
  GarminSleep,
  GarminHrvSummary,
} from "./types";
import { mapGarminToSport, computeSleepScore } from "./types";

// ── Activity Sync ───────────────────────────────────────────────────

export async function fetchActivities(
  tokens: GarminTokens,
  startTimeInSeconds: number,
  endTimeInSeconds: number
): Promise<GarminActivity[]> {
  return garminFetch<GarminActivity[]>(tokens, "/wellness-api/rest/activities", {
    params: {
      uploadStartTimeInSeconds: String(startTimeInSeconds),
      uploadEndTimeInSeconds: String(endTimeInSeconds),
    },
  });
}

export async function fetchActivityDetail(
  tokens: GarminTokens,
  activityId: number
): Promise<GarminActivity> {
  // Activity detail comes from the activities endpoint filtered by ID
  const activities = await garminFetch<GarminActivity[]>(
    tokens,
    `/wellness-api/rest/activities/${activityId}`
  );
  // Single activity returns as array with one element or as object
  return Array.isArray(activities) ? activities[0] : activities;
}

// ── Health Data Sync ────────────────────────────────────────────────

export async function fetchDailies(
  tokens: GarminTokens,
  startTimeInSeconds: number,
  endTimeInSeconds: number
): Promise<GarminDaily[]> {
  return garminFetch<GarminDaily[]>(tokens, "/wellness-api/rest/dailies", {
    params: {
      uploadStartTimeInSeconds: String(startTimeInSeconds),
      uploadEndTimeInSeconds: String(endTimeInSeconds),
    },
  });
}

export async function fetchSleep(
  tokens: GarminTokens,
  startTimeInSeconds: number,
  endTimeInSeconds: number
): Promise<GarminSleep[]> {
  return garminFetch<GarminSleep[]>(tokens, "/wellness-api/rest/sleeps", {
    params: {
      uploadStartTimeInSeconds: String(startTimeInSeconds),
      uploadEndTimeInSeconds: String(endTimeInSeconds),
    },
  });
}

export async function fetchHrvSummaries(
  tokens: GarminTokens,
  startTimeInSeconds: number,
  endTimeInSeconds: number
): Promise<GarminHrvSummary[]> {
  return garminFetch<GarminHrvSummary[]>(tokens, "/wellness-api/rest/hrv", {
    params: {
      uploadStartTimeInSeconds: String(startTimeInSeconds),
      uploadEndTimeInSeconds: String(endTimeInSeconds),
    },
  });
}

// ── Processing ──────────────────────────────────────────────────────

export function processGarminActivity(activity: GarminActivity) {
  const sport = mapGarminToSport(activity.activityType);
  if (!sport) return null;

  return {
    externalId: String(activity.activityId),
    platform: "garmin" as const,
    sport,
    name: activity.activityName || `Garmin ${sport}`,
    description: null,
    startedAt: new Date(activity.startTimeInSeconds * 1000),
    durationSeconds: activity.movingDurationInSeconds ?? activity.durationInSeconds,
    movingTimeSeconds: activity.movingDurationInSeconds ?? activity.durationInSeconds,
    elapsedTimeSeconds: activity.elapsedDurationInSeconds ?? activity.durationInSeconds,
    distanceMeters: activity.distanceInMeters,
    elevationGainMeters: activity.elevationGainInMeters ?? 0,
    averageHr: activity.averageHeartRateInBeatsPerMinute
      ? Math.round(activity.averageHeartRateInBeatsPerMinute)
      : null,
    maxHr: activity.maxHeartRateInBeatsPerMinute
      ? Math.round(activity.maxHeartRateInBeatsPerMinute)
      : null,
    averagePowerWatts: activity.averagePowerInWatts
      ? Math.round(activity.averagePowerInWatts)
      : null,
    maxPowerWatts: activity.maxPowerInWatts
      ? Math.round(activity.maxPowerInWatts)
      : null,
    averageCadence: activity.averageBikeCadenceInRoundsPerMinute
      ?? activity.averageRunCadenceInStepsPerMinute
      ?? activity.averageSwimCadenceInStrokesPerMinute
      ?? null,
    averageSpeedMps: activity.averageSpeedInMetersPerSecond ?? 0,
    poolLengthMeters: activity.poolLengthInMeters ?? null,
    averageSwolf: activity.averageSwolf ?? null,
    gearId: null,
    // Garmin-specific metrics for TSS passthrough
    garminNp: activity.normalizedPowerInWatts
      ? Math.round(activity.normalizedPowerInWatts)
      : null,
    garminTss: activity.trainingStressScore
      ? Math.round(activity.trainingStressScore)
      : null,
    garminIf: activity.intensityFactor ?? null,
  };
}

/**
 * Process Garmin health data (dailies + sleep + HRV) into daily metric updates.
 * Returns a map of calendarDate → health fields to upsert.
 */
export function processHealthData(
  dailies: GarminDaily[],
  sleeps: GarminSleep[],
  hrvSummaries: GarminHrvSummary[]
): Map<string, HealthDataUpdate> {
  const updates = new Map<string, HealthDataUpdate>();

  // Process dailies → resting HR, body battery, stress
  for (const daily of dailies) {
    const date = daily.calendarDate;
    const existing = updates.get(date) ?? {};
    updates.set(date, {
      ...existing,
      restingHr: daily.restingHeartRateInBeatsPerMinute ?? existing.restingHr ?? null,
      bodyBattery: daily.bodyBatteryHighestValue ?? existing.bodyBattery ?? null,
      stressLevel: daily.averageStressLevel ?? existing.stressLevel ?? null,
    });
  }

  // Process sleep → sleep score
  for (const sleep of sleeps) {
    const date = sleep.calendarDate;
    const existing = updates.get(date) ?? {};
    const sleepScore = computeSleepScore(sleep);
    updates.set(date, {
      ...existing,
      sleepScore: sleepScore ?? existing.sleepScore ?? null,
    });
  }

  // Process HRV summaries
  for (const hrv of hrvSummaries) {
    const date = hrv.calendarDate;
    const existing = updates.get(date) ?? {};
    updates.set(date, {
      ...existing,
      hrv: hrv.hrvValue ?? existing.hrv ?? null,
    });
  }

  return updates;
}

export type HealthDataUpdate = {
  restingHr?: number | null;
  hrv?: number | null;
  sleepScore?: number | null;
  bodyBattery?: number | null;
  stressLevel?: number | null;
};

/**
 * Garmin Health API Response Types
 *
 * Garmin pushes data via webhooks: activities, dailies, sleep, stress.
 * Activities map to our standard model; health data writes to dailyMetrics.
 */

// ── Activity Types ──────────────────────────────────────────────────

export type GarminActivity = {
  activityId: number;
  activityName: string;
  activityType: string; // "CYCLING", "RUNNING", "LAP_SWIMMING", "OPEN_WATER_SWIMMING"
  startTimeInSeconds: number; // Unix epoch
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  movingDurationInSeconds?: number;
  elapsedDurationInSeconds?: number;
  distanceInMeters: number;
  elevationGainInMeters?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  averageBikeCadenceInRoundsPerMinute?: number;
  averageRunCadenceInStepsPerMinute?: number;
  averageSwimCadenceInStrokesPerMinute?: number;
  averageSpeedInMetersPerSecond?: number;
  maxSpeedInMetersPerSecond?: number;
  averagePowerInWatts?: number;
  maxPowerInWatts?: number;
  normalizedPowerInWatts?: number;
  poolLengthInMeters?: number;
  averageSwolf?: number;
  trainingStressScore?: number; // Garmin's TSS when available
  intensityFactor?: number;
};

export type GarminActivityDetail = {
  activityId: number;
  summary: GarminActivity;
  samples?: GarminSample[];
};

export type GarminSample = {
  startTimeInSeconds: number;
  heartRate?: number;
  power?: number;
  speed?: number;
  cadence?: number;
  elevation?: number;
  distanceInMeters?: number;
};

// ── Health Types ────────────────────────────────────────────────────

export type GarminDaily = {
  userAccessToken: string;
  summaryId: string;
  calendarDate: string; // "2024-03-01"
  startTimestampGMT: number;
  restingHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  averageStressLevel?: number;
  bodyBatteryChargedValue?: number;
  bodyBatteryDrainedValue?: number;
  bodyBatteryHighestValue?: number;
  bodyBatteryLowestValue?: number;
};

export type GarminSleep = {
  userAccessToken: string;
  summaryId: string;
  calendarDate: string;
  startTimestampGMT: number;
  durationInSeconds: number;
  deepSleepDurationInSeconds?: number;
  lightSleepDurationInSeconds?: number;
  remSleepDurationInSeconds?: number;
  awakeDurationInSeconds?: number;
  sleepScoreFeedback?: string;
  overallSleepScore?: {
    value: number;
  };
};

export type GarminStressDetail = {
  userAccessToken: string;
  summaryId: string;
  calendarDate: string;
  startTimestampGMT: number;
  durationInSeconds: number;
  // HRV data often comes in stress detail
  startTimestampLocal?: number;
  bodyBatteryVersion?: number;
};

export type GarminHrvSummary = {
  userAccessToken: string;
  summaryId: string;
  calendarDate: string;
  startTimestampGMT: number;
  startTimestampLocal?: number;
  durationInSeconds: number;
  hrvValue?: number; // Overnight HRV (ms)
  readingCount?: number;
  status?: string; // "BALANCED", "LOW", "UNBALANCED"
};

// ── Webhook Payload ─────────────────────────────────────────────────

export type GarminWebhookPayload = {
  activities?: GarminActivity[];
  activityDetails?: GarminActivityDetail[];
  dailies?: GarminDaily[];
  sleeps?: GarminSleep[];
  stressDetails?: GarminStressDetail[];
  epochs?: unknown[];
  bodyComps?: unknown[];
  hrvs?: GarminHrvSummary[];
};

// ── Mapping ─────────────────────────────────────────────────────────

/**
 * Map Garmin activity types to our sport enum.
 */
export function mapGarminToSport(
  activityType: string
): "cycling" | "running" | "swimming" | null {
  const type = activityType.toUpperCase();

  const cyclingTypes = [
    "CYCLING", "ROAD_BIKING", "MOUNTAIN_BIKING", "GRAVEL_CYCLING",
    "VIRTUAL_RIDE", "INDOOR_CYCLING", "RECUMBENT_CYCLING", "TRACK_CYCLING",
    "E_BIKE", "BMX", "CYCLOCROSS",
  ];
  const runningTypes = [
    "RUNNING", "TRAIL_RUNNING", "TREADMILL_RUNNING", "TRACK_RUNNING",
    "VIRTUAL_RUN", "ULTRA_RUN",
  ];
  const swimmingTypes = [
    "LAP_SWIMMING", "OPEN_WATER_SWIMMING", "SWIMMING",
  ];

  if (cyclingTypes.includes(type)) return "cycling";
  if (runningTypes.includes(type)) return "running";
  if (swimmingTypes.includes(type)) return "swimming";
  return null;
}

/**
 * Compute a sleep score from Garmin sleep stage durations.
 * Garmin doesn't always push a direct score; we derive one from
 * deep + REM fraction. Target: ~50% combined (20% deep + 25% REM + 5% buffer).
 */
export function computeSleepScore(sleep: GarminSleep): number | null {
  // Use Garmin's score if available
  if (sleep.overallSleepScore?.value) {
    return sleep.overallSleepScore.value;
  }

  const total = sleep.durationInSeconds;
  if (!total || total < 3600) return null; // Less than 1 hour = invalid

  const deep = sleep.deepSleepDurationInSeconds ?? 0;
  const rem = sleep.remSleepDurationInSeconds ?? 0;
  const awake = sleep.awakeDurationInSeconds ?? 0;

  const sleepTime = total - awake;
  if (sleepTime <= 0) return null;

  // Restorative fraction: deep + REM
  const restorativeFraction = (deep + rem) / sleepTime;

  // Score components:
  // 1. Duration score: 7-9 hours ideal (25200-32400 seconds)
  const durationHours = sleepTime / 3600;
  const durationScore = Math.min(1, Math.max(0, (durationHours - 4) / 4)); // 4h=0, 8h=1

  // 2. Quality score: deep + REM fraction (ideal ~50%)
  const qualityScore = Math.min(1, restorativeFraction / 0.5);

  // 3. Efficiency: low awake time
  const efficiencyScore = Math.max(0, 1 - awake / total);

  // Weighted score out of 100
  const score = Math.round(
    (durationScore * 40 + qualityScore * 40 + efficiencyScore * 20) * 100
  ) / 100;

  return Math.min(100, Math.max(0, Math.round(score)));
}

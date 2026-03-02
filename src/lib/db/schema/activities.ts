import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sportEnum, platformEnum } from "./athlete";

export const activities = pgTable(
  "activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    externalId: text("external_id"), // Strava/Garmin activity ID
    platform: platformEnum("platform"),
    sport: sportEnum("sport").notNull(),
    name: text("name"),
    description: text("description"),

    // Timing
    startedAt: timestamp("started_at", { mode: "date" }).notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    movingTimeSeconds: integer("moving_time_seconds"),
    elapsedTimeSeconds: integer("elapsed_time_seconds"),

    // Distance & elevation
    distanceMeters: real("distance_meters"),
    elevationGainMeters: real("elevation_gain_meters"),

    // Raw metrics
    averageHr: integer("average_hr"),
    maxHr: integer("max_hr"),
    averagePowerWatts: integer("average_power_watts"),
    maxPowerWatts: integer("max_power_watts"),
    averageCadence: real("average_cadence"),
    averageSpeedMps: real("average_speed_mps"), // meters per second

    // Swimming-specific
    poolLengthMeters: real("pool_length_meters"),
    totalStrokes: integer("total_strokes"),
    averageSwolf: real("average_swolf"),

    // Calculated metrics (sport-specific)
    normalizedPower: real("normalized_power"), // NP for cycling
    normalizedGradedPace: real("normalized_graded_pace"), // NGP for running (s/km)
    intensityFactor: real("intensity_factor"), // IF
    tss: real("tss"), // TSS / rTSS / sTSS depending on sport
    trimp: real("trimp"), // HR-based TRIMP

    // Zone distribution (% time in each zone)
    zoneDistribution: jsonb("zone_distribution").$type<number[]>(),

    // FTP used for this activity's TSS calculation (cycling only)
    ftpUsed: integer("ftp_used"),

    // Metadata
    gearId: text("gear_id"),
    sourceData: jsonb("source_data"), // Raw API response subset
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("activities_user_date_idx").on(table.userId, table.startedAt),
    index("activities_external_idx").on(table.externalId, table.platform),
  ]
);

// Second-by-second data — designed for TimescaleDB hypertable
export const activityStreams = pgTable(
  "activity_streams",
  {
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
    secondOffset: integer("second_offset").notNull(),

    // Data channels (nullable — not all present for all sports)
    powerWatts: integer("power_watts"),
    heartRate: integer("heart_rate"),
    cadenceRpm: real("cadence_rpm"),
    speedMps: real("speed_mps"),
    paceSecPerKm: real("pace_sec_per_km"),
    altitudeMeters: real("altitude_meters"),
    distanceMeters: real("distance_meters"),
    latitudeDeg: real("latitude_deg"),
    longitudeDeg: real("longitude_deg"),
    gradePercent: real("grade_percent"),

    // Swimming
    strokeCount: integer("stroke_count"),
    swolf: real("swolf"),
  },
  (table) => [
    index("streams_activity_idx").on(table.activityId),
    index("streams_time_idx").on(table.timestamp),
  ]
);

// Pre-computed daily aggregates
export const dailyMetrics = pgTable(
  "daily_metrics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),

    // Training load (summed across all sports)
    totalTss: real("total_tss").default(0),
    cyclingTss: real("cycling_tss").default(0),
    runningTss: real("running_tss").default(0),
    swimmingTss: real("swimming_tss").default(0),

    // Fitness / fatigue / form
    ctl: real("ctl"), // Chronic Training Load (42-day EMA)
    atl: real("atl"), // Acute Training Load (7-day EMA)
    tsb: real("tsb"), // Training Stress Balance (CTL - ATL)
    rampRate: real("ramp_rate"), // Week-over-week CTL change

    // Health metrics (from Garmin)
    hrv: real("hrv"), // RMSSD
    restingHr: integer("resting_hr"),
    sleepScore: integer("sleep_score"),
    bodyBattery: integer("body_battery"),
    trainingReadiness: integer("training_readiness"),
    stressLevel: integer("stress_level"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("daily_metrics_user_date_idx").on(table.userId, table.date),
  ]
);

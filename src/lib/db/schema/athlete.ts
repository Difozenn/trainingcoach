import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  pgEnum,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sportEnum = pgEnum("sport", ["cycling", "running", "swimming"]);
export const goalTypeEnum = pgEnum("goal_type", ["event", "fitness_gain"]);
export const fitnessSubModeEnum = pgEnum("fitness_sub_mode", [
  "auto_progressive",
  "target",
]);
export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner",
  "intermediate",
  "advanced",
  "elite",
]);
export const eventPriorityEnum = pgEnum("event_priority", ["A", "B", "C"]);
export const platformEnum = pgEnum("platform", [
  "strava",
  "garmin",
  "wahoo",
]);

export const athleteProfiles = pgTable("athlete_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  weightKg: real("weight_kg"),
  heightCm: real("height_cm"),
  dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
  maxHr: integer("max_hr"),
  restingHr: integer("resting_hr"),
  experienceLevel: experienceLevelEnum("experience_level").default(
    "intermediate"
  ),
  weeklyHoursAvailable: real("weekly_hours_available"),
  preferredDays: jsonb("preferred_days").$type<string[]>(),
  goalType: goalTypeEnum("goal_type").default("fitness_gain"),
  fitnessSubMode: fitnessSubModeEnum("fitness_sub_mode").default(
    "auto_progressive"
  ),
  timezone: text("timezone").default("UTC"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const sportProfiles = pgTable("sport_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sport: sportEnum("sport").notNull(),

  // Cycling: FTP in watts
  ftp: integer("ftp"),
  // Running: threshold pace in seconds per km
  thresholdPaceSPerKm: real("threshold_pace_s_per_km"),
  // Running: functional threshold power (Stryd)
  runningFtp: integer("running_ftp"),
  // Swimming: CSS in seconds per 100m
  cssSPer100m: real("css_s_per_100m"),

  // Sport-specific LTHR
  lthr: integer("lthr"),
  // Sport-specific max HR
  sportMaxHr: integer("sport_max_hr"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const thresholdHistory = pgTable("threshold_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sport: sportEnum("sport").notNull(),
  metricName: text("metric_name").notNull(), // 'ftp', 'threshold_pace', 'css'
  value: real("value").notNull(),
  source: text("source").notNull(), // 'auto_detect', 'manual', 'test'
  activityId: text("activity_id"),
  detectedAt: timestamp("detected_at", { mode: "date" }).defaultNow().notNull(),
});

export const platformConnections = pgTable("platform_connections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  platformUserId: text("platform_user_id"),
  // Encrypted with AES-256-GCM
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { mode: "date" }),
  scopes: text("scopes"),
  webhookSubscriptionId: text("webhook_subscription_id"),
  lastSyncAt: timestamp("last_sync_at", { mode: "date" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const targetEvents = pgTable("target_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sport: sportEnum("sport").notNull(),
  eventDate: timestamp("event_date", { mode: "date" }).notNull(),
  priority: eventPriorityEnum("priority").default("A"),
  description: text("description"),
  targetTimeSeconds: integer("target_time_seconds"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

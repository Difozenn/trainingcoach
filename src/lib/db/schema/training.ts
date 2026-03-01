import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  jsonb,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sportEnum, goalTypeEnum } from "./athlete";

export const periodizationPhaseEnum = pgEnum("periodization_phase", [
  "base",
  "build",
  "peak",
  "race",
  "recovery",
  "transition",
]);

export const workoutTypeEnum = pgEnum("workout_type", [
  // Cycling
  "recovery_ride",
  "endurance_ride",
  "sweet_spot",
  "threshold_ride",
  "vo2max_ride",
  "anaerobic_ride",
  "sprint_ride",
  // Running
  "easy_run",
  "long_run",
  "tempo_run",
  "threshold_intervals_run",
  "vo2max_intervals_run",
  "fartlek",
  "hill_repeats",
  // Swimming
  "endurance_swim",
  "threshold_swim",
  "vo2max_swim",
  "sprint_swim",
  "drill_technique",
  // Cross-sport
  "rest_day",
  "active_recovery",
]);

export const trainingPlans = pgTable("training_plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalType: goalTypeEnum("goal_type").notNull(),
  targetEventId: text("target_event_id"),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const mesocycles = pgTable("mesocycles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  trainingPlanId: text("training_plan_id")
    .notNull()
    .references(() => trainingPlans.id, { onDelete: "cascade" }),
  phase: periodizationPhaseEnum("phase").notNull(),
  weekNumber: integer("week_number").notNull(),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  targetTssPerWeek: real("target_tss_per_week"),
  intensityDistribution: jsonb("intensity_distribution").$type<{
    zone1Pct: number;
    zone2Pct: number;
    zone3Pct: number;
    zone4Pct: number;
    zone5Pct: number;
  }>(),
  notes: text("notes"),
});

export const weeklyPlans = pgTable(
  "weekly_plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trainingPlanId: text("training_plan_id").references(
      () => trainingPlans.id,
      { onDelete: "set null" }
    ),
    mesocycleId: text("mesocycle_id").references(() => mesocycles.id, {
      onDelete: "set null",
    }),
    weekStartDate: timestamp("week_start_date", { mode: "date" }).notNull(),
    weekEndDate: timestamp("week_end_date", { mode: "date" }).notNull(),

    // Targets
    targetTss: real("target_tss"),
    actualTss: real("actual_tss"),
    phase: periodizationPhaseEnum("phase"),

    // Adaptation notes
    adaptationNotes: text("adaptation_notes"),
    adherenceScore: real("adherence_score"), // 0-100

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("weekly_plans_user_week_idx").on(
      table.userId,
      table.weekStartDate
    ),
  ]
);

export const plannedWorkouts = pgTable("planned_workouts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  weeklyPlanId: text("weekly_plan_id")
    .notNull()
    .references(() => weeklyPlans.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  sport: sportEnum("sport").notNull(),
  workoutType: workoutTypeEnum("workout_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),

  // Targets
  targetDurationMinutes: integer("target_duration_minutes"),
  targetTss: real("target_tss"),
  targetIntensityFactor: real("target_intensity_factor"),

  // Structured workout (intervals)
  structure: jsonb("structure").$type<WorkoutInterval[]>(),

  // Scheduling
  scheduledDate: timestamp("scheduled_date", { mode: "date" }),
  completedActivityId: text("completed_activity_id"),
  isCompleted: boolean("is_completed").default(false),

  // Nutrition guidance for this workout
  fuelingNotes: text("fueling_notes"),
  carbsPerHour: integer("carbs_per_hour"),

  // Coaching
  coachingTip: text("coaching_tip"),
  whyThisWorkout: text("why_this_workout"),

  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Types for workout structure
export type WorkoutInterval = {
  type: "warmup" | "work" | "rest" | "cooldown" | "ramp";
  durationSeconds: number;
  // Power-based (cycling)
  powerTargetPctFtp?: number;
  powerTargetWatts?: number;
  // Pace-based (running)
  paceTargetSecPerKm?: number;
  // CSS-based (swimming)
  paceTargetSecPer100m?: number;
  // HR-based (any sport)
  hrTargetBpm?: number;
  hrZone?: number;
  // Cadence
  cadenceTarget?: number;
  // Repetitions
  repeat?: number;
  intervals?: WorkoutInterval[];
  // Text
  notes?: string;
};

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

export const dailyNutritionTargets = pgTable(
  "daily_nutrition_targets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),

    // Macro targets in grams
    carbsGrams: real("carbs_grams").notNull(),
    proteinGrams: real("protein_grams").notNull(),
    fatGrams: real("fat_grams").notNull(),
    totalCalories: integer("total_calories").notNull(),

    // Per-kg rates used
    carbsPerKg: real("carbs_per_kg"),
    proteinPerKg: real("protein_per_kg"),
    fatPerKg: real("fat_per_kg"),

    // Training context
    trainingDayType: text("training_day_type").notNull(), // rest, easy, endurance, hard, race, carb_load
    plannedTss: real("planned_tss"),
    explanation: text("explanation"), // Plain-English summary

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("nutrition_user_date_idx").on(table.userId, table.date),
  ]
);

export const rideFuelingPlans = pgTable("ride_fueling_plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workoutId: text("workout_id"), // Reference to planned_workouts
  date: timestamp("date", { mode: "date" }).notNull(),

  // Fueling targets
  durationMinutes: integer("duration_minutes").notNull(),
  carbsPerHour: integer("carbs_per_hour").notNull(),
  totalCarbsGrams: integer("total_carbs_grams").notNull(),
  glucoseFructoseRatio: text("glucose_fructose_ratio"), // e.g., "1:0.8"
  hydrationMlPerHour: integer("hydration_ml_per_hour"),
  sodiumMgPerHour: integer("sodium_mg_per_hour"),

  // Timing guide
  timingGuide: jsonb("timing_guide").$type<
    { minuteMark: number; carbsGrams: number; fluidMl: number }[]
  >(),

  // Post-workout recovery
  recoveryProteinGrams: real("recovery_protein_grams"),
  recoveryCarbsGrams: real("recovery_carbs_grams"),
  recoveryWindowMinutes: integer("recovery_window_minutes"),

  explanation: text("explanation"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

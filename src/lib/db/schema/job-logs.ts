import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const jobLogs = pgTable(
  "job_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    level: text("level").notNull(), // "error" | "warn" | "info"
    functionName: text("function_name").notNull(),
    stepName: text("step_name"),
    errorCode: text("error_code"),
    message: text("message").notNull(),
    context: jsonb("context").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("job_logs_created_idx").on(table.createdAt),
    index("job_logs_function_idx").on(table.functionName),
  ]
);

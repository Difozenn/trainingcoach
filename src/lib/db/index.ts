import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | null = null;

function createDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
  });
  return drizzle(client, { schema });
}

/**
 * Lazy DB accessor — safe to call at runtime.
 * Throws if DATABASE_URL is missing (won't happen in production).
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) _db = createDb();
  return _db;
}

/**
 * Eagerly initialized DB instance.
 * Safe at runtime; during `next build` DATABASE_URL is present via env vars.
 */
export const db: PostgresJsDatabase<typeof schema> = process.env.DATABASE_URL
  ? createDb()
  : (null as unknown as PostgresJsDatabase<typeof schema>);

// Separate client for migrations
export function getMigrationClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return postgres(url, { max: 1 });
}

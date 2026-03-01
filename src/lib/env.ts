/**
 * Environment Variable Validation
 *
 * Validates all required env vars at import time so missing
 * values fail fast at startup, not silently at runtime.
 */

import { z } from "zod/v4";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().min(32),

  // Strava
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_WEBHOOK_VERIFY_TOKEN: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PRO_PRICE_ID: z.string().startsWith("price_"),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().optional(),

  // Google OAuth (optional — users can auth with email/password)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

type ServerEnv = z.infer<typeof serverSchema>;

let _env: ServerEnv | null = null;

/**
 * Validated server environment variables.
 * Call this in server-side code to get type-safe env access.
 * Throws on first access if required vars are missing.
 */
export function env(): ServerEnv {
  if (_env) return _env;

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`Missing or invalid environment variables:\n${missing}`);

    // In development, log but don't crash — allow partial dev setup
    if (process.env.NODE_ENV === "development") {
      console.warn("Continuing in dev mode with missing env vars");
      _env = process.env as unknown as ServerEnv;
      return _env;
    }

    throw new Error(`Missing or invalid environment variables:\n${missing}`);
  }

  _env = result.data;
  return _env;
}

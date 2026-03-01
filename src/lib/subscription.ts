/**
 * Subscription / Feature Gating
 *
 * Free: activity sync, basic metrics, 90-day history
 * Pro (~$9.99/mo): Fitness Timeline, coaching engine, nutrition targets,
 *                  workout export, health tracking, unlimited history
 */

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type Plan = "free" | "pro";

export type FeatureAccess = {
  plan: Plan;
  fitnessTimeline: boolean;
  coachingEngine: boolean;
  nutritionTargets: boolean;
  workoutExport: boolean;
  healthTracking: boolean;
  unlimitedHistory: boolean;
  historyDays: number;
};

const FREE_ACCESS: FeatureAccess = {
  plan: "free",
  fitnessTimeline: false,
  coachingEngine: false,
  nutritionTargets: false,
  workoutExport: false,
  healthTracking: false,
  unlimitedHistory: false,
  historyDays: 90,
};

const PRO_ACCESS: FeatureAccess = {
  plan: "pro",
  fitnessTimeline: true,
  coachingEngine: true,
  nutritionTargets: true,
  workoutExport: true,
  healthTracking: true,
  unlimitedHistory: true,
  historyDays: Infinity,
};

export async function getUserPlan(userId: string): Promise<Plan> {
  const [sub] = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (sub?.status === "active" || sub?.status === "trialing") {
    return "pro";
  }
  return "free";
}

export async function getFeatureAccess(userId: string): Promise<FeatureAccess> {
  const plan = await getUserPlan(userId);
  return plan === "pro" ? PRO_ACCESS : FREE_ACCESS;
}

export function getFeatureAccessForPlan(plan: Plan): FeatureAccess {
  return plan === "pro" ? PRO_ACCESS : FREE_ACCESS;
}

/**
 * Pro-gated pages — these paths require a Pro subscription.
 * Free users accessing these paths see an upgrade prompt instead.
 */
export const PRO_GATED_PATHS = [
  "/fitness",
  "/nutrition",
  "/plan",
  "/health",
] as const;

export function isProGatedPath(pathname: string): boolean {
  return PRO_GATED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

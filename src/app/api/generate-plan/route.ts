import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athleteProfiles, weeklyPlans } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { getUserPlan } from "@/lib/subscription";
import { generatePlanForUser } from "@/lib/inngest/functions/weekly-plan-cron";

/**
 * Manually trigger weekly plan generation for the current user.
 * Deletes any existing plan for the current week first to avoid duplicates.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Must be Pro
  const plan = await getUserPlan(userId);
  if (plan !== "pro") {
    return NextResponse.json(
      { error: "Pro subscription required" },
      { status: 403 }
    );
  }

  // Get athlete profile
  const [profile] = await db
    .select({
      userId: athleteProfiles.userId,
      weightKg: athleteProfiles.weightKg,
      weeklyHoursAvailable: athleteProfiles.weeklyHoursAvailable,
      goalType: athleteProfiles.goalType,
      experienceLevel: athleteProfiles.experienceLevel,
    })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 400 }
    );
  }

  try {
    // Delete existing plan for this week to avoid duplicates
    const now = new Date();
    const existingPlans = await db
      .select({ id: weeklyPlans.id })
      .from(weeklyPlans)
      .where(
        and(
          eq(weeklyPlans.userId, userId),
          lte(weeklyPlans.weekStartDate, now),
          gte(weeklyPlans.weekEndDate, now)
        )
      );

    for (const existing of existingPlans) {
      // Cascade delete removes planned_workouts + daily_nutrition_targets
      await db.delete(weeklyPlans).where(eq(weeklyPlans.id, existing.id));
    }

    await generatePlanForUser(profile);
    return NextResponse.json({ status: "generated" });
  } catch (err) {
    console.error("Failed to generate plan:", err);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}

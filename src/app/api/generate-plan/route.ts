import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athleteProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserPlan } from "@/lib/subscription";
import { generatePlanForUser } from "@/lib/inngest/functions/weekly-plan-cron";

/**
 * Manually trigger weekly plan generation for the current user.
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

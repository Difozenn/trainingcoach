import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athleteProfiles, sportProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const onboardingSchema = z.object({
  sports: z.array(z.enum(["cycling", "running", "swimming"])).min(1),
  weightKg: z.number().min(30).max(200).nullable(),
  weeklyHoursAvailable: z.number().min(1).max(40),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
  goalType: z.enum(["event", "fitness_gain"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { sports, weightKg, weeklyHoursAvailable, experienceLevel, goalType } =
    parsed.data;
  const userId = session.user.id;

  // Upsert athlete profile
  const [existing] = await db
    .select({ id: athleteProfiles.id })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(athleteProfiles)
      .set({
        weightKg,
        weeklyHoursAvailable,
        experienceLevel,
        goalType,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(athleteProfiles.userId, userId));
  } else {
    await db.insert(athleteProfiles).values({
      userId,
      weightKg,
      weeklyHoursAvailable,
      experienceLevel,
      goalType,
      onboardingCompleted: true,
    });
  }

  // Create sport profiles with conservative defaults
  for (const sport of sports) {
    const defaults: Record<string, { ftp?: number; thresholdPaceSPerKm?: number; cssSPer100m?: number }> = {
      cycling: { ftp: 200 },
      running: { thresholdPaceSPerKm: 300 },
      swimming: { cssSPer100m: 110 },
    };

    await db
      .insert(sportProfiles)
      .values({
        userId,
        sport,
        ...defaults[sport],
      })
      .onConflictDoNothing();
  }

  return NextResponse.json({ success: true });
}

"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { athleteProfiles, sportProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";

const profileSchema = z.object({
  weightKg: z.coerce.number().min(30).max(200).optional(),
  heightCm: z.coerce.number().min(120).max(250).optional(),
  sex: z.enum(["male", "female"]).optional(),
  dateOfBirth: z.coerce.string().optional(),
  maxHr: z.coerce.number().min(100).max(230).optional(),
  restingHr: z.coerce.number().min(30).max(100).optional(),
  experienceLevel: z
    .enum(["beginner", "intermediate", "advanced", "elite"])
    .optional(),
  weeklyHoursAvailable: z.coerce.number().min(1).max(40).optional(),
  goalType: z.enum(["event", "fitness_gain"]).optional(),
  timezone: z.string().optional(),
});

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const raw = profileSchema.parse(Object.fromEntries(formData));
  const { dateOfBirth: dobStr, ...rest } = raw;
  const data: Record<string, unknown> = { ...rest };
  if (dobStr) data.dateOfBirth = new Date(dobStr);

  const [existing] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(athleteProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(athleteProfiles.userId, session.user.id));
  } else {
    await db.insert(athleteProfiles).values({
      userId: session.user.id,
      ...data,
    });
  }

  revalidatePath("/settings");
}

const sportProfileSchema = z.object({
  sport: z.enum(["cycling", "running", "swimming"]),
  ftp: z.coerce.number().min(50).max(600).optional(),
  thresholdPaceSPerKm: z.coerce.number().min(150).max(600).optional(),
  cssSPer100m: z.coerce.number().min(50).max(300).optional(),
  lthr: z.coerce.number().min(100).max(220).optional(),
  sportMaxHr: z.coerce.number().min(100).max(230).optional(),
});

export async function updateSportProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = sportProfileSchema.parse(Object.fromEntries(formData));
  const { sport, ...values } = data;

  const [existing] = await db
    .select()
    .from(sportProfiles)
    .where(
      and(
        eq(sportProfiles.userId, session.user.id),
        eq(sportProfiles.sport, sport)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(sportProfiles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(sportProfiles.id, existing.id));
  } else {
    await db.insert(sportProfiles).values({
      userId: session.user.id,
      sport,
      ...values,
    });
  }

  revalidatePath("/settings");
  revalidatePath("/zones");
}

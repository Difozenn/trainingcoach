"use server";

import { isAdmin } from "@/lib/auth/admin";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { jobLogs } from "@/lib/db/schema";
import { lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function triggerStreamBackfill(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const userId = formData.get("userId") as string;
  const platform = (formData.get("platform") as string) || "strava";

  await inngest.send({
    name: "streams/backfill.requested",
    data: { userId, platform },
  });

  revalidatePath("/admin");
}

export async function triggerStravaResync(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const userId = formData.get("userId") as string;
  const connectionId = formData.get("connectionId") as string;

  if (!connectionId) throw new Error("No Strava connection found for this user");

  await inngest.send({
    name: "strava/backfill.requested",
    data: { userId, connectionId },
  });

  revalidatePath("/admin");
}

export async function clearOldJobLogs(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const days = parseInt(formData.get("days") as string, 10) || 7;
  const cutoff = new Date(Date.now() - days * 86400000);

  await db.delete(jobLogs).where(lt(jobLogs.createdAt, cutoff));
  revalidatePath("/admin");
}

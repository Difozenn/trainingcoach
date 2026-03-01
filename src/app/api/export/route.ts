import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plannedWorkouts, sportProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserPlan } from "@/lib/subscription";
import { generateZWO } from "@/lib/engine/export/zwo-generator";
import { generateMRC, generateERG } from "@/lib/engine/export/mrc-generator";
import { generateICSEvent } from "@/lib/engine/export/ics-generator";
import { generateFITWorkoutJSON } from "@/lib/engine/export/fit-generator";
import type { WorkoutInterval } from "@/lib/db/schema/training";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (plan === "free") {
    return NextResponse.json(
      { error: "Workout export requires a Pro subscription" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const workoutId = searchParams.get("workoutId");
  const format = searchParams.get("format") || "zwo";

  if (!workoutId) {
    return NextResponse.json({ error: "Missing workoutId" }, { status: 400 });
  }

  // Fetch workout (only return if owned by user)
  const [workout] = await db
    .select()
    .from(plannedWorkouts)
    .where(
      and(
        eq(plannedWorkouts.id, workoutId),
        eq(plannedWorkouts.userId, session.user.id)
      )
    )
    .limit(1);

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  // Get FTP from sport profile for ERG export
  const [sportProfile] = await db
    .select({ ftp: sportProfiles.ftp })
    .from(sportProfiles)
    .where(
      and(
        eq(sportProfiles.userId, session.user.id),
        eq(sportProfiles.sport, "cycling")
      )
    )
    .limit(1);
  const ftp = sportProfile?.ftp || 200;

  const name = workout.title || "Workout";
  const description = workout.description || "";
  const structure = (workout.structure as WorkoutInterval[]) || [];

  let content: string;
  let contentType: string;
  let extension: string;

  switch (format) {
    case "zwo":
      content = generateZWO(name, description, structure);
      contentType = "application/xml";
      extension = "zwo";
      break;

    case "mrc":
      content = generateMRC(name, description, structure);
      contentType = "text/plain";
      extension = "mrc";
      break;

    case "erg":
      content = generateERG(name, description, structure, ftp);
      contentType = "text/plain";
      extension = "erg";
      break;

    case "ics":
      content = generateICSEvent({
        uid: workout.id,
        title: name,
        description,
        startDate: workout.scheduledDate ? new Date(workout.scheduledDate) : new Date(),
        durationMinutes: workout.targetDurationMinutes || 60,
        sport: workout.sport || "cycling",
      });
      contentType = "text/calendar";
      extension = "ics";
      break;

    case "fit":
      content = JSON.stringify(
        generateFITWorkoutJSON(
          name,
          (workout.sport as "cycling" | "running" | "swimming") || "cycling",
          structure,
          ftp
        )
      );
      contentType = "application/json";
      extension = "fit.json";
      break;

    default:
      return NextResponse.json(
        { error: "Unsupported format. Use: zwo, mrc, erg, ics, fit" },
        { status: 400 }
      );
  }

  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "_");

  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeName}.${extension}"`,
    },
  });
}

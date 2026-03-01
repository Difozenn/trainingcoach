import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, plannedWorkouts, weeklyPlans } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import {
  generateICSCalendar,
  type CalendarEvent,
} from "@/lib/engine/export/ics-generator";

/**
 * ICS Calendar Subscription Feed
 *
 * GET /api/calendar/[token]
 *
 * Token-based auth so calendar apps (Google Calendar, Apple Calendar,
 * Outlook) can fetch without session cookies. Returns a VCALENDAR
 * with all scheduled workouts for the next 4 weeks.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Look up user by calendar token
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.calendarToken, token))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Get upcoming weekly plans (next 4 weeks)
  const now = new Date();
  const fourWeeksOut = new Date(now);
  fourWeeksOut.setDate(now.getDate() + 28);

  const plans = await db
    .select({ id: weeklyPlans.id })
    .from(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.userId, user.id),
        gte(weeklyPlans.weekEndDate, now)
      )
    );

  // Get all scheduled workouts from those plans
  const events: CalendarEvent[] = [];

  for (const plan of plans) {
    const workouts = await db
      .select()
      .from(plannedWorkouts)
      .where(
        and(
          eq(plannedWorkouts.weeklyPlanId, plan.id),
          gte(plannedWorkouts.scheduledDate, now)
        )
      );

    for (const w of workouts) {
      if (!w.scheduledDate) continue;

      events.push({
        uid: `workout-${w.id}@trainingcoach.app`,
        title: w.title,
        description: [
          w.description,
          w.coachingTip ? `Tip: ${w.coachingTip}` : "",
          w.whyThisWorkout ? `Why: ${w.whyThisWorkout}` : "",
          w.fuelingNotes ? `Fueling: ${w.fuelingNotes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        startDate: w.scheduledDate,
        durationMinutes: w.targetDurationMinutes ?? 60,
        sport: w.sport,
      });
    }
  }

  const ics = generateICSCalendar(
    events,
    `TrainingCoach — ${user.name ?? "Workouts"}`
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="trainingcoach.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

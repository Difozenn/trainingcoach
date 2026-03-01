import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Bike, Footprints, Waves } from "lucide-react";
import {
  getActivitiesForRange,
  getPlannedWorkoutsForRange,
} from "@/lib/data/queries";
import { formatDuration } from "@/lib/data/helpers";
import Link from "next/link";

const sportIcons = { cycling: Bike, running: Footprints, swimming: Waves };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // 0 = Sunday, adjust so Monday = 0
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) ?? now.getMonth();
  const monthIdx = params.month != null ? Number(params.month) : now.getMonth();

  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 0, 23, 59, 59);

  const [activities, planned] = await Promise.all([
    getActivitiesForRange(session.user.id, start, end),
    getPlannedWorkoutsForRange(session.user.id, start, end),
  ]);

  const daysInMonth = getDaysInMonth(year, monthIdx);
  const firstDayOffset = getFirstDayOfWeek(year, monthIdx);
  const monthName = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Group activities and workouts by day
  const activityByDay = new Map<number, typeof activities>();
  for (const a of activities) {
    const day = a.startedAt.getDate();
    const list = activityByDay.get(day) ?? [];
    list.push(a);
    activityByDay.set(day, list);
  }

  const plannedByDay = new Map<number, typeof planned>();
  for (const w of planned) {
    if (!w.scheduledDate) continue;
    const day = w.scheduledDate.getDate();
    const list = plannedByDay.get(day) ?? [];
    list.push(w);
    plannedByDay.set(day, list);
  }

  const prevMonth = monthIdx === 0 ? 11 : monthIdx - 1;
  const prevYear = monthIdx === 0 ? year - 1 : year;
  const nextMonth = monthIdx === 11 ? 0 : monthIdx + 1;
  const nextYear = monthIdx === 11 ? year + 1 : year;

  return (
    <>
      <DashboardHeader title="Training Calendar" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Link href={`/calendar?year=${prevYear}&month=${prevMonth}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle>{monthName}</CardTitle>
            <Link href={`/calendar?year=${nextYear}&month=${nextMonth}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="p-2">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] bg-muted/20 p-1" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayActivities = activityByDay.get(day) ?? [];
                const dayPlanned = plannedByDay.get(day) ?? [];
                const isToday =
                  day === now.getDate() &&
                  monthIdx === now.getMonth() &&
                  year === now.getFullYear();
                const totalTss = dayActivities.reduce(
                  (sum, a) => sum + (a.tss ?? 0),
                  0
                );

                return (
                  <div
                    key={day}
                    className={`min-h-[80px] border p-1 ${isToday ? "bg-primary/5 ring-1 ring-primary" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}
                      >
                        {day}
                      </span>
                      {totalTss > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {Math.round(totalTss)}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayActivities.map((a) => {
                        const SportIcon =
                          sportIcons[a.sport as keyof typeof sportIcons];
                        return (
                          <Link
                            key={a.id}
                            href={`/activities/${a.id}`}
                            className="flex items-center gap-1 rounded bg-primary/10 px-1 py-0.5 text-[10px] hover:bg-primary/20"
                          >
                            {SportIcon && <SportIcon className="h-2.5 w-2.5" />}
                            <span className="truncate">
                              {formatDuration(a.durationSeconds)}
                            </span>
                          </Link>
                        );
                      })}
                      {dayPlanned.map((w) => {
                        const SportIcon =
                          sportIcons[w.sport as keyof typeof sportIcons];
                        return (
                          <div
                            key={w.id}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] ${w.isCompleted ? "bg-green-500/10" : "bg-muted/50 border border-dashed"}`}
                          >
                            {SportIcon && <SportIcon className="h-2.5 w-2.5" />}
                            <span className="truncate">{w.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

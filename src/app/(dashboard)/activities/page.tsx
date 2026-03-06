import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Bike,
  Footprints,
  Waves,
} from "lucide-react";
import {
  getActivitiesForRange,
  getPlannedWorkoutsForRange,
  getMetricsForRange,
} from "@/lib/data/queries";
import { formatDuration, formatDistance } from "@/lib/data/helpers";
import Link from "next/link";

const sportIcons = { cycling: Bike, running: Footprints, swimming: Waves };

type Activity = Awaited<ReturnType<typeof getActivitiesForRange>>[number];
type Planned = Awaited<ReturnType<typeof getPlannedWorkoutsForRange>>[number];

interface WeekRow {
  weekNumber: number;
  days: (DayCell | null)[]; // 7 slots, Mon–Sun
  stats: {
    duration: number;
    distance: number;
    elevation: number;
    tss: number;
    ctl: number | null;
    atl: number | null;
    form: string | null;
    ramp: number | null;
  };
}

interface DayCell {
  date: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  activities: Activity[];
  planned: Planned[];
  totalTss: number;
}

function getISOWeek(d: Date): number {
  const date = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  );
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const monthIdx =
    params.month != null ? Number(params.month) : now.getMonth();

  // Calculate the full range: from Monday of first week to Sunday of last week
  const firstOfMonth = new Date(year, monthIdx, 1);
  const lastOfMonth = new Date(year, monthIdx + 1, 0);

  // Monday of the week containing the 1st
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // days since Monday
  const rangeStart = new Date(year, monthIdx, 1 - startOffset);

  // Sunday of the week containing the last day
  const endOffset = (7 - lastOfMonth.getDay()) % 7; // days until Sunday
  const rangeEnd = new Date(
    year,
    monthIdx + 1,
    0 + endOffset,
    23,
    59,
    59
  );

  const [activities, planned, metrics] = await Promise.all([
    getActivitiesForRange(session.user.id, rangeStart, rangeEnd),
    getPlannedWorkoutsForRange(session.user.id, rangeStart, rangeEnd),
    getMetricsForRange(session.user.id, rangeStart, rangeEnd),
  ]);

  // Index activities by YYYY-MM-DD
  const activityByDate = new Map<string, Activity[]>();
  for (const a of activities) {
    const key = dateKey(a.startedAt);
    const list = activityByDate.get(key) ?? [];
    list.push(a);
    activityByDate.set(key, list);
  }

  const plannedByDate = new Map<string, Planned[]>();
  for (const w of planned) {
    if (!w.scheduledDate) continue;
    const key = dateKey(w.scheduledDate);
    const list = plannedByDate.get(key) ?? [];
    list.push(w);
    plannedByDate.set(key, list);
  }

  // Index metrics by date key — use last entry per week for CTL/ATL
  const metricsByDate = new Map<
    string,
    { ctl: number | null; atl: number | null; tsb: number | null; rampRate: number | null }
  >();
  for (const m of metrics) {
    metricsByDate.set(dateKey(m.date), m);
  }

  // Build week rows
  const weeks: WeekRow[] = [];
  const cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    const weekNum = getISOWeek(cursor);
    const days: (DayCell | null)[] = [];
    let totalDuration = 0;
    let totalDistance = 0;
    let totalElevation = 0;
    let totalTss = 0;
    let lastCtl: number | null = null;
    let lastAtl: number | null = null;
    let lastTsb: number | null = null;
    let lastRamp: number | null = null;

    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(cursor);
      const key = dateKey(d);
      const dayActs = activityByDate.get(key) ?? [];
      const dayPlanned = plannedByDate.get(key) ?? [];
      const isCurrentMonth =
        d.getMonth() === monthIdx && d.getFullYear() === year;
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      const dayTss = dayActs.reduce((s, a) => s + (a.tss ?? 0), 0);

      totalDuration += dayActs.reduce(
        (s, a) => s + (a.durationSeconds ?? 0),
        0
      );
      totalDistance += dayActs.reduce(
        (s, a) => s + (a.distanceMeters ?? 0),
        0
      );
      totalElevation += dayActs.reduce(
        (s, a) => s + (a.elevationGainMeters ?? 0),
        0
      );
      totalTss += dayTss;

      // Update metrics from this day if available
      const dayMetric = metricsByDate.get(key);
      if (dayMetric) {
        if (dayMetric.ctl != null) lastCtl = dayMetric.ctl;
        if (dayMetric.atl != null) lastAtl = dayMetric.atl;
        if (dayMetric.tsb != null) lastTsb = dayMetric.tsb;
        if (dayMetric.rampRate != null) lastRamp = dayMetric.rampRate;
      }

      days.push({
        date: d.getDate(),
        isToday,
        isCurrentMonth,
        activities: dayActs,
        planned: dayPlanned,
        totalTss: dayTss,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // Form = TSB/CTL as percentage
    let form: string | null = null;
    if (lastCtl != null && lastCtl > 0 && lastTsb != null) {
      form = `${Math.round((lastTsb / lastCtl) * 100)}%`;
    }

    weeks.push({
      weekNumber: weekNum,
      days,
      stats: {
        duration: totalDuration,
        distance: totalDistance,
        elevation: totalElevation,
        tss: Math.round(totalTss),
        ctl: lastCtl != null ? Math.round(lastCtl) : null,
        atl: lastAtl != null ? Math.round(lastAtl) : null,
        form,
        ramp: lastRamp != null ? Math.round(lastRamp * 10) / 10 : null,
      },
    });
  }

  const monthName = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = monthIdx === 0 ? 11 : monthIdx - 1;
  const prevYear = monthIdx === 0 ? year - 1 : year;
  const nextMonth = monthIdx === 11 ? 0 : monthIdx + 1;
  const nextYear = monthIdx === 11 ? year + 1 : year;

  return (
    <>
      <DashboardHeader title="Activities" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Link
              href={`/activities?year=${prevYear}&month=${prevMonth}`}
            >
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle>{monthName}</CardTitle>
            <Link
              href={`/activities?year=${nextYear}&month=${nextMonth}`}
            >
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {/* Day headers */}
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-px text-center text-xs font-medium text-muted-foreground">
              <div />
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (d) => (
                  <div key={d} className="p-2">
                    {d}
                  </div>
                )
              )}
            </div>

            {/* Week rows */}
            {weeks.map((week) => (
              <div
                key={week.weekNumber}
                className="grid grid-cols-[140px_repeat(7,1fr)] gap-px"
              >
                {/* Stats sidebar */}
                <div className="flex flex-col gap-0.5 border-r bg-muted/30 p-2 text-[11px]">
                  <span className="font-semibold text-xs text-foreground">
                    Wk {week.weekNumber}
                  </span>
                  <div className="my-0.5 border-t border-border" />
                  <span className="text-muted-foreground">
                    {formatDuration(week.stats.duration)}
                  </span>
                  {week.stats.distance > 0 && (
                    <span className="text-muted-foreground">
                      {formatDistance(week.stats.distance)}
                    </span>
                  )}
                  {week.stats.elevation > 0 && (
                    <span className="text-muted-foreground">
                      {Math.round(week.stats.elevation)}m ↑
                    </span>
                  )}
                  <div className="my-0.5 border-t border-border" />
                  <span className="text-muted-foreground">
                    {week.stats.tss} TSS
                  </span>
                  {week.stats.ctl != null && (
                    <span className="text-muted-foreground">
                      CTL {week.stats.ctl}
                    </span>
                  )}
                  {week.stats.atl != null && (
                    <span className="text-muted-foreground">
                      ATL {week.stats.atl}
                    </span>
                  )}
                  {week.stats.form != null && (
                    <span className="text-muted-foreground">
                      {week.stats.form} form
                    </span>
                  )}
                  {week.stats.ramp != null && (
                    <span className="text-muted-foreground">
                      Ramp {week.stats.ramp}
                    </span>
                  )}
                </div>

                {/* Day cells */}
                {week.days.map((cell, i) => {
                  if (!cell)
                    return (
                      <div
                        key={i}
                        className="min-h-[80px] bg-muted/20 p-1"
                      />
                    );

                  return (
                    <div
                      key={i}
                      className={`min-h-[80px] border p-1 ${
                        cell.isToday
                          ? "bg-primary/5 ring-1 ring-primary"
                          : ""
                      } ${!cell.isCurrentMonth ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs ${
                            cell.isToday
                              ? "font-bold text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {cell.date}
                        </span>
                        {cell.totalTss > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            {Math.round(cell.totalTss)}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {cell.activities.map((a) => {
                          const SportIcon =
                            sportIcons[
                              a.sport as keyof typeof sportIcons
                            ];
                          return (
                            <Link
                              key={a.id}
                              href={`/activities/${a.id}`}
                              className="flex items-center gap-1 rounded bg-primary/10 px-1 py-0.5 text-[10px] hover:bg-primary/20"
                            >
                              {SportIcon && (
                                <SportIcon className="h-2.5 w-2.5" />
                              )}
                              <span className="truncate">
                                {formatDuration(a.durationSeconds)}
                              </span>
                            </Link>
                          );
                        })}
                        {cell.planned.map((w) => {
                          const SportIcon =
                            sportIcons[
                              w.sport as keyof typeof sportIcons
                            ];
                          return (
                            <div
                              key={w.id}
                              className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] ${
                                w.isCompleted
                                  ? "bg-green-500/10"
                                  : "bg-muted/50 border border-dashed"
                              }`}
                            >
                              {SportIcon && (
                                <SportIcon className="h-2.5 w-2.5" />
                              )}
                              <span className="truncate">
                                {w.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

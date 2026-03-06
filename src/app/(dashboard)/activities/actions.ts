"use server";

import { auth } from "@/lib/auth";
import {
  getActivitiesForRange,
  getPlannedWorkoutsForRange,
  getMetricsForRange,
} from "@/lib/data/queries";

export interface WeekData {
  weekNumber: number;
  weekLabel: string;
  days: (DayData | null)[];
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

export interface DayData {
  dateStr: string;
  dayOfMonth: number;
  monthLabel: string;
  isToday: boolean;
  activities: ActivityData[];
  planned: PlannedData[];
  totalTss: number;
}

export interface ActivityData {
  id: string;
  sport: string;
  name: string | null;
  durationSeconds: number;
  totalTss: number;
}

export interface PlannedData {
  id: string;
  sport: string;
  title: string | null;
  isCompleted: boolean;
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dow);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Fetch `count` weeks ending at `beforeWeekStart` (ISO date string of a Monday).
 * If beforeWeekStart is null, starts from 1 week in the future.
 */
export async function fetchWeeks(
  beforeWeekStart: string | null,
  count: number = 5
): Promise<{ weeks: WeekData[]; nextCursor: string | null }> {
  const session = await auth();
  if (!session?.user?.id) return { weeks: [], nextCursor: null };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Determine the starting Monday (most recent week to show)
  let startMonday: Date;
  if (beforeWeekStart) {
    // Load older: the cursor points to the Monday we should start from
    startMonday = new Date(beforeWeekStart);
  } else {
    // Initial load: start from next week's Monday (1 week in future)
    const currentMonday = getMondayOfWeek(today);
    startMonday = new Date(currentMonday);
    startMonday.setDate(startMonday.getDate() + 7);
  }

  // Range: from oldest Monday to Sunday of startMonday's week
  const oldestMonday = new Date(startMonday);
  oldestMonday.setDate(oldestMonday.getDate() - (count - 1) * 7);
  const rangeEnd = new Date(startMonday);
  rangeEnd.setDate(rangeEnd.getDate() + 6);
  rangeEnd.setHours(23, 59, 59, 999);

  const [activities, planned, metrics] = await Promise.all([
    getActivitiesForRange(session.user.id, oldestMonday, rangeEnd),
    getPlannedWorkoutsForRange(session.user.id, oldestMonday, rangeEnd),
    getMetricsForRange(session.user.id, oldestMonday, rangeEnd),
  ]);

  // Index by date key
  const activityByDate = new Map<string, typeof activities>();
  for (const a of activities) {
    const key = dateKey(a.startedAt);
    const list = activityByDate.get(key) ?? [];
    list.push(a);
    activityByDate.set(key, list);
  }

  const plannedByDate = new Map<string, typeof planned>();
  for (const w of planned) {
    if (!w.scheduledDate) continue;
    const key = dateKey(w.scheduledDate);
    const list = plannedByDate.get(key) ?? [];
    list.push(w);
    plannedByDate.set(key, list);
  }

  const metricsByDate = new Map<
    string,
    { ctl: number | null; atl: number | null; tsb: number | null; rampRate: number | null }
  >();
  for (const m of metrics) {
    metricsByDate.set(dateKey(m.date), m);
  }

  // Build weeks from newest to oldest
  const weeks: WeekData[] = [];
  const cursor = new Date(startMonday);

  for (let w = 0; w < count; w++) {
    const weekMonday = new Date(cursor);
    const weekNum = getISOWeek(weekMonday);
    const days: (DayData | null)[] = [];
    let totalDuration = 0;
    let totalDistance = 0;
    let totalElevation = 0;
    let totalTss = 0;
    let lastCtl: number | null = null;
    let lastAtl: number | null = null;
    let lastTsb: number | null = null;
    let lastRamp: number | null = null;

    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(weekMonday);
      d.setDate(d.getDate() + dow);
      const key = dateKey(d);
      const dayActs = activityByDate.get(key) ?? [];
      const dayPlanned = plannedByDate.get(key) ?? [];
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
      const dayTss = dayActs.reduce((s, a) => s + (a.tss ?? 0), 0);

      totalDuration += dayActs.reduce((s, a) => s + (a.durationSeconds ?? 0), 0);
      totalDistance += dayActs.reduce((s, a) => s + (a.distanceMeters ?? 0), 0);
      totalElevation += dayActs.reduce((s, a) => s + (a.elevationGainMeters ?? 0), 0);
      totalTss += dayTss;

      const dayMetric = metricsByDate.get(key);
      if (dayMetric) {
        if (dayMetric.ctl != null) lastCtl = dayMetric.ctl;
        if (dayMetric.atl != null) lastAtl = dayMetric.atl;
        if (dayMetric.tsb != null) lastTsb = dayMetric.tsb;
        if (dayMetric.rampRate != null) lastRamp = dayMetric.rampRate;
      }

      const monthLabel = d.toLocaleDateString("en-US", { month: "short" });

      days.push({
        dateStr: key,
        dayOfMonth: d.getDate(),
        monthLabel,
        isToday,
        activities: dayActs.map((a) => ({
          id: a.id,
          sport: a.sport,
          name: a.name,
          durationSeconds: a.durationSeconds,
          totalTss: a.tss ?? 0,
        })),
        planned: dayPlanned.map((p) => ({
          id: p.id,
          sport: p.sport,
          title: p.title,
          isCompleted: p.isCompleted ?? false,
        })),
        totalTss: dayTss,
      });
    }

    let form: string | null = null;
    if (lastCtl != null && lastCtl > 0 && lastTsb != null) {
      form = `${Math.round((lastTsb / lastCtl) * 100)}%`;
    }

    // Week label: "Mar 2 – 8" or "Feb 24 – Mar 2"
    const sun = new Date(weekMonday);
    sun.setDate(sun.getDate() + 6);
    const monMonth = weekMonday.toLocaleDateString("en-US", { month: "short" });
    const sunMonth = sun.toLocaleDateString("en-US", { month: "short" });
    const weekLabel =
      monMonth === sunMonth
        ? `${monMonth} ${weekMonday.getDate()}–${sun.getDate()}`
        : `${monMonth} ${weekMonday.getDate()} – ${sunMonth} ${sun.getDate()}`;

    weeks.push({
      weekNumber: weekNum,
      weekLabel,
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

    // Move cursor back one week
    cursor.setDate(cursor.getDate() - 7);
  }

  // Next cursor: the Monday of the week after the oldest one we returned
  const nextMonday = new Date(cursor);
  nextMonday.setDate(nextMonday.getDate() + 7); // cursor is already 1 week past
  // Actually cursor ended up at (startMonday - count*7), so next load starts there
  const nextCursor = dateKey(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7));
  // Simpler: next cursor = oldest monday we built
  const oldestBuilt = new Date(startMonday);
  oldestBuilt.setDate(oldestBuilt.getDate() - (count - 1) * 7);
  oldestBuilt.setDate(oldestBuilt.getDate() - 7); // one week before oldest

  return {
    weeks,
    nextCursor: dateKey(oldestBuilt),
  };
}

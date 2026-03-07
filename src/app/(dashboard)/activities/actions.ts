"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, and, desc, asc, gte, lte, sql, ilike } from "drizzle-orm";
import {
  getActivitiesForRange,
  getPlannedWorkoutsForRange,
  getMetricsForRange,
} from "@/lib/data/queries";

// ── Activity List Search ────────────────────────────────────────────

export type SortField = "date" | "tss" | "duration" | "distance" | "power" | "hr";
export type SortDir = "asc" | "desc";
export type SportFilter = "all" | "cycling" | "running" | "swimming";
export type RangeFilter = "all" | "7d" | "30d" | "90d" | "6m" | "1y" | "ytd";

export interface ActivityRow {
  id: string;
  sport: string;
  name: string | null;
  startedAt: Date;
  durationSeconds: number;
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  tss: number | null;
  averagePowerWatts: number | null;
  averageHr: number | null;
  normalizedPower: number | null;
  intensityFactor: number | null;
}

function rangeToDate(range: RangeFilter): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "ytd") return new Date(now.getFullYear(), 0, 1);
  const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "6m": 183, "1y": 365 };
  const d = new Date();
  d.setDate(d.getDate() - (days[range] ?? 365));
  return d;
}

const SORT_COLUMNS = {
  date: activities.startedAt,
  tss: activities.tss,
  duration: activities.durationSeconds,
  distance: activities.distanceMeters,
  power: activities.averagePowerWatts,
  hr: activities.averageHr,
} as const;

export async function searchActivities(opts: {
  sport: SportFilter;
  range: RangeFilter;
  search: string;
  sortBy: SortField;
  sortDir: SortDir;
  offset: number;
  limit: number;
}): Promise<{ rows: ActivityRow[]; total: number }> {
  const session = await auth();
  if (!session?.user?.id) return { rows: [], total: 0 };

  const conditions = [eq(activities.userId, session.user.id)];

  if (opts.sport !== "all") {
    conditions.push(eq(activities.sport, opts.sport));
  }

  const rangeDate = rangeToDate(opts.range);
  if (rangeDate) {
    conditions.push(gte(activities.startedAt, rangeDate));
  }

  if (opts.search.trim()) {
    conditions.push(ilike(activities.name, `%${opts.search.trim()}%`));
  }

  const where = and(...conditions);
  const col = SORT_COLUMNS[opts.sortBy];
  const order = opts.sortDir === "asc" ? asc(col) : desc(col);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: activities.id,
        sport: activities.sport,
        name: activities.name,
        startedAt: activities.startedAt,
        durationSeconds: activities.durationSeconds,
        distanceMeters: activities.distanceMeters,
        elevationGainMeters: activities.elevationGainMeters,
        tss: activities.tss,
        averagePowerWatts: activities.averagePowerWatts,
        averageHr: activities.averageHr,
        normalizedPower: activities.normalizedPower,
        intensityFactor: activities.intensityFactor,
      })
      .from(activities)
      .where(where)
      .orderBy(order)
      .limit(opts.limit)
      .offset(opts.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activities)
      .where(where),
  ]);

  return { rows, total: countResult[0]?.count ?? 0 };
}

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
  // Metrics are stored as CET midnight (T23:00Z or T22:00Z DST).
  // Round to nearest date by adding 2h before taking UTC date.
  const rounded = new Date(d.getTime() + 2 * 3600_000);
  return `${rounded.getUTCFullYear()}-${String(rounded.getUTCMonth() + 1).padStart(2, "0")}-${String(rounded.getUTCDate()).padStart(2, "0")}`;
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

  // Metrics dates are stored as CET midnight (e.g. T23:00Z for CET+1).
  // Widen the metrics range by 1 day on each side to capture edge cases.
  const metricsStart = new Date(oldestMonday);
  metricsStart.setDate(metricsStart.getDate() - 1);
  const metricsEnd = new Date(rangeEnd);
  metricsEnd.setDate(metricsEnd.getDate() + 1);

  const [activities, planned, metrics] = await Promise.all([
    getActivitiesForRange(session.user.id, oldestMonday, rangeEnd),
    getPlannedWorkoutsForRange(session.user.id, oldestMonday, rangeEnd),
    getMetricsForRange(session.user.id, metricsStart, metricsEnd),
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

  // Next cursor: the oldest Monday we built minus 1 week
  const oldestBuilt = new Date(startMonday);
  oldestBuilt.setDate(oldestBuilt.getDate() - (count - 1) * 7);
  oldestBuilt.setDate(oldestBuilt.getDate() - 7);

  return {
    weeks,
    nextCursor: dateKey(oldestBuilt),
  };
}

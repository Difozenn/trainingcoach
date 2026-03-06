/**
 * Server-side data access layer.
 * All functions require an authenticated userId.
 */

import { db } from "@/lib/db";
import {
  activities,
  dailyMetrics,
  dailyNutritionTargets,
  rideFuelingPlans,
  athleteProfiles,
  sportProfiles,
  platformConnections,
  subscriptions,
  weeklyPlans,
  plannedWorkouts,
  targetEvents,
  thresholdHistory,
} from "@/lib/db/schema";
import { eq, and, desc, gte, lte, lt, sql } from "drizzle-orm";

// ── Dashboard overview ──────────────────────────────────────────────

export async function getLatestMetrics(userId: string) {
  const [latest] = await db
    .select()
    .from(dailyMetrics)
    .where(eq(dailyMetrics.userId, userId))
    .orderBy(desc(dailyMetrics.date))
    .limit(1);
  if (!latest) return null;

  // Decay CTL/ATL forward to today if the latest row is stale
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rowDate = new Date(latest.date);
  rowDate.setUTCHours(0, 0, 0, 0);
  const daysGap = Math.round(
    (today.getTime() - rowDate.getTime()) / 86_400_000
  );

  if (daysGap <= 0) return latest;

  let ctl = latest.ctl ?? 0;
  let atl = latest.atl ?? 0;
  for (let i = 0; i < daysGap; i++) {
    ctl += (0 - ctl) / 42;
    atl += (0 - atl) / 7;
  }
  const tsb = ctl - atl;

  return {
    ...latest,
    ctl: Math.round(ctl * 10) / 10,
    atl: Math.round(atl * 10) / 10,
    tsb: Math.round(tsb * 10) / 10,
  };
}

export async function getWeeklyTSS(userId: string) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${dailyMetrics.totalTss}), 0)`,
      cycling: sql<number>`coalesce(sum(${dailyMetrics.cyclingTss}), 0)`,
      running: sql<number>`coalesce(sum(${dailyMetrics.runningTss}), 0)`,
      swimming: sql<number>`coalesce(sum(${dailyMetrics.swimmingTss}), 0)`,
    })
    .from(dailyMetrics)
    .where(
      and(eq(dailyMetrics.userId, userId), gte(dailyMetrics.date, monday))
    );

  return rows[0] ?? { total: 0, cycling: 0, running: 0, swimming: 0 };
}

export async function getRecentActivities(userId: string, limit = 10) {
  return db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.startedAt))
    .limit(limit);
}

// ── Fitness Timeline ────────────────────────────────────────────────

export async function getFitnessTimeline(
  userId: string,
  days: number = 90
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db
    .select({
      date: dailyMetrics.date,
      totalTss: dailyMetrics.totalTss,
      cyclingTss: dailyMetrics.cyclingTss,
      runningTss: dailyMetrics.runningTss,
      swimmingTss: dailyMetrics.swimmingTss,
      ctl: dailyMetrics.ctl,
      atl: dailyMetrics.atl,
      tsb: dailyMetrics.tsb,
      rampRate: dailyMetrics.rampRate,
    })
    .from(dailyMetrics)
    .where(
      and(
        eq(dailyMetrics.userId, userId),
        gte(dailyMetrics.date, startDate)
      )
    )
    .orderBy(dailyMetrics.date);

  if (rows.length === 0) return rows;

  // Forward-fill gaps (rest days) and extend to today with CTL/ATL decay
  const filled: typeof rows = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Build a map of existing rows by date string
  const rowMap = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const key = new Date(r.date).toISOString().split("T")[0];
    rowMap.set(key, r);
  }

  // Walk from first row date to today
  const cursor = new Date(rows[0].date);
  cursor.setUTCHours(0, 0, 0, 0);
  let prevCtl = 0;
  let prevAtl = 0;

  while (cursor <= today) {
    const key = cursor.toISOString().split("T")[0];
    const existing = rowMap.get(key);

    if (existing) {
      prevCtl = existing.ctl ?? 0;
      prevAtl = existing.atl ?? 0;
      filled.push(existing);
    } else {
      // Rest day: TSS=0, decay CTL/ATL
      const ctl = prevCtl + (0 - prevCtl) / 42;
      const atl = prevAtl + (0 - prevAtl) / 7;
      const tsb = ctl - atl;
      prevCtl = ctl;
      prevAtl = atl;
      filled.push({
        date: new Date(cursor),
        totalTss: 0,
        cyclingTss: 0,
        runningTss: 0,
        swimmingTss: 0,
        ctl: Math.round(ctl * 10) / 10,
        atl: Math.round(atl * 10) / 10,
        tsb: Math.round(tsb * 10) / 10,
        rampRate: null,
      });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return filled;
}

// ── Activities ──────────────────────────────────────────────────────

export async function getActivityById(userId: string, activityId: string) {
  const [activity] = await db
    .select()
    .from(activities)
    .where(
      and(eq(activities.id, activityId), eq(activities.userId, userId))
    )
    .limit(1);
  return activity ?? null;
}

export async function getActivitiesBySport(
  userId: string,
  sport?: "cycling" | "running" | "swimming",
  limit = 50,
  offset = 0
) {
  const conditions = [eq(activities.userId, userId)];
  if (sport) conditions.push(eq(activities.sport, sport));

  return db
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.startedAt))
    .limit(limit)
    .offset(offset);
}

export async function getActivityCount(userId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(eq(activities.userId, userId));
  return result?.count ?? 0;
}

// ── Nutrition ───────────────────────────────────────────────────────

/**
 * Get actual TSS per day for a date range from activities.
 * Returns array of { date (YYYY-MM-DD), totalTss, activityCount }.
 */
export async function getDailyTssForWeek(
  userId: string,
  weekStart: Date,
  weekEnd: Date
) {
  const rows = await db
    .select({
      date: sql<string>`DATE(${activities.startedAt})`,
      totalTss: sql<number>`COALESCE(SUM(${activities.tss}), 0)`,
      activityCount: sql<number>`COUNT(*)::int`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        gte(activities.startedAt, weekStart),
        lte(activities.startedAt, weekEnd)
      )
    )
    .groupBy(sql`DATE(${activities.startedAt})`);

  return rows;
}

export async function getUpcomingFueling(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return db
    .select()
    .from(rideFuelingPlans)
    .where(
      and(
        eq(rideFuelingPlans.userId, userId),
        gte(rideFuelingPlans.date, today)
      )
    )
    .orderBy(rideFuelingPlans.date)
    .limit(5);
}

// ── Health ──────────────────────────────────────────────────────────

export async function getHealthMetrics(userId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select({
      date: dailyMetrics.date,
      hrv: dailyMetrics.hrv,
      restingHr: dailyMetrics.restingHr,
      sleepScore: dailyMetrics.sleepScore,
      bodyBattery: dailyMetrics.bodyBattery,
      trainingReadiness: dailyMetrics.trainingReadiness,
      ctl: dailyMetrics.ctl,
      atl: dailyMetrics.atl,
      tsb: dailyMetrics.tsb,
    })
    .from(dailyMetrics)
    .where(
      and(
        eq(dailyMetrics.userId, userId),
        gte(dailyMetrics.date, startDate)
      )
    )
    .orderBy(dailyMetrics.date);
}

// ── Profile & Settings ──────────────────────────────────────────────

export async function getAthleteProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function getSportProfiles(userId: string) {
  return db
    .select()
    .from(sportProfiles)
    .where(
      and(eq(sportProfiles.userId, userId), eq(sportProfiles.isActive, true))
    );
}

export async function getConnection(
  userId: string,
  platform: "strava" | "garmin" | "wahoo"
) {
  const [conn] = await db
    .select({
      id: platformConnections.id,
      platform: platformConnections.platform,
      platformUserId: platformConnections.platformUserId,
      isActive: platformConnections.isActive,
      lastSyncAt: platformConnections.lastSyncAt,
      createdAt: platformConnections.createdAt,
    })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.userId, userId),
        eq(platformConnections.platform, platform),
        eq(platformConnections.isActive, true)
      )
    )
    .limit(1);
  return conn ?? null;
}

export async function getSubscription(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return sub ?? null;
}

// ── Training Plan ───────────────────────────────────────────────────

export async function getCurrentWeeklyPlan(userId: string) {
  const now = new Date();
  const [plan] = await db
    .select()
    .from(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.userId, userId),
        lte(weeklyPlans.weekStartDate, now),
        gte(weeklyPlans.weekEndDate, now)
      )
    )
    .limit(1);
  return plan ?? null;
}

export async function getWeeklyWorkouts(weeklyPlanId: string) {
  return db
    .select()
    .from(plannedWorkouts)
    .where(eq(plannedWorkouts.weeklyPlanId, weeklyPlanId))
    .orderBy(plannedWorkouts.sortOrder);
}

/**
 * Sum actual TSS from activities within a date range.
 */
export async function getActualWeeklyTss(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<{ totalTss: number; activityCount: number }> {
  const [result] = await db
    .select({
      totalTss: sql<number>`coalesce(sum(${activities.tss}), 0)`,
      activityCount: sql<number>`count(*)::int`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        gte(activities.startedAt, weekStart),
        lte(activities.startedAt, weekEnd)
      )
    );
  return {
    totalTss: Math.round(result?.totalTss ?? 0),
    activityCount: result?.activityCount ?? 0,
  };
}

export async function getUpcomingEvents(userId: string) {
  const now = new Date();
  return db
    .select()
    .from(targetEvents)
    .where(
      and(
        eq(targetEvents.userId, userId),
        gte(targetEvents.eventDate, now)
      )
    )
    .orderBy(targetEvents.eventDate)
    .limit(5);
}

// ── Calendar ────────────────────────────────────────────────────────

export async function getActivitiesForRange(
  userId: string,
  start: Date,
  end: Date
) {
  return db
    .select({
      id: activities.id,
      sport: activities.sport,
      name: activities.name,
      startedAt: activities.startedAt,
      durationSeconds: activities.durationSeconds,
      distanceMeters: activities.distanceMeters,
      tss: activities.tss,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        gte(activities.startedAt, start),
        lte(activities.startedAt, end)
      )
    )
    .orderBy(activities.startedAt);
}

export async function getPlannedWorkoutsForRange(
  userId: string,
  start: Date,
  end: Date
) {
  return db
    .select()
    .from(plannedWorkouts)
    .where(
      and(
        eq(plannedWorkouts.userId, userId),
        gte(plannedWorkouts.scheduledDate, start),
        lte(plannedWorkouts.scheduledDate, end)
      )
    )
    .orderBy(plannedWorkouts.scheduledDate);
}

// ── Activity Streams ────────────────────────────────────────────────

export async function getActivityStreams(activityId: string) {
  const [row] = await db
    .select({ streamData: activities.streamData })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  const blob = row?.streamData;
  if (!blob?.time) return [];

  // Transform JSONB blob back to the row-like format the UI expects
  return blob.time.map((secondOffset, i) => ({
    secondOffset,
    powerWatts: blob.watts?.[i] ?? null,
    heartRate: blob.heartrate?.[i] ?? null,
    cadenceRpm: blob.cadence?.[i] ?? null,
    speedMps: blob.velocity_smooth?.[i] ?? null,
    altitudeMeters: blob.altitude?.[i] ?? null,
    distanceMeters: blob.distance?.[i] ?? null,
    latitudeDeg: blob.latlng?.[i]?.[0] ?? null,
    longitudeDeg: blob.latlng?.[i]?.[1] ?? null,
  }));
}

// ── Power Profile ──────────────────────────────────────────────────

export async function getUserPeakPowers(userId: string, days?: number) {
  // Build conditions: user + cycling + optional time range
  const conditions = [
    eq(activities.userId, userId),
    eq(activities.sport, "cycling"),
  ];
  if (days && days < 9999) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    conditions.push(gte(activities.startedAt, startDate));
  }

  const [row] = await db
    .select({
      peak5s: sql<number | null>`max(${activities.peak5s})`,
      peak15s: sql<number | null>`max(${activities.peak15s})`,
      peak30s: sql<number | null>`max(${activities.peak30s})`,
      peak1m: sql<number | null>`max(${activities.peak1m})`,
      peak5m: sql<number | null>`max(${activities.peak5m})`,
      peak10m: sql<number | null>`max(${activities.peak10m})`,
      peak20m: sql<number | null>`max(${activities.peak20m})`,
      peak60m: sql<number | null>`max(${activities.peak60m})`,
    })
    .from(activities)
    .where(and(...conditions));

  if (!row) return null;

  // For each peak, find the date of the activity with that peak
  const peakDates: Record<string, Date | null> = {};
  const peakColumns = [
    { key: "5s", col: activities.peak5s, val: row.peak5s },
    { key: "15s", col: activities.peak15s, val: row.peak15s },
    { key: "30s", col: activities.peak30s, val: row.peak30s },
    { key: "1m", col: activities.peak1m, val: row.peak1m },
    { key: "5m", col: activities.peak5m, val: row.peak5m },
    { key: "10m", col: activities.peak10m, val: row.peak10m },
    { key: "20m", col: activities.peak20m, val: row.peak20m },
    { key: "60m", col: activities.peak60m, val: row.peak60m },
  ] as const;

  for (const { key, col, val } of peakColumns) {
    if (val == null) {
      peakDates[key] = null;
      continue;
    }
    const [dateRow] = await db
      .select({ startedAt: activities.startedAt })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          eq(activities.sport, "cycling"),
          eq(col, val)
        )
      )
      .orderBy(desc(activities.startedAt))
      .limit(1);
    peakDates[key] = dateRow?.startedAt ?? null;
  }

  return {
    peaks: {
      "5s": row.peak5s ? Number(row.peak5s) : null,
      "15s": row.peak15s ? Number(row.peak15s) : null,
      "30s": row.peak30s ? Number(row.peak30s) : null,
      "1m": row.peak1m ? Number(row.peak1m) : null,
      "5m": row.peak5m ? Number(row.peak5m) : null,
      "10m": row.peak10m ? Number(row.peak10m) : null,
      "20m": row.peak20m ? Number(row.peak20m) : null,
      "60m": row.peak60m ? Number(row.peak60m) : null,
    },
    dates: peakDates,
  };
}

export async function getDailyMetricsForDate(userId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [row] = await db
    .select({
      ctl: dailyMetrics.ctl,
      atl: dailyMetrics.atl,
      tsb: dailyMetrics.tsb,
      rampRate: dailyMetrics.rampRate,
    })
    .from(dailyMetrics)
    .where(
      and(
        eq(dailyMetrics.userId, userId),
        gte(dailyMetrics.date, dayStart),
        lt(dailyMetrics.date, dayEnd)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Get the FTP that was in effect just before a given date.
 * Looks up the most recent threshold_history entry for cycling FTP
 * with detectedAt < date. Returns null if no history exists.
 */
export async function getCyclingFtpAtDate(
  userId: string,
  date: Date
): Promise<number | null> {
  const [row] = await db
    .select({ value: thresholdHistory.value })
    .from(thresholdHistory)
    .where(
      and(
        eq(thresholdHistory.userId, userId),
        eq(thresholdHistory.sport, "cycling"),
        eq(thresholdHistory.metricName, "ftp"),
        lt(thresholdHistory.detectedAt, date)
      )
    )
    .orderBy(desc(thresholdHistory.detectedAt))
    .limit(1);
  return row ? Math.round(row.value) : null;
}

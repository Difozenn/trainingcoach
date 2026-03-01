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
} from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// ── Dashboard overview ──────────────────────────────────────────────

export async function getLatestMetrics(userId: string) {
  const [latest] = await db
    .select()
    .from(dailyMetrics)
    .where(eq(dailyMetrics.userId, userId))
    .orderBy(desc(dailyMetrics.date))
    .limit(1);
  return latest ?? null;
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

  return db
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

export async function getTodayNutrition(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [target] = await db
    .select()
    .from(dailyNutritionTargets)
    .where(
      and(
        eq(dailyNutritionTargets.userId, userId),
        gte(dailyNutritionTargets.date, today),
        lte(dailyNutritionTargets.date, tomorrow)
      )
    )
    .limit(1);
  return target ?? null;
}

export async function getWeekNutrition(userId: string) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);

  return db
    .select()
    .from(dailyNutritionTargets)
    .where(
      and(
        eq(dailyNutritionTargets.userId, userId),
        gte(dailyNutritionTargets.date, monday),
        lte(dailyNutritionTargets.date, sunday)
      )
    )
    .orderBy(dailyNutritionTargets.date);
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

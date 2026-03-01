import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  athleteProfiles,
  sportProfiles,
  activities,
  dailyMetrics,
  dailyNutritionTargets,
  platformConnections,
  subscriptions,
  trainingPlans,
  weeklyPlans,
  plannedWorkouts,
  targetEvents,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GDPR Data Export — exports all user data as JSON.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    userData,
    profileData,
    sportProfileData,
    activityData,
    metricsData,
    nutritionData,
    connectionData,
    subscriptionData,
    planData,
    weeklyPlanData,
    workoutData,
    eventData,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId)),
    db.select().from(sportProfiles).where(eq(sportProfiles.userId, userId)),
    db.select().from(activities).where(eq(activities.userId, userId)),
    db.select().from(dailyMetrics).where(eq(dailyMetrics.userId, userId)),
    db.select().from(dailyNutritionTargets).where(eq(dailyNutritionTargets.userId, userId)),
    db.select({
      id: platformConnections.id,
      platform: platformConnections.platform,
      platformUserId: platformConnections.platformUserId,
      isActive: platformConnections.isActive,
      lastSyncAt: platformConnections.lastSyncAt,
      createdAt: platformConnections.createdAt,
    }).from(platformConnections).where(eq(platformConnections.userId, userId)),
    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
    db.select().from(trainingPlans).where(eq(trainingPlans.userId, userId)),
    db.select().from(weeklyPlans).where(eq(weeklyPlans.userId, userId)),
    db.select().from(plannedWorkouts).where(eq(plannedWorkouts.userId, userId)),
    db.select().from(targetEvents).where(eq(targetEvents.userId, userId)),
  ]);

  // Strip sensitive fields from user data
  const safeUser = userData.map(({ passwordHash, ...rest }) => rest);

  const exportData = {
    exportDate: new Date().toISOString(),
    user: safeUser,
    athleteProfile: profileData,
    sportProfiles: sportProfileData,
    activities: activityData,
    dailyMetrics: metricsData,
    nutritionTargets: nutritionData,
    connections: connectionData,
    subscription: subscriptionData,
    trainingPlans: planData,
    weeklyPlans: weeklyPlanData,
    plannedWorkouts: workoutData,
    targetEvents: eventData,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="trainingcoach-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

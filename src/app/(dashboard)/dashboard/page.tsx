import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Bike,
  Footprints,
  Waves,
} from "lucide-react";
import {
  getLatestMetrics,
  getWeeklyTSS,
  getRecentActivities,
  getDailyTssForWeek,
  getCurrentWeeklyPlan,
  getWeeklyWorkouts,
  getUserPeakPowers,
  getAthleteProfile,
} from "@/lib/data/queries";
import {
  calculateDailyMacros,
  getTrainingDayType,
} from "@/lib/engine/nutrition/daily-macros";
import {
  formatDuration,
  formatDistance,
  formatDate,
} from "@/lib/data/helpers";
import Link from "next/link";
import { PowerProfileTab } from "../profile/power-profile-tab";

const sportIcons = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
};

const PROFILE_WINDOW_DAYS = 42; // 6 weeks — fixed window for rider profile

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pp?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Check onboarding — redirect if no athlete profile yet
  const { db } = await import("@/lib/db");
  const { athleteProfiles } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const [profile] = await db
    .select({ onboardingCompleted: athleteProfiles.onboardingCompleted })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, userId))
    .limit(1);
  if (!profile?.onboardingCompleted) redirect("/onboarding");

  const params = await searchParams;
  const curveDays = Number(params.pp) || 90;

  // Today's date range for nutrition TSS lookup
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    metrics,
    weeklyTss,
    recentActivities,
    todayTssRows,
    weeklyPlan,
    profilePeaks,
    allTimePeaks,
    curvePeaks,
    athleteProfile,
  ] = await Promise.all([
    getLatestMetrics(userId),
    getWeeklyTSS(userId),
    getRecentActivities(userId, 5),
    getDailyTssForWeek(userId, todayStart, todayEnd),
    getCurrentWeeklyPlan(userId),
    getUserPeakPowers(userId, PROFILE_WINDOW_DAYS),
    getUserPeakPowers(userId),
    getUserPeakPowers(userId, curveDays),
    getAthleteProfile(userId),
  ]);

  // Compute today's nutrition live from actual TSS
  const todayTss = Number(todayTssRows[0]?.totalTss) || 0;
  const nutrition = athleteProfile?.weightKg
    ? calculateDailyMacros(
        athleteProfile.weightKg,
        getTrainingDayType(todayTss),
        { heightCm: athleteProfile.heightCm }
      )
    : null;

  const workouts = weeklyPlan
    ? await getWeeklyWorkouts(weeklyPlan.id)
    : [];

  // Form as percentage (TSB/CTL × 100)
  const formPct =
    metrics?.ctl && metrics.ctl > 0 && metrics?.tsb != null
      ? Math.max(-100, Math.min(100, Math.round((metrics.tsb / metrics.ctl) * 100)))
      : null;

  const formLabel =
    formPct != null
      ? formPct < -30
        ? "High Risk"
        : formPct < -10
          ? "Optimal"
          : formPct < 5
            ? "Grey Zone"
            : formPct < 20
              ? "Fresh"
              : "Detraining"
      : null;

  const formColor =
    formPct != null
      ? formPct < -30
        ? "text-red-500"
        : formPct < -10
          ? "text-green-500"
          : formPct < 5
            ? "text-muted-foreground"
            : formPct < 20
              ? "text-blue-500"
              : "text-orange-500"
      : "";

  return (
    <>
      <DashboardHeader title="Overview" />
      <div className="flex-1 space-y-6 p-6">
        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fitness (CTL)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.ctl ? Math.round(metrics.ctl) : "--"}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.rampRate
                  ? `${metrics.rampRate > 0 ? "+" : ""}${metrics.rampRate.toFixed(1)} TSS/wk`
                  : "42-day training load"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fatigue (ATL)
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.atl ? Math.round(metrics.atl) : "--"}
              </div>
              <p className="text-xs text-muted-foreground">
                7-day training load
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Form</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${formColor}`}>
                {formPct != null
                  ? `${formPct > 0 ? "+" : ""}${formPct}%`
                  : "--"}
              </div>
              <p className={`text-xs ${formLabel ? `font-medium ${formColor}` : "text-muted-foreground"}`}>
                {formLabel ?? "Fitness - Fatigue balance"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly TSS
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(weeklyTss.total)}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {weeklyTss.cycling > 0 && (
                  <span className="text-blue-500">
                    {Math.round(weeklyTss.cycling)} bike
                  </span>
                )}
                {weeklyTss.running > 0 && (
                  <span className="text-green-500">
                    {Math.round(weeklyTss.running)} run
                  </span>
                )}
                {weeklyTss.swimming > 0 && (
                  <span className="text-teal-500">
                    {Math.round(weeklyTss.swimming)} swim
                  </span>
                )}
                {weeklyTss.total === 0 && <span>This week so far</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Power Profile */}
        <Suspense>
          <PowerProfileTab
            profilePeaks={profilePeaks}
            allTimePeaks={allTimePeaks}
            curvePeaks={curvePeaks}
            curveDays={curveDays}
            weightKg={athleteProfile?.weightKg ?? null}
          />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Link
                href="/activities"
                className="text-sm text-muted-foreground hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((a) => {
                    const Icon =
                      sportIcons[a.sport as keyof typeof sportIcons] ??
                      Activity;
                    return (
                      <Link
                        key={a.id}
                        href={`/activities/${a.id}`}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {a.name ?? "Untitled"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(a.startedAt)} &middot;{" "}
                            {formatDuration(a.durationSeconds)}
                            {a.distanceMeters
                              ? ` · ${formatDistance(a.distanceMeters)}`
                              : ""}
                          </p>
                        </div>
                        {a.tss != null && (
                          <Badge variant="secondary">
                            {Math.round(a.tss)} TSS
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect Strava in{" "}
                  <Link href="/settings" className="underline">
                    Settings
                  </Link>{" "}
                  to see recent activities.
                </p>
              )}
            </CardContent>
          </Card>

          {/* This Week's Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>This Week&apos;s Plan</CardTitle>
              {weeklyPlan && (
                <Link
                  href="/plan"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  View full plan
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {workouts.length > 0 ? (
                <div className="space-y-2">
                  {weeklyPlan?.targetTss && (
                    <p className="text-sm text-muted-foreground">
                      Target: {Math.round(weeklyPlan.targetTss)} TSS
                      {weeklyPlan.actualTss != null &&
                        ` · Done: ${Math.round(weeklyPlan.actualTss)} TSS`}
                    </p>
                  )}
                  {workouts.slice(0, 5).map((w) => {
                    const Icon =
                      sportIcons[w.sport as keyof typeof sportIcons] ??
                      Activity;
                    return (
                      <div
                        key={w.id}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{w.title}</span>
                        {w.isCompleted && (
                          <Badge
                            variant="outline"
                            className="text-green-600"
                          >
                            Done
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No plan yet. Visit the{" "}
                  <a href="/plan" className="underline">Plan</a> page to generate
                  your first weekly training plan.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Nutrition */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Nutrition</CardTitle>
            <Link
              href="/nutrition"
              className="text-sm text-muted-foreground hover:underline"
            >
              Full view
            </Link>
          </CardHeader>
          <CardContent>
            {nutrition ? (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Calories</p>
                    <p className="text-xl font-bold">
                      {nutrition.totalCalories.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carbs</p>
                    <p className="text-xl font-bold">
                      {nutrition.carbsGrams}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Protein</p>
                    <p className="text-xl font-bold">
                      {nutrition.proteinGrams}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fat</p>
                    <p className="text-xl font-bold">
                      {nutrition.fatGrams}g
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {nutrition.explanation}
                  {todayTss > 0 && ` \u00B7 ${Math.round(todayTss)} TSS today`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Set up your profile to see daily nutrition targets tailored to
                your training.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

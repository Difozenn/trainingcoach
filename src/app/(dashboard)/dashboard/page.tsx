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
import dynamic from "next/dynamic";

const PowerProfileTab = dynamic(
  () => import("../profile/power-profile-tab").then((m) => m.PowerProfileTab),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted/50" /> }
);

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

  // Compute today's nutrition live from actual TSS + exercise calories
  const todayTss = Number(todayTssRows[0]?.totalTss) || 0;
  const todayExerciseCal = Number(todayTssRows[0]?.totalExerciseKj) || 0;
  const athleteAge = athleteProfile?.dateOfBirth
    ? Math.floor((Date.now() - athleteProfile.dateOfBirth.getTime()) / (365.25 * 24 * 3600_000))
    : null;
  const nutrition = athleteProfile?.weightKg
    ? calculateDailyMacros(
        athleteProfile.weightKg,
        getTrainingDayType(todayTss),
        {
          heightCm: athleteProfile.heightCm,
          age: athleteAge,
          sex: athleteProfile.sex as "male" | "female" | null,
          exerciseCal: todayExerciseCal,
        }
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
          <Card className="stat-card-accent" data-accent="blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Fitness (CTL)
              </CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[28px] font-bold leading-none tracking-tight tabular-nums">
                {metrics?.ctl ? Math.round(metrics.ctl) : "--"}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {metrics?.rampRate
                  ? <span className={metrics.rampRate > 0 ? "font-medium text-green-500" : "font-medium text-red-500"}>
                      {metrics.rampRate > 0 ? "+" : ""}{metrics.rampRate.toFixed(1)} TSS/wk
                    </span>
                  : "42-day training load"}
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card-accent" data-accent="pink">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Fatigue (ATL)
              </CardTitle>
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[28px] font-bold leading-none tracking-tight tabular-nums">
                {metrics?.atl ? Math.round(metrics.atl) : "--"}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                7-day training load
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card-accent" data-accent="green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Form
              </CardTitle>
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-[28px] font-bold leading-none tracking-tight tabular-nums ${formColor}`}>
                {formPct != null
                  ? `${formPct > 0 ? "+" : ""}${formPct}%`
                  : "--"}
              </div>
              <p className={`mt-1.5 text-[11px] ${formLabel ? `font-medium ${formColor}` : "text-muted-foreground"}`}>
                {formLabel ?? "Fitness - Fatigue balance"}
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card-accent" data-accent="amber">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Weekly TSS
              </CardTitle>
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[28px] font-bold leading-none tracking-tight tabular-nums">
                {Math.round(weeklyTss.total)}
              </div>
              <div className="mt-1.5 flex gap-2 text-[11px] text-muted-foreground">
                {weeklyTss.cycling > 0 && (
                  <span className="font-medium text-blue-500">
                    {Math.round(weeklyTss.cycling)} bike
                  </span>
                )}
                {weeklyTss.running > 0 && (
                  <span className="font-medium text-green-500">
                    {Math.round(weeklyTss.running)} run
                  </span>
                )}
                {weeklyTss.swimming > 0 && (
                  <span className="font-medium text-teal-500">
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
                <div className="space-y-1.5">
                  {recentActivities.map((a) => {
                    const Icon =
                      sportIcons[a.sport as keyof typeof sportIcons] ??
                      Activity;
                    const isRun = a.sport === "running";
                    const isSwim = a.sport === "swimming";
                    return (
                      <Link
                        key={a.id}
                        href={`/activities/${a.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 transition-all hover:bg-muted/50 hover:border-border"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isRun ? "bg-green-500/10" : isSwim ? "bg-teal-500/10" : "bg-primary/10"
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isRun ? "text-green-500" : isSwim ? "text-teal-500" : "text-primary"
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">
                            {a.name ?? "Untitled"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(a.startedAt)} &middot;{" "}
                            {formatDuration(a.durationSeconds)}
                            {a.distanceMeters
                              ? ` · ${formatDistance(a.distanceMeters)}`
                              : ""}
                          </p>
                        </div>
                        {a.tss != null && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                            {Math.round(a.tss)} TSS
                          </span>
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
                    <>
                      <p className="text-[12px] text-muted-foreground">
                        Target: {Math.round(weeklyPlan.targetTss)} TSS
                        {weeklyPlan.actualTss != null &&
                          ` · Done: ${Math.round(weeklyPlan.actualTss)} TSS`}
                      </p>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${Math.min(100, Math.round(((weeklyPlan.actualTss ?? 0) / weeklyPlan.targetTss) * 100))}%` }}
                        />
                      </div>
                    </>
                  )}
                  {workouts.slice(0, 5).map((w) => {
                    const Icon =
                      sportIcons[w.sport as keyof typeof sportIcons] ??
                      Activity;
                    return (
                      <div
                        key={w.id}
                        className="flex items-center gap-2.5 rounded-lg border border-border/50 p-2 text-[13px] transition-colors hover:bg-muted/30"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 font-medium">{w.title}</span>
                        {w.isCompleted ? (
                          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-500">
                            Done
                          </span>
                        ) : (
                          <span className="rounded-full border border-border bg-transparent px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            Upcoming
                          </span>
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
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Calories</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {nutrition.totalCalories.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Carbs</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {nutrition.carbsGrams}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Protein</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {nutrition.proteinGrams}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-500/10 px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fat</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-green-600 dark:text-green-400">
                      {nutrition.fatGrams}g
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
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

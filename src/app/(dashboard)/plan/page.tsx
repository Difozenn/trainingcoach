import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bike, Footprints, Waves, Activity, Download } from "lucide-react";
import {
  getCurrentWeeklyPlan,
  getWeeklyWorkouts,
  getUpcomingEvents,
  getActualWeeklyTss,
  getPowerStreamsForRange,
  getSportProfiles,
} from "@/lib/data/queries";
import { formatDuration, formatDate } from "@/lib/data/helpers";
import { getUserPlan } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import Link from "next/link";
import { GeneratePlanButton } from "@/components/dashboard/generate-plan-button";
import { calculateZoneDistribution } from "@/lib/engine/cycling/zones";
import {
  aggregateZoneDistributions,
  calculatePolarizationIndex,
} from "@/lib/engine/cycling/polarization";

const sportIcons = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
};

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getUserPlan(session.user.id);
  if (plan === "free") return <UpgradePrompt feature="Training Plan" />;

  const userId = session.user.id;

  const [weeklyPlan, events] = await Promise.all([
    getCurrentWeeklyPlan(userId),
    getUpcomingEvents(userId),
  ]);

  const workouts = weeklyPlan ? await getWeeklyWorkouts(weeklyPlan.id) : [];

  // Recalculate ISO Mon–Sun from stored start date (may be wrong day)
  let isoMonday: Date | null = null;
  let isoSunday: Date | null = null;
  if (weeklyPlan) {
    const start = new Date(weeklyPlan.weekStartDate);
    const dow = (start.getDay() + 6) % 7; // 0=Mon
    isoMonday = new Date(start);
    isoMonday.setDate(isoMonday.getDate() - dow);
    isoMonday.setHours(0, 0, 0, 0);
    isoSunday = new Date(isoMonday);
    isoSunday.setDate(isoSunday.getDate() + 6);
    isoSunday.setHours(23, 59, 59, 999);
  }

  const weeklyActuals = isoMonday && isoSunday
    ? await getActualWeeklyTss(userId, isoMonday, isoSunday)
    : { totalTss: 0, activityCount: 0 };
  const completed = weeklyActuals.activityCount;
  const progress = workouts.length > 0 ? Math.min(100, (completed / workouts.length) * 100) : 0;

  // Polarization Index — compute from power streams this week
  const [powerActivities, sportProfiles] = await Promise.all([
    isoMonday && isoSunday
      ? getPowerStreamsForRange(userId, isoMonday, isoSunday)
      : Promise.resolve([]),
    getSportProfiles(userId),
  ]);
  const cyclingProfile = sportProfiles.find((p) => p.sport === "cycling");
  const ftp = cyclingProfile?.ftp ?? 0;

  let polarization = null;
  if (ftp > 0 && powerActivities.length > 0) {
    const distributions = powerActivities
      .filter((a) => a.streamData?.watts?.length)
      .map((a) => ({
        zones: calculateZoneDistribution(a.streamData!.watts!, ftp),
        seconds: a.durationSeconds,
      }));
    if (distributions.length > 0) {
      const weekZones = aggregateZoneDistributions(distributions);
      polarization = calculatePolarizationIndex(weekZones);
    }
  }

  return (
    <>
      <DashboardHeader title="Weekly Plan" />
      <div className="flex-1 space-y-6 p-6">
        {/* Week summary */}
        {weeklyPlan ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {(() => {
                    if (!isoMonday || !isoSunday) return "";
                    // ISO week number
                    const d = new Date(Date.UTC(isoMonday.getFullYear(), isoMonday.getMonth(), isoMonday.getDate()));
                    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                    const weekNum = Math.ceil(((d.getTime() - new Date(Date.UTC(d.getUTCFullYear(), 0, 1)).getTime()) / 86400000 + 1) / 7);
                    const monMonth = isoMonday.toLocaleDateString("en-US", { month: "short" });
                    const sunMonth = isoSunday.toLocaleDateString("en-US", { month: "short" });
                    const dateRange = monMonth === sunMonth
                      ? `${monMonth} ${isoMonday.getDate()}–${isoSunday.getDate()}`
                      : `${monMonth} ${isoMonday.getDate()} – ${sunMonth} ${isoSunday.getDate()}`;
                    return `Wk ${weekNum} · ${dateRange}`;
                  })()}
                </span>
                {weeklyPlan.phase && (
                  <Badge variant="outline" className="capitalize">
                    {weeklyPlan.phase}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="stat-card-accent rounded-lg border bg-card px-4 py-3" data-accent="amber">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Target TSS</p>
                  <p className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums">
                    {weeklyPlan.targetTss
                      ? Math.round(weeklyPlan.targetTss)
                      : "--"}
                  </p>
                </div>
                <div className="stat-card-accent rounded-lg border bg-card px-4 py-3" data-accent="blue">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Actual TSS</p>
                  <p className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums">
                    {weeklyActuals.totalTss || "0"}
                  </p>
                </div>
                <div className="stat-card-accent rounded-lg border bg-card px-4 py-3" data-accent="green">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Progress</p>
                  <p className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums">
                    {completed}/{workouts.length}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {weeklyPlan.adaptationNotes && (
                <p className="text-sm text-muted-foreground italic">
                  {weeklyPlan.adaptationNotes}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm text-muted-foreground">
                No weekly plan yet. Plans are generated every Sunday, or you can
                generate one now. The coaching engine creates a pool of
                workouts — you pick when to do each one.
              </p>
              <GeneratePlanButton />
            </CardContent>
          </Card>
        )}

        {/* Intensity Distribution */}
        {polarization && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Intensity Distribution</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="capitalize text-xs"
                  >
                    {polarization.label}
                  </Badge>
                  {polarization.pi !== null && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      PI {polarization.pi.toFixed(2)}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Stacked bar */}
              <div className="flex h-8 w-full overflow-hidden rounded-full">
                {polarization.low > 0 && (
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${polarization.low}%` }}
                    title={`Z1-Z2: ${polarization.low}%`}
                  />
                )}
                {polarization.mid > 0 && (
                  <div
                    className="bg-amber-500 transition-all"
                    style={{ width: `${polarization.mid}%` }}
                    title={`Z3-Z4: ${polarization.mid}%`}
                  />
                )}
                {polarization.high > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${polarization.high}%` }}
                    title={`Z5+: ${polarization.high}%`}
                  />
                )}
              </div>
              {/* Legend */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                  Z1-Z2 {polarization.low}%
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Z3-Z4 {polarization.mid}%
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                  Z5+ {polarization.high}%
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workout pool */}
        {workouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Workout Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Pick when to do each workout. Drag onto the{" "}
                <Link href="/calendar" className="underline">
                  calendar
                </Link>{" "}
                or just do them whenever.
              </p>
              <div className="space-y-3">
                {workouts.map((w) => {
                  const Icon =
                    sportIcons[w.sport as keyof typeof sportIcons] ?? Activity;
                  return (
                    <div
                      key={w.id}
                      className={`rounded-lg border p-4 transition-colors ${w.isCompleted ? "border-green-500/30 bg-green-500/5" : "border-border/50 hover:border-border"}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{w.title}</h3>
                            <Badge variant="outline" className="capitalize text-xs">
                              {w.workoutType.replace(/_/g, " ")}
                            </Badge>
                            {w.isCompleted && (
                              <Badge variant="outline" className="text-green-600 text-xs">
                                Done
                              </Badge>
                            )}
                          </div>
                          {w.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {w.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {w.targetDurationMinutes && (
                              <Badge variant="secondary">
                                {formatDuration(w.targetDurationMinutes * 60)}
                              </Badge>
                            )}
                            {w.targetTss && (
                              <Badge variant="secondary">
                                ~{Math.round(w.targetTss)} TSS
                              </Badge>
                            )}
                            {w.targetIntensityFactor && (
                              <Badge variant="secondary">
                                IF {w.targetIntensityFactor.toFixed(2)}
                              </Badge>
                            )}
                            {w.carbsPerHour && (
                              <Badge variant="outline">
                                {w.carbsPerHour}g carbs/hr
                              </Badge>
                            )}
                          </div>
                          {w.whyThisWorkout && (
                            <p className="mt-2 text-xs text-muted-foreground italic">
                              {w.whyThisWorkout}
                            </p>
                          )}
                          {w.coachingTip && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {w.coachingTip}
                            </p>
                          )}
                        </div>
                        {/* Export button */}
                        {w.sport === "cycling" && w.structure && (
                          <Button variant="ghost" size="icon" title="Export workout" asChild>
                            <a href={`/api/export?workoutId=${w.id}&format=zwo`} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.map((e) => {
                  const daysUntil = Math.ceil(
                    (e.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(e.eventDate)} &middot;{" "}
                          <span className="capitalize">{e.sport}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={e.priority === "A" ? "default" : "outline"}
                        >
                          {e.priority}-race
                        </Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {daysUntil} days
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

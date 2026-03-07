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
  getAthleteProfile,
  getLatestMetrics,
  getUserPeakPowers,
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
import {
  generateAutoProgressivePlan,
  detectSubPhase,
  getRecoveryPattern,
  isRecoveryWeek,
} from "@/lib/engine/coaching/periodization";
import type { SubPhase, PhaseConfig } from "@/lib/engine/coaching/periodization";
import type { AthleteLevel } from "@/lib/engine/coaching/progression";
import { buildPowerProfile } from "@/lib/engine/cycling/power-profile";
import type { RiderType } from "@/lib/engine/cycling/power-profile";
import {
  RIDER_TYPE_DESCRIPTIONS,
  TRAINING_FOCUS_LABELS,
} from "@/lib/engine/coaching/workout-bias";
import type { TrainingFocus } from "@/lib/engine/coaching/workout-bias";

const sportIcons = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
};

// ── Phase colors and labels ─────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  base1: "bg-sky-400",
  base2: "bg-blue-500",
  base3: "bg-blue-700",
  build1: "bg-amber-400",
  build2: "bg-amber-600",
  peak: "bg-green-500",
  race: "bg-red-500",
  recovery: "bg-purple-500",
  transition: "bg-gray-400",
};

const PHASE_BG_COLORS: Record<string, string> = {
  base1: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  base2: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  base3: "bg-blue-700/10 text-blue-800 dark:text-blue-300",
  build1: "bg-amber-400/10 text-amber-600 dark:text-amber-400",
  build2: "bg-amber-600/10 text-amber-700 dark:text-amber-300",
  peak: "bg-green-500/10 text-green-700 dark:text-green-400",
  race: "bg-red-500/10 text-red-700 dark:text-red-400",
  recovery: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  transition: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const PHASE_LABELS: Record<string, string> = {
  base1: "Base 1",
  base2: "Base 2",
  base3: "Base 3",
  build1: "Build 1",
  build2: "Build 2",
  peak: "Peak",
  race: "Race",
  recovery: "Recovery",
  transition: "Transition",
};

// ── Helper: map experience level to AthleteLevel ────────────────────

function toAthleteLevel(exp: string | null): AthleteLevel {
  switch (exp) {
    case "beginner": return "beginner";
    case "advanced": return "advanced";
    case "elite": return "competitive";
    default: return "intermediate";
  }
}

// ── Helper: CTL-only phase detection for projection ─────────────────
// Unlike detectSubPhase() which uses OR(ctl, weeks) for safety in the
// current week, the projection shows what phase you'll reach as fitness
// grows — so we use CTL thresholds only.

function projectPhase(ctl: number): SubPhase {
  if (ctl < 30) return "base1";
  if (ctl < 50) return "base2";
  if (ctl < 60) return "base3";
  if (ctl < 75) return "build1";
  if (ctl < 90) return "build2";
  return "peak";
}

// ── Helper: generate upcoming phase timeline ────────────────────────

function generatePhaseTimeline(
  ctl: number,
  weeksSinceStart: number,
  level: AthleteLevel,
  weeklyHours: number,
  actualRampRate: number | null,
  weeksAhead: number = 16
): { subPhase: SubPhase; isRecovery: boolean; weekNum: number; projectedCtl: number }[] {
  const timeline: { subPhase: SubPhase; isRecovery: boolean; weekNum: number; projectedCtl: number }[] = [];
  const pattern = getRecoveryPattern(level);

  // CTL ramp rate: use actual measured ramp if available, else level default.
  // Safe ranges (Coggan, Friel, Couzens): 3-5 novice, 5-7 intermediate, 7-10 advanced
  const defaultRamp: Record<AthleteLevel, number> = {
    novice: 3,
    beginner: 4,
    intermediate: 5,
    advanced: 7,
    competitive: 8,
  };
  const ramp = actualRampRate != null && actualRampRate > 0
    ? Math.min(actualRampRate, 10) // cap at 10 for safety
    : defaultRamp[level];

  // CTL ceiling: steady-state CTL for given weekly hours + intensity.
  // Use realistic TSS/hr that accounts for structured training (sweet spot,
  // threshold sessions push avg well above pure Z2).
  const tssPerHour: Record<AthleteLevel, number> = {
    novice: 45,
    beginner: 50,
    intermediate: 58,
    advanced: 63,
    competitive: 68,
  };
  const ctlCeiling = (weeklyHours * tssPerHour[level]) / 7;

  let projectedCtl = ctl;
  for (let i = 0; i < weeksAhead; i++) {
    const week = weeksSinceStart + i;
    const recovery = isRecoveryWeek(week, pattern);
    const sub = recovery ? "recovery" as SubPhase : projectPhase(projectedCtl);
    timeline.push({ subPhase: sub, isRecovery: recovery, weekNum: week + 1, projectedCtl: Math.round(projectedCtl) });
    if (recovery) {
      projectedCtl = Math.max(0, projectedCtl * 0.94);
    } else {
      // Linear ramp, tapering only when approaching ceiling (>80%)
      const ceilingPct = projectedCtl / ctlCeiling;
      const taper = ceilingPct > 0.8 ? Math.max(0.1, 1 - (ceilingPct - 0.8) * 4) : 1;
      projectedCtl += ramp * taper;
      projectedCtl = Math.min(projectedCtl, ctlCeiling);
    }
  }

  return timeline;
}

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getUserPlan(session.user.id);
  if (plan === "free") return <UpgradePrompt feature="Training Plan" />;

  const userId = session.user.id;

  const [weeklyPlan, events, profile, metrics, sportProfilesList, peakPowers] = await Promise.all([
    getCurrentWeeklyPlan(userId),
    getUpcomingEvents(userId),
    getAthleteProfile(userId),
    getLatestMetrics(userId),
    getSportProfiles(userId),
    getUserPeakPowers(userId, 42), // 6-week power profile
  ]);

  const workouts = weeklyPlan ? await getWeeklyWorkouts(weeklyPlan.id) : [];

  // ISO Mon–Sun from stored start date
  let isoMonday: Date | null = null;
  let isoSunday: Date | null = null;
  if (weeklyPlan) {
    const start = new Date(weeklyPlan.weekStartDate);
    const dow = (start.getDay() + 6) % 7;
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

  // Polarization — compute from power streams this week
  const [powerActivities] = await Promise.all([
    isoMonday && isoSunday
      ? getPowerStreamsForRange(userId, isoMonday, isoSunday)
      : Promise.resolve([]),
  ]);
  const cyclingProfile = sportProfilesList.find((p) => p.sport === "cycling");
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

  // ── Rider Type ──────────────────────────────────────────────────
  const weightKg = profile?.weightKg ?? 75;
  let riderType: RiderType = "All-Rounder";
  let riderTypeSource: "auto" | "manual" = "auto";

  if (profile?.riderType) {
    riderType = profile.riderType as RiderType;
    riderTypeSource = "manual";
  } else if (peakPowers?.peaks) {
    const validPeaks: Record<string, number> = {};
    for (const [key, val] of Object.entries(peakPowers.peaks)) {
      if (val && val > 0) validPeaks[key] = val;
    }
    if (Object.keys(validPeaks).length >= 3) {
      const pp = buildPowerProfile(validPeaks, weightKg);
      riderType = pp.riderType;
    }
  }

  const trainingFocus: TrainingFocus = (profile?.trainingFocus as TrainingFocus) ?? "balanced";

  // ── Periodization Timeline ──────────────────────────────────────
  const ctl = metrics?.ctl ?? 0;
  const level = toAthleteLevel(profile?.experienceLevel ?? null);
  // Estimate weeks since start (from first activity or profile creation)
  const profileCreated = profile?.createdAt ?? new Date();
  const weeksSinceStart = Math.max(
    0,
    Math.floor((Date.now() - profileCreated.getTime()) / (7 * 24 * 3600_000))
  );

  const weeklyHours = profile?.weeklyHoursAvailable ?? 8;
  const actualRamp = metrics?.rampRate ?? null;
  const currentPhase = generateAutoProgressivePlan(ctl, weeksSinceStart, level);
  const phaseTimeline = generatePhaseTimeline(ctl, weeksSinceStart, level, weeklyHours, actualRamp);

  // ── Expected Zone Distribution ──────────────────────────────────
  const expectedZones = currentPhase.intensityDistribution;

  return (
    <>
      <DashboardHeader title="Weekly Plan" />
      <div className="flex-1 space-y-6 p-6">
        {/* ── Rider Type + Training Focus ────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {riderType}
            {riderTypeSource === "auto" && (
              <span className="ml-1 text-muted-foreground">(auto)</span>
            )}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {RIDER_TYPE_DESCRIPTIONS[riderType]}
          </span>
          <span className="text-border">·</span>
          <Badge variant="secondary" className="text-xs">
            {TRAINING_FOCUS_LABELS[trainingFocus]}
          </Badge>
          <Link href="/settings" className="text-[11px] text-muted-foreground underline ml-auto">
            Change
          </Link>
        </div>

        {/* ── Phase Timeline ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Training Roadmap</span>
              <Badge className={`text-xs ${PHASE_BG_COLORS[currentPhase.subPhase] ?? ""}`}>
                {PHASE_LABELS[currentPhase.subPhase] ?? currentPhase.subPhase}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground italic">
              {currentPhase.description}
            </p>

            {/* Visual timeline bar */}
            <div className="flex gap-0.5 rounded-full overflow-hidden h-6">
              {phaseTimeline.map((week, i) => (
                <div
                  key={i}
                  className={`flex-1 relative group ${PHASE_COLORS[week.subPhase] ?? "bg-gray-400"} ${
                    i === 0 ? "ring-2 ring-primary ring-offset-1 ring-offset-background rounded-l-full" : ""
                  } ${i === phaseTimeline.length - 1 ? "rounded-r-full" : ""} ${
                    week.isRecovery ? "opacity-50" : ""
                  }`}
                  title={`Wk ${week.weekNum}: ${PHASE_LABELS[week.subPhase] ?? week.subPhase}${week.isRecovery ? " (recovery)" : ""} · CTL ${week.projectedCtl}`}
                />
              ))}
            </div>

            {/* Timeline legend */}
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              {(() => {
                // Group consecutive phases, track CTL at start of each group
                const groups: { label: string; color: string; count: number; startCtl: number; weekIdx: number }[] = [];
                let prev = "";
                for (let idx = 0; idx < phaseTimeline.length; idx++) {
                  const week = phaseTimeline[idx];
                  const label = PHASE_LABELS[week.subPhase] ?? week.subPhase;
                  if (label === prev && groups.length > 0) {
                    groups[groups.length - 1].count++;
                  } else {
                    groups.push({ label, color: PHASE_COLORS[week.subPhase] ?? "bg-gray-400", count: 1, startCtl: week.projectedCtl, weekIdx: idx });
                    prev = label;
                  }
                }
                return groups.map((g, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className={`inline-block h-2.5 w-2.5 rounded-sm ${g.color}`} />
                    {g.label} ({g.count}w)
                    {g.weekIdx > 0 && (
                      <span className="text-[10px] text-muted-foreground/60">
                        wk{g.weekIdx + 1}
                      </span>
                    )}
                  </span>
                ));
              })()}
            </div>

            {/* CTL projection summary */}
            <p className="text-[11px] text-muted-foreground">
              CTL {Math.round(ctl)} → {phaseTimeline[phaseTimeline.length - 1]?.projectedCtl ?? "?"}{" "}
              projected over {phaseTimeline.length} weeks
              {actualRamp != null && ` (ramp ${actualRamp.toFixed(1)}/wk)`}
            </p>
          </CardContent>
        </Card>

        {/* ── Week Summary ───────────────────────────────────────── */}
        {weeklyPlan ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {(() => {
                    if (!isoMonday || !isoSunday) return "";
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
                    {weeklyPlan.targetTss ? Math.round(weeklyPlan.targetTss) : "--"}
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
                generate one now.
              </p>
              <GeneratePlanButton />
            </CardContent>
          </Card>
        )}

        {/* ── Expected vs Actual Zone Distribution ───────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Intensity Distribution</span>
              {polarization && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs">
                    {polarization.label}
                  </Badge>
                  {polarization.pi !== null && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      PI {polarization.pi.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {PHASE_LABELS[currentPhase.subPhase] ?? "Current"} phase targets{polarization ? " vs this week so far" : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Legend */}
            <div className="flex items-center gap-5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[7px] w-4 rounded-[2px] bg-muted-foreground/20" />
                Target
              </span>
              {polarization && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-[7px] w-4 rounded-[2px] bg-primary/70" />
                  Actual
                </span>
              )}
            </div>

            {[
              { label: "Easy", zones: "Z1–Z2", expected: expectedZones.zone1_2Pct, actual: polarization?.low ?? 0, color: "#22c55e" },
              { label: "Tempo", zones: "Z3", expected: expectedZones.zone3Pct, actual: polarization?.mid ?? 0, color: "#f59e0b" },
              { label: "Hard", zones: "Z4–Z5+", expected: expectedZones.zone4_5Pct, actual: polarization?.high ?? 0, color: "#ef4444" },
            ].map((z) => {
              const delta = polarization ? z.actual - z.expected : null;
              return (
                <div key={z.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: z.color }}
                      />
                      <span className="text-[13px] font-medium">{z.label}</span>
                      <span className="text-[10px] text-muted-foreground">{z.zones}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      {polarization ? (
                        <>
                          <span
                            className="text-[13px] font-semibold"
                            style={{ color: z.color }}
                          >
                            {z.actual}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            / {z.expected}%
                          </span>
                          {delta !== null && Math.abs(delta) > 1 && (
                            <span className={`text-[10px] font-medium ${
                              delta > 0 ? "text-amber-500" : "text-blue-400"
                            }`}>
                              {delta > 0 ? "+" : ""}{Math.round(delta)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">
                          {z.expected}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-[10px] w-full rounded-full bg-muted/40">
                    {/* Target reference — subtle filled bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${z.expected}%`, backgroundColor: z.color, opacity: 0.12 }}
                    />
                    {/* Actual bar */}
                    {polarization && z.actual > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${z.actual}%`, backgroundColor: z.color, opacity: 0.7 }}
                      />
                    )}
                    {/* Target tick marker */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: `${z.expected}%`,
                        top: "-2px",
                        bottom: "-2px",
                        width: "2px",
                        backgroundColor: z.color,
                        opacity: 0.45,
                        transform: "translateX(-1px)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Workout Pool ──────────────────────────────────────── */}
        {workouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Workout Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Pick when to do each workout. Drag onto the{" "}
                <Link href="/activities" className="underline">
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

        {/* ── Upcoming Events ───────────────────────────────────── */}
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

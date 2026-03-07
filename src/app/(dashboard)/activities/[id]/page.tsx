import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bike,
  Footprints,
  Waves,
  Activity,
  Zap,
  Heart,
  Timer,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  getActivityById,
  getActivityStreams,
  getDailyMetricsForDate,
  getSportProfiles,
  getUserPeakPowers,
  getCyclingFtpAtDate,
  getAthleteProfile,
} from "@/lib/data/queries";
import { classifyPowerRacing } from "@/lib/engine/cycling/power-profile";
import {
  formatDuration,
  formatDistance,
  formatDate,
  formatPace,
  formatSpeed,
  sportColor,
  tsbColor,
} from "@/lib/data/helpers";
import Link from "next/link";
import { ActivityMapWrapper } from "@/components/dashboard/activity-map-wrapper";
import { LazyStreamCharts as ActivityStreamCharts, LazyBreakthroughChart as BreakthroughChart } from "@/components/dashboard/stream-charts-wrapper";
import type { StreamData } from "@/components/dashboard/stream-charts";
import { calculateWbal, calculateBreakthroughFtp, downsampleWbal } from "@/lib/engine/cycling/wbal";
import { getCyclingPowerZones } from "@/lib/engine/cycling/zones";
import { getRunningPaceZones } from "@/lib/engine/running/zones";
import { getSwimmingZones } from "@/lib/engine/swimming/zones";
import { BreakthroughPrompt } from "@/components/dashboard/breakthrough-prompt";
import { db } from "@/lib/db";
import { sportProfiles, thresholdHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const sportIcons = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
};

// ── Zone colors ─────────────────────────────────────────────────────

const zoneColors = [
  "#6b7280", // Z1 - gray
  "#3b82f6", // Z2 - blue
  "#22c55e", // Z3 - green
  "#eab308", // Z4 - yellow
  "#f97316", // Z5 - orange
  "#ef4444", // Z6 - red
  "#dc2626", // Z7 - dark red
];

// ── Helper: stat row ────────────────────────────────────────────────

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {value}
        {unit && (
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        )}
        {sub && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

function StatSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

// ── Zone bar ────────────────────────────────────────────────────────

function ZoneBar({ distribution }: { distribution: number[] }) {
  const total = distribution.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {distribution.map((pct, i) => {
        if (pct <= 0) return null;
        return (
          <div
            key={i}
            className="transition-all"
            style={{
              width: `${(pct / total) * 100}%`,
              backgroundColor: zoneColors[i] ?? "#6b7280",
            }}
          />
        );
      })}
    </div>
  );
}

type ZoneInfo = {
  zone: string;
  name: string;
  range: string;
  pct: number;
  timeSeconds: number;
};

function getZoneDetails(
  distribution: number[],
  sport: string,
  durationSeconds: number,
  ftp?: number | null,
  thresholdPace?: number | null,
  css?: number | null
): ZoneInfo[] {
  if (sport === "cycling" && ftp) {
    const zones = getCyclingPowerZones(ftp);
    return zones.map((z, i) => ({
      zone: `Z${z.zone}`,
      name: z.name,
      range: z.maxWatts
        ? `${z.minWatts}-${z.maxWatts}W`
        : `>${z.minWatts}W`,
      pct: distribution[i] ?? 0,
      timeSeconds: Math.round(((distribution[i] ?? 0) / 100) * durationSeconds),
    }));
  }

  if (sport === "running" && thresholdPace) {
    const zones = getRunningPaceZones(thresholdPace);
    return zones.map((z, i) => ({
      zone: `Z${z.zone}`,
      name: z.name,
      range: z.paceRangeFormatted,
      pct: distribution[i] ?? 0,
      timeSeconds: Math.round(((distribution[i] ?? 0) / 100) * durationSeconds),
    }));
  }

  if (sport === "swimming" && css) {
    const zones = getSwimmingZones(css);
    return zones.map((z, i) => ({
      zone: `Z${z.zone}`,
      name: z.name,
      range: z.paceRangeFormatted,
      pct: distribution[i] ?? 0,
      timeSeconds: Math.round(((distribution[i] ?? 0) / 100) * durationSeconds),
    }));
  }

  // Fallback: no threshold data
  return distribution.map((pct, i) => ({
    zone: `Z${i + 1}`,
    name: "",
    range: "",
    pct,
    timeSeconds: Math.round((pct / 100) * durationSeconds),
  }));
}

// ── Streams section (deferred via Suspense) ─────────────────────────

function StreamsSkeleton() {
  return (
    <div className="space-y-6 min-w-0">
      {/* Map skeleton */}
      <Card className="overflow-hidden p-0">
        <div className="h-[300px] flex items-center justify-center bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
      {/* Chart skeleton */}
      <Card className="p-4 sm:p-5">
        <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
      {/* W'bal skeleton */}
      <Card className="p-4 sm:p-5">
        <div className="h-[180px] flex items-center justify-center bg-muted/30 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}

async function StreamsSection({
  activityId,
  sport,
  ftp,
  wbalFtp,
  peak5s,
  peak5m,
  recentPeaks,
  color,
}: {
  activityId: string;
  sport: string;
  ftp: number | null | undefined;
  wbalFtp: number | null | undefined;
  peak5s: number | null | undefined;
  peak5m: number | null | undefined;
  recentPeaks: { peaks: Record<string, number | null> } | null;
  color: string;
}) {
  const streams = await getActivityStreams(activityId);

  // GPS points
  const gpsPoints = streams
    .filter((s) => s.latitudeDeg != null && s.longitudeDeg != null)
    .map((s) => ({ lat: s.latitudeDeg!, lng: s.longitudeDeg! }));
  const hasGps = gpsPoints.length > 10;

  // Stream data for charts
  const streamData: StreamData = streams.map((s) => ({
    secondOffset: s.secondOffset,
    powerWatts: s.powerWatts,
    heartRate: s.heartRate,
    cadenceRpm: s.cadenceRpm,
    altitudeMeters: s.altitudeMeters,
  }));
  const hasStreams = streamData.length > 0;
  const hasPower = streams.some((s) => s.powerWatts != null);

  if (!hasGps && !hasStreams) return null;

  // Breakthrough detection
  let breakthroughData: {
    newFtp: number;
    delta: number;
    time: string;
  } | null = null;

  if (sport === "cycling" && wbalFtp && hasPower) {
    const powerStream = streams.map((s) => s.powerWatts ?? 0);
    const wbalOpts = {
      pMax: peak5s ?? recentPeaks?.peaks["5s"] ?? undefined,
      peak5m: peak5m ?? recentPeaks?.peaks["5m"] ?? undefined,
    };
    const wbalResult = calculateWbal(powerStream, wbalFtp, wbalOpts);
    const btPoint = wbalResult.find((p) => p.isBreakthrough);

    if (btPoint) {
      const impliedFtp = calculateBreakthroughFtp(powerStream, wbalFtp, wbalOpts);
      if (impliedFtp && impliedFtp > wbalFtp) {
        const mins = Math.floor(btPoint.time / 60);
        const secs = btPoint.time % 60;
        breakthroughData = {
          newFtp: impliedFtp,
          delta: Math.round(btPoint.power - btPoint.mpa),
          time: `${mins}:${secs.toString().padStart(2, "0")}`,
        };
      }
    }
  }

  // Server action: update FTP from breakthrough
  async function updateFtpAction(newFtp: number) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) throw new Error("Unauthorized");

    await db
      .update(sportProfiles)
      .set({ ftp: newFtp, updatedAt: new Date() })
      .where(
        and(
          eq(sportProfiles.userId, session2.user.id),
          eq(sportProfiles.sport, "cycling")
        )
      );

    await db.insert(thresholdHistory).values({
      userId: session2.user.id,
      sport: "cycling",
      metricName: "ftp",
      value: newFtp,
      source: "auto_detect",
      activityId,
    });

    revalidatePath(`/activities/${activityId}`);
  }

  return (
    <div className="space-y-6 min-w-0">
      {hasGps && (
        <Card className="overflow-hidden p-0">
          <ActivityMapWrapper gpsPoints={gpsPoints} color={color} />
        </Card>
      )}

      {hasStreams && (
        <Card className="p-4 sm:p-5">
          <CardContent className="p-0">
            <ActivityStreamCharts
              streams={streamData}
              ftp={ftp}
              sport={sport}
            />
          </CardContent>
        </Card>
      )}

      {/* Breakthrough prompt */}
      {breakthroughData && wbalFtp && (
        <BreakthroughPrompt
          currentFtp={wbalFtp}
          newFtp={breakthroughData.newFtp}
          breakthroughWatts={breakthroughData.delta}
          breakthroughTime={breakthroughData.time}
          activityId={activityId}
          updateAction={updateFtpAction}
        />
      )}

      {/* W'bal / MPA Breakthrough chart for cycling with power */}
      {sport === "cycling" && wbalFtp && hasPower && (() => {
        const powerStream = streams.map((s) => s.powerWatts ?? 0);
        const wbalData = calculateWbal(powerStream, wbalFtp, {
          pMax: peak5s ?? recentPeaks?.peaks["5s"] ?? undefined,
          peak5m: peak5m ?? recentPeaks?.peaks["5m"] ?? undefined,
        });
        // On non-breakthrough rides, clamp MPA to stay above actual power.
        if (!breakthroughData) {
          for (const point of wbalData) {
            point.mpa = Math.max(point.mpa, point.power);
          }
        }
        const downsampled = downsampleWbal(wbalData);
        if (downsampled.length === 0) return null;
        return (
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <BreakthroughChart data={downsampled} ftp={wbalFtp} />
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

  // Lightweight data fetch (no stream JSONB blob)
  const [activity, profiles, recentPeaks, athleteProfile] = await Promise.all([
    getActivityById(userId, id),
    getSportProfiles(userId),
    getUserPeakPowers(userId),
    getAthleteProfile(userId),
  ]);

  if (!activity) notFound();

  // Parallel fetch: fitness context + historical FTP (both depend on activity date)
  const [fitnessContext, historicalFtp] = await Promise.all([
    getDailyMetricsForDate(userId, activity.startedAt),
    activity.sport === "cycling"
      ? getCyclingFtpAtDate(userId, activity.startedAt)
      : Promise.resolve(null),
  ]);

  const Icon =
    sportIcons[activity.sport as keyof typeof sportIcons] ?? Activity;
  const color = sportColor(activity.sport);

  // Sport profile for thresholds
  const sportProfile = profiles.find((p) => p.sport === activity.sport);
  const ftp = sportProfile?.ftp;
  const thresholdPace = sportProfile?.thresholdPaceSPerKm;
  const css = sportProfile?.cssSPer100m;
  const wbalFtp = historicalFtp ?? ftp;

  // Derived metrics
  const avgSpeed =
    activity.distanceMeters && activity.movingTimeSeconds
      ? activity.distanceMeters / activity.movingTimeSeconds
      : activity.averageSpeedMps;

  const vi =
    activity.sport === "cycling" &&
    activity.normalizedPower &&
    activity.averagePowerWatts &&
    activity.averagePowerWatts > 0
      ? activity.normalizedPower / activity.averagePowerWatts
      : null;

  const powerHr =
    activity.averagePowerWatts && activity.averageHr && activity.averageHr > 0
      ? activity.averagePowerWatts / activity.averageHr
      : null;

  const efficiencyFactor =
    activity.normalizedPower && activity.averageHr && activity.averageHr > 0
      ? activity.normalizedPower / activity.averageHr
      : null;

  const workKJ =
    activity.sport === "cycling" && activity.averagePowerWatts
      ? (activity.averagePowerWatts * activity.durationSeconds) / 1000
      : null;

  // Metabolic calories ≈ mechanical work / efficiency (~24%)
  const calories = workKJ ? Math.round(workKJ / 4.184 / 0.24) : null;

  // Ride classification: best category across all peak durations (like Sauce)
  const weightKg = athleteProfile?.weightKg ?? 75;
  const ridePeaks = activity.sport === "cycling" ? [
    { label: "5s", watts: activity.peak5s },
    { label: "1m", watts: activity.peak1m },
    { label: "5m", watts: activity.peak5m },
    { label: "20m", watts: activity.peak20m },
    { label: "60m", watts: activity.peak60m },
  ].filter((d): d is { label: string; watts: number } => d.watts != null && d.watts > 0) : null;
  const rideCategory = activity.sport === "cycling" && ridePeaks && ridePeaks.length > 0
    ? ridePeaks.reduce<ReturnType<typeof classifyPowerRacing> | null>((best, peak) => {
        const cat = classifyPowerRacing(peak.watts, weightKg, peak.label);
        return !best || cat.level > best.level || (cat.level === best.level && cat.percentile > best.percentile) ? cat : best;
      }, null)
    : null;

  // Zone details
  const zoneDetails =
    activity.zoneDistribution
      ? getZoneDetails(
          activity.zoneDistribution,
          activity.sport,
          activity.durationSeconds,
          ftp,
          thresholdPace,
          css
        )
      : null;

  // Summary line
  const summaryParts: string[] = [];
  if (activity.distanceMeters)
    summaryParts.push(formatDistance(activity.distanceMeters));
  summaryParts.push(formatDuration(activity.durationSeconds));
  if (activity.elevationGainMeters)
    summaryParts.push(`${Math.round(activity.elevationGainMeters)}m climbing`);
  if (avgSpeed && activity.sport === "cycling")
    summaryParts.push(formatSpeed(avgSpeed));
  if (avgSpeed && activity.sport === "running")
    summaryParts.push(formatPace(1000 / avgSpeed));

  return (
    <>
      <DashboardHeader title="Activity Detail" />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Back button */}
        <Link href="/activities">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>

        {/* Title & summary */}
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold sm:text-2xl">
                  {activity.name ?? "Untitled Activity"}
                </h1>
                <Badge variant="outline" className="capitalize">
                  {activity.sport}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatDate(activity.startedAt)}
                {activity.platform === "strava" && activity.externalId ? (
                  <a
                    href={`https://www.strava.com/activities/${activity.externalId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[#FC4C02] hover:underline"
                  >
                    View on Strava
                  </a>
                ) : activity.platform ? (
                  <span className="ml-2 capitalize">via {activity.platform}</span>
                ) : null}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {summaryParts.join(" \u00B7 ")}
          </p>
        </div>

        {/* Map + Charts + Stats grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left column: streams-dependent (deferred) */}
          <Suspense fallback={<StreamsSkeleton />}>
            <StreamsSection
              activityId={id}
              sport={activity.sport}
              ftp={ftp}
              wbalFtp={wbalFtp}
              peak5s={activity.peak5s}
              peak5m={activity.peak5m}
              recentPeaks={recentPeaks}
              color={color}
            />
          </Suspense>

          {/* Right: Stats sidebar (renders immediately) */}
          <Card className="p-4 sm:p-5 lg:sticky lg:top-6 lg:self-start">
            <CardContent className="space-y-5 p-0">
              {/* Power section */}
              {activity.sport === "cycling" &&
                (activity.normalizedPower || activity.averagePowerWatts) && (
                  <StatSection icon={Zap} title="Power">
                    {activity.normalizedPower && (
                      <Stat
                        label="Normalized Power"
                        value={Math.round(activity.normalizedPower)}
                        unit="W"
                      />
                    )}
                    {activity.averagePowerWatts && (
                      <Stat
                        label="Average"
                        value={activity.averagePowerWatts}
                        unit="W"
                      />
                    )}
                    {activity.maxPowerWatts && (
                      <Stat
                        label="Max"
                        value={activity.maxPowerWatts}
                        unit="W"
                      />
                    )}
                    {vi && <Stat label="Variability Index" value={vi.toFixed(2)} />}
                    {workKJ && (
                      <Stat
                        label="Work"
                        value={Math.round(workKJ).toLocaleString()}
                        unit="kJ"
                      />
                    )}
                    {calories && (
                      <Stat
                        label="Calories"
                        value={`~${calories.toLocaleString()}`}
                        unit="kcal"
                      />
                    )}
                  </StatSection>
                )}

              {/* Running pace section */}
              {activity.sport === "running" && (
                <StatSection icon={Timer} title="Pace">
                  {activity.normalizedGradedPace && (
                    <Stat
                      label="NGP"
                      value={formatPace(activity.normalizedGradedPace)}
                    />
                  )}
                  {avgSpeed && (
                    <Stat label="Avg Pace" value={formatPace(1000 / avgSpeed)} />
                  )}
                  {thresholdPace && (
                    <Stat
                      label="Threshold"
                      value={formatPace(thresholdPace)}
                    />
                  )}
                </StatSection>
              )}

              {/* Swimming section */}
              {activity.sport === "swimming" && (
                <StatSection icon={Waves} title="Swim">
                  {activity.averageSwolf != null && (
                    <Stat
                      label="SWOLF"
                      value={Math.round(activity.averageSwolf)}
                    />
                  )}
                  {activity.poolLengthMeters != null && (
                    <Stat
                      label="Pool"
                      value={activity.poolLengthMeters}
                      unit="m"
                    />
                  )}
                  {activity.totalStrokes != null && (
                    <Stat
                      label="Total Strokes"
                      value={activity.totalStrokes.toLocaleString()}
                    />
                  )}
                </StatSection>
              )}

              {/* Heart rate */}
              {activity.averageHr && (
                <StatSection icon={Heart} title="Heart Rate">
                  <Stat
                    label="Average"
                    value={activity.averageHr}
                    unit="bpm"
                  />
                  {activity.maxHr && (
                    <Stat label="Max" value={activity.maxHr} unit="bpm" />
                  )}
                  {powerHr && (
                    <Stat
                      label="Power/HR"
                      value={powerHr.toFixed(2)}
                    />
                  )}
                  {efficiencyFactor && (
                    <Stat
                      label="Efficiency Factor"
                      value={efficiencyFactor.toFixed(2)}
                    />
                  )}
                </StatSection>
              )}

              {/* Performance */}
              {(activity.tss || activity.trimp || activity.averageCadence) && (
                <StatSection icon={Activity} title="Performance">
                  {activity.tss != null && (
                    <Stat
                      label={
                        activity.sport === "cycling"
                          ? "TSS"
                          : activity.sport === "running"
                            ? "rTSS"
                            : "sTSS"
                      }
                      value={Math.round(activity.tss)}
                    />
                  )}
                  {activity.intensityFactor != null && (
                    <Stat
                      label="IF"
                      value={activity.intensityFactor.toFixed(2)}
                    />
                  )}
                  {activity.trimp != null && (
                    <Stat label="TRIMP" value={Math.round(activity.trimp)} />
                  )}
                  {activity.averageCadence != null && (
                    <Stat
                      label="Cadence"
                      value={Math.round(activity.averageCadence)}
                      unit={activity.sport === "running" ? "spm" : "rpm"}
                    />
                  )}
                </StatSection>
              )}

              {/* Ride Classification + Peak Powers */}
              {rideCategory && (
                <StatSection icon={Zap} title="Ride Ranking">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">Classification</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {rideCategory.wPerKg}<span className="text-xs font-normal text-muted-foreground ml-0.5">W/kg</span>
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        rideCategory.level >= 5 ? "bg-purple-500/15 text-purple-400" :
                        rideCategory.level >= 3 ? "bg-blue-500/15 text-blue-400" :
                        rideCategory.level >= 1 ? "bg-green-500/15 text-green-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {rideCategory.label}
                      </span>
                    </div>
                  </div>
                  {ridePeaks && ridePeaks.length > 0 && ridePeaks.map((p) => (
                    <div key={p.label} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-muted-foreground">{p.label} peak</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {p.watts}<span className="text-xs font-normal text-muted-foreground ml-0.5">W</span>
                        <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                          {(p.watts / weightKg).toFixed(1)} W/kg
                        </span>
                      </span>
                    </div>
                  ))}
                </StatSection>
              )}

              {/* Fitness context */}
              {fitnessContext && (
                <StatSection icon={TrendingUp} title="Fitness Context">
                  {fitnessContext.ctl != null && (
                    <Stat
                      label="Fitness (CTL)"
                      value={Math.round(fitnessContext.ctl)}
                    />
                  )}
                  {fitnessContext.atl != null && (
                    <Stat
                      label="Fatigue (ATL)"
                      value={Math.round(fitnessContext.atl)}
                    />
                  )}
                  {fitnessContext.tsb != null && (
                    <div className="flex items-baseline justify-between py-1.5">
                      <span className="text-xs text-muted-foreground">
                        Form (TSB)
                      </span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${tsbColor(fitnessContext.tsb)}`}
                      >
                        {Math.round(fitnessContext.tsb)}
                      </span>
                    </div>
                  )}
                  {fitnessContext.rampRate != null && (
                    <Stat
                      label="Ramp Rate"
                      value={fitnessContext.rampRate.toFixed(1)}
                      unit="CTL/wk"
                    />
                  )}
                </StatSection>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Zone distribution */}
        {zoneDetails && zoneDetails.some((z) => z.pct > 0) && (
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Zone Distribution
              </h3>
              <ZoneBar distribution={zoneDetails.map((z) => z.pct)} />
              <div className="mt-4 space-y-0">
                {zoneDetails.map((z, i) =>
                  z.pct > 0 ? (
                    <div
                      key={i}
                      className="grid grid-cols-[2.5rem_1fr_4rem_5rem] items-center gap-2 border-b border-border/40 py-2 text-xs last:border-0"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{
                            backgroundColor: zoneColors[i] ?? "#6b7280",
                          }}
                        />
                        <span className="font-medium">{z.zone}</span>
                      </div>
                      <span className="text-muted-foreground truncate">
                        {z.name}
                        {z.range && (
                          <span className="ml-1.5 text-[10px] opacity-70">
                            {z.range}
                          </span>
                        )}
                      </span>
                      <span className="text-right font-semibold tabular-nums">
                        {z.pct.toFixed(1)}%
                      </span>
                      <span className="text-right text-muted-foreground tabular-nums">
                        {formatDuration(z.timeSeconds)}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {activity.gearId && (
            <Badge variant="outline">Gear: {activity.gearId}</Badge>
          )}
          {activity.movingTimeSeconds &&
            activity.movingTimeSeconds !== activity.durationSeconds && (
              <Badge variant="outline">
                Moving: {formatDuration(activity.movingTimeSeconds)}
              </Badge>
            )}
        </div>
      </div>
    </>
  );
}

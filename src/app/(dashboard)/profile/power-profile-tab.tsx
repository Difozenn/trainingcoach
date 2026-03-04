"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildPowerProfile,
  DURATION_KEYS,
  CATEGORY_LABELS,
} from "@/lib/engine/cycling/power-profile";

// ── Types ──────────────────────────────────────────────────────────

type PeakPowersData = {
  peaks: Record<string, number | null>;
  dates: Record<string, Date | null>;
} | null;

// ── Constants ──────────────────────────────────────────────────────

const DURATION_LABELS: Record<string, string> = {
  "5s": "5 sec",
  "15s": "15 sec",
  "30s": "30 sec",
  "1m": "1 min",
  "5m": "5 min",
  "10m": "10 min",
  "20m": "20 min",
  "60m": "60 min",
};

const CATEGORY_COLORS = [
  "text-muted-foreground",  // Beginner
  "text-slate-500",         // Recreational
  "text-blue-500",          // Fitness
  "text-green-500",         // Sportive
  "text-emerald-500",       // Competitive
  "text-orange-500",        // Elite
  "text-red-500",           // Semi-Pro
  "text-purple-500",        // World Tour
];

const CATEGORY_BG_COLORS = [
  "bg-muted",               // Beginner
  "bg-slate-500/10",        // Recreational
  "bg-blue-500/10",         // Fitness
  "bg-green-500/10",        // Sportive
  "bg-emerald-500/10",      // Competitive
  "bg-orange-500/10",       // Elite
  "bg-red-500/10",          // Semi-Pro
  "bg-purple-500/10",       // World Tour
];

const CURVE_RANGES = [
  { label: "6 weeks", days: 42 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
  { label: "All time", days: 9999 },
];

// ── Helpers ────────────────────────────────────────────────────────

function formatDate(date: Date | string | null): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractPeaks(data: PeakPowersData): Record<string, number> {
  if (!data) return {};
  const result: Record<string, number> = {};
  for (const key of DURATION_KEYS) {
    const watts = data.peaks[key];
    if (watts != null && watts > 0) {
      result[key] = watts;
    }
  }
  return result;
}

// ── Main Component ─────────────────────────────────────────────────

export function PowerProfileTab({
  profilePeaks,
  allTimePeaks,
  curvePeaks,
  curveDays,
  weightKg,
}: {
  profilePeaks: PeakPowersData; // always last 6 weeks
  allTimePeaks: PeakPowersData;
  curvePeaks: PeakPowersData; // user-selected range for power curve
  curveDays: number;
  weightKg: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!weightKg) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No power data available</p>
            <p className="text-sm mt-1">
              Set your weight in Settings to see your power profile.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profilePeaksMap = extractPeaks(profilePeaks);
  const allTimePeaksMap = extractPeaks(allTimePeaks);
  const curvePeaksMap = extractPeaks(curvePeaks);

  const hasProfileData = Object.keys(profilePeaksMap).length > 0;
  const hasAnyData = Object.keys(allTimePeaksMap).length > 0;

  if (!hasAnyData) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center text-muted-foreground">
          No peak power data found. Complete cycling activities with a power
          meter.
        </CardContent>
      </Card>
    );
  }

  // Rider profile — always based on last 6 weeks
  const riderProfile = hasProfileData
    ? buildPowerProfile(profilePeaksMap, weightKg)
    : null;

  // Power curve — based on user-selected range + all-time for comparison
  const isAllTime = curveDays >= 9999;
  const curveCurrentMap = isAllTime ? allTimePeaksMap : curvePeaksMap;
  const curveProfile = buildPowerProfile(
    Object.keys(curveCurrentMap).length > 0 ? curveCurrentMap : allTimePeaksMap,
    weightKg
  );
  const allTimeProfile = buildPowerProfile(allTimePeaksMap, weightKg);

  const curveLabel =
    CURVE_RANGES.find((r) => r.days === curveDays)?.label ?? `${curveDays}d`;

  // Radar data for power curve
  const radarData = DURATION_KEYS.map((key) => {
    const currentEntry = curveProfile.peaks[key];
    const allTimeEntry = allTimeProfile.peaks[key];
    return {
      duration: DURATION_LABELS[key],
      level: currentEntry
        ? currentEntry.category.level + currentEntry.category.percentile / 100
        : 0,
      allTime: allTimeEntry
        ? allTimeEntry.category.level +
          allTimeEntry.category.percentile / 100
        : 0,
    };
  });

  function onCurveRangeChange(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pp", String(days));
    params.set("tab", "power");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: RIDER PROFILE — always last 6 weeks, no filter
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Rider Profile</h2>
          <p className="text-sm text-muted-foreground">
            Based on your best efforts from the last 6 weeks
          </p>
        </div>

        {riderProfile ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rider Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {riderProfile.riderType}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on relative strengths across power durations
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Overall Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-3">
                    <p
                      className={`text-3xl font-bold ${CATEGORY_COLORS[Math.floor(riderProfile.overallLevel)]}`}
                    >
                      {riderProfile.overallLabel}
                    </p>
                    <span className="text-muted-foreground text-sm">
                      {riderProfile.overallLevel.toFixed(1)} / 8
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Average across all durations ({weightKg} kg)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Category breakdown at each duration */}
            <div className="grid gap-3 md:grid-cols-4">
              {DURATION_KEYS.map((key) => {
                const entry = riderProfile.peaks[key];
                if (!entry) return null;
                const catLevel = entry.category.level;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {DURATION_LABELS[key]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.watts}W
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${CATEGORY_BG_COLORS[catLevel]} ${CATEGORY_COLORS[catLevel]} border-0 text-[11px]`}
                    >
                      {entry.category.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No cycling activities with power data in the last 6 weeks.
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: POWER CURVE — filterable radar + detail cards
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Power Curve</h2>
            <p className="text-sm text-muted-foreground">
              Compare peak powers across time ranges
            </p>
          </div>
          <div className="flex gap-1">
            {CURVE_RANGES.map((r) => (
              <Button
                key={r.days}
                variant={curveDays === r.days ? "default" : "ghost"}
                size="sm"
                onClick={() => onCurveRangeChange(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Radar chart with optional all-time ghost */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Peak Power Comparison</CardTitle>
              {!isAllTime && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-4 rounded-full bg-[oklch(0.65_0.22_259)]" />
                    {curveLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-4 rounded-full bg-muted-foreground/40" />
                    All time
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                data={radarData}
                cx="50%"
                cy="50%"
                outerRadius="75%"
              >
                <PolarGrid className="stroke-muted" gridType="polygon" />
                <PolarAngleAxis
                  dataKey="duration"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 8]}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickCount={5}
                />
                {/* All-time ghost (behind) */}
                {!isAllTime && (
                  <Radar
                    name="All time"
                    dataKey="allTime"
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity={0.35}
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.06}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                )}
                {/* Current range */}
                <Radar
                  name={curveLabel}
                  dataKey="level"
                  stroke="oklch(0.65 0.22 259)"
                  fill="oklch(0.65 0.22 259)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const { duration, level, allTime } = payload[0].payload;
                    const catIdx = Math.min(7, Math.floor(level));
                    const allIdx = Math.min(7, Math.floor(allTime));
                    return (
                      <div className="rounded-md border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-sm text-xs space-y-0.5">
                        <p className="font-medium">{duration}</p>
                        <p>
                          <span className="text-muted-foreground">
                            {curveLabel}:{" "}
                          </span>
                          {CATEGORY_LABELS[catIdx]} ({level.toFixed(1)})
                        </p>
                        {!isAllTime && (
                          <p>
                            <span className="text-muted-foreground">
                              All time:{" "}
                            </span>
                            {CATEGORY_LABELS[allIdx]} ({allTime.toFixed(1)})
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Duration detail cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {DURATION_KEYS.map((key) => {
            const curveEntry = curveProfile.peaks[key];
            const allTimeEntry = allTimeProfile.peaks[key];
            const curveDate = curvePeaks?.dates[key] ?? allTimePeaks?.dates[key];
            const allTimeRawWatts = allTimePeaks?.peaks[key];

            if (!curveEntry && !allTimeEntry) {
              return (
                <Card key={key} className="opacity-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {DURATION_LABELS[key]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">No data</p>
                  </CardContent>
                </Card>
              );
            }

            const entry = curveEntry ?? allTimeEntry!;
            const catLevel = entry.category.level;
            const showAllTimePR =
              !isAllTime &&
              allTimeRawWatts != null &&
              allTimeRawWatts > entry.watts;

            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {DURATION_LABELS[key]}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={`${CATEGORY_BG_COLORS[catLevel]} ${CATEGORY_COLORS[catLevel]} border-0`}
                    >
                      {entry.category.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{entry.watts}W</span>
                    <span className="text-sm text-muted-foreground">
                      {entry.wPerKg.toFixed(2)} W/kg
                    </span>
                  </div>

                  {/* Category progress bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          catLevel >= 6
                            ? "bg-red-500"
                            : catLevel >= 4
                              ? "bg-orange-500"
                              : catLevel >= 2
                                ? "bg-blue-500"
                                : "bg-muted-foreground"
                        }`}
                        style={{ width: `${entry.category.percentile}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{CATEGORY_LABELS[catLevel]}</span>
                      <span>{entry.category.percentile}%</span>
                    </div>
                  </div>

                  {showAllTimePR && (
                    <p className="text-[11px] text-muted-foreground">
                      All-time PR: {allTimeRawWatts}W
                    </p>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(curveDate ?? null)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

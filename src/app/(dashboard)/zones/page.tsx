import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSportProfiles,
  getFitnessTimeline,
  getMonthlyPeakPowers,
  getPowerHrTimeseries,
  getMonthlyDistance,
} from "@/lib/data/queries";
import { getCyclingPowerZones } from "@/lib/engine/cycling/zones";
import { getRunningPaceZones } from "@/lib/engine/running/zones";
import { getSwimmingZones } from "@/lib/engine/swimming/zones";
import { formatPace, formatPacePer100m } from "@/lib/data/helpers";
import Link from "next/link";
import dynamic from "next/dynamic";

const PowerCurveChart = dynamic(
  () => import("@/components/dashboard/zone-trends").then((m) => m.PowerCurveChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const PowerHrChart = dynamic(
  () => import("@/components/dashboard/zone-trends").then((m) => m.PowerHrChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const FitnessTrendChart = dynamic(
  () => import("@/components/dashboard/zone-trends").then((m) => m.FitnessTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const DistanceChart = dynamic(
  () => import("@/components/dashboard/zone-trends").then((m) => m.DistanceChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return <div className="h-[260px] animate-pulse rounded-lg bg-muted/50" />;
}

const zoneColors = [
  "#6b7280", // Z1
  "#3b82f6", // Z2
  "#22c55e", // Z3
  "#eab308", // Z4
  "#f97316", // Z5
  "#ef4444", // Z6
  "#dc2626", // Z7
];

export default async function ZonesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [profiles, fitnessData, peakPowers, powerHrData, distanceData] =
    await Promise.all([
      getSportProfiles(userId),
      getFitnessTimeline(userId, 365),
      getMonthlyPeakPowers(userId),
      getPowerHrTimeseries(userId),
      getMonthlyDistance(userId),
    ]);

  const cycling = profiles.find((p) => p.sport === "cycling");
  const running = profiles.find((p) => p.sport === "running");
  const swimming = profiles.find((p) => p.sport === "swimming");

  const cyclingZones = cycling?.ftp ? getCyclingPowerZones(cycling.ftp) : null;
  const runningZones = running?.thresholdPaceSPerKm
    ? getRunningPaceZones(running.thresholdPaceSPerKm)
    : null;
  const swimmingZones = swimming?.cssSPer100m
    ? getSwimmingZones(swimming.cssSPer100m)
    : null;

  return (
    <>
      <DashboardHeader title="Zone Analysis" />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Zone Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cycling Zones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                Cycling Zones
                {cycling?.ftp && (
                  <Badge variant="secondary" className="text-xs">FTP: {cycling.ftp}W</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cyclingZones ? (
                <div className="space-y-1">
                  {cyclingZones.map((z, i) => (
                    <div
                      key={z.zone}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: zoneColors[i] }}
                      />
                      <span className="font-medium w-6">Z{z.zone}</span>
                      <span className="flex-1 text-muted-foreground text-xs">{z.name}</span>
                      <span className="font-mono text-xs tabular-nums">
                        {z.minWatts}{z.maxWatts ? `–${z.maxWatts}` : "+"}W
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sync cycling activities to auto-detect FTP, or set it in{" "}
                  <Link href="/settings" className="underline">Settings</Link>.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Running Zones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                Running Zones
                {running?.thresholdPaceSPerKm && (
                  <Badge variant="secondary" className="text-xs">
                    Threshold: {formatPace(running.thresholdPaceSPerKm)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {runningZones ? (
                <div className="space-y-1">
                  {runningZones.map((z, i) => (
                    <div
                      key={z.zone}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: zoneColors[i] }}
                      />
                      <span className="font-medium w-6">Z{z.zone}</span>
                      <span className="flex-1 text-muted-foreground text-xs">{z.name}</span>
                      <span className="font-mono text-xs tabular-nums">{z.paceRangeFormatted}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sync running activities to auto-detect threshold pace.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Swimming Zones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                Swimming Zones
                {swimming?.cssSPer100m && (
                  <Badge variant="secondary" className="text-xs">
                    CSS: {formatPacePer100m(swimming.cssSPer100m)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {swimmingZones ? (
                <div className="space-y-1">
                  {swimmingZones.map((z, i) => (
                    <div
                      key={z.zone}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: zoneColors[i] }}
                      />
                      <span className="font-medium w-6">Z{z.zone}</span>
                      <span className="flex-1 text-muted-foreground text-xs">{z.name}</span>
                      <span className="font-mono text-xs tabular-nums">{z.paceRangeFormatted}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sync swimming activities to estimate Critical Swim Speed.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trend Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Peak Power by Month
              </h3>
              <PowerCurveChart data={peakPowers} />
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Power / HR Efficiency
              </h3>
              <PowerHrChart data={powerHrData} />
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fitness (CTL / ATL / TSB)
              </h3>
              <FitnessTrendChart data={fitnessData} />
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly Distance
              </h3>
              <DistanceChart data={distanceData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSportProfiles,
  getAthleteProfile,
  getFitnessTimeline,
  getYearlyPeakPowers,
  getPowerHrScatter,
  getActivitiesForYearlyDistance,
} from "@/lib/data/queries";
import { getCyclingPowerZones } from "@/lib/engine/cycling/zones";
import { getRunningPaceZones } from "@/lib/engine/running/zones";
import { getSwimmingZones } from "@/lib/engine/swimming/zones";
import { formatPace, formatPacePer100m } from "@/lib/data/helpers";
import Link from "next/link";
import {
  LazyFitnessByYearChart as FitnessByYearChart,
  LazyDistanceByYearChart as DistanceByYearChart,
  LazyPowerHrByYearChart as PowerHrByYearChart,
  LazyPowerCurveByYearChart as PowerCurveByYearChart,
} from "@/components/dashboard/lazy-charts";

const zoneColors = [
  "#6b7280", "#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444", "#dc2626",
];

export default async function ZonesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [profiles, athleteProfile, fitnessData, yearlyPeaks, powerHrData, distanceData] =
    await Promise.all([
      getSportProfiles(userId),
      getAthleteProfile(userId),
      getFitnessTimeline(userId, 365 * 5),
      getYearlyPeakPowers(userId),
      getPowerHrScatter(userId),
      getActivitiesForYearlyDistance(userId),
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

  const maxHr = athleteProfile?.maxHr ?? null;

  return (
    <>
      <DashboardHeader title="Zone Analysis" />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Zone Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
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
                    <div key={z.zone} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: zoneColors[i] }} />
                      <span className="font-medium w-6">Z{z.zone}</span>
                      <span className="flex-1 text-muted-foreground text-xs">{z.name}</span>
                      <span className="font-mono text-xs tabular-nums">{z.minWatts}{z.maxWatts ? `–${z.maxWatts}` : "+"}W</span>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                Running Zones
                {running?.thresholdPaceSPerKm && (
                  <Badge variant="secondary" className="text-xs">Threshold: {formatPace(running.thresholdPaceSPerKm)}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {runningZones ? (
                <div className="space-y-1">
                  {runningZones.map((z, i) => (
                    <div key={z.zone} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: zoneColors[i] }} />
                      <span className="font-medium w-6">Z{z.zone}</span>
                      <span className="flex-1 text-muted-foreground text-xs">{z.name}</span>
                      <span className="font-mono text-xs tabular-nums">{z.paceRangeFormatted}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sync running activities to auto-detect threshold pace.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                Swimming Zones
                {swimming?.cssSPer100m && (
                  <Badge variant="secondary" className="text-xs">CSS: {formatPacePer100m(swimming.cssSPer100m)}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {swimmingZones ? (
                <div className="space-y-1">
                  {swimmingZones.map((z, i) => (
                    <div key={z.zone} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: zoneColors[i] }} />
                      <span className="font-medium w-6">Z{z.zone}</span>
                      <span className="flex-1 text-muted-foreground text-xs">{z.name}</span>
                      <span className="font-mono text-xs tabular-nums">{z.paceRangeFormatted}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sync swimming activities to estimate Critical Swim Speed.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Year-over-Year Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fitness (CTL) by Year
              </h3>
              <FitnessByYearChart data={fitnessData} />
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cumulative Distance by Year
              </h3>
              <DistanceByYearChart data={distanceData} />
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Power vs Heart Rate
              </h3>
              <PowerHrByYearChart data={powerHrData} maxHr={maxHr} />
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardContent className="p-0">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Peak Power by Year
              </h3>
              <PowerCurveByYearChart data={yearlyPeaks} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

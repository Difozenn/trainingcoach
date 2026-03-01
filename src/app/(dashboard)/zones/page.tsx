import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSportProfiles } from "@/lib/data/queries";
import { getCyclingPowerZones } from "@/lib/engine/cycling/zones";
import { getRunningPaceZones } from "@/lib/engine/running/zones";
import { getSwimmingZones } from "@/lib/engine/swimming/zones";
import { formatPace, formatPacePer100m } from "@/lib/data/helpers";
import Link from "next/link";

export default async function ZonesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profiles = await getSportProfiles(session.user.id);
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
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cycling Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Cycling Zones
                {cycling?.ftp && (
                  <Badge variant="secondary">FTP: {cycling.ftp}W</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cyclingZones ? (
                <div className="space-y-2">
                  {cyclingZones.map((z) => (
                    <div
                      key={z.zone}
                      className="flex items-center justify-between rounded border p-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">Z{z.zone}</span>{" "}
                        <span className="text-muted-foreground">{z.name}</span>
                      </div>
                      <span className="font-mono text-xs">
                        {z.minWatts}
                        {z.maxWatts ? `-${z.maxWatts}` : "+"}W
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sync cycling activities to auto-detect your FTP, or set it in{" "}
                  <Link href="/settings" className="underline">
                    Settings
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>

          {/* Running Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Running Zones
                {running?.thresholdPaceSPerKm && (
                  <Badge variant="secondary">
                    Threshold: {formatPace(running.thresholdPaceSPerKm)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {runningZones ? (
                <div className="space-y-2">
                  {runningZones.map((z) => (
                    <div
                      key={z.zone}
                      className="flex items-center justify-between rounded border p-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">Z{z.zone}</span>{" "}
                        <span className="text-muted-foreground">{z.name}</span>
                      </div>
                      <span className="font-mono text-xs">
                        {z.paceRangeFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sync running activities to auto-detect your threshold pace.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Swimming Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Swimming Zones
                {swimming?.cssSPer100m && (
                  <Badge variant="secondary">
                    CSS: {formatPacePer100m(swimming.cssSPer100m)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {swimmingZones ? (
                <div className="space-y-2">
                  {swimmingZones.map((z) => (
                    <div
                      key={z.zone}
                      className="flex items-center justify-between rounded border p-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">Z{z.zone}</span>{" "}
                        <span className="text-muted-foreground">{z.name}</span>
                      </div>
                      <span className="font-mono text-xs">
                        {z.paceRangeFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sync swimming activities to estimate your Critical Swim Speed.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

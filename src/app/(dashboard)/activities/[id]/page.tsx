import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bike, Footprints, Waves, Activity } from "lucide-react";
import { getActivityById } from "@/lib/data/queries";
import { formatDuration, formatDistance, formatDate, formatPace } from "@/lib/data/helpers";
import { ZoneChart } from "@/components/dashboard/zone-chart";
import Link from "next/link";

const sportIcons = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const activity = await getActivityById(session.user.id, id);
  if (!activity) notFound();

  const Icon = sportIcons[activity.sport as keyof typeof sportIcons] ?? Activity;

  return (
    <>
      <DashboardHeader title="Activity Detail" />
      <div className="flex-1 space-y-6 p-6">
        <Link href="/activities">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to activities
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold">
              {activity.name ?? "Untitled"}
            </h2>
            <p className="text-muted-foreground">
              {formatDate(activity.startedAt)} &middot;{" "}
              <span className="capitalize">{activity.sport}</span>
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDuration(activity.durationSeconds)}
              </p>
              {activity.movingTimeSeconds &&
                activity.movingTimeSeconds !== activity.durationSeconds && (
                  <p className="text-xs text-muted-foreground">
                    Moving: {formatDuration(activity.movingTimeSeconds)}
                  </p>
                )}
            </CardContent>
          </Card>

          {activity.distanceMeters != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Distance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatDistance(activity.distanceMeters)}
                </p>
                {activity.elevationGainMeters != null && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(activity.elevationGainMeters)}m elevation
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activity.tss != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {activity.sport === "cycling"
                    ? "TSS"
                    : activity.sport === "running"
                      ? "rTSS"
                      : "sTSS"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(activity.tss)}
                </p>
                {activity.intensityFactor != null && (
                  <p className="text-xs text-muted-foreground">
                    IF: {activity.intensityFactor.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activity.sport === "cycling" && activity.normalizedPower != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Normalized Power
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(activity.normalizedPower)}W
                </p>
                {activity.averagePowerWatts != null && (
                  <p className="text-xs text-muted-foreground">
                    Avg: {activity.averagePowerWatts}W
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activity.sport === "running" &&
            activity.normalizedGradedPace != null && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">NGP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatPace(activity.normalizedGradedPace)}
                  </p>
                  {activity.averageSpeedMps != null && (
                    <p className="text-xs text-muted-foreground">
                      Avg pace:{" "}
                      {formatPace(1000 / activity.averageSpeedMps)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
        </div>

        {/* More metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activity.averageHr != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{activity.averageHr} bpm</p>
                {activity.maxHr != null && (
                  <p className="text-xs text-muted-foreground">
                    Max: {activity.maxHr} bpm
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activity.averageCadence != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cadence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(activity.averageCadence)}{" "}
                  {activity.sport === "running" ? "spm" : "rpm"}
                </p>
              </CardContent>
            </Card>
          )}

          {activity.averageSwolf != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">SWOLF</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(activity.averageSwolf)}
                </p>
                {activity.poolLengthMeters != null && (
                  <p className="text-xs text-muted-foreground">
                    {activity.poolLengthMeters}m pool
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activity.trimp != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TRIMP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(activity.trimp)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Zone distribution */}
        {activity.zoneDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>Zone Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ZoneChart
                distribution={activity.zoneDistribution}
                sport={activity.sport}
              />
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {activity.sport}
          </Badge>
          {activity.platform && (
            <Badge variant="outline" className="capitalize">
              via {activity.platform}
            </Badge>
          )}
          {activity.gearId && (
            <Badge variant="outline">Gear: {activity.gearId}</Badge>
          )}
        </div>
      </div>
    </>
  );
}

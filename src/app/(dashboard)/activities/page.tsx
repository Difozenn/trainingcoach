import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bike, Footprints, Waves, Activity } from "lucide-react";
import { getActivitiesBySport, getActivityCount } from "@/lib/data/queries";
import { formatDuration, formatDistance, formatDate } from "@/lib/data/helpers";
import Link from "next/link";

const sportIcons = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
};

const sportFilters = [
  { label: "All", value: undefined },
  { label: "Cycling", value: "cycling" as const },
  { label: "Running", value: "running" as const },
  { label: "Swimming", value: "swimming" as const },
];

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const sport = params.sport as "cycling" | "running" | "swimming" | undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;

  const [activityList, totalCount] = await Promise.all([
    getActivitiesBySport(session.user.id, sport, perPage, (page - 1) * perPage),
    getActivityCount(session.user.id),
  ]);

  return (
    <>
      <DashboardHeader title="Activities" />
      <div className="flex-1 space-y-6 p-6">
        {/* Filters */}
        <div className="flex gap-2">
          {sportFilters.map((f) => (
            <Link
              key={f.label}
              href={
                f.value
                  ? `/activities?sport=${f.value}`
                  : "/activities"
              }
            >
              <Button
                variant={sport === f.value || (!sport && !f.value) ? "default" : "outline"}
                size="sm"
              >
                {f.label}
              </Button>
            </Link>
          ))}
          <span className="ml-auto flex items-center text-sm text-muted-foreground">
            {totalCount} total activities
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            {activityList.length > 0 ? (
              <div className="space-y-2">
                {activityList.map((a) => {
                  const Icon =
                    sportIcons[a.sport as keyof typeof sportIcons] ?? Activity;
                  return (
                    <Link
                      key={a.id}
                      href={`/activities/${a.id}`}
                      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {a.name ?? "Untitled"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(a.startedAt)} &middot;{" "}
                          {formatDuration(a.durationSeconds)}
                          {a.distanceMeters
                            ? ` · ${formatDistance(a.distanceMeters)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {a.averagePowerWatts && (
                          <Badge variant="outline">
                            {a.averagePowerWatts}W avg
                          </Badge>
                        )}
                        {a.averageHr && (
                          <Badge variant="outline">{a.averageHr} bpm</Badge>
                        )}
                        {a.tss != null && (
                          <Badge variant="secondary">
                            {Math.round(a.tss)} TSS
                          </Badge>
                        )}
                        {a.intensityFactor != null && (
                          <Badge variant="secondary">
                            IF {a.intensityFactor.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activities found.{" "}
                <Link href="/settings" className="underline">
                  Connect Strava
                </Link>{" "}
                to sync your workouts.
              </p>
            )}

            {/* Pagination */}
            {totalCount > perPage && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/activities?${sport ? `sport=${sport}&` : ""}page=${page - 1}`}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(totalCount / perPage)}
                </span>
                {page * perPage < totalCount && (
                  <Link
                    href={`/activities?${sport ? `sport=${sport}&` : ""}page=${page + 1}`}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFitnessTimeline } from "@/lib/data/queries";
import { FitnessChart } from "@/components/dashboard/fitness-chart";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { formatDateShort } from "@/lib/data/helpers";
import { getUserPlan } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

export default async function FitnessPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getUserPlan(session.user.id);
  if (plan === "free") return <UpgradePrompt feature="Fitness Timeline" />;

  const params = await searchParams;
  const days = Number(params.days) || 90;
  const timeline = await getFitnessTimeline(session.user.id, days);

  const chartData = timeline.map((d) => ({
    date: formatDateShort(d.date),
    ctl: d.ctl,
    atl: d.atl,
    tsb: d.tsb,
    cyclingTss: d.cyclingTss ?? 0,
    runningTss: d.runningTss ?? 0,
    swimmingTss: d.swimmingTss ?? 0,
  }));

  return (
    <>
      <DashboardHeader title="Fitness Timeline" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Performance Management Chart</CardTitle>
            <Suspense>
              <RangeSelector />
            </Suspense>
          </CardHeader>
          <CardContent>
            <FitnessChart data={chartData} />
          </CardContent>
        </Card>

        {timeline.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Peak Fitness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(
                    Math.max(...timeline.map((d) => d.ctl ?? 0))
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Highest CTL in period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {timeline.at(-1)?.tsb != null
                    ? Math.round(timeline.at(-1)!.tsb!)
                    : "--"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Today&apos;s TSB
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {timeline.filter((d) => (d.totalTss ?? 0) > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Days with activity
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitnessChart } from "@/components/dashboard/fitness-chart";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { getFitnessTimeline } from "@/lib/data/queries";
import { formatDateShort } from "@/lib/data/helpers";

export default async function FitnessPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const days = Number(params.days) || 90;
  const timeline = await getFitnessTimeline(session.user.id, days);

  const chartData = timeline.map((d) => ({
    date: formatDateShort(d.date),
    ctl: d.ctl,
    atl: d.atl,
    tsb: d.tsb,
    formPct:
      d.ctl && d.ctl > 0 && d.tsb != null
        ? Math.max(-100, Math.min(100, Math.round((d.tsb / d.ctl) * 100)))
        : null,
    cyclingTss: d.cyclingTss ?? 0,
    runningTss: d.runningTss ?? 0,
    swimmingTss: d.swimmingTss ?? 0,
  }));

  // Stats
  const peakCtl =
    timeline.length > 0
      ? Math.round(Math.max(...timeline.map((d) => d.ctl ?? 0)))
      : null;

  const lastCtl = timeline.at(-1)?.ctl;
  const lastTsb = timeline.at(-1)?.tsb;
  const formPct =
    lastCtl && lastCtl > 0 && lastTsb != null
      ? Math.max(-100, Math.min(100, Math.round((lastTsb / lastCtl) * 100)))
      : null;

  const trainingDays = timeline.filter((d) => (d.totalTss ?? 0) > 0).length;

  const formLabel =
    formPct != null
      ? formPct < -30
        ? "High Risk"
        : formPct < -10
          ? "Optimal"
          : formPct < 5
            ? "Grey Zone"
            : formPct < 20
              ? "Fresh"
              : "Detraining"
      : null;

  const formColor =
    formPct != null
      ? formPct < -30
        ? "text-red-500"
        : formPct < -10
          ? "text-green-500"
          : formPct < 5
            ? "text-muted-foreground"
            : formPct < 20
              ? "text-blue-500"
              : "text-orange-500"
      : "";

  return (
    <>
      <DashboardHeader title="Fitness" />
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
                <p className="text-2xl font-bold">{peakCtl ?? "--"}</p>
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
                {formPct != null ? (
                  <>
                    <p className={`text-2xl font-bold ${formColor}`}>
                      {formPct > 0 ? "+" : ""}
                      {formPct}%
                    </p>
                    <p className={`text-xs font-medium ${formColor}`}>
                      {formLabel}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold">--</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{trainingDays}</p>
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

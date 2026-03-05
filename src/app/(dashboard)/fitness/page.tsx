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

  const lastCtl = timeline.at(-1)?.ctl;
  const lastTsb = timeline.at(-1)?.tsb;
  const formPct =
    lastCtl && lastCtl > 0 && lastTsb != null
      ? Math.max(-100, Math.min(100, Math.round((lastTsb / lastCtl) * 100)))
      : null;

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

  const lastAtl = timeline.at(-1)?.atl;

  return (
    <>
      <DashboardHeader title="Fitness" />
      <div className="flex-1 space-y-6 p-6">
        {/* Current-day stats */}
        {timeline.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Fitness
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#3b82f6]">
                {lastCtl != null ? Math.round(lastCtl) : "--"}
              </p>
              <p className="text-[10px] text-muted-foreground">CTL</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Fatigue
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#ec4899]">
                {lastAtl != null ? Math.round(lastAtl) : "--"}
              </p>
              <p className="text-[10px] text-muted-foreground">ATL</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Form
              </p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${formColor}`}>
                {formPct != null ? `${formPct > 0 ? "+" : ""}${formPct}%` : "--"}
              </p>
              <p className={`text-[10px] ${formColor || "text-muted-foreground"}`}>
                {formLabel ?? "TSB / CTL"}
              </p>
            </div>
          </div>
        )}

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
      </div>
    </>
  );
}

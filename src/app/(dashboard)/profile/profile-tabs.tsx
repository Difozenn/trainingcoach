"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { formatDateShort } from "@/lib/data/helpers";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const FitnessChart = dynamic(
  () => import("@/components/dashboard/fitness-chart").then((m) => m.FitnessChart),
  { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-lg bg-muted/50" /> }
);
const PowerProfileTab = dynamic(
  () => import("./power-profile-tab").then((m) => m.PowerProfileTab),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted/50" /> }
);

type TimelineRow = {
  date: Date;
  totalTss: number | null;
  cyclingTss: number | null;
  runningTss: number | null;
  swimmingTss: number | null;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  rampRate: number | null;
};

type PeakPowersData = {
  peaks: Record<string, number | null>;
  dates: Record<string, Date | null>;
} | null;

export function ProfileTabs({
  defaultTab,
  timeline,
  days,
  profilePeaks,
  allTimePeaks,
  curvePeaks,
  curveDays,
  weightKg,
}: {
  defaultTab: string;
  timeline: TimelineRow[];
  days: number;
  profilePeaks: PeakPowersData;
  allTimePeaks: PeakPowersData;
  curvePeaks: PeakPowersData;
  curveDays: number;
  weightKg: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  function onTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs defaultValue={defaultTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="fitness">Fitness</TabsTrigger>
        <TabsTrigger value="power">Power Profile</TabsTrigger>
      </TabsList>

      <TabsContent value="fitness" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Performance Management Chart</CardTitle>
            <RangeSelector />
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
                {(() => {
                  const lastCtl = timeline.at(-1)?.ctl;
                  const lastTsb = timeline.at(-1)?.tsb;
                  if (lastCtl == null || lastTsb == null || lastCtl === 0)
                    return <p className="text-2xl font-bold">--</p>;
                  const formPct = Math.max(-100, Math.min(100, Math.round((lastTsb / lastCtl) * 100)));
                  const label =
                    formPct < -30 ? "High Risk" :
                    formPct < -10 ? "Optimal" :
                    formPct < 5 ? "Grey Zone" :
                    formPct < 20 ? "Fresh" : "Detraining";
                  const color =
                    formPct < -30 ? "text-red-500" :
                    formPct < -10 ? "text-green-500" :
                    formPct < 5 ? "text-muted-foreground" :
                    formPct < 20 ? "text-blue-500" : "text-orange-500";
                  return (
                    <>
                      <p className={`text-2xl font-bold ${color}`}>
                        {formPct > 0 ? "+" : ""}{formPct}%
                      </p>
                      <p className={`text-xs font-medium ${color}`}>{label}</p>
                    </>
                  );
                })()}
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
      </TabsContent>

      <TabsContent value="power">
        <PowerProfileTab
          profilePeaks={profilePeaks}
          allTimePeaks={allTimePeaks}
          curvePeaks={curvePeaks}
          curveDays={curveDays}
          weightKg={weightKg}
        />
      </TabsContent>
    </Tabs>
  );
}

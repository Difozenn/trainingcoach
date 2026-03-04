"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitnessChart } from "@/components/dashboard/fitness-chart";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { PowerProfileTab } from "./power-profile-tab";
import { formatDateShort } from "@/lib/data/helpers";
import { useRouter, useSearchParams } from "next/navigation";

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

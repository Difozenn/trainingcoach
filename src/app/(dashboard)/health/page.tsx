import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHealthMetrics, getLatestMetrics } from "@/lib/data/queries";
import { formatDateShort } from "@/lib/data/helpers";
import { LazyHealthTrendChart as HealthTrendChart } from "@/components/dashboard/lazy-charts";
import { getUserPlan } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

function recoveryStatus(metrics: {
  hrv: number | null;
  restingHr: number | null;
  sleepScore: number | null;
  tsb: number | null;
}) {
  const issues: string[] = [];

  if (metrics.sleepScore != null && metrics.sleepScore < 60)
    issues.push("Poor sleep");
  if (metrics.tsb != null && metrics.tsb < -30) issues.push("Deep fatigue");
  if (metrics.tsb != null && metrics.tsb < -20) issues.push("High fatigue");

  if (issues.length >= 2)
    return {
      label: "Rest",
      color: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      message: issues.join(" + ") + " — take a recovery day.",
    };
  if (issues.length === 1)
    return {
      label: "Moderate",
      color: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      message: issues[0] + " — consider reducing intensity.",
    };
  return {
    label: "Good",
    color: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
    message: "Recovery looks good. Train as planned.",
  };
}

export default async function HealthPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userPlan = await getUserPlan(session.user.id);
  if (userPlan === "free") return <UpgradePrompt feature="Health Tracking" />;

  const [healthData, latest] = await Promise.all([
    getHealthMetrics(session.user.id, 30),
    getLatestMetrics(session.user.id),
  ]);

  const hrvData = healthData.map((d) => ({
    date: formatDateShort(d.date),
    value: d.hrv,
  }));
  const rhrData = healthData.map((d) => ({
    date: formatDateShort(d.date),
    value: d.restingHr,
  }));
  const sleepData = healthData.map((d) => ({
    date: formatDateShort(d.date),
    value: d.sleepScore,
  }));

  const status = latest
    ? recoveryStatus({
        hrv: latest.hrv,
        restingHr: latest.restingHr,
        sleepScore: latest.sleepScore,
        tsb: latest.tsb,
      })
    : null;

  return (
    <>
      <DashboardHeader title="Health" />
      <div className="flex-1 space-y-6 p-6">
        {/* Recovery status */}
        {status && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${status.color}`} />
              <CardTitle>
                Recovery Status:{" "}
                <span className={status.text}>{status.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {status.message}
              </p>
              <div className="mt-3 flex gap-3">
                {latest?.hrv != null && (
                  <Badge variant="outline">HRV: {Math.round(latest.hrv)} ms</Badge>
                )}
                {latest?.restingHr != null && (
                  <Badge variant="outline">RHR: {latest.restingHr} bpm</Badge>
                )}
                {latest?.sleepScore != null && (
                  <Badge variant="outline">Sleep: {latest.sleepScore}</Badge>
                )}
                {latest?.bodyBattery != null && (
                  <Badge variant="outline">
                    Battery: {latest.bodyBattery}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health trend charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>HRV Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthTrendChart
                data={hrvData}
                color="#8b5cf6"
                unit="ms"
                label="HRV (RMSSD)"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resting Heart Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthTrendChart
                data={rhrData}
                color="#ef4444"
                unit="bpm"
                label="Resting HR"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sleep Score</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthTrendChart
                data={sleepData}
                color="#3b82f6"
                unit=""
                label="Sleep Score"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

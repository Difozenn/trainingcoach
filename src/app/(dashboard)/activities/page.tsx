import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivitiesPage() {
  return (
    <>
      <DashboardHeader title="Activities" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect Strava to sync your cycling, running, and swimming
              activities. Each activity will show sport-specific metrics
              (NP/TSS, NGP/rTSS, CSS/sTSS).
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

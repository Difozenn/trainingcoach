import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlanPage() {
  return (
    <>
      <DashboardHeader title="Weekly Plan" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>This Week&apos;s Workout Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your weekly workout pool will appear here. Pick when to do each
              workout — the system provides the what, you control the when.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workout Export</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Export workouts as ZWO (Zwift), FIT (Garmin), MRC/ERG (smart
              trainers), or ICS (calendar).
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

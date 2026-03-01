import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HealthPage() {
  return (
    <>
      <DashboardHeader title="Health" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>HRV Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                7-day rolling RMSSD. Connect Garmin to track.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resting Heart Rate</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Resting HR trend. Elevated &gt;5bpm above baseline triggers
                recovery recommendation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sleep Score</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Sleep quality trend. Poor sleep + negative TSB = forced rest
                day.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recovery Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Traffic light indicator based on HRV trend, resting HR, sleep,
              and training load. Green = train hard, Amber = moderate, Red =
              rest.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

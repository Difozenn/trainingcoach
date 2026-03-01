import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FitnessPage() {
  return (
    <>
      <DashboardHeader title="Fitness Timeline" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Management Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Fitness (CTL), Fatigue (ATL), and Form (TSB) chart will appear
              here once you have activity data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily TSS</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Daily training stress by sport (cycling, running, swimming) shown
              as stacked bars.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

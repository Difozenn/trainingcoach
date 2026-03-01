import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NutritionPage() {
  return (
    <>
      <DashboardHeader title="Nutrition Targets" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Macro Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Daily carbs, protein, and fat targets based on your planned
              training. Set your weight in profile settings to get
              personalized recommendations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ride/Run Fueling Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Per-workout fueling strategy: carbs/hr, hydration, sodium,
              timing. Based on duration and intensity of your planned sessions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery Nutrition</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Post-workout protein and carb targets within the recovery window.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

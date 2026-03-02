import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getTodayNutrition,
  getWeekNutrition,
  getUpcomingFueling,
} from "@/lib/data/queries";
import { formatDate } from "@/lib/data/helpers";
import { getUserPlan } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

export default async function NutritionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getUserPlan(session.user.id);
  if (plan === "free") return <UpgradePrompt feature="Nutrition Targets" />;

  const userId = session.user.id;

  const [today, week, fueling] = await Promise.all([
    getTodayNutrition(userId),
    getWeekNutrition(userId),
    getUpcomingFueling(userId),
  ]);

  return (
    <>
      <DashboardHeader title="Nutrition Targets" />
      <div className="flex-1 space-y-6 p-6">
        {/* Today's targets */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Macro Targets</CardTitle>
          </CardHeader>
          <CardContent>
            {today ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Calories</p>
                    <p className="text-3xl font-bold">
                      {today.totalCalories.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Carbs</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {Math.round(today.carbsGrams)}g
                    </p>
                    {today.carbsPerKg && (
                      <p className="text-xs text-muted-foreground">
                        {today.carbsPerKg.toFixed(1)} g/kg
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Protein</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(today.proteinGrams)}g
                    </p>
                    {today.proteinPerKg && (
                      <p className="text-xs text-muted-foreground">
                        {today.proteinPerKg.toFixed(1)} g/kg
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-green-500/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Fat</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(today.fatGrams)}g
                    </p>
                    {today.fatPerKg && (
                      <p className="text-xs text-muted-foreground">
                        {today.fatPerKg.toFixed(1)} g/kg
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {today.trainingDayType.replace("_", " ")} day
                  </Badge>
                  {today.plannedTss && (
                    <Badge variant="secondary">
                      ~{Math.round(today.plannedTss)} TSS planned
                    </Badge>
                  )}
                </div>
                {today.explanation && (
                  <p className="text-sm text-muted-foreground">
                    {today.explanation}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No nutrition targets yet. Targets are generated alongside your
                weekly training plan — head to the{" "}
                <a href="/plan" className="underline">Plan</a> page to generate
                your first plan.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weekly targets */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {week.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="p-2 text-left font-medium">Day</th>
                      <th className="p-2 text-left font-medium">Type</th>
                      <th className="p-2 text-right font-medium">Cal</th>
                      <th className="p-2 text-right font-medium">Carbs</th>
                      <th className="p-2 text-right font-medium">Protein</th>
                      <th className="p-2 text-right font-medium">Fat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.map((d) => (
                      <tr key={d.id} className="border-b">
                        <td className="p-2">{formatDate(d.date)}</td>
                        <td className="p-2 capitalize">
                          {d.trainingDayType.replace("_", " ")}
                        </td>
                        <td className="p-2 text-right">
                          {d.totalCalories.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          {Math.round(d.carbsGrams)}g
                        </td>
                        <td className="p-2 text-right">
                          {Math.round(d.proteinGrams)}g
                        </td>
                        <td className="p-2 text-right">
                          {Math.round(d.fatGrams)}g
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Weekly targets appear once you have a training plan.
                Generate one from the{" "}
                <a href="/plan" className="underline">Plan</a> page.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Fueling plans */}
        <Card>
          <CardHeader>
            <CardTitle>Ride/Run Fueling Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {fueling.length > 0 ? (
              <div className="space-y-4">
                {fueling.map((f) => (
                  <div key={f.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{formatDate(f.date)}</p>
                      <Badge variant="outline">{f.durationMinutes} min</Badge>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-muted-foreground">Carbs: </span>
                        {f.carbsPerHour}g/hr ({f.totalCarbsGrams}g total)
                      </div>
                      {f.hydrationMlPerHour && (
                        <div>
                          <span className="text-muted-foreground">Fluid: </span>
                          {f.hydrationMlPerHour}ml/hr
                        </div>
                      )}
                      {f.sodiumMgPerHour && (
                        <div>
                          <span className="text-muted-foreground">Sodium: </span>
                          {f.sodiumMgPerHour}mg/hr
                        </div>
                      )}
                    </div>
                    {f.glucoseFructoseRatio && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Glucose:Fructose {f.glucoseFructoseRatio}
                      </p>
                    )}
                    {f.recoveryProteinGrams && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Post-workout: {Math.round(f.recoveryProteinGrams)}g
                        protein + {Math.round(f.recoveryCarbsGrams ?? 0)}g carbs
                        within {f.recoveryWindowMinutes ?? 120}min
                      </p>
                    )}
                    {f.explanation && (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        {f.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Fueling plans are generated for workouts over 60 minutes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDailyTssForWeek } from "@/lib/data/queries";
import { getAthleteProfile } from "@/lib/data/queries";
import { getUserPlan } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import {
  calculateDailyMacros,
  getTrainingDayType,
  DAY_TYPE_LABELS,
} from "@/lib/engine/nutrition/daily-macros";

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

type DayRow = {
  date: Date;
  label: string;
  tss: number;
  exerciseCal: number;
  dayType: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  carbsPerKg: number;
  proteinPerKg: number;
  fatPerKg: number;
  deficit: number;
  isToday: boolean;
  isPast: boolean;
};

export default async function NutritionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getUserPlan(session.user.id);
  if (plan === "free") return <UpgradePrompt feature="Nutrition Targets" />;

  const userId = session.user.id;
  const profile = await getAthleteProfile(userId);

  if (!profile?.weightKg) {
    return (
      <>
        <DashboardHeader title="Nutrition" />
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Set your weight in your profile to see nutrition targets.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const weightKg = profile.weightKg;
  const heightCm = profile.heightCm;
  const sex = profile.sex as "male" | "female" | null;
  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - profile.dateOfBirth.getTime()) / (365.25 * 24 * 3600_000))
    : null;

  // Get this week's dates (Mon-Sun)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Fetch actual TSS + exercise calories per day
  const dailyTss = await getDailyTssForWeek(userId, monday, sunday);
  const tssMap = new Map<string, number>();
  const exerciseCalMap = new Map<string, number>();
  for (const row of dailyTss) {
    const key = String(row.date);
    tssMap.set(key, Number(row.totalTss) || 0);
    exerciseCalMap.set(key, Number(row.totalExerciseKj) || 0); // kJ ≈ kcal
  }

  // Weekly cumulative TSS (for rest-day adjustments)
  const weeklyTss = Array.from(tssMap.values()).reduce((a, b) => a + b, 0);

  // Build 7-day rows
  const days: DayRow[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = date.toISOString().split("T")[0];
    const tss = tssMap.get(dateKey) ?? 0;
    const past = date < now && !isToday(date);
    const today = isToday(date);

    const dayType = getTrainingDayType(tss);
    const exerciseCal = exerciseCalMap.get(dateKey) ?? 0;
    const macros = calculateDailyMacros(weightKg, dayType, {
      heightCm,
      age,
      sex,
      exerciseCal,
      weeklyTss,
    });

    days.push({
      date,
      label: formatDay(date),
      tss: Math.round(tss),
      exerciseCal: Math.round(exerciseCal),
      dayType: DAY_TYPE_LABELS[macros.trainingDayType] ?? macros.trainingDayType.replace("_", " "),
      calories: macros.totalCalories,
      carbs: macros.carbsGrams,
      protein: macros.proteinGrams,
      fat: macros.fatGrams,
      carbsPerKg: macros.carbsPerKg,
      proteinPerKg: macros.proteinPerKg,
      fatPerKg: macros.fatPerKg,
      deficit: macros.deficit,
      isToday: today,
      isPast: past,
    });
  }

  const todayRow = days.find((d) => d.isToday) ?? days[0];

  return (
    <>
      <DashboardHeader title="Nutrition" />
      <div className="flex-1 space-y-6 p-6">
        {(!sex || !age) && (
          <p className="text-xs text-muted-foreground">
            Add your date of birth and sex in{" "}
            <a href="/settings" className="underline">settings</a>{" "}
            for more accurate nutrition targets.
          </p>
        )}

        {/* Today's macros */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Today
              </h2>
              <Badge variant="outline" className="capitalize text-xs">
                {todayRow.dayType}
              </Badge>
              {todayRow.tss > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {todayRow.tss} TSS
                </Badge>
              )}
              {todayRow.exerciseCal > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {todayRow.exerciseCal.toLocaleString()} kcal burned
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Calories
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {todayRow.calories.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Carbs
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                  {todayRow.carbs}g
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {todayRow.carbsPerKg} g/kg
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 px-4 py-3 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Protein
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {todayRow.protein}g
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {todayRow.proteinPerKg} g/kg
                </p>
              </div>
              <div className="rounded-lg bg-green-500/10 px-4 py-3 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Fat
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {todayRow.fat}g
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {todayRow.fatPerKg} g/kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly view */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                This Week
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(weeklyTss)} TSS total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium">Day</th>
                    <th className="px-2 py-2 text-right font-medium">TSS</th>
                    <th className="px-2 py-2 text-right font-medium">Burned</th>
                    <th className="px-2 py-2 text-left font-medium">Type</th>
                    <th className="px-2 py-2 text-right font-medium">Target</th>
                    <th className="px-2 py-2 text-right font-medium">Carbs</th>
                    <th className="px-2 py-2 text-right font-medium">Protein</th>
                    <th className="px-2 py-2 text-right font-medium">Fat</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr
                      key={d.label}
                      className={`border-b border-border/40 ${
                        d.isToday
                          ? "bg-primary/5 font-medium"
                          : d.isPast
                            ? "text-muted-foreground"
                            : ""
                      }`}
                    >
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        {d.label}
                        {d.isToday && (
                          <span className="ml-1.5 text-[10px] text-primary font-medium">
                            today
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {d.tss > 0 ? d.tss : (d.isPast || d.isToday) ? "—" : ""}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {d.exerciseCal > 0 ? `${d.exerciseCal.toLocaleString()}` : (d.isPast || d.isToday) ? "—" : ""}
                      </td>
                      <td className="px-2 py-2.5 capitalize whitespace-nowrap">
                        {(d.isPast || d.isToday || d.tss > 0) ? d.dayType : ""}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {(d.isPast || d.isToday) ? d.calories.toLocaleString() : ""}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {(d.isPast || d.isToday) ? `${d.carbs}g` : ""}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {(d.isPast || d.isToday) ? `${d.protein}g` : ""}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {(d.isPast || d.isToday) ? `${d.fat}g` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

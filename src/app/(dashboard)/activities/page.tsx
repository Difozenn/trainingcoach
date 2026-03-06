import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { fetchWeeks } from "./actions";
import { WeekCalendar } from "./week-calendar";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { weeks, nextCursor } = await fetchWeeks(null, 5);

  return (
    <>
      <DashboardHeader title="Activities" />
      <div className="flex-1 p-6">
        <Card>
          <CardContent className="overflow-x-auto pt-4">
            <WeekCalendar initialWeeks={weeks} initialCursor={nextCursor} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

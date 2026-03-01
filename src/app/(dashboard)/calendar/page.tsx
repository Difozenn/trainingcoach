import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <>
      <DashboardHeader title="Training Calendar" />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent className="h-[600px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Training calendar with completed activities and planned workouts.
              Drag workouts from your weekly pool onto specific days.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

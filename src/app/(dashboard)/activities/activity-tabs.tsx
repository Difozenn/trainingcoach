"use client";

import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { WeekCalendar } from "./week-calendar";
import { ActivityList } from "./activity-list";
import type { WeekData } from "./actions";

export function ActivityTabs({
  initialWeeks,
  initialCursor,
}: {
  initialWeeks: WeekData[];
  initialCursor: string | null;
}) {
  const [tab, setTab] = useState<"calendar" | "list">("calendar");

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setTab("calendar")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "calendar"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Calendar
        </button>
        <button
          onClick={() => setTab("list")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "list"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
      </div>

      {/* Tab content */}
      {tab === "calendar" ? (
        <WeekCalendar initialWeeks={initialWeeks} initialCursor={initialCursor} />
      ) : (
        <ActivityList />
      )}
    </div>
  );
}

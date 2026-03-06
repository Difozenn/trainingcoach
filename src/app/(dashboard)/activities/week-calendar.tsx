"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Bike, Footprints, Waves, Loader2 } from "lucide-react";
import { formatDuration, formatDistance } from "@/lib/data/helpers";
import { fetchWeeks, type WeekData } from "./actions";

const sportIcons = { cycling: Bike, running: Footprints, swimming: Waves };

export function WeekCalendar({
  initialWeeks,
  initialCursor,
}: {
  initialWeeks: WeekData[];
  initialCursor: string | null;
}) {
  const [weeks, setWeeks] = useState(initialWeeks);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    startTransition(async () => {
      const { weeks: newWeeks, nextCursor } = await fetchWeeks(cursor, 5);
      setWeeks((prev) => [...prev, ...newWeeks]);
      setCursor(nextCursor);
      loadingRef.current = false;
    });
  }, [cursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-0">
      {/* Day headers */}
      <div className="grid grid-cols-[160px_repeat(7,1fr)] gap-px text-center text-xs font-medium text-muted-foreground">
        <div />
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="p-2">{d}</div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <div
          key={`${week.weekNumber}-${wi}`}
          className="grid grid-cols-[160px_repeat(7,1fr)] gap-px"
        >
          {/* Stats sidebar */}
          <div className="flex flex-col border-r bg-muted/20 p-2.5 text-[11px] leading-relaxed">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="font-semibold text-xs text-foreground">
                Wk {week.weekNumber}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {week.weekLabel}
              </span>
            </div>

            <div className="border-t border-border/50 my-1" />

            {/* Volume block */}
            <div className="space-y-0.5">
              <StatRow label="Time" value={formatDuration(week.stats.duration)} />
              {week.stats.distance > 0 && (
                <StatRow label="Dist" value={formatDistance(week.stats.distance)} />
              )}
              {week.stats.elevation > 0 && (
                <StatRow label="Elev" value={`${Math.round(week.stats.elevation)}m`} />
              )}
            </div>

            <div className="border-t border-border/50 my-1" />

            {/* Load block */}
            <div className="space-y-0.5">
              <StatRow
                label="TSS"
                value={String(week.stats.tss)}
                highlight={week.stats.tss > 0}
              />
              {week.stats.ctl != null && (
                <StatRow label="CTL" value={String(week.stats.ctl)} />
              )}
              {week.stats.atl != null && (
                <StatRow label="ATL" value={String(week.stats.atl)} />
              )}
              {week.stats.form != null && (
                <StatRow label="Form" value={week.stats.form} />
              )}
              {week.stats.ramp != null && (
                <StatRow label="Ramp" value={String(week.stats.ramp)} />
              )}
            </div>
          </div>

          {/* Day cells */}
          {week.days.map((cell, i) => {
            if (!cell)
              return <div key={i} className="min-h-[80px] bg-muted/20 p-1" />;

            return (
              <div
                key={i}
                className={`min-h-[80px] border border-border/40 p-1 ${
                  cell.isToday ? "bg-primary/5 ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      cell.isToday
                        ? "font-bold text-primary"
                        : cell.dayOfMonth === 1
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {cell.dayOfMonth === 1
                      ? `${cell.monthLabel} ${cell.dayOfMonth}`
                      : cell.dayOfMonth}
                  </span>
                  {cell.totalTss > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0"
                    >
                      {Math.round(cell.totalTss)}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  {cell.activities.map((a) => {
                    const SportIcon =
                      sportIcons[a.sport as keyof typeof sportIcons];
                    return (
                      <Link
                        key={a.id}
                        href={`/activities/${a.id}`}
                        className="flex items-center gap-1 rounded bg-primary/10 px-1 py-0.5 text-[10px] hover:bg-primary/20"
                      >
                        {SportIcon && <SportIcon className="h-2.5 w-2.5" />}
                        <span className="truncate">
                          {formatDuration(a.durationSeconds)}
                        </span>
                      </Link>
                    );
                  })}
                  {cell.planned.map((w) => {
                    const SportIcon =
                      sportIcons[w.sport as keyof typeof sportIcons];
                    return (
                      <div
                        key={w.id}
                        className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] ${
                          w.isCompleted
                            ? "bg-green-500/10"
                            : "bg-muted/50 border border-dashed"
                        }`}
                      >
                        {SportIcon && <SportIcon className="h-2.5 w-2.5" />}
                        <span className="truncate">{w.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isPending && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground/70 shrink-0">{label}</span>
      <span
        className={`font-mono tabular-nums ${
          highlight ? "font-medium text-foreground" : "text-muted-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bike, Footprints, Waves, Search, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { formatDuration, formatDistance, formatDateShort } from "@/lib/data/helpers";
import {
  searchActivities,
  type ActivityRow,
  type SortField,
  type SortDir,
  type SportFilter,
  type RangeFilter,
} from "./actions";

const sportIcons = { cycling: Bike, running: Footprints, swimming: Waves };

const SPORT_OPTIONS: { value: SportFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
];

const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1y" },
  { value: "ytd", label: "YTD" },
];

const PAGE_SIZE = 30;

const COLUMNS: { key: SortField; label: string; align?: "right" }[] = [
  { key: "date", label: "Date" },
  { key: "duration", label: "Duration", align: "right" },
  { key: "distance", label: "Distance", align: "right" },
  { key: "tss", label: "TSS", align: "right" },
  { key: "power", label: "Avg W", align: "right" },
  { key: "hr", label: "Avg HR", align: "right" },
];

export function ActivityList() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [sport, setSport] = useState<SportFilter>("all");
  const [range, setRange] = useState<RangeFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [offset, setOffset] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const load = useCallback(
    (newOffset: number, append: boolean = false) => {
      startTransition(async () => {
        const result = await searchActivities({
          sport,
          range,
          search,
          sortBy,
          sortDir,
          offset: newOffset,
          limit: PAGE_SIZE,
        });
        setRows((prev) => (append ? [...prev, ...result.rows] : result.rows));
        setTotal(result.total);
        setOffset(newOffset + PAGE_SIZE);
        setInitialLoad(false);
      });
    },
    [sport, range, search, sortBy, sortDir]
  );

  // Reload when filters/sort change
  useEffect(() => {
    load(0);
  }, [load]);

  // Debounced search
  const onSearch = useCallback(
    (value: string) => {
      setSearch(value);
    },
    []
  );

  const onSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(value), 300);
    },
    [onSearch]
  );

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDir(field === "date" ? "desc" : "desc");
      }
    },
    [sortBy]
  );

  const hasMore = rows.length < total;

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending) {
          load(offset, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isPending, offset, load]);

  return (
    <div className="space-y-3">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sport filter */}
        <div className="flex items-center gap-1">
          {SPORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setSport(o.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                sport === o.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Range filter */}
        <div className="flex items-center gap-1">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === o.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name..."
            defaultValue={search}
            onChange={onSearchInput}
            className="h-7 w-48 rounded-md border border-border bg-background pl-7 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-[11px] text-muted-foreground">
        {total} activities{search && ` matching "${search}"`}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-8" />
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Name
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    {sortBy === col.key && (
                      sortDir === "asc"
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const Icon = sportIcons[row.sport as keyof typeof sportIcons];
              return (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/activities/${row.id}`}
                      className="font-medium text-foreground hover:text-primary truncate max-w-[250px] block"
                    >
                      {row.name || "Untitled"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">
                    {formatDateShort(new Date(row.startedAt))}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {formatDuration(row.durationSeconds)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {row.distanceMeters ? formatDistance(row.distanceMeters) : "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {row.tss ? Math.round(row.tss) : "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {row.averagePowerWatts || "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {row.averageHr || "-"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !isPending && !initialLoad && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No activities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-2">
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

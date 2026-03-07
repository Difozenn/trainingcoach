"use client";

import dynamic from "next/dynamic";
import type { StreamData } from "./stream-charts";

const ActivityStreamCharts = dynamic(
  () => import("./stream-charts").then((m) => m.ActivityStreamCharts),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted/50" /> }
);

const BreakthroughChart = dynamic(
  () => import("./stream-charts").then((m) => m.BreakthroughChart),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted/50" /> }
);

export function LazyStreamCharts({
  streams,
  ftp,
  sport,
}: {
  streams: StreamData;
  ftp?: number | null;
  sport: string;
}) {
  return <ActivityStreamCharts streams={streams} ftp={ftp} sport={sport} />;
}

export function LazyBreakthroughChart({
  data,
  ftp,
}: {
  data: { time: number; power: number; mpa: number; wbal: number; isBreakthrough: boolean }[];
  ftp: number;
}) {
  return <BreakthroughChart data={data} ftp={ftp} />;
}

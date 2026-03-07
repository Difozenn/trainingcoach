"use client";

import { useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// ── Shared ─────────────────────────────────────────────────────────

const PALETTE = ["#3b82f6", "#ec4899", "#f97316", "#f59e0b", "#22c55e", "#8b5cf6", "#ef4444"];

function yearColors(years: string[]) {
  const sorted = [...years].sort();
  const map: Record<string, string> = {};
  sorted.forEach((y, i) => { map[y] = PALETTE[i % PALETTE.length]; });
  return map;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

const MONTH_TICKS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthTick(doy: number) { const i = MONTH_TICKS.indexOf(doy); return i >= 0 ? MONTH_LABELS[i] : ""; }
function doyLabel(doy: number | string) { const d = new Date(2024, 0, Number(doy)); return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }); }

const ttStyle: React.CSSProperties = {
  backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
  borderRadius: 8, fontSize: 12, padding: "6px 10px",
};

function Empty() {
  return <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>;
}

/** Clickable legend hook — returns [hiddenSet, legendClickHandler] */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useToggleLegend(): [Set<string>, (e: any) => void] {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onClick = useCallback((e: any) => {
    const key = String(e?.dataKey ?? e?.value ?? "");
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);
  return [hidden, onClick];
}

function legendStyle(hidden: Set<string>) {
  return (value: string) => (
    <span style={{ color: hidden.has(value) ? "hsl(var(--muted-foreground))" : undefined, cursor: "pointer", textDecoration: hidden.has(value) ? "line-through" : undefined, fontSize: 11 }}>
      {value}
    </span>
  );
}

// ── 1. Fitness (CTL) by Year ───────────────────────────────────────

type FitnessRow = { date: Date; ctl: number | null };

export function FitnessByYearChart({ data }: { data: FitnessRow[] }) {
  const [hidden, onLegendClick] = useToggleLegend();
  if (data.length === 0) return <Empty />;

  const byYear = new Map<string, Map<number, number>>();
  for (const d of data) {
    const date = new Date(d.date);
    const year = String(date.getFullYear());
    const doy = dayOfYear(date);
    if (d.ctl == null) continue;
    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year)!.set(doy, Math.round(d.ctl));
  }

  const years = Array.from(byYear.keys()).sort();
  const colors = yearColors(years);

  const merged: Record<string, number | null>[] = [];
  for (let doy = 1; doy <= 366; doy += 2) {
    const row: Record<string, number | null> = { doy };
    let hasAny = false;
    for (const y of years) {
      const v = byYear.get(y)?.get(doy) ?? byYear.get(y)?.get(doy + 1) ?? null;
      row[y] = v;
      if (v != null) hasAny = true;
    }
    if (hasAny) merged.push(row);
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={merged} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="doy" type="number" domain={[1, 366]} ticks={MONTH_TICKS} tickFormatter={monthTick} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip contentStyle={ttStyle} labelFormatter={(v) => doyLabel(v as number)} formatter={(v: number | undefined, name?: string) => (v != null ? [v, name] : ["-"])} />
        <Legend iconSize={8} onClick={onLegendClick} formatter={legendStyle(hidden)} />
        {years.map((y) => (
          <Line key={y} dataKey={y} name={y} stroke={colors[y]} dot={false} strokeWidth={1.5} hide={hidden.has(y)} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 2. Cumulative Distance by Year ─────────────────────────────────

type DistRow = { date: Date; distanceMeters: number | null; sport: string };

export function DistanceByYearChart({ data }: { data: DistRow[] }) {
  const [hidden, onLegendClick] = useToggleLegend();
  if (data.length === 0) return <Empty />;

  const byYear = new Map<string, Map<number, number>>();
  for (const d of data) {
    const date = new Date(d.date);
    const year = String(date.getFullYear());
    const doy = dayOfYear(date);
    const km = (d.distanceMeters ?? 0) / 1000;
    if (!byYear.has(year)) byYear.set(year, new Map());
    const yMap = byYear.get(year)!;
    yMap.set(doy, (yMap.get(doy) ?? 0) + km);
  }

  const years = Array.from(byYear.keys()).sort();
  const colors = yearColors(years);

  const merged: Record<string, number | null>[] = [];
  const cumulative: Record<string, number> = {};
  for (const y of years) cumulative[y] = 0;

  for (let doy = 1; doy <= 366; doy++) {
    for (const y of years) cumulative[y] += byYear.get(y)?.get(doy) ?? 0;
    if (doy % 3 === 0 || doy === 1) {
      const row: Record<string, number | null> = { doy };
      let hasAny = false;
      for (const y of years) {
        const v = Math.round(cumulative[y]);
        row[y] = v > 0 ? v : null;
        if (v > 0) hasAny = true;
      }
      if (hasAny) merged.push(row);
    }
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={merged} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="doy" type="number" domain={[1, 366]} ticks={MONTH_TICKS} tickFormatter={monthTick} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit=" km" />
        <Tooltip contentStyle={ttStyle} labelFormatter={(v) => doyLabel(v as number)} formatter={(v: number | undefined, name?: string) => (v != null ? [`${v} km`, name] : ["-"])} />
        <Legend iconSize={8} onClick={onLegendClick} formatter={legendStyle(hidden)} />
        {years.map((y) => (
          <Line key={y} dataKey={y} name={y} stroke={colors[y]} dot={false} strokeWidth={1.5} hide={hidden.has(y)} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 3. Power vs Heart Rate by Year ─────────────────────────────────
// intervals.icu style: activities binned by power, averaged %threshold HR per bin

type PowerHrRow = { date: Date; avgPower: number | null; avgHr: number | null };

const BIN_WIDTH = 10; // 10W bins like intervals.icu
const MIN_POWER = 100; // filter out very low power activities

export function PowerHrByYearChart({ data, maxHr }: { data: PowerHrRow[]; maxHr: number | null }) {
  const [hidden, onLegendClick] = useToggleLegend();
  if (data.length === 0) return <Empty />;

  const thresholdHr = maxHr ?? 190;

  // Group by year → power bin → collect HR% values
  const byYear = new Map<string, Map<number, number[]>>();
  for (const d of data) {
    if (!d.avgPower || !d.avgHr || d.avgPower < MIN_POWER) continue;
    const year = String(new Date(d.date).getFullYear());
    const bin = Math.round(d.avgPower / BIN_WIDTH) * BIN_WIDTH;
    const hrPct = Math.round((d.avgHr / thresholdHr) * 1000) / 10;
    if (!byYear.has(year)) byYear.set(year, new Map());
    const bins = byYear.get(year)!;
    if (!bins.has(bin)) bins.set(bin, []);
    bins.get(bin)!.push(hrPct);
  }

  const years = Array.from(byYear.keys()).sort();
  const colors = yearColors(years);

  // Average HR% per bin per year
  const yearBinAvg = new Map<string, Map<number, number>>();
  for (const [year, bins] of byYear) {
    const avg = new Map<number, number>();
    for (const [bin, vals] of bins) {
      avg.set(bin, Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10);
    }
    yearBinAvg.set(year, avg);
  }

  // Collect all bins used across years
  const allBins = new Set<number>();
  for (const avg of yearBinAvg.values()) {
    for (const bin of avg.keys()) allBins.add(bin);
  }
  const sortedBins = Array.from(allBins).sort((a, b) => a - b);

  const merged = sortedBins.map((bin) => {
    const row: Record<string, number | null> = { watts: bin };
    for (const y of years) row[y] = yearBinAvg.get(y)?.get(bin) ?? null;
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={merged} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="watts" type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="w" domain={[MIN_POWER, "auto"]} />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={["auto", "auto"]} label={{ value: "% Threshold HR", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" }, offset: 15 }} />
        <Tooltip contentStyle={ttStyle} labelFormatter={(w) => `${w}W`} formatter={(v: number | undefined, name?: string) => (v != null ? [`${v}%`, name] : ["-"])} />
        <Legend iconSize={8} onClick={onLegendClick} formatter={legendStyle(hidden)} />
        {years.map((y) => (
          <Line key={y} dataKey={y} name={y} stroke={colors[y]} dot={{ r: 2, fill: colors[y] }} strokeWidth={1.5} hide={hidden.has(y)} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 4. Power Curve by Year ─────────────────────────────────────────

type YearlyPeakRow = { year: string; peak5s: number | null; peak1m: number | null; peak5m: number | null; peak20m: number | null; peak60m: number | null };
const DURATIONS = ["5s", "1m", "5m", "20m", "60m"] as const;

export function PowerCurveByYearChart({ data }: { data: YearlyPeakRow[] }) {
  const [hidden, onLegendClick] = useToggleLegend();
  if (data.length === 0) return <Empty />;

  const years = data.map((d) => d.year).sort();
  const colors = yearColors(years);

  const chartData = DURATIONS.map((dur) => {
    const row: Record<string, string | number | null> = { duration: dur };
    for (const d of data) {
      const key = `peak${dur}` as keyof YearlyPeakRow;
      row[d.year] = d[key];
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="duration" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="W" />
        <Tooltip contentStyle={ttStyle} formatter={(v: number | undefined, name?: string) => (v != null ? [`${v}W`, name] : ["-"])} />
        <Legend iconSize={8} onClick={onLegendClick} formatter={legendStyle(hidden)} />
        {years.map((y) => (
          <Bar key={y} dataKey={y} name={y} fill={colors[y]} hide={hidden.has(y)} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ZAxis,
} from "recharts";

// ── Year colors ────────────────────────────────────────────────────

const PALETTE = ["#94a3b8", "#f97316", "#22c55e", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899"];

function yearColors(years: string[]) {
  const sorted = [...years].sort();
  const map: Record<string, string> = {};
  sorted.forEach((y, i) => { map[y] = PALETTE[i % PALETTE.length]; });
  return map;
}

// ── Day-of-year helpers ────────────────────────────────────────────

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

const MONTH_TICKS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthTickFormatter(doy: number) {
  const idx = MONTH_TICKS.indexOf(doy);
  return idx >= 0 ? MONTH_LABELS[idx] : "";
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
};

function Empty() {
  return <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>;
}

// ── 1. Fitness (CTL) by Year ───────────────────────────────────────

type FitnessRow = { date: Date; ctl: number | null };

export function FitnessByYearChart({ data }: { data: FitnessRow[] }) {
  if (data.length === 0) return <Empty />;

  // Group by year
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

  // Build merged dataset: { doy, [year]: ctl }
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
        <XAxis
          dataKey="doy"
          type="number"
          domain={[1, 366]}
          ticks={MONTH_TICKS}
          tickFormatter={monthTickFormatter}
          tick={{ fontSize: 10 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(doy) => {
            const d = new Date(2024, 0, Number(doy));
            return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
          }}
          formatter={(v: number | undefined, name?: string) => (v != null ? [v, name] : ["-"])}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {years.map((y, i) => (
          <Line
            key={y}
            dataKey={y}
            name={y}
            stroke={colors[y]}
            dot={false}
            strokeWidth={i === years.length - 1 ? 2 : 1.5}
            opacity={i === years.length - 1 ? 1 : 0.5}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 2. Cumulative Distance by Year ─────────────────────────────────

type DistRow = { date: Date; distanceMeters: number | null; sport: string };

export function DistanceByYearChart({ data }: { data: DistRow[] }) {
  if (data.length === 0) return <Empty />;

  // Group activities by year, compute cumulative km by day-of-year
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

  // Compute cumulative and sample every 3 days
  const merged: Record<string, number | null>[] = [];
  const cumulative: Record<string, number> = {};
  for (const y of years) cumulative[y] = 0;

  for (let doy = 1; doy <= 366; doy++) {
    for (const y of years) {
      cumulative[y] += byYear.get(y)?.get(doy) ?? 0;
    }
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
        <XAxis
          dataKey="doy"
          type="number"
          domain={[1, 366]}
          ticks={MONTH_TICKS}
          tickFormatter={monthTickFormatter}
          tick={{ fontSize: 10 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit=" km" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(doy) => {
            const d = new Date(2024, 0, Number(doy));
            return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
          }}
          formatter={(v: number | undefined, name?: string) => (v != null ? [`${v} km`, name] : ["-"])}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {years.map((y, i) => (
          <Line
            key={y}
            dataKey={y}
            name={y}
            stroke={colors[y]}
            dot={false}
            strokeWidth={i === years.length - 1 ? 2 : 1.5}
            opacity={i === years.length - 1 ? 1 : 0.5}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 3. Power/HR Scatter by Year ────────────────────────────────────

type PowerHrRow = { date: Date; avgPower: number | null; avgHr: number | null };

export function PowerHrScatterChart({
  data,
  maxHr,
}: {
  data: PowerHrRow[];
  maxHr: number | null;
}) {
  if (data.length === 0) return <Empty />;

  const thresholdHr = maxHr ?? 190;

  // Group by year
  const byYear = new Map<string, { watts: number; hrPct: number }[]>();
  for (const d of data) {
    if (!d.avgPower || !d.avgHr) continue;
    const year = String(new Date(d.date).getFullYear());
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push({
      watts: d.avgPower,
      hrPct: Math.round((d.avgHr / thresholdHr) * 100),
    });
  }

  const years = Array.from(byYear.keys()).sort();
  const colors = yearColors(years);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis
          dataKey="watts"
          type="number"
          name="Power"
          unit="W"
          tick={{ fontSize: 10 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          dataKey="hrPct"
          type="number"
          name="HR"
          unit="%"
          tick={{ fontSize: 10 }}
          stroke="hsl(var(--muted-foreground))"
          label={{ value: "% Max HR", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
        />
        <ZAxis range={[20, 20]} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number | undefined, name?: string) => {
            if (name === "Power") return v != null ? [`${v}W`] : ["-"];
            if (name === "HR") return v != null ? [`${v}%`] : ["-"];
            return [v];
          }}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {years.map((y, i) => (
          <Scatter
            key={y}
            name={y}
            data={byYear.get(y)}
            fill={colors[y]}
            opacity={i === years.length - 1 ? 0.8 : 0.4}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ── 4. Power Curve by Year ─────────────────────────────────────────

type YearlyPeakRow = {
  year: string;
  peak5s: number | null;
  peak1m: number | null;
  peak5m: number | null;
  peak20m: number | null;
  peak60m: number | null;
};

const DURATIONS = ["5s", "1m", "5m", "20m", "60m"] as const;

export function PowerCurveByYearChart({ data }: { data: YearlyPeakRow[] }) {
  if (data.length === 0) return <Empty />;

  const years = data.map((d) => d.year).sort();
  const colors = yearColors(years);

  // Pivot: rows = durations, columns = years
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
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number | undefined, name?: string) => (v != null ? [`${v}W`, name] : ["-"])}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {years.map((y, i) => (
          <Bar
            key={y}
            dataKey={y}
            name={y}
            fill={colors[y]}
            opacity={i === years.length - 1 ? 0.9 : 0.5}
            radius={[3, 3, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

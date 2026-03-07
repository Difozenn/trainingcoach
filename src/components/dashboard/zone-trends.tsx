"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// ── Power Curve Chart ──────────────────────────────────────────────

type PeakRow = {
  month: string;
  peak5s: number | null;
  peak1m: number | null;
  peak5m: number | null;
  peak20m: number | null;
  peak60m: number | null;
};

export function PowerCurveChart({ data }: { data: PeakRow[] }) {
  if (data.length === 0) return <Empty />;
  const fmt = data.map((d) => ({
    ...d,
    label: fmtMonth(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={fmt} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="W" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
          formatter={(v: number | undefined) => (v != null ? [`${v}W`] : ["-"])}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Line dataKey="peak5s" name="5s" stroke="#ef4444" dot={false} strokeWidth={1.5} connectNulls />
        <Line dataKey="peak1m" name="1m" stroke="#f59e0b" dot={false} strokeWidth={1.5} connectNulls />
        <Line dataKey="peak5m" name="5m" stroke="#22c55e" dot={false} strokeWidth={1.5} connectNulls />
        <Line dataKey="peak20m" name="20m" stroke="#3b82f6" dot={false} strokeWidth={1.5} connectNulls />
        <Line dataKey="peak60m" name="60m" stroke="#8b5cf6" dot={false} strokeWidth={1.5} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Power/HR Efficiency Chart ──────────────────────────────────────

type PowerHrRow = {
  date: Date;
  avgPower: number | null;
  avgHr: number | null;
  np: number | null;
};

export function PowerHrChart({ data }: { data: PowerHrRow[] }) {
  if (data.length === 0) return <Empty />;
  const fmt = data
    .filter((d) => d.avgPower && d.avgHr && d.avgHr > 0)
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      ratio: Math.round(((d.avgPower ?? 0) / (d.avgHr ?? 1)) * 100) / 100,
      ef: d.np && d.avgHr ? Math.round((d.np / d.avgHr) * 100) / 100 : null,
    }));

  // Downsample to ~60 points for readability
  const step = Math.max(1, Math.floor(fmt.length / 60));
  const sampled = fmt.filter((_, i) => i % step === 0 || i === fmt.length - 1);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={sampled} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
          formatter={(v: number | undefined) => (v != null ? [v.toFixed(2)] : ["-"])}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Line dataKey="ratio" name="Power/HR" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
        <Line dataKey="ef" name="EF (NP/HR)" stroke="#8b5cf6" dot={false} strokeWidth={1.5} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Fitness (CTL) Chart ────────────────────────────────────────────

type FitnessRow = {
  date: Date;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
};

export function FitnessTrendChart({ data }: { data: FitnessRow[] }) {
  if (data.length === 0) return <Empty />;

  // Downsample to weekly for long ranges
  const step = data.length > 365 ? 7 : data.length > 180 ? 3 : 1;
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const fmt = sampled.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    CTL: d.ctl != null ? Math.round(d.ctl) : null,
    ATL: d.atl != null ? Math.round(d.atl) : null,
    TSB: d.tsb != null ? Math.round(d.tsb) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={fmt} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Area dataKey="CTL" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1.5} dot={false} />
        <Area dataKey="ATL" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={1.5} dot={false} />
        <Area dataKey="TSB" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={1} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Distance by Month Chart ────────────────────────────────────────

type DistanceRow = {
  month: string;
  sport: string;
  totalDistance: number;
  count: number;
};

export function DistanceChart({ data }: { data: DistanceRow[] }) {
  if (data.length === 0) return <Empty />;

  // Pivot: group by month, sum distance per sport
  const monthMap = new Map<string, { label: string; cycling: number; running: number; swimming: number }>();
  for (const d of data) {
    const key = d.month;
    if (!monthMap.has(key)) monthMap.set(key, { label: fmtMonth(key), cycling: 0, running: 0, swimming: 0 });
    const row = monthMap.get(key)!;
    const km = Math.round(d.totalDistance / 1000);
    if (d.sport === "cycling") row.cycling += km;
    else if (d.sport === "running") row.running += km;
    else if (d.sport === "swimming") row.swimming += km;
  }
  const fmt = Array.from(monthMap.values());

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={fmt} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="km" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
          formatter={(v: number | undefined) => (v != null ? [`${v} km`] : ["-"])}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="cycling" name="Cycling" fill="#3b82f6" radius={[3, 3, 0, 0]} stackId="a" />
        <Bar dataKey="running" name="Running" fill="#22c55e" radius={[3, 3, 0, 0]} stackId="a" />
        <Bar dataKey="swimming" name="Swimming" fill="#14b8a6" radius={[3, 3, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1]} '${y.slice(2)}`;
}

function Empty() {
  return <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>;
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
};

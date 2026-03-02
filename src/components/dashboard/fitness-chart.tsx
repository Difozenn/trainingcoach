"use client";

import {
  ComposedChart,
  AreaChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { tsbInsight } from "@/lib/data/helpers";

type TimelinePoint = {
  date: string;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  cyclingTss: number;
  runningTss: number;
  swimmingTss: number;
};

// ── Form zones (intervals.icu-style) ───────────────────────────────

const FORM_ZONES = [
  { min: 25, max: 60, label: "Race Ready", color: "#22c55e", opacity: 0.12 },
  { min: 5, max: 25, label: "Fresh", color: "#4ade80", opacity: 0.06 },
  { min: -10, max: 5, label: "Grey Zone", color: "#6b7280", opacity: 0.06 },
  { min: -30, max: -10, label: "Optimal", color: "#3b82f6", opacity: 0.08 },
  { min: -60, max: -30, label: "High Risk", color: "#ef4444", opacity: 0.10 },
] as const;

function getFormZoneName(tsb: number): string {
  if (tsb > 25) return "Race Ready";
  if (tsb > 5) return "Fresh";
  if (tsb > -10) return "Grey Zone";
  if (tsb > -30) return "Optimal";
  return "High Risk";
}

// ── Legend ───────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground mb-3 px-1">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-3 rounded-full bg-[#3b82f6]" />
        Fitness (CTL)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-3 rounded-full bg-[#a855f7]" />
        Fatigue (ATL)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-3 rounded-sm bg-[#3b82f6]/60" />
        Cycling
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-3 rounded-sm bg-[#22c55e]/60" />
        Running
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-3 rounded-sm bg-[#14b8a6]/60" />
        Swimming
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-3 rounded-sm border border-[#22c55e]/40 bg-[#22c55e]/10" />
        Productive zone
      </span>
    </div>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────

function MainTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  // Access the full data point from any payload item
  const point = payload[0]?.payload as TimelinePoint | undefined;
  if (!point) return null;

  const ctl = point.ctl;
  const atl = point.atl;
  const tsb = point.tsb;
  const totalTss =
    (point.cyclingTss ?? 0) +
    (point.runningTss ?? 0) +
    (point.swimmingTss ?? 0);

  return (
    <div className="pointer-events-none rounded-md border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-sm text-xs space-y-1">
      <div className="font-medium text-foreground">{label}</div>
      <div className="flex items-center gap-3">
        {ctl != null && (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
            <span className="text-muted-foreground">Fitness</span>
            <span className="font-semibold">{Math.round(ctl)}</span>
          </span>
        )}
        {atl != null && (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a855f7]" />
            <span className="text-muted-foreground">Fatigue</span>
            <span className="font-semibold">{Math.round(atl)}</span>
          </span>
        )}
        {totalTss > 0 && (
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">TSS</span>
            <span className="font-semibold">{Math.round(totalTss)}</span>
          </span>
        )}
      </div>
      {tsb != null && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Form</span>
          <span className="font-semibold">{Math.round(tsb)}</span>
          <span
            className="rounded px-1 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor:
                FORM_ZONES.find((z) => tsb >= z.min && tsb < z.max)?.color ??
                "#ef4444",
              opacity: 0.2,
            }}
          >
            {getFormZoneName(tsb)}
          </span>
        </div>
      )}
      {tsb != null && (
        <div className="text-[10px] text-muted-foreground/70 max-w-[280px]">
          {tsbInsight(tsb)}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────

export function FitnessChart({ data }: { data: TimelinePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[440px] items-center justify-center text-sm text-muted-foreground">
        Sync activities to see your fitness timeline.
      </div>
    );
  }

  // Build chart data — TSS positive (bars go up), green zone via stacking
  const chartData = data.map((d) => ({
    ...d,
    cyclingTss: d.cyclingTss ?? 0,
    runningTss: d.runningTss ?? 0,
    swimmingTss: d.swimmingTss ?? 0,
    // Green productive zone: invisible pad up to CTL, then 20-unit green band
    _zonePad: d.ctl != null ? d.ctl : null,
    _zoneGreen: d.ctl != null ? 20 : null,
  }));

  // Domain calculations
  const maxFitnessZone = Math.max(
    ...data.map((d) => (d.ctl ?? 0) + 25),
    ...data.map((d) => d.atl ?? 0)
  );
  const maxTss = Math.max(
    ...data.map(
      (d) =>
        (d.cyclingTss ?? 0) + (d.runningTss ?? 0) + (d.swimmingTss ?? 0)
    )
  );
  const upperDomain =
    Math.ceil((Math.max(maxFitnessZone, maxTss) * 1.1) / 10) * 10 || 50;

  // Form chart domain
  const minTsb = Math.min(...data.map((d) => d.tsb ?? 0), -30);
  const maxTsb = Math.max(...data.map((d) => d.tsb ?? 0), 25);
  const formLower = Math.floor((minTsb - 5) / 10) * 10;
  const formUpper = Math.ceil((maxTsb + 5) / 10) * 10;

  return (
    <div>
      <ChartLegend />

      {/* ── Main PMC chart ─────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={chartData}
          syncId="pmc"
          margin={{ top: 8, right: 10, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted/50"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={false}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, upperDomain]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <Tooltip
            content={<MainTooltip />}
            cursor={{
              stroke: "hsl(var(--muted-foreground))",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
            position={{ y: 0 }}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 10 }}
          />

          {/* Green productive zone — stacked: invisible pad + green band */}
          <Area
            dataKey="_zonePad"
            stackId="zone"
            type="monotone"
            fill="none"
            stroke="none"
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />
          <Area
            dataKey="_zoneGreen"
            stackId="zone"
            type="monotone"
            fill="#22c55e"
            fillOpacity={0.08}
            stroke="#22c55e"
            strokeWidth={0.5}
            strokeOpacity={0.15}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />

          {/* TSS bars going UP (stacked by sport) */}
          <Bar
            dataKey="cyclingTss"
            name="Cycling"
            stackId="tss"
            fill="#3b82f6"
            opacity={0.6}
            maxBarSize={8}
          />
          <Bar
            dataKey="runningTss"
            name="Running"
            stackId="tss"
            fill="#22c55e"
            opacity={0.6}
            maxBarSize={8}
          />
          <Bar
            dataKey="swimmingTss"
            name="Swimming"
            stackId="tss"
            fill="#14b8a6"
            opacity={0.6}
            maxBarSize={8}
          />

          {/* Fitness (CTL) — blue */}
          <Line
            type="monotone"
            dataKey="ctl"
            name="Fitness"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
          {/* Fatigue (ATL) — purple */}
          <Line
            type="monotone"
            dataKey="atl"
            name="Fatigue"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Form (TSB) chart ───────────────────────────────────────── */}
      <div className="mt-2 flex items-center gap-3 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Form
        </span>
        <div className="flex items-center gap-2">
          {FORM_ZONES.map((z) => (
            <span
              key={z.label}
              className="flex items-center gap-1 text-[10px]"
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: z.color, opacity: 0.7 }}
              />
              <span className="text-muted-foreground/70">{z.label}</span>
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart
          data={chartData}
          syncId="pmc"
          margin={{ top: 4, right: 10, bottom: 5, left: 0 }}
        >
          {/* Zone backgrounds */}
          {FORM_ZONES.map((z) => (
            <ReferenceArea
              key={z.label}
              y1={z.min}
              y2={z.max}
              fill={z.color}
              fillOpacity={z.opacity}
            />
          ))}

          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted/50"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[formLower, formUpper]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <Tooltip
            content={() => null}
            cursor={{
              stroke: "hsl(var(--muted-foreground))",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={0.5}
            strokeOpacity={0.5}
          />

          <defs>
            <linearGradient id="tsbFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="45%" stopColor="#6b7280" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.25} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="tsb"
            fill="url(#tsbFill)"
            stroke="#a855f7"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2, strokeWidth: 0, fill: "#a855f7" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

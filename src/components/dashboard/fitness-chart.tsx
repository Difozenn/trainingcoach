"use client";

import {
  ComposedChart,
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

type TimelinePoint = {
  date: string;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  formPct: number | null;
  cyclingTss: number;
  runningTss: number;
  swimmingTss: number;
};

// ── Form zones (intervals.icu-style, percentage-based: TSB/CTL × 100) ──

const FORM_ZONES = [
  { min: 20, max: 100, label: "Detraining", color: "#f97316", opacity: 0.10 },
  { min: 5, max: 20, label: "Fresh", color: "#3b82f6", opacity: 0.06 },
  { min: -10, max: 5, label: "Grey Zone", color: "#6b7280", opacity: 0.06 },
  { min: -30, max: -10, label: "Optimal", color: "#22c55e", opacity: 0.08 },
  { min: -100, max: -30, label: "High Risk", color: "#ef4444", opacity: 0.10 },
] as const;

function getFormZoneColor(formPct: number): string {
  return (
    FORM_ZONES.find((z) => formPct >= z.min && formPct < z.max)?.color ?? "#ef4444"
  );
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

  const point = payload[0]?.payload as TimelinePoint | undefined;
  if (!point) return null;

  const ctl = point.ctl;
  const atl = point.atl;
  const formPct = point.formPct;
  const totalTss =
    (point.cyclingTss ?? 0) +
    (point.runningTss ?? 0) +
    (point.swimmingTss ?? 0);

  return (
    <div className="pointer-events-none rounded-md border bg-background/95 backdrop-blur-sm px-3 py-1.5 shadow-sm text-xs">
      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground">{label}</span>
        <span className="h-3 w-px bg-border" />
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
        {formPct != null && (
          <span className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getFormZoneColor(formPct) }}
            />
            <span className="text-muted-foreground">Form</span>
            <span className="font-semibold">
              {formPct > 0 ? "+" : ""}{formPct}%
            </span>
          </span>
        )}
        {totalTss > 0 && (
          <>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">TSS</span>
              <span className="font-semibold">{Math.round(totalTss)}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Zone-segmented Form data ────────────────────────────────────────

type ChartRow = TimelinePoint & {
  _zonePad: number | null;
  _zoneGreen: number | null;
  _form0: number | null;
  _form1: number | null;
  _form2: number | null;
  _form3: number | null;
  _form4: number | null;
};

function isInZone(
  formPct: number | null,
  zone: (typeof FORM_ZONES)[number]
): boolean {
  if (formPct == null) return false;
  return formPct >= zone.min && (zone.max >= 100 || formPct < zone.max);
}

function buildChartData(data: TimelinePoint[]): ChartRow[] {
  const rows: ChartRow[] = data.map((d) => ({
    ...d,
    cyclingTss: d.cyclingTss ?? 0,
    runningTss: d.runningTss ?? 0,
    swimmingTss: d.swimmingTss ?? 0,
    _zonePad: d.ctl != null ? d.ctl : null,
    _zoneGreen: d.ctl != null ? 20 : null,
    _form0: null,
    _form1: null,
    _form2: null,
    _form3: null,
    _form4: null,
  }));

  // Assign formPct to per-zone keys with adjacent overlap for line continuity
  const keys = ["_form0", "_form1", "_form2", "_form3", "_form4"] as const;
  for (let zi = 0; zi < FORM_ZONES.length; zi++) {
    const zone = FORM_ZONES[zi];
    const key = keys[zi];
    for (let i = 0; i < rows.length; i++) {
      const formPct = rows[i].formPct;
      if (formPct == null) continue;
      if (isInZone(formPct, zone)) {
        rows[i][key] = formPct;
        continue;
      }
      // Include boundary points so line segments connect seamlessly
      const prev = i > 0 ? rows[i - 1].formPct : null;
      const next = i < rows.length - 1 ? rows[i + 1].formPct : null;
      if (isInZone(prev, zone) || isInZone(next, zone)) {
        rows[i][key] = formPct;
      }
    }
  }

  return rows;
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

  const chartData = buildChartData(data);

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

  // Form chart domain (percentage-based)
  const minForm = Math.min(...data.map((d) => d.formPct ?? 0), -30);
  const maxForm = Math.max(...data.map((d) => d.formPct ?? 0), 25);
  const formLower = Math.floor((minForm - 5) / 10) * 10;
  const formUpper = Math.ceil((maxForm + 5) / 10) * 10;

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

      {/* ── Form chart (percentage-based) ────────────────────────────── */}
      <div className="mt-2 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Form (TSB/CTL %)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart
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
            tickFormatter={(v: number) => `${v}%`}
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
            <linearGradient id="formFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.20} />
              <stop offset="40%" stopColor="#6b7280" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.20} />
            </linearGradient>
          </defs>

          {/* Form area fill (neutral, behind the colored lines) */}
          <Area
            type="monotone"
            dataKey="formPct"
            fill="url(#formFill)"
            stroke="none"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />

          {/* Zone-colored Form line segments */}
          {FORM_ZONES.map((zone, zi) => (
            <Line
              key={zi}
              type="monotone"
              dataKey={`_form${zi}`}
              stroke={zone.color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              activeDot={false}
              isAnimationActive={false}
              legendType="none"
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

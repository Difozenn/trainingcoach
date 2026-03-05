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

// ── Form zones ──────────────────────────────────────────────────────

const FORM_ZONES = [
  { min: 25, max: 100, label: "Detraining", color: "hsl(var(--muted-foreground))", opacity: 0.04 },
  { min: 5, max: 25, label: "Fresh", color: "#3b82f6", opacity: 0.04 },
  { min: -10, max: 5, label: "Neutral", color: "hsl(var(--muted-foreground))", opacity: 0.02 },
  { min: -30, max: -10, label: "Optimal", color: "#22c55e", opacity: 0.06 },
  { min: -100, max: -30, label: "Overreaching", color: "#ef4444", opacity: 0.05 },
] as const;

function getFormColor(formPct: number): string {
  if (formPct < -30) return "#ef4444";
  if (formPct < -10) return "#22c55e";
  if (formPct < 5) return "hsl(var(--muted-foreground))";
  if (formPct < 25) return "#3b82f6";
  return "#f97316";
}

// ── Legend ───────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground mb-4">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-[2px] w-4 bg-[#3b82f6]" />
        CTL (Fitness)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-[2px] w-4 bg-[#ec4899]" />
        ATL (Fatigue)
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2 rounded-[1px] bg-[#64748b]/50" />
        Cycling TSS
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2 rounded-[1px] bg-[#22c55e]/50" />
        Running TSS
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2 rounded-[1px] bg-[#06b6d4]/50" />
        Swimming TSS
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
  const tsb = point.tsb;
  const totalTss =
    (point.cyclingTss ?? 0) +
    (point.runningTss ?? 0) +
    (point.swimmingTss ?? 0);

  return (
    <div className="pointer-events-none rounded border border-border/60 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-md text-xs font-mono">
      <p className="text-[10px] text-muted-foreground mb-1.5 font-sans">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {ctl != null && (
          <>
            <span className="text-muted-foreground">CTL</span>
            <span className="text-right font-medium text-[#3b82f6]">{Math.round(ctl)}</span>
          </>
        )}
        {atl != null && (
          <>
            <span className="text-muted-foreground">ATL</span>
            <span className="text-right font-medium text-[#ec4899]">{Math.round(atl)}</span>
          </>
        )}
        {tsb != null && (
          <>
            <span className="text-muted-foreground">TSB</span>
            <span className="text-right font-medium">{tsb > 0 ? "+" : ""}{Math.round(tsb)}</span>
          </>
        )}
        {totalTss > 0 && (
          <>
            <span className="text-muted-foreground">TSS</span>
            <span className="text-right font-medium">{Math.round(totalTss)}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Form gradient ───────────────────────────────────────────────────

function buildFormGradientStops(lower: number, upper: number) {
  const range = upper - lower;
  if (range <= 0) return [];
  const toOff = (y: number) =>
    `${(((upper - Math.max(lower, Math.min(upper, y))) / range) * 100).toFixed(1)}%`;

  return [
    { offset: "0%", color: "#f97316" },
    { offset: toOff(25), color: "#f97316" },
    { offset: toOff(25), color: "#3b82f6" },
    { offset: toOff(5), color: "#3b82f6" },
    { offset: toOff(5), color: "#6b7280" },
    { offset: toOff(-10), color: "#6b7280" },
    { offset: toOff(-10), color: "#22c55e" },
    { offset: toOff(-30), color: "#22c55e" },
    { offset: toOff(-30), color: "#ef4444" },
    { offset: "100%", color: "#ef4444" },
  ];
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

  // Domain calculations
  const maxFitness = Math.max(
    ...data.map((d) => d.ctl ?? 0),
    ...data.map((d) => d.atl ?? 0)
  );
  const maxTss = Math.max(
    ...data.map(
      (d) =>
        (d.cyclingTss ?? 0) + (d.runningTss ?? 0) + (d.swimmingTss ?? 0)
    )
  );
  const upperDomain =
    Math.ceil((Math.max(maxFitness * 1.15, maxTss * 1.1) ) / 10) * 10 || 50;

  // Form domain
  const formValues = data.map((d) => d.formPct).filter((v): v is number => v != null);
  const minForm = Math.max(-100, Math.min(...formValues, -30));
  const maxForm = Math.min(100, Math.max(...formValues, 25));
  const formLower = Math.max(-100, Math.floor((minForm - 5) / 10) * 10);
  const formUpper = Math.min(100, Math.ceil((maxForm + 5) / 10) * 10);
  const dataMin = formValues.length > 0 ? Math.min(...formValues) : formLower;
  const dataMax = formValues.length > 0 ? Math.max(...formValues) : formUpper;
  const formGradientStops = buildFormGradientStops(dataMin, dataMax);

  return (
    <div>
      <ChartLegend />

      {/* ── Main PMC chart ─────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart
          data={data}
          syncId="pmc"
          margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
        >
          <CartesianGrid
            strokeDasharray="1 4"
            className="stroke-border/40"
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
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground/60"
            width={36}
          />
          <Tooltip
            content={<MainTooltip />}
            cursor={{
              stroke: "hsl(var(--muted-foreground))",
              strokeWidth: 0.5,
              strokeOpacity: 0.4,
            }}
            wrapperStyle={{ zIndex: 10 }}
          />

          {/* TSS bars — subtle, stacked by sport */}
          <Bar
            dataKey="cyclingTss"
            name="Cycling"
            stackId="tss"
            fill="#64748b"
            opacity={0.35}
            maxBarSize={5}
            radius={[1, 1, 0, 0]}
          />
          <Bar
            dataKey="runningTss"
            name="Running"
            stackId="tss"
            fill="#22c55e"
            opacity={0.35}
            maxBarSize={5}
          />
          <Bar
            dataKey="swimmingTss"
            name="Swimming"
            stackId="tss"
            fill="#06b6d4"
            opacity={0.35}
            maxBarSize={5}
          />

          {/* CTL fill — subtle gradient under the line */}
          <defs>
            <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="ctl"
            fill="url(#ctlFill)"
            stroke="none"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />

          {/* CTL line — blue, clean */}
          <Line
            type="monotone"
            dataKey="ctl"
            name="CTL"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2.5, strokeWidth: 0, fill: "#3b82f6" }}
          />
          {/* ATL line — pink */}
          <Line
            type="monotone"
            dataKey="atl"
            name="ATL"
            stroke="#ec4899"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2.5, strokeWidth: 0, fill: "#ec4899" }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Form chart ─────────────────────────────────────────────── */}
      <div className="mt-3 mb-1 px-1">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
          Form (TSB / CTL)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <ComposedChart
          data={data}
          syncId="pmc"
          margin={{ top: 2, right: 8, bottom: 4, left: -8 }}
        >
          {/* Zone backgrounds — very subtle */}
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
            strokeDasharray="1 4"
            className="stroke-border/30"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9 }}
            className="text-muted-foreground/60"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[formLower, formUpper]}
            tick={{ fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground/60"
            width={36}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            content={() => null}
            cursor={{
              stroke: "hsl(var(--muted-foreground))",
              strokeWidth: 0.5,
              strokeOpacity: 0.4,
            }}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={0.5}
            strokeOpacity={0.3}
          />

          <defs>
            <linearGradient id="formFillGrad" x1="0" y1="0" x2="0" y2="1">
              {formGradientStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.08} />
              ))}
            </linearGradient>
            <linearGradient id="formStrokeGrad" x1="0" y1="0" x2="0" y2="1">
              {formGradientStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.8} />
              ))}
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="formPct"
            fill="url(#formFillGrad)"
            stroke="none"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="formPct"
            stroke="url(#formStrokeGrad)"
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

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
  Label,
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
  { min: 25, max: 100, label: "Detraining", color: "#f97316", opacity: 0.05 },
  { min: 5, max: 25, label: "Fresh", color: "#3b82f6", opacity: 0.05 },
  { min: -10, max: 5, label: "Neutral", color: "#6b7280", opacity: 0.03 },
  { min: -30, max: -10, label: "Optimal", color: "#22c55e", opacity: 0.07 },
  { min: -100, max: -30, label: "Overreaching", color: "#ef4444", opacity: 0.06 },
] as const;

// ── Legend ───────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground mb-4">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-[2.5px] w-5 rounded-full bg-[#3b82f6]" />
        CTL (Fitness)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-[2.5px] w-5 rounded-full bg-[#ec4899]" />
        ATL (Fatigue)
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#64748b]/40" />
        Cycling TSS
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#22c55e]/40" />
        Running TSS
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#06b6d4]/40" />
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
    <div className="pointer-events-none rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm px-3 py-2.5 shadow-lg text-xs font-mono">
      <p className="text-[10px] text-muted-foreground mb-1.5 font-sans font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-x-5 gap-y-0.5">
        {ctl != null && (
          <>
            <span className="text-muted-foreground">CTL</span>
            <span className="text-right font-semibold text-[#3b82f6]">{Math.round(ctl)}</span>
          </>
        )}
        {atl != null && (
          <>
            <span className="text-muted-foreground">ATL</span>
            <span className="text-right font-semibold text-[#ec4899]">{Math.round(atl)}</span>
          </>
        )}
        {tsb != null && (
          <>
            <span className="text-muted-foreground">TSB</span>
            <span className="text-right font-semibold">{tsb > 0 ? "+" : ""}{Math.round(tsb)}</span>
          </>
        )}
        {totalTss > 0 && (
          <>
            <span className="text-muted-foreground">TSS</span>
            <span className="text-right font-semibold">{Math.round(totalTss)}</span>
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

// ── Tick interval helper ────────────────────────────────────────────

function computeTickInterval(count: number): number {
  if (count <= 30) return 6;     // ~weekly ticks for 1 month
  if (count <= 60) return 13;    // ~biweekly for 2 months
  if (count <= 120) return 13;   // ~biweekly for 90 days
  return Math.ceil(count / 8);   // ~8 ticks for longer ranges
}

function niceYTicks(upper: number): number[] {
  const steps = [5, 10, 20, 25, 50, 100];
  const target = upper / 5;
  const step = steps.find((s) => s >= target) ?? Math.ceil(target / 10) * 10;
  const ticks: number[] = [];
  for (let v = 0; v <= upper; v += step) ticks.push(v);
  return ticks;
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
    Math.ceil((Math.max(maxFitness * 1.15, maxTss * 1.1)) / 10) * 10 || 50;

  // Form domain
  const formValues = data.map((d) => d.formPct).filter((v): v is number => v != null);
  const minForm = Math.max(-100, Math.min(...formValues, -30));
  const maxForm = Math.min(100, Math.max(...formValues, 25));
  const formLower = Math.max(-100, Math.floor((minForm - 5) / 10) * 10);
  const formUpper = Math.min(100, Math.ceil((maxForm + 5) / 10) * 10);
  const dataMin = formValues.length > 0 ? Math.min(...formValues) : formLower;
  const dataMax = formValues.length > 0 ? Math.max(...formValues) : formUpper;
  const formGradientStops = buildFormGradientStops(dataMin, dataMax);

  const tickInterval = computeTickInterval(data.length);

  return (
    <div>
      <ChartLegend />

      {/* ── Main PMC chart ─────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart
          data={data}
          syncId="pmc"
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="none"
            stroke="#64748b"
            strokeOpacity={0.25}
            strokeWidth={1}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            dy={4}
          />
          <YAxis
            domain={[0, upperDomain]}
            ticks={niceYTicks(upperDomain)}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            content={<MainTooltip />}
            cursor={{
              stroke: "#94a3b8",
              strokeWidth: 1,
              strokeOpacity: 0.4,
              strokeDasharray: "4 3",
            }}
            wrapperStyle={{ zIndex: 10 }}
          />

          {/* TSS bars — stacked by sport */}
          <Bar
            dataKey="cyclingTss"
            name="Cycling"
            stackId="tss"
            fill="#64748b"
            opacity={0.4}
            maxBarSize={6}
            radius={[1, 1, 0, 0]}
          />
          <Bar
            dataKey="runningTss"
            name="Running"
            stackId="tss"
            fill="#22c55e"
            opacity={0.4}
            maxBarSize={6}
          />
          <Bar
            dataKey="swimmingTss"
            name="Swimming"
            stackId="tss"
            fill="#06b6d4"
            opacity={0.4}
            maxBarSize={6}
          />

          {/* CTL fill — gradient under the line */}
          <defs>
            <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
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

          {/* CTL line — blue */}
          <Line
            type="monotone"
            dataKey="ctl"
            name="CTL"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1.5, stroke: "#1e293b", fill: "#3b82f6" }}
          />
          {/* ATL line — pink */}
          <Line
            type="monotone"
            dataKey="atl"
            name="ATL"
            stroke="#ec4899"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1.5, stroke: "#1e293b", fill: "#ec4899" }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Form chart ─────────────────────────────────────────────── */}
      <div className="mt-4 mb-1.5 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Form (TSB / CTL)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart
          data={data}
          syncId="pmc"
          margin={{ top: 2, right: 12, bottom: 4, left: 0 }}
        >
          {/* Zone backgrounds */}
          {FORM_ZONES.map((z) => (
            <ReferenceArea
              key={z.label}
              y1={z.min}
              y2={z.max}
              fill={z.color}
              fillOpacity={z.opacity}
              ifOverflow="hidden"
            />
          ))}

          <CartesianGrid
            strokeDasharray="none"
            stroke="#64748b"
            strokeOpacity={0.2}
            strokeWidth={1}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            dy={4}
          />
          <YAxis
            domain={[formLower, formUpper]}
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            content={() => null}
            cursor={{
              stroke: "#94a3b8",
              strokeWidth: 1,
              strokeOpacity: 0.4,
              strokeDasharray: "4 3",
            }}
          />
          <ReferenceLine
            y={0}
            stroke="#94a3b8"
            strokeWidth={0.75}
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />

          {/* Zone labels on right side */}
          <ReferenceLine y={-20} stroke="none">
            <Label value="Optimal" position="insideRight" fontSize={8} fill="#22c55e" fillOpacity={0.7} />
          </ReferenceLine>
          <ReferenceLine y={15} stroke="none">
            <Label value="Fresh" position="insideRight" fontSize={8} fill="#3b82f6" fillOpacity={0.7} />
          </ReferenceLine>

          <defs>
            <linearGradient id="formFillGrad" x1="0" y1="0" x2="0" y2="1">
              {formGradientStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.12} />
              ))}
            </linearGradient>
            <linearGradient id="formStrokeGrad" x1="0" y1="0" x2="0" y2="1">
              {formGradientStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.9} />
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
            strokeWidth={1.8}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Form zone legend ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 px-1 text-[10px] text-muted-foreground">
        {FORM_ZONES.slice().reverse().map((z) => (
          <span key={z.label} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: z.color, opacity: 0.6 }}
            />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

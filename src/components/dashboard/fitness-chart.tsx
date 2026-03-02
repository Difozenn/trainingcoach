"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const tsb = payload.find((p) => p.dataKey === "tsb")?.value;
  const totalTss =
    Math.abs(payload.find((p) => p.dataKey === "cyclingTssNeg")?.value ?? 0) +
    Math.abs(payload.find((p) => p.dataKey === "runningTssNeg")?.value ?? 0) +
    Math.abs(payload.find((p) => p.dataKey === "swimmingTssNeg")?.value ?? 0);

  return (
    <div className="pointer-events-none rounded-lg border bg-background/95 backdrop-blur-sm p-2.5 shadow-lg text-xs">
      <p className="font-medium text-sm mb-1.5">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {payload
          .filter((p) => ["ctl", "atl", "tsb"].includes(p.dataKey))
          .map((p) => (
            <div key={p.name} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-muted-foreground">{p.name}</span>
              <span className="font-semibold ml-auto">{Math.round(p.value)}</span>
            </div>
          ))}
        {totalTss > 0 && (
          <div className="flex items-center gap-1.5 col-span-2 border-t pt-1 mt-1">
            <span className="text-muted-foreground">TSS</span>
            <span className="font-semibold ml-auto">{Math.round(totalTss)}</span>
          </div>
        )}
      </div>
      {tsb != null && (
        <p className="mt-1.5 text-muted-foreground border-t pt-1.5">
          {tsbInsight(tsb)}
        </p>
      )}
    </div>
  );
}

export function FitnessChart({ data }: { data: TimelinePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        Sync activities to see your fitness timeline.
      </div>
    );
  }

  // Negate TSS values so bars render downward from the zero line
  const chartData = data.map((d) => ({
    ...d,
    cyclingTssNeg: -(d.cyclingTss ?? 0),
    runningTssNeg: -(d.runningTss ?? 0),
    swimmingTssNeg: -(d.swimmingTss ?? 0),
  }));

  // Calculate domains so the zero line sits around 30% from bottom
  const maxFitness = Math.max(
    ...data.map((d) => Math.max(d.ctl ?? 0, d.atl ?? 0, d.tsb ?? 0))
  );
  const minTsb = Math.min(...data.map((d) => d.tsb ?? 0));
  const maxTss = Math.max(
    ...data.map((d) => (d.cyclingTss ?? 0) + (d.runningTss ?? 0) + (d.swimmingTss ?? 0))
  );

  // Upper domain: max of CTL/ATL with padding
  const upperDomain = Math.ceil((maxFitness * 1.15) / 10) * 10;
  // Lower domain: enough room for TSS bars below zero + TSB if negative
  const lowerDomain = -Math.ceil((Math.max(maxTss * 1.1, Math.abs(minTsb) * 1.2)) / 10) * 10;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={chartData}
        margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-muted/50"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[lowerDomain, upperDomain]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
          allowEscapeViewBox={{ x: true, y: true }}
          offset={20}
        />

        {/* Zero reference line — divides fitness metrics from activity bars */}
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />

        {/* Activity TSS bars below the zero line (negated values, stacked) */}
        <Bar
          dataKey="cyclingTssNeg"
          name="Cycling"
          stackId="tss"
          fill="#3b82f6"
          opacity={0.7}
          radius={[0, 0, 0, 0]}
          maxBarSize={8}
        />
        <Bar
          dataKey="runningTssNeg"
          name="Running"
          stackId="tss"
          fill="#22c55e"
          opacity={0.7}
          radius={[0, 0, 0, 0]}
          maxBarSize={8}
        />
        <Bar
          dataKey="swimmingTssNeg"
          name="Swimming"
          stackId="tss"
          fill="#14b8a6"
          opacity={0.7}
          radius={[0, 0, 0, 0]}
          maxBarSize={8}
        />

        {/* PMC lines above the zero line */}
        <Line
          type="monotone"
          dataKey="ctl"
          name="Fitness"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="atl"
          name="Fatigue"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="tsb"
          name="Form"
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

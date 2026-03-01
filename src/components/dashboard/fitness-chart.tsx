"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const tsb = payload.find((p) => p.name === "Form (TSB)")?.value;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{Math.round(p.value)}</span>
          </div>
        ))}
      </div>
      {tsb != null && (
        <p className="mt-2 text-xs text-muted-foreground">
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

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis yAxisId="tss" orientation="right" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="fitness" tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />

        <ReferenceLine yAxisId="fitness" y={0} stroke="#6b7280" strokeDasharray="3 3" />

        {/* Stacked TSS bars */}
        <Bar yAxisId="tss" dataKey="cyclingTss" name="Cycling TSS" stackId="tss" fill="#3b82f6" opacity={0.6} />
        <Bar yAxisId="tss" dataKey="runningTss" name="Running TSS" stackId="tss" fill="#22c55e" opacity={0.6} />
        <Bar yAxisId="tss" dataKey="swimmingTss" name="Swimming TSS" stackId="tss" fill="#14b8a6" opacity={0.6} />

        {/* PMC lines */}
        <Line yAxisId="fitness" type="monotone" dataKey="ctl" name="Fitness (CTL)" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line yAxisId="fitness" type="monotone" dataKey="atl" name="Fatigue (ATL)" stroke="#ef4444" strokeWidth={2} dot={false} />
        <Line yAxisId="fitness" type="monotone" dataKey="tsb" name="Form (TSB)" stroke="#22c55e" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

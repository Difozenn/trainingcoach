"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const zoneColors = [
  "#6b7280", // Z1 - gray (recovery)
  "#3b82f6", // Z2 - blue (endurance)
  "#22c55e", // Z3 - green (tempo)
  "#eab308", // Z4 - yellow (threshold)
  "#f97316", // Z5 - orange (VO2max)
  "#ef4444", // Z6 - red (anaerobic)
  "#dc2626", // Z7 - dark red (neuromuscular)
];

export function ZoneChart({
  distribution,
  sport,
}: {
  distribution: number[];
  sport: string;
}) {
  const zoneLabels =
    sport === "swimming"
      ? ["Z1", "Z2", "Z3", "Z4", "Z5"]
      : sport === "running"
        ? ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6"]
        : ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z7"];

  const data = distribution.map((pct, i) => ({
    zone: zoneLabels[i] ?? `Z${i + 1}`,
    percentage: Math.round(pct * 100) / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="zone" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, "Time"]}
        />
        <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={zoneColors[index] ?? "#6b7280"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

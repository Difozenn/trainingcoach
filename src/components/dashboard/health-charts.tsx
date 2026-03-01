"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type HealthPoint = {
  date: string;
  value: number | null;
};

export function HealthTrendChart({
  data,
  color,
  unit,
  label,
}: {
  data: HealthPoint[];
  color: string;
  unit: string;
  label: string;
}) {
  const filtered = data.filter((d) => d.value != null);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Connect Garmin to track {label.toLowerCase()}.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={filtered} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number | undefined) => [`${Math.round(value ?? 0)} ${unit}`, label]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

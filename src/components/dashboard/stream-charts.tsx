"use client";

import {
  AreaChart,
  Area,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatStreamTime } from "@/lib/data/helpers";

type StreamPoint = {
  time: number; // seconds
  value: number | null;
};

type StreamChartProps = {
  data: StreamPoint[];
  color: string;
  label: string;
  unit: string;
  height?: number;
  referenceLine?: { value: number; label: string };
  variant?: "area" | "line";
  gradientId?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  if (val == null) return null;
  return (
    <div className="rounded-md border bg-background/95 backdrop-blur-sm px-2.5 py-1 shadow-sm text-xs">
      <span className="font-medium">{Math.round(val)}{unit}</span>
      <span className="ml-2 text-muted-foreground">{formatStreamTime(label as number)}</span>
    </div>
  );
}

function StreamChart({
  data,
  color,
  label,
  unit,
  height = 160,
  referenceLine,
  variant = "area",
  gradientId,
}: StreamChartProps) {
  const gId = gradientId ?? `grad-${label.toLowerCase().replace(/\s/g, "-")}`;

  if (data.length === 0) return null;

  const Chart = variant === "area" ? AreaChart : LineChart;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {referenceLine && (
          <span className="text-xs text-muted-foreground">
            {referenceLine.label}: {referenceLine.value}{unit}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            tickFormatter={formatStreamTime}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            minTickGap={60}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={<ChartTooltip unit={unit} />}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          {referenceLine && (
            <ReferenceLine
              y={referenceLine.value}
              stroke={color}
              strokeDasharray="6 3"
              strokeOpacity={0.6}
              strokeWidth={1.5}
            />
          )}
          {variant === "area" ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gId})`}
              dot={false}
              activeDot={{ r: 2, strokeWidth: 0, fill: color }}
              isAnimationActive={false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 2, strokeWidth: 0, fill: color }}
              isAnimationActive={false}
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Downsampler ─────────────────────────────────────────────────────

function downsample(
  data: StreamPoint[],
  maxPoints: number = 500
): StreamPoint[] {
  if (data.length <= maxPoints) return data;
  const bucketSize = Math.ceil(data.length / maxPoints);
  const result: StreamPoint[] = [];
  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    const validValues = bucket.filter((p) => p.value != null);
    if (validValues.length > 0) {
      const avg =
        validValues.reduce((sum, p) => sum + (p.value ?? 0), 0) /
        validValues.length;
      result.push({ time: bucket[0].time, value: Math.round(avg * 10) / 10 });
    } else {
      result.push({ time: bucket[0].time, value: null });
    }
  }
  return result;
}

// ── Exported component ──────────────────────────────────────────────

export type StreamData = {
  secondOffset: number;
  powerWatts: number | null;
  heartRate: number | null;
  cadenceRpm: number | null;
  altitudeMeters: number | null;
}[];

export function ActivityStreamCharts({
  streams,
  ftp,
  sport,
}: {
  streams: StreamData;
  ftp?: number | null;
  sport: string;
}) {
  if (streams.length === 0) return null;

  const hasPower = streams.some((s) => s.powerWatts != null);
  const hasHr = streams.some((s) => s.heartRate != null);
  const hasCadence = streams.some((s) => s.cadenceRpm != null);
  const hasAltitude = streams.some((s) => s.altitudeMeters != null);

  const powerData = hasPower
    ? downsample(
        streams.map((s) => ({ time: s.secondOffset, value: s.powerWatts }))
      )
    : [];

  const hrData = hasHr
    ? downsample(
        streams.map((s) => ({ time: s.secondOffset, value: s.heartRate }))
      )
    : [];

  const cadenceData = hasCadence
    ? downsample(
        streams.map((s) => ({
          time: s.secondOffset,
          value: s.cadenceRpm != null ? Math.round(s.cadenceRpm) : null,
        }))
      )
    : [];

  const altData = hasAltitude
    ? downsample(
        streams.map((s) => ({ time: s.secondOffset, value: s.altitudeMeters }))
      )
    : [];

  return (
    <div className="space-y-4">
      {hasPower && (
        <StreamChart
          data={powerData}
          color="#3b82f6"
          label="Power"
          unit="W"
          height={160}
          referenceLine={ftp ? { value: ftp, label: "FTP" } : undefined}
          gradientId="power-grad"
        />
      )}
      {hasHr && (
        <StreamChart
          data={hrData}
          color="#ef4444"
          label="Heart Rate"
          unit=" bpm"
          height={160}
          gradientId="hr-grad"
        />
      )}
      {hasCadence && (
        <StreamChart
          data={cadenceData}
          color="#f59e0b"
          label={sport === "running" ? "Cadence" : "Cadence"}
          unit={sport === "running" ? " spm" : " rpm"}
          height={120}
          variant="line"
          gradientId="cad-grad"
        />
      )}
      {hasAltitude && (
        <StreamChart
          data={altData}
          color="#6b7280"
          label="Elevation"
          unit="m"
          height={120}
          gradientId="alt-grad"
        />
      )}
    </div>
  );
}

// ── Breakthrough Chart (W'bal / MPA) ────────────────────────────────

type BreakthroughPoint = {
  time: number;
  power: number;
  mpa: number;
  wbal: number;
  isBreakthrough: boolean;
};

function BreakthroughTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const power = payload.find((p) => p.dataKey === "power")?.value;
  const mpa = payload.find((p) => p.dataKey === "mpa")?.value;
  const wbal = payload.find((p) => p.dataKey === "wbal")?.value;
  return (
    <div className="rounded-md border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-sm text-xs space-y-0.5">
      <div className="text-muted-foreground">{formatStreamTime(label as number)}</div>
      {power != null && (
        <div><span className="font-medium text-blue-500">{Math.round(power)}W</span> Power</div>
      )}
      {mpa != null && (
        <div><span className="font-medium text-orange-500">{Math.round(mpa)}W</span> MPA</div>
      )}
      {wbal != null && (
        <div><span className="font-medium text-emerald-500">{(wbal / 1000).toFixed(1)}kJ</span> W&apos;bal</div>
      )}
    </div>
  );
}

export function BreakthroughChart({
  data,
  ftp,
}: {
  data: BreakthroughPoint[];
  ftp: number;
}) {
  if (data.length === 0) return null;

  const hasBreakthrough = data.some((d) => d.isBreakthrough);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          W&apos;bal / MPA
        </span>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Power
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> MPA
          </span>
          {hasBreakthrough && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Breakthrough
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="power-bt-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            tickFormatter={formatStreamTime}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            minTickGap={60}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={<BreakthroughTooltip />}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <ReferenceLine
            y={ftp}
            stroke="#6b7280"
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            strokeWidth={1}
            label={{ value: "FTP", position: "insideTopRight", fontSize: 10, fill: "#6b7280" }}
          />
          <Area
            type="monotone"
            dataKey="power"
            stroke="#3b82f6"
            strokeWidth={1}
            fill="url(#power-bt-grad)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="mpa"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

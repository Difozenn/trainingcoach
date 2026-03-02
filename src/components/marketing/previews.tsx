import {
  Bike,
  Footprints,
  Waves,
  Heart,
  Moon,
  Activity,
  TrendingUp,
  Dumbbell,
  Download,
} from "lucide-react";

function BrowserFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-card shadow-2xl ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <div className="ml-2 h-5 flex-1 rounded bg-muted/80" />
      </div>
      {children}
    </div>
  );
}

/* ─── Fitness Chart SVG ─── */
function FitnessChartSvg() {
  return (
    <svg
      viewBox="0 0 400 130"
      className="w-full"
      role="img"
      aria-label="Fitness timeline chart showing CTL, ATL, and TSB curves"
    >
      {/* Grid */}
      <line x1="0" y1="32" x2="400" y2="32" stroke="currentColor" opacity="0.06" />
      <line x1="0" y1="65" x2="400" y2="65" stroke="currentColor" opacity="0.06" />
      <line x1="0" y1="98" x2="400" y2="98" stroke="currentColor" opacity="0.06" />

      {/* TSS bars (bottom) */}
      {[20, 50, 80, 110, 140, 165, 195, 220, 250, 275, 305, 330, 360, 385].map(
        (x, i) => (
          <rect
            key={x}
            x={x}
            y={130 - [18, 28, 22, 35, 15, 30, 25, 38, 20, 32, 28, 40, 24, 36][i]}
            width="10"
            height={[18, 28, 22, 35, 15, 30, 25, 38, 20, 32, 28, 40, 24, 36][i]}
            rx="2"
            className="fill-primary/15"
          />
        )
      )}

      {/* CTL area (blue) */}
      <path
        d="M 0,98 C 40,95 80,88 120,80 S 200,65 240,56 S 320,44 360,38 L 400,35 L 400,130 L 0,130 Z"
        fill="rgba(59,130,246,0.1)"
      />
      <path
        d="M 0,98 C 40,95 80,88 120,80 S 200,65 240,56 S 320,44 360,38 L 400,35"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ATL line (orange/red) */}
      <path
        d="M 0,92 C 18,78 35,90 55,74 S 85,86 105,66 S 135,80 155,58 S 185,72 205,50 S 235,64 255,44 S 285,56 305,40 S 340,50 370,34 L 400,40"
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* TSB line (green) */}
      <path
        d="M 0,62 C 40,58 80,65 120,55 S 200,60 240,50 S 320,55 360,46 L 400,50"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Legend */}
      <circle cx="15" cy="10" r="4" fill="#3b82f6" />
      <text x="24" y="14" fontSize="9" className="fill-muted-foreground">
        Fitness (CTL)
      </text>
      <circle cx="115" cy="10" r="4" fill="#f97316" />
      <text x="124" y="14" fontSize="9" className="fill-muted-foreground">
        Fatigue (ATL)
      </text>
      <circle cx="215" cy="10" r="4" fill="#22c55e" />
      <text x="224" y="14" fontSize="9" className="fill-muted-foreground">
        Form (TSB)
      </text>
    </svg>
  );
}

/* ─── Mini line chart for health metrics ─── */
function MiniChart({
  color,
  // A simplified path for each health metric
  path,
}: {
  color: string;
  path: string;
}) {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-10">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Exported Preview Components ─── */

export function DashboardHeroPreview() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-4">
        {/* Metric cards row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground">Fitness (CTL)</p>
            <p className="text-xl font-bold">72</p>
            <p className="text-[10px] text-emerald-500 font-medium">+2.1/wk</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground">Fatigue (ATL)</p>
            <p className="text-xl font-bold">58</p>
            <p className="text-[10px] text-muted-foreground">7-day load</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground">Form (TSB)</p>
            <p className="text-xl font-bold text-emerald-600">+14</p>
            <p className="text-[10px] text-emerald-500 font-medium">Fresh</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground">Weekly TSS</p>
            <p className="text-xl font-bold">485</p>
            <div className="flex gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold">Performance Timeline</p>
            <div className="flex gap-1">
              {["30d", "90d", "6m", "1y"].map((r) => (
                <span
                  key={r}
                  className={`rounded px-1.5 py-0.5 text-[9px] ${r === "90d" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <FitnessChartSvg />
        </div>

        {/* Activity list */}
        <div className="rounded-lg border p-3 space-y-0">
          <p className="text-xs font-semibold mb-2">Recent Activities</p>
          {[
            { Icon: Bike, name: "Morning Ride", time: "1h 45min", dist: "52km", tss: 67, color: "text-blue-500" },
            { Icon: Footprints, name: "Tempo Run", time: "48min", dist: "9.2km", tss: 52, color: "text-green-500" },
            { Icon: Waves, name: "Pool Session", time: "35min", dist: "1,800m", tss: 38, color: "text-teal-500" },
          ].map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-3 border-t py-2 first:border-0 first:pt-0"
            >
              <a.Icon className={`h-4 w-4 ${a.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {a.time} &middot; {a.dist}
                </p>
              </div>
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {a.tss} TSS
              </span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function FitnessChartPreview() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Fitness Timeline</p>
            <p className="text-[10px] text-muted-foreground">
              Performance Management Chart
            </p>
          </div>
          <div className="flex gap-1">
            {["30d", "90d", "6m", "1y", "All"].map((r) => (
              <span
                key={r}
                className={`rounded px-2 py-0.5 text-[10px] ${r === "6m" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        <FitnessChartSvg />
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Peak Fitness</p>
            <p className="text-sm font-bold">78 CTL</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Current Form</p>
            <p className="text-sm font-bold text-emerald-600">+14 TSB</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Training Days</p>
            <p className="text-sm font-bold">142</p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

export function WorkoutPlanPreview() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        {/* Week header */}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">This Week&apos;s Plan</p>
            <span className="rounded bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
              Build Phase
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Target</p>
              <p className="text-sm font-bold">520 TSS</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Actual</p>
              <p className="text-sm font-bold">385 TSS</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Progress</p>
              <p className="text-sm font-bold">3/5</p>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: "74%" }} />
          </div>
        </div>

        {/* Workout cards */}
        {[
          {
            Icon: Bike,
            color: "text-blue-500",
            title: "Sweet Spot Intervals",
            badge: "Build",
            badgeColor: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
            desc: "3x12min at 88-93% FTP with 5min recovery",
            dur: "60min",
            tss: "~68",
            done: false,
          },
          {
            Icon: Footprints,
            color: "text-green-500",
            title: "Tempo Run",
            badge: "Threshold",
            badgeColor: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400",
            desc: "20min warm-up, 25min at threshold pace, 10min cool-down",
            dur: "55min",
            tss: "~52",
            done: true,
          },
          {
            Icon: Bike,
            color: "text-blue-500",
            title: "Endurance Ride",
            badge: "Base",
            badgeColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
            desc: "Steady Zone 2 ride, keep HR below LT1",
            dur: "90min",
            tss: "~75",
            done: false,
          },
        ].map((w) => (
          <div
            key={w.title}
            className={`rounded-lg border p-3 space-y-1.5 ${w.done ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" : ""}`}
          >
            <div className="flex items-center gap-2">
              <w.Icon className={`h-4 w-4 ${w.color}`} />
              <span className="text-xs font-semibold flex-1">{w.title}</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${w.badgeColor}`}>
                {w.badge}
              </span>
              {w.done && (
                <span className="rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                  Done
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{w.desc}</p>
            <div className="flex gap-3">
              <span className="text-[10px] text-muted-foreground">{w.dur}</span>
              <span className="text-[10px] text-muted-foreground">TSS {w.tss}</span>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

export function NutritionPreview() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Today&apos;s Nutrition</p>
          <div className="flex gap-1.5">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Hard Training Day
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ~520 TSS
            </span>
          </div>
        </div>

        {/* Macro cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Calories</p>
            <p className="text-lg font-bold">2,850</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
            <p className="text-[10px] text-amber-600 dark:text-amber-400">Carbs</p>
            <p className="text-lg font-bold">380g</p>
            <p className="text-[9px] text-muted-foreground">5.4 g/kg</p>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
            <p className="text-[10px] text-blue-600 dark:text-blue-400">Protein</p>
            <p className="text-lg font-bold">142g</p>
            <p className="text-[9px] text-muted-foreground">2.0 g/kg</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-center">
            <p className="text-[10px] text-green-600 dark:text-green-400">Fat</p>
            <p className="text-lg font-bold">78g</p>
            <p className="text-[9px] text-muted-foreground">1.1 g/kg</p>
          </div>
        </div>

        {/* Fueling plan */}
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold">Ride Fueling Plan</p>
          <p className="text-[10px] text-muted-foreground">
            Sweet Spot Intervals &middot; 60min
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Carbs/hr</p>
              <p className="text-xs font-bold">80g</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Hydration</p>
              <p className="text-xs font-bold">750ml/hr</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Gluc:Fruc</p>
              <p className="text-xs font-bold">1:0.8</p>
            </div>
          </div>
        </div>

        {/* Recovery */}
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Post-Ride Recovery
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            30g protein + 90g carbs within 30min window
          </p>
        </div>
      </div>
    </BrowserFrame>
  );
}

export function HealthPreview() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        {/* Recovery status */}
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <Heart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold">Recovery Status</p>
              <span className="rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                Good
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              HRV trending up, sleep quality high. Ready for high-intensity work.
            </p>
          </div>
        </div>

        {/* Mini charts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">HRV</p>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400">52ms</p>
            </div>
            <MiniChart
              color="#8b5cf6"
              path="M 0,28 C 10,25 20,30 30,22 S 50,26 60,18 S 80,24 90,15 S 110,20 120,12"
            />
          </div>
          <div className="rounded-lg border p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Resting HR</p>
              <p className="text-xs font-bold text-red-500">48bpm</p>
            </div>
            <MiniChart
              color="#ef4444"
              path="M 0,15 C 10,18 20,14 30,20 S 50,16 60,22 S 80,18 90,24 S 110,20 120,22"
            />
          </div>
          <div className="rounded-lg border p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Sleep</p>
              <p className="text-xs font-bold text-blue-500">87</p>
            </div>
            <MiniChart
              color="#3b82f6"
              path="M 0,22 C 10,18 20,24 30,16 S 50,20 60,14 S 80,18 90,10 S 110,14 120,8"
            />
          </div>
        </div>

        {/* Metric badges */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "HRV Trend", value: "+8%", color: "text-purple-600 dark:text-purple-400" },
            { label: "RHR Trend", value: "-2bpm", color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Sleep Avg", value: "7h 42m", color: "text-blue-600 dark:text-blue-400" },
            { label: "Body Battery", value: "82%", color: "text-amber-600 dark:text-amber-400" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border px-2.5 py-1.5 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
              <span className={`text-[10px] font-bold ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function CalendarPreview() {
  // Mini calendar with activity dots
  const days = [
    null, null, null, null, null, null, 1,
    2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22,
    23, 24, 25, 26, 27, 28, null,
  ];
  // Which days have activities and what sport
  const activities: Record<number, string[]> = {
    2: ["blue"], 4: ["green"], 5: ["blue"], 7: ["teal"],
    9: ["blue", "green"], 11: ["blue"], 12: ["green"], 14: ["teal", "blue"],
    16: ["blue"], 18: ["green"], 19: ["blue"], 21: ["teal"],
    23: ["blue", "green"], 25: ["blue"], 26: ["green"],
  };

  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">March 2026</p>
          <div className="flex gap-1.5">
            <span className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted cursor-default">&larr;</span>
            <span className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted cursor-default">&rarr;</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[9px] text-muted-foreground py-1">
              {d}
            </span>
          ))}
          {days.map((day, i) => (
            <div
              key={i}
              className={`relative rounded py-1 text-[10px] ${
                day === 1
                  ? "bg-primary/10 font-bold ring-1 ring-primary/30"
                  : day
                    ? "hover:bg-muted/50"
                    : ""
              }`}
            >
              {day && (
                <>
                  <span className={day === 1 ? "text-primary" : ""}>{day}</span>
                  {activities[day] && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {activities[day].map((color, j) => (
                        <span
                          key={j}
                          className={`h-1 w-1 rounded-full ${
                            color === "blue"
                              ? "bg-blue-500"
                              : color === "green"
                                ? "bg-green-500"
                                : "bg-teal-500"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function ZonesPreview() {
  const zones = [
    { zone: "Z1", name: "Recovery", range: "< 55%", pct: 15, color: "bg-gray-400" },
    { zone: "Z2", name: "Endurance", range: "56-75%", pct: 45, color: "bg-blue-500" },
    { zone: "Z3", name: "Tempo", range: "76-87%", pct: 70, color: "bg-green-500" },
    { zone: "Z4", name: "Threshold", range: "88-94%", pct: 85, color: "bg-yellow-500" },
    { zone: "Z5", name: "VO2max", range: "95-105%", pct: 55, color: "bg-orange-500" },
    { zone: "Z6", name: "Anaerobic", range: "106-120%", pct: 30, color: "bg-red-500" },
    { zone: "Z7", name: "Sprint", range: "> 120%", pct: 10, color: "bg-red-700" },
  ];

  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Cycling Zones</p>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            FTP: 265W
          </span>
        </div>
        <div className="space-y-1.5">
          {zones.map((z) => (
            <div key={z.zone} className="flex items-center gap-2">
              <span className="w-5 text-[10px] font-bold">{z.zone}</span>
              <span className="w-14 text-[9px] text-muted-foreground truncate">{z.name}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${z.color}`}
                  style={{ width: `${z.pct}%` }}
                />
              </div>
              <span className="w-14 text-right text-[9px] text-muted-foreground font-mono">{z.range}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function ExportPreview() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold">Export Workouts</p>
        {[
          { format: "ZWO", platform: "Zwift", desc: "Structured workout for indoor rides", icon: Bike },
          { format: "FIT", platform: "Garmin", desc: "Native Garmin workout file", icon: Activity },
          { format: "MRC", platform: "TrainerRoad", desc: "Smart trainer ERG mode file", icon: TrendingUp },
          { format: "ICS", platform: "Calendar", desc: "Add to Google / Apple Calendar", icon: Download },
        ].map((e) => (
          <div key={e.format} className="flex items-center gap-3 rounded-lg border p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <e.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{e.platform}</p>
              <p className="text-[10px] text-muted-foreground">{e.desc}</p>
            </div>
            <span className="rounded border px-2 py-0.5 text-[10px] font-mono font-medium">
              .{e.format.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

/**
 * Formatting helpers for dashboard display.
 */

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

export function formatPacePer100m(secPer100m: number): string {
  const min = Math.floor(secPer100m / 60);
  const sec = Math.round(secPer100m % 60);
  return `${min}:${sec.toString().padStart(2, "0")} /100m`;
}

export function sportIcon(sport: string): string {
  switch (sport) {
    case "cycling":
      return "Bike";
    case "running":
      return "Footprints";
    case "swimming":
      return "Waves";
    default:
      return "Activity";
  }
}

export function sportColor(sport: string): string {
  switch (sport) {
    case "cycling":
      return "#3b82f6"; // blue
    case "running":
      return "#22c55e"; // green
    case "swimming":
      return "#14b8a6"; // teal
    default:
      return "#6b7280"; // gray
  }
}

export function tsbInsight(tsb: number): string {
  if (tsb > 25) return "Well rested. Ready for a big training block.";
  if (tsb > 5) return "Fresh — good form for a hard session or race.";
  if (tsb > -10) return "Balanced — maintaining fitness with manageable fatigue.";
  if (tsb > -20) return "Absorbing training well. Recovery tomorrow pays off.";
  if (tsb > -30) return "Accumulating fatigue. Easy day recommended soon.";
  return "Deep fatigue. Recovery day strongly recommended.";
}

export function tsbColor(tsb: number): string {
  if (tsb > 5) return "text-green-600 dark:text-green-400";
  if (tsb > -10) return "text-yellow-600 dark:text-yellow-400";
  if (tsb > -25) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatSpeed(mps: number): string {
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export function formatStreamTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

"use client";

import dynamic from "next/dynamic";

// FitnessChart
export const LazyFitnessChart = dynamic(
  () => import("./fitness-chart").then((m) => m.FitnessChart),
  { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-lg bg-muted/50" /> }
);

// HealthTrendChart
export const LazyHealthTrendChart = dynamic(
  () => import("./health-charts").then((m) => m.HealthTrendChart),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted/50" /> }
);

// Zone trend charts
export const LazyPowerCurveChart = dynamic(
  () => import("./zone-trends").then((m) => m.PowerCurveChart),
  { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-muted/50" /> }
);

export const LazyPowerHrChart = dynamic(
  () => import("./zone-trends").then((m) => m.PowerHrChart),
  { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-muted/50" /> }
);

export const LazyFitnessTrendChart = dynamic(
  () => import("./zone-trends").then((m) => m.FitnessTrendChart),
  { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-muted/50" /> }
);

export const LazyDistanceChart = dynamic(
  () => import("./zone-trends").then((m) => m.DistanceChart),
  { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-muted/50" /> }
);

// PowerProfileTab (dashboard)
export const LazyPowerProfileTab = dynamic(
  () => import("@/app/(dashboard)/profile/power-profile-tab").then((m) => m.PowerProfileTab),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted/50" /> }
);

"use client";

import dynamic from "next/dynamic";

const skeleton = (h: string) => () => <div className={`${h} animate-pulse rounded-lg bg-muted/50`} />;

// FitnessChart (fitness page)
export const LazyFitnessChart = dynamic(
  () => import("./fitness-chart").then((m) => m.FitnessChart),
  { ssr: false, loading: skeleton("h-80") }
);

// HealthTrendChart (health page)
export const LazyHealthTrendChart = dynamic(
  () => import("./health-charts").then((m) => m.HealthTrendChart),
  { ssr: false, loading: skeleton("h-48") }
);

// Zone Analysis yearly charts
export const LazyFitnessByYearChart = dynamic(
  () => import("./zone-trends").then((m) => m.FitnessByYearChart),
  { ssr: false, loading: skeleton("h-[280px]") }
);

export const LazyDistanceByYearChart = dynamic(
  () => import("./zone-trends").then((m) => m.DistanceByYearChart),
  { ssr: false, loading: skeleton("h-[280px]") }
);

export const LazyPowerHrByYearChart = dynamic(
  () => import("./zone-trends").then((m) => m.PowerHrByYearChart),
  { ssr: false, loading: skeleton("h-[280px]") }
);

export const LazyPowerCurveByYearChart = dynamic(
  () => import("./zone-trends").then((m) => m.PowerCurveByYearChart),
  { ssr: false, loading: skeleton("h-[280px]") }
);

// PowerProfileTab (dashboard)
export const LazyPowerProfileTab = dynamic(
  () => import("@/app/(dashboard)/profile/power-profile-tab").then((m) => m.PowerProfileTab),
  { ssr: false, loading: skeleton("h-64") }
);

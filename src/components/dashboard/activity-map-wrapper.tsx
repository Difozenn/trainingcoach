"use client";

import dynamic from "next/dynamic";

const ActivityMap = dynamic(
  () =>
    import("@/components/dashboard/activity-map").then(
      (mod) => mod.ActivityMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted" />
    ),
  }
);

export function ActivityMapWrapper({
  gpsPoints,
  color,
}: {
  gpsPoints: { lat: number; lng: number }[];
  color?: string;
}) {
  return <ActivityMap gpsPoints={gpsPoints} color={color} />;
}

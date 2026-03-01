"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const ranges = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "6m", days: 180 },
  { label: "1y", days: 365 },
  { label: "All", days: 9999 },
];

export function RangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = Number(searchParams.get("days")) || 90;

  return (
    <div className="flex gap-1">
      {ranges.map((r) => (
        <Button
          key={r.label}
          variant={current === r.days ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.set("days", String(r.days));
            router.push(`?${params}`);
          }}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}

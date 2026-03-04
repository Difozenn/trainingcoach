"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BreakthroughPrompt({
  currentFtp,
  newFtp,
  breakthroughWatts,
  breakthroughTime,
  activityId,
  updateAction,
}: {
  currentFtp: number;
  newFtp: number;
  breakthroughWatts: number;
  breakthroughTime: string;
  activityId: string;
  updateAction: (newFtp: number) => Promise<void>;
}) {
  const [dismissed, setDismissed] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const key = `dismissed_breakthrough_${activityId}`;
    setDismissed(localStorage.getItem(key) === "true");
  }, [activityId]);

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(`dismissed_breakthrough_${activityId}`, "true");
    setDismissed(true);
  }

  async function handleUpdate() {
    setUpdating(true);
    try {
      await updateAction(newFtp);
      localStorage.setItem(`dismissed_breakthrough_${activityId}`, "true");
      setDismissed(true);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <Zap className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1">
        <span className="font-semibold">Breakthrough Detected</span> — You
        exceeded your predicted power ceiling by{" "}
        <span className="font-bold">{breakthroughWatts}W</span> at{" "}
        {breakthroughTime}. Your FTP may have increased from{" "}
        <span className="font-medium">{currentFtp}W</span> →{" "}
        <span className="font-bold">{newFtp}W</span>.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          Dismiss
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={updating}>
          {updating ? "Updating..." : `Update FTP to ${newFtp}`}
        </Button>
      </div>
    </div>
  );
}

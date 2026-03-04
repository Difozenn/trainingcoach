"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaxHrPrompt({
  currentMaxHr,
  recordedMaxHr,
  activityDate,
  updateAction,
}: {
  currentMaxHr: number;
  recordedMaxHr: number;
  activityDate: string;
  updateAction: (newMaxHr: number) => Promise<void>;
}) {
  const [dismissed, setDismissed] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const key = `dismissed_max_hr_${recordedMaxHr}`;
    setDismissed(localStorage.getItem(key) === "true");
  }, [recordedMaxHr]);

  if (dismissed || recordedMaxHr <= currentMaxHr) return null;

  function handleDismiss() {
    localStorage.setItem(`dismissed_max_hr_${recordedMaxHr}`, "true");
    setDismissed(true);
  }

  async function handleUpdate() {
    setUpdating(true);
    try {
      await updateAction(recordedMaxHr);
      setDismissed(true);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
      <p className="flex-1">
        A ride on <span className="font-medium">{activityDate}</span> recorded a
        max HR of <span className="font-bold">{recordedMaxHr} bpm</span>, higher
        than your current setting of {currentMaxHr} bpm. Update your max HR?
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          Dismiss
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={updating}>
          {updating ? "Updating..." : `Set to ${recordedMaxHr}`}
        </Button>
      </div>
    </div>
  );
}

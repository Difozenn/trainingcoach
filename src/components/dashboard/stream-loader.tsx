"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, BarChart3 } from "lucide-react";

type LoadState = "loading" | "error" | "no_streams" | "done";

export function StreamLoader({ activityId }: { activityId: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fetchedRef = useRef(false);

  async function fetchStreams() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/activities/${activityId}/fetch-streams`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to fetch streams");
        setState("error");
        return;
      }
      if (data.status === "no_streams_available") {
        setState("no_streams");
        return;
      }
      setState("done");
      router.refresh();
    } catch {
      setError("Network error — check your connection");
      setState("error");
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="relative">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
          <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Loading activity data from Strava...</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fetching power, heart rate, GPS, and elevation streams
          </p>
        </div>
        <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/60" />
        </div>
      </div>
    );
  }

  if (state === "no_streams") {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No detailed data available for this activity on Strava
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive/60" />
        <div>
          <p className="text-sm font-medium">Failed to load streams</p>
          {error && (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          )}
        </div>
        <Button onClick={fetchStreams} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return null;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3 } from "lucide-react";

export function FetchStreamsButton({ activityId }: { activityId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/activities/${activityId}/fetch-streams`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to fetch streams");
        return;
      }
      if (data.status === "no_streams_available") {
        setError("No detailed data available for this activity on Strava");
        return;
      }
      // Refresh the page to show the new data
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <BarChart3 className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">Charts & map not loaded yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Detailed data (power, HR, GPS) needs to be fetched from Strava
        </p>
      </div>
      <Button onClick={handleFetch} disabled={loading} size="sm">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fetching from Strava...
          </>
        ) : (
          "Load charts & map"
        )}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

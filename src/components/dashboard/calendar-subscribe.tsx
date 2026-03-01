"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CalendarSubscribe() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchToken() {
    setLoading(true);
    const res = await fetch("/api/calendar/token");
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
    }
    setLoading(false);
  }

  async function generateToken() {
    setLoading(true);
    const res = await fetch("/api/calendar/token", { method: "POST" });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
    }
    setLoading(false);
  }

  function getSubscribeUrl() {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/api/calendar/${token}`;
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(getSubscribeUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Calendar Subscription</h3>
      <p className="text-sm text-muted-foreground">
        Subscribe to your training plan in any calendar app (Google Calendar,
        Apple Calendar, Outlook). Workouts auto-update when your plan changes.
      </p>

      {!token ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchToken} disabled={loading}>
            {loading ? "Loading..." : "Get Calendar URL"}
          </Button>
          <Button variant="outline" onClick={generateToken} disabled={loading}>
            Generate New URL
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={getSubscribeUrl()} className="font-mono text-xs" />
            <Button variant="outline" onClick={copyUrl}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add this URL to your calendar app as a subscription. Keep it private
            — anyone with this link can see your training plan.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateToken}
            disabled={loading}
          >
            Regenerate URL (invalidates old link)
          </Button>
        </div>
      )}
    </div>
  );
}

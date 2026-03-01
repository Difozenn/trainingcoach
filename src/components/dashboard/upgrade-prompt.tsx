"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  { name: "Fitness Timeline", desc: "CTL/ATL/TSB performance tracking" },
  { name: "Coaching Engine", desc: "AI-free rule-based weekly workout plans" },
  { name: "Nutrition Targets", desc: "Daily macros and ride fueling plans" },
  { name: "Workout Export", desc: "ZWO, FIT, MRC/ERG, ICS file export" },
  { name: "Health Tracking", desc: "HRV, sleep, resting HR trends" },
  { name: "Unlimited History", desc: "Access all your historical data" },
];

export function UpgradePrompt({ feature }: { feature?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {feature ? `${feature} is a Pro Feature` : "Upgrade to Pro"}
          </CardTitle>
          <CardDescription>
            Unlock the full training experience for $9.99/month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f.name} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  &#10003;
                </span>
                <div>
                  <p className="font-medium text-sm">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Cancel anytime. 7-day free trial included.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

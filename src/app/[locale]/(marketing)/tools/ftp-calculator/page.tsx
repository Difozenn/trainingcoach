"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, Info } from "lucide-react";

type TestType = "20min" | "8min" | "ramp";

const factors: Record<TestType, number> = {
  "20min": 0.95,
  "8min": 0.9,
  ramp: 0.75,
};

const testLabels: Record<TestType, string> = {
  "20min": "20-Minute Test",
  "8min": "8-Minute Test",
  ramp: "Ramp Test (max 1-min)",
};

export default function FtpCalculatorPage() {
  const t = useTranslations("Header");
  const [testType, setTestType] = useState<TestType>("20min");
  const [power, setPower] = useState("");
  const [ftp, setFtp] = useState<number | null>(null);

  function calculate() {
    const watts = parseFloat(power);
    if (!isNaN(watts) && watts > 0) {
      setFtp(Math.round(watts * factors[testType]));
    }
  }

  return (
    <main className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            FTP Calculator
          </h1>
          <p className="mt-3 text-muted-foreground">
            Calculate your Functional Threshold Power from a 20-minute, 8-minute, or ramp test.
          </p>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Calculate Your FTP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Test Protocol</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(testLabels) as [TestType, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setTestType(key);
                        setFtp(null);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        testType === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="power">
                Average Power During Test (watts)
              </Label>
              <div className="flex gap-3">
                <Input
                  id="power"
                  type="number"
                  min="50"
                  max="1000"
                  placeholder="e.g. 280"
                  value={power}
                  onChange={(e) => {
                    setPower(e.target.value);
                    setFtp(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && calculate()}
                />
                <Button onClick={calculate} disabled={!power}>
                  Calculate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {testType === "20min" && "Average power for a 20-minute all-out effort. FTP = power x 0.95"}
                {testType === "8min" && "Average power for an 8-minute all-out effort. FTP = power x 0.90"}
                {testType === "ramp" && "Best 1-minute average power from a ramp test. FTP = power x 0.75"}
              </p>
            </div>

            {ftp !== null && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">Your estimated FTP</p>
                <p className="mt-1 text-5xl font-bold text-primary">{ftp}W</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Based on {testLabels[testType]} at {power}W (x {factors[testType]})
                </p>
                <div className="mt-4">
                  <Button size="sm" asChild>
                    <Link href="/register">
                      Get your full training zones <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO content */}
        <div className="prose prose-neutral dark:prose-invert mx-auto">
          <h2>What is FTP?</h2>
          <p>
            Functional Threshold Power (FTP) is the highest average power you can sustain for approximately one hour. It represents the boundary between sustainable aerobic effort and unsustainable anaerobic effort. FTP is the foundation for all power-based training zones in cycling.
          </p>

          <h2>How is FTP Calculated?</h2>
          <p>
            Since a true 1-hour all-out effort is extremely demanding, most cyclists estimate FTP using shorter test protocols:
          </p>
          <ul>
            <li><strong>20-Minute Test:</strong> The most common protocol. Ride as hard as you can sustain for 20 minutes, then multiply your average power by 0.95. This accounts for the slightly higher intensity you can hold for 20 minutes versus a full hour.</li>
            <li><strong>8-Minute Test:</strong> Two 8-minute all-out efforts with recovery between. Average power is multiplied by 0.90. Less fatiguing than the 20-minute test but slightly less accurate.</li>
            <li><strong>Ramp Test:</strong> Power increases by a set amount every minute until failure. Your best 1-minute power is multiplied by 0.75. The easiest test to execute but the least precise.</li>
          </ul>

          <h2>Why Does FTP Matter?</h2>
          <p>
            FTP is the anchor for your entire training plan. Your seven Coggan training zones are defined as percentages of FTP. Without an accurate FTP, your workouts will be too easy or too hard, and your Training Stress Score (TSS) calculations will be off.
          </p>
          <ul>
            <li>Sets your 7 power training zones</li>
            <li>Calculates Intensity Factor (IF) for every ride</li>
            <li>Determines Training Stress Score (TSS)</li>
            <li>Tracks fitness progression over time</li>
          </ul>

          <div className="not-prose mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">Track your FTP automatically</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paincave auto-detects your FTP from Strava activities using a rolling 90-day window. No manual testing required.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/register">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

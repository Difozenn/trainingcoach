"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp } from "lucide-react";

export default function TssCalculatorPage() {
  const [np, setNp] = useState("");
  const [ftp, setFtp] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [result, setResult] = useState<{
    tss: number;
    intensityFactor: number;
  } | null>(null);

  function calculate() {
    const npVal = parseFloat(np);
    const ftpVal = parseFloat(ftp);
    const h = parseFloat(hours) || 0;
    const m = parseFloat(minutes) || 0;
    const durationSeconds = h * 3600 + m * 60;

    if (npVal > 0 && ftpVal > 0 && durationSeconds > 0) {
      const intensityFactor = npVal / ftpVal;
      const tss = (durationSeconds * npVal * intensityFactor) / (ftpVal * 3600) * 100;
      setResult({
        tss: Math.round(tss),
        intensityFactor: Math.round(intensityFactor * 100) / 100,
      });
    }
  }

  function getTssDescription(tss: number): string {
    if (tss < 150) return "Low — recoverable within a day";
    if (tss < 300) return "Medium — some residual fatigue the next day";
    if (tss < 450) return "High — fatigue lasting 2+ days likely";
    return "Very high — extended recovery needed";
  }

  return (
    <main className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            TSS Calculator
          </h1>
          <p className="mt-3 text-muted-foreground">
            Calculate Training Stress Score from your ride data — Normalized Power, FTP, and duration.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Ride Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="np">Normalized Power (watts)</Label>
                <Input
                  id="np"
                  type="number"
                  min="1"
                  placeholder="e.g. 220"
                  value={np}
                  onChange={(e) => {
                    setNp(e.target.value);
                    setResult(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ftp">FTP (watts)</Label>
                <Input
                  id="ftp"
                  type="number"
                  min="1"
                  placeholder="e.g. 250"
                  value={ftp}
                  onChange={(e) => {
                    setFtp(e.target.value);
                    setResult(null);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ride Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="Hours"
                  value={hours}
                  onChange={(e) => {
                    setHours(e.target.value);
                    setResult(null);
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">h</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Min"
                  value={minutes}
                  onChange={(e) => {
                    setMinutes(e.target.value);
                    setResult(null);
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">min</span>
                <Button onClick={calculate} className="ml-auto">
                  Calculate
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              TSS = (seconds x NP x IF) / (FTP x 3600) x 100 &nbsp;|&nbsp; IF = NP / FTP
            </p>

            {result && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
                <div className="grid gap-4 text-center sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Training Stress Score</p>
                    <p className="text-5xl font-bold text-primary">{result.tss}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getTssDescription(result.tss)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Intensity Factor</p>
                    <p className="text-5xl font-bold text-primary">{result.intensityFactor}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.intensityFactor < 0.75 && "Recovery / endurance pace"}
                      {result.intensityFactor >= 0.75 && result.intensityFactor < 0.9 && "Tempo effort"}
                      {result.intensityFactor >= 0.9 && result.intensityFactor < 1.05 && "Threshold effort"}
                      {result.intensityFactor >= 1.05 && "Above threshold"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Button size="sm" asChild>
                    <Link href="/register">
                      Track TSS automatically from Strava <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO content */}
        <div className="prose prose-neutral dark:prose-invert mx-auto">
          <h2>What is Training Stress Score (TSS)?</h2>
          <p>
            Training Stress Score (TSS) quantifies the physiological cost of a workout on a single scale. Developed by Dr. Andrew Coggan, it combines workout duration, intensity, and your personal fitness level (FTP) into one number.
          </p>
          <p>
            A TSS of 100 equals the stress of riding at your FTP for exactly one hour. An easy 2-hour ride might score 80 TSS, while a hard 1-hour criterium could score 120+.
          </p>

          <h2>The TSS Formula</h2>
          <p>TSS is calculated as:</p>
          <p className="rounded-lg bg-muted p-4 text-center font-mono">
            TSS = (duration in seconds x NP x IF) / (FTP x 3600) x 100
          </p>
          <p>Where:</p>
          <ul>
            <li><strong>NP</strong> = Normalized Power — a weighted average that accounts for the variability of your effort</li>
            <li><strong>IF</strong> = Intensity Factor = NP / FTP — how hard the ride was relative to your threshold</li>
            <li><strong>FTP</strong> = Functional Threshold Power — your personal baseline</li>
          </ul>

          <h2>How to Use TSS</h2>
          <ul>
            <li><strong>&lt;150 TSS:</strong> Low stress, recoverable within 24 hours</li>
            <li><strong>150–300 TSS:</strong> Medium stress, some residual fatigue next day</li>
            <li><strong>300–450 TSS:</strong> High stress, likely need 2+ days recovery</li>
            <li><strong>&gt;450 TSS:</strong> Very high, extended recovery required</li>
          </ul>
          <p>
            Daily TSS feeds into your Chronic Training Load (CTL = fitness), Acute Training Load (ATL = fatigue), and Training Stress Balance (TSB = form). These three metrics form the Performance Management Chart — the most powerful tool for managing training load over time.
          </p>

          <div className="not-prose mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">Automatic TSS from every ride</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paincave calculates TSS, CTL, ATL, and TSB automatically from your Strava data. See your full fitness timeline with zero manual input.
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

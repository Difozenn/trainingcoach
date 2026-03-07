"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Target } from "lucide-react";

const zones = [
  { zone: 1, name: "Active Recovery", low: 0, high: 0.55, color: "bg-gray-500" },
  { zone: 2, name: "Endurance", low: 0.55, high: 0.75, color: "bg-blue-500" },
  { zone: 3, name: "Tempo", low: 0.75, high: 0.9, color: "bg-green-500" },
  { zone: 4, name: "Threshold", low: 0.9, high: 1.05, color: "bg-yellow-500" },
  { zone: 5, name: "VO2max", low: 1.05, high: 1.2, color: "bg-orange-500" },
  { zone: 6, name: "Anaerobic", low: 1.2, high: 1.5, color: "bg-red-500" },
  { zone: 7, name: "Neuromuscular", low: 1.5, high: null, color: "bg-purple-500" },
];

export default function PowerZonesPage() {
  const [ftp, setFtp] = useState("");
  const [computed, setComputed] = useState<number | null>(null);

  function calculate() {
    const val = parseFloat(ftp);
    if (!isNaN(val) && val > 0) setComputed(val);
  }

  return (
    <main className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cycling Power Zones Calculator
          </h1>
          <p className="mt-3 text-muted-foreground">
            Calculate your 7 Coggan power training zones based on your FTP.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Your FTP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="ftp">Functional Threshold Power (watts)</Label>
                <Input
                  id="ftp"
                  type="number"
                  min="50"
                  max="600"
                  placeholder="e.g. 250"
                  value={ftp}
                  onChange={(e) => {
                    setFtp(e.target.value);
                    setComputed(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && calculate()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={calculate} disabled={!ftp}>
                  Calculate Zones
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Don&apos;t know your FTP? Use our <Link href="/tools/ftp-calculator" className="text-primary underline">FTP Calculator</Link> first.
            </p>
          </CardContent>
        </Card>

        {computed !== null && (
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Your Training Zones ({computed}W FTP)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zones.map((z) => {
                  const lowW = Math.round(z.low * computed);
                  const highW = z.high ? Math.round(z.high * computed) : null;
                  const widthPct = z.high
                    ? Math.min(((z.high - z.low) / 1.5) * 100, 100)
                    : 30;

                  return (
                    <div key={z.zone} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          Z{z.zone} — {z.name}
                        </span>
                        <span className="text-muted-foreground">
                          {highW ? `${lowW}–${highW}W` : `${lowW}W+`}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted">
                        <div
                          className={`h-3 rounded-full ${z.color}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {z.high
                          ? `${Math.round(z.low * 100)}–${Math.round(z.high * 100)}% FTP`
                          : `${Math.round(z.low * 100)}%+ FTP`}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <Button size="sm" asChild>
                  <Link href="/register">
                    Get dynamic zones that auto-update <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO content */}
        <div className="prose prose-neutral dark:prose-invert mx-auto">
          <h2>Coggan Power Zones Explained</h2>
          <p>
            The 7-zone power model developed by Dr. Andrew Coggan is the industry standard for structuring cycling training. Each zone targets a specific physiological system and produces distinct training adaptations.
          </p>

          <h3>Zone 1 — Active Recovery (0–55% FTP)</h3>
          <p>Very easy spinning to promote blood flow and recovery. No training stimulus — used between intervals and on recovery days.</p>

          <h3>Zone 2 — Endurance (55–75% FTP)</h3>
          <p>The foundation of aerobic fitness. Builds mitochondrial density, fat oxidation, and cardiovascular efficiency. Most of your training volume should be here.</p>

          <h3>Zone 3 — Tempo (75–90% FTP)</h3>
          <p>Moderate intensity that improves muscular endurance and sustainable power. Feels &quot;comfortably hard&quot; — you can talk but in short sentences.</p>

          <h3>Zone 4 — Threshold (90–105% FTP)</h3>
          <p>Training at or near your lactate threshold. The most effective zone for raising FTP. Intervals of 8–20 minutes are typical.</p>

          <h3>Zone 5 — VO2max (105–120% FTP)</h3>
          <p>Short, intense intervals (3–8 minutes) that stress your aerobic ceiling. Improves maximum oxygen uptake and the ability to sustain high power.</p>

          <h3>Zone 6 — Anaerobic Capacity (120–150% FTP)</h3>
          <p>Very short efforts (30 seconds to 3 minutes) above VO2max. Develops anaerobic energy systems and tolerance to high lactate levels.</p>

          <h3>Zone 7 — Neuromuscular Power (150%+ FTP)</h3>
          <p>Maximum sprints under 30 seconds. Recruits maximum muscle fibers and develops peak power output. Fully anaerobic.</p>

          <div className="not-prose mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">Train in the right zones automatically</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paincave generates workouts targeting the right zones for your training phase — Base, Build, Peak, or Taper.
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

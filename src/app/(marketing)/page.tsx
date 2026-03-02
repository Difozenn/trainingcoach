import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Dumbbell,
  Apple,
  Download,
  Heart,
  Bike,
  Footprints,
  Waves,
  ArrowRight,
  Check,
  Calendar,
  Target,
  Zap,
  Shield,
} from "lucide-react";
import {
  FitnessChartPreview,
  WorkoutPlanPreview,
  NutritionPreview,
  HealthPreview,
  CalendarPreview,
  ZonesPreview,
  ExportPreview,
} from "@/components/marketing/previews";
import { PreviewSlideshow } from "@/components/marketing/preview-slideshow";

export default function LandingPage() {
  return (
    <main>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-4 pb-8 pt-20 lg:pt-32">
        {/* Gradient mesh */}
        <div className="pointer-events-none absolute -left-60 -top-60 h-[600px] w-[600px] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Bike className="h-3.5 w-3.5" />
              <span>Cycling</span>
              <span className="text-primary/40">+</span>
              <Footprints className="h-3.5 w-3.5" />
              <span>Running</span>
              <span className="text-primary/40">+</span>
              <Waves className="h-3.5 w-3.5" />
              <span>Swimming</span>
            </div>
            <h1 className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              The complete platform for endurance athletes
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Fitness analytics, smart coaching, nutrition targets, health
              tracking, and workout export — unified across cycling, running,
              and swimming. All metrics calculated internally. Every
              recommendation backed by research.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                >
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/40 text-primary hover:bg-primary/5"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>

          {/* Slideshow preview */}
          <div className="mx-auto mt-16 max-w-4xl">
            <PreviewSlideshow />
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="border-y border-border/50 bg-card/50 py-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 text-center md:grid-cols-4">
          {[
            { value: "3", label: "Sports Supported" },
            { value: "12+", label: "Training Metrics" },
            { value: "7", label: "Training Zones" },
            { value: "4", label: "Export Formats" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature: Fitness Timeline ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Fitness Timeline
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                See your fitness, fatigue, and form at a glance
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The Performance Management Chart tracks your Chronic Training
                Load (CTL), Acute Training Load (ATL), and Training Stress
                Balance (TSB) across all three sports in one unified view.
              </p>
              <ul className="space-y-3">
                {[
                  "Unified CTL/ATL/TSB across cycling, running, and swimming",
                  "Sport-specific TSS breakdown with color coding",
                  "Plain-English insights: \"Fresh — ready for hard sessions\"",
                  "Adjustable range: 30 days to full history",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <FitnessChartPreview />
          </div>
        </div>
      </section>

      {/* ─── Feature: Smart Coaching ─── */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <WorkoutPlanPreview />
            </div>
            <div className="order-1 space-y-6 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
                <Dumbbell className="h-3.5 w-3.5" />
                Smart Coaching
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                A workout pool, not a rigid schedule
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The rule-based coaching engine prescribes a weekly pool of
                workouts tailored to your training phase, current fitness, and
                recovery status. You pick when to do them.
              </p>
              <ul className="space-y-3">
                {[
                  "Periodized plans: Base, Build, Peak, Taper phases",
                  "Mid-week adjustments based on actual load vs target",
                  "Safety checks prevent overreaching and injury",
                  "Event mode with race-day tapering strategy",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Multi-sport section ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Three sports. One unified platform.
            </h2>
            <p className="text-muted-foreground">
              Sport-specific metrics calculated internally. No intervals.icu, no
              TrainingPeaks. Combined daily TSS feeds a unified fatigue model.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                Icon: Bike,
                name: "Cycling",
                color: "text-blue-400",
                bgColor: "bg-blue-500/10",
                metrics: [
                  "Normalized Power (NP)",
                  "Training Stress Score (TSS)",
                  "Coggan 7-zone model",
                  "FTP auto-detection",
                ],
              },
              {
                Icon: Footprints,
                name: "Running",
                color: "text-green-400",
                bgColor: "bg-green-500/10",
                metrics: [
                  "Normalized Graded Pace (NGP)",
                  "Running TSS (rTSS = IF\u00B2)",
                  "6-zone pace model",
                  "Threshold pace tracking",
                ],
              },
              {
                Icon: Waves,
                name: "Swimming",
                color: "text-teal-400",
                bgColor: "bg-teal-500/10",
                metrics: [
                  "Critical Swim Speed (CSS)",
                  "Swim TSS (sTSS = IF\u00B3)",
                  "5-zone CSS model",
                  "SWOLF efficiency tracking",
                ],
              },
            ].map((sport) => (
              <Card key={sport.name} className="border-border/50 bg-card/50">
                <CardContent className="space-y-4 pt-6">
                  <div className={`w-fit rounded-xl p-3 ${sport.bgColor}`}>
                    <sport.Icon className={`h-8 w-8 ${sport.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{sport.name}</h3>
                  <ul className="space-y-2">
                    {sport.metrics.map((m) => (
                      <li
                        key={m}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature: Nutrition ─── */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Apple className="h-3.5 w-3.5" />
                Nutrition Targets
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Fuel your training with science-backed targets
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Daily macro targets periodized by training day. Ride fueling
                plans with glucose:fructose ratios from 2025 research. No food
                logging — just clear targets.
              </p>
              <ul className="space-y-3">
                {[
                  "Periodized carbs: high on hard days, moderate on easy days",
                  "1:0.8 glucose:fructose ratio for optimal absorption",
                  "Post-ride recovery window with protein + carb targets",
                  "Hydration and sodium recommendations per session",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <NutritionPreview />
          </div>
        </div>
      </section>

      {/* ─── Feature: Health Tracking ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <HealthPreview />
            </div>
            <div className="order-1 space-y-6 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                <Heart className="h-3.5 w-3.5" />
                Health Tracking
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Recovery-aware coaching that adapts to you
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                HRV, resting heart rate, and sleep data from Garmin feed
                directly into coaching decisions. Declining HRV + poor sleep
                automatically triggers a recovery day.
              </p>
              <ul className="space-y-3">
                {[
                  "HRV trend analysis with baseline comparison",
                  "Resting HR tracking detects early overtraining",
                  "Sleep quality scoring influences next-day training",
                  "Automatic recovery recommendations when metrics dip",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── More Features Grid ─── */}
      <section className="border-y border-border/50 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything else you need
            </h2>
            <p className="text-muted-foreground">
              Export workouts, track your calendar, monitor your zones — all
              built in.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="w-fit rounded-xl bg-primary/10 p-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Workout Export</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Export to Zwift (ZWO), Garmin (FIT), smart trainers (MRC/ERG),
                or any calendar app (ICS). Train anywhere with any device.
              </p>
              <ExportPreview />
            </div>
            <div className="space-y-4">
              <div className="w-fit rounded-xl bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Training Calendar</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visual calendar with sport-coded activities and planned
                workouts. See your training week at a glance.
              </p>
              <CalendarPreview />
            </div>
            <div className="space-y-4">
              <div className="w-fit rounded-xl bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Training Zones</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sport-specific zone calculators. Coggan 7-zone for cycling,
                6-zone pace for running, CSS 5-zone for swimming.
              </p>
              <ZonesPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in 2 minutes
            </h2>
            <p className="text-muted-foreground">
              No manual data entry. No complex setup. Just connect and go.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Connect Strava",
                description:
                  "One-click OAuth. We import your entire history and auto-detect your FTP, threshold pace, and CSS.",
              },
              {
                step: "2",
                title: "Get Your Plan",
                description:
                  "Choose event mode or fitness gain. The engine generates a weekly workout pool tailored to your phase and fitness.",
              },
              {
                step: "3",
                title: "Train & Track",
                description:
                  "Do the workouts when it suits you. We track your load, adjust mid-week, and show you exactly where you stand.",
              },
            ].map((s) => (
              <div key={s.step} className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-xl font-bold text-white shadow-lg shadow-primary/25">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why us ─── */}
      <section className="border-y border-border/50 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Built different
            </h2>
            <p className="text-muted-foreground">
              No AI hallucinations. No food logging. No rigid schedules. Just
              proven science.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: Zap,
                title: "All Metrics Internal",
                desc: "No intervals.icu or TrainingPeaks dependency. Every calculation is transparent.",
              },
              {
                Icon: Shield,
                title: "Research-Backed",
                desc: "Every recommendation cites peer-reviewed sports science. No black-box algorithms.",
              },
              {
                Icon: Dumbbell,
                title: "Flexible Scheduling",
                desc: "Weekly workout pool, not rigid calendar. Life happens — your plan adapts.",
              },
              {
                Icon: Target,
                title: "Multi-Sport Native",
                desc: "Cycling, running, swimming unified from day one. Not bolted on after the fact.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3"
              >
                <div className="w-fit rounded-lg bg-primary/10 p-2.5">
                  <f.Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing preview ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple pricing
            </h2>
            <p className="text-muted-foreground">
              Start free. Upgrade when you&apos;re ready. No hidden fees, cancel
              anytime.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="space-y-4 pt-6">
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-4xl font-bold">
                  $0
                  <span className="text-base font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Get started with basic metrics and 90-day history.
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Activity sync from Strava",
                    "Basic metrics (TSS, IF, zones)",
                    "90-day activity history",
                    "Sport-specific zone calculator",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="relative border-primary/50 bg-card/50 shadow-lg shadow-primary/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
              <CardContent className="space-y-4 pt-6">
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-4xl font-bold">
                  $9.99
                  <span className="text-base font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Full coaching engine, nutrition, and workout export.
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Everything in Free",
                    "Fitness Timeline (CTL/ATL/TSB)",
                    "Coaching engine + workout plans",
                    "Nutrition targets + fueling plans",
                    "Workout export (ZWO, FIT, MRC)",
                    "Health tracking (HRV, sleep)",
                    "Unlimited history",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-2xl space-y-6 px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to train smarter?
          </h2>
          <p className="text-muted-foreground">
            Connect Strava, get your metrics, and start your first week of
            structured training. Free forever — upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
              >
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="border-primary/40 text-primary hover:bg-primary/5"
              >
                Compare Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

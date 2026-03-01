import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Fitness Timeline",
    description:
      "Track CTL, ATL, and TSB across all three sports. See your fitness, fatigue, and form in one unified chart with plain-English explanations.",
  },
  {
    icon: Dumbbell,
    title: "Smart Coaching",
    description:
      "Rule-based coaching engine prescribes weekly workout pools — not rigid schedules. You pick when. Safety checks prevent overtraining.",
  },
  {
    icon: Apple,
    title: "Nutrition Targets",
    description:
      "Daily macro targets and ride fueling plans based on your training. 2025 research: 1:0.8 glucose:fructose ratio, periodized carbs by training day.",
  },
  {
    icon: Download,
    title: "Workout Export",
    description:
      "Export workouts to Zwift (ZWO), Garmin (FIT), smart trainers (MRC/ERG), or any calendar app (ICS). Train anywhere.",
  },
  {
    icon: Heart,
    title: "Health Tracking",
    description:
      "HRV, resting HR, and sleep from Garmin feed into coaching decisions. Declining HRV + poor sleep = automatic recovery day.",
  },
];

const sports = [
  { icon: Bike, name: "Cycling", metrics: "NP, TSS, Coggan 7-zone, FTP" },
  { icon: Footprints, name: "Running", metrics: "NGP, rTSS, 6-zone pace, threshold" },
  { icon: Waves, name: "Swimming", metrics: "CSS, sTSS (IF cubed), 5-zone" },
];

const steps = [
  { step: "1", title: "Connect Strava", description: "One-click OAuth. We import your entire history and auto-detect your FTP, threshold pace, and CSS." },
  { step: "2", title: "Get Your Plan", description: "Choose event mode or fitness gain. The engine generates a weekly workout pool tailored to your phase and fitness." },
  { step: "3", title: "Train & Track", description: "Do the workouts when it suits you. We track your load, adjust mid-week, and show you exactly where you stand." },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center lg:py-32">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <span>Cycling</span>
            <span className="text-border">+</span>
            <span>Running</span>
            <span className="text-border">+</span>
            <span>Swimming</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Endurance training backed by science, not hype
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            All your metrics calculated internally. No black boxes. Every recommendation cites peer-reviewed research. You see the why, not just the what.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Multi-sport */}
      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">Three sports. One unified platform.</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {sports.map((sport) => (
              <Card key={sport.name} className="text-center">
                <CardContent className="pt-6">
                  <sport.icon className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{sport.name}</h3>
                  <p className="text-sm text-muted-foreground">{sport.metrics}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Combined daily TSS across all sports. Unified CTL/ATL/TSB. Sport-specific zones and thresholds.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-2xl font-bold">Everything you need. Nothing you don&apos;t.</h2>
          <p className="mb-12 text-center text-muted-foreground">No AI hallucinations. No food logging. No rigid schedules.</p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold">Up and running in 2 minutes</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold">Simple pricing</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-3xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-2 text-sm">
                  {["Activity sync from Strava", "Basic metrics (TSS, zones)", "90-day history"].map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
                  ))}
                </ul>
                <Link href="/register"><Button variant="outline" className="w-full">Get Started</Button></Link>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-3xl font-bold">$9.99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
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
                    <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
                  ))}
                </ul>
                <Link href="/register"><Button className="w-full">Start Free Trial</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-20 text-center">
        <div className="mx-auto max-w-2xl px-4 space-y-6">
          <h2 className="text-2xl font-bold">Ready to train smarter?</h2>
          <p className="text-muted-foreground">Connect Strava, get your metrics, and start your first week of structured training.</p>
          <Link href="/register"><Button size="lg" className="gap-2">Create Free Account <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>
    </main>
  );
}

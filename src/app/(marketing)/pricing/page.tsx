import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free and Pro plans for endurance athletes. Start with basic metrics or unlock coaching, nutrition targets, and workout export.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with basic metrics",
    cta: "Get Started",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      { name: "Strava activity sync", included: true },
      { name: "Basic metrics (TSS, IF, zones)", included: true },
      { name: "90-day activity history", included: true },
      { name: "Sport-specific zone calculator", included: true },
      { name: "Fitness Timeline (CTL/ATL/TSB)", included: false },
      { name: "Coaching engine + weekly plans", included: false },
      { name: "Nutrition targets + fueling", included: false },
      { name: "Workout export (ZWO/FIT/MRC)", included: false },
      { name: "Health tracking (HRV, sleep)", included: false },
      { name: "Unlimited history", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$9.99",
    description: "Full coaching + nutrition + export",
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
    highlighted: true,
    features: [
      { name: "Strava activity sync", included: true },
      { name: "All metrics (NP/NGP/CSS, TSS/rTSS/sTSS)", included: true },
      { name: "Unlimited activity history", included: true },
      { name: "Sport-specific zone calculator", included: true },
      { name: "Fitness Timeline (CTL/ATL/TSB)", included: true },
      { name: "Coaching engine + weekly plans", included: true },
      { name: "Nutrition targets + fueling plans", included: true },
      { name: "Workout export (ZWO/FIT/MRC/ERG/ICS)", included: true },
      { name: "Health tracking (HRV, sleep, resting HR)", included: true },
      { name: "Event mode + periodization", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-3xl font-bold">Simple, transparent pricing</h1>
          <p className="text-muted-foreground">No hidden fees. Cancel anytime. Start with Free and upgrade when you&apos;re ready.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlighted ? "relative border-primary/50 shadow-lg shadow-primary/10" : "border-border/50"}>
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <p className="text-4xl font-bold mt-2">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant={plan.ctaVariant} className="w-full" asChild>
                  <Link href="/register">{plan.cta}</Link>
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground/60"}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include: AES-256-GCM encrypted data, GDPR compliance, data export.</p>
          <p className="mt-1">Garmin + Wahoo integration coming soon (included in Pro).</p>
        </div>
      </div>
    </main>
  );
}

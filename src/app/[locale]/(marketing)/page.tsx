import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { routing } from "@/i18n/routing";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const languages: Record<string, string> = { "x-default": "/" };
  for (const l of routing.locales) {
    languages[l] = l === routing.defaultLocale ? "/" : `/${l}`;
  }

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages,
    },
  };
}

export default async function LandingPage() {
  const t = await getTranslations();

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-8 pt-20 lg:pt-32">
        <div className="pointer-events-none absolute -left-60 -top-60 h-[600px] w-[600px] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Bike className="h-3.5 w-3.5" />
              <span>{t("Hero.cycling")}</span>
              <span className="text-primary/40">+</span>
              <Footprints className="h-3.5 w-3.5" />
              <span>{t("Hero.running")}</span>
              <span className="text-primary/40">+</span>
              <Waves className="h-3.5 w-3.5" />
              <span>{t("Hero.swimming")}</span>
            </div>
            <h1 className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              {t("Hero.title")}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t("Hero.description")}
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                asChild
              >
                <Link href="/register">
                  {t("Hero.startFree")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-primary/40 text-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/pricing">{t("Hero.viewPricing")}</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <PreviewSlideshow />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-card/50 py-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 text-center md:grid-cols-4">
          {[
            { value: "3", label: t("Stats.sportsSupported") },
            { value: "12+", label: t("Stats.trainingMetrics") },
            { value: "7", label: t("Stats.trainingZones") },
            { value: "4", label: t("Stats.exportFormats") },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature: Fitness Timeline */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <TrendingUp className="h-3.5 w-3.5" />
                {t("FitnessTimeline.badge")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("FitnessTimeline.title")}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t("FitnessTimeline.description")}
              </p>
              <ul className="space-y-3">
                {([1, 2, 3, 4] as const).map((n) => (
                  <li key={n} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {t(`FitnessTimeline.feature${n}`)}
                  </li>
                ))}
              </ul>
            </div>
            <FitnessChartPreview />
          </div>
        </div>
      </section>

      {/* Feature: Smart Coaching */}
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
                {t("SmartCoaching.badge")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("SmartCoaching.title")}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t("SmartCoaching.description")}
              </p>
              <ul className="space-y-3">
                {([1, 2, 3, 4] as const).map((n) => (
                  <li key={n} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {t(`SmartCoaching.feature${n}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-sport section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("MultiSport.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("MultiSport.description")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(
              [
                {
                  Icon: Bike,
                  nameKey: "cycling" as const,
                  metricsKey: "cyclingMetrics" as const,
                  color: "text-blue-400",
                  bgColor: "bg-blue-500/10",
                },
                {
                  Icon: Footprints,
                  nameKey: "running" as const,
                  metricsKey: "runningMetrics" as const,
                  color: "text-green-400",
                  bgColor: "bg-green-500/10",
                },
                {
                  Icon: Waves,
                  nameKey: "swimming" as const,
                  metricsKey: "swimmingMetrics" as const,
                  color: "text-teal-400",
                  bgColor: "bg-teal-500/10",
                },
              ] as const
            ).map((sport) => (
              <Card
                key={sport.nameKey}
                className="border-border/50 bg-card/50"
              >
                <CardContent className="space-y-4 pt-6">
                  <div className={`w-fit rounded-xl p-3 ${sport.bgColor}`}>
                    <sport.Icon className={`h-8 w-8 ${sport.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {t(`MultiSport.${sport.nameKey}`)}
                  </h3>
                  <ul className="space-y-2">
                    {(
                      t.raw(`MultiSport.${sport.metricsKey}`) as string[]
                    ).map((m) => (
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

      {/* Feature: Nutrition */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Apple className="h-3.5 w-3.5" />
                {t("NutritionFeature.badge")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("NutritionFeature.title")}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t("NutritionFeature.description")}
              </p>
              <ul className="space-y-3">
                {([1, 2, 3, 4] as const).map((n) => (
                  <li key={n} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {t(`NutritionFeature.feature${n}`)}
                  </li>
                ))}
              </ul>
            </div>
            <NutritionPreview />
          </div>
        </div>
      </section>

      {/* Feature: Health Tracking */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <HealthPreview />
            </div>
            <div className="order-1 space-y-6 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                <Heart className="h-3.5 w-3.5" />
                {t("HealthTracking.badge")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("HealthTracking.title")}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t("HealthTracking.description")}
              </p>
              <ul className="space-y-3">
                {([1, 2, 3, 4] as const).map((n) => (
                  <li key={n} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {t(`HealthTracking.feature${n}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* More Features Grid */}
      <section className="border-y border-border/50 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("MoreFeatures.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("MoreFeatures.description")}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="w-fit rounded-xl bg-primary/10 p-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                {t("MoreFeatures.workoutExport")}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("MoreFeatures.workoutExportDesc")}
              </p>
              <ExportPreview />
            </div>
            <div className="space-y-4">
              <div className="w-fit rounded-xl bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                {t("MoreFeatures.trainingCalendar")}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("MoreFeatures.trainingCalendarDesc")}
              </p>
              <CalendarPreview />
            </div>
            <div className="space-y-4">
              <div className="w-fit rounded-xl bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                {t("MoreFeatures.trainingZones")}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("MoreFeatures.trainingZonesDesc")}
              </p>
              <ZonesPreview />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("HowItWorks.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("HowItWorks.description")}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {(
              [
                {
                  step: "1",
                  title: t("HowItWorks.step1Title"),
                  description: t("HowItWorks.step1Desc"),
                },
                {
                  step: "2",
                  title: t("HowItWorks.step2Title"),
                  description: t("HowItWorks.step2Desc"),
                },
                {
                  step: "3",
                  title: t("HowItWorks.step3Title"),
                  description: t("HowItWorks.step3Desc"),
                },
              ] as const
            ).map((s) => (
              <div key={s.step} className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-xl font-bold text-white shadow-lg shadow-primary/25">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="border-y border-border/50 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("WhyUs.title")}
            </h2>
            <p className="text-muted-foreground">{t("WhyUs.description")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  Icon: Zap,
                  title: t("WhyUs.transparent"),
                  desc: t("WhyUs.transparentDesc"),
                },
                {
                  Icon: Shield,
                  title: t("WhyUs.researchBacked"),
                  desc: t("WhyUs.researchBackedDesc"),
                },
                {
                  Icon: Dumbbell,
                  title: t("WhyUs.fitsYourLife"),
                  desc: t("WhyUs.fitsYourLifeDesc"),
                },
                {
                  Icon: Target,
                  title: t("WhyUs.multiSportNative"),
                  desc: t("WhyUs.multiSportNativeDesc"),
                },
              ] as const
            ).map((f) => (
              <div
                key={f.title}
                className="space-y-3 rounded-xl border border-border/50 bg-card/50 p-6"
              >
                <div className="w-fit rounded-lg bg-primary/10 p-2.5">
                  <f.Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("PricingPreview.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("PricingPreview.description")}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="space-y-4 pt-6">
                <h3 className="text-xl font-bold">
                  {t("PricingPreview.free")}
                </h3>
                <p className="text-4xl font-bold">
                  {t("PricingPreview.freePrice")}
                  <span className="text-base font-normal text-muted-foreground">
                    {t("PricingPreview.perMonth")}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("PricingPreview.freeDesc")}
                </p>
                <ul className="space-y-2 text-sm">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <li key={n} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {t(`PricingPreview.freeFeature${n}`)}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">
                    {t("PricingPreview.getStarted")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="relative border-primary/50 bg-card/50 shadow-lg shadow-primary/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                {t("PricingPreview.mostPopular")}
              </Badge>
              <CardContent className="space-y-4 pt-6">
                <h3 className="text-xl font-bold">
                  {t("PricingPreview.pro")}
                </h3>
                <p className="text-4xl font-bold">
                  {t("PricingPreview.proPrice")}
                  <span className="text-base font-normal text-muted-foreground">
                    {t("PricingPreview.perMonth")}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("PricingPreview.proDesc")}
                </p>
                <ul className="space-y-2 text-sm">
                  {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => (
                    <li key={n} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {t(`PricingPreview.proFeature${n}`)}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register">
                    {t("PricingPreview.startFreeTrial")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-2xl space-y-6 px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t("BottomCta.title")}
          </h2>
          <p className="text-muted-foreground">{t("BottomCta.description")}</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
              asChild
            >
              <Link href="/register">
                {t("BottomCta.createFreeAccount")}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary/40 text-primary hover:bg-primary/5"
              asChild
            >
              <Link href="/pricing">{t("BottomCta.comparePlans")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

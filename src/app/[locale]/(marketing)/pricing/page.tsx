import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pricing" });

  const languages: Record<string, string> = { "x-default": "/pricing" };
  for (const l of routing.locales) {
    languages[l] =
      l === routing.defaultLocale ? "/pricing" : `/${l}/pricing`;
  }

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical:
        locale === routing.defaultLocale ? "/pricing" : `/${locale}/pricing`,
      languages,
    },
  };
}

export default async function PricingPage() {
  const t = await getTranslations("Pricing");

  const plans = [
    {
      name: t("free"),
      price: t("freePrice"),
      description: t("freeDesc"),
      cta: t("getStarted"),
      ctaVariant: "outline" as const,
      highlighted: false,
      features: [
        { name: t("stravaSync"), included: true },
        { name: t("basicMetrics"), included: true },
        { name: t("history90"), included: true },
        { name: t("zoneCalc"), included: true },
        { name: t("fitnessTimeline"), included: false },
        { name: t("coaching"), included: false },
        { name: t("nutrition"), included: false },
        { name: t("workoutExport"), included: false },
        { name: t("healthTracking"), included: false },
        { name: t("unlimitedHistory"), included: false },
      ],
    },
    {
      name: t("pro"),
      price: t("proPrice"),
      description: t("proDesc"),
      cta: t("startFreeTrial"),
      ctaVariant: "default" as const,
      highlighted: true,
      features: [
        { name: t("stravaSync"), included: true },
        { name: t("allMetrics"), included: true },
        { name: t("unlimitedHistory"), included: true },
        { name: t("zoneCalc"), included: true },
        { name: t("fitnessTimeline"), included: true },
        { name: t("coaching"), included: true },
        { name: t("nutritionPlans"), included: true },
        { name: t("workoutExportFull"), included: true },
        { name: t("healthTrackingFull"), included: true },
        { name: t("eventMode"), included: true },
      ],
    },
  ];

  return (
    <main className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative border-primary/50 shadow-lg shadow-primary/10"
                  : "border-border/50"
              }
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {t("mostPopular")}
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">
                    {t("perMonth")}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant={plan.ctaVariant} className="w-full" asChild>
                  <Link href="/register">{plan.cta}</Link>
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.name}
                      className="flex items-center gap-3 text-sm"
                    >
                      {feature.included ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span
                        className={
                          feature.included ? "" : "text-muted-foreground/60"
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>{t("footnote1")}</p>
          <p className="mt-1">{t("footnote2")}</p>
        </div>
      </div>
    </main>
  );
}

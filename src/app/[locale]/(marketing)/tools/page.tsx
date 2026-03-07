import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Target, TrendingUp, Footprints, Waves, Apple } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Training Tools & Calculators",
  description:
    "Free cycling and endurance training calculators. FTP calculator, power zones, TSS calculator, and more.",
};

const tools = [
  {
    href: "/tools/ftp-calculator",
    Icon: Calculator,
    name: "FTP Calculator",
    description:
      "Calculate your Functional Threshold Power from a 20-minute, 8-minute, or ramp test.",
  },
  {
    href: "/tools/power-zones",
    Icon: Target,
    name: "Power Zones Calculator",
    description:
      "Get your 7 Coggan power training zones based on your FTP. Know exactly what watts to target.",
  },
  {
    href: "/tools/tss-calculator",
    Icon: TrendingUp,
    name: "TSS Calculator",
    description:
      "Calculate Training Stress Score from Normalized Power, FTP, and ride duration.",
  },
  {
    href: "#",
    Icon: Footprints,
    name: "Running Pace Zones",
    description:
      "Calculate your 6 running training zones from threshold pace. Coming soon.",
    soon: true,
  },
  {
    href: "#",
    Icon: Waves,
    name: "CSS Calculator",
    description:
      "Determine your Critical Swim Speed from a 400m and 200m time trial. Coming soon.",
    soon: true,
  },
  {
    href: "#",
    Icon: Apple,
    name: "Nutrition Calculator",
    description:
      "Get daily macro targets and ride fueling plans based on your training day. Coming soon.",
    soon: true,
  },
];

export default function ToolsPage() {
  return (
    <main className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Free Training Tools
          </h1>
          <p className="mt-3 text-muted-foreground">
            Science-backed calculators for cycling, running, and swimming. No
            signup required.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href as "/tools/ftp-calculator"}
              className={`group block ${tool.soon ? "pointer-events-none opacity-60" : ""}`}
            >
              <Card className="h-full border-border/50 transition-colors group-hover:border-primary/50">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <tool.Icon className="h-5 w-5 text-primary" />
                    </div>
                    {tool.soon && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold group-hover:text-primary">
                    {tool.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

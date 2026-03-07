import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "What is FTP? The Complete Guide for Cyclists | Paincave",
  description:
    "Functional Threshold Power (FTP) explained for cyclists. Learn what FTP is, how to test it with 20-minute, 8-minute, and ramp tests, why it matters for training zones and TSS, and how to use it to get faster.",
  openGraph: {
    title: "What is FTP? The Complete Guide for Cyclists",
    description:
      "Everything you need to know about Functional Threshold Power — the single most important number in cycling training.",
    type: "article",
    publishedTime: "2026-03-07T00:00:00Z",
  },
};

export default function WhatIsFtpPage() {
  return (
    <main className="py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        {/* Back to Blog */}
        <Link
          href={"/blog" as "/blog"}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              Cycling
            </span>
            <time dateTime="2026-03-07">March 7, 2026</time>
            <span>&middot;</span>
            <span>8 min read</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            What is FTP? The Complete Guide for Cyclists
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Functional Threshold Power is the single most important metric in
            cycling training. It determines your training zones, measures your
            fitness, and drives every structured workout you do. Here is
            everything you need to know.
          </p>
        </header>

        {/* FTP Concept Diagram */}
        <figure className="not-prose my-10">
          <svg viewBox="0 0 600 280" className="w-full" aria-label="FTP threshold concept diagram">
            <defs>
              <linearGradient id="sustainableGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="unsustainableGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Axes */}
            <line x1="60" y1="20" x2="60" y2="240" stroke="var(--muted-foreground)" strokeOpacity="0.3" strokeWidth="1" />
            <line x1="60" y1="240" x2="570" y2="240" stroke="var(--muted-foreground)" strokeOpacity="0.3" strokeWidth="1" />
            {/* Axis labels */}
            <text x="30" y="135" fill="var(--muted-foreground)" fontSize="11" textAnchor="middle" transform="rotate(-90, 30, 135)">Power (watts)</text>
            <text x="315" y="265" fill="var(--muted-foreground)" fontSize="11" textAnchor="middle">Time</text>
            {/* FTP line */}
            <line x1="60" y1="140" x2="570" y2="140" stroke="var(--primary)" strokeWidth="2" strokeDasharray="8 4" />
            <text x="575" y="137" fill="var(--primary)" fontSize="13" fontWeight="600" textAnchor="start">FTP</text>
            {/* Zones */}
            <rect x="60" y="140" width="510" height="100" fill="url(#sustainableGrad)" />
            <rect x="60" y="20" width="510" height="120" fill="url(#unsustainableGrad)" />
            <text x="315" y="195" fill="var(--primary)" fontSize="12" textAnchor="middle" opacity="0.7">Sustainable — aerobic dominant</text>
            <text x="315" y="75" fill="#dc2626" fontSize="12" textAnchor="middle" opacity="0.7">Unsustainable — lactate accumulates</text>
            {/* Power curve */}
            <path d="M 80 50 Q 150 55, 200 90 Q 250 115, 300 130 Q 380 145, 460 160 Q 520 170, 560 180" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="300" cy="130" r="4" fill="var(--primary)" />
            <text x="305" y="120" fill="var(--muted-foreground)" fontSize="10">~60 min</text>
          </svg>
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">
            FTP is the power output where your body transitions from sustainable aerobic effort to unsustainable anaerobic effort — roughly the power you can hold for one hour.
          </figcaption>
        </figure>

        {/* Article Body */}
        <article className="prose prose-neutral dark:prose-invert prose-headings:mt-12 prose-headings:mb-4 prose-h3:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1 mx-auto max-w-3xl">
          <h2>What FTP Actually Means</h2>
          <p className="lead">
            FTP stands for <strong>Functional Threshold Power</strong>. It
            represents the highest average power, measured in watts, that you can
            sustain for approximately one hour. The concept was developed and
            popularized by Dr. Andrew Coggan and Hunter Allen in their book{" "}
            <em>Training and Racing with a Power Meter</em>.
          </p>
          <p>
            In practical terms, FTP is the boundary between sustainable and
            unsustainable effort. Below your FTP, your body can clear lactate
            roughly as fast as it produces it. Above your FTP, lactate
            accumulates faster than your body can process it, and fatigue forces
            you to slow down within minutes.
          </p>
          <p>
            A concrete example: if your FTP is 250 watts, you could hold 240
            watts for an hour and finish tired but intact. At 270 watts, you
            would likely blow up within 20 to 30 minutes. That threshold — the
            line between those two realities — is your FTP.
          </p>

          <hr />
          <h2>The Science Behind FTP</h2>
          <p>
            FTP is a field-based proxy for your{" "}
            <strong>lactate threshold</strong> (LT2), also called the maximal
            lactate steady state (MLSS). In a lab, this would be determined by
            drawing blood samples at progressively higher intensities and
            plotting the point where blood lactate concentration rises
            exponentially — typically around 4 mmol/L.
          </p>
          <p>
            Physiologically, your FTP reflects the interaction of several
            systems:
          </p>
          <ul>
            <li>
              <strong>VO2max</strong> — your aerobic ceiling. FTP is typically
              72-80% of VO2max in trained cyclists.
            </li>
            <li>
              <strong>Fractional utilization</strong> — how much of your VO2max
              you can sustain. Better-trained athletes can hold a higher
              percentage.
            </li>
            <li>
              <strong>Gross efficiency</strong> — how effectively you convert
              metabolic energy into mechanical work on the pedals.
            </li>
            <li>
              <strong>Muscle fiber composition and capillary density</strong> —
              more mitochondria and capillaries mean better oxygen delivery and
              lactate clearance.
            </li>
          </ul>
          <p>
            FTP is not a perfect measurement. It is an approximation. Lab-based
            MLSS testing will always be more precise. But for the vast majority
            of athletes, FTP is accurate enough to drive effective training —
            and it requires nothing more than a power meter and a hard effort.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              FTP is a field-based proxy for your lactate threshold — the boundary between sustainable and unsustainable effort. It reflects VO2max, fractional utilization, efficiency, and muscle composition working together.
            </p>
          </div>

          <hr />
          <h2>How to Test Your FTP</h2>
          <p>
            There are three widely used field tests for estimating FTP. Each has
            trade-offs between accuracy, repeatability, and how painful they are.
          </p>

          <figure className="not-prose my-8">
            <div className="grid grid-cols-3 gap-3">
              {[
                { test: "20-min", factor: "× 0.95", duration: "20 min", width: "66%", accuracy: "Highest" },
                { test: "8-min", factor: "× 0.90", duration: "2 × 8 min", width: "44%", accuracy: "Moderate" },
                { test: "Ramp", factor: "× 0.75", duration: "~12-20 min", width: "33%", accuracy: "Lowest" },
              ].map((t) => (
                <div key={t.test} className="rounded-lg border border-border/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">{t.test} Test</p>
                  <div className="mx-auto h-2 w-full rounded-full bg-muted mb-2">
                    <div className="h-2 rounded-full bg-primary" style={{ width: t.width }} />
                  </div>
                  <p className="text-lg font-bold text-primary">{t.factor}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.duration}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Accuracy: {t.accuracy}</p>
                </div>
              ))}
            </div>
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              Shorter tests require larger correction factors because more anaerobic energy contributes to the result.
            </figcaption>
          </figure>

          <h3>The 20-Minute Test (Gold Standard)</h3>
          <p>
            This is the original Coggan protocol and remains the most widely
            used. After a thorough warm-up including a 5-minute all-out effort
            to pre-fatigue anaerobic capacity, you ride as hard as you can
            sustain for exactly 20 minutes.
          </p>
          <p>
            <strong>FTP = 20-minute average power &times; 0.95</strong>
          </p>
          <p>
            The 5% reduction accounts for the anaerobic contribution during a
            20-minute effort. Without the warm-up blow-out, the factor may need
            to be lower (0.92-0.93), because more anaerobic energy inflates the
            20-minute number.
          </p>
          <p>
            <strong>Pros:</strong> Most validated, best correlation with
            lab-tested MLSS. <strong>Cons:</strong> Requires good pacing
            discipline. Going out too hard and fading is the most common mistake.
          </p>

          <h3>The 8-Minute Test</h3>
          <p>
            Developed as an alternative for athletes who struggle with pacing a
            20-minute effort. You perform two 8-minute all-out efforts with
            recovery between them.
          </p>
          <p>
            <strong>
              FTP = average of two 8-minute efforts &times; 0.90
            </strong>
          </p>
          <p>
            The larger correction factor (10% vs. 5%) compensates for the
            greater anaerobic contribution in a shorter effort.
          </p>
          <p>
            <strong>Pros:</strong> Easier to pace, more forgiving if you crack.{" "}
            <strong>Cons:</strong> Slightly less accurate, two efforts can be
            mentally draining.
          </p>

          <h3>The Ramp Test</h3>
          <p>
            The ramp test increases power by a fixed increment (typically 20
            watts) every minute until you cannot maintain the target. Popular on
            platforms like Zwift and TrainerRoad for its simplicity.
          </p>
          <p>
            <strong>FTP = best 1-minute average power &times; 0.75</strong>
          </p>
          <p>
            The 75% factor is a rough estimate and is the least individually
            calibrated of the three tests. Athletes with a high anaerobic
            capacity (sprinter types) will often get an FTP that is too high
            from a ramp test, while diesel-type time trialists may get a number
            that is too low.
          </p>
          <p>
            <strong>Pros:</strong> Short, simple, no pacing required.{" "}
            <strong>Cons:</strong> Least accurate, biased by anaerobic capacity
            and muscle fiber type. Best used for tracking trends rather than
            setting absolute zones.
          </p>

          {/* Mid-article CTA */}
          <div className="not-prose my-10 rounded-xl border border-border bg-card p-6">
            <p className="mb-3 font-semibold">
              Calculate your FTP from any test protocol
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              Plug in your 20-minute, 8-minute, or ramp test result and
              instantly see your FTP and all seven Coggan power zones.
            </p>
            <Button asChild>
              <Link href={"/tools/ftp-calculator" as "/tools/ftp-calculator"}>
                FTP Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <hr />
          <h2>Why FTP Matters for Training</h2>
          <p>
            FTP is not just a number to brag about. It is the foundation of
            every structured training plan. Here is what it directly determines:
          </p>

          <h3>Power Zones</h3>
          <p>
            The Coggan 7-zone model defines each training zone as a percentage
            of FTP. Without an accurate FTP, every zone is wrong — and you end
            up training too hard on easy days and too easy on hard days.
          </p>
          <figure className="not-prose my-6">
            <div className="space-y-2">
              {[
                { zone: "Z1", name: "Active Recovery", range: "<55%", color: "bg-zinc-500", width: "36%" },
                { zone: "Z2", name: "Endurance", range: "56-75%", color: "bg-blue-500", width: "50%" },
                { zone: "Z3", name: "Tempo", range: "76-90%", color: "bg-green-500", width: "60%" },
                { zone: "Z4", name: "Threshold", range: "91-105%", color: "bg-yellow-500", width: "70%" },
                { zone: "Z5", name: "VO2max", range: "106-120%", color: "bg-orange-500", width: "80%" },
                { zone: "Z6", name: "Anaerobic", range: "121-150%", color: "bg-red-500", width: "90%" },
                { zone: "Z7", name: "Neuromuscular", range: ">150%", color: "bg-purple-500", width: "100%" },
              ].map((z) => (
                <div key={z.zone} className="flex items-center gap-3 text-sm">
                  <span className="w-8 font-mono text-xs text-muted-foreground">{z.zone}</span>
                  <div className="flex-1">
                    <div className="h-5 w-full rounded bg-muted/50">
                      <div className={`h-5 rounded ${z.color} flex items-center px-2`} style={{ width: z.width }}>
                        <span className="text-[10px] font-medium text-white truncate">{z.name}</span>
                      </div>
                    </div>
                  </div>
                  <span className="w-16 text-right text-xs text-muted-foreground">{z.range}</span>
                </div>
              ))}
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted-foreground">
              All seven Coggan zones are defined as percentages of your FTP.
            </figcaption>
          </figure>

          <h3>Training Stress Score (TSS)</h3>
          <p>
            TSS quantifies how much training load a ride placed on your body. It
            is calculated using your Normalized Power (NP), FTP, and ride
            duration:
          </p>
          <p>
            <strong>
              TSS = (duration in seconds &times; NP &times; IF) / (FTP &times;
              3600) &times; 100
            </strong>
          </p>
          <p>
            Where IF (Intensity Factor) = NP / FTP. A one-hour ride at exactly
            FTP produces a TSS of 100. This metric is the backbone of
            periodization, recovery planning, and progressive overload.
          </p>

          <h3>Chronic Training Load (CTL) and Fitness Tracking</h3>
          <p>
            CTL — often called &quot;fitness&quot; — is an exponentially weighted
            rolling average of your daily TSS over 42 days. Acute Training Load
            (ATL), or &quot;fatigue,&quot; uses a 7-day window. The difference
            between them, Training Stress Balance (TSB = CTL - ATL), indicates
            your freshness or fatigue.
          </p>
          <p>
            All of this math starts with FTP. If your FTP is wrong by 10%, every
            TSS value is wrong, your CTL is wrong, and your entire Performance
            Management Chart is unreliable.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              FTP drives everything: your seven power zones, every TSS calculation, your CTL fitness tracking, and your entire Performance Management Chart. If your FTP is wrong by 10%, all downstream metrics are unreliable.
            </p>
          </div>

          <hr />
          <h2>How Often Should You Retest?</h2>
          <p>
            The short answer: <strong>every 4 to 6 weeks</strong> during
            structured training, or whenever you suspect a significant change in
            fitness.
          </p>
          <p>Specific scenarios that warrant a retest:</p>
          <ul>
            <li>
              At the end of a build block, before starting a new training phase
            </li>
            <li>
              After an extended break (illness, vacation, off-season)
            </li>
            <li>
              When workouts at your current zones feel consistently too easy or
              too hard
            </li>
            <li>
              After a race where you held a higher power than expected for an
              extended duration
            </li>
          </ul>
          <p>
            Modern training platforms, including Paincave, can also detect FTP
            breakthroughs automatically from ride data — identifying when your
            best 20-minute power in a rolling 90-day window exceeds your current
            FTP. This reduces the need for formal testing while keeping your
            zones accurate.
          </p>

          <hr />
          <h2>Common Mistakes with FTP</h2>

          <h3>1. Testing Without Proper Warm-Up</h3>
          <p>
            The 5-minute blow-out before the 20-minute test is not optional. It
            depletes your anaerobic work capacity (W&apos;) so the 20-minute
            effort more closely reflects aerobic output. Skip it, and your FTP
            estimate will be too high — leading to zones that are too hard to
            sustain in training.
          </p>

          <h3>2. Using the Wrong Correction Factor</h3>
          <p>
            The 0.95 factor for the 20-minute test is a population average. Some
            athletes — particularly those with strong anaerobic systems — need a
            lower factor (0.92-0.93). If your sweet spot and threshold workouts
            feel impossible, your FTP is likely set too high.
          </p>

          <h3>3. Testing Indoors but Racing Outdoors (or Vice Versa)</h3>
          <p>
            Most cyclists produce 5-15% less power indoors due to heat, reduced
            inertia, and lack of external motivation. Maintain separate indoor
            and outdoor FTP values, or always test in the environment where you
            primarily train.
          </p>

          <h3>4. Chasing FTP Instead of Training</h3>
          <p>
            Testing too frequently — every week, or even every two weeks —
            creates fatigue without productive adaptation. The test itself is a
            hard workout that takes recovery time. Treat it as a periodic
            calibration, not a weekly scorecard.
          </p>

          <h3>5. Comparing Absolute FTP Across Athletes</h3>
          <p>
            A 300-watt FTP means something very different for a 60 kg climber
            and a 90 kg sprinter. Always use watts per kilogram (W/kg) for
            meaningful comparisons across individuals.
          </p>

          <hr />
          <h2>FTP Ranges by Level</h2>
          <p>
            The following ranges use watts per kilogram (W/kg) and represent
            general benchmarks for male cyclists. Female cyclists can expect
            values approximately 10-15% lower at equivalent training levels due
            to physiological differences.
          </p>

          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-6 font-semibold">Level</th>
                  <th className="pb-3 pr-6 font-semibold">FTP (W/kg)</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-3 pr-6 font-medium text-foreground">
                    Beginner
                  </td>
                  <td className="py-3 pr-6">1.5 &ndash; 2.5</td>
                  <td className="py-3">
                    New to structured training. First year with a power meter.
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 pr-6 font-medium text-foreground">
                    Intermediate
                  </td>
                  <td className="py-3 pr-6">2.5 &ndash; 3.5</td>
                  <td className="py-3">
                    1-3 years of consistent training. Competitive in local
                    group rides and gran fondos.
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 pr-6 font-medium text-foreground">
                    Advanced
                  </td>
                  <td className="py-3 pr-6">3.5 &ndash; 4.5</td>
                  <td className="py-3">
                    Competitive amateur racer. Podiums at regional events.
                    Cat 2-3 in USA Cycling terms.
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 pr-6 font-medium text-foreground">
                    Elite
                  </td>
                  <td className="py-3 pr-6">4.5 &ndash; 5.5</td>
                  <td className="py-3">
                    National-level competitor. Cat 1 or domestic professional.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-6 font-medium text-foreground">
                    World-Class
                  </td>
                  <td className="py-3 pr-6">5.5 &ndash; 7.0+</td>
                  <td className="py-3">
                    WorldTour professional. Grand Tour contenders sit at 6.0+
                    W/kg.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            These numbers are guidelines, not rigid categories. Genetics, age,
            training history, and body composition all influence where you fall.
            The value of FTP is not in how it compares to others — it is in how
            it changes over time for <em>you</em>.
          </p>

          <hr />
          <h2>FTP Is the Starting Point, Not the Finish Line</h2>
          <p>
            FTP is the most important single number in cycling training, but it
            is not the only number that matters. A complete power profile also
            includes your 5-second (neuromuscular), 1-minute (anaerobic), and
            5-minute (VO2max) power. These durations reveal your strengths and
            limiters as a rider.
          </p>
          <p>
            Still, everything starts with FTP. Get it right, and your zones are
            right, your TSS is right, your periodization works, and your
            training adapts to your actual fitness — not a guess.
          </p>
          <p>
            If you do not know your FTP, test it. If you have not tested in
            three months, test it again. It takes 20 minutes of suffering to
            calibrate months of effective training. That is a trade worth making.
          </p>
        </article>

        {/* Bottom CTA */}
        <div className="mx-auto mt-14 max-w-3xl rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h2 className="text-xl font-bold">
            Train Smarter With Accurate Power Zones
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Paincave automatically tracks your FTP, calculates your training
            zones, and monitors your fitness with CTL, ATL, and TSB — all from
            your Strava data. No spreadsheets. No guesswork.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href={"/register" as "/register"}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={"/tools/ftp-calculator" as "/tools/ftp-calculator"}>
                Try the FTP Calculator
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

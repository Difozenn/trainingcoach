import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "CTL, ATL & TSB Explained — The Performance Management Chart",
  description:
    "Understand Chronic Training Load, Acute Training Load, and Training Stress Balance. Learn how the PMC chart guides your training and prevents overtraining.",
};

export default function CtlAtlTsbExplainedPage() {
  return (
    <main className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href={"/blog" as "/blog"}
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            CTL, ATL &amp; TSB: Understanding Training Load
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              Training Science
            </Badge>
            <span>10 min read</span>
            <span>&middot;</span>
            <time dateTime="2026-03-07">March 7, 2026</time>
          </div>
        </header>

        <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
          <p>
            If you have ever used TrainingPeaks, Strava, or any modern training
            platform, you have seen the Performance Management Chart — a line
            graph with three colored curves that supposedly tell you when you are
            fit, when you are fatigued, and when you are ready to race. Most
            athletes glance at it. Few understand it deeply enough to use it
            well.
          </p>
          <p>
            This article breaks down the three metrics that power the PMC:{" "}
            <strong>CTL</strong> (Chronic Training Load),{" "}
            <strong>ATL</strong> (Acute Training Load), and{" "}
            <strong>TSB</strong> (Training Stress Balance). We will cover the
            math, the physiology, the practical guidelines, and the mistakes
            that derail athletes who try to &quot;optimize&quot; their chart
            without understanding what the numbers actually represent.
          </p>

          <h2>What Is the Performance Management Chart?</h2>
          <p>
            The Performance Management Chart (PMC) was developed by Dr. Andrew
            Coggan and Hunter Allen and popularized through{" "}
            <em>Training and Racing with a Power Meter</em>. It models the
            relationship between fitness and fatigue using a mathematical
            framework called the <strong>impulse-response model</strong>,
            originally proposed by Banister et al. in the 1970s.
          </p>
          <p>
            The core idea is simple: training simultaneously builds fitness and
            accumulates fatigue. Fitness develops slowly and decays slowly.
            Fatigue builds quickly and dissipates quickly. Your readiness to
            perform — your <em>form</em> — is the difference between these two.
          </p>
          <p>
            The PMC plots three curves over time: CTL (fitness), ATL (fatigue),
            and TSB (form). Each day, a single input drives all three:{" "}
            <strong>Training Stress Score (TSS)</strong>, a normalized measure of
            how much physiological stress a workout imposed. If you are
            unfamiliar with TSS, read our{" "}
            <Link href={"/blog/what-is-ftp" as "/blog/what-is-ftp"}>
              guide to FTP
            </Link>{" "}
            first — TSS is calculated relative to your Functional Threshold
            Power.
          </p>

          <h2>CTL — Chronic Training Load (Fitness)</h2>
          <p>
            CTL is a rolling, exponentially weighted moving average of your
            daily TSS with a <strong>42-day time constant</strong>. It
            represents your accumulated fitness — the training load your body
            has absorbed and adapted to over roughly the past six weeks.
          </p>
          <p>The formula updates daily:</p>
          <p>
            <code>
              CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) / 42
            </code>
          </p>
          <p>
            This is mathematically equivalent to an exponentially weighted
            moving average (EWMA) with a decay factor of{" "}
            <code>1 - e^(-1/42)</code>, which means roughly{" "}
            <code>1/42 &asymp; 0.024</code> or about 2.4% of the difference
            between today&apos;s TSS and yesterday&apos;s CTL is added each day.
          </p>

          <h3>What CTL Tells You</h3>
          <ul>
            <li>
              <strong>Rising CTL</strong> means you are accumulating fitness
              faster than it decays. You are in a building phase.
            </li>
            <li>
              <strong>Flat CTL</strong> means your current training load matches
              your fitness — you are maintaining.
            </li>
            <li>
              <strong>Falling CTL</strong> means you are training less than your
              body is accustomed to. This happens during tapers, rest weeks, or
              periods of reduced training.
            </li>
          </ul>
          <p>
            A higher CTL does not automatically mean better performance. CTL is
            a <em>quantity</em> metric — it reflects training volume and
            intensity, not the quality or specificity of your training. An
            athlete with a CTL of 80 built through structured intervals will
            likely outperform one with a CTL of 100 built through junk miles.
          </p>

          <h3>Typical CTL Ranges</h3>
          <ul>
            <li>
              <strong>20-40</strong>: Recreational rider, 3-5 hours per week
            </li>
            <li>
              <strong>40-70</strong>: Serious amateur, structured training
            </li>
            <li>
              <strong>70-100</strong>: Competitive amateur, 10-15 hours per week
            </li>
            <li>
              <strong>100-150+</strong>: Elite or professional level
            </li>
          </ul>

          <h2>ATL — Acute Training Load (Fatigue)</h2>
          <p>
            ATL is the same exponentially weighted moving average, but with a{" "}
            <strong>7-day time constant</strong>. It represents recent training
            stress — your short-term fatigue.
          </p>
          <p>
            <code>
              ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) / 7
            </code>
          </p>
          <p>
            Because the time constant is six times shorter than CTL, ATL
            responds much faster to changes in training load. A single hard
            workout significantly spikes ATL. A few rest days bring it down
            quickly. This mirrors how fatigue actually works in the body —
            glycogen depletion, muscle damage, and neural fatigue accumulate
            fast and recover relatively fast compared to the slow structural
            and metabolic adaptations that build fitness.
          </p>

          <h3>What ATL Tells You</h3>
          <ul>
            <li>
              <strong>High ATL relative to CTL</strong> means you are
              accumulating fatigue faster than fitness. You are in an
              overreaching state — intentional or not.
            </li>
            <li>
              <strong>ATL roughly equal to CTL</strong> means your recent
              training matches your long-term average. Sustainable, but not
              building.
            </li>
            <li>
              <strong>ATL well below CTL</strong> means you are resting. Your
              fatigue is dissipating while fitness decays more slowly — this is
              the taper effect.
            </li>
          </ul>

          <h2>TSB — Training Stress Balance (Form)</h2>
          <p>
            TSB is the simplest calculation on the PMC:
          </p>
          <p>
            <code>TSB = CTL (yesterday) - ATL (yesterday)</code>
          </p>
          <p>
            It represents your <strong>form</strong> — the balance between the
            fitness you have built and the fatigue you are currently carrying.
            When fatigue exceeds fitness (ATL &gt; CTL), TSB is negative. When
            fatigue dissipates below your fitness level (ATL &lt; CTL), TSB is
            positive.
          </p>

          <h3>TSB Ranges and What They Mean</h3>
          <ul>
            <li>
              <strong>+15 to +25</strong>: Very fresh, but fitness is likely
              decaying. Extended periods here mean detraining.
            </li>
            <li>
              <strong>+5 to +15</strong>: Fresh and ready to perform.
              Ideal for A-races after a proper taper.
            </li>
            <li>
              <strong>0 to -10</strong>: Slightly fatigued but functional.
              Normal during a well-managed training block.
            </li>
            <li>
              <strong>-10 to -30</strong>: Fatigued. This is where productive
              training happens — you are applying a stimulus that exceeds your
              current fitness. Common during build phases.
            </li>
            <li>
              <strong>Below -30</strong>: Deep fatigue. Risk of overtraining,
              illness, or injury increases significantly. You should be here
              only briefly and intentionally (functional overreaching) before
              backing off.
            </li>
          </ul>

          <h3>The Taper Sweet Spot</h3>
          <p>
            The art of tapering is letting fatigue dissipate while preserving
            as much fitness as possible. Because ATL has a 7-day time constant
            and CTL has a 42-day time constant, reducing training volume by
            40-60% for 7-14 days before a key event lets ATL drop
            substantially while CTL barely moves. TSB rises from negative
            territory into the +5 to +15 range — the ideal window for peak
            performance.
          </p>
          <p>
            A common mistake is tapering too long. After two weeks of reduced
            training, CTL starts declining noticeably. You might feel fresh
            (high TSB), but you are losing the fitness that made you fast in
            the first place. The taper is a controlled bet: you sacrifice a
            small amount of fitness to eliminate a large amount of fatigue.
          </p>

          <h2>The Math: Exponential Weighted Moving Averages</h2>
          <p>
            Both CTL and ATL use the same mathematical structure — an
            exponentially weighted moving average (EWMA). The general form is:
          </p>
          <p>
            <code>
              metric_today = metric_yesterday &times; (1 - 1/&tau;) +
              TSS_today &times; (1/&tau;)
            </code>
          </p>
          <p>
            Where <code>&tau;</code> (tau) is the time constant: 42 for CTL, 7
            for ATL. This is equivalent to the recursive update shown earlier.
          </p>
          <p>
            The exponential weighting means recent days contribute more than
            older days, with the influence of any single day decaying
            exponentially. After <code>&tau;</code> days, a training session
            retains about 37% (1/e) of its original weight. After{" "}
            <code>2&tau;</code> days, about 13.5%. After <code>3&tau;</code>,
            about 5%.
          </p>
          <p>
            For CTL, this means a big training week from two months ago still
            has a small influence on today&apos;s value, but a workout from six
            months ago is effectively zero. For ATL, anything older than about
            three weeks is irrelevant.
          </p>

          <h2>How to Read the PMC Chart</h2>
          <p>
            Looking at a PMC chart, you will see three lines plotted against a
            time axis. Here is how to interpret the patterns:
          </p>

          <h3>Building Phase</h3>
          <p>
            CTL is rising steadily. ATL oscillates above CTL (you are
            consistently training harder than your current fitness level). TSB
            is negative, typically between -10 and -30. This is the productive
            zone where adaptation happens. You feel tired but are getting
            stronger.
          </p>

          <h3>Maintenance Phase</h3>
          <p>
            CTL is flat. ATL hovers around CTL. TSB oscillates near zero.
            You are training enough to maintain fitness but not enough to build
            it. This is appropriate during a competition phase where you want
            to race frequently without digging deeper.
          </p>

          <h3>Taper / Peak</h3>
          <p>
            Training volume drops. ATL falls sharply. CTL barely moves for the
            first week, then begins a slow decline. TSB rises from negative
            into positive territory. You are shedding fatigue while
            preserving fitness. The moment TSB crosses above +5 to +10 with
            CTL still near its peak — that is race day territory.
          </p>

          <h3>Detraining</h3>
          <p>
            Extended rest or very low training. Both CTL and ATL fall, but ATL
            falls faster, so TSB goes strongly positive. The athlete feels
            great but is losing fitness rapidly. TSB above +25 for more than a
            few days is a warning sign of detraining, not a sign of peak form.
          </p>

          <h2>CTL Ramp Rate: How Fast Can You Build Fitness?</h2>
          <p>
            The rate at which CTL increases week over week is called the{" "}
            <strong>ramp rate</strong>. It is one of the most important safety
            metrics in training planning.
          </p>
          <ul>
            <li>
              <strong>3-5 TSS/week</strong>: Conservative, sustainable ramp.
              Appropriate for most amateur athletes, especially those returning
              from a break or with limited training history.
            </li>
            <li>
              <strong>5-7 TSS/week</strong>: Aggressive but manageable for
              experienced athletes with good recovery habits (sleep, nutrition,
              low life stress).
            </li>
            <li>
              <strong>7-10 TSS/week</strong>: High risk. Only appropriate for
              young, well-adapted athletes or during supervised training camps.
            </li>
            <li>
              <strong>Above 10 TSS/week</strong>: Red flag. The risk of
              overtraining syndrome, illness, or injury rises steeply.
              Sustained ramp rates above 10 are a recipe for breakdown.
            </li>
          </ul>
          <p>
            Ramp rate is more predictive of injury risk than absolute CTL. An
            athlete with a CTL of 50 who jumps to 80 in three weeks is in far
            more danger than an athlete who built to CTL 120 over six months.
            The body adapts to load, but only at a finite rate. Connective
            tissue, in particular, adapts slower than cardiovascular and
            muscular systems — which is why overuse injuries often appear when
            the athlete feels cardiovascularly ready for more.
          </p>

          <h2>Periodization Using the PMC</h2>
          <p>
            The PMC is not just a monitoring tool — it is a planning tool.
            Traditional periodization maps cleanly onto PMC patterns:
          </p>

          <h3>Base Phase (8-12 weeks)</h3>
          <p>
            Gradually ramp CTL at 3-5 TSS/week through predominantly zone 2
            and tempo work. TSB stays mildly negative (-5 to -15). Include a
            rest week every 3-4 weeks where you reduce volume by 40%, letting
            TSB recover toward zero before the next build block.
          </p>

          <h3>Build Phase (4-8 weeks)</h3>
          <p>
            Introduce higher-intensity intervals. CTL continues rising, now
            possibly at 5-7 TSS/week. TSB dips deeper (-15 to -25) during
            hard weeks. Rest weeks are critical — without them, you accumulate
            fatigue that masks the fitness you are building. The classic 3:1
            pattern (three hard weeks, one easy week) is visible on the PMC as
            three weeks of declining TSB followed by a sharp recovery.
          </p>

          <h3>Peak / Race Phase (1-3 weeks)</h3>
          <p>
            Reduce volume by 40-60%, maintain some intensity. CTL begins a
            controlled decline (acceptable to lose 5-10%). ATL drops rapidly.
            TSB rises to +5 to +15. Time this so that race day falls when TSB
            is in the optimal window and CTL is still close to its peak value.
          </p>

          <h3>Recovery Phase (1-2 weeks)</h3>
          <p>
            After a goal event, allow full recovery. Unstructured riding, rest,
            cross-training. CTL will drop, and that is fine. You cannot hold
            peak fitness year-round — attempting to do so leads to stagnation
            or burnout.
          </p>

          <h2>Common Mistakes</h2>

          <h3>1. Chasing CTL</h3>
          <p>
            The single most common PMC mistake. Athletes become obsessed with
            raising their CTL number, treating it as a fitness score to
            maximize. They add junk volume — easy rides that boost TSS without
            providing meaningful training stimulus. A two-hour zone 1 ride
            adds TSS and raises CTL, but does little for performance compared
            to a structured interval session with the same TSS.
          </p>
          <p>
            CTL is a <em>descriptive</em> metric, not a{" "}
            <em>prescriptive</em> one. It tells you how much you have trained,
            not how well. Use it to monitor load, not as a target to chase.
          </p>

          <h3>2. Ignoring TSB</h3>
          <p>
            Some athletes wear deep negative TSB as a badge of honor. A TSB
            of -40 does not mean you are hardcore — it means you are
            accumulating fatigue faster than you can adapt. Sustained deep
            negative TSB (&lt; -30) for more than 7-10 days increases the risk
            of non-functional overreaching, where performance declines and
            recovery takes weeks instead of days.
          </p>

          <h3>3. Not Tapering (or Tapering Wrong)</h3>
          <p>
            Many athletes train hard right up to race day because they fear
            losing fitness. The math shows why this is wrong: a week of reduced
            training drops ATL by roughly 50-60% while CTL drops only about
            10-15%. The net effect on TSB is strongly positive. You arrive at
            the start line with 85-90% of your fitness and a fraction of the
            fatigue. That is a better athlete than the one who arrives at 100%
            fitness and 100% fatigue.
          </p>

          <h3>4. Comparing CTL Across Athletes</h3>
          <p>
            CTL is personal. An athlete with an FTP of 200W and a CTL of 70
            has been doing fundamentally different training than an athlete
            with an FTP of 350W and a CTL of 70. TSS is normalized to
            individual threshold, so CTL values are only meaningful within
            the context of one athlete&apos;s own training history.
          </p>

          <h3>5. Using the PMC Without Good TSS Data</h3>
          <p>
            The PMC is only as accurate as the TSS values feeding it. If you
            ride without a power meter, your TSS estimates (from heart rate or
            RPE) are noisy. If your FTP is wrong, every TSS calculation is
            wrong, and your entire PMC is distorted. Keep your FTP current —
            test or validate it every 6-8 weeks — and use a power meter for
            the most accurate tracking.
          </p>

          <h2>How TSS Feeds the PMC</h2>
          <p>
            Every point on the PMC is driven by a single daily input:{" "}
            <strong>TSS</strong> (Training Stress Score). For cycling, TSS is
            calculated as:
          </p>
          <p>
            <code>
              TSS = (duration_seconds &times; NP &times; IF) / (FTP &times;
              3600) &times; 100
            </code>
          </p>
          <p>
            Where NP is Normalized Power (a weighted average that accounts for
            variability) and IF is Intensity Factor (NP / FTP). An hour at
            threshold equals exactly 100 TSS. A two-hour endurance ride might
            be 80-120 TSS. A hard interval session might be 90-130 TSS despite
            being shorter.
          </p>
          <p>
            On rest days, TSS is zero, which causes both CTL and ATL to decay
            toward zero. This is how rest weeks work on the PMC — zero or low
            TSS days let fatigue (ATL) drop faster than fitness (CTL),
            improving TSB.
          </p>
          <p>
            For runners and swimmers, equivalent metrics exist: rTSS (running
            TSS from pace and threshold) and sTSS (swim TSS). The PMC model
            works identically regardless of the sport — only the input
            calculation differs.
          </p>

          <h2>Putting It All Together</h2>
          <p>
            The Performance Management Chart is a simplified model of a
            complex biological system. It does not capture sleep quality,
            psychological stress, nutrition, illness, or the specificity of
            your training. But as a <em>framework</em> for managing training
            load, it is remarkably effective.
          </p>
          <p>Here is what to remember:</p>
          <ul>
            <li>
              <strong>CTL is your fitness bank account.</strong> Build it
              steadily (3-7 TSS/week ramp rate), protect it during tapers, and
              accept it will fluctuate through the season.
            </li>
            <li>
              <strong>ATL is your fatigue credit card.</strong> You can
              accumulate it quickly to drive adaptation, but you have to pay it
              back with rest. Ignore the bill and you crash.
            </li>
            <li>
              <strong>TSB is your readiness gauge.</strong> Mildly negative
              during training blocks, near zero during recovery weeks, and
              positive for key events. Do not try to keep it positive all the
              time — that means you are not training hard enough to improve.
            </li>
          </ul>
          <p>
            The PMC works best when you combine it with subjective feedback —
            how you feel, how you sleep, how motivated you are. The chart
            provides the objective framework. Your body provides the
            ground truth. When they agree, you are on track. When they
            diverge, trust your body.
          </p>
        </article>

        <div className="not-prose mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-semibold">
            See your PMC chart in real-time
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Paincave calculates CTL, ATL, and TSB automatically from your
            Strava data. Watch your fitness evolve with every ride.
          </p>
          <Button className="mt-4" asChild>
            <Link href={"/register" as "/register"}>
              Start free <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

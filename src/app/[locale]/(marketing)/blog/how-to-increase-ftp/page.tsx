import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Increase Your FTP: A Science-Backed Plan",
  description:
    "Practical strategies to raise your Functional Threshold Power. Structured intervals, periodization, and the training principles that actually work.",
};

export default function HowToIncreaseFtpPage() {
  return (
    <main className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href={"/blog" as "/blog"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
            <Badge variant="secondary">Training Plans</Badge>
            <span>12 min read</span>
            <span>&middot;</span>
            <time dateTime="2026-03-07">March 7, 2026</time>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How to Increase Your FTP: A Science-Backed Plan
          </h1>
        </div>

        <div className="prose prose-neutral dark:prose-invert prose-headings:mt-12 prose-headings:mb-4 prose-h3:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1">
          <p className="lead">
            Functional Threshold Power is the single most important metric in
            cycling performance. It defines your training zones, determines your
            race pacing, and serves as the benchmark against which every watt of
            improvement is measured. But raising FTP is not a matter of riding
            harder more often. It requires a structured, periodized approach
            grounded in exercise physiology. This article breaks down exactly
            what drives FTP, which workouts move the needle, and how to organize
            a 12-week training block that delivers measurable gains.
          </p>

          <figure className="not-prose my-10">
            <div className="grid grid-cols-3 gap-3">
              {[
                { pillar: "VO2max", subtitle: "The Ceiling", icon: "\u2191", desc: "Maximum aerobic capacity \u2014 how big your engine is", color: "border-orange-500/30 bg-orange-500/5" },
                { pillar: "Lactate Threshold", subtitle: "The Tipping Point", icon: "\u2696", desc: "Where lactate production exceeds clearance \u2014 your FTP lives here", color: "border-primary/30 bg-primary/5" },
                { pillar: "Efficiency", subtitle: "The Multiplier", icon: "\u26A1", desc: "How much metabolic energy converts into watts at the pedals", color: "border-green-500/30 bg-green-500/5" },
              ].map((p) => (
                <div key={p.pillar} className={`rounded-lg border ${p.color} p-4 text-center`}>
                  <p className="text-2xl mb-2">{p.icon}</p>
                  <p className="text-sm font-semibold">{p.pillar}</p>
                  <p className="text-[10px] text-primary font-medium mt-0.5">{p.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              FTP sits at the intersection of these three systems. Effective training targets at least two of them.
            </figcaption>
          </figure>

          <h2>What Determines Your FTP</h2>
          <p>
            FTP sits at the intersection of three physiological systems. To
            raise it, you need to understand what you are actually training.
          </p>
          <p>
            <strong>VO2max — the ceiling.</strong> Your maximal oxygen uptake
            defines the upper limit of aerobic energy production. FTP typically
            falls between 72% and 85% of VO2max in trained cyclists. A higher
            ceiling means more room for FTP to grow. Think of VO2max as the size
            of your aerobic engine: you cannot sustain 300 watts at threshold if
            your engine can only produce 340 watts at maximum.
          </p>
          <p>
            <strong>Lactate threshold — the tipping point.</strong> As intensity
            rises, your muscles produce lactate faster than your body can clear
            it. The point where lactate accumulation accelerates sharply —
            roughly your FTP — determines the highest power you can sustain for
            40 to 70 minutes. Training this system improves lactate clearance
            rate, raises the percentage of VO2max you can hold, and increases
            muscular endurance at high intensities.
          </p>
          <p>
            <strong>Efficiency — the multiplier.</strong> Gross mechanical
            efficiency describes how much of your metabolic energy converts into
            watts at the pedals. Typical values range from 20% to 25%. Even
            small improvements — say from 21% to 22% — translate directly into
            higher sustainable power at the same metabolic cost. Efficiency
            improves through years of consistent riding, refined pedaling
            mechanics, and proper bike fit.
          </p>
          <p>
            Every effective FTP training plan targets at least two of these
            three systems. Neglect one, and you leave watts on the table.
          </p>

          <hr />
          <h2>The Three Pillars of FTP Improvement</h2>

          <h3>Pillar 1: Aerobic Base (Zone 2 Volume)</h3>
          <p>
            Zone 2 training — roughly 55% to 75% of FTP — is the foundation
            that everything else sits on. It is also the pillar most cyclists
            undervalue. Research by Seiler (2010) and others consistently shows
            that 80% of training volume for elite endurance athletes falls in
            this low-intensity zone. There are three reasons it matters so much
            for FTP.
          </p>
          <p>
            <strong>Mitochondrial density.</strong> Sustained aerobic riding
            triggers mitochondrial biogenesis — your muscle fibers produce more
            and larger mitochondria. Since mitochondria are the sites of aerobic
            energy production, more of them means a greater capacity to produce
            ATP from fat and carbohydrate oxidation at submaximal intensities.
            This directly supports higher sustainable power.
          </p>
          <p>
            <strong>Fat oxidation.</strong> Base training improves your muscles&apos;
            ability to use fat as fuel. At threshold, a well-trained cyclist
            still derives a meaningful percentage of energy from fat oxidation,
            sparing glycogen. Better fat metabolism means you can hold higher
            intensities before glycogen depletion forces you to slow down, and
            it delays the onset of heavy lactate accumulation.
          </p>
          <p>
            <strong>Capillarization.</strong> Consistent aerobic volume
            stimulates the growth of new capillaries around muscle fibers. A
            denser capillary network improves oxygen delivery, metabolic waste
            removal (including lactate), and overall muscular endurance. This
            adaptation takes months to develop fully, which is why base phases
            cannot be skipped or shortened without consequence.
          </p>
          <p>
            Practical guideline: aim for 8 to 15 hours per week of zone 2
            riding if your schedule allows. Even 6 hours delivers meaningful
            adaptations for time-crunched athletes. The key is consistency over
            weeks and months, not occasional long rides.
          </p>

          <h3>Pillar 2: Threshold Work (Zone 4 Intervals)</h3>
          <p>
            Threshold intervals target the exact physiological intensity where
            FTP lives. Training at 88% to 105% of FTP improves your body&apos;s
            ability to clear lactate, sustain high power outputs, and push the
            lactate threshold to a higher percentage of VO2max.
          </p>
          <p>
            The dose matters. Two threshold sessions per week during a build
            phase is the sweet spot for most athletes. More than three weekly
            sessions at this intensity risks chronic fatigue accumulation without
            proportional gains. Less than one session per week, and you are
            unlikely to see meaningful threshold adaptation.
          </p>
          <p>
            The mechanism is straightforward: sustained efforts near threshold
            force your muscles to produce and clear lactate at high rates
            simultaneously. Over time, the clearance machinery — MCT
            transporters, oxidative enzyme activity, buffering capacity — adapts
            to handle greater loads. The result is a measurably higher FTP.
          </p>

          <h3>Pillar 3: VO2max Intervals (Zone 5)</h3>
          <p>
            If threshold work builds the walls, VO2max work raises the roof.
            Intervals at 106% to 120% of FTP drive central cardiovascular
            adaptations: increased stroke volume, higher cardiac output, and
            improved oxygen extraction at the muscle level.
          </p>
          <p>
            Research by Ronnestad et al. (2015) demonstrated that adding VO2max
            intervals to a threshold-focused plan produced greater FTP gains
            than threshold work alone. The mechanism is indirect but powerful:
            by raising your VO2max ceiling, you create more physiological
            headroom for FTP to occupy.
          </p>
          <p>
            VO2max intervals are potent but taxing. One to two sessions per week
            is enough during the build phase. Accumulating too many high-intensity
            sessions leads to sympathetic nervous system overload, disrupted
            sleep, and stagnation.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              FTP improvement requires three pillars working together: aerobic base (Zone 2 volume for mitochondria and capillaries), threshold work (Zone 4 intervals for lactate clearance), and VO2max intervals (Zone 5 to raise your aerobic ceiling). Neglect any one and you leave watts on the table.
            </p>
          </div>

          <hr />
          <h2>Specific Workout Prescriptions</h2>
          <p>
            The following workouts are the building blocks of an effective FTP
            training plan. Each targets a specific adaptation. Power targets are
            given as percentages of your current FTP.
          </p>

          <h3>Sweet Spot Intervals</h3>
          <p>
            <strong>2 x 20 minutes at 88-93% FTP</strong>, with 5 minutes easy
            spinning between intervals. Sweet spot sits just below threshold —
            hard enough to drive meaningful adaptation, manageable enough to
            accumulate significant time in the training zone without excessive
            fatigue. This is the highest-value workout per unit of recovery cost.
            It builds muscular endurance, lactate tolerance, and aerobic
            capacity simultaneously.
          </p>
          <p>
            Progression: start with 2x15 if 2x20 is not manageable. Over the
            course of a build phase, extend to 2x25 or 3x20 as fitness
            develops. The goal is progressive overload in duration, not intensity
            — stay in the 88-93% range.
          </p>

          <h3>Threshold Intervals</h3>
          <p>
            <strong>3 x 10 minutes at 95-105% FTP</strong>, with 5 minutes
            recovery between efforts. These are bread-and-butter threshold
            sessions. The intensity is close enough to FTP to stress lactate
            clearance systems directly, while the interval duration allows you
            to accumulate 30 minutes of quality threshold-zone work.
          </p>
          <p>
            Cadence matters here. Aim for 85-95 RPM to optimize the balance
            between muscular and cardiovascular load. Lower cadences shift
            stress toward muscular strength; higher cadences emphasize
            cardiovascular demand.
          </p>

          <h3>VO2max Intervals</h3>
          <p>
            <strong>5 x 4 minutes at 106-120% FTP</strong>, with 4 minutes
            recovery between intervals. The objective is to spend as much time
            as possible near your maximal oxygen uptake. Four-minute intervals
            are long enough to drive VO2 to near-maximum levels, and five
            repetitions accumulate 20 minutes of high-quality work.
          </p>
          <p>
            Pacing is critical. Start the first interval at 106% and let
            perceived effort guide you through the set. The last two intervals
            will feel significantly harder than the first two — that is expected.
            If you cannot complete all five intervals within the target range,
            the power target is too high.
          </p>

          <h3>Over-Under Intervals</h3>
          <p>
            <strong>Alternating 2 minutes at 95% FTP / 1 minute at 105%
            FTP</strong>, repeated 4 to 6 times within a single block of 12 to
            18 minutes. Rest 5 minutes and repeat for a second block. Over-unders
            are specifically designed to train your body&apos;s ability to clear
            lactate while continuing to produce power. The &quot;over&quot; phases push
            you above threshold, driving lactate accumulation. The &quot;under&quot;
            phases force clearance at an intensity still high enough to maintain
            physiological stress.
          </p>
          <p>
            This workout is arguably the most race-specific session for
            time trialists and road racers, where surges above threshold
            followed by sustained power are a constant demand.
          </p>

          <div className="not-prose my-8 rounded-xl border border-border/50 bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">
              Need to know your current FTP before starting? Use our calculator
              with your most recent 20-minute, 8-minute, or ramp test result.
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href={"/tools/ftp-calculator" as "/tools/ftp-calculator"}>
                FTP Calculator <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <hr />
          <h2>Periodization: A 12-Week FTP Block</h2>
          <p>
            Random training produces random results. A structured 12-week block
            organizes your training into phases, each with a specific
            physiological objective. This is classical linear periodization
            adapted for FTP development.
          </p>

          <figure className="not-prose my-8">
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs font-semibold mb-3 text-center">12-Week FTP Training Block</p>
              <div className="flex rounded overflow-hidden">
                <div className="bg-blue-500/20 border-r border-background flex-[4] py-3 px-2 text-center">
                  <p className="text-[10px] font-semibold text-blue-400">Base</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Wk 1-4</p>
                </div>
                <div className="bg-yellow-500/20 border-r border-background flex-[4] py-3 px-2 text-center">
                  <p className="text-[10px] font-semibold text-yellow-400">Build</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Wk 5-8</p>
                </div>
                <div className="bg-orange-500/20 border-r border-background flex-[3] py-3 px-2 text-center">
                  <p className="text-[10px] font-semibold text-orange-400">Specialize</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Wk 9-11</p>
                </div>
                <div className="bg-green-500/20 flex-[1] py-3 px-2 text-center">
                  <p className="text-[10px] font-semibold text-green-400">Test</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Wk 12</p>
                </div>
              </div>
              <div className="flex mt-2">
                <div className="flex-[4] text-center">
                  <p className="text-[9px] text-muted-foreground">80% Z2, 20% SST</p>
                </div>
                <div className="flex-[4] text-center">
                  <p className="text-[9px] text-muted-foreground">Z4 + Z5 intervals</p>
                </div>
                <div className="flex-[3] text-center">
                  <p className="text-[9px] text-muted-foreground">Race-specific</p>
                </div>
                <div className="flex-[1] text-center">
                  <p className="text-[9px] text-muted-foreground">Taper</p>
                </div>
              </div>
              {/* Intensity arrow */}
              <div className="flex items-center gap-2 mt-3 px-2">
                <span className="text-[9px] text-muted-foreground">Intensity</span>
                <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-blue-500/30 via-yellow-500/40 to-orange-500/50" />
                <span className="text-[9px] text-muted-foreground">{"\u2192"}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 px-2">
                <span className="text-[9px] text-muted-foreground">Volume&nbsp;&nbsp;&nbsp;</span>
                <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-blue-500/50 via-yellow-500/30 to-green-500/10" />
                <span className="text-[9px] text-muted-foreground">{"\u2192"}</span>
              </div>
            </div>
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              Volume decreases as intensity increases through the block. The taper week sheds fatigue before retesting.
            </figcaption>
          </figure>

          <h3>Weeks 1-4: Base Building</h3>
          <p>
            The base phase is about volume, not intensity. Approximately 80% of
            your training time should fall in zone 2. The remaining 20% can
            include one sweet spot session per week to maintain some
            threshold-range stimulus.
          </p>
          <p>
            During this phase, you are building the aerobic infrastructure —
            mitochondrial density, capillarization, fat oxidation — that will
            support harder work in later phases. Resist the temptation to add
            intensity early. The patience you invest here pays dividends in
            weeks 5 through 11.
          </p>
          <p>
            Target training load: establish your baseline CTL (Chronic Training
            Load) and aim for a ramp rate of 3 to 5 TSS per week. This is
            conservative on purpose. Aggressive ramps during base training
            often lead to illness or overtraining before you reach the build
            phase.
          </p>

          <h3>Weeks 5-8: Build Phase</h3>
          <p>
            Now you layer intensity on top of your aerobic base. A typical week
            includes two high-intensity sessions — one threshold workout and one
            VO2max session — with the remaining volume in zone 2. Total volume
            may decrease slightly (by 10-15%) to accommodate the higher
            intensity load.
          </p>
          <p>
            This is where the majority of FTP gains happen. The combination of
            threshold work (raising lactate clearance) and VO2max intervals
            (raising the aerobic ceiling) attacks FTP from both sides. Sweet
            spot sessions can replace threshold sessions on lighter weeks or
            when fatigue is accumulating.
          </p>
          <p>
            Ramp rate during the build phase: 5 to 7 TSS per week is
            appropriate for most athletes. Monitor fatigue carefully. If your
            Training Stress Balance (TSB) drops below -30, consider an
            additional rest day.
          </p>

          <h3>Weeks 9-11: Specialization</h3>
          <p>
            The specialization phase narrows your training to the specific
            demands of your target event or goal. For pure FTP development,
            this means an increase in threshold-specific work: more over-unders,
            longer sweet spot intervals, and race-simulation efforts.
          </p>
          <p>
            Volume decreases another 10-15% from the build phase. The
            intensity distribution shifts — roughly 70% zone 2, 30% zone 4 and
            above. VO2max sessions drop to once per week or every 10 days.
            The focus is on converting the fitness you have built into
            sustainable power at and near threshold.
          </p>

          <h3>Week 12: Test Week</h3>
          <p>
            The final week is a structured taper followed by an FTP retest.
            Reduce volume by 40-50% while keeping two short, sharp openers —
            brief efforts at threshold and above — to keep the neuromuscular
            system primed. Take two full rest days before your test.
          </p>
          <p>
            Retest with the same protocol you used at baseline (20-minute test,
            ramp test, or 8-minute test). Consistency in testing protocol is
            critical for valid comparison.
          </p>

          <div className="not-prose my-8 rounded-xl border border-border/50 bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">
              Want to understand how CTL, ATL, and TSB guide training load
              management throughout your block? Read our detailed explainer.
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link
                href={
                  "/blog/ctl-atl-tsb-explained" as "/blog/ctl-atl-tsb-explained"
                }
              >
                CTL, ATL & TSB Explained{" "}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              Structure your 12-week block in phases: 4 weeks of aerobic base building, 4 weeks of build with threshold and VO2max intervals, 3 weeks of specialization, and 1 week of taper before retesting. Random training produces random results.
            </p>
          </div>

          <hr />
          <h2>Weekly Structure Example (5 Rides/Week)</h2>
          <p>
            Here is a practical weekly layout for the build phase (weeks 5-8).
            This assumes five rides per week, which is manageable for most
            serious amateur cyclists.
          </p>
          <div className="not-prose my-6 grid grid-cols-7 gap-1">
            {[
              { day: "Mon", type: "Rest", color: "bg-zinc-500/10", text: "text-zinc-400", detail: "Full recovery" },
              { day: "Tue", type: "Z4", color: "bg-yellow-500/15", text: "text-yellow-400", detail: "3\u00D710min threshold" },
              { day: "Wed", type: "Z2", color: "bg-blue-500/15", text: "text-blue-400", detail: "60-90min easy" },
              { day: "Thu", type: "Z5", color: "bg-orange-500/15", text: "text-orange-400", detail: "5\u00D74min VO2max" },
              { day: "Fri", type: "Rest", color: "bg-zinc-500/10", text: "text-zinc-400", detail: "Rest or easy spin" },
              { day: "Sat", type: "SST", color: "bg-green-500/15", text: "text-green-400", detail: "2\u00D720min sweet spot" },
              { day: "Sun", type: "Z2", color: "bg-blue-500/15", text: "text-blue-400", detail: "Long ride 2-4hr" },
            ].map((d) => (
              <div key={d.day} className={`${d.color} rounded-lg p-2 text-center`}>
                <p className="text-[10px] text-muted-foreground">{d.day}</p>
                <p className={`text-xs font-bold ${d.text} mt-0.5`}>{d.type}</p>
                <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{d.detail}</p>
              </div>
            ))}
          </div>
          <p>
            The key principle: never stack two high-intensity sessions on
            consecutive days. Always separate hard days with at least one easy
            day or rest day to allow adequate recovery and adaptation.
          </p>

          <hr />
          <h2>Progressive Overload: Increasing Training Load Safely</h2>
          <p>
            Progressive overload is the fundamental mechanism of adaptation:
            gradually increase the training stimulus so your body is forced to
            adapt. In cycling training, this is most practically measured
            through Training Stress Score (TSS) and Chronic Training Load (CTL).
          </p>
          <p>
            <strong>Target CTL ramp rate: 3-7 TSS/week.</strong> This is the
            rate at which your rolling 42-day average daily TSS increases. A
            ramp rate of 3-5 is conservative and appropriate for base phases or
            athletes returning from a break. A ramp of 5-7 is more aggressive
            and suits the build phase of experienced athletes.
          </p>
          <p>
            Exceeding 7 TSS/week ramp rate significantly increases injury and
            illness risk. Research on training load and injury in endurance
            sport (Gabbett, 2016) consistently shows that acute-to-chronic
            workload ratios above 1.5 correlate with elevated injury rates. A
            controlled CTL ramp keeps this ratio in the safe zone (0.8 to 1.3).
          </p>
          <p>
            Apply overload through three levers, in order of priority:
          </p>
          <p>
            <strong>1. Frequency.</strong> Add a training day before increasing
            session intensity or duration. Going from 4 to 5 rides per week
            adds volume with minimal per-session stress.
          </p>
          <p>
            <strong>2. Duration.</strong> Extend interval sets or total ride
            time. Adding 5 minutes to your sweet spot intervals or 30 minutes
            to your long ride increases training load progressively.
          </p>
          <p>
            <strong>3. Intensity.</strong> Increase interval power targets only
            after frequency and duration have been maximized. Intensity is the
            most potent stimulus but also the most fatiguing and the most likely
            to cause overtraining.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              Apply overload in order of priority: frequency first, then duration, then intensity. A CTL ramp rate above 7 TSS/week significantly increases injury and illness risk.
            </p>
          </div>

          <hr />
          <h2>Recovery and Adaptation</h2>
          <p>
            Training does not make you fitter. Training applies stress.
            Recovery is when your body adapts and gets fitter. This
            distinction is not semantic — it has direct implications for how you
            structure your training.
          </p>
          <p>
            <strong>Supercompensation.</strong> After a training stimulus, your
            performance initially decreases (fatigue). During recovery, your
            body rebuilds to a level slightly above your previous baseline.
            This is supercompensation. The timing of your next hard session
            matters: too soon, and you accumulate fatigue without full
            adaptation. Too late, and the supercompensation window closes. For
            most cyclists, 48 to 72 hours between high-intensity sessions is
            the practical target.
          </p>
          <p>
            <strong>Sleep.</strong> Sleep is the single most powerful recovery
            tool. During deep sleep, growth hormone release peaks, tissue repair
            accelerates, and glycogen resynthesis occurs. Aim for 7 to 9 hours
            per night. Athletes in heavy training blocks often benefit from 8 to
            9 hours. Sleep quality matters as much as duration — cool rooms,
            consistent schedules, and limited screen time before bed all
            contribute.
          </p>
          <p>
            <strong>Nutrition for recovery.</strong> Post-ride nutrition
            directly affects the rate of adaptation. Within 30 minutes of
            finishing a hard session, consume 1.0 to 1.2 g/kg of carbohydrate
            and 0.3 to 0.4 g/kg of protein. This replenishes glycogen stores
            and provides amino acids for muscle repair. During heavy training
            blocks, daily carbohydrate intake should reach 6 to 8 g/kg of body
            weight for adequate fuel availability.
          </p>
          <p>
            <strong>Recovery weeks.</strong> Every third or fourth week should be
            a recovery week with volume reduced by 30-40% and intensity reduced
            to only one moderate session. These de-load weeks are not lost
            training — they are when your body consolidates the adaptations from
            the preceding hard weeks.
          </p>

          <hr />
          <h2>Realistic FTP Gains: What to Expect</h2>
          <p>
            Setting realistic expectations prevents both discouragement and
            reckless overtraining. FTP improvement rate depends heavily on
            training history and current fitness level.
          </p>
          <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-sm font-semibold">Beginner</p>
              <p className="text-xs text-muted-foreground mt-1">First 1-2 years of structured training</p>
              <p className="text-sm font-medium mt-2">1-2 watts/week</p>
              <p className="text-xs text-muted-foreground mt-1">12-24 watts over 12 weeks. Initial gains of 15-20% in the first year are common.</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-sm font-semibold">Intermediate</p>
              <p className="text-xs text-muted-foreground mt-1">2-4 years of training</p>
              <p className="text-sm font-medium mt-2">0.5-1 watt/week</p>
              <p className="text-xs text-muted-foreground mt-1">6-12 watts over 12 weeks. A 5-8% annual improvement is a strong result.</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-sm font-semibold">Advanced</p>
              <p className="text-xs text-muted-foreground mt-1">4+ years of consistent training</p>
              <p className="text-sm font-medium mt-2">0.25-0.5 watts/week</p>
              <p className="text-xs text-muted-foreground mt-1">3-6 watts over 12 weeks. Annual improvements of 2-4% are realistic.</p>
            </div>
          </div>
          <p>
            These numbers assume consistent, well-structured training with
            adequate recovery. Illness, life stress, or poor periodization can
            reduce or eliminate gains entirely. Conversely, athletes returning
            from a break may see faster initial progress due to the &quot;muscle
            memory&quot; effect.
          </p>

          <hr />
          <h2>Plateau-Busting Strategies</h2>
          <p>
            Every cyclist eventually hits a plateau — a period where FTP refuses
            to budge despite consistent training. Here are evidence-based
            strategies to break through.
          </p>
          <p>
            <strong>Increase volume before intensity.</strong> Most plateaus
            result from insufficient aerobic base, not insufficient intensity.
            Before adding a third interval session, ask whether you can add two
            more hours of zone 2 riding per week. Research consistently shows
            that total training volume is the strongest predictor of endurance
            performance at every level.
          </p>
          <p>
            <strong>Vary the stimulus.</strong> If you have been doing the same
            2x20 sweet spot intervals for months, your body has adapted to that
            specific stimulus. Switch to 3x15 at a slightly higher intensity, or
            try over-unders, or add a VO2max session. Novel stimuli provoke
            fresh adaptation.
          </p>
          <p>
            <strong>Polarize your training.</strong> The polarized training
            model — roughly 80% of sessions easy, 20% very hard, with minimal
            time at moderate intensity — has shown strong results in studies
            comparing it to threshold-heavy approaches (Stoggl & Sperlich,
            2014). If your training has been heavily centered on sweet spot and
            threshold work, a shift toward polarized distribution may break the
            plateau.
          </p>
          <p>
            <strong>Take a real break.</strong> Sometimes the best strategy is
            7 to 10 days of complete rest or very light activity. Accumulated
            fatigue, even when not obvious, can mask fitness and prevent
            supercompensation. A rest period allows full systemic recovery and
            often results in a performance bump upon returning to training.
          </p>
          <p>
            <strong>Address limiters.</strong> Identify whether your limiter is
            VO2max (you struggle with short, hard efforts), lactate threshold
            (you fade during sustained efforts), or muscular endurance (your
            legs fail before your lungs). Target your limiter directly with
            sport-specific intervals.
          </p>

          <hr />
          <h2>Common Mistakes</h2>
          <p>
            <strong>Too much intensity.</strong> This is by far the most common
            training error. Athletes ride too hard on easy days and not hard
            enough on hard days — the &quot;moderate intensity trap.&quot; The result is
            chronic fatigue without the training stimulus needed for specific
            adaptations. Be disciplined: zone 2 should feel genuinely easy.
            If you cannot hold a conversation, you are going too hard.
          </p>
          <p>
            <strong>Not enough rest.</strong> Training is a stress-recovery
            cycle. Without adequate recovery, adaptation does not occur. Two
            rest days per week is a minimum for most athletes during build
            phases. Recovery weeks every 3 to 4 weeks are essential, not
            optional. Many athletes skip de-load weeks because they &quot;feel
            fine&quot; — fatigue accumulation is often invisible until performance
            collapses.
          </p>
          <p>
            <strong>Neglecting base training.</strong> Skipping the base phase
            to jump straight into intervals is like building a house without a
            foundation. You may see short-term gains, but they are fragile and
            unsustainable. Athletes who invest in aerobic base training
            consistently outperform those who rely on intensity alone, especially
            over multi-year time horizons.
          </p>
          <p>
            <strong>Testing too frequently.</strong> FTP tests are stressful and
            require a taper. Testing every two weeks disrupts training
            continuity and often produces discouraging results because
            adaptation has not had time to manifest. Test every 6 to 8 weeks,
            or simply let your training software detect breakthroughs during
            hard rides.
          </p>
          <p>
            <strong>Ignoring nutrition and sleep.</strong> You cannot out-train a
            caloric deficit during a build phase, and you cannot adapt without
            adequate sleep. These are not supplementary considerations — they
            are load-bearing pillars of the adaptation process.
          </p>

          <hr />
          <h2>Putting It All Together</h2>
          <p>
            Raising your FTP is not complicated, but it is demanding. The
            formula is deceptively simple: build a large aerobic base, add
            structured intensity in the right doses, manage recovery
            rigorously, and be patient. The athletes who make consistent,
            year-over-year FTP gains are almost always the ones who resist the
            temptation to do too much, too soon.
          </p>
          <p>
            Start with an honest assessment of your current fitness. Set a
            baseline FTP test. Build your 12-week plan around the three pillars:
            aerobic volume, threshold work, and VO2max intervals. Progress
            conservatively — a CTL ramp of 3 to 7 TSS per week. Prioritize
            sleep and nutrition. And when the plan says rest, rest.
          </p>
          <p>
            The watts will come.
          </p>

          <div className="not-prose mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">
              Get a structured plan to raise your FTP
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paincave builds your training plan automatically — periodized
              phases, progressive overload, and daily workouts targeting the
              right zones.
            </p>
            <Button className="mt-4" asChild>
              <Link href={"/register" as "/register"}>
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

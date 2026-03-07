import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Coggan Power Zones: The 7-Zone Model Explained",
  description:
    "A deep dive into each of the 7 Coggan power zones — what they train, how long to ride in them, and how to structure your workouts around them.",
};

export default function CyclingPowerZonesArticle() {
  return (
    <main className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href={"/blog" as "/blog"}
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">Cycling</Badge>
            <span>9 min read</span>
            <span>&middot;</span>
            <time dateTime="2026-03-07">March 7, 2026</time>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Coggan Power Zones: The 7-Zone Model Explained
          </h1>
        </div>

        <div className="prose prose-neutral dark:prose-invert">
          <p className="lead">
            Power zones are the backbone of structured cycling training. Developed by Dr. Andrew Coggan and co-authored
            with Hunter Allen in <em>Training and Racing with a Power Meter</em>, the 7-zone model gives every cyclist a
            precise framework for targeting specific physiological systems. No guesswork. No &quot;how do my legs
            feel?&quot; Just watts, percentages, and repeatable training stimulus.
          </p>

          <h2>Why Train with Power Zones?</h2>

          <p>
            Heart rate is useful, but it lies. It drifts upward in heat, lags behind changes in effort, spikes with
            caffeine and stress, and decouples from actual workload during fatigue. Power, measured in watts, is
            instantaneous and objective. Two hundred watts today is two hundred watts tomorrow, regardless of temperature,
            hydration, or how much sleep you got.
          </p>

          <p>
            Training zones built on Functional Threshold Power (FTP) give you something heart rate cannot: reproducible
            intensity targets that correspond to specific energy systems. When your coach says &quot;ride at 92% FTP for
            20 minutes,&quot; there is zero ambiguity. You know the wattage, you know the adaptation you are targeting,
            and you can compare that session to one you did six weeks ago to see whether you have improved.
          </p>

          <p>
            This precision matters because different intensities produce different adaptations. Riding too hard on an
            endurance day undermines recovery. Riding too easy during a threshold session wastes the training opportunity.
            Zones eliminate the grey area.
          </p>

          <h2>The 7 Coggan Power Zones</h2>

          <p>
            Each zone is defined as a percentage range of your FTP — the maximum power you can sustain for approximately
            one hour. Here is the complete model.
          </p>

          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-semibold">Zone</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">% FTP</th>
                  <th className="px-3 py-2 font-semibold">RPE</th>
                  <th className="px-3 py-2 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-2 font-medium">Z1</td>
                  <td className="px-3 py-2">Active Recovery</td>
                  <td className="px-3 py-2">&lt;55%</td>
                  <td className="px-3 py-2">1-2</td>
                  <td className="px-3 py-2">30-90 min</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Z2</td>
                  <td className="px-3 py-2">Endurance</td>
                  <td className="px-3 py-2">55-75%</td>
                  <td className="px-3 py-2">3-4</td>
                  <td className="px-3 py-2">1-6 hours</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Z3</td>
                  <td className="px-3 py-2">Tempo</td>
                  <td className="px-3 py-2">75-90%</td>
                  <td className="px-3 py-2">5-6</td>
                  <td className="px-3 py-2">1-3 hours</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Z4</td>
                  <td className="px-3 py-2">Threshold</td>
                  <td className="px-3 py-2">90-105%</td>
                  <td className="px-3 py-2">6-7</td>
                  <td className="px-3 py-2">8-30 min intervals</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Z5</td>
                  <td className="px-3 py-2">VO2max</td>
                  <td className="px-3 py-2">105-120%</td>
                  <td className="px-3 py-2">7-8</td>
                  <td className="px-3 py-2">3-8 min intervals</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Z6</td>
                  <td className="px-3 py-2">Anaerobic Capacity</td>
                  <td className="px-3 py-2">120-150%</td>
                  <td className="px-3 py-2">8-9</td>
                  <td className="px-3 py-2">30s-3 min intervals</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Z7</td>
                  <td className="px-3 py-2">Neuromuscular Power</td>
                  <td className="px-3 py-2">150%+</td>
                  <td className="px-3 py-2">10</td>
                  <td className="px-3 py-2">&lt;30s sprints</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose my-8 rounded-lg border p-4 text-center">
            <p className="text-sm text-muted-foreground">Want your exact watt ranges?</p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href={"/tools/power-zones" as "/tools/power-zones"}>
                Calculate your zones <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <h2>Zone 1 — Active Recovery (&lt;55% FTP)</h2>

          <p>
            Active recovery is not training in any meaningful sense. The wattage is too low to provoke adaptation.
            Instead, it serves recovery: light pedaling increases blood flow to damaged muscles, accelerates lactate
            clearance, and loosens legs after hard training blocks. RPE should be a 1 or 2 out of 10 — a conversational
            spin where you could hold a phone call without anyone knowing you are on the bike.
          </p>

          <p>
            <strong>Physiological effect:</strong> Enhanced blood flow and nutrient delivery to muscle tissue. No
            significant glycogen depletion or muscle fiber recruitment.
          </p>

          <p>
            <strong>Example workout:</strong> 45-60 minutes of easy spinning at 50-55% FTP on a flat route. Keep cadence
            comfortable (85-95 rpm). If you find yourself pushing harder on a climb, shift down or take a different route.
          </p>

          <h2>Zone 2 — Endurance (55-75% FTP)</h2>

          <p>
            Zone 2 is where aerobic fitness is built. This is the intensity that develops mitochondrial density,
            capillarization, fat oxidation capacity, and cardiovascular efficiency. It trains your body to produce more
            energy aerobically, sparing glycogen for when it matters. The adaptations are slow — weeks and months, not
            days — but they are foundational. Every serious training plan dedicates the majority of volume to this zone.
          </p>

          <p>
            At this intensity, your breathing is elevated but controlled. You can hold a full conversation. Your legs feel
            like they could continue for hours, because they can. RPE sits at 3-4 out of 10. Many athletes ride too hard
            in zone 2, creeping into zone 3 territory, which adds fatigue without meaningfully increasing the aerobic
            stimulus. This is one of the most common and most damaging training errors.
          </p>

          <p>
            <strong>Physiological effect:</strong> Increased mitochondrial volume and density, improved capillary network
            in working muscles, greater fat oxidation at given intensity, improved stroke volume.
          </p>

          <p>
            <strong>Example workout:</strong> 2-4 hour ride at 60-72% FTP. Flat to rolling terrain. Keep power steady and
            resist the urge to push on climbs. Use heart rate decoupling (the Pw:Hr ratio) to monitor aerobic fitness
            development over time.
          </p>

          <h2>Zone 3 — Tempo (75-90% FTP)</h2>

          <p>
            Tempo is the &quot;comfortably hard&quot; zone. You can speak in short sentences but not carry on a flowing
            conversation. It develops muscular endurance and sustainable power, and it produces meaningful training stress
            in less time than zone 2. For time-crunched athletes, tempo intervals are a pragmatic substitute for long
            endurance rides.
          </p>

          <p>
            The risk with tempo is overuse. It is fatiguing enough to compromise recovery but not intense enough to
            produce the high-end adaptations of threshold or VO2max work. Spending too much time here — the so-called
            &quot;zone 3 black hole&quot; or &quot;no man&apos;s land&quot; — is a common trap. You feel like you are
            training hard, but you are neither recovering nor maximally stimulating high-intensity adaptations.
          </p>

          <p>
            <strong>Physiological effect:</strong> Improved lactate clearance, increased glycogen storage capacity,
            enhanced muscular endurance. Moderate training stress.
          </p>

          <p>
            <strong>Example workout:</strong> 2 x 30 minutes at 80-88% FTP with 5 minutes recovery between intervals. Or
            a continuous 60-90 minute tempo ride for a sweetspot-style session that targets the upper end of the range.
          </p>

          <h2>Zone 4 — Threshold (90-105% FTP)</h2>

          <p>
            This is the zone most directly tied to your FTP. Threshold intervals push your lactate threshold higher,
            allowing you to sustain greater absolute power before accumulating fatigue. At this intensity, lactate
            production and clearance are roughly in balance — a state you can maintain for 30-60 minutes in a race, but
            typically 8-20 minutes per interval in training.
          </p>

          <p>
            RPE is 6-7 out of 10. Breathing is heavy and rhythmic. Speaking is limited to a few words. Mentally, you need
            to focus to hold the effort. This zone is where FTP improvements are forged, making it the cornerstone of
            build and specialization phases.
          </p>

          <p>
            <strong>Physiological effect:</strong> Raised lactate threshold, increased FTP, improved ability to sustain
            high power over time. Significant glycogen depletion.
          </p>

          <p>
            <strong>Example workout:</strong> 3 x 12 minutes at 95-100% FTP with 5 minutes recovery. Alternatively,
            2 x 20 minutes at 90-95% FTP — the classic &quot;2 x 20&quot; threshold session that has built more FTP
            gains than any other workout in cycling.
          </p>

          <h2>Zone 5 — VO2max (105-120% FTP)</h2>

          <p>
            VO2max intervals stress your aerobic ceiling — the maximum rate at which your body can consume oxygen. These
            are hard. RPE is 7-8 out of 10. Your breathing is labored and rapid. You cannot speak. Each interval lasts 3-8
            minutes, long enough to elicit a full cardiovascular response and drive your heart rate to near-maximum.
          </p>

          <p>
            The primary adaptation is an increase in maximum oxygen uptake (VO2max), which raises the ceiling above which
            your threshold sits. Think of it this way: if threshold training raises the floor of your sustainable power,
            VO2max training raises the roof. Both matter, and the interplay between them determines your performance at
            any duration from 5 minutes to 5 hours.
          </p>

          <p>
            <strong>Physiological effect:</strong> Increased VO2max, improved cardiac output, enhanced oxygen delivery
            and utilization by working muscles.
          </p>

          <p>
            <strong>Example workout:</strong> 5 x 4 minutes at 108-115% FTP with 4 minutes recovery. The recovery
            should be easy spinning in zone 1 — do not ride tempo between intervals. An alternative is 6 x 3 minutes at
            110-118% FTP with 3 minutes rest.
          </p>

          <h2>Zone 6 — Anaerobic Capacity (120-150% FTP)</h2>

          <p>
            Zone 6 targets your anaerobic energy system — the capacity to produce power above what aerobic metabolism
            can support. Intervals are short (30 seconds to 3 minutes) and very intense. RPE is 8-9 out of 10. Lactate
            accumulates rapidly and you will feel a deep muscular burn. Recovery between efforts needs to be substantial,
            typically equal to or longer than the work interval.
          </p>

          <p>
            These efforts develop the ability to surge, attack, and respond to race situations that demand power above
            threshold. They also raise your anaerobic work capacity (W&apos;, or W-prime), which represents the finite
            amount of work you can do above FTP before exhaustion.
          </p>

          <p>
            <strong>Physiological effect:</strong> Increased anaerobic capacity (W&apos;), improved lactate tolerance,
            enhanced ability to buffer hydrogen ions in muscle tissue. Greater glycolytic enzyme activity.
          </p>

          <p>
            <strong>Example workout:</strong> 8 x 1 minute at 130-140% FTP with 2 minutes recovery. Or 6 x 2 minutes
            at 120-130% FTP with 4 minutes easy spinning. These sessions produce extreme fatigue — use them sparingly
            and ensure adequate recovery.
          </p>

          <h2>Zone 7 — Neuromuscular Power (150%+ FTP)</h2>

          <p>
            Zone 7 is maximum effort sprinting. Intervals last fewer than 30 seconds and recruit the maximum number of
            muscle fibers possible. Power output is enormous — often two to three times FTP — but it cannot be
            sustained. RPE is a flat 10. You are going as hard as your body will allow.
          </p>

          <p>
            The energy comes almost entirely from the phosphocreatine system, which depletes in roughly 10-15 seconds
            and takes several minutes to fully recharge. Neuromuscular training improves the speed and force of muscle
            contraction, the coordination of motor unit recruitment, and peak power output.
          </p>

          <p>
            <strong>Physiological effect:</strong> Improved neuromuscular coordination, increased peak power output,
            faster motor unit recruitment. Phosphocreatine system development.
          </p>

          <p>
            <strong>Example workout:</strong> 8 x 12-second all-out sprints with 5 minutes recovery between each.
            Start from a rolling pace of 25-30 km/h, then sprint maximally in a big gear. Full recovery between efforts
            is non-negotiable — if you cannot reach peak power, the recovery was too short.
          </p>

          <h2>Zone Distribution: How to Structure Your Training</h2>

          <p>
            Knowing the zones is only half the picture. How you distribute your time across them determines whether
            your training produces results or just fatigue. Three models dominate the endurance training literature.
          </p>

          <h3>Polarized Training</h3>

          <p>
            Roughly 80% of training volume in zones 1-2 (low intensity) and 20% in zones 5-7 (high intensity), with
            very little time in zones 3-4. Research by Stephen Seiler and others has shown this distribution produces
            superior endurance adaptations in trained athletes compared to threshold-heavy approaches. The logic is
            straightforward: easy days are truly easy, allowing full recovery, so hard days can be genuinely hard.
          </p>

          <h3>Pyramidal Training</h3>

          <p>
            The majority of volume in zone 2, a moderate amount in zone 3, less in zone 4, and small doses of zone 5+.
            The distribution tapers like a pyramid from low to high intensity. This model is common in professional road
            cycling where large training volumes make some tempo riding inevitable, particularly during group rides and
            races.
          </p>

          <h3>Threshold-Focused Training</h3>

          <p>
            A higher proportion of time at zones 3-4, often used by time-crunched athletes who cannot accumulate enough
            volume for a purely polarized approach. Effective for raising FTP in the short term, but carries higher
            fatigue cost and may lead to stagnation if sustained indefinitely.
          </p>

          <h2>The 80/20 Rule</h2>

          <p>
            Regardless of which model you follow, the underlying principle is the same: approximately 80% of your
            training should be at low intensity (zones 1-2) and 20% at high intensity (zones 4-7). This ratio has been
            observed in the training logs of elite endurance athletes across cycling, running, rowing, and
            cross-country skiing.
          </p>

          <p>
            The reason is physiological. Low-intensity training drives aerobic adaptation with minimal fatigue cost.
            High-intensity training provides the stimulus needed for threshold and VO2max improvements but carries
            significant recovery demands. The 80/20 split maximizes adaptation while managing fatigue — the fundamental
            equation of endurance training.
          </p>

          <h2>How Zones Change as FTP Changes</h2>

          <p>
            Power zones are relative to your FTP, so as your FTP rises, your zones shift upward in absolute watts.
            What was zone 4 at an FTP of 220W becomes zone 3 at an FTP of 260W. This means your training must
            continuously adapt. A workout that was a threshold session six months ago may now be a tempo ride.
          </p>

          <p>
            This is why regular FTP testing — or better yet, continuous FTP tracking — is critical. Stale zones lead to
            misallocated training stress. You think you are riding threshold, but you are actually in tempo. You think
            your endurance ride is zone 2, but it has crept into zone 3. The training effect changes, but your plan has
            not adjusted.
          </p>

          <p>
            Automated FTP detection solves this problem. Instead of periodic ramp tests or 20-minute efforts that
            disrupt your training schedule, your FTP can be continuously derived from your ride data. Your zones stay
            current without any manual intervention.
          </p>

          <h2>Common Mistakes</h2>

          <h3>Too Much Time in Zone 3</h3>

          <p>
            The most pervasive error in amateur cycling. Zone 3 feels productive — you are breathing hard, sweating,
            and accumulating TSS — but it sits in a physiological no man&apos;s land. It is too hard to allow full
            recovery for tomorrow&apos;s quality session, and too easy to drive the high-intensity adaptations that
            raise your ceiling. Athletes who default to zone 3 on every ride plateau quickly and wonder why.
          </p>

          <h3>Not Enough Zone 2</h3>

          <p>
            Zone 2 does not feel like &quot;real training&quot; to many athletes. It feels too easy. But this zone
            builds the aerobic engine that everything else depends on. Skipping or shortchanging zone 2 volume is like
            building a house without a foundation. Your threshold and VO2max work will eventually stall because the
            aerobic base cannot support further development.
          </p>

          <h3>Skipping Recovery</h3>

          <p>
            Adaptation does not happen during training — it happens during recovery. Zone 1 days and rest days are not
            wasted time; they are when your body consolidates the gains from hard sessions. Consistently replacing
            recovery days with &quot;easy&quot; zone 2 or tempo rides erodes your ability to perform quality work on
            the days that matter.
          </p>

          <h3>Ignoring FTP Changes</h3>

          <p>
            Training with outdated zones is worse than training without zones at all. If your FTP has increased by 15
            watts since your last test, every zone-based workout you do is targeting a lower intensity than intended.
            Your threshold sessions become tempo rides. Your VO2max intervals become threshold work. The entire
            training stimulus shifts downward. Test regularly or use a platform that tracks FTP continuously.
          </p>

          <h2>Putting It All Together</h2>

          <p>
            The Coggan 7-zone model is not a training plan — it is a language. It gives you and your coach (or your
            training software) a shared vocabulary for prescribing, executing, and analyzing training intensity. The
            zones tell you <em>what</em> to do. Your periodization plan tells you <em>when</em> to do it. And your FTP
            ensures the zones stay calibrated to your current fitness.
          </p>

          <p>
            Start with a current FTP value. Calculate your zones. Structure your training week around the 80/20
            principle: most of your volume in zone 2, with targeted high-intensity sessions in zones 4-7 depending on
            your training phase. Monitor your FTP over time to keep your zones accurate. Avoid the zone 3 trap. Respect
            recovery. The model works — but only if you use it honestly.
          </p>

          <div className="not-prose mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">Zones that evolve with your fitness</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paincave auto-detects your FTP and keeps your training zones current. Every workout is analyzed against
              your personal zones.
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

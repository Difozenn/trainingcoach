import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Cycling Nutrition: The Complete Fueling Guide",
  description:
    "Science-backed nutrition for cyclists. Daily macros, pre-ride fueling, on-bike carbs, recovery nutrition, and how to periodize your diet around training.",
};

export default function CyclingNutritionGuidePage() {
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
            <Badge variant="secondary">Nutrition</Badge>
            <span>10 min read</span>
            <span>&middot;</span>
            <time dateTime="2026-03-07">March 7, 2026</time>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cycling Nutrition: The Complete Fueling Guide
          </h1>
        </div>

        <div className="prose prose-neutral dark:prose-invert prose-headings:mt-12 prose-headings:mb-4 prose-h3:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1">
          <p className="lead">
            Nutrition is the fourth discipline of endurance sport. You can have
            the best training plan in the world, but if you&apos;re underfueling
            on the bike or neglecting recovery nutrition, you&apos;re leaving
            watts on the table. This guide distills the current sports science
            into practical, actionable advice so you know exactly what to eat,
            when to eat it, and how much — whether you&apos;re doing a
            90-minute interval session or a 6-hour fondough through the
            mountains.
          </p>

          <h2>Daily Macro Targets for Cyclists</h2>

          <p>
            Your daily macronutrient intake should flex with your training load.
            A rest day and a 4-hour ride day have completely different fueling
            demands. The biggest mistake amateur cyclists make is eating the same
            amount every day regardless of training volume. Here are the
            evidence-based targets used by professional cycling nutritionists.
          </p>

          {/* Macro card grid */}
          <div className="not-prose my-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5">
              <div
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#3b82f6" }}
              >
                Carbohydrates
              </div>
              <div className="text-2xl font-bold">5 – 12 g/kg</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Scale with training volume. Easy days 5-7, hard days 7-10,
                extreme days 10-12 g per kg of body weight.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#22c55e" }}
              >
                Protein
              </div>
              <div className="text-2xl font-bold">1.6 – 2.2 g/kg</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Essential for muscle repair and adaptation. Higher end during
                heavy training blocks or caloric deficit.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#f59e0b" }}
              >
                Fat
              </div>
              <div className="text-2xl font-bold">1.0 – 1.5 g/kg</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Minimum for hormone production, cell membranes, and fat-soluble
                vitamin absorption. Don&apos;t go below 1.0.
              </p>
            </div>
          </div>

          <p>
            For a 75 kg cyclist, that means roughly 375-525 g of carbs on easy
            days, scaling up to 750-900 g on extreme volume days. Protein stays
            relatively constant at 120-165 g daily. Fat sits around 75-112 g.
            These numbers look high if you&apos;re used to sedentary dietary
            guidelines — but a 4-hour ride at moderate intensity burns 2,500-3,500
            kcal. You need to replace that energy, and carbohydrates are the
            primary fuel for high-intensity cycling.
          </p>

          <hr />

          <h2>Pre-Ride Nutrition</h2>

          <p>
            Your pre-ride meal sets the stage for the entire session. The goal is
            to top off liver glycogen (which depletes overnight) without causing
            GI distress on the bike. Timing and composition both matter.
          </p>

          <h3>The 2-4 Hour Window</h3>

          <p>
            Eat your main pre-ride meal 2-4 hours before you clip in. This gives
            your body enough time to digest and absorb the nutrients. The meal
            should be carbohydrate-dominant (2-4 g/kg body weight in carbs), low
            in fat and fiber to minimize gut issues, and contain moderate protein
            (0.3-0.5 g/kg).
          </p>

          <p>
            Good options include oatmeal with banana and honey, rice with eggs,
            toast with jam and a small serving of yogurt, or a bagel with peanut
            butter. Avoid high-fiber cereals, large salads, or anything
            deep-fried. If your ride is early morning and you can&apos;t eat 3
            hours beforehand, a smaller meal (1-2 g/kg carbs) 60-90 minutes
            before the ride works — just keep it simple and easily digestible.
          </p>

          <h3>The Final 30 Minutes</h3>

          <p>
            In the 30 minutes before you start, you can top up with a small
            carbohydrate snack: a banana, a gel, or a few sips of a sports
            drink. Some riders worry about reactive hypoglycemia from eating
            sugar right before exercise, but research consistently shows this is
            not an issue once exercise begins — the muscle contraction itself
            rapidly normalizes blood glucose.
          </p>

          <hr />

          <h2>On-Bike Fueling</h2>

          <p>
            This is where most amateur cyclists get it wrong. They either eat
            nothing and bonk at hour three, or they try to eat 120 g/hr on their
            first attempt and end up with severe GI distress. On-bike carb
            intake should be progressive and matched to ride duration and
            intensity.
          </p>

          {/* Carb intake by duration visual */}
          <div className="not-prose my-8 space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Under 60 min</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  Water only
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "5%", backgroundColor: "#94a3b8" }}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">1 – 2 hours</span>
                <span className="text-sm font-semibold" style={{ color: "#3b82f6" }}>
                  30 – 60 g/hr
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "40%", backgroundColor: "#3b82f6" }}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">2 – 3 hours</span>
                <span className="text-sm font-semibold" style={{ color: "#8b5cf6" }}>
                  60 – 90 g/hr
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "65%", backgroundColor: "#8b5cf6" }}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">3+ hours</span>
                <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                  90 – 120 g/hr
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "90%", backgroundColor: "#22c55e" }}
                />
              </div>
            </div>
          </div>

          <p>
            For rides under an hour, your muscle glycogen stores are sufficient.
            Water is all you need. Between one and two hours, especially at
            moderate-to-high intensity, 30-60 g of carbs per hour delays fatigue
            and sustains power output. This can come from a single bottle of
            sports drink and a bar.
          </p>

          <p>
            For rides of two to three hours, you should target 60-90 g per hour.
            At this rate, you need a mix of glucose and fructose transporters to
            maximize absorption — a single gel and water won&apos;t cut it. Use
            a combination of drink mix, gels, and solid food.
          </p>

          <p>
            For rides over three hours — gran fondos, stage races, ultra events
            — elite athletes now regularly consume 90-120 g per hour. This
            requires a trained gut (more on that below) and a deliberate fueling
            plan. You cannot wing this. Start eating within the first 20 minutes
            and set a timer every 15-20 minutes to remind yourself to eat.
          </p>

          <hr />

          <h2>The Glucose:Fructose Ratio</h2>

          <p>
            Your gut absorbs glucose and fructose through different intestinal
            transporters. Glucose uses the SGLT1 transporter, which saturates at
            about 60 g per hour. Fructose uses the GLUT5 transporter
            independently. By combining both sugars, you can absorb
            significantly more total carbohydrate per hour than with glucose
            alone.
          </p>

          <p>
            The current research consensus points to a{" "}
            <strong>1:0.8 glucose-to-fructose ratio</strong> as optimal for
            maximum oxidation rates. This is the ratio used in most modern
            sports nutrition products from brands like Maurten, SiS Beta Fuel,
            and Precision Fuel & Hydration. At this ratio, trained athletes can
            oxidize up to 120 g of exogenous carbohydrate per hour — double what
            was thought possible 15 years ago.
          </p>

          <p>
            Gut training is essential. If you&apos;ve been riding on water
            alone, you cannot jump to 120 g/hr overnight. Start at 40-50 g/hr
            and increase by 10-15 g/hr each week over 4-6 weeks. Practice your
            race-day nutrition in training — never try anything new on event day.
          </p>

          {/* Key takeaway box */}
          <div className="not-prose my-8 rounded-lg border-l-4 bg-primary/5 p-5" style={{ borderColor: "var(--primary)" }}>
            <div className="text-sm font-semibold mb-1">Key Takeaway</div>
            <p className="text-sm text-muted-foreground">
              Use a 1:0.8 glucose-to-fructose ratio in your on-bike nutrition to
              maximize carb absorption. Train your gut progressively — add
              10-15 g/hr per week until you reach your target intake rate. The
              gut is trainable, but it takes 4-6 weeks of consistent practice.
            </p>
          </div>

          <hr />

          <h2>Recovery Nutrition</h2>

          <p>
            What you eat in the first 30-60 minutes after a hard ride
            determines how quickly your glycogen stores replenish and how
            effectively your muscles repair. This window matters most after
            depleting rides (2+ hours) and high-intensity sessions. If
            you&apos;re doing a short easy spin, normal meals are sufficient.
          </p>

          <h3>The 30-Minute Window</h3>

          <p>
            Immediately after hard or long rides, aim for{" "}
            <strong>1.0-1.2 g/kg of carbohydrates</strong> combined with{" "}
            <strong>0.3-0.4 g/kg of protein</strong>. For a 75 kg rider, that
            means 75-90 g of carbs and 22-30 g of protein. A recovery shake, a
            bowl of rice with chicken, or even chocolate milk hits these targets
            well.
          </p>

          <p>
            The protein triggers muscle protein synthesis through the mTOR
            pathway, while the carbohydrates spike insulin, which both
            accelerates glycogen synthesis and acts as an anabolic signal. The
            combination is more effective than either nutrient alone. Leucine —
            an amino acid abundant in whey protein, eggs, and dairy — is the
            primary trigger for muscle protein synthesis. Aim for at least 2.5 g
            of leucine per recovery meal.
          </p>

          <p>
            If your next training session is within 8 hours (such as during
            multi-stage events), recovery nutrition becomes critical. Consume
            1.0-1.2 g/kg carbs every hour for the first 4 hours post-ride to
            maximize glycogen resynthesis rate.
          </p>

          {/* Key takeaway box */}
          <div className="not-prose my-8 rounded-lg border-l-4 bg-primary/5 p-5" style={{ borderColor: "var(--primary)" }}>
            <div className="text-sm font-semibold mb-1">Key Takeaway</div>
            <p className="text-sm text-muted-foreground">
              After hard or long rides, consume 1.0-1.2 g/kg carbs + 0.3-0.4
              g/kg protein within 30 minutes. This is non-negotiable during
              heavy training blocks or multi-day events when rapid glycogen
              resynthesis determines next-day performance.
            </p>
          </div>

          <hr />

          <h2>Hydration Strategy</h2>

          <p>
            Dehydration of just 2-3% body weight measurably impairs power
            output, cognitive function, and thermoregulation. In hot conditions,
            you can lose 1-2 liters of sweat per hour. A proactive hydration
            strategy is essential.
          </p>

          <p>
            Target <strong>500-750 ml of fluid per hour</strong> during rides.
            In hot or humid conditions, lean toward the higher end. In cool
            conditions, the lower end is fine. Pre-hydrate with 5-7 ml/kg of
            fluid in the 2-4 hours before your ride — about 400-500 ml for most
            riders.
          </p>

          <p>
            Sodium is the electrolyte that matters most. You lose 500-1500 mg of
            sodium per liter of sweat, depending on your individual sweat
            composition. During rides over 90 minutes — especially in heat —
            aim for <strong>500-1000 mg of sodium per hour</strong>. Most
            commercial drink mixes contain 300-500 mg per serving, so you may
            need to supplement with additional sodium tabs or a higher-sodium
            mix. Salty sweaters (you&apos;ll see white residue on your kit) need
            more.
          </p>

          <hr />

          <h2>Periodized Nutrition</h2>

          <p>
            Just as your training follows a periodized plan — building from base
            to build to peak to taper — your nutrition should mirror your
            training demands. This concept, called{" "}
            <strong>nutritional periodization</strong>, means adjusting your
            caloric and carbohydrate intake day-by-day based on what
            you&apos;re actually doing.
          </p>

          {/* Progress-checklist style box */}
          <div className="not-prose my-8 rounded-xl border bg-card p-6">
            <div className="text-sm font-semibold mb-4">
              Daily Nutrition by Training Day Type
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "#94a3b8" }}
                >
                  R
                </div>
                <div>
                  <div className="text-sm font-medium">Rest Day</div>
                  <div className="text-sm text-muted-foreground">
                    Carbs 3-4 g/kg. Protein stays at 1.6-2.0 g/kg. Focus on
                    whole foods, vegetables, quality fats. Total intake at
                    maintenance or slight deficit if targeting weight loss.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  E
                </div>
                <div>
                  <div className="text-sm font-medium">Easy / Recovery Day</div>
                  <div className="text-sm text-muted-foreground">
                    Carbs 5-6 g/kg. Moderate overall intake. Still prioritize
                    protein for ongoing adaptation. Light on-bike fueling if ride
                    is over 90 minutes.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "#f59e0b" }}
                >
                  H
                </div>
                <div>
                  <div className="text-sm font-medium">Hard / Interval Day</div>
                  <div className="text-sm text-muted-foreground">
                    Carbs 7-10 g/kg. Front-load carbs in the pre-ride meal. Fuel
                    aggressively on the bike. Prioritize recovery meal
                    immediately post-ride. Caloric surplus acceptable.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  R
                </div>
                <div>
                  <div className="text-sm font-medium">Race / Extreme Day</div>
                  <div className="text-sm text-muted-foreground">
                    Carbs 10-12 g/kg. Carb-load the evening before. Large
                    pre-race breakfast 3-4 hours out. Maximum on-bike fueling
                    (90-120 g/hr). Aggressive recovery nutrition after.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p>
            The key principle: <strong>fuel the work</strong>. On days where
            you&apos;re doing high-intensity intervals or long endurance rides,
            your carb intake should be substantially higher than on rest days.
            This isn&apos;t about &quot;earning&quot; food through exercise —
            it&apos;s about providing the substrate your muscles need to
            perform, adapt, and recover. Chronically underfueling hard training
            days leads to relative energy deficiency in sport (RED-S), impaired
            adaptation, hormonal disruption, and increased illness risk.
          </p>

          <hr />

          <h2>Common Nutrition Mistakes</h2>

          <p>
            Even experienced cyclists fall into these traps. Recognizing them is
            the first step to fueling properly.
          </p>

          <h3>1. Chronic Underfueling</h3>

          <p>
            The most prevalent mistake. Cyclists who are worried about weight
            restrict calories during heavy training blocks, leading to poor
            recovery, declining performance, hormonal disruption, and
            ultimately injury or burnout. If your training load is high, your
            caloric intake must match. Body composition goals should be pursued
            during lower-volume phases, not during peak training.
          </p>

          <h3>2. Fear of Carbohydrates</h3>

          <p>
            Low-carb and ketogenic diets have been heavily marketed to
            endurance athletes, but the research is clear: for high-intensity
            performance, carbohydrates are the superior fuel. Fat oxidation
            cannot sustain efforts above ~75% VO2max. Every professional cycling
            team employs high-carb fueling strategies. You can train fat
            oxidation at lower intensities, but restricting carbs during hard
            sessions impairs the quality of the workout and therefore the
            training stimulus.
          </p>

          <h3>3. No Race-Day Practice</h3>

          <p>
            Your gut is a trainable organ. If you plan to consume 90 g/hr of
            carbs during a race but you&apos;ve never practiced it in training,
            you&apos;re setting yourself up for nausea, bloating, or worse.
            Every fueling strategy — specific products, concentrations, timing
            — must be rehearsed in training at race intensity. This includes
            your pre-race meal, on-bike nutrition, and hydration plan.
          </p>

          <h3>4. Neglecting Recovery Nutrition</h3>

          <p>
            Finishing a ride and not eating for 2-3 hours because you&apos;re
            &quot;not hungry&quot; or you&apos;re trying to lose weight
            significantly delays glycogen resynthesis and muscle repair. Hard
            exercise suppresses appetite temporarily — this is hormonal, not an
            indication that you don&apos;t need fuel. Have a recovery drink or
            snack prepared before you start so it&apos;s ready when you walk in
            the door.
          </p>

          {/* Key takeaway box */}
          <div className="not-prose my-8 rounded-lg border-l-4 bg-primary/5 p-5" style={{ borderColor: "var(--primary)" }}>
            <div className="text-sm font-semibold mb-1">Key Takeaway</div>
            <p className="text-sm text-muted-foreground">
              Fuel the work. Match your carbohydrate intake to your training
              day. Practice race-day nutrition in training. Never restrict
              calories during high-volume training blocks. The goal is
              performance and adaptation — your body composition will improve as
              a consequence of proper fueling and consistent training.
            </p>
          </div>

          <hr />

          <h2>Putting It All Together</h2>

          <p>
            Cycling nutrition doesn&apos;t need to be complicated, but it does
            need to be intentional. The fundamentals are straightforward: eat
            enough carbohydrates to match your training load, keep protein at
            1.6-2.2 g/kg daily, don&apos;t fear fat, fuel proactively on the
            bike, and prioritize recovery nutrition after hard sessions. The
            cyclists who get the biggest performance gains from nutrition
            aren&apos;t the ones following exotic diets — they&apos;re the ones
            who consistently nail the basics, day after day.
          </p>

          <p>
            Start by tracking your on-bike carb intake for a few rides. Most
            amateur cyclists are shocked at how little they&apos;re actually
            consuming versus the recommended targets. Then build from there:
            improve your pre-ride meals, train your gut to tolerate higher carb
            rates, dial in your recovery nutrition, and periodize your daily
            intake around your training plan. The results — in watts, recovery
            speed, and overall well-being — will speak for themselves.
          </p>
        </div>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-semibold">
            Get daily nutrition targets automatically
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Paincave calculates your daily macros based on your training load,
            body composition, and workout schedule. No food logging — just clear
            targets.
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

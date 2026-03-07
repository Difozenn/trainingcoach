import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "On-Bike Fueling: How to Eat During a Ride",
  description:
    "How many carbs per hour, what to eat, when to start fueling, and how to train your gut. A practical guide to on-bike nutrition for cyclists.",
};

export default function OnBikeFuelingPage() {
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
            <span>9 min read</span>
            <span>&middot;</span>
            <time dateTime="2026-03-07">March 7, 2026</time>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            On-Bike Fueling: How to Eat During a Ride
          </h1>
        </div>

        <div className="prose prose-neutral dark:prose-invert prose-headings:mt-12 prose-headings:mb-4 prose-h3:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1">
          <p className="lead">
            Bonking is the endurance athlete&apos;s nightmare: your legs turn to
            concrete, your brain fogs, and every pedal stroke feels like moving
            through wet sand. The cause is almost always the same &mdash; you ran
            out of fuel. On-bike fueling is not a nice-to-have accessory for
            long rides. It is a core performance skill that separates riders who
            finish strong from those who crawl home. Get it right and you unlock
            hours of sustainable power. Get it wrong and no amount of fitness
            will save you.
          </p>

          <h2>Why Your Body Needs Fuel on the Bike</h2>

          <p>
            Your body stores carbohydrate as glycogen in your muscles and liver.
            The total reservoir is approximately{" "}
            <strong>1,600&ndash;2,000 kcal</strong> &mdash; enough to sustain
            hard riding for roughly 60&ndash;90 minutes at threshold intensity,
            or 2&ndash;3 hours at a moderate zone 2 pace. Once those stores run
            low, performance drops precipitously. This is the bonk.
          </p>

          <p>
            Your body can also burn fat for fuel, and fat stores are effectively
            unlimited (even a lean athlete carries 40,000+ kcal of body fat).
            But fat oxidation has a rate ceiling. Even highly trained,
            fat-adapted athletes can oxidize fat at only about{" "}
            <strong>1.0&ndash;1.5 g/min</strong>, which yields roughly
            540&ndash;810 kcal/hour. At moderate-to-high intensities &mdash;
            anything above about 65% of FTP &mdash; your energy demand exceeds
            what fat alone can supply. The gap must be filled by carbohydrate.
          </p>

          <p>
            This is the fundamental energy problem of endurance cycling: you burn
            carbohydrate faster than your body can replace it from fat. The only
            solution is to eat carbohydrate during the ride to supplement your
            glycogen stores and delay or prevent their depletion.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              Glycogen stores last 60&ndash;90 minutes at threshold. Fat
              oxidation is capped at ~1.0&ndash;1.5 g/min. At any intensity
              above zone 2, carbohydrate intake during the ride is the only way
              to close the energy gap.
            </p>
          </div>

          <hr />
          <h2>How Many Carbs Per Hour &mdash; The Definitive Guide</h2>

          <p>
            The amount of carbohydrate you need depends on ride duration and
            intensity. Sports nutrition research has converged on clear,
            evidence-based tiers. These recommendations come from the work of
            Asker Jeukendrup and the International Olympic Committee consensus
            statements on sports nutrition.
          </p>

          <figure className="not-prose my-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">Under 60 minutes</p>
                <p className="text-lg font-bold mt-1">0 g/hr</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mouth rinse only. Glycogen stores are sufficient. A carb
                  mouth rinse can boost performance via central nervous system
                  signaling without any GI risk.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">60&ndash;90 minutes</p>
                <p className="text-lg font-bold mt-1" style={{ color: "#3b82f6" }}>30&ndash;40 g/hr</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Small amounts to top off glycogen. A single gel every 30
                  minutes or a carb drink is sufficient.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">90&ndash;150 minutes</p>
                <p className="text-lg font-bold mt-1" style={{ color: "#22c55e" }}>60 g/hr</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The standard endurance target. Achievable with glucose alone
                  via the SGLT1 transporter.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">150&ndash;240 minutes</p>
                <p className="text-lg font-bold mt-1" style={{ color: "#eab308" }}>60&ndash;90 g/hr</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires glucose + fructose (dual transporter) to exceed the
                  60 g/hr glucose ceiling. Most riders should target this range
                  for sportives and gran fondos.
                </p>
              </div>
              <div className="sm:col-span-2 rounded-lg border border-border/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">240+ minutes / Racing</p>
                <p className="text-lg font-bold mt-1" style={{ color: "#dc2626" }}>90&ndash;120 g/hr</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Elite-level fueling. Requires a trained gut, dual-fuel
                  sources (glucose + fructose at a 1:0.8 ratio), and a
                  practiced fueling strategy. This is what pro WorldTour riders
                  target during grand tour stages.
                </p>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted-foreground">
              Carbohydrate intake targets by ride duration. Higher tiers require
              glucose + fructose and gut training.
            </figcaption>
          </figure>

          <p>
            These are targets, not starting points. If you have never fueled
            deliberately on the bike, start at the lower end and build up over
            weeks. Your gut is trainable &mdash; more on that below.
          </p>

          <hr />
          <h2>Glucose + Fructose: The Dual Transporter Advantage</h2>

          <p>
            For decades, the maximum recommended carbohydrate intake during
            exercise was 60 g/hour. This ceiling exists because of a single
            bottleneck: the SGLT1 transporter in your small intestine, which
            absorbs glucose (and maltodextrin, which is just a glucose polymer).
            SGLT1 maxes out at approximately{" "}
            <strong>60 g of glucose per hour</strong>. Consuming more glucose
            beyond this point does not increase absorption &mdash; it just sits
            in your gut, draws in water, and causes bloating and GI distress.
          </p>

          <p>
            The breakthrough came from Asker Jeukendrup&apos;s research showing
            that fructose uses a completely different transporter:{" "}
            <strong>GLUT5</strong>. Because GLUT5 operates independently of
            SGLT1, adding fructose on top of glucose allows an additional
            30&ndash;60 g/hour of carbohydrate absorption. Combined, these two
            pathways can deliver{" "}
            <strong>90&ndash;120 g of total carbohydrate per hour</strong>.
          </p>

          <figure className="not-prose my-8">
            <div className="rounded-lg border border-border/50 p-5">
              <p className="text-xs font-semibold text-center mb-4">Intestinal Carbohydrate Absorption</p>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <div className="flex-1 rounded-lg p-4 text-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
                  <p className="text-xs font-semibold" style={{ color: "#3b82f6" }}>SGLT1 Transporter</p>
                  <p className="text-2xl font-bold mt-2">60 g/hr</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Glucose &amp; Maltodextrin</p>
                  <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">+</span>
                </div>
                <div className="flex-1 rounded-lg p-4 text-center" style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.25)" }}>
                  <p className="text-xs font-semibold" style={{ color: "#eab308" }}>GLUT5 Transporter</p>
                  <p className="text-2xl font-bold mt-2">30&ndash;60 g/hr</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Fructose only</p>
                  <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: "#eab308" }} />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">=</span>
                </div>
                <div className="flex-1 rounded-lg p-4 text-center" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
                  <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>Combined Output</p>
                  <p className="text-2xl font-bold mt-2">90&ndash;120 g/hr</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Dual-fuel absorption</p>
                  <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                </div>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted-foreground">
              Two independent intestinal transporters allow combined carbohydrate absorption rates far exceeding either alone.
            </figcaption>
          </figure>

          <p>
            The latest research from Jeukendrup&apos;s group recommends a{" "}
            <strong>glucose-to-fructose ratio of 1:0.8</strong>, which
            maximizes absorption from both transporters. Many commercial
            products now use this ratio. If you are using gels or drink mixes
            that contain only glucose or maltodextrin, you are capping your
            absorption at 60 g/hour regardless of how much you consume.
          </p>

          <p>
            This is why ingredient labels matter. Look for products that list
            both maltodextrin (or glucose) and fructose. Avoid products with
            only a single sugar source if you plan to fuel above 60 g/hour.
          </p>

          <hr />
          <h2>What to Eat on the Bike</h2>

          <p>
            There is no single &ldquo;best&rdquo; on-bike food. The best
            fueling strategy uses a mix of sources matched to your intensity,
            duration, and personal tolerance. Here is how the main options
            compare.
          </p>

          <figure className="not-prose my-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Gels</p>
                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>High intensity</span>
                </div>
                <p className="text-xs text-muted-foreground">25&ndash;30g carbs per gel. Fast absorption, no chewing required. Compact and easy to carry in a jersey pocket. Best for racing and hard group rides where you cannot afford to take your hands off the bars for long. Downside: flavor fatigue on long rides, and the texture is off-putting to some riders.</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Bars</p>
                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>Moderate intensity</span>
                </div>
                <p className="text-xs text-muted-foreground">30&ndash;50g carbs per bar. More satiating than gels and better for rides over 3 hours where you want something solid. Require chewing and are harder to consume at high intensity. Best for steady endurance rides and the early hours of a sportive.</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Drink Mix</p>
                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: "rgba(234, 179, 8, 0.15)", color: "#eab308" }}>Any intensity</span>
                </div>
                <p className="text-xs text-muted-foreground">40&ndash;80g carbs per bottle. Delivers carbs and hydration simultaneously. No chewing, no wrappers, no reaching into pockets. The most practical high-volume fueling method. Modern concentrated drink mixes can deliver 80&ndash;100g per 500ml bottle.</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Real Food</p>
                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>Low intensity</span>
                </div>
                <p className="text-xs text-muted-foreground">Rice cakes, bananas, dates, PB&amp;J sandwiches. Great for long zone 2 rides where GI tolerance is higher and you want variety. Homemade rice cakes (sushi rice + jam + pinch of salt) are a pro peloton staple. Harder to digest at high intensity.</p>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted-foreground">
              Match your fuel source to ride intensity. Higher intensity demands faster-absorbing options.
            </figcaption>
          </figure>

          <h3>Homemade Options That Work</h3>

          <p>
            You do not need to buy expensive commercial products to fuel well.
            Maple syrup diluted with water and a pinch of salt makes a simple,
            effective carb drink (about 52g carbs per 60ml of syrup). Rice cakes
            made with sushi rice, a thin layer of jam, and a pinch of salt are
            what many WorldTour teams use. Dates stuffed with a small amount of
            nut butter deliver roughly 18g of carbs each. The key is testing
            these options in training so you know exactly what your stomach can
            handle.
          </p>

          <p>
            A practical race-day approach for a 4-hour sportive might look like:
            one concentrated drink mix bottle (80g carbs), topped up with gels
            every 20&ndash;25 minutes (25g each), plus a bar in the first hour.
            That gets you comfortably above 90g/hour.
          </p>

          <hr />
          <h2>When to Start Fueling</h2>

          <p>
            One of the most persistent mistakes in endurance nutrition is
            waiting too long to eat. By the time you feel hungry on the bike,
            your glycogen stores are already significantly depleted and your
            blood glucose is dropping. Catching up from this deficit is
            extremely difficult because intestinal absorption has an upper
            limit &mdash; you simply cannot shovel carbs in fast enough once
            you are behind.
          </p>

          <p>
            The rule is simple:{" "}
            <strong>start fueling within the first 20&ndash;30 minutes</strong>{" "}
            of any ride that will last longer than 75 minutes. Take your first
            gel, your first sips of drink mix, or your first bites of a bar
            before you feel any need for it. Then set a repeating timer on your
            bike computer or watch for every 20 minutes. Every time it goes off,
            eat or drink something. This mechanical, non-negotiable rhythm
            removes decision-making from the equation and ensures steady
            carbohydrate delivery throughout the ride.
          </p>

          <p>
            Think of it like stoking a fire. Small, frequent additions of fuel
            keep the fire burning steadily. Dumping a huge amount of wood on a
            dying fire produces smoke and chaos. Your digestive system works the
            same way &mdash; small, regular feeds are absorbed far more
            efficiently than large, infrequent boluses.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              Start eating within 20&ndash;30 minutes of the ride start. Set a
              timer every 20 minutes. Do not wait until you are hungry &mdash;
              by then, glycogen is already depleted and catching up is nearly
              impossible.
            </p>
          </div>

          <hr />
          <h2>How to Train Your Gut</h2>

          <p>
            If you have never consumed 90g of carbohydrate per hour on the bike,
            your gut is not ready for it. Gastrointestinal tolerance is
            trainable, and this is one of the most under-appreciated aspects of
            endurance performance. Research shows that the intestinal
            transporters SGLT1 and GLUT5 are upregulated in response to regular
            high-carbohydrate intake &mdash; meaning the more you practice
            eating on the bike, the more efficiently your gut absorbs carbs.
          </p>

          <p>
            Start at <strong>40g per hour</strong> during training rides. If that
            is comfortable after two weeks, increase to 50g. Then 60g. Continue
            adding 10g per hour every 1&ndash;2 weeks until you reach your
            target race-day intake. This progressive overload mirrors how you
            would increase training volume &mdash; gradually and systematically.
          </p>

          <p>
            Some practical tips for gut training: practice during training
            rides at the intensity you expect on race day (fueling at zone 2 is
            much easier than fueling at tempo or threshold). Include
            high-carbohydrate meals in your daily diet on hard training days, as
            this also helps upregulate intestinal transporters. Avoid
            high-fiber and high-fat foods in the 2&ndash;3 hours before a
            training session where you plan to practice fueling &mdash; fiber
            and fat slow gastric emptying and increase GI distress risk.
          </p>

          <p>
            And the cardinal rule:{" "}
            <strong>never try a new fueling strategy on race day</strong>.
            Everything you consume during a race should have been tested
            multiple times during training.
          </p>

          <hr />
          <h2>Hydration During Rides</h2>

          <p>
            Fueling and hydration are intertwined but distinct problems. You can
            nail your carbohydrate intake and still perform poorly if you are
            dehydrated. Conversely, drinking too much plain water without
            electrolytes can cause hyponatremia &mdash; a dangerous drop in
            blood sodium concentration that can lead to confusion, seizures, and
            in extreme cases, death.
          </p>

          <p>
            Aim for <strong>500&ndash;750 ml of fluid per hour</strong>,
            adjusting upward in hot or humid conditions. Your sweat rate is
            individual &mdash; you can estimate it by weighing yourself before
            and after a ride (each kg lost equals roughly one liter of sweat).
            Most athletes underestimate their sweat rate, especially in the
            heat.
          </p>

          <p>
            Sodium is the critical electrolyte.{" "}
            <strong>500&ndash;1,000 mg of sodium per hour</strong> is a good
            starting range, with heavier sweaters and hot-weather riding at the
            upper end. If you notice white salt stains on your jersey or helmet
            straps after a ride, you are a salty sweater and should target the
            higher end of this range. Sodium maintains plasma volume, supports
            nerve function, and aids glucose absorption through the SGLT1
            transporter &mdash; sodium and glucose are co-transported, so
            adequate sodium actually improves carbohydrate uptake.
          </p>

          <p>
            Use electrolyte tablets or sodium-containing drink mixes rather than
            plain water. If you use a concentrated carb drink in one bottle,
            carry a second bottle with an electrolyte solution or plain water to
            manage thirst independently of your carb intake.
          </p>

          <hr />
          <h2>Race Day Fueling Strategy</h2>

          <p>
            Race nutrition starts 48 hours before the gun goes off. Here is the
            complete timeline:
          </p>

          <h3>48 Hours Before: Carb Loading</h3>

          <p>
            Increase carbohydrate intake to{" "}
            <strong>10&ndash;12 g/kg of body weight per day</strong> for two
            days before your event. For a 75 kg rider, that is 750&ndash;900g
            of carbohydrate per day. This saturates your glycogen stores to
            their maximum capacity. Focus on easily digestible, low-fiber carb
            sources: white rice, pasta, bread, potatoes, pancakes, fruit juice.
            This is not the time for whole grains and vegetables.
          </p>

          <h3>3 Hours Before: Pre-Race Meal</h3>

          <p>
            Consume <strong>2&ndash;3 g/kg of carbohydrate</strong> in your
            final pre-race meal, roughly 3 hours before the start. Keep fat and
            fiber low to ensure gastric emptying is complete before you start
            riding. A classic pre-race meal: white rice with a small amount of
            chicken, or oatmeal with banana and honey. Avoid anything you have
            not eaten before a hard ride previously.
          </p>

          <h3>During the Race: Execute Your Plan</h3>

          <p>
            Start fueling immediately &mdash; within the first 15&ndash;20
            minutes. Target <strong>90&ndash;120g of carbohydrate per hour</strong>{" "}
            using the dual-fuel (glucose + fructose) sources you have practiced
            in training. Set a timer. Eat mechanically, on schedule, whether you
            feel hungry or not. Front-load your solid food in the first half of
            the race when intensity is typically lower and your stomach handles
            solid food better. Shift to gels and drink mix in the second half
            when intensity climbs.
          </p>

          <p>
            One final rule that cannot be overstated:{" "}
            <strong>nothing new on race day</strong>. Not a new gel brand, not a
            friend&apos;s drink mix, not the nutrition provided at aid stations
            (unless you have tested it). Race day is execution, not
            experimentation.
          </p>

          <hr />
          <h2>Common Fueling Mistakes</h2>

          <p>
            These are the errors that derail otherwise well-prepared riders.
            Almost all of them are avoidable with planning and practice.
          </p>

          <figure className="not-prose my-8">
            <div className="rounded-lg border border-border/50 p-4" style={{ borderColor: "rgba(220, 38, 38, 0.2)", backgroundColor: "rgba(220, 38, 38, 0.03)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "#dc2626" }}>Common fueling mistakes</p>
              <div className="space-y-2">
                {[
                  "Starting too late — waiting until you feel hungry to eat",
                  "Under-fueling because of calorie fear — your body needs fuel to perform, period",
                  "Not practicing race nutrition in training — the gut needs progressive overload too",
                  "Relying only on gels — at 90+ g/hr, gel-only strategies cause GI distress; mix sources",
                  "Ignoring sodium — plain water without electrolytes increases hyponatremia risk",
                  "Using glucose-only products and expecting to absorb more than 60 g/hr",
                  "Eating a large bolus every hour instead of small feeds every 20 minutes",
                ].map((mistake) => (
                  <div key={mistake} className="flex items-start gap-2">
                    <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" style={{ color: "#dc2626" }}>
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <p className="text-xs text-muted-foreground">{mistake}</p>
                  </div>
                ))}
              </div>
            </div>
          </figure>

          <p>
            The under-fueling mistake deserves special attention. Many cyclists,
            particularly those trying to lose weight, deliberately restrict
            calories during rides. This is counterproductive. Training in a
            glycogen-depleted state impairs workout quality, blunts adaptation,
            increases muscle protein breakdown, and raises cortisol. If fat loss
            is a goal, manage your caloric deficit in the hours you are not
            training. On the bike, fuel the work.
          </p>

          <p>
            The other mistake worth emphasizing is source diversity. At 90+
            g/hour, consuming everything as gels is a recipe for nausea.
            Splitting your intake across drink mix, gels, and solid food
            distributes the osmotic load across your gut and reduces the risk
            of any single source overwhelming your stomach. A practical split:
            40&ndash;50% from drink mix, 30&ndash;40% from gels, and
            10&ndash;20% from solid food in the early hours.
          </p>

          <hr />
          <h2>Putting It All Together</h2>

          <p>
            On-bike fueling is a trainable skill, not an innate talent. The
            athletes who fuel best are not the ones with the strongest stomachs
            &mdash; they are the ones who have practiced systematically, tested
            their products, and built their gut tolerance over months. Start with
            the basics: know your target carbohydrate intake for the ride
            duration, use dual-fuel sources (glucose + fructose) for anything
            above 60g/hour, begin eating within the first 20 minutes, and set a
            timer to eat every 20 minutes after that.
          </p>

          <p>
            Nail these fundamentals and you will ride longer, harder, and more
            consistently than you ever have before. Ignore them and no amount of
            interval training, threshold work, or aerobic base will compensate
            for the hole in your tank.
          </p>

          <figure className="not-prose my-8">
            <div className="rounded-lg border border-border/50 p-4" style={{ borderColor: "rgba(34, 197, 94, 0.2)", backgroundColor: "rgba(34, 197, 94, 0.03)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "#22c55e" }}>Your fueling checklist</p>
              <div className="space-y-2">
                {[
                  "Know your carb target: 30-60 g/hr for short rides, 60-90 g/hr for long, 90-120 g/hr for racing",
                  "Use glucose + fructose products (1:0.8 ratio) for anything above 60 g/hr",
                  "Start eating within 20 minutes of ride start",
                  "Set a 20-minute timer and eat every time it goes off",
                  "Train your gut progressively: add 10 g/hr every 1-2 weeks",
                  "Include 500-1,000 mg sodium per hour",
                  "Drink 500-750 ml fluid per hour, more in heat",
                  "Never try new nutrition on race day",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" style={{ color: "#22c55e" }}>
                      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-xs text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </figure>

          <div className="not-prose mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">Get ride-specific fueling plans</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paincave calculates your carb, protein, and hydration targets for every ride based on duration, intensity, and conditions.
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

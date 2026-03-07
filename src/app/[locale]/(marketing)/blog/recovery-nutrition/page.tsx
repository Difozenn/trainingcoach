import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Recovery Nutrition for Cyclists: What to Eat After a Ride",
  description:
    "Post-ride nutrition timing, macros, and meal ideas. Learn the science of recovery nutrition to maximize adaptation from every training session.",
};

export default function RecoveryNutritionPage() {
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
            <span>8 min read</span>
            <span>&middot;</span>
            <time dateTime="2026-03-07">March 7, 2026</time>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Recovery Nutrition for Cyclists: What to Eat After a Ride
          </h1>
        </div>

        <div className="prose prose-neutral dark:prose-invert prose-headings:mt-12 prose-headings:mb-4 prose-h3:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1">
          <p className="lead">
            Training does not make you stronger. Training breaks you down.
            It depletes glycogen stores, damages muscle fibers, dehydrates
            your body, and elevates stress hormones. The adaptation &mdash;
            the actual fitness gain &mdash; happens during recovery, and
            recovery is driven by what you eat and when you eat it. Get
            post-ride nutrition wrong and you leave performance on the table.
            Get it right and every training session pays compound interest.
          </p>

          <h2>The Recovery Window: What the Science Actually Says</h2>

          <p>
            You have probably heard of the &ldquo;anabolic window&rdquo;
            &mdash; the idea that you must eat within 30 minutes of exercise
            or your workout is wasted. The truth is more nuanced than the
            supplement industry would have you believe, but the underlying
            physiology is real.
          </p>

          <p>
            After exercise, the rate of glycogen resynthesis is at its
            highest. Your muscles upregulate <strong>GLUT4 transporters</strong>
            &mdash; insulin-independent glucose channels that move carbohydrate
            from your bloodstream directly into muscle cells. GLUT4 activity
            peaks immediately after exercise and remains elevated for roughly
            30-60 minutes before gradually declining. During this window, the
            rate of glycogen storage is approximately{" "}
            <strong>50% faster</strong> than it would be two hours later.
          </p>

          <p>
            The window does not slam shut after 30 minutes. Glycogen
            resynthesis continues for 24 hours. But the rate drops
            significantly. If you train again within 24 hours or have
            back-to-back hard days, exploiting that early rapid-resynthesis
            phase is the difference between starting the next session topped
            off versus starting depleted.
          </p>

          <p>
            Muscle protein synthesis (MPS) follows a different timeline. It
            remains elevated for <strong>24-48 hours</strong> after a hard
            session, with the greatest sensitivity in the first 4-6 hours.
            The first protein-containing meal after exercise sets the
            anabolic cascade in motion. Delaying it by several hours does not
            eliminate the response, but it does blunt the magnitude.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              The recovery window is real but not binary. Glycogen resynthesis
              is 50% faster in the first 30-60 minutes post-exercise. Muscle
              protein synthesis stays elevated for 24-48 hours but responds
              most strongly to the first post-ride meal. Earlier is better,
              but later is not useless.
            </p>
          </div>

          <hr />
          <h2>The Three Recovery Priorities</h2>

          <p>
            Every aspect of post-ride nutrition serves one of three
            physiological goals. Miss any one of them and recovery is
            compromised.
          </p>

          <div className="not-prose my-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 p-5 text-center">
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
              >
                <svg className="h-5 w-5" style={{ color: "#3b82f6" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <p className="text-sm font-semibold">Replenish</p>
              <p className="text-xs text-muted-foreground mt-1">
                Restore glycogen with carbohydrates. Your muscles are primed
                to absorb glucose fastest in the first hour post-ride.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 p-5 text-center">
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
              >
                <svg className="h-5 w-5" style={{ color: "#22c55e" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <p className="text-sm font-semibold">Repair</p>
              <p className="text-xs text-muted-foreground mt-1">
                Rebuild damaged muscle fibers with protein. Leucine-rich
                sources trigger the mTOR pathway for maximal protein
                synthesis.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 p-5 text-center">
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(234, 179, 8, 0.15)" }}
              >
                <svg className="h-5 w-5" style={{ color: "#eab308" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M18 12h4M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
                </svg>
              </div>
              <p className="text-sm font-semibold">Rehydrate</p>
              <p className="text-xs text-muted-foreground mt-1">
                Replace lost fluids and electrolytes. Even 2% dehydration
                impairs subsequent performance and slows recovery processes.
              </p>
            </div>
          </div>

          <hr />
          <h2>Post-Ride Carbohydrates: Refilling the Tank</h2>

          <p>
            Glycogen is the primary fuel for any cycling effort above Zone 1.
            A hard two-hour ride can deplete 50-75% of your muscle glycogen
            stores. Without deliberate refueling, full glycogen resynthesis
            takes <strong>24-48 hours</strong> on a normal diet. With
            targeted post-ride carbohydrate intake, you can cut that timeline
            dramatically.
          </p>

          <p>
            The evidence-based target is{" "}
            <strong>1.0-1.2 g of carbohydrate per kg of body weight</strong>{" "}
            within the first 30 minutes after exercise. High glycemic index
            (GI) foods are preferable in this window because they are
            absorbed rapidly and reach the muscle faster. This is one of the
            few times in nutrition where fast-digesting, &ldquo;simple&rdquo;
            carbs are superior to complex ones.
          </p>

          <h3>Best Post-Ride Carb Sources</h3>

          <ul>
            <li>White rice &mdash; high GI, easy to digest, pairs with anything</li>
            <li>White bread or bagels &mdash; rapid glucose absorption</li>
            <li>Ripe bananas &mdash; portable, potassium-rich, ~27g carbs each</li>
            <li>Dates &mdash; extremely energy-dense, ~18g carbs per date</li>
            <li>Fruit juice or recovery drinks &mdash; liquid carbs absorb fastest</li>
            <li>Pasta &mdash; moderate-high GI when cooked soft</li>
            <li>Potatoes &mdash; among the highest GI whole foods</li>
          </ul>

          <p>
            For a <strong>75 kg rider</strong>, the target is{" "}
            <strong>75-90 g of carbohydrates</strong> within 30 minutes. In
            practical terms, that is 2 bananas plus a 500 ml recovery drink,
            or a large bowl of white rice with honey. If you struggle to eat
            solid food immediately after hard efforts, liquid carbs are
            equally effective.
          </p>

          <hr />
          <h2>Post-Ride Protein: Rebuilding Muscle</h2>

          <p>
            Every hard ride causes microtrauma to muscle fibers. This is not
            injury &mdash; it is the stimulus for adaptation. But the repair
            process requires amino acids, and not all protein sources are
            equal when it comes to triggering muscle protein synthesis.
          </p>

          <p>
            The target is{" "}
            <strong>0.3-0.4 g of protein per kg of body weight</strong>{" "}
            within 30-60 minutes post-ride. For a 75 kg rider, that
            translates to <strong>23-30 g of protein</strong>. The critical
            factor is <strong>leucine content</strong> &mdash; leucine is the
            amino acid that directly activates the mTOR signaling pathway,
            the master switch for muscle protein synthesis. Research shows a
            threshold of <strong>2.5-3.0 g of leucine per meal</strong> is
            needed to maximally stimulate MPS.
          </p>

          <h3>Protein Source Comparison</h3>

          <figure className="not-prose my-8">
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold">Source</th>
                    <th className="px-4 py-2 text-left font-semibold">Serving</th>
                    <th className="px-4 py-2 text-left font-semibold">Protein</th>
                    <th className="px-4 py-2 text-left font-semibold">Leucine</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { source: "Whey protein isolate", serving: "30 g scoop", protein: "25 g", leucine: "3.0 g" },
                    { source: "Whole eggs (3 large)", serving: "150 g", protein: "18 g", leucine: "1.6 g" },
                    { source: "Greek yogurt", serving: "200 g", protein: "20 g", leucine: "2.0 g" },
                    { source: "Chicken breast", serving: "120 g", protein: "30 g", leucine: "2.5 g" },
                    { source: "Cottage cheese", serving: "200 g", protein: "22 g", leucine: "2.2 g" },
                    { source: "Salmon fillet", serving: "130 g", protein: "26 g", leucine: "2.0 g" },
                  ].map((row) => (
                    <tr key={row.source} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2 text-muted-foreground">{row.source}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.serving}</td>
                      <td className="px-4 py-2 font-medium">{row.protein}</td>
                      <td className="px-4 py-2 font-medium" style={{ color: parseFloat(row.leucine) >= 2.5 ? "#22c55e" : "var(--muted-foreground)" }}>{row.leucine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              Green values meet or exceed the 2.5 g leucine threshold for maximal MPS activation.
            </figcaption>
          </figure>

          <p>
            Whey protein is the gold standard for post-ride recovery because
            it is rapidly digested, has the highest leucine content per gram
            of any common protein source, and can be consumed as a liquid
            when appetite is suppressed. If you prefer whole foods, chicken
            breast with rice is the classic recovery meal for good reason.
          </p>

          <hr />
          <h2>The 4:1 Carb-to-Protein Ratio</h2>

          <p>
            You have probably seen the recommendation to consume carbs and
            protein in a <strong>4:1 ratio</strong> after exercise. This
            guideline originates from research by John Ivy at the University
            of Texas, which showed that adding protein to a post-exercise
            carbohydrate drink increased glycogen resynthesis by 38% compared
            to carbs alone. The protein stimulates insulin release, which
            amplifies the GLUT4-mediated glucose uptake already occurring in
            the muscle.
          </p>

          <p>
            The 4:1 ratio is a useful starting point, but context matters.
            After a long glycogen-depleting ride, prioritize carbs and the
            ratio may shift toward 3:1. After a strength-focused or
            high-intensity session with less glycogen depletion, a 3:1 or
            even 2:1 ratio with more protein may be appropriate. The key
            principle is: <strong>always include both macronutrients</strong>
            . Carbs without protein misses the repair signal. Protein without
            carbs misses the refueling opportunity.
          </p>

          <hr />
          <h2>Post-Ride Hydration: What Most Cyclists Underestimate</h2>

          <p>
            Dehydration impairs glycogen resynthesis, slows protein
            synthesis, reduces plasma volume, and increases perceived
            fatigue. Even mild dehydration of 2% body weight can reduce
            subsequent exercise performance by 10-20%. Most cyclists finish
            rides in a fluid deficit, especially in warm conditions.
          </p>

          <h3>How Much to Drink</h3>

          <p>
            The most accurate approach: <strong>weigh yourself before and
            after the ride</strong>. Every kilogram of weight lost represents
            approximately one liter of fluid deficit. The replacement target
            is <strong>150% of lost weight</strong> &mdash; the extra 50%
            accounts for ongoing urinary and sweat losses during the
            rehydration period. A rider who loses 1.5 kg during a ride
            should consume approximately 2.25 liters over the next 2-4
            hours.
          </p>

          <h3>Electrolytes Matter</h3>

          <p>
            Water alone is not enough. Sweat contains{" "}
            <strong>500-1,500 mg of sodium per liter</strong>, and sodium is
            critical for fluid retention. Drinking plain water without sodium
            dilutes blood plasma concentration, which triggers urination and
            can actually worsen hydration status. Add{" "}
            <strong>500-700 mg of sodium per liter</strong> of replacement
            fluid, either through electrolyte tablets, sports drinks, or
            salted food.
          </p>

          <p>
            <strong>Monitor urine color</strong> as a practical hydration
            gauge. Pale straw yellow indicates adequate hydration. Dark
            yellow or amber means you are still in deficit. Clear and
            copious means you are over-drinking and flushing electrolytes.
          </p>

          <hr />
          <h2>Recovery Nutrition by Ride Type</h2>

          <p>
            Not every ride demands the same recovery protocol. An easy
            90-minute spin does not create the same metabolic disruption as a
            four-hour endurance ride or a brutal interval session. Matching
            your recovery nutrition to the demands of the session avoids both
            under-fueling and unnecessary caloric excess.
          </p>

          <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#22c55e" }}
                />
                <p className="text-sm font-semibold">Easy Z2 ride (&lt;90 min)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Glycogen depletion is minimal. A normal balanced meal within
                1-2 hours is sufficient. No need for a recovery shake or
                aggressive refueling. Focus on hydration.
              </p>
              <p className="text-xs font-medium mt-2" style={{ color: "#22c55e" }}>
                Carbs: normal meal &middot; Protein: 20-25 g at next meal
              </p>
            </div>
            <div className="rounded-lg border border-border/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#eab308" }}
                />
                <p className="text-sm font-semibold">Hard interval session</p>
              </div>
              <p className="text-xs text-muted-foreground">
                High glycogen cost despite shorter duration. Recovery shake
                within 30 minutes (carbs + protein), followed by a full meal
                within 2 hours. The muscle damage from intensity demands
                prompt protein intake.
              </p>
              <p className="text-xs font-medium mt-2" style={{ color: "#eab308" }}>
                Carbs: 1.0 g/kg in 30 min &middot; Protein: 0.3 g/kg
              </p>
            </div>
            <div className="rounded-lg border border-border/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }}
                />
                <p className="text-sm font-semibold">Long ride (3+ hours)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Major glycogen depletion and significant fluid loss. Begin
                refueling immediately with liquid carbs if appetite is
                suppressed. Follow with a large carb-rich meal within 1 hour.
                Continue eating carb-rich meals for the rest of the day.
              </p>
              <p className="text-xs font-medium mt-2" style={{ color: "#3b82f6" }}>
                Carbs: 1.2 g/kg immediately &middot; Protein: 0.4 g/kg
              </p>
            </div>
            <div className="rounded-lg border border-border/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#dc2626" }}
                />
                <p className="text-sm font-semibold">Two-a-day or back-to-back days</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Recovery speed is critical. Maximize the glycogen window
                aggressively: 1.2 g/kg carbs every hour for 4 hours post-
                ride. Protein with every feeding. Sodium-rich fluids
                throughout. This is where recovery nutrition matters most.
              </p>
              <p className="text-xs font-medium mt-2" style={{ color: "#dc2626" }}>
                Carbs: 1.2 g/kg/hr for 4 hrs &middot; Protein: 0.3 g/kg each
              </p>
            </div>
          </div>

          <hr />
          <h2>Practical Recovery Meals and Snacks</h2>

          <p>
            Optimal is useless if it is not practical. Here are four
            evidence-backed recovery meals that are easy to prepare, easy to
            eat when appetite is low, and deliver the macros your body needs.
          </p>

          <h3>Recovery Shake (Immediate Post-Ride)</h3>
          <p>
            500 ml milk, 25 g whey protein, 1 banana, 2 tbsp honey. Blend.
            Delivers approximately 65 g carbs, 35 g protein, and 500 ml
            fluid. This is the fastest way to hit your targets when you
            cannot stomach solid food.
          </p>

          <h3>Rice Bowl (Within 1-2 Hours)</h3>
          <p>
            200 g cooked white rice, 120 g chicken breast, soy sauce, and
            steamed vegetables. Approximately 70 g carbs, 30 g protein.
            Simple, cheap, and infinitely customizable. Add an egg for extra
            leucine.
          </p>

          <h3>Smoothie Bowl</h3>
          <p>
            200 g Greek yogurt, 1 banana, 40 g oats, 1 tbsp honey, 200 ml
            milk. Blend thick. Approximately 80 g carbs, 25 g protein.
            Works well in warm weather when hot food is unappealing.
          </p>

          <h3>Chocolate Milk (The Research-Backed Surprise)</h3>
          <p>
            Multiple peer-reviewed studies have shown that low-fat chocolate
            milk performs as well as commercial recovery drinks for glycogen
            resynthesis and subsequent exercise performance. A 500 ml
            serving delivers roughly 50 g carbs, 17 g protein, fluid, and
            electrolytes. The 3:1 carb-to-protein ratio is close to optimal.
            It is cheap, available everywhere, and tastes good when nothing
            else appeals. If you only remember one thing from this article,
            keep chocolate milk in the fridge.
          </p>

          <hr />
          <h2>Anti-Inflammatory Foods: What Actually Helps</h2>

          <p>
            Inflammation after exercise is a normal part of the adaptation
            process. Your body uses inflammatory signaling to recruit
            satellite cells, clear damaged tissue, and initiate remodeling.
            The goal is not to eliminate inflammation &mdash; it is to
            support recovery without blunting the adaptive signal.
          </p>

          <h3>Tart Cherry Juice</h3>
          <p>
            The most well-studied anti-inflammatory recovery food in sports
            nutrition. Multiple randomized controlled trials show that
            consuming 30 ml of tart cherry concentrate (or 250 ml of juice)
            twice daily for 4-5 days around hard training reduces delayed
            onset muscle soreness (DOMS) and accelerates strength recovery.
            The mechanism appears to be the anthocyanin content, which
            modulates inflammatory pathways without completely suppressing
            them.
          </p>

          <h3>Omega-3 Fatty Acids</h3>
          <p>
            Fish oil supplementation at <strong>2-3 g/day</strong> of
            combined EPA and DHA has demonstrated anti-inflammatory effects
            in athletes, reduced exercise-induced muscle damage markers, and
            may enhance muscle protein synthesis through improved mTOR
            signaling. Fatty fish like salmon, mackerel, and sardines are
            the best whole-food sources. If supplementing, look for products
            with at least 1 g of EPA per serving.
          </p>

          <h3>Antioxidants: More Is Not Better</h3>
          <p>
            This is where many athletes go wrong. Mega-dosing vitamins C and
            E, loading up on antioxidant supplements, or consuming excessive
            polyphenols can actually{" "}
            <strong>blunt the training adaptation</strong> you are trying to
            build. Reactive oxygen species (ROS) produced during exercise
            are part of the signaling cascade that triggers mitochondrial
            biogenesis and other beneficial adaptations. Neutralizing them
            with excessive antioxidant supplementation removes the signal.
            Eat a varied diet rich in colorful fruits and vegetables. Skip
            the mega-dose supplements.
          </p>

          <h3>Sleep: The Most Potent Recovery Tool</h3>
          <p>
            No amount of perfect nutrition can compensate for poor sleep.
            Growth hormone, the primary driver of tissue repair and
            adaptation, is released in its largest pulse during deep
            slow-wave sleep. Aim for <strong>7-9 hours per night</strong>,
            with particular emphasis on sleep quality after hard training
            days. Your recovery meal should be large enough to prevent
            hunger-driven waking but consumed at least 2-3 hours before
            bed to allow digestion.
          </p>

          <div className="not-prose my-8 rounded-lg border border-border/50 bg-muted/50 p-5">
            <p className="text-sm font-semibold mb-2">Key takeaway</p>
            <p className="text-sm text-muted-foreground">
              Tart cherry juice and omega-3s have strong evidence for aiding
              recovery. But avoid mega-dosing antioxidant supplements &mdash;
              they can blunt the adaptive signal from training. Eat whole
              foods, skip the pills, and prioritize sleep above all else.
            </p>
          </div>

          <hr />
          <h2>Common Recovery Nutrition Mistakes</h2>

          <p>
            Even experienced cyclists make these errors. Each one
            independently compromises recovery; combine several and you are
            actively sabotaging your training.
          </p>

          <h3>Skipping the Recovery Meal</h3>
          <p>
            The most common mistake, especially after easy rides. Even if
            you are not hungry, your muscles need substrate. After moderate
            to hard efforts, force yourself to eat something within the
            first hour. Liquid nutrition works when appetite is suppressed.
          </p>

          <h3>Going Low-Carb After Hard Rides</h3>
          <p>
            Low-carb and ketogenic diets have their place in endurance
            training discussions, but the post-ride window is not it.
            Glycogen resynthesis requires carbohydrate. There is no
            alternative pathway. Restricting carbs after a hard glycogen-
            depleting session delays recovery and impairs performance in
            subsequent sessions. If you follow a low-carb approach, at
            minimum eat your carbs around your workouts.
          </p>

          <h3>Alcohol Post-Ride</h3>
          <p>
            The post-ride beer is a cycling tradition, but the physiology is
            clear: alcohol impairs glycogen resynthesis by up to 50%,
            suppresses muscle protein synthesis by 24-37% (even when protein
            is co-ingested), increases cortisol, and acts as a diuretic that
            worsens dehydration. An occasional beer will not derail your
            season, but making it a habit &mdash; especially after key
            sessions &mdash; is measurably harmful. At minimum, eat your
            recovery meal first and hydrate fully before drinking.
          </p>

          <h3>Over-Supplementing Antioxidants</h3>
          <p>
            As covered above, vitamin C and E mega-doses (1,000 mg+ and
            400 IU+ respectively) have been shown to attenuate training
            adaptations in multiple studies. Your body&apos;s natural
            antioxidant systems are sufficient. Eat your vegetables.
          </p>

          <h3>Not Enough Total Daily Protein</h3>
          <p>
            Post-ride protein is important, but it is not enough on its own.
            Muscle protein synthesis responds to repeated protein feedings
            throughout the day, with each meal providing the 2.5 g leucine
            threshold needed to trigger MPS. Research supports{" "}
            <strong>4-5 protein-rich meals</strong> spaced 3-4 hours apart,
            each containing 0.3-0.4 g/kg of protein. Total daily intake
            should land between 1.6-2.2 g/kg for endurance athletes in
            hard training.
          </p>

          <hr />
          <h2>Your Post-Ride Recovery Protocol</h2>

          <p>
            Putting it all together, here is a step-by-step checklist for
            optimal recovery after a hard training session:
          </p>

          <figure className="not-prose my-8">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-5">
              <p className="text-xs font-semibold mb-4" style={{ color: "var(--primary)" }}>
                Post-ride recovery checklist
              </p>
              <div className="space-y-3">
                {[
                  { time: "0-15 min", action: "Start sipping on electrolyte-rich fluid. Weigh yourself if tracking hydration." },
                  { time: "0-30 min", action: "Consume 1.0-1.2 g/kg carbs + 0.3-0.4 g/kg protein. Liquid is fine if appetite is low." },
                  { time: "30-60 min", action: "Shower, stretch, decompress. Continue hydrating with sodium-containing fluids." },
                  { time: "1-2 hours", action: "Eat a full balanced meal: carb-rich base, quality protein, vegetables, healthy fats." },
                  { time: "Rest of day", action: "Hit protein at every meal (4-5 feedings). Keep carbs elevated after hard or long sessions." },
                  { time: "Before bed", action: "Optional: 30-40 g casein protein (slow-release) to sustain overnight MPS." },
                ].map((step) => (
                  <div key={step.time} className="flex items-start gap-3">
                    <span
                      className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}
                    >
                      {step.time}
                    </span>
                    <p className="text-xs text-muted-foreground">{step.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </figure>

          <p>
            Recovery nutrition is not complicated, but it does require
            intentionality. The riders who improve season after season are
            not just the ones who train the hardest &mdash; they are the ones
            who recover the best. Every gram of carbohydrate that restores
            glycogen, every serving of protein that rebuilds muscle, and
            every liter of fluid that restores plasma volume compounds into
            better adaptation, better performance, and fewer missed training
            days.
          </p>

          <p>
            You earned that fitness on the bike. Do not waste it by
            neglecting what happens after you get off.
          </p>

          <div className="not-prose mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">Recovery targets after every ride</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paincave calculates your post-ride carb, protein, and hydration targets based on actual ride data — power, duration, and training stress.
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

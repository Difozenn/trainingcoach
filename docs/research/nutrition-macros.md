# Daily Macronutrient Periodization — TrainingCoach (2026)

## Overview

Daily macronutrient intake should be periodized based on training load — not fixed at a single daily target. The FFTWR framework (Impey/Morton 2018) and the UCI 2025 consensus (Morton et al.) provide the scientific basis for matching carbohydrate availability to training demands.

## FFTWR Framework (Impey & Morton 2018)

**Fuel For The Work Required (FFTWR)** — a carbohydrate periodization strategy where daily carb intake is adjusted to match the metabolic demands of each training session.

### Core Principle

Not every session needs high carbohydrate availability. Low-intensity aerobic sessions can be performed with reduced carb availability to enhance metabolic flexibility (fat oxidation, mitochondrial biogenesis), while high-intensity or key sessions require full glycogen stores for performance.

```
High-intensity / key session day  →  HIGH carb availability
Moderate session day              →  MODERATE carb availability
Low-intensity / easy day          →  LOW carb availability
Rest day                          →  LOW carb availability
```

### FFTWR vs "Train Low, Compete High"

FFTWR refines the earlier "train low" concept:
- **Train low**: Deliberately deplete glycogen before all training (risky, impairs quality)
- **FFTWR**: Strategically match carbs to session purpose (preserves session quality)

Key difference: FFTWR never compromises the quality of key sessions. High-intensity and race-specific sessions always receive full carbohydrate support.

## UCI 2025 Consensus — Morton et al.

The UCI 2025 position paper by Morton et al. provides updated macronutrient guidelines for endurance athletes, incorporating evidence through 2024.

### Daily Carbohydrate Ranges by Training Day Type

| Day Type | Carb Intake (g/kg/day) | Examples |
|----------|----------------------|----------|
| Rest day | 3 - 4 | No training, active recovery walk |
| Light training day | 4 - 5 | Easy Z1-Z2 session, <60 min |
| Moderate training day | 5 - 7 | Endurance ride/run, 60-120 min Z2 |
| Hard training day | 7 - 8 | Interval session, tempo, sweet spot |
| Very hard / multi-session day | 8 - 10 | 2+ sessions, race simulation, brick |
| Race day / stage race | 10 - 12 | Competition, key event |

### Implementation in TrainingCoach

TrainingCoach calculates daily carb targets based on:
1. Planned workout TSS and intensity zone
2. Athlete body weight (kg)
3. Training phase (base, build, peak, recovery)

```
If planned_TSS == 0:              carbs = 3.5 g/kg (rest day midpoint)
If planned_TSS < 50:              carbs = 4.5 g/kg (light day)
If planned_TSS 50-100:            carbs = 6.0 g/kg (moderate day)
If planned_TSS 100-150:           carbs = 7.5 g/kg (hard day)
If planned_TSS 150-250:           carbs = 9.0 g/kg (very hard day)
If planned_TSS > 250 or race:     carbs = 11.0 g/kg (race day)
```

## Protein Requirements

### Daily Protein Intake

```
Target: 1.6 - 2.0 g/kg/day
```

| Context | Protein (g/kg/day) | Rationale |
|---------|-------------------|-----------|
| Endurance maintenance | 1.6 | Muscle protein synthesis support |
| High training load | 1.8 | Increased muscle damage repair |
| Caloric deficit / weight loss | 2.0 | Preserve lean mass during deficit |
| Recovery from injury | 2.0 | Tissue repair demands |

### Protein Distribution

Distribute protein across 4-5 meals/snacks per day for optimal muscle protein synthesis:

```
Per-meal target: 0.3 - 0.4 g/kg (typically 20-40g per serving)
Post-workout: 20-30g within 2 hours (see recovery-science.md)
Pre-sleep: 30-40g casein-rich protein (sustained overnight MPS)
```

Evidence: Morton et al. (2018) meta-analysis confirmed 1.6 g/kg/day as the threshold for maximizing resistance training-induced muscle protein synthesis gains, applicable to endurance athletes for repair and adaptation.

### Protein Sources

| Source | Protein per 100g | Leucine Content | Notes |
|--------|-----------------|-----------------|-------|
| Whey protein | 80g | High (10-12%) | Fast-absorbing, ideal post-workout |
| Chicken breast | 31g | High | Complete amino acid profile |
| Greek yogurt | 10g | Moderate | Good pre-sleep option (casein) |
| Eggs | 13g | High | Complete protein, convenient |
| Salmon | 20g | Moderate | Omega-3 bonus |
| Lentils | 9g | Low | Plant-based; combine with grains |
| Tofu | 8g | Moderate | Complete plant protein |

## Fat Requirements

### Daily Fat Intake

```
Target: 1.0 - 1.2 g/kg/day (minimum ~20% of total calories)
```

| Context | Fat (g/kg/day) | Notes |
|---------|---------------|-------|
| Normal training | 1.0 - 1.2 | Supports hormones, absorption |
| High-carb race days | May drop below 1.0 | Acceptable short-term to fit carbs |
| Chronic low fat (<0.8 g/kg) | Avoid | Hormonal disruption risk (testosterone, estrogen) |

### Fat Priorities

1. **Essential fatty acids**: Omega-3 (EPA/DHA) from fatty fish, 1-2g/day for anti-inflammatory effects
2. **Unsaturated fats**: Olive oil, avocado, nuts for cardiovascular health
3. **Limit saturated fat**: <10% of total calories (general health guideline)
4. **Fat timing**: Reduce fat intake in pre-workout and during-exercise meals (slows gastric emptying)

## Carbohydrate Loading Protocol

### Pre-Race Carb Loading (3-Day Protocol)

For events >90 minutes, a carbohydrate loading protocol maximizes muscle glycogen stores:

| Day | Timing | Carb Intake | Training |
|-----|--------|-------------|----------|
| Race -3 | 3 days before | 8 - 10 g/kg | Light training only |
| Race -2 | 2 days before | 10 - 12 g/kg | Easy spin / rest |
| Race -1 | Day before race | 10 - 12 g/kg | Rest or light shakeout |
| Race day | Morning of | 2 - 3 g/kg (pre-race meal, 3h before) | Race |

### Carb Loading Practical Tips

- Focus on low-fiber, easily digestible carbs (white rice, pasta, bread, juice)
- Reduce fiber and fat during loading days to minimize GI volume
- Body weight will increase 1-2 kg from water stored with glycogen (3g water per 1g glycogen) — this is normal and expected
- Practice the protocol before B-races, not just the A-race

### Glycogen Storage Capacity

```
Muscle glycogen: ~400 - 700g (depending on muscle mass and training status)
Liver glycogen:  ~80 - 120g
Total:           ~480 - 820g → ~1920 - 3280 kcal of stored carbohydrate
```

A well-carb-loaded athlete can sustain ~90 minutes of high-intensity exercise from glycogen alone. Beyond that, exogenous carbohydrate intake is essential (see `nutrition-fueling.md`).

## Daily Meal Timing Framework

### Hard Training Day Example (70kg athlete, 7.5 g/kg = 525g carbs)

| Meal | Timing | Carbs (g) | Protein (g) | Notes |
|------|--------|-----------|-------------|-------|
| Breakfast | 3h pre-workout | 100 | 25 | Oats, banana, toast |
| Pre-workout snack | 30 min pre | 30 | 5 | Gel or banana |
| During workout | Workout | 60-90 | 0 | See fueling guide |
| Post-workout | Within 1h | 80 | 30 | Recovery shake + meal |
| Lunch | Midday | 100 | 35 | Rice, chicken, vegetables |
| Snack | Afternoon | 50 | 15 | Yogurt, fruit, granola |
| Dinner | Evening | 80 | 35 | Pasta, protein, salad |
| Pre-sleep | Before bed | 25 | 30 | Casein, small carb portion |
| **Total** | | **~525** | **~175** | 7.5 g/kg carb, 2.5 g/kg protein |

### Rest Day Example (70kg athlete, 3.5 g/kg = 245g carbs)

| Meal | Timing | Carbs (g) | Protein (g) | Notes |
|------|--------|-----------|-------------|-------|
| Breakfast | Morning | 60 | 30 | Eggs, toast, fruit |
| Lunch | Midday | 70 | 35 | Mixed meal |
| Snack | Afternoon | 30 | 15 | Nuts, fruit |
| Dinner | Evening | 60 | 35 | Protein-focused, moderate carbs |
| Pre-sleep | Before bed | 25 | 30 | Casein, small snack |
| **Total** | | **~245** | **~145** | 3.5 g/kg carb, 2.1 g/kg protein |

## Special Considerations

### Relative Energy Deficiency in Sport (RED-S)

Chronic energy deficiency impairs:
- Hormonal function (menstrual irregularity, low testosterone)
- Bone mineral density
- Immune function
- Training adaptation and recovery

TrainingCoach monitors for potential RED-S indicators by flagging if estimated energy availability drops below 30 kcal/kg FFM/day consistently.

### Female Athletes

- Carbohydrate needs do not differ significantly from males when expressed per kg body weight
- Increased carb oxidation during the follicular phase; slightly higher fat oxidation during the luteal phase
- Iron requirements are higher; monitor via periodic blood work (not tracked in app)

## References

1. Impey SG, Hearris MA, Hammond KM, et al. Fuel for the work required: a theoretical framework for carbohydrate periodization and the glycogen threshold hypothesis. *Sports Medicine*. 2018;48(5):1031-1048.
2. Morton JP, Impey SG, Hearris MA, et al. UCI consensus statement on nutrition for professional cycling. *British Journal of Sports Medicine*. 2025. (Cited as UCI 2025 Morton et al.)
3. Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *British Journal of Sports Medicine*. 2018;52(6):376-384.
4. Burke LM, Hawley JA, Wong SH, Jeukendrup AE. Carbohydrates for training and competition. *Journal of Sports Sciences*. 2011;29(Suppl 1):S17-S27.
5. Burke LM, van Loon LJ, Hawley JA. Postexercise muscle glycogen resynthesis in humans. *Journal of Applied Physiology*. 2017;122(5):1055-1067.
6. Mountjoy M, Sundgot-Borgen JK, Burke LM, et al. International Olympic Committee (IOC) consensus statement on relative energy deficiency in sport (RED-S): 2018 update. *British Journal of Sports Medicine*. 2018;52(11):687-697.
7. Stellingwerff T, Morton JP, Burke LM. A framework for periodized nutrition for athletics. *International Journal of Sport Nutrition and Exercise Metabolism*. 2019;29(2):141-151.
8. Jager R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition position stand: protein and exercise. *Journal of the International Society of Sports Nutrition*. 2017;14:20.
9. Vitale K, Getzin A. Nutrition and supplement update for the endurance athlete: review and recommendations. *Nutrients*. 2019;11(6):1289.
10. Melin AK, Tornberg AB, Skouby S, et al. Energy availability and the female athlete triad in elite endurance athletes. *Scandinavian Journal of Medicine & Science in Sports*. 2015;25(5):610-622.

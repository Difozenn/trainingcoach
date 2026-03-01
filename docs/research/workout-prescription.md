# Workout Prescription — TrainingCoach (2026)

## Overview

TrainingCoach prescribes workouts using a rule-based coaching engine. Workout selection depends on the athlete's current training phase, TSB (form), weekly load targets, sport-specific needs, and recovery status. This document covers workout types per sport, safety guardrails, and weekly periodization patterns.

## Per-Sport Workout Types

### Cycling — 7 Workout Types

| # | Type | Zone | Duration | TSS Range | Description |
|---|------|------|----------|-----------|-------------|
| 1 | **Recovery Spin** | Z1 | 30 - 60 min | 15 - 30 | Very easy spinning, <55% FTP. Active recovery. |
| 2 | **Endurance Ride** | Z2 | 60 - 240 min | 40 - 180 | Steady aerobic pace, 56-75% FTP. Base building. |
| 3 | **Tempo** | Z3 | 45 - 120 min | 60 - 130 | Sustained effort at 76-90% FTP. Muscular endurance. |
| 4 | **Sweet Spot** | Z3-Z4 | 45 - 90 min | 70 - 120 | 88-93% FTP intervals. High training stimulus with manageable fatigue. |
| 5 | **Threshold Intervals** | Z4 | 45 - 75 min | 70 - 110 | 95-105% FTP efforts, 8-20 min intervals. FTP development. |
| 6 | **VO2max Intervals** | Z5 | 40 - 65 min | 60 - 100 | 106-120% FTP, 3-5 min intervals. Aerobic capacity. |
| 7 | **Anaerobic / Sprint** | Z6-Z7 | 30 - 50 min | 40 - 80 | >120% FTP, 30s-2min efforts. Anaerobic power. |

### Running — 7 Workout Types

| # | Type | Zone | Duration | rTSS Range | Description |
|---|------|------|----------|------------|-------------|
| 1 | **Recovery Jog** | Z1 | 20 - 40 min | 10 - 25 | Very easy, conversational. Active recovery. |
| 2 | **Easy Run** | Z2 | 30 - 90 min | 25 - 80 | Aerobic base, 78-88% threshold pace. |
| 3 | **Long Run** | Z1-Z2 | 75 - 180 min | 70 - 180 | Extended endurance. Builds fatigue resistance. |
| 4 | **Tempo Run** | Z3 | 30 - 60 min | 50 - 90 | 88-95% threshold pace, sustained or cruise intervals. |
| 5 | **Threshold Intervals** | Z4 | 35 - 55 min | 55 - 90 | At threshold pace, 5-15 min intervals with short recovery. |
| 6 | **VO2max Intervals** | Z5 | 30 - 50 min | 50 - 85 | 102-110% threshold pace, 3-5 min reps. |
| 7 | **Speed / Strides** | Z6 | 25 - 40 min | 30 - 55 | Fast reps (100-200m) with full recovery. Neuromuscular. |

### Swimming — 5 Workout Types

| # | Type | Zone | Duration | sTSS Range | Description |
|---|------|------|----------|------------|-------------|
| 1 | **Easy / Technique** | Z1-Z2 | 30 - 60 min | 15 - 40 | Drill work, easy swimming. Stroke refinement. |
| 2 | **Endurance Swim** | Z2 | 40 - 75 min | 30 - 65 | Continuous or long intervals at aerobic pace. |
| 3 | **CSS / Threshold Set** | Z3-Z4 | 35 - 60 min | 40 - 70 | At CSS pace, 200-400m reps, short rest. Threshold. |
| 4 | **VO2max Set** | Z5 | 30 - 50 min | 35 - 65 | 50-200m reps above CSS, moderate rest. Capacity. |
| 5 | **Speed / Sprint Set** | Z5+ | 25 - 45 min | 25 - 50 | 25-50m all-out reps, full rest. Power and speed. |

## TSB Safety Thresholds

TSB (Training Stress Balance) is the primary guardrail for workout prescription safety.

### TSB-Based Prescription Rules

| TSB Range | Status | Allowed Workouts | Restriction |
|-----------|--------|-------------------|-------------|
| > +25 | Detrained / too rested | Any (ramp up gradually) | Do not jump to high intensity immediately |
| +10 to +25 | Fresh / tapered | Any including race | Ideal for peak performance |
| +5 to +10 | Slightly fresh | Hard sessions OK | Normal training |
| -10 to +5 | Functional training | Hard sessions OK with caution | Monitor RPE and completion quality |
| -10 to -20 | Fatigued | Moderate to easy only | No VO2max or threshold intervals |
| -20 to -30 | Very fatigued | Easy / recovery only | Flag in dashboard; suggest rest |
| **< -30** | **Danger zone** | **Recovery only** | **Hard stop: no hard workouts prescribed** |

### TSB < -30 Rule

```
IF TSB < -30:
  - Cancel any scheduled hard workouts
  - Prescribe recovery sessions only (Z1-Z2)
  - Display warning in dashboard
  - Notify athlete via coaching tip
  - Resume normal prescription when TSB > -20
```

This threshold is based on PMC analysis showing that sustained TSB below -30 correlates with illness, injury, and non-functional overreaching in endurance athletes (Coggan, Allen & Coggan 2010).

## Ramp Rate Limits

### Weekly TSS Ramp Rate

```
Maximum weekly TSS increase: 5 - 10% over previous week
```

| Athlete Level | Max Ramp Rate | Rationale |
|--------------|---------------|-----------|
| Beginner (<6 months) | 5% / week | Higher injury risk, less adaptation capacity |
| Intermediate | 7% / week | Standard progressive overload |
| Advanced / experienced | 10% / week | Higher tolerance, better recovery habits |

### Ramp Rate Calculation

```
target_weekly_TSS = previous_week_TSS * (1 + ramp_rate)

Example (intermediate, 400 TSS last week):
  max_next_week = 400 * 1.07 = 428 TSS
```

### Running-Specific Ramp Rate

Running has additional volume constraints due to impact loading:

```
Maximum weekly running DISTANCE increase: 10% (the "10% rule")
Maximum weekly running TSS increase: 7%
```

These limits are applied independently. If distance increases 10%, but TSS would increase more than 7% (due to intensity increase), TSS is the binding constraint.

### Ramp Rate Exceptions

- Recovery weeks (every 3rd or 4th week): reduce to 50-60% of peak week
- Return from injury/illness: start at 50% of pre-break load, ramp 5%/week
- Taper: reduce 40-60% over 1-3 weeks (not subject to ramp limits)

## Hard Session Separation

### 48-Hour Rule

```
Minimum 48 hours between hard sessions (same sport)
Minimum 24 hours between hard sessions (different sports)
```

Definition of "hard session": any workout with primary zone at Z4 or above, or planned TSS > 100.

### Weekly Hard Session Limits

| Weekly Volume | Max Hard Sessions | Max Hard per Sport |
|--------------|-------------------|--------------------|
| 3 - 4 sessions/week | 1 hard | 1 per sport |
| 5 - 6 sessions/week | 2 hard | 1 per sport |
| 7 - 9 sessions/week | 2 - 3 hard | 1 - 2 per sport |
| 10+ sessions/week | 3 - 4 hard | 2 per sport |

### Scheduling Logic

```
1. Place hard sessions first (Tue, Thu, Sat are common)
2. Ensure 48h gap between hard sessions in the same sport
3. Fill remaining days with easy/recovery sessions
4. Place rest day(s) based on athlete preference
5. Swimming can often fill gaps (low musculoskeletal impact)
```

## Weekly Periodization Patterns

### Standard 3:1 Block

The most common periodization pattern: 3 weeks of progressive load followed by 1 recovery week.

| Week | Load (% of target) | Focus |
|------|--------------------|----|
| Week 1 | 85% | Building |
| Week 2 | 95% | Building |
| Week 3 | 100% | Peak load week |
| Week 4 | 55 - 60% | Recovery / adaptation |

### 2:1 Block (Beginners / Masters)

For athletes over 45 or those new to structured training:

| Week | Load (% of target) |
|------|-------------------|
| Week 1 | 90% |
| Week 2 | 100% |
| Week 3 | 55 - 60% |

### Example Weekly Layouts

**5-Day Triathlon Week (Intermediate)**:

| Day | Sport | Type | Intensity |
|-----|-------|------|-----------|
| Monday | Rest | — | — |
| Tuesday | Cycling | Threshold Intervals | HARD |
| Wednesday | Swimming | CSS Set | MODERATE |
| Thursday | Running | Easy Run | EASY |
| Friday | Swimming | Easy / Technique | EASY |
| Saturday | Cycling | Long Endurance Ride | EASY (long) |
| Sunday | Running | Long Run | EASY (long) |

**7-Day Cycling Focus (Advanced)**:

| Day | Type | Intensity |
|-----|------|-----------|
| Monday | Rest | — |
| Tuesday | VO2max Intervals | HARD |
| Wednesday | Recovery Spin | EASY |
| Thursday | Sweet Spot | MODERATE-HARD |
| Friday | Recovery Spin | EASY |
| Saturday | Long Endurance Ride | EASY (long) |
| Sunday | Endurance Ride | EASY |

## Workout Pool vs Fixed Schedule

TrainingCoach uses a **weekly workout pool** model, not a rigid daily schedule:

```
1. Generate a weekly pool of workouts based on:
   - Training phase and goals
   - Target weekly TSS
   - Hard/easy ratio
   - Sport distribution
   - Recovery status

2. Athlete picks WHEN to do each workout from the pool

3. Constraints enforced at selection time:
   - 48h between hard sessions (same sport)
   - 24h between hard sessions (different sports)
   - Cannot do hard session if TSB < -30
   - Recovery status check (HRV, sleep)

4. Unfinished pool workouts at week end:
   - Do not carry over
   - Next week's pool adjusts based on actual completed load
```

**Rationale**: Life doesn't follow a fixed schedule. The pool model gives athletes flexibility while maintaining training structure and safety constraints.

## Adaptation to Missed Workouts

When workouts are missed, the engine adjusts:

| Missed Workouts | Adjustment |
|----------------|------------|
| 1 easy session | No adjustment; slightly lower weekly TSS |
| 1 hard session | Do not reschedule; reduce next week's target slightly |
| 2+ sessions | Recalculate weekly target; do not try to "make up" missed load |
| Full week missed | Treat as unplanned recovery week; resume at 80% of prior load |
| 2+ weeks missed | Re-baseline; resume at 60% of prior load with 5% ramp |

**Key rule**: Never prescribe "make-up" sessions. Missed load is missed. Trying to compress missed volume into remaining days increases injury risk.

## References

1. Allen H, Coggan A. *Training and Racing with a Power Meter*. 2nd ed. VeloPress; 2010.
2. Seiler S. What is best practice for training intensity and duration distribution in endurance athletes? *International Journal of Sports Physiology and Performance*. 2010;5(3):276-291.
3. Mujika I, Halson S, Burke LM, Balague G, Farrow D. An integrated, multifactorial approach to periodization for optimal performance in individual and team sports. *International Journal of Sports Physiology and Performance*. 2018;13(5):538-561.
4. Hausswirth C, Le Meur Y. Physiological and nutritional aspects of post-exercise recovery: specific recommendations for female athletes. *Sports Medicine*. 2011;41(10):861-882.
5. Gabbett TJ. The training-injury prevention paradox: should athletes be training smarter and harder? *British Journal of Sports Medicine*. 2016;50(5):273-280.
6. Soligard T, Schwellnus M, Alonso JM, et al. How much is too much? (Part 1) International Olympic Committee consensus statement on load in sport and risk of injury. *British Journal of Sports Medicine*. 2016;50(17):1030-1041.
7. Drew MK, Finch CF. The relationship between training load and injury, illness and soreness: a systematic and literature review. *Sports Medicine*. 2016;46(6):861-883.
8. Issurin VB. New horizons for the methodology and physiology of training periodization. *Sports Medicine*. 2010;40(3):189-206.
9. Mujika I. Quantification of training and competition loads in endurance sports: methods and applications. *International Journal of Sports Physiology and Performance*. 2017;12(Suppl 2):S2-9-S2-17.
10. Kellmann M, Bertollo M, Bosquet L, et al. Recovery and performance in sport: consensus statement. *International Journal of Sports Physiology and Performance*. 2018;13(2):240-245.

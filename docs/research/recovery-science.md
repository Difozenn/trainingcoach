# Recovery Science — TrainingCoach (2026)

## Overview

Recovery monitoring is the third pillar of the Science to Sport framework (alongside external load and internal load). TrainingCoach integrates heart rate variability (HRV), resting heart rate, and sleep quality data — primarily from Garmin devices — to inform daily coaching decisions. The core principle: **subjective wellness combined with HRV may detect overreaching earlier than power/pace metrics alone**.

## Heart Rate Variability (HRV)

### RMSSD — The Primary HRV Metric

TrainingCoach uses **RMSSD** (Root Mean Square of Successive Differences) as the primary HRV metric:

```
RMSSD = sqrt(mean((RR[i+1] - RR[i])^2))
```

Where RR[i] = the i-th R-R interval in milliseconds (time between successive heartbeats).

RMSSD reflects **parasympathetic (vagal) activity** — the "rest and digest" branch of the autonomic nervous system. Higher RMSSD indicates better parasympathetic tone and generally better readiness to train.

### Why RMSSD Over Other HRV Metrics

| Metric | What It Measures | Why Not Primary |
|--------|-----------------|-----------------|
| **RMSSD** | Parasympathetic activity | **Used** — most reliable, least influenced by breathing rate |
| SDNN | Total HRV (sympathetic + parasympathetic) | Confounded by both ANS branches |
| LF/HF ratio | Sympathovagal balance | Controversial interpretation; breathing rate dependent |
| pNN50 | % of successive RR differences > 50ms | Less sensitive than RMSSD at extremes |

### RMSSD Interpretation

RMSSD is highly individual. Absolute values vary enormously between athletes (20-150+ ms). TrainingCoach uses **individual baselines and trends**, not absolute thresholds.

```
7-day rolling average (RMSSD_7d) = baseline reference
Daily RMSSD compared to 7-day and 30-day rolling averages
```

| RMSSD Trend | Interpretation | Coaching Action |
|-------------|----------------|-----------------|
| Within normal range (CV < 10%) | Well-recovered, adapted | Train as planned |
| Elevated above baseline (>1 SD) | Possible supercompensation OR parasympathetic saturation | Train as planned; monitor |
| Suppressed below baseline (>1 SD) for 1-2 days | Acute fatigue, normal after hard training | Reduce intensity; recovery session |
| Suppressed below baseline for 3+ days | Functional overreaching or illness onset | Reduce load significantly; rest day |
| Consistently suppressed (>1 week) | Non-functional overreaching / overtraining risk | Stop hard training; medical review |
| Highly variable (CV > 15%) | Inconsistent recovery; lifestyle stressors | Address sleep, stress, nutrition |

### Logarithmic Transformation (lnRMSSD)

RMSSD data is typically skewed. TrainingCoach stores and analyzes the natural log:

```
lnRMSSD = ln(RMSSD)
```

This normalizes the distribution, making statistical comparisons (standard deviations, coefficients of variation) more meaningful. A 1-unit change in lnRMSSD represents a proportional change regardless of baseline.

### Coefficient of Variation (CV)

```
CV = (SD of lnRMSSD over 7 days) / (mean lnRMSSD over 7 days) * 100
```

| CV Range | Interpretation |
|----------|----------------|
| < 5% | Very stable; well-adapted |
| 5 - 10% | Normal variation |
| 10 - 15% | Moderate stress; monitor |
| > 15% | High variability; recovery concern |

## Resting Heart Rate (RHR)

### Trending, Not Absolute Values

Like HRV, resting HR is individually variable (40-70+ bpm in trained athletes). TrainingCoach tracks the trend relative to the individual's baseline.

```
RHR_baseline = 30-day rolling average
```

| RHR Trend | Interpretation | Coaching Action |
|-----------|----------------|-----------------|
| Stable (within 3 bpm of baseline) | Normal recovery | Train as planned |
| Elevated 3-5 bpm above baseline | Accumulated fatigue, mild stress | Consider easier session |
| Elevated 5-10 bpm above baseline | Significant fatigue, possible illness | Rest day or very easy session |
| Elevated >10 bpm above baseline | Illness, severe overreaching, dehydration | No training; monitor health |
| Gradual decline over weeks | Improving aerobic fitness | Positive adaptation sign |
| Sudden drop below baseline | Rare; possible parasympathetic saturation | Usually benign; confirm with HRV |

### Orthostatic Test

Some athletes perform morning orthostatic tests (lying → standing HR):

```
Orthostatic HR = standing_HR - lying_HR
Normal range: 10 - 25 bpm difference
Elevated difference (>30 bpm): potential fatigue/dehydration indicator
```

TrainingCoach does not prescribe orthostatic tests but can ingest the data from Garmin if available.

## Sleep Quality

### Sleep Metrics from Garmin

TrainingCoach integrates the following Garmin sleep data via the Garmin Connect API:

| Metric | Source | Use |
|--------|--------|-----|
| Total sleep duration | Garmin | Recovery adequacy |
| Sleep stages (deep, light, REM, awake) | Garmin | Sleep quality assessment |
| Sleep score | Garmin | Composite quality metric |
| Overnight HRV (RMSSD) | Garmin | Recovery status |
| Overnight resting HR | Garmin | Recovery status |
| Respiratory rate | Garmin | Illness detection |

### Sleep Duration Recommendations

| Target | Duration | Evidence |
|--------|----------|----------|
| Minimum | 7 hours | Below 7h: impaired glycogen resynthesis, increased injury risk |
| Optimal | 8 - 9 hours | Most endurance athletes need 8+ hours for full recovery |
| Extension benefit | 9 - 10 hours | Mah et al. (2011): sleep extension improved athletic performance |
| Napping | 20 - 30 min | Power naps supplement night sleep; avoid >30 min (sleep inertia) |

### Sleep Quality Indicators

```
Good sleep:  >20% deep sleep, >20% REM, <10% awake time
Poor sleep:  <15% deep sleep, <15% REM, >15% awake time
```

TrainingCoach flags consecutive nights of poor sleep (2+) as a recovery risk factor.

## The Science to Sport Principle: Subjective + HRV

### Why Combine Subjective and Objective Metrics

Halson (2014) and Bourdon et al. (2017) established that no single metric reliably detects overreaching in isolation. The integrated approach:

```
Subjective wellness (mood, fatigue, soreness, sleep quality, stress)
  + HRV (RMSSD trend)
  + Resting HR trend
  → More sensitive overreaching detection than performance metrics alone
```

**Key finding**: Power output and pace often remain normal during early-stage functional overreaching. By the time performance declines, the athlete is already in non-functional overreaching (recovery takes weeks, not days). Subjective wellness and HRV typically show changes 3-7 days before performance decrement.

### Daily Wellness Check-In (Optional)

TrainingCoach offers an optional daily check-in with 5 questions rated 1-5:

| Question | What It Detects |
|----------|-----------------|
| Sleep quality (1-5) | Recovery quality |
| Energy level (1-5) | General fatigue |
| Muscle soreness (1-5) | Musculoskeletal fatigue |
| Mood (1-5) | Psychological stress / overtraining |
| Motivation to train (1-5) | Early overreaching signal |

Composite wellness score = sum / 25 * 100 (percentage).

| Wellness Score | Interpretation |
|---------------|----------------|
| 80 - 100% | Well-recovered; train as planned |
| 60 - 80% | Moderate fatigue; monitor |
| 40 - 60% | Significant fatigue; reduce load |
| < 40% | Rest recommended; possible illness |

## Recovery Decision Matrix

TrainingCoach combines multiple signals into a recovery status:

| HRV Trend | RHR Trend | Wellness Score | Sleep | Recovery Status | Action |
|-----------|-----------|---------------|-------|-----------------|--------|
| Normal | Normal | >80% | >7h | GREEN — Fully recovered | Train as planned |
| Normal | Normal | 60-80% | >7h | YELLOW — Monitor | Train, but drop intensity if struggling |
| Suppressed | Elevated | 60-80% | <7h | ORANGE — Fatigued | Easy session or rest day |
| Suppressed | Elevated | <60% | <7h | RED — Recovery needed | Rest day; no hard training |
| Suppressed 3+ days | Elevated 3+ days | <60% | Variable | RED — Overreaching risk | Extended recovery; assess |

## Garmin Metrics Integration

### Available Garmin Health Metrics

| Garmin Metric | TrainingCoach Use | API Field |
|--------------|-------------------|-----------|
| HRV Status | Recovery assessment | `hrvSummary` |
| Resting HR | Fatigue trend | `restingHeartRate` |
| Sleep data | Recovery quality | `sleepData` |
| Body Battery | General readiness (display only) | `bodyBattery` |
| Stress Level | Lifestyle stress (display only) | `stressLevel` |
| SpO2 | Altitude acclimatization, illness | `spo2` |
| Respiration Rate | Illness detection | `respirationRate` |

### Data Priority

TrainingCoach uses Garmin data in this priority order:
1. **HRV (RMSSD)** — primary recovery metric
2. **Resting HR** — secondary, trend-based
3. **Sleep duration and quality** — context for HRV interpretation
4. **Body Battery / Stress** — displayed but not used for coaching decisions (proprietary algorithms, not research-validated)

## Recovery Nutrition Windows

### Immediate Post-Exercise (0-2 hours)

The "recovery window" — while not as narrow as once believed — still represents an optimal period for glycogen resynthesis and muscle protein synthesis:

```
Carbohydrate: 1.0 - 1.2 g/kg within first hour (high-glycemic)
Protein:      20 - 30g within first 2 hours (leucine-rich)
Fluid:        1.25 - 1.5 L per kg body weight lost during exercise
Sodium:       Replace losses (sports drink or salted food)
```

### Glycogen Resynthesis Rate

```
With carb intake: ~5-7% muscle glycogen per hour
Without carb intake: ~1-2% per hour
Full resynthesis: 24-48 hours with adequate carbohydrate intake
```

The resynthesis rate is highest in the first 2 hours post-exercise when insulin sensitivity and GLUT4 transporter activity are elevated. This matters most when the athlete has another session within 8-24 hours.

### If Only One Session Per Day

When the next session is >24 hours away, total daily carbohydrate intake matters more than immediate timing. The "window" is important primarily for multi-session days or back-to-back hard days.

## References

1. Halson SL. Monitoring training load to understand fatigue in athletes. *Sports Medicine*. 2014;44(Suppl 2):S139-S147.
2. Bourdon PC, Cardinale M, Murray A, et al. Monitoring athlete training loads: consensus statement. *International Journal of Sports Physiology and Performance*. 2017;12(Suppl 2):S2-161-S2-170.
3. Plews DJ, Laursen PB, Stanley J, Kilding AE, Buchheit M. Training adaptation and heart rate variability in elite endurance athletes: opening the door to effective monitoring. *Sports Medicine*. 2013;43(9):773-781.
4. Plews DJ, Laursen PB, Kilding AE, Buchheit M. Heart-rate variability and training-intensity distribution in elite rowers. *International Journal of Sports Physiology and Performance*. 2014;9(6):1026-1032.
5. Buchheit M. Monitoring training status with HR measures: do all roads lead to Rome? *Frontiers in Physiology*. 2014;5:73.
6. Mah CD, Mah KE, Kezirian EJ, Dement WC. The effects of sleep extension on the athletic performance of collegiate basketball players. *Sleep*. 2011;34(7):943-950.
7. Saw AE, Main LC, Gastin PB. Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures: a systematic review. *British Journal of Sports Medicine*. 2016;50(5):281-291.
8. Vitale JA, Bonato M, Galasso L, et al. Sleep quality and high-intensity interval training at two different times of day: a crossover study on the influence of the chronotype in male collegiate soccer players. *Chronobiology International*. 2017;34(7):920-926.
9. Burke LM, van Loon LJ, Hawley JA. Postexercise muscle glycogen resynthesis in humans. *Journal of Applied Physiology*. 2017;122(5):1055-1067.
10. Flatt AA, Esco MR. Smartphone-derived heart-rate variability and training load in a women's soccer team. *International Journal of Sports Physiology and Performance*. 2015;10(8):994-1000.
11. Bellenger CR, Fuller JT, Thomson RL, Davison K, Robertson EY, Buckley JD. Monitoring athletic training status through autonomic heart rate regulation: a systematic review and meta-analysis. *Sports Medicine*. 2016;46(10):1461-1486.

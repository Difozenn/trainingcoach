# Training Load Science — TrainingCoach (2026)

## Overview

TrainingCoach uses the **Banister Impulse-Response Model** (1975) as the theoretical foundation for training load monitoring. This model treats fitness and fatigue as two competing exponential processes driven by training stress, and is operationalized through the **Performance Management Chart (PMC)** popularized by Andrew Coggan and later adopted across endurance sports.

## Banister Impulse-Response Model

Banister et al. (1975) proposed that athletic performance can be modeled as the difference between a positive (fitness) and negative (fatigue) response to training impulses:

```
Performance(t) = p0 + k1 * Fitness(t) - k2 * Fatigue(t)
```

Where:
- **p0** = baseline performance
- **k1, k2** = scaling constants for fitness and fatigue gains
- **Fitness(t)** = accumulated positive training effect (slow-decaying)
- **Fatigue(t)** = accumulated negative training effect (fast-decaying)

The key insight: fitness accumulates and decays slowly, while fatigue accumulates and decays quickly. After a taper, fatigue drops faster than fitness, producing a performance peak.

## Performance Management Chart (PMC)

Coggan adapted the Banister model into practical metrics using Training Stress Score (TSS) as the daily training impulse:

| Metric | Full Name | Time Constant | Meaning |
|--------|-----------|---------------|---------|
| **CTL** | Chronic Training Load | 42 days | Fitness — long-term training load |
| **ATL** | Acute Training Load | 7 days | Fatigue — short-term training load |
| **TSB** | Training Stress Balance | CTL - ATL | Form — readiness to perform |

### EMA Formulas

All three metrics use **Exponential Moving Averages (EMA)** of daily TSS values:

```
CTL(today) = CTL(yesterday) + (TSS(today) - CTL(yesterday)) / 42
ATL(today) = ATL(yesterday) + (TSS(today) - ATL(yesterday)) / 7
TSB(today) = CTL(today) - ATL(today)
```

General EMA formula with time constant tau:

```
EMA(today) = EMA(yesterday) + (value(today) - EMA(yesterday)) / tau
```

Equivalent exponential decay form:

```
EMA(today) = value(today) * (1/tau) + EMA(yesterday) * (1 - 1/tau)
```

Where:
- **tau = 42** for CTL (chronic / fitness)
- **tau = 7** for ATL (acute / fatigue)

### TSB Interpretation

| TSB Range | State | Recommendation |
|-----------|-------|----------------|
| > +25 | Detrained / excessively rested | Increase training load |
| +10 to +25 | Fresh / tapered | Race readiness zone |
| +5 to +10 | Slightly fresh | Good for key workouts |
| -10 to +5 | Functional range | Normal training |
| -10 to -30 | Fatigued / overreaching | Monitor recovery closely |
| < -30 | High injury/overtraining risk | Reduce load immediately |

## Science to Sport Monitoring Framework

The Science to Sport integrated monitoring approach (Halson 2014, Bourdon et al. 2017) recommends tracking:

1. **External load** — what the athlete does (TSS, duration, distance, power)
2. **Internal load** — how the athlete responds (HR, RPE, HRV)
3. **Subjective wellness** — sleep quality, mood, muscle soreness, fatigue
4. **Performance markers** — FTP tests, time trials, race results

TrainingCoach implements all four pillars:
- External load via TSS from power/pace data
- Internal load via heart rate metrics (hrTSS fallback)
- Subjective wellness via daily check-in (optional)
- Performance markers via auto-detected threshold changes

## PMC Chart Implementation

The PMC chart in TrainingCoach displays:
- **Daily TSS bars** (blue) — individual training stress per day
- **CTL line** (blue) — chronic training load trend
- **ATL line** (pink/red) — acute training load trend
- **TSB line** (yellow) — training stress balance / form
- **TSB shading** — green for positive (fresh), red for negative (fatigued)

Time range options: 6 weeks, 3 months, 6 months, 1 year, all time.

## Limitations and Considerations

- The Banister model assumes **linearity** — real physiological adaptation is nonlinear
- TSS conflates duration and intensity; a 200 TSS ride can be 2h hard or 5h easy — the recovery profile differs
- Individual response variation means optimal time constants may differ from 42/7 (Busso 2003)
- CTL is not "fitness" — it is a proxy for training load accumulation. An athlete can have high CTL and still be slow if the training quality is poor
- TSB is not "form" — it is a load balance metric. An athlete needs adequate CTL to race well, not just positive TSB

## References

1. Banister EW, Calvert TW, Savage MV, Bach T. A systems model of training for athletic performance. *Australian Journal of Sports Medicine*. 1975;7:57-61.
2. Coggan A. Training and racing with a power meter. In: Allen H, Coggan A. *Training and Racing with a Power Meter*. 2nd ed. VeloPress; 2010.
3. Busso T. Variable dose-response relationship between exercise training and performance. *Medicine & Science in Sports & Exercise*. 2003;35(7):1188-1195.
4. Halson SL. Monitoring training load to understand fatigue in athletes. *Sports Medicine*. 2014;44(Suppl 2):S139-S147.
5. Bourdon PC, Cardinale M, Murray A, et al. Monitoring athlete training loads: consensus statement. *International Journal of Sports Physiology and Performance*. 2017;12(Suppl 2):S2-161-S2-170.
6. Sanders D, Myers T, Akubat I. Training-intensity distribution in road cyclists: objective versus subjective measures. *International Journal of Sports Physiology and Performance*. 2017;12(9):1232-1237.
7. Mujika I, Halson S, Burke LM, Balague G, Farrow D. An integrated, multifactorial approach to periodization for optimal performance in individual and team sports. *International Journal of Sports Physiology and Performance*. 2018;13(5):538-561.
8. Passfield L, Hopker JG, Jobson S, Friel D, Zabala M. Knowledge is power: issues of measuring training and performance in cycling. *Journal of Sports Sciences*. 2017;35(14):1426-1434.

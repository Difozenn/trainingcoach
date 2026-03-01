# TSS Calculations by Sport — TrainingCoach (2026)

## Overview

Training Stress Score (TSS) quantifies the physiological cost of a training session on a normalized scale where 100 TSS equals one hour at threshold intensity. Each sport uses a sport-specific TSS variant due to differences in biomechanics and energy cost. All TSS values feed into a unified PMC (see `training-science.md`).

## Cycling: TSS (Training Stress Score)

### Normalized Power (NP)

NP estimates the metabolic cost of variable-power cycling by emphasizing high-intensity surges. Algorithm:

```
1. Record power data at 1-second intervals
2. Calculate 30-second rolling average of power
3. Raise each 30s average to the 4th power
4. Take the mean of all 4th-power values
5. Take the 4th root of the mean

NP = (mean(rolling_30s_power ^ 4)) ^ 0.25
```

The 4th-power exponent reflects the nonlinear relationship between power output and physiological strain (Coggan 2003). Short high-power surges cost disproportionately more than steady-state efforts.

### Intensity Factor (IF)

```
IF = NP / FTP
```

Where FTP = Functional Threshold Power (estimated 1-hour maximal power output).

| IF Range | Description |
|----------|-------------|
| < 0.75 | Recovery / easy endurance |
| 0.75 - 0.85 | Endurance / tempo |
| 0.85 - 0.95 | Tempo / sweet spot |
| 0.95 - 1.05 | Threshold |
| 1.05 - 1.15 | VO2max intervals |
| > 1.15 | Anaerobic / neuromuscular |

### TSS Formula

```
TSS = (duration_seconds * NP * IF) / (FTP * 3600) * 100
```

Simplified equivalent:

```
TSS = (duration_seconds * IF^2) / 3600 * 100
```

Example: 90 minutes at IF = 0.85 → TSS = (5400 * 0.7225) / 3600 * 100 = 108

### Coggan 7-Zone Model

| Zone | Name | % of FTP | Purpose |
|------|------|----------|---------|
| 1 | Active Recovery | < 55% | Recovery rides |
| 2 | Endurance | 56 - 75% | Aerobic base building |
| 3 | Tempo | 76 - 90% | Muscular endurance |
| 4 | Lactate Threshold | 91 - 105% | Threshold development |
| 5 | VO2max | 106 - 120% | Aerobic capacity |
| 6 | Anaerobic Capacity | 121 - 150% | Anaerobic power |
| 7 | Neuromuscular Power | > 150% | Sprint / peak power |

Source: Coggan (2003), Allen & Coggan (2010).

## Running: rTSS (Running TSS)

### Normalized Graded Pace (NGP)

NGP adjusts running pace for elevation changes using the Minetti gradient cost model. Running uphill costs more energy per meter than flat running; downhill costs less (to a point).

```
Grade adjustment factor ≈ 1 + 3.3% per 1% grade (simplified)
```

Full Minetti cost-of-transport curve (Minetti et al. 2002):

| Grade (%) | Cost Multiplier (approx) |
|-----------|--------------------------|
| -10 | 0.72 |
| -5 | 0.82 |
| 0 | 1.00 |
| +5 | 1.17 |
| +10 | 1.33 |

Algorithm:

```
1. For each point, calculate grade from elevation change / distance
2. Apply cost-of-transport adjustment to pace
3. Equivalent flat pace = actual pace / cost_multiplier
4. NGP = average of grade-adjusted pace values (weighted by time)
```

### Running Intensity Factor (rIF)

```
rIF = NGP / Threshold_Pace
```

Where Threshold_Pace is the athlete's estimated 1-hour maximal sustainable pace (functional threshold pace, similar to FTP for cycling).

### rTSS Formula

```
rTSS = rIF^2 * duration_hours * 100
```

Note: Running uses **IF squared** — same exponent as cycling. The quadratic relationship reflects the metabolic cost scaling with pace.

Example: 60 minutes at rIF = 0.90 → rTSS = 0.81 * 1.0 * 100 = 81

### Running 6-Zone Pace Model

| Zone | Name | % of Threshold Pace | Purpose |
|------|------|---------------------|---------|
| 1 | Recovery | < 78% | Easy recovery jogs |
| 2 | Aerobic | 78 - 88% | Base endurance |
| 3 | Tempo | 88 - 95% | Lactate clearance |
| 4 | Threshold | 95 - 102% | Lactate threshold |
| 5 | VO2max | 102 - 110% | Aerobic capacity |
| 6 | Anaerobic | > 110% | Speed / neuromuscular |

Note: Running zones are pace-based. Faster pace = higher zone (lower time value per km/mile). The percentage is of speed, not time — 110% of threshold speed is faster than threshold.

## Swimming: sTSS (Swim TSS)

### Critical Swim Speed (CSS)

CSS is the swimming equivalent of FTP — an estimate of the pace sustainable for approximately 30-60 minutes. Calculated from two time trials:

```
CSS = 200 / (T400 - T200)
```

Where:
- **T400** = time in seconds for a 400m time trial
- **T200** = time in seconds for a 200m time trial
- **CSS** = speed in meters per second

CSS pace (sec/100m):

```
CSS_pace = 100 / CSS = (T400 - T200) / 2
```

Example: T400 = 360s (6:00), T200 = 160s (2:40) → CSS = 200 / 200 = 1.0 m/s → CSS pace = 100 s/100m (1:40/100m)

### Swimming Intensity Factor (sIF)

```
sIF = actual_speed / CSS
```

Or equivalently:

```
sIF = CSS_pace / actual_pace
```

### sTSS Formula — CUBED Exponent

```
sTSS = sIF^3 * duration_hours * 100
```

**CRITICAL: Swimming uses IF CUBED (^3), not squared.** This is because water resistance increases with the cube of velocity (drag force is proportional to velocity squared, and power = force * velocity, so power scales with velocity cubed). A 10% increase in swim speed requires approximately 33% more power, not 21% as in running/cycling.

| Sport | TSS Formula | Exponent | Reason |
|-------|-------------|----------|--------|
| Cycling | IF^2 * hours * 100 | 2 | Power is directly measured |
| Running | IF^2 * hours * 100 | 2 | Ground-based, linear cost scaling |
| Swimming | IF^3 * hours * 100 | 3 | Cubic drag-velocity relationship in water |

Example: 45 minutes at sIF = 0.95 → sTSS = 0.857 * 0.75 * 100 = 64

### Swimming 5-Zone CSS Model

| Zone | Name | % of CSS Pace | Purpose |
|------|------|---------------|---------|
| 1 | Recovery | > 120% of CSS pace | Easy / warm-up |
| 2 | Endurance | 108 - 120% | Aerobic base |
| 3 | Tempo | 100 - 108% | Threshold development |
| 4 | Threshold | 95 - 100% | CSS pace |
| 5 | VO2max/Speed | < 95% | Race pace / speed work |

Note: Swimming zones are pace-based where a higher percentage of CSS pace means slower (easier). Zone 5 is faster-than-CSS pace.

## hrTSS Fallback (Heart Rate-Based)

When power/pace data is unavailable, TrainingCoach falls back to heart rate-based TSS estimation using a modified TRIMP (Training Impulse) approach.

### TRIMP Calculation (Banister 1991)

```
TRIMP = duration_minutes * delta_HR_ratio * e^(k * delta_HR_ratio)

Where:
  delta_HR_ratio = (avg_HR - resting_HR) / (max_HR - resting_HR)
  k = 1.92 for males, 1.67 for females (Banister weighting factor)
```

### hrTSS from TRIMP

```
hrTSS = TRIMP * (1 / TRIMP_at_threshold) * 100
```

Where TRIMP_at_threshold is the TRIMP value for 1 hour at lactate threshold heart rate.

### hrTSS Limitations

- Heart rate is influenced by cardiac drift, caffeine, heat, altitude, hydration, sleep, and stress
- HR lags behind actual effort during intervals (slow response to changes)
- Overestimates TSS for short hard efforts, underestimates for long steady efforts
- Not reliable for swimming due to the diving reflex reducing HR in water
- Should only be used when power/pace data is genuinely unavailable

## TSS Guidelines by Session Type

| Session Type | Typical TSS | Recovery Time |
|-------------|-------------|---------------|
| Recovery ride/jog | 20 - 40 | < 24 hours |
| Easy endurance | 40 - 80 | 24 hours |
| Moderate endurance | 80 - 120 | 24 - 36 hours |
| Tempo / sweet spot | 100 - 160 | 36 - 48 hours |
| Threshold intervals | 80 - 130 | 48 hours |
| VO2max intervals | 60 - 110 | 48 - 72 hours |
| Race / hard group ride | 150 - 350+ | 48 - 96 hours |
| Grand fondo / marathon | 250 - 500+ | 72 - 120 hours |

## References

1. Coggan A. Training with power — level II. Lecture presented at: USA Cycling Coaching Summit; 2003; Colorado Springs, CO.
2. Allen H, Coggan A. *Training and Racing with a Power Meter*. 2nd ed. VeloPress; 2010.
3. Minetti AE, Moia C, Roi GS, Susta D, Ferretti G. Energy cost of walking and running at extreme uphill and downhill slopes. *Journal of Applied Physiology*. 2002;93(3):1039-1046.
4. Banister EW. Modeling elite athletic performance. In: MacDougall JD, Wenger HA, Green HJ, eds. *Physiological Testing of the High-Performance Athlete*. 2nd ed. Human Kinetics; 1991:403-424.
5. Skiba PF, Chidnok W, Vanhatalo A, Jones AM. Modeling the expenditure and reconstitution of work capacity above critical power. *Medicine & Science in Sports & Exercise*. 2012;44(8):1526-1532.
6. Toussaint HM, Beek PJ. Biomechanics of competitive front crawl swimming. *Sports Medicine*. 1992;13(1):8-24.
7. Denadai BS, Greco CC. Can the critical swimming speed and pace be determined from the 200- and 400-m performance? *Journal of Sports Science & Medicine*. 2022;21(1):145-152.
8. Karvonen MJ, Kentala E, Mustala O. The effects of training on heart rate; a longitudinal study. *Annales Medicinae Experimentalis et Biologiae Fenniae*. 1957;35(3):307-315.
9. Sanders D, Abt G, Hespe MK, Myers T, Akubat I. Methods of monitoring training load and their relationships to changes in fitness and performance in competitive road cyclists. *International Journal of Sports Physiology and Performance*. 2017;12(5):668-675.
10. Passfield L, Hopker JG, Jobson S, Friel D, Zabala M. Knowledge is power: issues of measuring training and performance in cycling. *Journal of Sports Sciences*. 2017;35(14):1426-1434.

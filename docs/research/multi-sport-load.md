# Multi-Sport Training Load — TrainingCoach (2026)

## Overview

Triathletes and multi-sport athletes accumulate training stress across cycling, running, and swimming. TrainingCoach uses a **unified daily TSS** approach: sport-specific TSS values are summed into a single daily total, which feeds one shared CTL/ATL/TSB curve. Sport-specific zones and thresholds remain independent.

## Unified Daily TSS

### Principle

Each sport produces its own TSS variant (cycling TSS, rTSS, sTSS — see `tss-calculations.md`). These are designed to be comparable on the same scale: 100 TSS = 1 hour at threshold in any sport.

```
Daily_TSS = sum(cycling_TSS) + sum(rTSS) + sum(sTSS)
```

If an athlete rides for 80 TSS in the morning and runs for 55 rTSS in the evening:

```
Daily_TSS = 80 + 55 = 135
```

This daily total feeds the EMA calculations for CTL, ATL, and TSB (see `training-science.md`).

### Single PMC Curve

TrainingCoach maintains **one** CTL/ATL/TSB curve per athlete, not per sport. This reflects total systemic load on the body:

```
CTL(today) = CTL(yesterday) + (Daily_TSS - CTL(yesterday)) / 42
ATL(today) = ATL(yesterday) + (Daily_TSS - ATL(yesterday)) / 7
TSB(today) = CTL(today) - ATL(today)
```

**Rationale**: Fatigue is systemic. A hard bike ride affects running performance the next day. The central nervous system, hormonal state, glycogen stores, and connective tissue stress are shared across sports. A single PMC captures total body load more accurately than separate per-sport curves.

### Dashboard Display

The PMC chart shows:
- Combined CTL/ATL/TSB lines
- Daily TSS bars color-coded or stacked by sport (cycling / running / swimming)
- Tooltip breakdown showing each sport's contribution to daily TSS

## Sport-Specific Zones and Thresholds

While TSS is unified, **training zones and threshold values are independent per sport**:

| Parameter | Cycling | Running | Swimming |
|-----------|---------|---------|----------|
| Threshold metric | FTP (watts) | Threshold Pace (min/km) | CSS (m/s) |
| Zone model | Coggan 7-zone | 6-zone pace | 5-zone CSS |
| TSS formula exponent | IF^2 | IF^2 | IF^3 |
| Primary data source | Power meter | GPS pace + elevation | Pace per 100m |
| Auto-detection method | 20min power * 0.95 | Pace from threshold runs | 400m/200m TT delta |

Each sport's zones are calculated from its own threshold. Improving cycling FTP does not change running zones, and vice versa.

## Heart Rate Differences Across Sports

Maximum heart rate and heart rate zones differ systematically across sports due to body position, muscle mass recruitment, and the diving reflex.

### Running vs Cycling HR Offset

Running typically produces **5-10 bpm higher max HR** than cycling:

| Factor | Effect on HR |
|--------|-------------|
| Body position | Running is upright; cycling is bent over (reduced venous return) |
| Muscle mass | Running recruits more total muscle mass (upper body stabilization) |
| Weight bearing | Running is weight-bearing, increasing total oxygen demand |
| Impact loading | Running involves eccentric muscle contractions adding metabolic cost |

**Implementation**: If max HR is established from running, cycling max HR is estimated as:

```
cycling_max_HR = running_max_HR - 7  (midpoint of 5-10 range)
```

If max HR is established from cycling:

```
running_max_HR = cycling_max_HR + 7
```

### Swimming vs Cycling HR Offset

Swimming typically produces **10-15 bpm lower max HR** than cycling:

| Factor | Effect on HR |
|--------|-------------|
| Diving reflex | Face immersion triggers parasympathetic bradycardia |
| Horizontal position | Supine/prone position improves venous return, reducing HR needed |
| Cooling effect | Water conducts heat 25x faster than air, reducing thermoregulatory HR |
| Smaller muscle mass | Upper body dominant — less total O2 demand than running/cycling |

**Implementation**:

```
swimming_max_HR = cycling_max_HR - 12  (midpoint of 10-15 range)
```

### HR Zone Translation Table

Example for an athlete with cycling max HR of 185 bpm:

| Zone | Cycling HR | Running HR (est.) | Swimming HR (est.) |
|------|-----------|-------------------|-------------------|
| Max HR | 185 | 192 | 173 |
| Threshold HR (~85%) | 157 | 163 | 147 |
| Zone 2 ceiling (~75%) | 139 | 144 | 130 |

**Important**: These offsets are population averages. Individual variation is significant. TrainingCoach auto-detects sport-specific max HR from activity data when sufficient data exists, overriding the estimated offsets.

## Multi-Sport Weekly Load Distribution

### Typical Weekly TSS Ranges by Level

| Level | Weekly TSS | Cycling % | Running % | Swimming % |
|-------|-----------|-----------|-----------|------------|
| Beginner triathlete | 200 - 350 | 40 - 50% | 30 - 35% | 15 - 25% |
| Intermediate | 350 - 550 | 40 - 50% | 25 - 35% | 15 - 25% |
| Advanced / age-group | 550 - 800 | 45 - 55% | 25 - 30% | 15 - 20% |
| Elite / pro | 800 - 1200+ | 45 - 55% | 25 - 30% | 15 - 20% |

Cycling typically dominates weekly TSS because sessions are longer. Swimming contributes least TSS despite frequent sessions because water resistance limits session duration.

### Brick Workouts

When two sports are performed back-to-back (e.g., bike then run), each segment produces its own TSS using sport-specific calculations. Both contribute to the daily total. TrainingCoach identifies brick workouts when two activities of different sports begin within 15 minutes of each other.

## Cross-Sport Fatigue Considerations

- A high-TSS cycling day impairs next-day running performance (shared glycogen depletion, CNS fatigue)
- Swimming has the lowest musculoskeletal impact and can often be performed on "rest" days from cycling/running
- Running has the highest injury risk per TSS due to impact loading — ramp rate limits should be stricter for running
- Heat and altitude affect all sports equally through central cardiovascular mechanisms

## References

1. Allen H, Coggan A. *Training and Racing with a Power Meter*. 2nd ed. VeloPress; 2010.
2. Mujika I. Quantification of training and competition loads in endurance sports: methods and applications. *International Journal of Sports Physiology and Performance*. 2017;12(Suppl 2):S2-9-S2-17.
3. Roach GD, Schmidt WF, Aughey RJ, et al. The demands of the Tour de France on the body and mind. *European Journal of Sport Science*. 2023;23(4):574-583.
4. Millet GP, Vleck VE, Bentley DJ. Physiological differences between cycling and running: lessons for triathletes. *Sports Medicine*. 2009;39(3):179-206.
5. Holfelder B, Brown N, Bubeck D. The physiological basis of heart rate differences between cycling, running, and swimming. *European Journal of Applied Physiology*. 2020;120(5):1035-1044.
6. Millet GP, Bentley DJ, Vleck VE. The relationships between science and sport: application in triathlon. *International Journal of Sports Physiology and Performance*. 2007;2(3):315-322.
7. Bourdon PC, Cardinale M, Murray A, et al. Monitoring athlete training loads: consensus statement. *International Journal of Sports Physiology and Performance*. 2017;12(Suppl 2):S2-161-S2-170.
8. Hue O. Heart rate response during underwater swimming in competitive pool swimmers. *Journal of Sports Medicine and Physical Fitness*. 2021;61(3):395-400.

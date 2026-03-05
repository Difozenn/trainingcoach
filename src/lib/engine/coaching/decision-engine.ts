/**
 * Decision Engine — Rule-Based Coaching Logic
 *
 * Layered decision-making:
 * 1. SAFETY — overrides everything (TSB, ramp rate, consecutive hard days)
 * 2. HEALTH — HRV/sleep/resting HR/body battery modifications
 * 3. ACWR — acute:chronic workload ratio check
 *
 * Returns a graduated tsbMultiplier (0.4–1.0) instead of binary force_rest.
 * The most restrictive check wins.
 *
 * Science to Sport principle: Training load metrics (CTL/ATL/TSB) are
 * feedback, not the goal. Subjective wellness + HRV may detect
 * overreaching earlier than power metrics alone.
 */

export type AthleteState = {
  ctl: number;
  atl: number;
  tsb: number;
  rampRate: number; // weekly CTL change %
  consecutiveHardDays: number;
  // Health metrics (from Garmin)
  hrv7DayTrend: "rising" | "stable" | "declining" | "unknown";
  restingHrDelta: number; // difference from baseline
  sleepScore: number | null; // 0-100
  bodyBattery: number | null; // 0-100
};

export type SafetyDecision = {
  action: "force_rest" | "reduce_intensity" | "proceed";
  reason: string;
  maxTssAllowed: number | null; // null = no cap (per day)
  tsbMultiplier: number; // 0.4 to 1.0 — applied to weekly TSS target
};

/**
 * TSB-based safety multiplier.
 * Graduated response instead of binary force_rest.
 */
function getTsbMultiplier(tsb: number): { multiplier: number; action: SafetyDecision["action"]; reason: string } {
  if (tsb < -40) {
    return {
      multiplier: 0.4,
      action: "force_rest",
      reason:
        "Emergency: TSB is below -40. You're dangerously fatigued. " +
        "Forced recovery — only very easy spinning until TSB recovers above -25.",
    };
  }
  if (tsb < -30) {
    return {
      multiplier: 0.6,
      action: "force_rest",
      reason:
        "TSB is below -30. Significant fatigue accumulation. " +
        "Recovery week prescribed — light activity only to absorb recent training.",
    };
  }
  if (tsb < -25) {
    return {
      multiplier: 0.85,
      action: "reduce_intensity",
      reason:
        "TSB is -25 to -30, approaching overreach zone. " +
        "Reducing volume by 15% this week. If this persists, a recovery week is needed.",
    };
  }
  if (tsb >= -25 && tsb <= 5) {
    // Normal productive training range
    return {
      multiplier: 1.0,
      action: "proceed",
      reason: "TSB in productive training range. Proceed as planned.",
    };
  }
  if (tsb > 5 && tsb <= 15) {
    return {
      multiplier: 0.9,
      action: "proceed",
      reason: "You're feeling fresh. Slight volume reduction to maintain form.",
    };
  }
  if (tsb > 15 && tsb <= 25) {
    return {
      multiplier: 0.5,
      action: "reduce_intensity",
      reason: "Race-ready freshness (TSB +15 to +25). Taper mode — maintain intensity, low volume.",
    };
  }
  // TSB > +25 — detraining
  return {
    multiplier: 1.0,
    action: "proceed",
    reason: "TSB above +25 — risk of detraining. Resuming normal training volume.",
  };
}

/**
 * Layer 1: Safety checks.
 * These override ALL other recommendations.
 */
export function checkSafety(state: AthleteState): SafetyDecision {
  // Start with TSB-based multiplier
  const tsb = getTsbMultiplier(state.tsb);
  let bestMultiplier = tsb.multiplier;
  let bestAction = tsb.action;
  let bestReason = tsb.reason;
  let maxTss: number | null = null;

  // Ramp rate too high → reduce volume
  if (state.rampRate > 10) {
    if (bestMultiplier > 0.75) {
      bestMultiplier = 0.75;
      bestAction = "reduce_intensity";
      bestReason =
        "Training load has increased more than 10% this week. " +
        "Gradual progression (5-8% per week) reduces injury risk. Volume reduced by 25%.";
    }
  }

  // 3+ consecutive hard days → force recovery
  if (state.consecutiveHardDays >= 3) {
    if (bestMultiplier > 0.5) {
      bestMultiplier = 0.5;
      bestAction = "force_rest";
      bestReason =
        "Three or more hard days in a row. Recovery allows adaptation. " +
        "Take an easy day or rest day.";
      maxTss = 40;
    }
  }

  // ACWR check: ATL/CTL ratio > 1.5 → spike in acute load
  if (state.ctl > 0) {
    const acwr = state.atl / state.ctl;
    if (acwr > 2.0) {
      if (bestMultiplier > 0.5) {
        bestMultiplier = 0.5;
        bestAction = "force_rest";
        bestReason =
          "Acute:Chronic workload ratio exceeds 2.0 (very high injury risk). " +
          "Your recent training has spiked far above your fitness baseline. Recovery required.";
        maxTss = 30;
      }
    } else if (acwr > 1.5) {
      if (bestMultiplier > 0.75) {
        bestMultiplier = 0.75;
        bestAction = "reduce_intensity";
        bestReason =
          "Acute:Chronic workload ratio exceeds 1.5. " +
          "Recent load is significantly higher than your baseline fitness. Easing back to reduce injury risk.";
      }
    }
  }

  return {
    action: bestAction,
    reason: bestReason,
    maxTssAllowed: maxTss,
    tsbMultiplier: bestMultiplier,
  };
}

/**
 * Layer 2: Health-based modifications.
 * HRV declining + poor sleep = strong signal to reduce.
 */
export function checkHealth(state: AthleteState): SafetyDecision {
  // HRV declining + poor sleep → force rest
  if (
    state.hrv7DayTrend === "declining" &&
    state.sleepScore !== null &&
    state.sleepScore < 60
  ) {
    return {
      action: "force_rest",
      reason:
        "HRV is trending down and sleep quality is poor. " +
        "Your body is signaling it needs recovery. Rest today pays off tomorrow.",
      maxTssAllowed: 30,
      tsbMultiplier: 0.5,
    };
  }

  // HRV declining alone → reduce intensity
  if (state.hrv7DayTrend === "declining") {
    return {
      action: "reduce_intensity",
      reason:
        "HRV has been declining over the past week. " +
        "Consider reducing today's intensity to prevent overreaching.",
      maxTssAllowed: null,
      tsbMultiplier: 0.8,
    };
  }

  // Elevated resting HR → reduce
  if (state.restingHrDelta > 5) {
    return {
      action: "reduce_intensity",
      reason:
        "Resting heart rate is elevated by more than 5 bpm above your baseline. " +
        "This may indicate incomplete recovery or illness onset.",
      maxTssAllowed: null,
      tsbMultiplier: 0.8,
    };
  }

  // Low Body Battery → force rest
  if (state.bodyBattery !== null && state.bodyBattery < 25) {
    return {
      action: "force_rest",
      reason:
        "Body Battery is very low. Your body needs recovery before the next hard session.",
      maxTssAllowed: 30,
      tsbMultiplier: 0.5,
    };
  }

  // Poor sleep alone → suggest easy day
  if (state.sleepScore !== null && state.sleepScore < 50 && state.tsb < 0) {
    return {
      action: "reduce_intensity",
      reason:
        "Poor sleep combined with existing fatigue. " +
        "An easy day will help your body recover.",
      maxTssAllowed: null,
      tsbMultiplier: 0.85,
    };
  }

  return {
    action: "proceed",
    reason: "Health metrics look good. Proceed with planned training.",
    maxTssAllowed: null,
    tsbMultiplier: 1.0,
  };
}

/**
 * Get the final coaching decision combining safety + health layers.
 * Most restrictive multiplier wins.
 */
export function getCoachingDecision(state: AthleteState): SafetyDecision {
  const safety = checkSafety(state);
  const health = checkHealth(state);

  // Use the most restrictive multiplier
  const finalMultiplier = Math.min(safety.tsbMultiplier, health.tsbMultiplier);

  // Use the most restrictive action
  let finalAction: SafetyDecision["action"] = "proceed";
  if (safety.action === "force_rest" || health.action === "force_rest") {
    finalAction = "force_rest";
  } else if (safety.action === "reduce_intensity" || health.action === "reduce_intensity") {
    finalAction = "reduce_intensity";
  }

  // Use most restrictive maxTss
  let finalMaxTss: number | null = null;
  if (safety.maxTssAllowed !== null && health.maxTssAllowed !== null) {
    finalMaxTss = Math.min(safety.maxTssAllowed, health.maxTssAllowed);
  } else {
    finalMaxTss = safety.maxTssAllowed ?? health.maxTssAllowed;
  }

  // Pick the reason from whichever is more restrictive
  const finalReason = safety.tsbMultiplier <= health.tsbMultiplier
    ? safety.reason
    : health.reason;

  return {
    action: finalAction,
    reason: finalReason,
    maxTssAllowed: finalMaxTss,
    tsbMultiplier: finalMultiplier,
  };
}

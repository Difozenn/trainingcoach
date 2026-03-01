/**
 * Decision Engine — Rule-Based Coaching Logic
 *
 * Layered decision-making:
 * 1. SAFETY — overrides everything
 * 2. HEALTH — HRV/sleep/resting HR modifications
 * 3. PERIODIZATION — phase-appropriate intensity
 * 4. DISTRIBUTION — hard/easy day patterns
 * 5. NUTRITION — auto-generate fueling for each workout
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
  maxTssAllowed: number | null; // null = no cap
};

/**
 * Layer 1: Safety checks.
 * These override ALL other recommendations.
 */
export function checkSafety(state: AthleteState): SafetyDecision {
  // TSB deeply negative → force recovery
  if (state.tsb < -30) {
    return {
      action: "force_rest",
      reason:
        "Your form (TSB) is below -30 — you're accumulating significant fatigue. " +
        "A rest day will help you absorb recent training and come back stronger.",
      maxTssAllowed: 30,
    };
  }

  // Ramp rate too high → reduce volume
  if (state.rampRate > 10) {
    return {
      action: "reduce_intensity",
      reason:
        "Training load has increased more than 10% this week. " +
        "Gradual progression (5-8% per week) reduces injury risk.",
      maxTssAllowed: null,
    };
  }

  // 3+ consecutive hard days → force recovery
  if (state.consecutiveHardDays >= 3) {
    return {
      action: "force_rest",
      reason:
        "Three or more hard days in a row. Recovery allows adaptation. " +
        "Take an easy day or rest day.",
      maxTssAllowed: 40,
    };
  }

  return {
    action: "proceed",
    reason: "No safety concerns. Training can proceed as planned.",
    maxTssAllowed: null,
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
    };
  }

  // Low Body Battery → force rest
  if (state.bodyBattery !== null && state.bodyBattery < 25) {
    return {
      action: "force_rest",
      reason:
        "Body Battery is very low. Your body needs recovery before the next hard session.",
      maxTssAllowed: 30,
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
    };
  }

  return {
    action: "proceed",
    reason: "Health metrics look good. Proceed with planned training.",
    maxTssAllowed: null,
  };
}

/**
 * Get the final coaching decision combining safety + health layers.
 * Most restrictive decision wins.
 */
export function getCoachingDecision(state: AthleteState): SafetyDecision {
  const safety = checkSafety(state);
  if (safety.action === "force_rest") return safety;

  const health = checkHealth(state);
  if (health.action === "force_rest") return health;

  // If either says reduce, use the more restrictive one
  if (safety.action === "reduce_intensity") return safety;
  if (health.action === "reduce_intensity") return health;

  return {
    action: "proceed",
    reason: "All systems go. Train as planned.",
    maxTssAllowed: null,
  };
}

/**
 * Workout Generator — Sport-Specific Structured Workouts
 *
 * Generates workout structures (intervals, durations, targets) for each sport.
 * Workouts are expressed as structured intervals that can be exported to
 * ZWO, FIT, MRC, ERG, or ICS formats.
 *
 * Reference:
 * - Seiler (2010) polarized training
 * - Stöggl & Sperlich (2014) polarized vs threshold training
 */

import type { WorkoutInterval } from "@/lib/db/schema/training";

type Sport = "cycling" | "running" | "swimming";

export type WorkoutTemplate = {
  sport: Sport;
  workoutType: string;
  title: string;
  description: string;
  targetDurationMinutes: number;
  targetTss: number;
  targetIf: number;
  structure: WorkoutInterval[];
  coachingTip: string;
  whyThisWorkout: string;
};

// ============ CYCLING WORKOUTS ============

export function generateCyclingWorkout(
  type: string,
  ftp: number,
  durationMinutes: number = 60
): WorkoutTemplate {
  switch (type) {
    case "recovery_ride":
      return {
        sport: "cycling",
        workoutType: type,
        title: "Recovery Ride",
        description: "Easy spin, legs loose, no hard efforts",
        targetDurationMinutes: Math.min(durationMinutes, 45),
        targetTss: 25,
        targetIf: 0.55,
        structure: [
          { type: "warmup", durationSeconds: 300, powerTargetPctFtp: 0.45 },
          {
            type: "work",
            durationSeconds: (Math.min(durationMinutes, 45) - 10) * 60,
            powerTargetPctFtp: 0.5,
            notes: "Easy spinning, keep it smooth",
          },
          { type: "cooldown", durationSeconds: 300, powerTargetPctFtp: 0.4 },
        ],
        coachingTip:
          "Recovery rides should feel genuinely easy. If you're struggling to keep power low, that's a sign you need the recovery.",
        whyThisWorkout:
          "Active recovery promotes blood flow to muscles without adding training stress. Helps clear metabolic waste from hard sessions.",
      };

    case "endurance_ride":
      return {
        sport: "cycling",
        workoutType: type,
        title: "Endurance Ride",
        description: `${durationMinutes} min zone 2 endurance`,
        targetDurationMinutes: durationMinutes,
        targetTss: Math.round(durationMinutes * 0.8),
        targetIf: 0.68,
        structure: [
          { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
          {
            type: "work",
            durationSeconds: (durationMinutes - 20) * 60,
            powerTargetPctFtp: 0.68,
            notes: "Steady zone 2 effort, conversational pace",
          },
          { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.5 },
        ],
        coachingTip:
          "Zone 2 builds your aerobic engine. You should be able to hold a conversation. If you can't talk, you're going too hard.",
        whyThisWorkout:
          "Aerobic base training drives mitochondrial development and fat oxidation. The foundation for all other adaptations.",
      };

    case "sweet_spot":
      return {
        sport: "cycling",
        workoutType: type,
        title: "Sweet Spot Intervals",
        description: "3×15min at 88-93% FTP",
        targetDurationMinutes: 75,
        targetTss: 85,
        targetIf: 0.88,
        structure: [
          { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
          {
            type: "work",
            durationSeconds: 900,
            powerTargetPctFtp: 0.9,
            repeat: 3,
            intervals: [
              { type: "work", durationSeconds: 900, powerTargetPctFtp: 0.9, notes: "Sweet spot — hard but sustainable" },
              { type: "rest", durationSeconds: 300, powerTargetPctFtp: 0.5 },
            ],
          },
          { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.5 },
        ],
        coachingTip:
          "Sweet spot training gives ~90% of the benefit of threshold work with much less fatigue. Great training efficiency.",
        whyThisWorkout:
          "Sweet spot (88-93% FTP) maximizes aerobic adaptations while keeping recovery cost manageable. High training ROI.",
      };

    case "threshold_ride":
      return {
        sport: "cycling",
        workoutType: type,
        title: "Threshold Intervals",
        description: "2×20min at 95-105% FTP",
        targetDurationMinutes: 70,
        targetTss: 80,
        targetIf: 0.95,
        structure: [
          { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
          {
            type: "work",
            durationSeconds: 1200,
            powerTargetPctFtp: 1.0,
            repeat: 2,
            intervals: [
              { type: "work", durationSeconds: 1200, powerTargetPctFtp: 1.0, notes: "At or just below FTP" },
              { type: "rest", durationSeconds: 600, powerTargetPctFtp: 0.5 },
            ],
          },
          { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.5 },
        ],
        coachingTip:
          "Threshold work is hard by design. Target steady power — don't surge at the start. If you can't hold the power, drop by 5%.",
        whyThisWorkout:
          "Threshold intervals push your FTP up by training at the boundary of aerobic and anaerobic metabolism.",
      };

    case "vo2max_ride":
      return {
        sport: "cycling",
        workoutType: type,
        title: "VO2max Intervals",
        description: "5×4min at 110-120% FTP, 3min recovery",
        targetDurationMinutes: 65,
        targetTss: 75,
        targetIf: 0.90,
        structure: [
          { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
          {
            type: "work",
            durationSeconds: 240,
            powerTargetPctFtp: 1.15,
            repeat: 5,
            intervals: [
              { type: "work", durationSeconds: 240, powerTargetPctFtp: 1.15, notes: "Hard! Should be very uncomfortable" },
              { type: "rest", durationSeconds: 180, powerTargetPctFtp: 0.45 },
            ],
          },
          { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.5 },
        ],
        coachingTip:
          "VO2max intervals should feel very hard — breathing heavily, wanting to stop. That's the point. Full recovery between intervals.",
        whyThisWorkout:
          "VO2max training increases maximal oxygen uptake, the ceiling for all endurance performance. High-value but high-cost.",
      };

    default:
      return generateCyclingWorkout("endurance_ride", ftp, durationMinutes);
  }
}

// ============ RUNNING WORKOUTS ============

export function generateRunningWorkout(
  type: string,
  thresholdPaceSecPerKm: number,
  durationMinutes: number = 45
): WorkoutTemplate {
  switch (type) {
    case "easy_run":
      return {
        sport: "running",
        workoutType: type,
        title: "Easy Run",
        description: `${durationMinutes}min easy effort`,
        targetDurationMinutes: durationMinutes,
        targetTss: Math.round(durationMinutes * 0.6),
        targetIf: 0.7,
        structure: [
          {
            type: "work",
            durationSeconds: durationMinutes * 60,
            paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.2),
            notes: "Conversational pace, relaxed",
          },
        ],
        coachingTip:
          "Easy runs build aerobic base without adding fatigue. Run by feel — if you can't talk, slow down.",
        whyThisWorkout:
          "80% of training should be easy. This builds mitochondrial density and aerobic capacity without injury risk.",
      };

    case "long_run":
      return {
        sport: "running",
        workoutType: type,
        title: "Long Run",
        description: `${durationMinutes}min steady endurance`,
        targetDurationMinutes: durationMinutes,
        targetTss: Math.round(durationMinutes * 0.75),
        targetIf: 0.75,
        structure: [
          {
            type: "work",
            durationSeconds: durationMinutes * 60,
            paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.15),
            notes: "Steady effort, even splits",
          },
        ],
        coachingTip:
          "Start conservative. The last 30 minutes should feel harder but pace should stay even. Fuel with carbs if >90 minutes.",
        whyThisWorkout:
          "Long runs develop endurance, teach the body to burn fat, and build mental resilience for race day.",
      };

    case "tempo_run":
      return {
        sport: "running",
        workoutType: type,
        title: "Tempo Run",
        description: "20min at tempo pace (zone 3)",
        targetDurationMinutes: 45,
        targetTss: 55,
        targetIf: 0.85,
        structure: [
          { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.2) },
          {
            type: "work",
            durationSeconds: 1200,
            paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.08),
            notes: "Comfortably hard — you can say short sentences",
          },
          { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.2) },
        ],
        coachingTip:
          "Tempo pace should feel comfortably hard. You can say short phrases but not hold a full conversation.",
        whyThisWorkout:
          "Tempo work improves lactate clearance and running economy at moderate intensity.",
      };

    case "threshold_intervals_run":
      return {
        sport: "running",
        workoutType: type,
        title: "Threshold Intervals",
        description: "4×8min at threshold pace, 2min jog recovery",
        targetDurationMinutes: 55,
        targetTss: 70,
        targetIf: 0.92,
        structure: [
          { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.2) },
          {
            type: "work",
            durationSeconds: 480,
            paceTargetSecPerKm: thresholdPaceSecPerKm,
            repeat: 4,
            intervals: [
              { type: "work", durationSeconds: 480, paceTargetSecPerKm: thresholdPaceSecPerKm, notes: "At threshold — hard but controlled" },
              { type: "rest", durationSeconds: 120, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.3) },
            ],
          },
          { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.2) },
        ],
        coachingTip:
          "Threshold intervals build your ability to sustain a hard effort. Aim for even splits across all intervals.",
        whyThisWorkout:
          "Training at lactate threshold pace raises the speed you can sustain before lactate accumulation.",
      };

    case "vo2max_intervals_run":
      return {
        sport: "running",
        workoutType: type,
        title: "VO2max Intervals",
        description: "6×3min at VO2max pace, 2min jog",
        targetDurationMinutes: 50,
        targetTss: 65,
        targetIf: 0.88,
        structure: [
          { type: "warmup", durationSeconds: 600, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.2) },
          {
            type: "work",
            durationSeconds: 180,
            paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 0.92),
            repeat: 6,
            intervals: [
              { type: "work", durationSeconds: 180, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 0.92), notes: "Hard effort — breathing heavily" },
              { type: "rest", durationSeconds: 120, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.3) },
            ],
          },
          { type: "cooldown", durationSeconds: 600, paceTargetSecPerKm: Math.round(thresholdPaceSecPerKm * 1.2) },
        ],
        coachingTip:
          "VO2max intervals are very hard. Focus on consistency — last interval should be as fast as the first. Full recovery between.",
        whyThisWorkout:
          "VO2max training raises your aerobic ceiling. Essential for 5K-10K performance and overall fitness gains.",
      };

    default:
      return generateRunningWorkout("easy_run", thresholdPaceSecPerKm, durationMinutes);
  }
}

// ============ SWIMMING WORKOUTS ============

export function generateSwimmingWorkout(
  type: string,
  cssSPer100m: number,
  durationMinutes: number = 45
): WorkoutTemplate {
  switch (type) {
    case "endurance_swim":
      return {
        sport: "swimming",
        workoutType: type,
        title: "Endurance Swim",
        description: `${durationMinutes}min steady aerobic swimming`,
        targetDurationMinutes: durationMinutes,
        targetTss: Math.round(durationMinutes * 0.5),
        targetIf: 0.8,
        structure: [
          { type: "warmup", durationSeconds: 300, paceTargetSecPer100m: Math.round(cssSPer100m * 1.2), notes: "Easy warm-up" },
          {
            type: "work",
            durationSeconds: (durationMinutes - 10) * 60,
            paceTargetSecPer100m: Math.round(cssSPer100m * 1.1),
            notes: "Steady aerobic pace — focus on form",
          },
          { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(cssSPer100m * 1.25), notes: "Easy cool-down" },
        ],
        coachingTip:
          "Focus on stroke efficiency. Count strokes per length — fewer strokes at the same speed = better technique.",
        whyThisWorkout:
          "Builds aerobic swimming fitness and reinforces good technique under low fatigue.",
      };

    case "threshold_swim":
      return {
        sport: "swimming",
        workoutType: type,
        title: "CSS Threshold Set",
        description: "8×200m at CSS pace, 20s rest",
        targetDurationMinutes: 50,
        targetTss: 55,
        targetIf: 1.0,
        structure: [
          { type: "warmup", durationSeconds: 600, paceTargetSecPer100m: Math.round(cssSPer100m * 1.2) },
          {
            type: "work",
            durationSeconds: Math.round(cssSPer100m * 2),
            paceTargetSecPer100m: cssSPer100m,
            repeat: 8,
            intervals: [
              { type: "work", durationSeconds: Math.round(cssSPer100m * 2), paceTargetSecPer100m: cssSPer100m, notes: "Hold CSS pace — steady and controlled" },
              { type: "rest", durationSeconds: 20 },
            ],
          },
          { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(cssSPer100m * 1.2) },
        ],
        coachingTip:
          "CSS pace should feel sustainably hard — you could keep going but it's not comfortable. Consistent splits are the goal.",
        whyThisWorkout:
          "Training at CSS develops your aerobic threshold in the water, the key pace for open water and triathlon swimming.",
      };

    case "vo2max_swim":
      return {
        sport: "swimming",
        workoutType: type,
        title: "VO2max Swim Set",
        description: "8×100m fast, 30s rest",
        targetDurationMinutes: 45,
        targetTss: 50,
        targetIf: 1.1,
        structure: [
          { type: "warmup", durationSeconds: 600, paceTargetSecPer100m: Math.round(cssSPer100m * 1.2) },
          {
            type: "work",
            durationSeconds: Math.round(cssSPer100m * 0.9),
            paceTargetSecPer100m: Math.round(cssSPer100m * 0.9),
            repeat: 8,
            intervals: [
              { type: "work", durationSeconds: Math.round(cssSPer100m * 0.9), paceTargetSecPer100m: Math.round(cssSPer100m * 0.9), notes: "Hard effort — faster than CSS" },
              { type: "rest", durationSeconds: 30 },
            ],
          },
          { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(cssSPer100m * 1.2) },
        ],
        coachingTip:
          "These should be hard. Maintain good form even when tired — don't let technique fall apart.",
        whyThisWorkout:
          "VO2max swim sets push your aerobic ceiling and improve speed at high intensities.",
      };

    case "drill_technique":
      return {
        sport: "swimming",
        workoutType: type,
        title: "Technique & Drill Session",
        description: "Mixed drills, form work, and easy swimming",
        targetDurationMinutes: 40,
        targetTss: 20,
        targetIf: 0.7,
        structure: [
          { type: "warmup", durationSeconds: 300, paceTargetSecPer100m: Math.round(cssSPer100m * 1.3), notes: "Easy warm-up" },
          {
            type: "work",
            durationSeconds: 1800,
            paceTargetSecPer100m: Math.round(cssSPer100m * 1.2),
            notes: "Drill work: catch-up, finger-tip drag, fist drill, single-arm. Focus on feel.",
          },
          { type: "cooldown", durationSeconds: 300, paceTargetSecPer100m: Math.round(cssSPer100m * 1.3) },
        ],
        coachingTip:
          "Drill sessions aren't about speed — they're about feel. Concentrate on one thing per drill: catch, pull, rotation.",
        whyThisWorkout:
          "Technique is everything in swimming. Small improvements in form = big improvements in speed and efficiency.",
      };

    default:
      return generateSwimmingWorkout("endurance_swim", cssSPer100m, durationMinutes);
  }
}

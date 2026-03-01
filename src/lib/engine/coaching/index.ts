export {
  checkSafety,
  checkHealth,
  getCoachingDecision,
} from "./decision-engine";
export type { AthleteState, SafetyDecision } from "./decision-engine";
export {
  generateEventPeriodization,
  generateAutoProgressivePlan,
} from "./periodization";
export type { Phase, PhaseConfig } from "./periodization";
export {
  generateCyclingWorkout,
  generateRunningWorkout,
  generateSwimmingWorkout,
} from "./workout-generator";
export type { WorkoutTemplate } from "./workout-generator";
export { generateWeeklyPlan } from "./weekly-planner";
export type { WeeklyPlanInput, WeeklyPlanOutput } from "./weekly-planner";

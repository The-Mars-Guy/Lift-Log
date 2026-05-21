export {
  READINESS,
  DEFAULT_READINESS,
  EQUIPMENT_PROFILES,
  TRAINING_GOALS,
  JOINT_AREAS,
  SUBSTITUTIONS,
  VARIATION_LADDERS,
  readinessScore,
  readinessLabel,
  estimated1RM,
  bestEstimated1RM,
  exerciseFeedbackSignal,
  recentTrainingLoad,
  behaviorMemory,
  repRangeFor,
  exactRepTarget,
  tempoPrescription,
  variationPrescription,
  sciencePrescription,
  exerciseTrend,
  painBlockedExercises,
  plateauFixes,
  recommendDeload,
  suggestSubstitutions,
  evaluateProgression,
  roundWeight,
  coachTargetReps,
  coachSetCount,
  latestMuscleSoreness,
  muscleRecoveryStats,
} from "./coach/progression.js";

export {
  buildCoachMemory,
  buildWeeklyReview,
  weeklyMuscleCoverage,
  detectWeakPoints,
  buildCoachInsights,
  computePersonalRecords,
} from "./coach/memory.js";

export {
  routineEditSuggestions,
  generateCoachRoutine,
  generateCoachProgram,
} from "./coach/routines.js";

export {
  summarizeWorkout,
  explainExerciseDecision,
  buildCoachNotes,
  buildSessionIntent,
  buildCoachPlan,
} from "./coach/session.js";

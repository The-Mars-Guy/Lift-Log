import { exerciseId } from "./exercises.js";

// ─── GOALS ───────────────────────────────────────────────────────────────────
// goal.type: "weight" = target lbs (per dumbbell / barbell total)
//            "reps"   = target max clean reps
//            "sessions" = reach X total sessions
export const DEFAULT_GOALS = [];

export function makeGoal({ exerciseName = "", type = "weight", targetValue = 0, targetDate = "", note = "" } = {}) {
  return {
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    exerciseName,
    type,
    targetValue: Number(targetValue) || 0,
    targetDate: targetDate || "",
    note,
    createdAt: Date.now(),
    achieved: false,
    achievedAt: null,
  };
}

// Returns current progress value for a goal from history/exConfig
function _currentGoalValue(goal, history = [], exConfig = {}, totalSessions = 0) {
  if (goal.type === "sessions") return totalSessions;
  const name = goal.exerciseName;
  if (!name) return 0;
  if (goal.type === "reps") {
    const cfg = exConfig[name];
    return cfg?.targetReps ?? 0;
  }
  if (goal.type === "weight") {
    // Find latest logged weight for this exercise
    for (let i = history.length - 1; i >= 0; i--) {
      const session = history[i];
      const ex = (session.exercises || []).find(e => e.name === name || e.id === exerciseId(name));
      if (ex) {
        const setLog = ex.setLog || [];
        if (setLog.length) return Math.max(...setLog.map(l => l.weight || 0));
      }
    }
    return 0;
  }
  return 0;
}

export function goalProgress(goal, history = [], exConfig = {}, totalSessions = 0) {
  const current = _currentGoalValue(goal, history, exConfig, totalSessions);
  const target = goal.targetValue;
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const achieved = goal.achieved || (target > 0 && current >= target);
  const now = Date.now();
  const targetTs = goal.targetDate ? new Date(goal.targetDate).getTime() : null;
  const daysLeft = targetTs ? Math.max(0, Math.ceil((targetTs - now) / 86400000)) : null;
  const daysElapsed = Math.ceil((now - goal.createdAt) / 86400000) || 1;
  const delta = current - (goal.startValue ?? 0);
  const weeklyRate = delta > 0 ? (delta / daysElapsed) * 7 : 0;
  const remaining = target - current;
  const weeksLeft = daysLeft != null ? daysLeft / 7 : null;
  const weeklyNeeded = weeksLeft && weeksLeft > 0 && remaining > 0 ? remaining / weeksLeft : null;
  const onTrack = weeklyNeeded == null ? true : weeklyRate >= weeklyNeeded * 0.8;
  return { current, target, pct, achieved, daysLeft, weeklyRate, weeklyNeeded, onTrack };
}

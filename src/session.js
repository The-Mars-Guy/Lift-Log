export const DAY_NUM = { Monday: 1, Wednesday: 3, Friday: 5 };

export function scheduledDate(day, base = new Date()) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const current = d.getDay() || 7;
  d.setDate(d.getDate() + DAY_NUM[day] - current);
  return d;
}

export function isoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dy}`;
}

export const completionKey = (day, base = new Date()) => `${isoDate(scheduledDate(day, base))}_${day}`;

export function logKey(sessionKey, exerciseIndex, setIndex) {
  return `${sessionKey}_${exerciseIndex}_${setIndex}`;
}

export function defaultWorkoutDay(base = new Date()) {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = names[base.getDay()];
  if (DAY_NUM[today]) return today;
  const current = base.getDay() || 7;
  return Object.entries(DAY_NUM).find(([, dayNum]) => dayNum > current)?.[0] || "Monday";
}

export function setVolume(log, dumbbells = 2) {
  return (log.reps || 0) * (log.weight || 0) * dumbbells;
}

export function exerciseVolume(exercise, fallbackWeight) {
  const dumbbells = exercise.name === "Goblet Squat" ? 1 : 2;
  if (exercise.setLog?.length) {
    return exercise.setLog.reduce((sum, log) => sum + setVolume(log, dumbbells), 0);
  }
  return (exercise.reps || 0) * (exercise.sets || 0) * fallbackWeight * dumbbells;
}

export function remainingSeconds(endsAt, now = Date.now()) {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function normalizeLiftLogData(data = {}) {
  const normalized = { ...data };
  if (!normalized.settings || typeof normalized.settings !== "object" || Array.isArray(normalized.settings)) normalized.settings = {};
  if (!Array.isArray(normalized.history)) normalized.history = [];
  if (!Array.isArray(normalized.achievements)) normalized.achievements = [];
  if (!Array.isArray(normalized.checkIns)) normalized.checkIns = [];
  if (!Array.isArray(normalized.bodyMetrics)) normalized.bodyMetrics = [];
  if (!normalized.sets || typeof normalized.sets !== "object" || Array.isArray(normalized.sets)) normalized.sets = {};
  if (!normalized.completed || typeof normalized.completed !== "object" || Array.isArray(normalized.completed)) normalized.completed = {};
  if (!normalized.progression || typeof normalized.progression !== "object" || Array.isArray(normalized.progression)) normalized.progression = {};
  if (!normalized.exConfig || typeof normalized.exConfig !== "object" || Array.isArray(normalized.exConfig)) normalized.exConfig = {};
  if (typeof normalized.xp !== "number" || Number.isNaN(normalized.xp)) normalized.xp = 0;
  if (typeof normalized.assessmentDone !== "boolean") normalized.assessmentDone = normalized.history.length > 0;
  if (!normalized.customRoutine || typeof normalized.customRoutine !== "object" || Array.isArray(normalized.customRoutine)) normalized.customRoutine = null;
  if (!normalized.userProfile || typeof normalized.userProfile !== "object" || Array.isArray(normalized.userProfile)) normalized.userProfile = null;
  return normalized;
}

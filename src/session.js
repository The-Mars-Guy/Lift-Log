import { exerciseConfigKey } from "./data/exercises.js";

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
  if (!Array.isArray(normalized.goals)) normalized.goals = [];
  if (!normalized.sets || typeof normalized.sets !== "object" || Array.isArray(normalized.sets)) normalized.sets = {};
  if (!normalized.completed || typeof normalized.completed !== "object" || Array.isArray(normalized.completed)) normalized.completed = {};
  if (!normalized.progression || typeof normalized.progression !== "object" || Array.isArray(normalized.progression)) normalized.progression = {};
  if (!normalized.exConfig || typeof normalized.exConfig !== "object" || Array.isArray(normalized.exConfig)) normalized.exConfig = {};
  else normalized.exConfig = normalizeExerciseConfig(normalized.exConfig);
  if (typeof normalized.xp !== "number" || Number.isNaN(normalized.xp)) normalized.xp = 0;
  if (typeof normalized.assessmentDone !== "boolean") normalized.assessmentDone = normalized.history.length > 0;
  if (!normalized.customRoutine || typeof normalized.customRoutine !== "object" || Array.isArray(normalized.customRoutine)) normalized.customRoutine = null;
  if (!normalized.userProfile || typeof normalized.userProfile !== "object" || Array.isArray(normalized.userProfile)) normalized.userProfile = null;
  return normalized;
}

export function normalizeExerciseConfig(exConfig = {}) {
  if (!exConfig || typeof exConfig !== "object" || Array.isArray(exConfig)) return {};
  return Object.entries(exConfig).reduce((acc, [key, cfg]) => {
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return acc;
    const stableKey = exerciseConfigKey(key);
    acc[stableKey] = { ...(acc[stableKey] || {}), ...cfg };
    return acc;
  }, {});
}

export const LIFT_LOG_DATA_VERSION = 1;

export function createLiftLogSnapshot(data = {}, meta = {}) {
  return {
    app: "Gym Forged",
    type: "gym-forged-data",
    version: LIFT_LOG_DATA_VERSION,
    createdAt: meta.createdAt || new Date().toISOString(),
    reason: meta.reason || "manual",
    data: normalizeLiftLogData(data),
  };
}

export function normalizeLiftLogSnapshot(payload = {}) {
  const isVersioned = payload && typeof payload === "object" && payload.type === "gym-forged-data" && payload.data;
  const version = isVersioned ? Number(payload.version) || 0 : 0;
  const rawData = isVersioned ? payload.data : payload;
  const warnings = [];

  if (version > LIFT_LOG_DATA_VERSION) {
    warnings.push(`Export version ${version} is newer than this app supports (${LIFT_LOG_DATA_VERSION}).`);
  }
  if (!isVersioned) warnings.push("Legacy unversioned export — data may be incomplete.");

  const data = normalizeLiftLogData(rawData);

  const sessionCount = data.history.length;
  const goalsCount   = data.goals.length;
  const hasProfile   = !!(data.userProfile && typeof data.userProfile === "object");
  const hasSettings  = !!(data.settings && Object.keys(data.settings).length > 0);
  const isEmpty      = sessionCount === 0 && goalsCount === 0 && !hasProfile && data.xp === 0;

  if (isEmpty) warnings.push("No workout history, goals, or profile found in this file.");

  return {
    version,
    createdAt: isVersioned && payload.createdAt ? payload.createdAt : null,
    sessionCount,
    goalsCount,
    hasProfile,
    hasSettings,
    isEmpty,
    warnings,
    data,
  };
}

const ACTIVE_SESSION_DAYS = new Set(["Monday", "Wednesday", "Friday"]);

/**
 * Validates and sanitizes a raw `wt_active_session` value from localStorage.
 * Returns null if the shape is unrecoverable; otherwise returns a clean object.
 */
export function normalizeActiveSession(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (typeof raw.sessionKey !== "string" || !raw.sessionKey) return null;
  if (typeof raw.day !== "string" || !ACTIVE_SESSION_DAYS.has(raw.day)) return null;
  if (typeof raw.workout !== "string" || !raw.workout) return null;

  return {
    version:      typeof raw.version === "number" ? raw.version : 1,
    sessionKey:   raw.sessionKey,
    day:          raw.day,
    workout:      raw.workout,
    updatedAt:    typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
    sessionLogs:  (raw.sessionLogs && typeof raw.sessionLogs === "object" && !Array.isArray(raw.sessionLogs)) ? raw.sessionLogs : {},
    xpAwards:     (raw.xpAwards    && typeof raw.xpAwards    === "object" && !Array.isArray(raw.xpAwards))    ? raw.xpAwards    : {},
    workoutNote:  typeof raw.workoutNote === "string" ? raw.workoutNote : "",
    focusMode:    raw.focusMode === true,
    substitutions:(raw.substitutions && typeof raw.substitutions === "object" && !Array.isArray(raw.substitutions)) ? raw.substitutions : {},
    exerciseOrder: Array.isArray(raw.exerciseOrder) ? raw.exerciseOrder.filter(v => typeof v === "string") : [],
  };
}

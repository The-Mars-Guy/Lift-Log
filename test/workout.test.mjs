/**
 * Workout-flow smoke tests
 *
 * Cover the real user path using only pure functions — no React renderer needed.
 * Flow: session key → log sets → evaluate progression → finish → history entry.
 *
 * Companion tests: session.test.mjs covers normalization/snapshot shapes.
 *                  coach.test.mjs  covers readiness/prescription.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { completionKey, logKey, exerciseVolume, normalizeActiveSession } from "../src/session.js";
import { evaluateProgression, summarizeWorkout } from "../src/coach.js";
import { WORKOUTS, SCHEDULE, DAYS, exerciseConfigKey, exerciseConfigFor } from "../src/data.js";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MONDAY = new Date("2026-05-04T10:00:00"); // known Monday
const SESSION_KEY = completionKey("Monday", MONDAY);

const floorPress = WORKOUTS.A.exercises.find(e => e.name === "Floor Press");
const gobletSquat = WORKOUTS.A.exercises.find(e => e.name === "Goblet Squat");

// ── Session identity ─────────────────────────────────────────────────────────

test("sessionKey encodes the ISO date of the scheduled workout day", () => {
  // Monday May 4 → session is on May 4 → completionKey = "2026-05-04_Monday"
  assert.equal(SESSION_KEY, "2026-05-04_Monday");
});

test("logKey format is sessionKey_exerciseIndex_setIndex", () => {
  assert.equal(logKey(SESSION_KEY, 0, 0), `${SESSION_KEY}_0_0`);
  assert.equal(logKey(SESSION_KEY, 2, 1), `${SESSION_KEY}_2_1`);
});

// ── Set logging data shape ────────────────────────────────────────────────────

test("exerciseVolume sums setLog weight × reps × dumbbells (bilateral = 2)", () => {
  const entry = {
    name: "Floor Press",
    reps: 10, sets: 3,
    setLog: [
      { weight: 20, reps: 10 },
      { weight: 20, reps: 9 },
      { weight: 20, reps: 8 },
    ],
  };
  // Floor Press uses 2 dumbbells: (20×10 + 20×9 + 20×8) × 2 = 540 × 2 = 1080
  assert.equal(exerciseVolume(entry, 20), 1080);
});

test("exerciseVolume falls back to planned reps × sets × fallback weight", () => {
  // No setLog — should use reps * sets * fallbackWeight
  const entry = { name: "Goblet Squat", reps: 12, sets: 3 };
  assert.equal(exerciseVolume(entry, 15), 12 * 3 * 15);
});

// ── Exercise config key stability ─────────────────────────────────────────────

test("exerciseConfigKey is stable for both object and string inputs", () => {
  const byObj = exerciseConfigKey(floorPress);
  const byStr = exerciseConfigKey("Floor Press");
  assert.equal(byObj, byStr);
  assert.equal(byObj, "floor_press");
});

test("exerciseConfigFor returns undefined for unknown exercises", () => {
  const cfg = exerciseConfigFor({}, "Unknown Exercise");
  assert.equal(cfg, undefined);
});

test("exerciseConfigFor returns merged config for known exercise", () => {
  const exConfig = { floor_press: { weight: 25, targetReps: 10 } };
  const cfg = exerciseConfigFor(exConfig, floorPress);
  assert.equal(cfg.weight, 25);
  assert.equal(cfg.targetReps, 10);
});

// ── Progression evaluation ────────────────────────────────────────────────────

test("evaluateProgression recommends increase after clean session", () => {
  const setLog = [
    { weight: 20, reps: 12 },
    { weight: 20, reps: 11 },
    { weight: 20, reps: 12 },
  ];
  // 3 reps above target — clean session
  const rec = evaluateProgression({
    setLog,
    targetReps: 10,
    currentWeight: 20,
    previous: { cleanSessions: 2 },
    increment: 2.5,
    style: "balanced",
  });
  assert.equal(rec.action, "increase");
  assert.equal(rec.nextWeight, 22.5);
});

test("evaluateProgression holds weight after missed reps", () => {
  const setLog = [
    { weight: 20, reps: 7 },
    { weight: 20, reps: 6 },
    { weight: 20, reps: 5 },
  ];
  const rec = evaluateProgression({
    setLog,
    targetReps: 10,
    currentWeight: 20,
    previous: {},
    increment: 2.5,
    style: "balanced",
  });
  // Missed target — should hold or deload, not increase
  assert.ok(rec.action !== "increase", `Expected hold/deload, got ${rec.action}`);
});

test("evaluateProgression deloads after repeated big misses", () => {
  const setLog = [
    { weight: 20, reps: 5 },
    { weight: 20, reps: 4 },
    { weight: 20, reps: 4 },
  ];
  const rec = evaluateProgression({
    setLog,
    targetReps: 10,
    currentWeight: 20,
    previous: { missSessions: 2 },
    increment: 2.5,
    style: "balanced",
    autoDeload: true,
  });
  assert.equal(rec.action, "deload");
  assert.ok(rec.nextWeight < 20, "deload weight should be below current");
});

// ── Finish workout: summarizeWorkout ─────────────────────────────────────────

const COMPLETED_EXERCISES = WORKOUTS.A.exercises.map((ex, i) => ({
  id: ex.id || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  name: ex.name,
  sets: 3,
  reps: ex.baseReps,
  setLog: Array.from({ length: 3 }, () => ({ weight: 20, reps: ex.baseReps })),
}));

test("summarizeWorkout computes sets, reps, and volume", () => {
  const summary = summarizeWorkout({
    exercises: COMPLETED_EXERCISES,
    duration: 2400,
    readiness: { energy: "high" },
    prs: [],
  });

  assert.ok(summary.sets > 0, "should count sets");
  assert.ok(summary.reps > 0, "should count reps");
  assert.ok(summary.volume > 0, "should compute volume");
  assert.equal(summary.duration, 2400);
});

test("summarizeWorkout includes PR list when provided", () => {
  const prs = [{ name: "Floor Press", val: 30 }];
  const summary = summarizeWorkout({
    exercises: COMPLETED_EXERCISES,
    duration: 1800,
    readiness: {},
    prs,
  });
  assert.deepEqual(summary.prs, prs);
});

// ── Full session round-trip ───────────────────────────────────────────────────

test("active session round-trip: write → normalize → verify all fields", () => {
  // Simulates what WorkoutView writes to localStorage after logging sets
  const sessionLogs = {
    [`${SESSION_KEY}_0_0`]: { weight: 20, reps: 10 },
    [`${SESSION_KEY}_0_1`]: { weight: 20, reps: 9 },
    [`${SESSION_KEY}_0_2`]: { weight: 20, reps: 8 },
  };

  const raw = {
    version: 1,
    sessionKey: SESSION_KEY,
    day: "Monday",
    workout: "A",
    updatedAt: MONDAY.getTime(),
    sessionLogs,
    xpAwards: { [`${SESSION_KEY}_0_0`]: true },
    workoutNote: "felt strong",
    focusMode: false,
    substitutions: {},
    exerciseOrder: [],
  };

  const result = normalizeActiveSession(raw);

  assert.ok(result !== null, "should normalize valid session");
  assert.equal(result.sessionKey, SESSION_KEY);
  assert.equal(result.day, "Monday");
  assert.equal(result.workoutNote, "felt strong");
  assert.equal(Object.keys(result.sessionLogs).length, 3);
  assert.equal(result.sessionLogs[`${SESSION_KEY}_0_0`].reps, 10);
});

test("active session: corrupt sessionLogs coerced to empty object", () => {
  const raw = {
    version: 1,
    sessionKey: SESSION_KEY,
    day: "Monday",
    workout: "A",
    sessionLogs: "corrupted",  // should not crash
    xpAwards: null,
    workoutNote: 999,
    focusMode: "yes",
    substitutions: [1, 2],
    exerciseOrder: [null, "Floor Press", 42],
  };
  const result = normalizeActiveSession(raw);
  assert.deepEqual(result.sessionLogs, {});
  assert.deepEqual(result.xpAwards, {});
  assert.equal(result.workoutNote, "");
  assert.equal(result.focusMode, false);
  assert.deepEqual(result.substitutions, {});
  assert.deepEqual(result.exerciseOrder, ["Floor Press"]);
});

// ── Substitution flow ─────────────────────────────────────────────────────────

test("substitution preserved in session and normalizes correctly", () => {
  const raw = {
    version: 1,
    sessionKey: SESSION_KEY,
    day: "Monday",
    workout: "A",
    sessionLogs: {},
    substitutions: { "Floor Press": { name: "Push-Up", reason: "shoulder pain" } },
    exerciseOrder: [],
  };
  const result = normalizeActiveSession(raw);
  assert.equal(result.substitutions["Floor Press"].name, "Push-Up");
  assert.equal(result.substitutions["Floor Press"].reason, "shoulder pain");
});

// ── Schedule integrity ────────────────────────────────────────────────────────

test("SCHEDULE maps every DAYS entry to a valid WORKOUTS key", () => {
  for (const day of DAYS) {
    const wKey = SCHEDULE[day];
    assert.ok(WORKOUTS[wKey], `SCHEDULE["${day}"] = "${wKey}" must exist in WORKOUTS`);
  }
});

test("every workout has at least 3 exercises with baseReps > 0", () => {
  for (const [key, wk] of Object.entries(WORKOUTS)) {
    assert.ok(Array.isArray(wk.exercises), `WORKOUTS.${key}.exercises must be array`);
    assert.ok(wk.exercises.length >= 3, `WORKOUTS.${key} needs ≥3 exercises`);
    for (const ex of wk.exercises) {
      assert.ok(ex.baseReps > 0, `${ex.name} in WORKOUTS.${key} must have baseReps > 0`);
    }
  }
});

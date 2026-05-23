import test from "node:test";
import assert from "node:assert/strict";
import {
  completionKey,
  createLiftLogSnapshot,
  defaultWorkoutDay,
  exerciseVolume,
  normalizeActiveSession,
  normalizeExerciseConfig,
  normalizeLiftLogData,
  normalizeLiftLogSnapshot,
  remainingSeconds,
} from "../src/session.js";
import { BENCHMARK_TESTS_V2, ROUTINE_TEMPLATES, assessmentTargetForProfile, benchmarkModeForProfile, customRoutineWorkout, getExerciseHistory, normalizeCustomRoutine, profileFitnessEstimate, profileRisk, routineBalanceScore, routineCoverage } from "../src/data.js";
import { FULL_EXERCISE_LIBRARY } from "../src/data/exerciseLibrary.js";

test("completionKey includes the scheduled ISO date and weekday", () => {
  const monday = new Date("2026-05-04T12:00:00");
  assert.equal(completionKey("Monday", monday), "2026-05-04_Monday");
  assert.equal(completionKey("Wednesday", monday), "2026-05-06_Wednesday");
});

test("defaultWorkoutDay opens today or the next scheduled workout", () => {
  assert.equal(defaultWorkoutDay(new Date("2026-05-06T08:00:00")), "Wednesday");
  assert.equal(defaultWorkoutDay(new Date("2026-05-07T08:00:00")), "Friday");
  assert.equal(defaultWorkoutDay(new Date("2026-05-09T08:00:00")), "Monday");
});

test("exerciseVolume uses actual set logs when available", () => {
  assert.equal(
    exerciseVolume({
      name: "Floor Press",
      reps: 10,
      sets: 3,
      setLog: [
        { weight: 20, reps: 9 },
        { weight: 20, reps: 8 },
        { weight: 15, reps: 10 },
      ],
    }, 15),
    980
  );
});

test("normalizeLiftLogData repairs old reset/import shapes", () => {
  const normalized = normalizeLiftLogData({
    history: {},
    checkIns: {},
    achievements: null,
    xp: "a lot",
  });

  assert.deepEqual(normalized.history, []);
  assert.deepEqual(normalized.checkIns, []);
  assert.deepEqual(normalized.bodyMetrics, []);
  assert.deepEqual(normalized.goals, []);
  assert.deepEqual(normalized.achievements, []);
  assert.equal(normalized.xp, 0);
  assert.equal(normalized.assessmentDone, false);
});

test("exercise config migrates display-name keys to stable ids", () => {
  const normalized = normalizeLiftLogData({
    exConfig: {
      "Floor Press": { weight: 12, targetReps: 10 },
      floor_press: { maxWeight: 20 },
      "Goblet Squat": { weight: 15 },
    },
  });

  assert.deepEqual(normalized.exConfig.floor_press, { weight: 12, targetReps: 10, maxWeight: 20 });
  assert.deepEqual(normalized.exConfig.goblet_squat, { weight: 15 });
  assert.equal(normalized.exConfig["Floor Press"], undefined);
});

test("normalizeExerciseConfig rejects malformed records", () => {
  assert.deepEqual(normalizeExerciseConfig({ "Floor Press": null, "Goblet Squat": { weight: 15 } }), {
    goblet_squat: { weight: 15 },
  });
});

test("versioned snapshots normalize app data and keep goals", () => {
  const snapshot = createLiftLogSnapshot({
    history: [{ timestamp: 1 }],
    goals: [{ id: "goal_1", type: "sessions", targetValue: 10 }],
    settings: { onboardingDone: true },
  }, { reason: "test", createdAt: "2026-05-22T00:00:00.000Z" });

  assert.equal(snapshot.type, "gym-forged-data");
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.reason, "test");

  const imported = normalizeLiftLogSnapshot(snapshot);
  assert.equal(imported.version, 1);
  assert.deepEqual(imported.data.goals, [{ id: "goal_1", type: "sessions", targetValue: 10 }]);
  assert.equal(imported.data.history.length, 1);
});

test("legacy unversioned exports still import", () => {
  const imported = normalizeLiftLogSnapshot({ history: {}, goals: "bad", xp: "bad" });

  assert.equal(imported.version, 0);
  assert.ok(imported.warnings.some(w => w.toLowerCase().includes("legacy")), "should warn about legacy format");
  assert.deepEqual(imported.data.history, []);
  assert.deepEqual(imported.data.goals, []);
  assert.equal(imported.data.xp, 0);
});

test("remainingSeconds is deadline based", () => {
  assert.equal(remainingSeconds(10_000, 0), 10);
  assert.equal(remainingSeconds(10_000, 9_001), 1);
  assert.equal(remainingSeconds(10_000, 10_500), 0);
});

test("getExerciseHistory includes substituted exercise logs", () => {
  const history = [{
    date: "May 4",
    timestamp: 1,
    exercises: [{
      name: "Push-Up",
      originalName: "Floor Press",
      substitutedFor: "Floor Press",
      setLog: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }],
    }],
  }];

  assert.deepEqual(getExerciseHistory("Floor Press", history), [{
    date: "May 4",
    totalReps: 22,
    avgWeight: 0,
    timestamp: 1,
  }]);
});

test("getExerciseHistory matches stable exercise ids", () => {
  const history = [{ date:"May 5", timestamp:2, exercises:[{ id:"wall_pushup", name:"Wall Push-Up", setLog:[{ reps:8 }, { reps:8 }] }] }];
  assert.equal(getExerciseHistory("Wall Push-Up", history)[0].totalReps, 16);
  assert.equal(getExerciseHistory("wall_pushup", history)[0].totalReps, 16);
});

test("custom routines require push, pull, legs, and core coverage", () => {
  const routine = normalizeCustomRoutine({
    enabled: true,
    exerciseIds: ["box_squat", "wall_pushup", "supported_row", "dead_bug"],
  });
  const workout = customRoutineWorkout(routine);
  const coverage = routineCoverage(workout.exercises);

  assert.equal(workout.exercises.length, 4);
  assert.deepEqual(coverage.map(item => [item.key, item.ok]), [
    ["push", true],
    ["pull", true],
    ["legs", true],
    ["core", true],
  ]);
});

test("profile risk makes benchmark targets more conservative", () => {
  const profile = { age: 70, heightIn: 66, weightLb: 210, trainingExperience: "new" };

  assert.equal(profileRisk(profile).level, "protect");
  assert.equal(benchmarkModeForProfile(profile).key, "submax");
  assert.equal(assessmentTargetForProfile(20, profile), 11);
  assert.equal(assessmentTargetForProfile(20, { age: 30, trainingExperience: "trained" }), 13);
});

test("routine templates normalize into valid balanced routines", () => {
  for (const template of ROUTINE_TEMPLATES) {
    const routine = normalizeCustomRoutine({ exerciseIds: template.exerciseIds });
    const coverage = routineCoverage(customRoutineWorkout(routine).exercises);
    assert.equal(coverage.every(item => item.ok), true, `${template.name} must hit push/pull/legs/core`);
  }
});

test("routine balance score rewards full coverage", () => {
  const routine = normalizeCustomRoutine({ exerciseIds: ["box_squat", "wall_pushup", "supported_row", "dead_bug"] });
  assert.equal(routineBalanceScore(customRoutineWorkout(routine).exercises), 100);
  assert.equal(routineBalanceScore(customRoutineWorkout({ exerciseIds: ["wall_pushup"] }).exercises) < 50, true);
});

test("custom routine schedule picks the planned day routine", () => {
  const routine = normalizeCustomRoutine({
    activeRoutineId:"easy",
    routines:[
      { id:"easy", name:"Easy", exerciseIds:["box_squat", "wall_pushup", "supported_row", "dead_bug"] },
      { id:"bands", name:"Bands", exerciseIds:["sit_to_stand", "band_chest_press", "band_row", "bird_dog"] },
    ],
    schedule:{ Monday:"easy", Wednesday:"bands", Friday:"easy" },
    avoidedExerciseIds:["plank"],
  });

  assert.equal(customRoutineWorkout(routine, "Wednesday").label, "Bands");
  assert.equal(customRoutineWorkout(routine, "Monday").label, "Easy");
  assert.deepEqual(routine.avoidedExerciseIds, ["plank"]);
});

test("extended exercise ids survive core normalization and resolve with full library", () => {
  const extendedId = "3_4_sit_up";
  const routine = normalizeCustomRoutine({
    enabled: true,
    exerciseIds: [extendedId],
    routines: [{ id:"extended", name:"Extended", exerciseIds:[extendedId] }],
    activeRoutineId:"extended",
    schedule:{ Monday:"extended", Wednesday:"extended", Friday:"extended" },
  });

  assert.deepEqual(routine.routines[0].exerciseIds, [extendedId]);
  assert.equal(customRoutineWorkout(routine, "Monday").exercises.length, 0);
  assert.equal(customRoutineWorkout(routine, "Monday", { exerciseLibrary: FULL_EXERCISE_LIBRARY }).exercises[0].id, extendedId);
});

test("profile fitness estimate uses age sex height and weight", () => {
  const estimate = profileFitnessEstimate({ age:40, sex:"female", heightIn:64, weightLb:160 });
  // BMI removed — now uses Boer formula for lean mass
  assert.equal(estimate.bmr > 1200, true);
  assert.equal(estimate.leanMassLb > 0, true);
  // Boer female lean mass for 160lb/5'4" female: ~95lb
  assert.equal(estimate.leanMassLb > 60 && estimate.leanMassLb < 150, true);
  // No bmi or category fields
  assert.equal(estimate.bmi, undefined);
  assert.equal(estimate.category, undefined);
});

test("benchmark v2 includes non rep tests", () => {
  assert.equal(BENCHMARK_TESTS_V2.some(test => test.id === "sit_to_stand_30s"), true);
  assert.equal(BENCHMARK_TESTS_V2.some(test => test.id === "plank_hold"), true);
  assert.equal(BENCHMARK_TESTS_V2.some(test => test.id === "mobility_check"), true);
});

// ── Storage integrity: normalizeLiftLogData ────────────────────────────────

test("normalizeLiftLogData: malformed settings becomes empty object", () => {
  assert.deepEqual(normalizeLiftLogData({ settings: "bad" }).settings, {});
  assert.deepEqual(normalizeLiftLogData({ settings: null  }).settings, {});
  assert.deepEqual(normalizeLiftLogData({ settings: []    }).settings, {});
});

test("normalizeLiftLogData: malformed history/goals/checkIns become empty arrays", () => {
  const out = normalizeLiftLogData({ history: "oops", goals: 42, checkIns: {} });
  assert.deepEqual(out.history,  []);
  assert.deepEqual(out.goals,    []);
  assert.deepEqual(out.checkIns, []);
});

test("normalizeLiftLogData: malformed completed/progression/sets become empty objects", () => {
  const out = normalizeLiftLogData({ completed: [], progression: "x", sets: null });
  assert.deepEqual(out.completed,   {});
  assert.deepEqual(out.progression, {});
  assert.deepEqual(out.sets,        {});
});

test("normalizeLiftLogData: malformed exConfig becomes empty object", () => {
  assert.deepEqual(normalizeLiftLogData({ exConfig: "bad"  }).exConfig, {});
  assert.deepEqual(normalizeLiftLogData({ exConfig: []     }).exConfig, {});
  assert.deepEqual(normalizeLiftLogData({ exConfig: null   }).exConfig, {});
});

test("normalizeLiftLogData: malformed customRoutine becomes null", () => {
  assert.equal(normalizeLiftLogData({ customRoutine: "bad"  }).customRoutine, null);
  assert.equal(normalizeLiftLogData({ customRoutine: []     }).customRoutine, null);
  assert.equal(normalizeLiftLogData({ customRoutine: 42     }).customRoutine, null);
});

test("normalizeLiftLogData: malformed userProfile becomes null", () => {
  assert.equal(normalizeLiftLogData({ userProfile: "bad" }).userProfile, null);
  assert.equal(normalizeLiftLogData({ userProfile: []    }).userProfile, null);
});

test("normalizeLiftLogData: malformed xp becomes 0", () => {
  assert.equal(normalizeLiftLogData({ xp: "many" }).xp, 0);
  assert.equal(normalizeLiftLogData({ xp: NaN    }).xp, 0);
  assert.equal(normalizeLiftLogData({ xp: null   }).xp, 0);
});

// ── Storage integrity: normalizeLiftLogSnapshot metadata ──────────────────

test("normalizeLiftLogSnapshot exposes sessionCount, goalsCount, hasProfile, isEmpty", () => {
  const snap = createLiftLogSnapshot({
    history: [{ timestamp: 1 }, { timestamp: 2 }],
    goals:   [{ id: "g1" }],
    userProfile: { age: 35 },
    settings: { onboardingDone: true },
  }, { createdAt: "2026-01-01T00:00:00.000Z" });

  const result = normalizeLiftLogSnapshot(snap);
  assert.equal(result.sessionCount, 2);
  assert.equal(result.goalsCount,   1);
  assert.equal(result.hasProfile,   true);
  assert.equal(result.hasSettings,  true);
  assert.equal(result.isEmpty,      false);
  assert.equal(result.createdAt,    "2026-01-01T00:00:00.000Z");
});

test("normalizeLiftLogSnapshot flags isEmpty when file contains no useful data", () => {
  const result = normalizeLiftLogSnapshot({ type:"gym-forged-data", version:1, data:{} });
  assert.equal(result.isEmpty, true);
  assert.ok(result.warnings.some(w => w.toLowerCase().includes("no workout")));
});

test("normalizeLiftLogSnapshot warns on newer version", () => {
  const result = normalizeLiftLogSnapshot({ type:"gym-forged-data", version:99, data:{ history:[] } });
  assert.ok(result.warnings.some(w => w.includes("newer than this app supports")));
});

test("normalizeLiftLogSnapshot: legacy export has no createdAt", () => {
  const result = normalizeLiftLogSnapshot({ history: [{ timestamp:1 }] });
  assert.equal(result.createdAt, null);
  assert.equal(result.sessionCount, 1);
});

// ── Storage integrity: normalizeActiveSession ─────────────────────────────

test("normalizeActiveSession accepts valid session shape", () => {
  const raw = {
    version: 1,
    sessionKey: "2026-05-04_Monday",
    day: "Monday",
    workout: "A",
    updatedAt: 1700000000000,
    sessionLogs: { "0_0": { weight: 20, reps: 10 } },
    xpAwards:    { "0_0": true },
    workoutNote: "felt good",
    focusMode:   false,
    substitutions: {},
    exerciseOrder: ["Floor Press"],
  };
  const result = normalizeActiveSession(raw);
  assert.ok(result !== null);
  assert.equal(result.day, "Monday");
  assert.equal(result.workoutNote, "felt good");
  assert.deepEqual(result.exerciseOrder, ["Floor Press"]);
});

test("normalizeActiveSession rejects null / non-object", () => {
  assert.equal(normalizeActiveSession(null),    null);
  assert.equal(normalizeActiveSession("bad"),   null);
  assert.equal(normalizeActiveSession([]),      null);
  assert.equal(normalizeActiveSession(42),      null);
});

test("normalizeActiveSession rejects missing sessionKey", () => {
  assert.equal(normalizeActiveSession({ day:"Monday", workout:"A" }), null);
});

test("normalizeActiveSession rejects invalid day", () => {
  assert.equal(normalizeActiveSession({ sessionKey:"k", day:"Saturday", workout:"A" }), null);
  assert.equal(normalizeActiveSession({ sessionKey:"k", day:null,       workout:"A" }), null);
});

test("normalizeActiveSession sanitizes bad sub-fields to safe defaults", () => {
  const raw = {
    sessionKey: "2026-05-04_Monday",
    day: "Monday",
    workout: "A",
    sessionLogs:  "bad",
    xpAwards:     null,
    workoutNote:  42,
    focusMode:    "yes",
    substitutions: [],
    exerciseOrder: [1, "Floor Press", null],
  };
  const result = normalizeActiveSession(raw);
  assert.deepEqual(result.sessionLogs,   {});
  assert.deepEqual(result.xpAwards,      {});
  assert.equal(result.workoutNote,       "");
  assert.equal(result.focusMode,         false);
  assert.deepEqual(result.substitutions, {});
  // non-string entries filtered from exerciseOrder
  assert.deepEqual(result.exerciseOrder, ["Floor Press"]);
});

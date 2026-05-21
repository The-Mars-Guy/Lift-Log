import test from "node:test";
import assert from "node:assert/strict";
import {
  completionKey,
  defaultWorkoutDay,
  exerciseVolume,
  normalizeLiftLogData,
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
  assert.deepEqual(normalized.achievements, []);
  assert.equal(normalized.xp, 0);
  assert.equal(normalized.assessmentDone, false);
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

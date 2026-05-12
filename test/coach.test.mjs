import test from "node:test";
import assert from "node:assert/strict";
import { behaviorMemory, bestEstimated1RM, buildCoachMemory, buildCoachPlan, buildWeeklyReview, coachSetCount, coachTargetReps, evaluateProgression, exerciseFeedbackSignal, exerciseTrend, readinessScore, sciencePrescription, SUBSTITUTIONS, suggestSubstitutions, summarizeWorkout, tempoPrescription, variationPrescription, weeklyMuscleCoverage } from "../src/coach.js";

const exercise = { name: "Floor Press", sets: 3, baseReps: 10 };

test("readinessScore rewards high energy and fresh body", () => {
  assert.equal(readinessScore({ energy: "high", soreness: "none", time: "full" }), 3);
  assert.equal(readinessScore({ energy: "low", soreness: "sore", time: "short" }), -3);
});

test("exerciseTrend flags repeated misses as stalling", () => {
  const history = [
    { timestamp: 3, exercises: [{ name: "Floor Press", sets: 3, setLog: [{ reps: 10 }, { reps: 7 }, { reps: 6 }] }] },
    { timestamp: 2, exercises: [{ name: "Floor Press", sets: 3, setLog: [{ reps: 9 }, { reps: 8 }, { reps: 7 }] }] },
  ];

  assert.equal(exerciseTrend(history, exercise, 10).status, "stalling");
});

test("buildCoachPlan adapts headline to readiness", () => {
  const workout = { exercises: [exercise] };
  const high = buildCoachPlan({
    workout,
    history: [],
    exConfig: {},
    settings: {},
    readiness: { energy: "high", soreness: "none", time: "full" },
  });
  const low = buildCoachPlan({
    workout,
    history: [],
    exConfig: {},
    settings: {},
    readiness: { energy: "low", soreness: "sore", time: "short" },
  });

  assert.equal(high.headline, "Attack the work");
  assert.equal(low.headline, "Train, don't drain");
  assert.ok(low.adjustments.some(item => item.includes("Short session")));
});

test("coach adjustments reduce reps and sets on recovery or short days", () => {
  assert.equal(coachTargetReps(10, { energy: "low", soreness: "sore", time: "normal" }), 8);
  assert.equal(coachTargetReps(10, { energy: "high", soreness: "none", time: "full" }), 10);
  assert.equal(coachSetCount(3, { energy: "okay", soreness: "mild", time: "short" }), 2);
});

test("sciencePrescription uses estimated 1RM for strength when load is available", () => {
  const history = [{ timestamp: 1, exercises: [{ name: "Floor Press", setLog: [{ weight: 50, reps: 6 }] }] }];
  const prescription = sciencePrescription({
    exercise,
    history,
    baseTarget: 10,
    settings: { scienceCoach: true, trainingGoal: "strength", equipmentProfile: "gym_access" },
    readiness: { energy: "high", soreness: "none", time: "full" },
  });

  assert.equal(bestEstimated1RM(history, "Floor Press"), 60);
  assert.equal(prescription.enabled, true);
  assert.equal(prescription.label, "Strength");
  assert.equal(prescription.targetReps, 5);
  assert.equal(prescription.suggestedWeight, 47);
});

test("sciencePrescription uses reps and sets when fixed weights limit loading", () => {
  const prescription = sciencePrescription({
    exercise,
    history: [],
    baseTarget: 10,
    settings: { scienceCoach: true, trainingGoal: "hypertrophy", equipmentProfile: "fixed_dumbbells" },
    readiness: { energy: "okay", soreness: "mild", time: "normal" },
  });

  assert.equal(prescription.label, "Volume");
  assert.equal(prescription.targetReps, 12);
  assert.deepEqual(prescription.repRange, { min: 12, max: 20 });
  assert.equal(prescription.tempo.code, "3-1-1");
  assert.equal(prescription.variation.name, "Dumbbell Floor Press");
  assert.equal(prescription.sets, 4);
  assert.equal(prescription.suggestedWeight, null);
});

test("tempo and variation progress fixed dumbbells before chasing load", () => {
  const tempo = tempoPrescription({ goal: "hypertrophy", fixedLoad: true, feedbackStatus: "easy", trendStatus: "ready" });
  const variation = variationPrescription({ exerciseName: "Floor Press", fixedLoad: true, targetReps: 20, feedbackStatus: "easy", trendStatus: "ready" });

  assert.equal(tempo.code, "4-1-1");
  assert.equal(variation.name, "Slow Eccentric Floor Press");
  assert.equal(variation.next.name, "Feet-Elevated Push-Up");
});

test("sciencePrescription reacts to pain and hard feedback", () => {
  const history = [{ timestamp: Date.now(), exercises: [{ name: "Floor Press", setLog: [{ weight: 40, reps: 8 }] }] }];
  const pain = sciencePrescription({
    exercise,
    history,
    checkIns: [{ kind: "set_feedback", exercise: "Floor Press", feeling: "pain", timestamp: Date.now() }],
    baseTarget: 10,
    settings: { scienceCoach: true, trainingGoal: "strength", equipmentProfile: "gym_access" },
    readiness: { energy: "okay", soreness: "mild", time: "normal" },
  });
  const hard = exerciseFeedbackSignal([
    { kind: "set_feedback", exercise: "Floor Press", feeling: "hard", timestamp: 2 },
    { kind: "set_feedback", exercise: "Floor Press", feeling: "hard", timestamp: 1 },
  ], "Floor Press");

  assert.equal(hard.status, "hard");
  assert.equal(pain.label, "Protect");
  assert.equal(pain.sets, 2);
  assert.ok(pain.note.includes("Pain"));
});

test("behaviorMemory learns from rest and logging habits", () => {
  const memory = behaviorMemory([
    { kind: "rest", action: "skip", plannedSeconds: 60, elapsedSeconds: 18 },
    { kind: "rest", action: "skip", plannedSeconds: 60, elapsedSeconds: 20 },
    { kind: "rest", action: "complete", plannedSeconds: 60, elapsedSeconds: 60 },
    { kind: "set_log", action: "skip" },
    { kind: "set_log", action: "save" },
  ]);

  assert.equal(memory.restSkips, 2);
  assert.ok(memory.restSkipRate > 0.5);
  assert.equal(memory.skippedLogs, 1);
  assert.ok(memory.notes.length > 0);
});

test("summarizeWorkout totals logged work and creates a coach note", () => {
  const summary = summarizeWorkout({
    duration: 300,
    readiness: { energy: "okay", soreness: "mild", time: "normal" },
    exercises: [{
      name: "Floor Press",
      sets: 2,
      reps: 10,
      setLog: [{ weight: 15, reps: 10 }, { weight: 15, reps: 9 }],
    }],
  });

  assert.equal(summary.sets, 2);
  assert.equal(summary.reps, 19);
  assert.equal(summary.volume, 570);
  assert.equal(summary.bestSet.name, "Floor Press");
  assert.equal(summary.nextChange.length > 0, true);
  assert.ok(summary.coachNote.length > 0);
  assert.ok(summary.reasoning.some(item => item.includes("Readiness")));
});

test("buildCoachMemory exposes learned readiness and exercise trends", () => {
  const memory = buildCoachMemory({
    exercises: [exercise],
    exConfig: {},
    checkIns: [
      { kind: "readiness", readiness: { energy: "low" } },
      { kind: "readiness", readiness: { energy: "low" } },
      { kind: "readiness", readiness: { energy: "high" } },
    ],
    history: [
      { timestamp: 2, exercises: [{ name: "Floor Press", sets: 3, setLog: [{ weight: 20, reps: 8 }, { weight: 20, reps: 7 }] }] },
      { timestamp: 1, exercises: [{ name: "Floor Press", sets: 3, setLog: [{ weight: 20, reps: 9 }, { weight: 20, reps: 8 }] }] },
    ],
  });

  assert.equal(memory.commonEnergy, "low");
  assert.equal(memory.focus, "Floor Press");
  assert.equal(memory.stalling.length, 1);
});

test("evaluateProgression requires two clean sessions before increasing", () => {
  const first = evaluateProgression({
    setLog: [{ reps: 10 }, { reps: 10 }],
    targetReps: 10,
    currentWeight: 15,
    previous: {},
  });
  const second = evaluateProgression({
    setLog: [{ reps: 10 }, { reps: 10 }],
    targetReps: 10,
    currentWeight: 15,
    previous: first,
  });

  assert.equal(first.action, "maintain");
  assert.equal(second.action, "increase");
  assert.equal(second.nextWeight, 17.5);
});

test("evaluateProgression respects coach style and deload settings", () => {
  const aggressive = evaluateProgression({
    setLog: [{ reps: 10 }, { reps: 10 }],
    targetReps: 10,
    currentWeight: 15,
    style: "aggressive",
  });
  const noDeload = evaluateProgression({
    setLog: [{ reps: 4 }, { reps: 5 }],
    targetReps: 10,
    currentWeight: 15,
    previous: { missSessions: 1 },
    autoDeload: false,
  });

  assert.equal(aggressive.action, "increase");
  assert.equal(noDeload.action, "maintain");
  assert.equal(noDeload.missSessions, 2);
});

test("buildWeeklyReview summarizes recent work", () => {
  const now = Date.now();
  const review = buildWeeklyReview({
    checkIns: [{ kind: "readiness", timestamp: now, readiness: { energy: "low" } }],
    history: [{
      timestamp: now,
      exercises: [{ name: "Floor Press", setLog: [{ weight: 15, reps: 10 }] }],
    }],
  });

  assert.equal(review.sessions, 1);
  assert.equal(review.volume, 300);
  assert.equal(review.best.name, "Floor Press");
});

test("weeklyMuscleCoverage reports planned and completed muscle work", () => {
  const workouts = {
    A: { exercises: [{ name: "Floor Press", primary: ["chest"], secondary: ["triceps"] }] },
  };
  const coverage = weeklyMuscleCoverage({
    workouts,
    schedule: { Monday: "A" },
    completed: { "monday": true },
    completionKeyFn: day => day.toLowerCase(),
  });

  assert.equal(coverage.chest.planned, 1);
  assert.equal(coverage.chest.done, 1);
  assert.equal(coverage.triceps.planned, 0.5);
  assert.equal(coverage.triceps.done, 0.5);
});

test("substitution coverage includes every programmed movement", async () => {
  const { WORKOUTS } = await import("../src/data.js");
  const allExercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises].map(ex => ex.name);
  for (const name of allExercises) {
    assert.ok(SUBSTITUTIONS[name]?.length >= 2, `${name} needs same-area alternatives`);
  }
});

test("joint cautions bias same-area substitutions", () => {
  const swaps = suggestSubstitutions({
    workout: { exercises: [{ name: "Goblet Squat", sets: 3, baseReps: 10 }] },
    settings: { cautiousJoints: ["knees"] },
  });

  assert.equal(swaps[0].exercise, "Goblet Squat");
  assert.equal(swaps[0].substitute, "Box Goblet Squat");
  assert.ok(swaps[0].reason.includes("Knee caution"));
});

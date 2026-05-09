import test from "node:test";
import assert from "node:assert/strict";
import { buildCoachPlan, coachSetCount, coachTargetReps, exerciseTrend, readinessScore, summarizeWorkout } from "../src/coach.js";

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
  assert.ok(summary.coachNote.length > 0);
});

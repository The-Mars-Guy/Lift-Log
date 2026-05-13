import test from "node:test";
import assert from "node:assert/strict";
import {
  completionKey,
  defaultWorkoutDay,
  exerciseVolume,
  normalizeLiftLogData,
  remainingSeconds,
} from "../src/session.js";

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

import test from "node:test";
import assert from "node:assert/strict";
import { makeGoal, goalProgress } from "../src/data.js";

// ─── makeGoal ────────────────────────────────────────────────────────────────

test("makeGoal returns valid goal shape", () => {
  const g = makeGoal({ exerciseName:"Floor Press", type:"weight", targetValue:50, note:"bench goal" });
  assert.equal(typeof g.id, "string");
  assert.ok(g.id.startsWith("goal_"));
  assert.equal(g.exerciseName, "Floor Press");
  assert.equal(g.type, "weight");
  assert.equal(g.targetValue, 50);
  assert.equal(g.note, "bench goal");
  assert.equal(g.achieved, false);
  assert.equal(g.achievedAt, null);
  assert.ok(typeof g.createdAt === "number" && g.createdAt > 0);
});

test("makeGoal coerces targetValue to number", () => {
  const g = makeGoal({ type:"reps", targetValue:"20" });
  assert.equal(g.targetValue, 20);
  assert.equal(typeof g.targetValue, "number");
});

test("makeGoal sets empty defaults", () => {
  const g = makeGoal();
  assert.equal(g.exerciseName, "");
  assert.equal(g.type, "weight");
  assert.equal(g.targetValue, 0);
  assert.equal(g.targetDate, "");
  assert.equal(g.note, "");
});

// ─── goalProgress — weight type ───────────────────────────────────────────────

test("goalProgress weight reads latest set log weight", () => {
  const goal = makeGoal({ exerciseName:"Floor Press", type:"weight", targetValue:50 });
  // _currentGoalValue iterates from history[length-1] → 0, so newest must be last
  const history = [
    { timestamp:1000, exercises:[{ name:"Floor Press", setLog:[{ weight:20, reps:12 }] }] },
    { timestamp:2000, exercises:[{ name:"Floor Press", setLog:[{ weight:30, reps:10 },{ weight:35, reps:8 }] }] },
  ];
  const prog = goalProgress(goal, history, {}, 0);
  assert.equal(prog.current, 35);               // max of latest session's set log
  assert.ok(prog.pct > 0 && prog.pct < 1);
  assert.equal(prog.achieved, false);
});

test("goalProgress weight marks achieved when current >= target", () => {
  const goal = makeGoal({ exerciseName:"Floor Press", type:"weight", targetValue:30 });
  const history = [
    { timestamp:1000, exercises:[{ name:"Floor Press", setLog:[{ weight:32, reps:8 }] }] }, // newest = last
  ];
  const prog = goalProgress(goal, history, {}, 0);
  assert.equal(prog.current, 32);
  assert.equal(prog.pct, 1);
  assert.equal(prog.achieved, true);
});

// ─── goalProgress — reps type ─────────────────────────────────────────────────

test("goalProgress reps reads from exConfig targetReps", () => {
  const goal = makeGoal({ exerciseName:"Goblet Squat", type:"reps", targetValue:15 });
  const exConfig = { "Goblet Squat": { targetReps: 12 } };
  const prog = goalProgress(goal, [], exConfig, 0);
  assert.equal(prog.current, 12);
  assert.ok(prog.pct < 1);
});

test("goalProgress reps returns 0 when no exConfig entry", () => {
  const goal = makeGoal({ exerciseName:"Goblet Squat", type:"reps", targetValue:15 });
  const prog = goalProgress(goal, [], {}, 0);
  assert.equal(prog.current, 0);
  assert.equal(prog.pct, 0);
});

// ─── goalProgress — sessions type ────────────────────────────────────────────

test("goalProgress sessions uses totalSessions", () => {
  const goal = makeGoal({ type:"sessions", targetValue:10 });
  const prog = goalProgress(goal, [], {}, 7);
  assert.equal(prog.current, 7);
  assert.equal(prog.pct, 0.7);
  assert.equal(prog.achieved, false);
});

test("goalProgress sessions achieved at 100%", () => {
  const goal = makeGoal({ type:"sessions", targetValue:10 });
  const prog = goalProgress(goal, [], {}, 10);
  assert.equal(prog.pct, 1);
  assert.equal(prog.achieved, true);
});

// ─── goalProgress — pace / on-track ──────────────────────────────────────────

test("goalProgress computes daysLeft from targetDate", () => {
  const future = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const goal = makeGoal({ type:"sessions", targetValue:20, targetDate:future });
  const prog = goalProgress(goal, [], {}, 5);
  assert.ok(prog.daysLeft >= 13 && prog.daysLeft <= 15);
});

test("goalProgress onTrack is true when no target date", () => {
  const goal = makeGoal({ type:"sessions", targetValue:10 });
  const prog = goalProgress(goal, [], {}, 3);
  assert.equal(prog.onTrack, true);   // no deadline → always on track
});

test("goalProgress pct never exceeds 1", () => {
  const goal = makeGoal({ type:"sessions", targetValue:5 });
  const prog = goalProgress(goal, [], {}, 99);
  assert.equal(prog.pct, 1);
});

// ─── goal already achieved flag ───────────────────────────────────────────────

test("goalProgress respects pre-set achieved flag", () => {
  const goal = { ...makeGoal({ type:"sessions", targetValue:50 }), achieved:true };
  const prog = goalProgress(goal, [], {}, 1);   // current = 1, but flag is set
  assert.equal(prog.achieved, true);
});

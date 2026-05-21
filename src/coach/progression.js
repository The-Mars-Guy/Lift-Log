import { cleanAvailableWeights, snapWeight } from "../data.js";

export const READINESS = {
  energy: {
    low: { label: "Low", score: -1 },
    okay: { label: "Okay", score: 0 },
    high: { label: "High", score: 1 },
  },
  soreness: {
    none: { label: "Fresh", score: 1 },
    mild: { label: "Mild", score: 0 },
    sore: { label: "Sore", score: -1 },
  },
  time: {
    short: { label: "Short", score: -1 },
    normal: { label: "Normal", score: 0 },
    full: { label: "Full", score: 1 },
  },
};

export const DEFAULT_READINESS = { energy: "okay", soreness: "mild", time: "normal" };

export const EQUIPMENT_PROFILES = {
  fixed_dumbbells: {
    label: "Fixed Dumbbells",
    canLoad: false,
    desc: "Best when you only have a few dumbbells. The coach progresses reps, sets, tempo, and cleanliness before asking for more load.",
  },
  adjustable_dumbbells: {
    label: "Adjustable Dumbbells",
    canLoad: true,
    desc: "Use this when you can make small load jumps. The coach can prescribe percentage-based weights from your estimated 1RM.",
  },
  gym_access: {
    label: "Gym / Barbell Access",
    canLoad: true,
    desc: "Use this when load choice is broad. The coach can bias heavier strength work or controlled volume blocks.",
  },
};

export const TRAINING_GOALS = {
  general: {
    label: "General Fitness",
    desc: "Balanced work: moderate reps, steady progression, and enough volume to build skill, muscle, and consistency.",
  },
  strength: {
    label: "Strength",
    desc: "Prioritizes heavier sets and lower reps when your equipment and history support it.",
  },
  hypertrophy: {
    label: "Muscle / Volume",
    desc: "Prioritizes more hard sets and moderate-to-high reps to build useful training volume.",
  },
  fatigue_friendly: {
    label: "Fatigue Friendly",
    desc: "Keeps total work lower and leaves more reps in reserve when recovery matters most.",
  },
};

export const JOINT_AREAS = {
  knees: { label:"Knees", exercises:["Goblet Squat","Reverse Lunge"], note:"Knee caution: favor controlled depth, supported ranges, and glute-biased swaps." },
  shoulders: { label:"Shoulders", exercises:["Arnold Press","Floor Press","Rear Delt Row"], note:"Shoulder caution: avoid forcing overhead work and prefer pain-free pressing angles." },
  wrists: { label:"Wrists", exercises:["Floor Press","Push-Up","Hammer Curl","Tricep Kickback"], note:"Wrist caution: prefer neutral grips and stable dumbbell positions." },
  back: { label:"Back", exercises:["Romanian Deadlift","Bent Over Row","Goblet Squat","Crunch"], note:"Back caution: reduce hinge fatigue and favor supported rows or bridges when needed." },
};

export const SUBSTITUTIONS = {
  "Goblet Squat": [
    { name: "Box Goblet Squat", reason: "same squat pattern with a controlled depth target for knees and hips" },
    { name: "Glute Bridge", reason: "lower knee stress while still training glutes and legs" },
    { name: "Reverse Lunge", reason: "single-leg lower-body work if squats feel awkward today" },
  ],
  "Floor Press": [
    { name: "Push-Up", reason: "same chest and triceps pattern without dumbbells on the wrists" },
    { name: "Close-Grip Floor Press", reason: "more triceps focus with a stable shoulder position" },
    { name: "Dumbbell Squeeze Press", reason: "chest work with lighter joint stress and constant tension" },
  ],
  "Bent Over Row": [
    { name: "One-Arm Dumbbell Row", reason: "same back muscles with more support for the lower back" },
    { name: "Chest-Supported Row", reason: "upper-back work with less hip hinge fatigue" },
    { name: "Suitcase Row", reason: "controlled pulling if both-dumbbell rows feel unstable" },
  ],
  "Arnold Press": [
    { name: "Lateral Raise", reason: "shoulder-friendly pressing alternative" },
    { name: "Front Raise", reason: "lighter front-delt work with less overhead demand" },
    { name: "Seated Shoulder Press", reason: "more stable pressing if balance is the limiter" },
  ],
  "Hammer Curl": [
    { name: "Alternating Hammer Curl", reason: "same biceps and forearms with less total fatigue per rep" },
    { name: "Cross-Body Hammer Curl", reason: "same muscles with a comfortable shoulder position" },
    { name: "Concentration Curl", reason: "stricter biceps work if swinging or elbow stress shows up" },
  ],
  "Reverse Lunge": [
    { name: "Glute Bridge", reason: "lower knee stress while keeping glutes working" },
    { name: "Split Squat Hold", reason: "controlled quad work with less stepping" },
    { name: "Goblet Squat", reason: "simpler lower-body pattern when coordination is off" },
  ],
  "Romanian Deadlift": [
    { name: "Hip Thrust", reason: "less lower-back demand today" },
    { name: "Glute Bridge", reason: "easy hinge substitute if hamstrings feel tight" },
    { name: "Suitcase Deadlift", reason: "shorter range hinge with more control" },
  ],
  "Rear Delt Row": [
    { name: "Rear Delt Fly", reason: "lighter upper-back isolation" },
    { name: "Bent Over Row", reason: "more stable pulling pattern" },
    { name: "Prone Rear Delt Raise", reason: "stricter rear-delt work with less momentum" },
  ],
  "Tricep Kickback": [
    { name: "Close-Grip Floor Press", reason: "more stable triceps work" },
    { name: "Overhead Triceps Extension", reason: "long-head triceps focus" },
    { name: "Diamond Push-Up", reason: "bodyweight triceps option if dumbbells feel awkward" },
  ],
  "Calf Raise": [
    { name: "Seated Calf Raise", reason: "same calves with less balance demand" },
    { name: "Supported Calf Raise", reason: "same movement while holding a wall or chair for stability" },
    { name: "Single-Leg Calf Raise", reason: "harder calf work with bodyweight if dumbbells feel awkward" },
  ],
  "Crunch": [
    { name: "Dead Bug", reason: "same core focus with more back-friendly control" },
    { name: "Heel Tap", reason: "simple ab work with a smaller range of motion" },
    { name: "Plank", reason: "core bracing without repeated spinal flexion" },
  ],
};

export const VARIATION_LADDERS = {
  "Goblet Squat": [
    { level:1, name:"Goblet Squat", cue:"full range, controlled bottom" },
    { level:2, name:"1.5-Rep Goblet Squat", cue:"go down, halfway up, down again, then stand" },
    { level:3, name:"Bulgarian Split Squat", cue:"single-leg bias makes 15s feel heavy fast" },
  ],
  "Floor Press": [
    { level:1, name:"Dumbbell Floor Press", cue:"pause each rep on the floor" },
    { level:2, name:"Slow Eccentric Floor Press", cue:"3 seconds down, hard pause, drive up" },
    { level:3, name:"Feet-Elevated Push-Up", cue:"use bodyweight if 15s are too easy" },
  ],
  "Bent Over Row": [
    { level:1, name:"Bent Over Row", cue:"pull elbow toward back pocket" },
    { level:2, name:"Paused Bent Over Row", cue:"hold 1 second at the top" },
    { level:3, name:"Single-Arm Row", cue:"brace and use a longer range of motion" },
  ],
  "Arnold Press": [
    { level:1, name:"Arnold Press", cue:"smooth rotation, no leg drive" },
    { level:2, name:"Slow Arnold Press", cue:"3 seconds down with strict control" },
    { level:3, name:"Lateral Raise", cue:"lighter-feeling load, harder side-delt leverage" },
  ],
  "Hammer Curl": [
    { level:1, name:"Hammer Curl", cue:"neutral grip, elbows still" },
    { level:2, name:"Slow Hammer Curl", cue:"3-4 seconds down every rep" },
    { level:3, name:"Cross-Body Hammer Curl", cue:"squeeze hard and avoid swinging" },
  ],
  "Romanian Deadlift": [
    { level:1, name:"Romanian Deadlift", cue:"hips back, soft knees" },
    { level:2, name:"Paused Romanian Deadlift", cue:"pause in the stretched position" },
    { level:3, name:"Single-Leg Romanian Deadlift", cue:"single-leg hinge for more challenge" },
  ],
  "Reverse Lunge": [
    { level:1, name:"Reverse Lunge", cue:"front shin vertical" },
    { level:2, name:"Slow Reverse Lunge", cue:"3 seconds down, light knee tap" },
    { level:3, name:"Bulgarian Split Squat", cue:"harder range and single-leg load" },
  ],
  "Rear Delt Row": [
    { level:1, name:"Rear Delt Row", cue:"elbows wide" },
    { level:2, name:"Paused Rear Delt Row", cue:"hold the top position" },
    { level:3, name:"Rear Delt Fly", cue:"longer lever for rear delts" },
  ],
  "Tricep Kickback": [
    { level:1, name:"Tricep Kickback", cue:"upper arm fixed" },
    { level:2, name:"Paused Kickback", cue:"squeeze 1 second at lockout" },
    { level:3, name:"Close-Grip Push-Up", cue:"bodyweight triceps overload" },
  ],
  "Calf Raise": [
    { level:1, name:"Calf Raise", cue:"full stretch and full lockout" },
    { level:2, name:"Paused Calf Raise", cue:"2 seconds at the top and bottom" },
    { level:3, name:"Single-Leg Calf Raise", cue:"one leg at a time" },
  ],
  "Crunch": [
    { level:1, name:"Crunch", cue:"curl ribs toward hips, no neck pulling" },
    { level:2, name:"Paused Crunch", cue:"hold the top for 1 second each rep" },
    { level:3, name:"Reverse Crunch", cue:"control the pelvis and avoid swinging" },
  ],
};

export function readinessScore(readiness = DEFAULT_READINESS) {
  return (READINESS.energy[readiness.energy]?.score || 0)
    + (READINESS.soreness[readiness.soreness]?.score || 0)
    + (READINESS.time[readiness.time]?.score || 0);
}

export function readinessLabel(readiness = DEFAULT_READINESS) {
  return [
    READINESS.energy[readiness.energy]?.label || "Okay",
    READINESS.soreness[readiness.soreness]?.label || "Mild",
    READINESS.time[readiness.time]?.label || "Normal",
  ].join(" / ");
}

export function estimated1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return null;
  return Math.round(weight * (1 + reps / 30));
}

export function bestEstimated1RM(history = [], exerciseName, exConfig = {}) {
  const estimates = history.flatMap(h => h.exercises || [])
    .filter(ex => ex.name === exerciseName || ex.originalName === exerciseName || ex.substitutedFor === exerciseName)
    .flatMap(ex => ex.setLog || [])
    .map(log => estimated1RM(log.weight, log.reps))
    .filter(Boolean);
  if (estimates.length >= 2) return Math.max(...estimates);
  // Seed from onboarding assessment when history is sparse
  const cfg = exConfig[exerciseName];
  const assessed1RM = cfg?.maxRepsTest && cfg?.weight
    ? estimated1RM(cfg.weight, cfg.maxRepsTest)
    : null;
  if (assessed1RM && estimates.length) return Math.max(...estimates, assessed1RM);
  if (assessed1RM) return assessed1RM;
  return estimates.length ? estimates[0] : null;
}

export function exerciseFeedbackSignal(checkIns = [], exerciseName) {
  const recent = [...checkIns]
    .filter(ci => ci.kind === "set_feedback" && (ci.exercise === exerciseName || ci.originalName === exerciseName))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);
  const pain = recent.filter(ci => ci.feeling === "pain").length;
  const hard = recent.filter(ci => ci.feeling === "hard").length;
  const easy = recent.filter(ci => ci.feeling === "easy").length;
  if (pain) return { status:"pain", pain, hard, easy, note:"Recent discomfort flag. The coach should reduce stress or suggest a swap." };
  if (hard >= 2) return { status:"hard", pain, hard, easy, note:"Repeated hard sets. Hold load steady until reps are cleaner." };
  if (easy >= 2) return { status:"easy", pain, hard, easy, note:"Repeated easy sets. This movement can tolerate a small progression." };
  return { status:"neutral", pain, hard, easy, note:null };
}

export function recentTrainingLoad(history = [], now = Date.now()) {
  const weekMs = 7 * 86400000;
  const recent = history.filter(h => now - h.timestamp <= weekMs);
  const last = [...history].sort((a, b) => b.timestamp - a.timestamp)[0];
  const lastDaysAgo = last ? Math.round((now - last.timestamp) / 86400000) : null;
  const volume = recent.reduce((sum, h) => sum + (h.exercises || []).reduce((s, ex) => {
    const dumbbells = ex.name === "Goblet Squat" ? 1 : 2;
    return s + (ex.setLog || []).reduce((setSum, log) => setSum + ((log.reps || 0) * (log.weight || 0) * dumbbells), 0);
  }, 0), 0);
  const status = recent.length >= 4 ? "high" : recent.length >= 2 ? "normal" : "low";
  return { sessions: recent.length, volume, lastDaysAgo, status };
}

export function behaviorMemory(checkIns = []) {
  const restEvents = checkIns.filter(ci => ci.kind === "rest");
  const logEvents = checkIns.filter(ci => ci.kind === "set_log");
  const skips = restEvents.filter(ci => ci.action === "skip").length;
  const completes = restEvents.filter(ci => ci.action === "complete").length;
  const totalRest = skips + completes;
  const avgRestSeconds = restEvents
    .filter(ci => ci.action === "complete" || ci.action === "skip")
    .reduce((acc, ci, _, arr) => acc + ((ci.elapsedSeconds || ci.plannedSeconds || 0) / Math.max(arr.length, 1)), 0);
  const skippedLogs = logEvents.filter(ci => ci.action === "skip").length;
  const savedLogs = logEvents.filter(ci => ci.action === "save").length;
  const restSkipRate = totalRest ? skips / totalRest : 0;
  const logSkipRate = (skippedLogs + savedLogs) ? skippedLogs / (skippedLogs + savedLogs) : 0;
  const notes = [];
  if (restSkipRate >= 0.5 && totalRest >= 3) notes.push("You skip rests often, so the coach will watch for fatigue and set drop-off.");
  if (avgRestSeconds && avgRestSeconds < 40) notes.push("Average rest is short. Strength work may need longer breaks.");
  if (logSkipRate >= 0.4) notes.push("Set logging is often skipped, so recommendations are less precise.");
  return { restEvents: totalRest, restSkips: skips, restCompletes: completes, restSkipRate, avgRestSeconds: Math.round(avgRestSeconds || 0), skippedLogs, savedLogs, logSkipRate, notes };
}

export function repRangeFor({ goal = "general", fixedLoad = false, baseTarget = 10, score = 0 }) {
  if (goal === "strength" && !fixedLoad) return { min:4, max:6 };
  if (goal === "strength" && fixedLoad) return { min:6, max:10 };
  if (goal === "fatigue_friendly") return { min:Math.max(6, baseTarget - 2), max:Math.max(10, baseTarget + 1) };
  if (goal === "hypertrophy") return fixedLoad ? { min:12, max:20 } : { min:8, max:15 };
  return score >= 1 ? { min:8, max:15 } : { min:10, max:15 };
}

export function exactRepTarget(targetReps, repRange) {
  const exact = Math.round(Number(targetReps) || 0);
  if (!repRange) return Math.max(3, exact);
  return Math.max(repRange.min, Math.min(repRange.max, exact));
}

export function tempoPrescription({ goal = "general", fixedLoad = false, feedbackStatus = "neutral", trendStatus = "new" }) {
  if (feedbackStatus === "pain") return { code:"2-0-2", label:"smooth pain-free reps", note:"Move evenly and stop if discomfort returns." };
  if (goal === "hypertrophy" && fixedLoad) {
    if (feedbackStatus === "easy" || trendStatus === "ready") return { code:"4-1-1", label:"slow eccentric + pause", note:"Lower for 4 seconds, pause 1 second, then lift." };
    return { code:"3-1-1", label:"controlled hypertrophy tempo", note:"Lower for 3 seconds, pause 1 second, then lift." };
  }
  if (goal === "strength") return { code:"2-1-X", label:"controlled down, fast up", note:"Control the lowering, pause, then drive up hard." };
  return { code:"2-1-2", label:"clean control", note:"Control both directions and own the pause." };
}

export function variationPrescription({ exerciseName, fixedLoad = false, targetReps = 10, feedbackStatus = "neutral", trendStatus = "new" }) {
  const ladder = VARIATION_LADDERS[exerciseName] || [];
  if (!fixedLoad || !ladder.length || feedbackStatus === "pain") return null;
  const level = (feedbackStatus === "easy" || trendStatus === "ready" || targetReps >= 18) ? 2 : 1;
  const next = ladder.find(item => item.level === level) || ladder[0];
  const future = ladder.find(item => item.level === level + 1);
  return {
    ...next,
    next: future || null,
    note: future && level > 1
      ? `If you can hit the top of the range cleanly, progress toward ${future.name}.`
      : `Use ${next.cue}; make 15lbs harder before adding more reps.`,
  };
}

export function sciencePrescription({ exercise, history = [], checkIns = [], settings = {}, readiness = DEFAULT_READINESS, baseTarget = exercise.baseReps, exConfig = {} }) {
  const enabled = settings.scienceCoach === true;
  const goal = settings.trainingGoal || "general";
  const equipment = EQUIPMENT_PROFILES[settings.equipmentProfile || "fixed_dumbbells"] || EQUIPMENT_PROFILES.fixed_dumbbells;
  const fixedLoad = !equipment.canLoad;
  const score = readinessScore(readiness);
  const exerciseName = exercise.configName || exercise.originalName || exercise.name;
  const est1RM = bestEstimated1RM(history, exerciseName, exConfig);
  const trend = exerciseTrend(history, { ...exercise, name: exerciseName }, baseTarget);
  const feedback = exerciseFeedbackSignal(checkIns, exerciseName);
  const workoutFeedback = [...checkIns].filter(ci => ci.kind === "workout_feedback").sort((a,b)=>(b.timestamp||0)-(a.timestamp||0))[0];
  const load = recentTrainingLoad(history);
  const deload = recommendDeload({ history, checkIns });
  const behavior = behaviorMemory(checkIns);
  if (!enabled) {
    return { enabled:false, targetReps:baseTarget, sets:exercise.sets, est1RM:null, suggestedWeight:null, label:"Standard", note:null };
  }

  const canLoad = equipment.canLoad && est1RM;
  const repRange = repRangeFor({ goal, fixedLoad, baseTarget, score });
  let tempo = null;
  let variation = null;
  let targetReps = baseTarget;
  let sets = exercise.sets;
  let pct = null;
  let label = "Science";
  let note = "Progressive overload with logged reps, load, and readiness.";

  if (goal === "strength" && canLoad) {
    targetReps = score <= -1 ? 6 : 5;
    sets = score <= -2 ? Math.max(2, exercise.sets - 1) : Math.max(exercise.sets, 3);
    pct = score <= -1 ? 0.70 : 0.78;
    label = "Strength";
    note = "Strength bias: heavier loads and lower reps are favored for maximal strength.";
  } else if (goal === "hypertrophy") {
    targetReps = canLoad ? 10 : Math.max(baseTarget, 12);
    sets = score <= -2 ? Math.max(2, exercise.sets - 1) : exercise.sets + 1;
    pct = canLoad ? 0.65 : null;
    label = "Volume";
    note = "Volume bias: hard moderate-to-higher rep sets can build muscle across a wide loading range.";
  } else if (goal === "fatigue_friendly") {
    targetReps = Math.max(6, baseTarget - 2);
    sets = Math.max(1, exercise.sets - 1);
    pct = canLoad ? 0.60 : null;
    label = "Recovery";
    note = "Fatigue-friendly bias: lower total work and more reps in reserve today.";
  } else if (canLoad) {
    targetReps = score >= 1 ? 8 : 10;
    pct = score >= 1 ? 0.70 : 0.65;
    label = "Balanced";
    note = "Balanced bias: enough load for strength practice, enough reps for useful volume.";
  } else {
    targetReps = goal === "strength" ? Math.max(6, baseTarget - 2) : Math.max(baseTarget, 10);
    label = goal === "strength" ? "Strength Skill" : "Volume";
    note = "Fixed-weight mode: progress by reps, sets, tempo, and cleaner execution instead of large load jumps.";
  }

  if (score <= -2) {
    targetReps = Math.max(3, targetReps - 2);
    sets = Math.max(1, sets - 1);
  }
  if (load.status === "high" && score <= 0) {
    sets = Math.max(1, sets - 1);
    note += " Recent weekly load is high, so total sets are capped today.";
  }
  if (deload.recommended) {
    targetReps = Math.max(3, targetReps - 1);
    sets = Math.max(1, sets - 1);
    pct = pct ? Math.max(0.55, pct - 0.08) : pct;
    label = label === "Protect" ? label : "Deload";
    note += ` Deload signal: ${deload.reason}`;
  }
  if (trend.status === "stalling") {
    targetReps = Math.max(3, targetReps - 1);
    note += " Recent set drop-off is showing, so the target is nudged down.";
  }
  if (feedback.status === "pain") {
    targetReps = Math.max(3, targetReps - 2);
    sets = Math.max(1, sets - 1);
    pct = pct ? Math.max(0.55, pct - 0.08) : pct;
    label = "Protect";
    note = "Pain was flagged recently. Reduce stress today and use a swap if the movement feels wrong.";
  } else if (feedback.status === "hard") {
    targetReps = Math.max(3, targetReps - 1);
    pct = pct ? Math.max(0.58, pct - 0.04) : pct;
    note += " Recent feedback says this lift is hard, so progression is paused.";
  } else if (feedback.status === "easy" && score >= 0 && trend.status !== "stalling") {
    targetReps += equipment.canLoad ? 0 : 1;
    pct = pct ? Math.min(0.82, pct + 0.03) : pct;
    note += " Recent feedback says this is easy, so the coach allows a small push.";
  }
  if (workoutFeedback?.feeling === "hard") {
    sets = Math.max(1, sets - 1);
    note += " Last workout was rated hard, so volume is trimmed slightly.";
  } else if (workoutFeedback?.feeling === "pain") {
    targetReps = Math.max(3, targetReps - 1);
    sets = Math.max(1, sets - 1);
    label = "Protect";
    note += " Last workout was rated painful, so today's plan is more conservative.";
  } else if (workoutFeedback?.feeling === "easy" && score >= 0 && trend.status !== "stalling") {
    targetReps += fixedLoad ? 1 : 0;
    note += " Last workout was rated easy, so the coach allows a small rep push.";
  }
  if (behavior.restSkipRate >= 0.5 && behavior.restEvents >= 3 && (goal === "strength" || pct)) {
    targetReps = Math.max(3, targetReps - 1);
    note += " Rest skips are frequent, so intensity is kept slightly conservative.";
  }
  targetReps = exactRepTarget(targetReps, repRange);
  tempo = tempoPrescription({ goal, fixedLoad, feedbackStatus:feedback.status, trendStatus:trend.status });
  variation = variationPrescription({ exerciseName, fixedLoad, targetReps, feedbackStatus:feedback.status, trendStatus:trend.status });
  if (fixedLoad && goal === "hypertrophy") {
    note += ` Exact target today is ${targetReps} reps per set. The coach keeps this inside the ${repRange.min}-${repRange.max} learning range and moves it as your logs improve.`;
  }

  let suggestedWeight = pct && est1RM ? Math.max(2.5, Math.round((est1RM * pct) * 2) / 2) : null;
  // Snap suggestion to weights the user owns (fixed dumbbells only)
  const ownedWeights = (settings.equipmentProfile || "fixed_dumbbells") === "fixed_dumbbells"
    ? cleanAvailableWeights(settings.availableWeights)
    : [];
  if (suggestedWeight && ownedWeights.length) suggestedWeight = snapWeight(suggestedWeight, ownedWeights, "nearest");
  const targetRepReason = (() => {
    const sc = readinessScore(readiness);
    if (feedback.status === "pain")                                return `Reduced target — pain was flagged in a recent session.`;
    if (label === "Protect")                                       return `Reduced target — pain or high fatigue detected.`;
    if (label === "Deload")                                        return `Deload target — weekly fatigue is elevated.`;
    if (feedback.status === "hard" && trend.status === "stalling") return `Reduced target — sets are hard and progress has stalled.`;
    if (feedback.status === "hard")                                return `Reduced target — recent sets were marked hard.`;
    if (feedback.status === "easy" && trend.status !== "stalling") return `Increased target — recent sets looked strong.`;
    if (trend.status === "stalling")                               return `Held target — a performance plateau was detected.`;
    if (load.status === "high")                                    return `Capped volume — you've trained frequently this week.`;
    if (sc >= 1)                                                   return `Full target — energy is high and trend is clean.`;
    if (sc <= -1)                                                  return `Reduced target — recovery is still limited.`;
    return `Held target — recovery and recent feedback look stable.`;
  })();
  return { enabled:true, targetReps, repRange, targetRepReason, tempo, variation, sets, est1RM, suggestedWeight, label, note, percent:pct, trend, feedback, load, behavior };
}

function lastExerciseSessions(history, exerciseName, count = 3) {
  return [...history]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(h => h.exercises?.some(ex => ex.name === exerciseName))
    .slice(0, count)
    .map(h => h.exercises.find(ex => ex.name === exerciseName));
}

export function exerciseTrend(history, exercise, targetReps) {
  const sessions = lastExerciseSessions(history, exercise.name, 3);
  if (!sessions.length) return { status: "new", hitRate: null, dropoff: 0 };

  const latest = sessions[0];
  const logs = latest.setLog || [];
  const totalSets = logs.length || latest.sets || exercise.sets || 1;
  const hits = logs.filter(l => (l.reps || 0) >= targetReps).length;
  const hitRate = logs.length ? hits / totalSets : 1;
  const reps = logs.map(l => l.reps || 0);
  const dropoff = reps.length >= 2 ? reps[0] - reps[reps.length - 1] : 0;

  const recentMisses = sessions.filter(s => {
    const setLog = s.setLog || [];
    return setLog.length && setLog.some(l => (l.reps || 0) < targetReps);
  }).length;

  if (hitRate === 1 && sessions.length >= 2) return { status: "ready", hitRate, dropoff, recentMisses };
  if (recentMisses >= 2 || dropoff >= 4) return { status: "stalling", hitRate, dropoff, recentMisses };
  if (hitRate < 1) return { status: "building", hitRate, dropoff, recentMisses };
  return { status: "steady", hitRate, dropoff, recentMisses };
}

export function painBlockedExercises(checkIns = []) {
  const recent = [...checkIns]
    .filter(ci => ci.kind === "set_feedback" && ci.feeling === "pain" && ci.exercise)
    .sort((a,b)=>(b.timestamp||0)-(a.timestamp||0))
    .slice(0, 40);
  const counts = recent.reduce((acc, ci) => {
    const key = ci.originalName || ci.exercise;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).filter(([, count]) => count >= 2).map(([name]) => name);
}

export function plateauFixes({ history = [], exercise, targetReps }) {
  const key = exercise?.name;
  if (!key) return [];
  const trend = exerciseTrend(history, exercise, targetReps ?? exercise.baseReps);
  if (trend.status !== "stalling" && trend.status !== "building") return [];
  const fixes = [];
  if (trend.dropoff >= 4) {
    fixes.push("Reduce the target by 1-2 reps and keep every set cleaner.");
    fixes.push("Add 15-30 seconds rest before this exercise.");
  }
  if (trend.recentMisses >= 2) {
    fixes.push("Use the same load next time and stop 1 rep before form breaks.");
    fixes.push("Try the first swap option for one session if joints or form feel off.");
  }
  if (!fixes.length) fixes.push("Repeat the same target once more before increasing difficulty.");
  return fixes.slice(0, 3);
}

export function recommendDeload({ history = [], checkIns = [] }) {
  const recent = [...history].sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).slice(0, 4);
  const recentFeedback = [...checkIns].filter(ci => ci.kind === "workout_feedback").sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).slice(0, 4);
  const hardOrPain = recentFeedback.filter(ci => ci.feeling === "hard" || ci.feeling === "pain").length;
  const lowEnergy = checkIns
    .filter(ci => ci.kind === "readiness" && ci.readiness && Date.now() - (ci.timestamp || 0) <= 14 * 86400000)
    .filter(ci => ci.readiness.energy === "low" || ci.readiness.soreness === "sore").length;
  const missedSets = recent.reduce((sum, session) => sum + (session.exercises || []).reduce((s, ex) => {
    const target = ex.reps || 0;
    return s + (ex.setLog || []).filter(log => target && (log.reps || 0) < Math.round(target * 0.75)).length;
  }, 0), 0);
  if (hardOrPain >= 2) return { recommended:true, reason:"two recent workouts were rated hard or painful." };
  if (missedSets >= 4) return { recommended:true, reason:"several recent sets missed badly." };
  if (lowEnergy >= 3 && recent.length >= 2) return { recommended:true, reason:"readiness has been low or sore repeatedly." };
  return { recommended:false, reason:"no deload needed yet." };
}

export function suggestSubstitutions({ workout, history = [], exConfig = {}, readiness = DEFAULT_READINESS, settings = {} }) {
  const sore = readiness?.soreness === "sore";
  const cautious = settings.cautiousJoints || [];
  return workout.exercises
    .map(ex => {
      const target = exConfig[ex.name]?.targetReps ?? ex.baseReps;
      const trend = exerciseTrend(history, ex, target);
      const swaps = SUBSTITUTIONS[ex.name] || [];
      const swap = swaps[0];
      if (!swap) return null;
      const joint = cautious.find(j => JOINT_AREAS[j]?.exercises.includes(ex.name));
      if (sore || trend.status === "stalling" || joint) {
        return {
          exercise: ex.name,
          substitute: swap.name,
          reason: joint ? JOINT_AREAS[joint].note : sore ? swap.reason : "this movement has been stalling",
          alternatives: swaps,
        };
      }
      return null;
    })
    .filter(Boolean);
}

export function evaluateProgression({
  setLog = [],
  targetReps,
  currentWeight,
  previous = {},
  increment = 2.5,
  style = "balanced",
  autoDeload = true,
  availableWeights = [],
}) {
  const cleanIncrement = Number.isFinite(Number(increment)) && Number(increment) > 0 ? Number(increment) : 1;
  const cleanCurrentWeight = Number.isFinite(Number(currentWeight)) ? Number(currentWeight) : 0;
  const owned = cleanAvailableWeights(availableWeights);
  // Next/prev load: snap to owned dumbbells when available, else step by increment
  const upWeight   = owned.length ? snapWeight(cleanCurrentWeight, owned, "up")   : roundWeight(cleanCurrentWeight + cleanIncrement);
  const downWeight = owned.length ? snapWeight(cleanCurrentWeight, owned, "down") : Math.max(roundWeight(cleanCurrentWeight - cleanIncrement), 0);
  const allHit = setLog.length > 0 && setLog.every(l => (l.reps || 0) >= targetReps);
  const anyFail = setLog.some(l => (l.reps || 0) < Math.round(targetReps * 0.75));
  const cleanSessions = allHit ? (previous.cleanSessions || 0) + 1 : 0;
  const missSessions = anyFail ? (previous.missSessions || 0) + 1 : 0;
  const requiredCleanSessions = style === "aggressive" ? 1 : style === "conservative" ? 3 : 2;

  if (autoDeload && missSessions >= 2) {
    return {
      action: "deload",
      nextWeight: downWeight,
      cleanSessions,
      missSessions,
      note: "Repeated misses. Reduce load and rebuild clean reps.",
    };
  }

  if (cleanSessions >= requiredCleanSessions) {
    return {
      action: "increase",
      nextWeight: upWeight,
      cleanSessions: 0,
      missSessions: 0,
      note: `${requiredCleanSessions} clean session${requiredCleanSessions === 1 ? "" : "s"}. Ready to progress.`,
    };
  }

  return {
    action: "maintain",
    nextWeight: cleanCurrentWeight,
    cleanSessions,
    missSessions,
    note: allHit ? "Clean session logged. Repeat before increasing." : "Keep the same load.",
  };
}

export function roundWeight(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function coachTargetReps(baseTarget, readiness = DEFAULT_READINESS) {
  const score = readinessScore(readiness);
  if (score <= -2) return Math.max(3, baseTarget - 2);
  if (score <= -1) return Math.max(3, baseTarget - 1);
  return baseTarget;
}

export function coachSetCount(baseSets, readiness = DEFAULT_READINESS) {
  if (readiness?.time === "short") return Math.max(1, baseSets - 1);
  return baseSets;
}

export function latestMuscleSoreness(checkIns = []) {
  const entries = checkIns.filter(ci => ci.kind === "muscle_soreness" && ci.muscle);
  const latest = {};
  entries.forEach(ci => {
    const prev = latest[ci.muscle];
    if (!prev || (ci.timestamp || 0) > (prev.timestamp || 0)) latest[ci.muscle] = ci;
  });
  const out = {};
  Object.entries(latest).forEach(([muscle, ci]) => { out[muscle] = ci.level; });
  return out;
}

export function muscleRecoveryStats(checkIns = []) {
  const entries = checkIns
    .filter(ci => ci.kind === "muscle_soreness" && ci.muscle && ci.level)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const byMuscle = {};
  entries.forEach(ci => {
    if (!byMuscle[ci.muscle]) byMuscle[ci.muscle] = [];
    byMuscle[ci.muscle].push(ci);
  });

  const results = [];
  Object.entries(byMuscle).forEach(([muscle, list]) => {
    const durations = [];
    let soreStart = null;
    list.forEach(ci => {
      if (ci.level === "sore") {
        if (soreStart === null) soreStart = ci.timestamp;
      } else if (ci.level === "fresh" && soreStart !== null) {
        const hours = (ci.timestamp - soreStart) / 3600000;
        if (hours > 0 && hours < 30 * 24) durations.push(hours);
        soreStart = null;
      }
    });
    if (durations.length) {
      const avgHours = durations.reduce((a, b) => a + b, 0) / durations.length;
      results.push({ muscle, avgHours, samples: durations.length });
    }
  });

  const entriesSorted = [...results].sort((a, b) => b.avgHours - a.avgHours);
  return {
    entries: entriesSorted,
    slowest: entriesSorted[0] || null,
    fastest: entriesSorted[entriesSorted.length - 1] && entriesSorted[entriesSorted.length - 1] !== entriesSorted[0]
      ? entriesSorted[entriesSorted.length - 1]
      : null,
  };
}

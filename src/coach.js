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

export function bestEstimated1RM(history = [], exerciseName) {
  const estimates = history.flatMap(h => h.exercises || [])
    .filter(ex => ex.name === exerciseName || ex.originalName === exerciseName || ex.substitutedFor === exerciseName)
    .flatMap(ex => ex.setLog || [])
    .map(log => estimated1RM(log.weight, log.reps))
    .filter(Boolean);
  return estimates.length ? Math.max(...estimates) : null;
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

export function sciencePrescription({ exercise, history = [], checkIns = [], settings = {}, readiness = DEFAULT_READINESS, baseTarget = exercise.baseReps }) {
  const enabled = settings.scienceCoach === true;
  const goal = settings.trainingGoal || "general";
  const equipment = EQUIPMENT_PROFILES[settings.equipmentProfile || "fixed_dumbbells"] || EQUIPMENT_PROFILES.fixed_dumbbells;
  const fixedLoad = !equipment.canLoad;
  const score = readinessScore(readiness);
  const exerciseName = exercise.configName || exercise.originalName || exercise.name;
  const est1RM = bestEstimated1RM(history, exerciseName);
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
  tempo = tempoPrescription({ goal, fixedLoad, feedbackStatus:feedback.status, trendStatus:trend.status });
  variation = variationPrescription({ exerciseName, fixedLoad, targetReps, feedbackStatus:feedback.status, trendStatus:trend.status });
  if (fixedLoad && goal === "hypertrophy") {
    const top = repRange.max;
    note += ` Work in the ${repRange.min}-${top} rep range; when all sets reach the top cleanly, progress tempo or variation.`;
  }

  const suggestedWeight = pct && est1RM ? Math.max(2.5, Math.round((est1RM * pct) * 2) / 2) : null;
  return { enabled:true, targetReps, repRange, tempo, variation, sets, est1RM, suggestedWeight, label, note, percent:pct, trend, feedback, load, behavior };
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

export function buildCoachPlan({ workout, history, checkIns = [], exConfig, settings, readiness }) {
  const score = readinessScore(readiness);
  const cards = [];
  const adjustments = [];
  const watch = [];

  if (score <= -2) {
    adjustments.push("Recovery bias: keep weights steady and stop 1-2 reps before form breaks.");
  } else if (score >= 2) {
    adjustments.push("Green light: push the final set on your strongest movements.");
  } else {
    adjustments.push("Steady day: hit clean reps and let the logged sets decide progression.");
  }

  if (readiness?.time === "short") {
    adjustments.push("Short session: complete the first two sets for every exercise, then finish if time is tight.");
  }
  const latestWorkoutFeedback = [...checkIns].filter(ci => ci.kind === "workout_feedback").sort((a,b)=>(b.timestamp||0)-(a.timestamp||0))[0];
  const deload = recommendDeload({ history, checkIns });
  if (latestWorkoutFeedback?.feeling === "hard") adjustments.push("Last workout was hard: trim one set if form fades.");
  if (latestWorkoutFeedback?.feeling === "pain") adjustments.push("Last workout had pain: use swaps early and keep reps smooth.");
  if (latestWorkoutFeedback?.feeling === "easy") adjustments.push("Last workout was easy: chase cleaner top-end reps before adding load.");
  if (deload.recommended) adjustments.unshift(`Deload signal: ${deload.reason}`);

  const currentSoreness = latestMuscleSoreness(checkIns);
  const soreMuscles = Object.entries(currentSoreness).filter(([, level]) => level === "sore").map(([m]) => m);
  if (soreMuscles.length) {
    const hits = workout.exercises.filter(ex => [...(ex.primary || []), ...(ex.secondary || [])].some(m => soreMuscles.includes(m))).map(ex => ex.name);
    if (hits.length) adjustments.unshift(`Sore today: ${soreMuscles.join(", ")}. Ease or swap ${hits.slice(0, 2).join(" / ")}.`);
    else adjustments.push(`Sore today: ${soreMuscles.join(", ")}. None of today's lifts hit them directly.`);
  }

  const exerciseNotes = workout.exercises.map(ex => {
    const target = exConfig[ex.name]?.targetReps ?? ex.baseReps;
    const trend = exerciseTrend(history, ex, target);
    if (trend.status === "ready") {
      return { ex: ex.name, priority: 2, note: `${ex.name}: ready to progress if all sets land clean today.` };
    }
    if (trend.status === "stalling") {
      return { ex: ex.name, priority: 3, note: `${ex.name}: keep the load steady and protect form; recent reps are fading.` };
    }
    if (trend.status === "building") {
      return { ex: ex.name, priority: 1, note: `${ex.name}: aim to close the gap to ${target} reps across every set.` };
    }
    return { ex: ex.name, priority: 0, note: `${ex.name}: establish a clean baseline today.` };
  }).sort((a, b) => b.priority - a.priority);

  const focus = exerciseNotes[0]?.note || "Build clean reps today.";
  watch.push(...exerciseNotes.filter(n => n.priority >= 2).slice(0, 2).map(n => n.note));
  const substitutions = suggestSubstitutions({ workout, history, exConfig, readiness, settings }).slice(0, 2);
  const behavior = behaviorMemory(checkIns);
  const jointNotes = (settings.cautiousJoints || []).map(j => JOINT_AREAS[j]?.note).filter(Boolean);
  const science = (settings.scienceCoach ? workout.exercises.map(ex => sciencePrescription({
    exercise: ex,
    history,
    checkIns,
    settings,
    readiness,
    baseTarget: exConfig[ex.name]?.targetReps ?? ex.baseReps,
  })).find(item => item.enabled && item.note) : null);

  cards.push({
    icon: score >= 2 ? "⚡" : score <= -2 ? "🎯" : "🧠",
    cat: "Coach",
    msg: `${readinessLabel(readiness)}. ${focus}`,
  });

  adjustments.slice(0, 2).forEach(msg => cards.push({ icon: "🧭", cat: "Plan", msg }));
  if (science) cards.push({ icon:"🔬", cat:"Science", msg:`${science.label}: ${science.note}${science.est1RM ? ` Est. 1RM: ${science.est1RM}lbs.` : ""}` });
  jointNotes.slice(0, 1).forEach(msg => cards.push({ icon:"🛡️", cat:"Joints", msg }));
  behavior.notes.slice(0, 2).forEach(msg => cards.push({ icon:"⏱️", cat:"Habits", msg }));
  if (deload.recommended) cards.push({ icon:"↓", cat:"Deload", msg:`${deload.reason} Keep reps smooth and leave extra reps in reserve.` });
  substitutions.forEach(sub => cards.push({ icon: "🔁", cat: "Swap", msg: `${sub.exercise}: use ${sub.substitute} if ${sub.reason}.` }));
  watch.forEach(msg => cards.push({ icon: "👁️", cat: "Watch", msg }));

  return {
    readinessScore: score,
    headline: score >= 2 ? "Attack the work" : score <= -2 ? "Train, don't drain" : "Clean reps first",
    focus,
    adjustments,
    science,
    behavior,
    substitutions,
    cards,
  };
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
}) {
  const cleanIncrement = Number.isFinite(Number(increment)) && Number(increment) > 0 ? Number(increment) : 1;
  const cleanCurrentWeight = Number.isFinite(Number(currentWeight)) ? Number(currentWeight) : 0;
  const allHit = setLog.length > 0 && setLog.every(l => (l.reps || 0) >= targetReps);
  const anyFail = setLog.some(l => (l.reps || 0) < Math.round(targetReps * 0.75));
  const cleanSessions = allHit ? (previous.cleanSessions || 0) + 1 : 0;
  const missSessions = anyFail ? (previous.missSessions || 0) + 1 : 0;
  const requiredCleanSessions = style === "aggressive" ? 1 : style === "conservative" ? 3 : 2;

  if (autoDeload && missSessions >= 2) {
    return {
      action: "deload",
      nextWeight: Math.max(roundWeight(cleanCurrentWeight - cleanIncrement), 0),
      cleanSessions,
      missSessions,
      note: "Repeated misses. Reduce load and rebuild clean reps.",
    };
  }

  if (cleanSessions >= requiredCleanSessions) {
    return {
      action: "increase",
      nextWeight: roundWeight(cleanCurrentWeight + cleanIncrement),
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

export function explainExerciseDecision({
  exercise,
  history = [],
  exConfig = {},
  targetReps,
  science,
  progressionRec,
  settings = {},
  checkIns = [],
}) {
  const name = exercise?.configName || exercise?.originalName || exercise?.name;
  const cfg = exConfig[name] || {};
  const latest = [...history]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .map(session => session.exercises?.find(ex => (ex.originalName || ex.substitutedFor || ex.name) === name))
    .find(Boolean);
  const logs = latest?.setLog || [];
  const lastTotal = logs.reduce((sum, log) => sum + (log.reps || 0), 0);
  const lastBest = logs.reduce((best, log) => Math.max(best, log.reps || 0), 0);
  const misses = logs.filter(log => (log.reps || 0) < Math.round((targetReps || 0) * 0.75)).length;
  const restEvents = checkIns.filter(ci => ci.kind === "rest" && (ci.originalName === name || ci.exercise === exercise?.name || ci.exercise === name));
  const skippedRests = restEvents.filter(ci => ci.action === "skip").length;
  const lines = [];
  if (targetReps) lines.push(`Target is ${targetReps} reps from your benchmark, readiness, and recent feedback.`);
  if (logs.length) lines.push(`Last time: ${logs.length} sets, ${lastTotal} total reps, best set ${lastBest} reps.`);
  else lines.push("No logged set history yet, so the coach is using your current plan as the baseline.");
  if (misses) lines.push(`${misses} recent set${misses === 1 ? "" : "s"} missed badly, so progression is held back.`);
  if (cfg.cleanSessions) lines.push(`${cfg.cleanSessions} clean session${cfg.cleanSessions === 1 ? "" : "s"} banked toward the next increase.`);
  if (cfg.missSessions) lines.push(`${cfg.missSessions} miss session${cfg.missSessions === 1 ? "" : "s"} recorded for auto-deload logic.`);
  if (skippedRests) lines.push(`${skippedRests} rest skip${skippedRests === 1 ? "" : "s"} logged around this movement.`);
  if (science?.note) lines.push(science.note);
  if (progressionRec?.note || cfg.lastRecNote) lines.push(progressionRec?.note || cfg.lastRecNote);
  if ((settings.equipmentProfile || "fixed_dumbbells") === "fixed_dumbbells") {
    lines.push("Fixed dumbbell mode prefers reps, tempo, cleaner form, and variations before big load jumps.");
  }
  return lines.slice(0, 6);
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

export function summarizeWorkout({ exercises, duration = 0, readiness, prs = [], nextWorkout }) {
  const totals = exercises.reduce((acc, ex) => {
    const setLog = ex.setLog || [];
    const dumbbells = ex.name === "Goblet Squat" ? 1 : 2;
    const reps = setLog.reduce((sum, log) => sum + (log.reps || 0), 0);
    const volume = setLog.reduce((sum, log) => sum + ((log.reps || 0) * (log.weight || 0) * dumbbells), 0);
    const target = (ex.reps || 0) * (ex.sets || 0);
    const completion = target ? reps / target : 1;
    const hardest = !acc.hardest || completion < acc.hardest.completion
      ? { name: ex.name, completion }
      : acc.hardest;
    const bestSet = [...setLog].sort((a,b)=>((b.reps||0)*(b.weight||0))-((a.reps||0)*(a.weight||0)))[0];
    const best = bestSet && (!acc.bestSet || (bestSet.reps||0)*(bestSet.weight||0) > (acc.bestSet.reps||0)*(acc.bestSet.weight||0))
      ? { name: ex.name, reps: bestSet.reps || 0, weight: bestSet.weight || 0 }
      : acc.bestSet;
    return {
      reps: acc.reps + reps,
      volume: acc.volume + volume,
      sets: acc.sets + setLog.length,
      hardest,
      bestSet: best,
    };
  }, { reps: 0, volume: 0, sets: 0, hardest: null, bestSet: null });

  const score = readinessScore(readiness);
  const coachNote = score <= -2
    ? "Good call keeping the session controlled. Recovery days still count."
    : totals.hardest?.completion < 0.9
      ? `${totals.hardest.name} was the limiter today. Keep it steady next time.`
      : prs.length
        ? "Strong session. The next plan can afford a small progression."
        : "Clean work. Keep stacking sessions and let the trend build.";

  const nextChange = prs.length
    ? "The next plan can afford a small progression where form stayed clean."
    : totals.hardest?.completion < 0.9
      ? `Next time, ${totals.hardest.name} should stay controlled before adding difficulty.`
      : "Next time, repeat this quality and let the coach build volume gradually.";

  const reasoning = [
    `Readiness: ${readinessLabel(readiness)}.`,
    totals.hardest ? `Limiter: ${totals.hardest.name} finished at ${Math.round(totals.hardest.completion * 100)}% of target volume.` : "Limiter: none yet.",
    prs.length ? `Progression signal: ${prs.length} new PR${prs.length === 1 ? "" : "s"} logged.` : "Progression signal: no new PR, so the coach favors repeatable quality.",
    totals.volume > 0 ? `Logged load: ${Math.round(totals.volume).toLocaleString()} lbs of volume.` : "Logged load: bodyweight or unloaded work counted by reps.",
  ];

  return { ...totals, duration, prs, coachNote, nextWorkout, nextChange, reasoning };
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

export function buildCoachMemory({ history = [], checkIns = [], exercises = [], exConfig = {} }) {
  const readinessEntries = checkIns.filter(ci => ci.kind === "readiness" && ci.readiness);
  const setFeedback = checkIns.filter(ci => ci.kind === "set_feedback" && ci.exercise);
  const behavior = behaviorMemory(checkIns);
  const energyCounts = readinessEntries.reduce((acc, ci) => {
    const key = ci.readiness.energy || "okay";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const commonEnergy = Object.entries(energyCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "unknown";

  const exerciseStats = exercises.map(ex => {
    const sessions = history.filter(h => h.exercises?.some(item => item.name === ex.name));
    const latest = sessions[0]?.exercises?.find(item => item.name === ex.name);
    const target = exConfig[ex.name]?.targetReps ?? ex.baseReps;
    const trend = exerciseTrend(history, ex, target);
    const maxWeight = Math.max(0, ...(sessions.flatMap(h => {
      const item = h.exercises.find(e => e.name === ex.name);
      return item?.setLog?.map(log => log.weight || 0) || [];
    })));
    const latestReps = latest?.setLog?.reduce((sum, log) => sum + (log.reps || 0), 0) || 0;
    const feedback = setFeedback.filter(item => item.exercise === ex.name || item.originalName === ex.name);
    const hardCount = feedback.filter(item => item.feeling === "hard" || item.feeling === "pain").length;
    const easyCount = feedback.filter(item => item.feeling === "easy").length;
    const painCount = feedback.filter(item => item.feeling === "pain").length;
    return { name: ex.name, trend: trend.status, maxWeight, latestReps, hardCount, easyCount, painCount };
  });

  const strongest = [...exerciseStats].sort((a,b)=>b.maxWeight-a.maxWeight)[0];
  const stalling = exerciseStats.filter(ex => ex.trend === "stalling");
  const progressing = exerciseStats.filter(ex => ex.trend === "ready");
  const painFlags = exerciseStats.filter(ex => ex.painCount > 0).sort((a,b)=>b.painCount-a.painCount);
  const hardest = [...exerciseStats].sort((a,b)=>b.hardCount-a.hardCount)[0];
  const easiest = [...exerciseStats].sort((a,b)=>b.easyCount-a.easyCount)[0];
  const swapCounts = history.flatMap(h => h.exercises || [])
    .filter(ex => ex.substitutedFor)
    .reduce((acc, ex) => {
      const key = `${ex.substitutedFor} -> ${ex.name}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  const favoriteSwap = Object.entries(swapCounts).sort((a,b)=>b[1]-a[1])[0];
  const inconsistent = stalling[0] || exerciseStats.find(ex => ex.trend === "building");
  const focus = painFlags[0]?.name || stalling[0]?.name || progressing[0]?.name || inconsistent?.name || exercises[0]?.name || "consistency";

  const recovery = muscleRecoveryStats(checkIns);
  const currentSoreness = latestMuscleSoreness(checkIns);
  const stillSore = Object.entries(currentSoreness).filter(([, level]) => level === "sore").map(([m]) => m);

  const recoverySummary = recovery.slowest
    ? `${recovery.slowest.muscle} typically takes ~${Math.round(recovery.slowest.avgHours)}h to recover${recovery.fastest ? `; ${recovery.fastest.muscle} clears in ~${Math.round(recovery.fastest.avgHours)}h` : ""}.`
    : null;

  return {
    commonEnergy,
    readinessCount: readinessEntries.length,
    setFeedbackCount: setFeedback.length,
    strongest,
    stalling,
    progressing,
    painFlags,
    hardest,
    easiest,
    favoriteSwap: favoriteSwap ? { label: favoriteSwap[0], count: favoriteSwap[1] } : null,
    behavior,
    inconsistent,
    focus,
    recovery,
    currentSoreness,
    stillSore,
    summary: stillSore.length
      ? `${stillSore.slice(0, 3).join(", ")} ${stillSore.length === 1 ? "is" : "are"} flagged sore right now. The coach should ease or swap work for those muscles.`
      : painFlags.length
      ? `${painFlags[0].name} has been flagged for discomfort. The coach should bias toward swaps or lighter work there.`
      : stalling.length
      ? `${stalling[0].name} needs steadier reps before increasing load.`
      : progressing.length
        ? `${progressing[0].name} is trending well. It may be ready for progression.`
        : "The coach is still collecting enough sessions to see a clear pattern.",
    recoverySummary,
  };
}

export function buildWeeklyReview({ history = [], checkIns = [] }) {
  const now = Date.now();
  const weekMs = 7 * 86400000;
  const recent = history.filter(h => now - h.timestamp <= weekMs);
  const readiness = checkIns.filter(ci => ci.kind === "readiness" && now - ci.timestamp <= weekMs);
  const totalVolume = recent.reduce((sum, h) => sum + (h.exercises || []).reduce((s, ex) => {
    const dumbbells = ex.name === "Goblet Squat" ? 1 : 2;
    return s + (ex.setLog || []).reduce((setSum, log) => setSum + ((log.reps || 0) * (log.weight || 0) * dumbbells), 0);
  }, 0), 0);
  const best = [...recent.flatMap(h => h.exercises || [])]
    .map(ex => ({ name: ex.name, reps: (ex.setLog || []).reduce((s, l) => s + (l.reps || 0), 0) }))
    .sort((a,b)=>b.reps-a.reps)[0];
  const consistency = Math.min(100, Math.round((recent.length / 3) * 100));
  const lowEnergy = readiness.filter(r => r.readiness?.energy === "low").length;
  const focus = lowEnergy >= 2
    ? "Prioritize recovery and sleep before pushing load."
    : recent.length >= 3
      ? "Consistency is on track. Look for one clean progression."
      : "Aim for three sessions this week before chasing heavier weights.";

  return {
    sessions: recent.length,
    volume: totalVolume,
    best,
    consistency,
    focus,
  };
}

export function weeklyMuscleCoverage({ completed = {}, schedule, workouts, completionKeyFn }) {
  const coverage = {};
  Object.entries(schedule).forEach(([day, key]) => {
    const workout = workouts[key];
    const done = completionKeyFn ? !!completed[completionKeyFn(day)] : false;
    workout.exercises.forEach(ex => {
      [...(ex.primary || []), ...(ex.secondary || [])].forEach(muscle => {
        if (!coverage[muscle]) coverage[muscle] = { planned: 0, done: 0, days: new Set() };
        coverage[muscle].planned += ex.primary?.includes(muscle) ? 1 : 0.5;
        coverage[muscle].days.add(day);
        if (done) coverage[muscle].done += ex.primary?.includes(muscle) ? 1 : 0.5;
      });
    });
  });
  return Object.fromEntries(Object.entries(coverage).map(([muscle, item]) => [
    muscle,
    { planned: item.planned, done: item.done, days: [...item.days] },
  ]));
}

export function detectWeakPoints({ history = [], exercises = [], exConfig = {} }) {
  const now = Date.now();
  const recent = history.filter(h => now - (h.timestamp || 0) <= 28 * 86400000);
  const byMuscle = {};
  exercises.forEach(ex => {
    [...(ex.primary || []), ...(ex.secondary || [])].forEach(muscle => {
      if (!byMuscle[muscle]) byMuscle[muscle] = { sessions: 0, reps: 0, hard: 0, exercises: new Set() };
      byMuscle[muscle].exercises.add(ex.name);
    });
  });
  recent.forEach(session => {
    (session.exercises || []).forEach(logged => {
      const base = exercises.find(ex => ex.name === (logged.originalName || logged.substitutedFor || logged.name)) || exercises.find(ex => ex.name === logged.name);
      if (!base) return;
      const reps = (logged.setLog || []).reduce((s,l)=>s+(l.reps||0),0);
      [...(base.primary || []), ...(base.secondary || [])].forEach(muscle => {
        if (!byMuscle[muscle]) byMuscle[muscle] = { sessions: 0, reps: 0, hard: 0, exercises: new Set() };
        byMuscle[muscle].sessions += 1;
        byMuscle[muscle].reps += reps;
      });
    });
  });
  const exerciseFlags = exercises.map(ex => {
    const target = exConfig[ex.name]?.targetReps ?? ex.baseReps;
    const trend = exerciseTrend(history, ex, target);
    return { name: ex.name, trend: trend.status };
  }).filter(ex => ex.trend === "stalling" || ex.trend === "building");
  const lowCoverage = Object.entries(byMuscle)
    .map(([muscle, item]) => ({ muscle, ...item, exercises:[...item.exercises] }))
    .filter(item => item.sessions <= 1)
    .sort((a,b)=>a.sessions-b.sessions || a.reps-b.reps)
    .slice(0, 3);
  const messages = [
    ...lowCoverage.map(item => ({
      type: "coverage",
      muscle: item.muscle,
      title: `${item.muscle} needs more touches`,
      detail: item.sessions ? `Only ${item.sessions} recent touch in the last 4 weeks.` : "No recent logged work in the last 4 weeks.",
    })),
    ...exerciseFlags.slice(0, 3).map(item => ({
      type: "performance",
      exercise: item.name,
      title: `${item.name} is ${item.trend}`,
      detail: item.trend === "stalling" ? "Keep load steady and prioritize cleaner reps." : "Build toward hitting all planned reps.",
    })),
  ];
  return messages.slice(0, 5);
}

export function computePersonalRecords({ history = [] }) {
  const sessions = [...history].filter(h => h.exercises?.length);
  const exerciseRecords = {};
  let bestSessionVolume = null;
  let fastestSession = null;
  let longestSession = null;

  sessions.forEach(session => {
    const sessionVolume = (session.exercises || []).reduce((sum, ex) => {
      const dumbbells = ex.name === "Goblet Squat" ? 1 : 2;
      return sum + (ex.setLog || []).reduce((s, log) => s + ((log.weight || 0) * (log.reps || 0) * dumbbells), 0);
    }, 0);
    if (!bestSessionVolume || sessionVolume > bestSessionVolume.value) {
      bestSessionVolume = { value: sessionVolume, date: session.date, workout: session.workout };
    }
    if (session.duration && (!fastestSession || session.duration < fastestSession.value)) {
      fastestSession = { value: session.duration, date: session.date, workout: session.workout };
    }
    if (session.duration && (!longestSession || session.duration > longestSession.value)) {
      longestSession = { value: session.duration, date: session.date, workout: session.workout };
    }

    (session.exercises || []).forEach(ex => {
      const key = ex.originalName || ex.substitutedFor || ex.name;
      if (!exerciseRecords[key]) exerciseRecords[key] = { maxWeight: null, maxReps: null, maxVolume: null };
      const logs = ex.setLog || [];
      const totalReps = logs.reduce((s,l)=>s+(l.reps||0),0);
      const dumbbells = ex.name === "Goblet Squat" ? 1 : 2;
      const volume = logs.reduce((s,l)=>s+((l.weight||0)*(l.reps||0)*dumbbells),0);
      const bestWeight = [...logs].sort((a,b)=>(b.weight||0)-(a.weight||0))[0];
      const bestReps = [...logs].sort((a,b)=>(b.reps||0)-(a.reps||0))[0];
      if (bestWeight && (!exerciseRecords[key].maxWeight || (bestWeight.weight || 0) > exerciseRecords[key].maxWeight.value)) {
        exerciseRecords[key].maxWeight = { value: bestWeight.weight || 0, reps: bestWeight.reps || 0, date: session.date };
      }
      if (bestReps && (!exerciseRecords[key].maxReps || (bestReps.reps || 0) > exerciseRecords[key].maxReps.value)) {
        exerciseRecords[key].maxReps = { value: bestReps.reps || 0, weight: bestReps.weight || 0, date: session.date };
      }
      if (!exerciseRecords[key].maxVolume || volume > exerciseRecords[key].maxVolume.value) {
        exerciseRecords[key].maxVolume = { value: volume, reps: totalReps, date: session.date };
      }
    });
  });

  return { exerciseRecords, bestSessionVolume, fastestSession, longestSession };
}

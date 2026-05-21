import { ageTier, mesocyclePhase, routineBalanceScore, routineCoverage } from "../data.js";
import {
  JOINT_AREAS,
  DEFAULT_READINESS,
  behaviorMemory,
  exerciseTrend,
  latestMuscleSoreness,
  painBlockedExercises,
  readinessLabel,
  readinessScore,
  recommendDeload,
  recentTrainingLoad,
  sciencePrescription,
  suggestSubstitutions,
} from "./progression.js";

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

export function buildCoachNotes({
  routine = {},
  allExercises = [],
  history = [],
  checkIns = [],
  balance = null,
  coverage = null,
}) {
  const notes = [];
  const safeBalance  = balance  ?? routineBalanceScore(allExercises);
  const safeCoverage = coverage ?? routineCoverage(allExercises);

  // 1. Pain flag in the last 14 days
  const recentPain = checkIns.some(ci =>
    ci.kind === "set_feedback" && ci.feeling === "pain" &&
    (Date.now() - (ci.timestamp || 0)) < 14 * 86400000
  );
  if (recentPain) {
    notes.push({
      tone: "warning",
      title: "Pain flagged recently",
      text: "A recent session logged discomfort. Keep loads conservative and use swap options where needed.",
    });
  }

  // 2. Deload signal
  if (notes.length < 3) {
    const deload = recommendDeload({ history, checkIns });
    if (deload.recommended) {
      const reason = deload.reason.charAt(0).toUpperCase() + deload.reason.slice(1);
      notes.push({
        tone: "warning",
        title: "Recovery load is elevated",
        text: `${reason} Volume is scaled back to let the body adapt.`,
      });
    }
  }

  // 3. Major imbalance (balance < 60 — two or more groups missing)
  if (notes.length < 3 && safeBalance < 60) {
    const gaps = safeCoverage.filter(item => !item.ok).map(item => item.label);
    notes.push({
      tone: "warning",
      title: "Routine has significant gaps",
      text: `Missing: ${gaps.slice(0, 2).join(" and ")}. The week should cover push, pull, legs, and core.`,
    });
  }

  // 4. Single missing group (balance 60–79)
  if (notes.length < 3 && safeBalance >= 60 && safeBalance < 80) {
    const gaps = safeCoverage.filter(item => !item.ok);
    if (gaps.length > 0) {
      notes.push({
        tone: "neutral",
        title: `${gaps[0].label} is missing`,
        text: `One ${gaps[0].label.toLowerCase()} movement would round out the week.`,
      });
    }
  }

  // 5. Stalling exercise — plateau detected
  if (notes.length < 3 && history.length >= 2) {
    const stalling = allExercises
      .map(ex => ({ name: ex.name, trend: exerciseTrend(history, ex, ex.baseReps) }))
      .filter(item => item.trend.status === "stalling");
    if (stalling.length) {
      notes.push({
        tone: "neutral",
        title: `${stalling[0].name} has plateaued`,
        text: "Recent sets are dropping off. Try a variation or hold load steady for two clean sessions.",
      });
    }
  }

  // 6. Positive confirmation — nothing to flag
  if (notes.length === 0) {
    notes.push(
      safeBalance >= 80
        ? {
            tone: "good",
            title: "Routine looks balanced",
            text: "Push, pull, legs, and core are all covered across the week. Keep sessions consistent.",
          }
        : {
            tone: "neutral",
            title: "Routine is taking shape",
            text: "Cover push, pull, legs, and core across the week to get the most out of each session.",
          }
    );
  }

  return notes.slice(0, 3);
}

export function buildSessionIntent({ readiness = DEFAULT_READINESS, history = [], checkIns = [], muscleReadiness = [] }) {
  const sc = readinessScore(readiness);
  const deload = recommendDeload({ history, checkIns });
  const load = recentTrainingLoad(history);
  const recentPain = checkIns.some(ci =>
    ci.kind === "set_feedback" && ci.feeling === "pain" &&
    (Date.now() - (ci.timestamp || 0)) < 7 * 86400000
  );
  const soreMuscles    = muscleReadiness.filter(m => m.state === "sore").map(m => m.label || m.muscle);
  const recoveringMuscles = muscleReadiness.filter(m => m.state === "recovering").map(m => m.label || m.muscle);
  const readyCount     = muscleReadiness.filter(m => m.state === "ready").length;
  const totalCount     = muscleReadiness.length;

  if (recentPain) return {
    label:"Caution Session",
    note:"Pain was flagged recently. Load is reduced and swaps are available.",
    tone:"caution",
  };
  if (deload.recommended) return {
    label:"Adaptive Deload Active",
    note:"Volume reduced to improve recovery. " + (deload.reason || "Weekly fatigue is elevated."),
    tone:"deload",
  };
  if (load.status === "high" && sc <= -1) return {
    label:"Recovery Session",
    note:"High training frequency and lower energy today. Keeping volume moderate.",
    tone:"caution",
  };
  if (sc <= -2) return {
    label:"Recovery Session",
    note:"Energy is low today. Targets are reduced — focus on clean movement.",
    tone:"caution",
  };
  if (soreMuscles.length >= 2) return {
    label:"Recovery-Focused Session",
    note:`${soreMuscles.slice(0, 2).join(" and ")} fatigue still elevated. Coach has adjusted accordingly.`,
    tone:"caution",
  };
  if (sc >= 2 && readyCount === totalCount && totalCount > 0) return {
    label:"Performance Session",
    note:"Energy is high and all target muscles are recovered. Push clean top sets.",
    tone:"boost",
  };
  if (sc >= 1 && readyCount >= Math.ceil(totalCount * 0.7)) return {
    label:"Performance Session",
    note:"Recovery looks strong today. Good conditions for quality work.",
    tone:"boost",
  };
  if (recoveringMuscles.length > 0 && sc >= 0) return {
    label:"Balanced Session",
    note:`${recoveringMuscles[0]} is still recovering — targets are balanced around that.`,
    tone:"neutral",
  };
  return {
    label:"Balanced Session",
    note:"Energy and recovery are both stable. Targets set to match.",
    tone:"neutral",
  };
}

export function buildCoachPlan({ workout, history, checkIns = [], exConfig, settings, readiness, userProfile = null, goals = [], bodyMetrics = [] }) {
  const score = readinessScore(readiness);
  const tier = ageTier(userProfile);
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
  const painBlocked = painBlockedExercises(checkIns);
  if (latestWorkoutFeedback?.feeling === "hard") adjustments.push("Last workout was hard: trim one set if form fades.");
  if (latestWorkoutFeedback?.feeling === "pain") adjustments.push("Last workout had pain: use swaps early and keep reps smooth.");
  if (latestWorkoutFeedback?.feeling === "easy") adjustments.push("Last workout was easy: chase cleaner top-end reps before adding load.");
  if (deload.recommended) adjustments.unshift(`Deload signal: ${deload.reason}`);
  const blockedToday = workout.exercises.filter(ex => painBlocked.includes(ex.name) || painBlocked.includes(ex.originalName || ex.name)).map(ex => ex.name);
  if (blockedToday.length) adjustments.unshift(`Safety block: ${blockedToday.slice(0,2).join(" / ")} has repeated pain flags. Swap or skip today.`);

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
    exConfig,
  })).find(item => item.enabled && item.note) : null);

  cards.push({
    icon: score >= 2 ? "bolt" : score <= -2 ? "target" : "robot",
    cat: "Smith",
    msg: `${readinessLabel(readiness)}. ${focus}`,
  });

  adjustments.slice(0, 2).forEach(msg => cards.push({ icon: "compass", cat: "Plan", msg }));
  if (science) cards.push({ icon:"flask", cat:"Science", msg:`${science.label}: ${science.note}${science.est1RM ? ` Est. 1RM: ${science.est1RM}lbs.` : ""}` });
  jointNotes.slice(0, 1).forEach(msg => cards.push({ icon:"shield", cat:"Joints", msg }));
  behavior.notes.slice(0, 2).forEach(msg => cards.push({ icon:"clock", cat:"Habits", msg }));
  if (deload.recommended) cards.push({ icon:"arrow-down", cat:"Deload", msg:`${deload.reason} Keep reps smooth and leave extra reps in reserve.` });
  substitutions.forEach(sub => cards.push({ icon: "refresh", cat: "Swap", msg: `${sub.exercise}: use ${sub.substitute} if ${sub.reason}.` }));
  blockedToday.slice(0, 2).forEach(name => cards.push({ icon:"shield", cat:"Safety", msg:`${name}: repeated pain flags. Avoid loading this until pain-free.` }));
  watch.forEach(msg => cards.push({ icon: "eye", cat: "Watch", msg }));

  // Age-tier coaching tone
  if (tier.coachFocus === "joint_health") {
    cards.push({ icon:"heart", cat:"Longevity", msg:"Prioritize full range of motion and clean eccentric control over load. Joint health compounds like interest." });
    if (!deload.recommended) cards.push({ icon:"refresh", cat:"Recovery", msg:`At ${tier.label} recovery takes longer. Full rest between sets pays back in session quality.` });
  } else if (tier.coachFocus === "consistency") {
    cards.push({ icon:"trend-up", cat:"Build", msg:"Consistency over intensity. Three quality sessions beats six grind sessions every time." });
  } else if (tier.coachFocus === "pr" && score >= 1) {
    cards.push({ icon:"barbell", cat:"Push", msg:"Energy is high — push the top set on your best movement today and chase the rep PR." });
  }

  // Goal alignment — flag if today's exercises match an active goal
  const activeGoals = (Array.isArray(goals) ? goals : []).filter(g => !g.achieved);
  activeGoals.forEach(goal => {
    if (!goal.exerciseName) return;
    const hit = workout.exercises.some(ex => ex.name === goal.exerciseName || (ex.originalName || ex.name) === goal.exerciseName);
    if (hit) {
      const pct = exConfig[goal.exerciseName]?.weight
        ? Math.round((exConfig[goal.exerciseName].weight / goal.targetValue) * 100)
        : null;
      const pctStr = pct != null ? ` (${pct}% of goal)` : "";
      cards.push({ icon:"target", cat:"Goal", msg:`${goal.exerciseName} is in today's session — goal target: ${goal.targetValue}${goal.type==="weight"?"lb":goal.type==="reps"?" reps":" sessions"}${pctStr}.` });
    }
  });

  // Mesocycle phase context
  const phase = mesocyclePhase(history);
  cards.push({ icon:"calendar", cat:"Phase", msg:`${phase.label} — ${phase.hint}` });

  // Body weight note (if tracked)
  const sortedMetrics = [...(Array.isArray(bodyMetrics) ? bodyMetrics : [])].filter(m => m.weight).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
  if (sortedMetrics.length >= 2) {
    const trend = Math.round((sortedMetrics[0].weight - sortedMetrics[sortedMetrics.length-1].weight) * 10) / 10;
    if (trend !== 0) {
      cards.push({ icon:"scale", cat:"Body", msg:`Weight ${trend > 0 ? "up" : "down"} ${Math.abs(trend)}lb since you started tracking. ${trend < 0 ? "Maintain protein to protect muscle." : "Normal during a gaining phase."}` });
    }
  }

  return {
    readinessScore: score,
    headline: score >= 2 ? "Attack the work" : score <= -2 ? "Train, don't drain" : "Strike true",
    focus,
    adjustments,
    science,
    behavior,
    substitutions,
    cards,
  };
}

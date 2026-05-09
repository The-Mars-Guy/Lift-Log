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

export function buildCoachPlan({ workout, history, exConfig, settings, readiness }) {
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

  cards.push({
    icon: score >= 2 ? "⚡" : score <= -2 ? "🎯" : "🧠",
    cat: "Coach",
    msg: `${readinessLabel(readiness)}. ${focus}`,
  });

  adjustments.slice(0, 2).forEach(msg => cards.push({ icon: "🧭", cat: "Plan", msg }));
  watch.forEach(msg => cards.push({ icon: "👁️", cat: "Watch", msg }));

  return {
    readinessScore: score,
    headline: score >= 2 ? "Attack the work" : score <= -2 ? "Train, don't drain" : "Clean reps first",
    focus,
    adjustments,
    cards,
  };
}

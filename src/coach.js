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

export const SUBSTITUTIONS = {
  "Arnold Press": { name: "Lateral Raise", reason: "shoulder-friendly pressing alternative" },
  "Reverse Lunge": { name: "Glute Bridge", reason: "lower knee stress while keeping glutes working" },
  "Romanian Deadlift": { name: "Hip Thrust", reason: "less lower-back demand today" },
  "Rear Delt Row": { name: "Rear Delt Fly", reason: "lighter upper-back isolation" },
  "Tricep Kickback": { name: "Close-Grip Floor Press", reason: "more stable triceps work" },
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
  const substitutions = suggestSubstitutions({ workout, history, exConfig, readiness }).slice(0, 2);

  cards.push({
    icon: score >= 2 ? "⚡" : score <= -2 ? "🎯" : "🧠",
    cat: "Coach",
    msg: `${readinessLabel(readiness)}. ${focus}`,
  });

  adjustments.slice(0, 2).forEach(msg => cards.push({ icon: "🧭", cat: "Plan", msg }));
  substitutions.forEach(sub => cards.push({ icon: "🔁", cat: "Swap", msg: `${sub.exercise}: use ${sub.substitute} if ${sub.reason}.` }));
  watch.forEach(msg => cards.push({ icon: "👁️", cat: "Watch", msg }));

  return {
    readinessScore: score,
    headline: score >= 2 ? "Attack the work" : score <= -2 ? "Train, don't drain" : "Clean reps first",
    focus,
    adjustments,
    substitutions,
    cards,
  };
}

export function suggestSubstitutions({ workout, history = [], exConfig = {}, readiness = DEFAULT_READINESS }) {
  const sore = readiness?.soreness === "sore";
  return workout.exercises
    .map(ex => {
      const target = exConfig[ex.name]?.targetReps ?? ex.baseReps;
      const trend = exerciseTrend(history, ex, target);
      const swap = SUBSTITUTIONS[ex.name];
      if (!swap) return null;
      if (sore || trend.status === "stalling") {
        return { exercise: ex.name, substitute: swap.name, reason: sore ? swap.reason : "this movement has been stalling" };
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
  const allHit = setLog.length > 0 && setLog.every(l => (l.reps || 0) >= targetReps);
  const anyFail = setLog.some(l => (l.reps || 0) < Math.round(targetReps * 0.75));
  const cleanSessions = allHit ? (previous.cleanSessions || 0) + 1 : 0;
  const missSessions = anyFail ? (previous.missSessions || 0) + 1 : 0;
  const requiredCleanSessions = style === "aggressive" ? 1 : style === "conservative" ? 3 : 2;

  if (autoDeload && missSessions >= 2) {
    return {
      action: "deload",
      nextWeight: Math.max(Math.round((currentWeight - increment) * 4) / 4, increment),
      cleanSessions,
      missSessions,
      note: "Repeated misses. Reduce load and rebuild clean reps.",
    };
  }

  if (cleanSessions >= requiredCleanSessions) {
    return {
      action: "increase",
      nextWeight: Math.round((currentWeight + increment) * 4) / 4,
      cleanSessions: 0,
      missSessions: 0,
      note: `${requiredCleanSessions} clean session${requiredCleanSessions === 1 ? "" : "s"}. Ready to progress.`,
    };
  }

  return {
    action: "maintain",
    nextWeight: currentWeight,
    cleanSessions,
    missSessions,
    note: allHit ? "Clean session logged. Repeat before increasing." : "Keep the same load.",
  };
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
    return {
      reps: acc.reps + reps,
      volume: acc.volume + volume,
      sets: acc.sets + setLog.length,
      hardest,
    };
  }, { reps: 0, volume: 0, sets: 0, hardest: null });

  const score = readinessScore(readiness);
  const coachNote = score <= -2
    ? "Good call keeping the session controlled. Recovery days still count."
    : totals.hardest?.completion < 0.9
      ? `${totals.hardest.name} was the limiter today. Keep it steady next time.`
      : prs.length
        ? "Strong session. The next plan can afford a small progression."
        : "Clean work. Keep stacking sessions and let the trend build.";

  return { ...totals, duration, prs, coachNote, nextWorkout };
}

export function buildCoachMemory({ history = [], checkIns = [], exercises = [], exConfig = {} }) {
  const readinessEntries = checkIns.filter(ci => ci.kind === "readiness" && ci.readiness);
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
    return { name: ex.name, trend: trend.status, maxWeight, latestReps };
  });

  const strongest = [...exerciseStats].sort((a,b)=>b.maxWeight-a.maxWeight)[0];
  const stalling = exerciseStats.filter(ex => ex.trend === "stalling");
  const progressing = exerciseStats.filter(ex => ex.trend === "ready");
  const inconsistent = stalling[0] || exerciseStats.find(ex => ex.trend === "building");
  const focus = stalling[0]?.name || progressing[0]?.name || inconsistent?.name || exercises[0]?.name || "consistency";

  return {
    commonEnergy,
    readinessCount: readinessEntries.length,
    strongest,
    stalling,
    progressing,
    inconsistent,
    focus,
    summary: stalling.length
      ? `${stalling[0].name} needs steadier reps before increasing load.`
      : progressing.length
        ? `${progressing[0].name} is trending well. It may be ready for progression.`
        : "The coach is still collecting enough sessions to see a clear pattern.",
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

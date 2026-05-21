import { ageTier, normalizeUserProfile } from "../data.js";
import { behaviorMemory, exerciseTrend, latestMuscleSoreness, muscleRecoveryStats } from "./progression.js";

export function buildCoachMemory({ history = [], checkIns = [], exercises = [], exConfig = {}, userProfile = null, goals = [], bodyMetrics = [] }) {
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

  // Profile context
  const profile = normalizeUserProfile(userProfile);
  const tier = ageTier(profile);
  const profileNote = profile.age
    ? `${tier.label} lifter${profile.sex ? `, ${profile.sex}` : ""}${profile.trainingExperience ? `, ${profile.trainingExperience}` : ""}${profile.limitations?.length ? `, limitations: ${profile.limitations.join("/")}` : ""}.`
    : null;

  // Active goals summary
  const activeGoals = (Array.isArray(goals) ? goals : []).filter(g => !g.achieved);
  const goalNote = activeGoals.length
    ? `${activeGoals.length} active goal${activeGoals.length > 1 ? "s" : ""}: ${activeGoals.slice(0,2).map(g => `${g.exerciseName || "sessions"} → ${g.targetValue}${g.type==="weight"?"lb":g.type==="reps"?" reps":" sessions"}`).join(", ")}.`
    : null;

  // Body weight context
  const sortedMetrics = [...(Array.isArray(bodyMetrics) ? bodyMetrics : [])].filter(m => m.weight).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
  const weightNote = sortedMetrics.length >= 2
    ? `Body weight: ${sortedMetrics[0].weight}lb (${Math.round((sortedMetrics[0].weight - sortedMetrics[sortedMetrics.length-1].weight)*10)/10 > 0 ? "+" : ""}${Math.round((sortedMetrics[0].weight - sortedMetrics[sortedMetrics.length-1].weight)*10)/10}lb trend).`
    : sortedMetrics[0]?.weight ? `Latest weight: ${sortedMetrics[0].weight}lb.` : null;

  const fullSummary = [
    stillSore.length
      ? `${stillSore.slice(0, 3).join(", ")} ${stillSore.length === 1 ? "is" : "are"} flagged sore right now. Ease or swap work for those muscles.`
      : painFlags.length
      ? `${painFlags[0].name} has been flagged for discomfort. Bias toward swaps or lighter work there.`
      : stalling.length
      ? `${stalling[0].name} needs steadier reps before increasing load.`
      : progressing.length
        ? `${progressing[0].name} is trending well. May be ready for progression.`
        : "Still collecting enough sessions to see a clear pattern.",
    profileNote,
    goalNote,
    weightNote,
  ].filter(Boolean).join(" ");

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
    profileNote,
    goalNote,
    weightNote,
    summary: fullSummary,
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

const _INSIGHT_MUSCLES = ["chest","lats","upperBack","sideDelts","biceps","triceps","quads","hamstrings","glutes","calves","core"];

export function buildCoachInsights({ history = [], exercises = [], exConfig = {}, checkIns = [], userProfile = null, goals = [], bodyMetrics = [] }) {
  const now = Date.now();

  // Muscle recency: days since last trained (null = never)
  const muscleLastTrained = {};
  _INSIGHT_MUSCLES.forEach(m => { muscleLastTrained[m] = null; });

  [...history]
    .sort((a,b) => (b.timestamp||0) - (a.timestamp||0))
    .forEach(session => {
      const daysAgo = Math.round((now - (session.timestamp||0)) / 86400000);
      (session.exercises||[]).forEach(logged => {
        const base = exercises.find(e =>
          e.name === (logged.originalName || logged.substitutedFor || logged.name));
        if (!base) return;
        [...(base.primary||[]), ...(base.secondary||[])].forEach(m => {
          if (_INSIGHT_MUSCLES.includes(m) && muscleLastTrained[m] === null) {
            muscleLastTrained[m] = daysAgo;
          }
        });
      });
    });

  const weakPoints = detectWeakPoints({ history, exercises, exConfig });

  // Stale: muscles not trained in 5+ days (or never)
  const stale = _INSIGHT_MUSCLES
    .map(m => ({ muscle:m, days:muscleLastTrained[m] }))
    .filter(item => item.days === null || item.days > 5)
    .sort((a,b) => (b.days===null?999:b.days) - (a.days===null?999:a.days));

  // Current soreness from check-ins
  const muscleSoreness = latestMuscleSoreness(checkIns);
  const soreMuscles = Object.entries(muscleSoreness).filter(([,l]) => l === "sore").map(([m]) => m);

  // Profile context
  const tier = ageTier(userProfile);
  const profile = normalizeUserProfile(userProfile);

  // Active goals
  const activeGoals = (Array.isArray(goals) ? goals : []).filter(g => !g.achieved);

  // Body weight
  const sortedMetrics = [...(Array.isArray(bodyMetrics) ? bodyMetrics : [])].filter(m => m.weight).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
  const latestWeight = sortedMetrics[0]?.weight ?? null;

  const suggestion = soreMuscles.length
    ? `${soreMuscles[0]} is sore — avoid loading it today.`
    : stale.length
      ? stale[0].days === null
        ? `${stale[0].muscle} has no recent work — add a movement targeting it.`
        : `${stale[0].muscle} last hit ${stale[0].days}d ago — work it in this week.`
      : null;

  return { muscleLastTrained, weakPoints, suggestion, stale, muscleSoreness, soreMuscles, tier, profile, activeGoals, latestWeight };
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

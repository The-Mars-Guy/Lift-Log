import { useMemo } from "react";
import {
  MUSCLE_LABELS, DEFAULT_WEIGHTS,
  ageAdjustedRestSeconds, cleanAvailableWeights, snapWeight,
  exerciseConfigKey, exerciseConfigFor,
} from "../../data.js";
import {
  buildCoachMemory, buildCoachPlan, buildSessionIntent,
  coachSetCount, coachTargetReps, DEFAULT_READINESS,
  sciencePrescription,
} from "../../coach.js";
import { useSessionTimer } from "../../hooks.js";

/**
 * Encapsulates all rep/set/weight target calculations, progress counters,
 * coach memos, and muscle-readiness derived state.
 *
 * Inputs: raw app state slices + workoutPlan (already substitution-applied).
 * Returns: stable getter functions + computed metrics.
 * No useState — all output is derived, reactive via useMemo/useSessionTimer.
 */
export function useWorkoutProgression({
  workoutPlan,
  exConfig,
  sets,
  history,
  checkIns,
  settings,
  progression,
  userProfile,
  goals,
  bodyMetrics,
  sessionKey,
  dbLoading,
  workout,
  isCompleted,
}) {
  // ── Readiness / rest ────────────────────────────────────────────────────
  const readinessEntry = useMemo(
    () => (checkIns || []).find(ci => ci.kind === "readiness" && ci.sessionKey === sessionKey),
    [checkIns, sessionKey]
  );
  const effectiveReadiness = readinessEntry?.readiness || DEFAULT_READINESS;
  const effectiveRest = useMemo(
    () => ageAdjustedRestSeconds(userProfile, settings.restSeconds || 60),
    [userProfile, settings.restSeconds]
  );

  // ── Coach memos (expensive — only recompute when inputs change) ─────────
  const coachPlan = useMemo(
    () => buildCoachPlan({ workout, history, checkIns, exConfig, settings, readiness: effectiveReadiness, userProfile, goals, bodyMetrics }),
    [workout, history, checkIns, exConfig, settings, effectiveReadiness, userProfile, goals, bodyMetrics]
  );
  const coachMemory = useMemo(
    () => buildCoachMemory({ history, checkIns, exercises: workout.exercises, exConfig, userProfile, goals, bodyMetrics }),
    [history, checkIns, exConfig, workout, userProfile, goals, bodyMetrics]
  );

  // ── Key / config helpers (pure fns, stable per render) ──────────────────
  const exerciseKey   = (exOrName) => typeof exOrName === "string" ? exOrName : (exOrName.configName || exOrName.name);
  const exerciseIdFor = (ex) => ex.id || exerciseKey(ex).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const configKey     = (exOrName) => exerciseConfigKey(exOrName);
  const getConfig     = (exOrName) => exerciseConfigFor(exConfig, exOrName) || {};

  // ── Target getters ───────────────────────────────────────────────────────
  const getBaseTargetReps = (ex) =>
    getConfig(ex)?.targetReps ?? (ex.baseReps + (progression[exerciseKey(ex)]?.repBonus || 0));

  const getScience = (ex) =>
    sciencePrescription({ exercise: ex, history, checkIns, settings, readiness: effectiveReadiness, baseTarget: getBaseTargetReps(ex), exConfig });

  const getTargetReps = (ex) => {
    const science = getScience(ex);
    return science.enabled ? science.targetReps : coachTargetReps(getBaseTargetReps(ex), effectiveReadiness);
  };

  const getSetCount = (ex) => {
    const science = getScience(ex);
    return science.enabled ? science.sets : coachSetCount(ex.sets, effectiveReadiness);
  };

  const getWeight = (n) => {
    const name = exerciseKey(n);
    const configured = getConfig(n)?.weight ?? DEFAULT_WEIGHTS[name] ?? settings.dumbbellWeight;
    if (typeof n !== "string") {
      const science = getScience(n);
      if (science.suggestedWeight && science.suggestedWeight > 0) return science.suggestedWeight;
    }
    return configured;
  };

  const getNextW   = (n) => getConfig(n)?.nextWeight;
  const getMaxTest = (n) => getConfig(n)?.maxRepsTest;

  // ── Weight stepping ──────────────────────────────────────────────────────
  const ownedWeights = (settings.equipmentProfile || "fixed_dumbbells") === "fixed_dumbbells"
    ? cleanAvailableWeights(settings.availableWeights)
    : [];

  const stepWeight = (current, dir) => {
    const cur = Math.max(Number(current) || 0, 0);
    if (ownedWeights.length) return snapWeight(cur, ownedWeights, dir > 0 ? "up" : "down");
    const inc = settings.weightIncrement || 1;
    return Math.max(cur + dir * inc, 0);
  };

  // ── Progress counters ────────────────────────────────────────────────────
  const setKey  = (i, j) => `${sessionKey}_${i}_${j}`;
  const setDone = (i, j) => !!sets[setKey(i, j)];

  const exDone     = (i) => Array.from({ length: getSetCount(workoutPlan.exercises[i]) }, (_, j) => setDone(i, j)).every(Boolean);
  const totalSets  = workoutPlan.exercises.reduce((a, e) => a + getSetCount(e), 0);
  const doneSets   = workoutPlan.exercises.reduce(
    (a, ex, i) => a + Array.from({ length: getSetCount(ex) }, (_, j) => setDone(i, j) ? 1 : 0).reduce((x, y) => x + y, 0),
    0
  );
  const allDone        = !dbLoading && doneSets === totalSets;
  const sessionRunning = doneSets > 0 && !isCompleted;
  const sessionElapsed = useSessionTimer(sessionRunning);
  const remainingSets  = Math.max(0, totalSets - doneSets);
  const estimatedRemaining = remainingSets
    ? (remainingSets * 35) + (Math.max(0, remainingSets - 1) * effectiveRest)
    : 0;

  // ── History lookup ───────────────────────────────────────────────────────
  const getPreviousPerformance = (ex) => {
    const key = exerciseKey(ex);
    const session = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .find(h => h.exercises?.some(item =>
        (item.originalName || item.substitutedFor || item.name) === key || item.name === key));
    const logged = session?.exercises?.find(item =>
      (item.originalName || item.substitutedFor || item.name) === key || item.name === key);
    if (!logged?.setLog?.length) return null;
    const totalReps = logged.setLog.reduce((s, l) => s + (l.reps || 0), 0);
    const best = [...logged.setLog].sort((a, b) => (b.reps || 0) - (a.reps || 0))[0];
    return { sets: logged.setLog.length, totalReps, bestReps: best?.reps || 0, bestWeight: best?.weight || 0, date: session.date };
  };

  // ── Derived display state ────────────────────────────────────────────────
  const progressionPreview = useMemo(() => workoutPlan.exercises.flatMap(ex => {
    const science = getScience(ex);
    const prev    = getPreviousPerformance(ex);
    const items   = [];
    const curW = getWeight(ex);
    const nextW = getNextW(ex);
    if (nextW && nextW > curW)           items.push({ icon: "↑", text: `${ex.name}: try ${nextW}lbs if warm-ups feel clean.` });
    if (science.variation?.level > 1)    items.push({ icon: "↗", text: `${ex.name}: use ${science.variation.name} to make fixed weight harder.` });
    if (science.tempo)                   items.push({ icon: "T", text: `${ex.name}: tempo ${science.tempo.code} today.` });
    if (prev)                            items.push({ icon: "=", text: `${ex.name}: last time ${prev.totalReps} reps total; match or beat cleanly.` });
    return items.slice(0, 1);
  }), [workoutPlan, history, exConfig, progression, settings, checkIns, effectiveReadiness]); // eslint-disable-line

  const streak = useMemo(() => {
    if (!history.length) return 0;
    const s = [...history].sort((a, b) => b.timestamp - a.timestamp);
    let r = 1;
    for (let i = 1; i < s.length; i++) {
      if ((s[i - 1].timestamp - s[i].timestamp) / 86400000 <= 4.5) r++;
      else break;
    }
    return r;
  }, [history]);

  const muscleReadiness = useMemo(() => {
    const muscles = [...new Set(workoutPlan.exercises.flatMap(ex => ex.primary || []))];
    if (!muscles.length) return [];
    const soreness = {};
    [...checkIns].filter(ci => ci.kind === "muscle_soreness" && ci.muscle && ci.level)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .forEach(ci => { if (!soreness[ci.muscle]) soreness[ci.muscle] = ci.level; });
    const now = Date.now();
    return muscles.slice(0, 6).map(m => {
      const last = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .find(h => h.exercises?.some(ex => (ex.primary || []).includes(m) || (ex.secondary || []).includes(m)));
      const hoursSince = last ? (now - (last.timestamp || 0)) / 3600000 : 999;
      const sore  = soreness[m];
      const state = sore === "sore" ? "sore" : (sore === "mild" || hoursSince < 36) ? "recovering" : "ready";
      return { muscle: m, state };
    });
  }, [workoutPlan, history, checkIns]);

  const sessionIntent = useMemo(() => {
    const labeled = muscleReadiness.map(m => ({ ...m, label: MUSCLE_LABELS[m.muscle] || m.muscle }));
    return buildSessionIntent({ readiness: effectiveReadiness, history, checkIns, muscleReadiness: labeled });
  }, [effectiveReadiness, history, checkIns, muscleReadiness]);

  return {
    // readiness / rest
    effectiveReadiness, effectiveRest,
    // coach
    coachPlan, coachMemory,
    // key helpers
    exerciseKey, exerciseIdFor, configKey, getConfig,
    // target getters
    getScience, getTargetReps, getSetCount, getWeight, getNextW, getMaxTest,
    getBaseTargetReps,
    // weight stepping
    ownedWeights, stepWeight,
    // progress
    exDone, totalSets, doneSets, allDone,
    sessionRunning, sessionElapsed,
    remainingSets, estimatedRemaining,
    // history
    getPreviousPerformance,
    // display
    progressionPreview, streak, muscleReadiness, sessionIntent,
  };
}

import { EXERCISE_LIBRARY, MUSCLE_COVERAGE_GROUPS, MUSCLE_LABELS, ageTier, exerciseId, exerciseIsRisky, exerciseRiskJoints, normalizeUserProfile, routineBalanceScore, routineCoverage } from "../data.js";
import { behaviorMemory, painBlockedExercises, recentTrainingLoad } from "./progression.js";

function _pickFillExercise(muscleGroupKey, currentIds, userProfile, equipment = "all", exerciseLibrary = EXERCISE_LIBRARY) {
  const safe = normalizeUserProfile(userProfile);
  const muscles = MUSCLE_COVERAGE_GROUPS.find(([k]) => k === muscleGroupKey)?.[2] || [];
  let candidates = exerciseLibrary.filter(ex =>
    ex.primary?.some(m => muscles.includes(m)) &&
    !currentIds.includes(ex.id) &&
    !exerciseIsRisky(ex.name, safe.limitations)
  );
  if (equipment !== "all") {
    const withEquip = candidates.filter(ex => ex.equipment === equipment);
    if (withEquip.length) candidates = withEquip;
  }
  // prefer age-friendly and beginner difficulty
  return candidates.find(ex => ex.ageFriendly && ex.difficulty === "beginner")
    || candidates.find(ex => ex.ageFriendly)
    || candidates[0]
    || null;
}

function _pickSafeSwap(exName, currentIds, userProfile, exerciseLibrary = EXERCISE_LIBRARY) {
  const safe = normalizeUserProfile(userProfile);
  const source = exerciseLibrary.find(e => e.name === exName || e.id === exerciseId(exName));
  if (!source) return null;
  const muscles = source.primary || [];
  return exerciseLibrary.find(e =>
    e.id !== source.id &&
    !currentIds.includes(e.id) &&
    !exerciseIsRisky(e.name, safe.limitations) &&
    e.primary?.some(m => muscles.includes(m)) &&
    e.ageFriendly
  ) || null;
}

export function routineEditSuggestions({ routine, exercises = [], allExercises = null, history = [], checkIns = [], userProfile = null, exerciseLibrary = EXERCISE_LIBRARY }) {
  const suggestions = [];
  const currentIds = exercises.map(ex => ex.id || exerciseId(ex.name));
  // Coverage + balance evaluate against the full week (all routines union)
  // when provided, so split routines don't read as unbalanced individually.
  // Other checks (pain, risk, practice) still operate on the active routine.
  const weekExercises = Array.isArray(allExercises) && allExercises.length ? allExercises : exercises;
  const weekIds = weekExercises.map(ex => ex.id || exerciseId(ex.name));
  const coverage = routineCoverage(weekExercises);
  const balance = routineBalanceScore(weekExercises);

  // 1. Coverage gaps → suggest exact exercise to add
  coverage.filter(item => !item.ok).forEach(item => {
    const fill = _pickFillExercise(item.key, weekIds, userProfile, "all", exerciseLibrary);
    suggestions.push({
      type:"add",
      priority:3,
      title:`Add ${item.label}`,
      detail: fill
        ? `Missing ${item.label.toLowerCase()}. Try: ${fill.name} — ${fill.tip?.split(",")[0]}.`
        : `Routine needs at least one ${item.label.toLowerCase()} movement.`,
      actionType:"add",
      actionId: fill?.id || null,
      actionLabel: fill ? `+ Add ${fill.name}` : null,
    });
  });

  // 2. Pain-blocked exercises → suggest specific safe swap
  const blocked = painBlockedExercises(checkIns);
  exercises.filter(ex => blocked.includes(ex.name) || blocked.includes(ex.id)).forEach(ex => {
    const swap = _pickSafeSwap(ex.name, currentIds.filter(id => id !== ex.id), userProfile, exerciseLibrary);
    suggestions.push({
      type:"swap",
      priority:3,
      title:`Swap ${ex.name}`,
      detail: swap
        ? `Recent pain on this movement. Swap to ${swap.name} — same muscles, friendlier.`
        : "Recent pain on this movement. Pick a friendlier option for now.",
      actionType:"swap",
      actionId: swap?.id || null,
      swapFromId: ex.id || exerciseId(ex.name),
      actionLabel: swap ? `⇄ Swap → ${swap.name}` : null,
    });
  });

  // 3. Risky exercises already in routine (matching user limitations) → suggest swap
  if (userProfile) {
    const safe = normalizeUserProfile(userProfile);
    if (safe.limitations?.length) {
      exercises
        .filter(ex => exerciseIsRisky(ex.name, safe.limitations))
        .slice(0, 2)
        .forEach(ex => {
          const swap = _pickSafeSwap(ex.name, currentIds.filter(id => id !== ex.id), userProfile, exerciseLibrary);
          if (swap) {
            suggestions.push({
              type:"risk",
              priority:2,
              title:`${ex.name} — joint risk`,
              detail:`Flags your ${exerciseRiskJoints(ex.name).filter(l => safe.limitations.includes(l)).join("/")} limitation. Consider: ${swap.name} — same muscles, safer angle.`,
              actionType:"swap",
              actionId: swap.id,
              swapFromId: ex.id || exerciseId(ex.name),
              actionLabel: `⇄ Swap → ${swap.name}`,
            });
          }
        });
    }
  }

  // 4. Not-logged exercises — only meaningful when there's enough history to compare against
  if (history.length >= 4) {
    const used = new Set(history.slice(0, 6).flatMap(h => h.exercises || []).map(ex => ex.id || ex.plannedId || exerciseId(ex.name)));
    exercises.filter(ex => !used.has(ex.id)).slice(0, 1).forEach(ex => {
      suggestions.push({ type:"practice", priority:1, title:`Log ${ex.name}`, detail:"Not recorded in your last 4 sessions — log a set next time to track progress.", actionType:null, actionId:null });
    });
  }

  if (balance < 80) suggestions.push({ type:"balance", priority:2, title:"Improve balance", detail:`Balance ${balance}/100 — cover push, pull, legs, and core.`, actionType:null, actionId:null });
  if (routine?.avoidedExerciseIds?.length) suggestions.push({ type:"avoid", priority:1, title:"Avoid list active", detail:`${routine.avoidedExerciseIds.length} movement${routine.avoidedExerciseIds.length===1?"":"s"} hidden from picker.`, actionType:null, actionId:null });

  // 5. Age-tier: 50+ with no mobility exercises → suggest adding one
  const tier = ageTier(userProfile);
  if (tier.mobilityPriority) {
    const hasMobility = exercises.some(ex => ex.category === "mobility" || ex.folder === "Mobility");
    if (!hasMobility) {
      const mobilityEx = exerciseLibrary.find(ex => (ex.category === "mobility" || ex.folder === "Mobility") && !currentIds.includes(ex.id));
      suggestions.push({
        type:"mobility",
        priority:3,
        title:"Add mobility work",
        detail: mobilityEx
          ? `Recovery improves with mobility at 50+. Try: ${mobilityEx.name} — ${mobilityEx.tip?.split(",")[0]}.`
          : "Adding a mobility or stretch exercise helps joint health and recovery at 50+.",
        actionType:"add",
        actionId: mobilityEx?.id || null,
        actionLabel: mobilityEx ? `+ Add ${mobilityEx.name}` : null,
      });
    }
  }

  return suggestions.sort((a,b)=>b.priority-a.priority).slice(0, 6);
}

export function generateCoachRoutine({
  userProfile = null,
  settings = {},
  history = [],
  checkIns = [],
  goals = [],
  exConfig = {},
  targetCount = null,
  exerciseLibrary = EXERCISE_LIBRARY,
}) {
  const profile     = normalizeUserProfile(userProfile);
  const tier        = ageTier(profile);
  const experience  = profile.trainingExperience || "new";
  const limitations = profile.limitations || [];
  const goal        = settings.trainingGoal    || "general";
  const equip       = settings.equipmentProfile || "fixed_dumbbells";
  const mobility    = profile.mobilityLevel    || "normal";
  const sessionCount = history.length;
  const isNewUser   = sessionCount < 5;

  // ── Active user goals → boost matching exercises ───────────────────────────
  const activeGoals = (goals || []).filter(g => !g.achieved && g.exerciseName);
  const goalExerciseNames = new Set(activeGoals.map(g => g.exerciseName));
  const goalExerciseIds = new Set(activeGoals.map(g => exerciseId(g.exerciseName)));

  // ── Cumulative fatigue from last 7 days (replaces 18h binary flag) ─────────
  const load = recentTrainingLoad(history);
  const weeklySessions = load.sessions;
  const overreaching = weeklySessions >= 5;
  const undertrained_user = weeklySessions === 0 && sessionCount > 0;

  // ── Rest behavior signal ───────────────────────────────────────────────────
  const behavior = behaviorMemory(checkIns);
  const shortRester = behavior.avgRestSeconds > 0 && behavior.avgRestSeconds < 40;

  // ── Assessment-driven readiness (uses maxRepsTest from onboarding) ─────────
  const hasAssessment = Object.values(exConfig || {}).some(c => c?.maxRepsTest > 0);

  // ── History-aware analysis ─────────────────────────────────────────────────
  // Muscles trained in last 5 days
  const RECENCY_MS = 5 * 86400000;
  const recentSessions = history.filter(h => (Date.now() - (h.timestamp || 0)) < RECENCY_MS);
  const recentMuscles = new Set(
    recentSessions.flatMap(h => h.exercises || []).flatMap(ex => {
      const lib = exerciseLibrary.find(e => e.name === ex.name || e.id === (ex.id || exerciseId(ex.name)));
      return [...(lib?.primary || []), ...(lib?.secondary || [])];
    })
  );

  // Exercises done in last 2 sessions — avoid repeat for variety
  const recentExIds = new Set(
    history.slice(0, 2).flatMap(h => h.exercises || []).map(ex => ex.id || exerciseId(ex.name))
  );

  // Exercises with 2+ pain flags — strong avoid
  const painCounts = checkIns
    .filter(ci => ci.kind === "set_feedback" && ci.feeling === "pain" && ci.exercise)
    .reduce((acc, ci) => { acc[ci.exercise] = (acc[ci.exercise] || 0) + 1; return acc; }, {});
  const painFlagged = new Set(Object.entries(painCounts).filter(([,n]) => n >= 2).map(([name]) => name));

  const blocked = new Set([...painBlockedExercises(checkIns), ...painFlagged]);

  // Recent fatigue: last session < 18h ago OR overreaching → trim volume
  const lastSession  = history[0];
  const hoursSinceLast = lastSession ? (Date.now() - (lastSession.timestamp || 0)) / 3600000 : 999;
  const fatigued = hoursSinceLast < 18 || overreaching;

  // Undertrained muscles — not hit in last 5 days
  const allLibMuscles = [...new Set(exerciseLibrary.flatMap(ex => ex.primary || []))];
  const undertrained  = allLibMuscles.filter(m => !recentMuscles.has(m));

  // ── Exercise count ─────────────────────────────────────────────────────────
  let count = targetCount ?? (experience === "trained" ? 7 : experience === "returning" ? 6 : 5);
  if (fatigued)                      count = Math.max(4, count - 1);
  if (tier.ageFriendly && count > 6) count = 6;
  if (goal === "fatigue_friendly")   count = Math.min(count, 5);

  // ── Equipment preference ───────────────────────────────────────────────────
  const EQUIP_PREF = {
    gym_access:           ["barbell","machines","dumbbells","bodyweight","bands"],
    adjustable_dumbbells: ["dumbbells","bodyweight","bands","kettlebell"],
    fixed_dumbbells:      ["dumbbells","bodyweight","bands"],
  };
  const equipPref = EQUIP_PREF[equip] || EQUIP_PREF.fixed_dumbbells;

  // ── Difficulty ceiling ─────────────────────────────────────────────────────
  const diffOk = (d) => {
    if (experience === "trained")   return ["beginner","novice","intermediate"].includes(d);
    if (experience === "returning") return ["beginner","novice"].includes(d);
    return d === "beginner";
  };

  const selectedIds = new Set();
  const selected    = [];
  const pickReasons = {};

  // ── Unified exercise scorer ────────────────────────────────────────────────
  const scoreExercise = (ex) => {
    const ei = equipPref.indexOf(ex.equipment);
    let score = ei === -1 ? 99 : ei;
    if (!ex.ageFriendly)                                    score += tier.ageFriendly ? 6 : 2;
    if (ex.difficulty !== "beginner")                       score += 1;
    if (recentExIds.has(ex.id))                             score += 5;   // variety penalty
    if (ex.primary?.some(m => undertrained.includes(m)))    score -= 4;   // undertrained bonus
    if (isNewUser && ex.difficulty === "beginner")          score -= 1;
    if (mobility === "limited" && ex.ageFriendly)           score -= 1;
    if (goalExerciseIds.has(ex.id) || goalExerciseNames.has(ex.name)) score -= 6; // active goal boost
    if (shortRester && ex.difficulty === "intermediate")    score += 1;   // discourage demanding lifts for short-resters
    return score;
  };

  const pickForMuscles = (muscles) => {
    let candidates = exerciseLibrary.filter(ex =>
      ex.primary?.some(m => muscles.includes(m)) &&
      !selectedIds.has(ex.id) &&
      !exerciseIsRisky(ex.name, limitations) &&
      !blocked.has(ex.name) &&
      diffOk(ex.difficulty)
    );
    // Strong age filter for non-trained 50+ users
    if (tier.ageFriendly && experience !== "trained") {
      const safe = candidates.filter(ex => ex.ageFriendly);
      if (safe.length >= 2) candidates = safe;
    }
    candidates.sort((a, b) => scoreExercise(a) - scoreExercise(b));
    return candidates[0] || null;
  };

  // ── Goal-biased muscle priority ────────────────────────────────────────────
  const GOAL_MUSCLE_BIAS = {
    strength:         [["chest","triceps","frontDelts"],["lats","upperBack","biceps"],["quads","glutes","hamstrings"],["core","lowerBack"],["sideDelts"],["hamstrings"]],
    hypertrophy:      [["chest","triceps"],["lats","upperBack"],["quads","glutes"],["core"],["biceps"],["hamstrings","calves"],["sideDelts"],["rearDelts"]],
    fatigue_friendly: [["quads","glutes"],["chest"],["lats","upperBack"],["core"],["hamstrings"]],
    general:          [["chest","triceps"],["lats","upperBack"],["quads","glutes","hamstrings"],["core"],["sideDelts","biceps"],["hamstrings"]],
  };
  const musclePriority = GOAL_MUSCLE_BIAS[goal] || GOAL_MUSCLE_BIAS.general;

  for (const muscles of musclePriority) {
    if (selected.length >= count) break;
    const pick = pickForMuscles(muscles);
    if (pick) {
      const hitsUnder = pick.primary?.some(m => undertrained.includes(m));
      const isFresh   = !recentExIds.has(pick.id);
      const matchesGoal = goalExerciseIds.has(pick.id) || goalExerciseNames.has(pick.name);
      pickReasons[pick.id] = matchesGoal
        ? `direct match for your active goal`
        : hitsUnder
        ? `targets ${(pick.primary || []).filter(m => undertrained.includes(m)).map(m => MUSCLE_LABELS[m] || m).slice(0,2).join("/")} — not trained in 5+ days`
        : isFresh ? "rotated in for variety"
        : `core ${goal} movement`;
      selected.push(pick);
      selectedIds.add(pick.id);
    }
  }

  // Fill remaining slots
  if (selected.length < count) {
    const fillGroups = [
      ["quads","glutes","hamstrings"],["chest","frontDelts"],
      ["lats","upperBack"],["core"],["biceps"],["triceps"],
      ["sideDelts","rearDelts"],["calves","forearms"],
    ];
    for (const muscles of fillGroups) {
      if (selected.length >= count) break;
      const pick = pickForMuscles(muscles);
      if (pick) { pickReasons[pick.id] = "fills coverage gap"; selected.push(pick); selectedIds.add(pick.id); }
    }
  }

  // ── Rationale ──────────────────────────────────────────────────────────────
  const difficulty = experience === "trained" ? "novice" : "beginner";
  const goalLabel  = { strength:"Strength", hypertrophy:"Muscle", fatigue_friendly:"Tone", general:"General" }[goal] || "General";
  const date       = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });

  const goalMatched = selected.filter(ex => goalExerciseIds.has(ex.id) || goalExerciseNames.has(ex.name));
  const rationale = [
    `${selected.length} exercises for ${goalLabel.toLowerCase()} (${experience}, ${equip.replace("_"," ")}).`,
    activeGoals.length
      ? `Active goals: ${activeGoals.slice(0,2).map(g => g.exerciseName).join(", ")}${goalMatched.length ? ` — ${goalMatched.length} prioritized.` : "."}`
      : null,
    undertrained.length
      ? `Undertrained muscles targeted: ${undertrained.slice(0,3).map(m => MUSCLE_LABELS[m] || m).join(", ")}.`
      : "All major muscles hit recently — rotating for variety.",
    overreaching     ? `${weeklySessions} sessions in last 7 days — overreaching risk, volume trimmed.` : null,
    !overreaching && hoursSinceLast < 18 ? "Recent session detected — volume trimmed by 1 for recovery." : null,
    undertrained_user ? "No sessions this week — consider easing back in." : null,
    shortRester      ? `Average rest is ${behavior.avgRestSeconds}s — selection biased toward less demanding lifts.` : null,
    hasAssessment    ? "Assessment data on file — rep targets seeded from your test results." : null,
    tier.ageFriendly ? `Age-safe selection (${tier.label}) — lower-impact movements preferred.` : null,
    blocked.size     ? `Skipped ${blocked.size} pain-flagged movement${blocked.size===1?"":"s"}.` : null,
    limitations.length ? `Avoided stress on: ${limitations.join(", ")}.` : null,
    recentExIds.size > 0 && !isNewUser ? "Rotated out exercises from last 2 sessions for fresh stimulus." : null,
    ...selected.map(ex => pickReasons[ex.id] ? `• ${ex.name}: ${pickReasons[ex.id]}.` : null),
  ].filter(Boolean);

  return {
    name:        `Coach Plan · ${goalLabel} · ${date}`,
    exerciseIds: selected.map(ex => ex.id),
    difficulty,
    exercises:   selected,
    rationale,
  };
}

export function generateCoachProgram({
  userProfile = null,
  settings = {},
  history = [],
  checkIns = [],
  goals = [],
  numDays = null,
  exerciseLibrary = EXERCISE_LIBRARY,
}) {
  const profile    = normalizeUserProfile(userProfile);
  const experience = profile.trainingExperience || "new";
  const goal       = settings.trainingGoal || "general";
  const age        = Number(profile.age) || 30;
  const sex        = profile.sex || "";
  const weightLb   = Number(profile.weightLb) || 0;
  const mobility   = profile.mobilityLevel || "normal";
  const tier       = ageTier(profile);
  const limitations = profile.limitations || [];

  // Auto-determine training days from profile
  if (!numDays) {
    if (experience === "trained")   numDays = 4;
    else if (experience === "returning") numDays = 3;
    else numDays = 3;
    if (goal === "fatigue_friendly") numDays = Math.min(numDays, 3);
    if (tier.ageFriendly)           numDays = Math.min(numDays, 3);
    if (mobility === "limited")      numDays = Math.min(numDays, 3);
  }
  numDays = Math.max(1, Math.min(7, numDays));

  // Import FORGE names from data (already available in coach.js scope via data.js)
  const NAMES = ["Strike","Temper","Hone","Forge","Anneal","Quench","Draw"];

  // Day-split templates keyed by numDays
  // Each day has a focal muscle priority that overrides the goal bias
  const SPLIT_TEMPLATES = {
    1: [
      { name:NAMES[0], muscles:[["chest","triceps"],["lats","upperBack"],["quads","glutes"],["core"],["hamstrings"],["biceps"]] },
    ],
    2: [
      { name:NAMES[0], muscles:[["chest","triceps","frontDelts"],["sideDelts"],["lats","upperBack","biceps"],["core"]] },
      { name:NAMES[1], muscles:[["quads","glutes"],["hamstrings"],["calves"],["core","lowerBack"]] },
    ],
    3: [
      { name:NAMES[0], muscles:[["chest","triceps"],["frontDelts","sideDelts"],["core"]] },
      { name:NAMES[1], muscles:[["lats","upperBack"],["biceps"],["rearDelts"]] },
      { name:NAMES[2], muscles:[["quads","glutes"],["hamstrings"],["calves","core"]] },
    ],
    4: [
      { name:NAMES[0], muscles:[["chest","triceps"],["frontDelts","sideDelts"]] },
      { name:NAMES[1], muscles:[["quads","glutes"],["hamstrings","calves"]] },
      { name:NAMES[2], muscles:[["lats","upperBack"],["biceps","rearDelts"],["core"]] },
      { name:NAMES[3], muscles:[["chest","triceps"],["quads","glutes"],["core","lowerBack"]] },
    ],
    5: [
      { name:NAMES[0], muscles:[["chest","triceps"],["frontDelts"]] },
      { name:NAMES[1], muscles:[["lats","upperBack"],["biceps","rearDelts"]] },
      { name:NAMES[2], muscles:[["quads","glutes"],["hamstrings"]] },
      { name:NAMES[3], muscles:[["chest","sideDelts"],["frontDelts","triceps"]] },
      { name:NAMES[4], muscles:[["lats","upperBack"],["quads","glutes"],["core"]] },
    ],
  };

  const splitDays = SPLIT_TEMPLATES[Math.min(numDays, 5)] || SPLIT_TEMPLATES[3];

  // Schedule: spread days evenly across the week
  const WEEK_SLOTS = {
    1: ["Monday"],
    2: ["Monday","Thursday"],
    3: ["Monday","Wednesday","Friday"],
    4: ["Monday","Tuesday","Thursday","Friday"],
    5: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    6: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    7: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
  };
  const daySlots = WEEK_SLOTS[numDays] || WEEK_SLOTS[3];

  // Build per-day scoring context shared with generateCoachRoutine
  const load       = recentTrainingLoad(history);
  const behavior   = behaviorMemory(checkIns);
  const blocked    = new Set([...painBlockedExercises(checkIns)]);
  const RECENCY_MS = 5 * 86400000;
  const recentSessions = history.filter(h => (Date.now() - (h.timestamp || 0)) < RECENCY_MS);
  const recentMuscles  = new Set(
    recentSessions.flatMap(h => h.exercises || []).flatMap(ex => {
      const lib = exerciseLibrary.find(e => e.name === ex.name || e.id === (ex.id || exerciseId(ex.name)));
      return [...(lib?.primary || []), ...(lib?.secondary || [])];
    })
  );
  const recentExIds = new Set(
    history.slice(0, 2).flatMap(h => h.exercises || []).map(ex => ex.id || exerciseId(ex.name))
  );
  const activeGoals = (goals || []).filter(g => !g.achieved && g.exerciseName);
  const goalExerciseIds = new Set(activeGoals.map(g => exerciseId(g.exerciseName)));
  const goalExerciseNames = new Set(activeGoals.map(g => g.exerciseName));
  const equip = settings.equipmentProfile || "fixed_dumbbells";
  const EQUIP_PREF = {
    gym_access:           ["barbell","machines","dumbbells","bodyweight","bands"],
    adjustable_dumbbells: ["dumbbells","bodyweight","bands","kettlebell"],
    fixed_dumbbells:      ["dumbbells","bodyweight","bands"],
  };
  const equipPref = EQUIP_PREF[equip] || EQUIP_PREF.fixed_dumbbells;
  const shortRester = behavior.avgRestSeconds > 0 && behavior.avgRestSeconds < 40;
  const overreaching = load.sessions >= 5;
  const fatigued = (history[0] && (Date.now() - (history[0].timestamp || 0)) / 3600000 < 18) || overreaching;
  const allLibMuscles = [...new Set(exerciseLibrary.flatMap(ex => ex.primary || []))];
  const undertrained  = allLibMuscles.filter(m => !recentMuscles.has(m));
  const isNewUser     = history.length < 5;

  const diffOk = (d) => {
    if (experience === "trained")   return ["beginner","novice","intermediate"].includes(d);
    if (experience === "returning") return ["beginner","novice"].includes(d);
    return d === "beginner";
  };

  const scoreExercise = (ex) => {
    const ei = equipPref.indexOf(ex.equipment);
    let score = ei === -1 ? 99 : ei;
    if (!ex.ageFriendly)                                    score += tier.ageFriendly ? 6 : 2;
    if (ex.difficulty !== "beginner")                       score += 1;
    if (recentExIds.has(ex.id))                             score += 5;
    if (ex.primary?.some(m => undertrained.includes(m)))    score -= 4;
    if (isNewUser && ex.difficulty === "beginner")          score -= 1;
    if (mobility === "limited" && ex.ageFriendly)           score -= 1;
    if (goalExerciseIds.has(ex.id) || goalExerciseNames.has(ex.name)) score -= 6;
    if (shortRester && ex.difficulty === "intermediate")    score += 1;
    return score;
  };

  // Per-day selection: pick best exercises for a given muscle focus, avoid cross-day repeats
  const usedIds   = new Set();
  const routines  = splitDays.slice(0, numDays).map((dayTpl, i) => {
    let count = experience === "trained" ? 6 : experience === "returning" ? 5 : 5;
    if (fatigued)                      count = Math.max(3, count - 1);
    if (tier.ageFriendly && count > 5) count = 5;
    if (goal === "fatigue_friendly")   count = Math.min(count, 4);

    const selectedIds = new Set();
    const selected    = [];

    const pick = (muscles) => {
      let candidates = exerciseLibrary.filter(ex =>
        ex.primary?.some(m => muscles.includes(m)) &&
        !selectedIds.has(ex.id) &&
        !usedIds.has(ex.id) &&
        !blocked.has(ex.name) &&
        diffOk(ex.difficulty) &&
        !limitations.some(lim => (ex.joints || []).includes(lim))
      );
      if (tier.ageFriendly && experience !== "trained") {
        const safe = candidates.filter(ex => ex.ageFriendly);
        if (safe.length >= 2) candidates = safe;
      }
      candidates.sort((a, b) => scoreExercise(a) - scoreExercise(b));
      return candidates[0] || null;
    };

    // Fill from day's focal muscle groups
    for (const muscles of dayTpl.muscles) {
      if (selected.length >= count) break;
      const ex = pick(muscles);
      if (ex) { selected.push(ex); selectedIds.add(ex.id); }
    }

    // Fill remaining slots from general pools
    const fillPools = [["quads","glutes"],["chest","frontDelts"],["lats","upperBack"],["core"],["biceps"],["triceps"],["hamstrings"],["sideDelts","rearDelts"]];
    for (const muscles of fillPools) {
      if (selected.length >= count) break;
      const ex = pick(muscles);
      if (ex) { selected.push(ex); selectedIds.add(ex.id); }
    }

    // Add selected IDs to cross-day used set
    selected.forEach(ex => usedIds.add(ex.id));

    return {
      id: `day_${Date.now()}_${i}`,
      name: dayTpl.name,
      exerciseIds: selected.map(ex => ex.id),
    };
  });

  const schedule = {};
  daySlots.slice(0, numDays).forEach((day, i) => {
    if (routines[i]) schedule[day] = routines[i].id;
  });

  // Build rationale summary
  const goalLabel = { strength:"Strength", hypertrophy:"Muscle", fatigue_friendly:"Tone", general:"General Fitness" }[goal] || "General Fitness";
  const splitLabel = { 1:"Full Body", 2:"2-Day Split", 3:"Push/Pull/Legs", 4:"4-Day Split", 5:"5-Day Split" }[numDays] || `${numDays}-Day`;
  const date = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });
  const profileSummary = [
    age && `age ${age}`,
    sex && sex,
    weightLb && `${weightLb} lb`,
    experience !== "new" && experience,
    mobility !== "normal" && `mobility: ${mobility}`,
    limitations.length && `limitations: ${limitations.join(", ")}`,
  ].filter(Boolean).join(", ");

  const rationale = [
    `${splitLabel} · ${goalLabel} · ${numDays} day${numDays !== 1 ? "s" : ""}/week.`,
    profileSummary ? `Profile: ${profileSummary}.` : null,
    activeGoals.length ? `Goals considered: ${activeGoals.slice(0,2).map(g => g.exerciseName).join(", ")}.` : null,
    undertrained.length ? `Targeting undertrained areas: ${undertrained.slice(0,3).map(m => MUSCLE_LABELS[m]||m).join(", ")}.` : null,
    fatigued ? "Recent load detected — volume trimmed slightly for recovery." : null,
    tier.ageFriendly ? `Age-safe selection (${tier.label}) applied.` : null,
    blocked.size ? `${blocked.size} pain-flagged movement${blocked.size===1?"":"s"} excluded.` : null,
  ].filter(Boolean);

  return {
    name:      `Coach Program · ${goalLabel} · ${date}`,
    routines,
    schedule,
    rationale,
  };
}

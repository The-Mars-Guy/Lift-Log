import { getExerciseById, exerciseFolder, MUSCLE_COVERAGE_GROUPS, DAYS, FORGE_WORKOUT_NAMES } from "./exercises.js";
import { normalizeUserProfile, ageTier } from "./profile.js";

export const DEFAULT_CUSTOM_ROUTINE = {
  enabled:false,
  name:"My Program",
  difficulty:"beginner",
  exerciseIds:["box_squat", "wall_pushup", "supported_row", "glute_bridge", "dead_bug"],
  activeRoutineId:"day_1",
  routines:[
    { id:"day_1", name:"Strike", exerciseIds:["box_squat", "wall_pushup", "supported_row", "glute_bridge", "dead_bug"] },
  ],
  favoriteExerciseIds:[],
  avoidedExerciseIds:[],
  schedule:{ Monday:"day_1", Wednesday:"day_1", Friday:"day_1" },
  programs:[],
};

// ─── ROUTINE TEMPLATES ───────────────────────────────────────────────────────
// Each template defines a complete multi-day program with named days.
// defaultSchedule maps weekday names to routine IDs within the template.

export const ROUTINE_TEMPLATES = [
  {
    id:"beginner_3day",
    name:"Beginner Full Body",
    difficulty:"beginner",
    description:"Same balanced workout 3×/week — master the movements before splitting.",
    equipment:"bodyweight_dumbbells",
    routines:[
      { id:"a", name:"Strike", exerciseIds:["box_squat","wall_pushup","supported_row","glute_bridge","dead_bug"] },
    ],
    defaultSchedule:{ Monday:"a", Wednesday:"a", Friday:"a" },
  },
  {
    id:"older_adult",
    name:"Older Adult Starter",
    difficulty:"beginner",
    description:"Low-impact, joint-friendly movements — build strength safely.",
    equipment:"bodyweight_bands",
    routines:[
      { id:"a", name:"Strike", exerciseIds:["sit_to_stand","wall_pushup","band_row","glute_bridge","bird_dog"] },
    ],
    defaultSchedule:{ Monday:"a", Wednesday:"a", Friday:"a" },
  },
  {
    id:"low_impact",
    name:"Low Impact Strength",
    difficulty:"beginner",
    description:"Gentle strength work — ideal if mobility or joints need care.",
    equipment:"bodyweight_bands",
    routines:[
      { id:"a", name:"Strike", exerciseIds:["sit_to_stand","band_chest_press","band_row","seated_press","dead_bug"] },
    ],
    defaultSchedule:{ Monday:"a", Wednesday:"a", Friday:"a" },
  },
  {
    id:"dumbbell_ppl",
    name:"Dumbbell Push / Pull / Legs",
    difficulty:"novice",
    description:"Classic 3-day split — Push, Pull, and Legs with dumbbells.",
    equipment:"dumbbells",
    routines:[
      { id:"push", name:"Strike · Push", exerciseIds:["floor_press","arnold_press","lateral_raise","tricep_kickback","incline_pushup"] },
      { id:"pull", name:"Temper · Pull", exerciseIds:["bent_over_row","supported_one_arm_row","rear_delt_row","hammer_curl"] },
      { id:"legs", name:"Hone · Legs",   exerciseIds:["goblet_squat","romanian_deadlift","glute_bridge","calf_raise","dead_bug"] },
    ],
    defaultSchedule:{ Monday:"push", Wednesday:"pull", Friday:"legs" },
  },
  {
    id:"dumbbell_upper_lower",
    name:"Dumbbell Upper / Lower",
    difficulty:"novice",
    description:"4-day split alternating upper body and lower body.",
    equipment:"dumbbells",
    routines:[
      { id:"upper_a", name:"Strike · Upper",     exerciseIds:["floor_press","bent_over_row","arnold_press","hammer_curl","lateral_raise"] },
      { id:"lower_a", name:"Temper · Lower",     exerciseIds:["goblet_squat","romanian_deadlift","glute_bridge","step_up","dead_bug"] },
      { id:"upper_b", name:"Hone · Upper",       exerciseIds:["floor_press","supported_one_arm_row","rear_delt_row","tricep_kickback","hammer_curl"] },
      { id:"lower_b", name:"Forge · Lower",      exerciseIds:["romanian_deadlift","goblet_squat","glute_bridge","calf_raise","bird_dog"] },
    ],
    defaultSchedule:{ Monday:"upper_a", Tuesday:"lower_a", Thursday:"upper_b", Friday:"lower_b" },
  },
  {
    id:"machine_starter",
    name:"Machine Starter",
    difficulty:"beginner",
    description:"Simple full-body routine — all machines, no guessing.",
    equipment:"machines",
    routines:[
      { id:"a", name:"Strike", exerciseIds:["leg_press","chest_press_machine","lat_pulldown","shoulder_press_machine","cable_tricep_pushdown","dead_bug"] },
    ],
    defaultSchedule:{ Monday:"a", Wednesday:"a", Friday:"a" },
  },
  {
    id:"machine_balanced",
    name:"Machine A/B Split",
    difficulty:"novice",
    description:"Two alternating machine workouts for full weekly coverage.",
    equipment:"machines",
    routines:[
      { id:"a", name:"Strike · Day A", exerciseIds:["leg_press","chest_press_machine","lat_pulldown","shoulder_press_machine","cable_tricep_pushdown","dead_bug"] },
      { id:"b", name:"Temper · Day B", exerciseIds:["seated_leg_curl","seated_cable_row","cable_face_pull","cable_lateral_raise","cable_bicep_curl","plank"] },
    ],
    defaultSchedule:{ Monday:"a", Wednesday:"b", Friday:"a" },
  },
  {
    id:"band_only",
    name:"Bands Only",
    difficulty:"beginner",
    description:"Train anywhere — all you need is a resistance band.",
    equipment:"bands",
    routines:[
      { id:"a", name:"Strike · Day A", exerciseIds:["band_squat","band_chest_press","band_row","band_overhead_press","dead_bug"] },
      { id:"b", name:"Temper · Day B", exerciseIds:["band_hip_thrust","band_pull_apart","band_glute_kickback","band_bicep_curl","bird_dog"] },
    ],
    defaultSchedule:{ Monday:"a", Wednesday:"b", Friday:"a" },
  },
  {
    id:"mobility_focus",
    name:"Mobility & Movement",
    difficulty:"beginner",
    description:"Improve range of motion, posture, and joint health.",
    equipment:"bodyweight",
    routines:[
      { id:"a", name:"Strike", exerciseIds:["cat_cow","hip_flexor_stretch","hip_90_90","thoracic_rotation","downward_dog","shoulder_cars","childs_pose"] },
    ],
    defaultSchedule:{ Monday:"a", Wednesday:"a", Friday:"a" },
  },
];

// ─── NORMALIZE ───────────────────────────────────────────────────────────────

function normalizeRoutineSchedule(schedule = DEFAULT_CUSTOM_ROUTINE.schedule, routines = DEFAULT_CUSTOM_ROUTINE.routines) {
  const ids = new Set((routines || []).map(item => item.id));
  return DAYS.reduce((acc, day) => {
    const id = schedule?.[day];
    acc[day] = ids.has(id) ? id : (routines[0]?.id || "day_1");
    return acc;
  }, {});
}

const preserveOrFilterIds = (ids, exerciseLibrary, validateIds) => {
  const source = Array.isArray(ids) ? ids : [];
  const filtered = validateIds ? source.filter(id => getExerciseById(id, exerciseLibrary)) : source;
  return [...new Set(filtered)];
};

export function normalizeCustomRoutine(routine = DEFAULT_CUSTOM_ROUTINE, options = {}) {
  const { exerciseLibrary = null, validateIds = false } = options;
  const source = routine && typeof routine === "object" && !Array.isArray(routine) ? routine : {};
  const ids = Array.isArray(source.exerciseIds) ? preserveOrFilterIds(source.exerciseIds, exerciseLibrary, validateIds) : DEFAULT_CUSTOM_ROUTINE.exerciseIds;
  const rawRoutines = Array.isArray(source.routines)
    ? source.routines
    : (Array.isArray(source.exerciseIds) ? [{ id:source.activeRoutineId || "day_1", name:source.name || "Strike", exerciseIds:source.exerciseIds }] : DEFAULT_CUSTOM_ROUTINE.routines);
  const routines = rawRoutines.map((item, index) => ({
    id:item.id || `day_${index + 1}`,
    name:item.name || FORGE_WORKOUT_NAMES[index % FORGE_WORKOUT_NAMES.length],
    exerciseIds:preserveOrFilterIds(item.exerciseIds, exerciseLibrary, validateIds),
  }));
  // Normalize saved programs array — same shape as the main program
  const programs = Array.isArray(source.programs)
    ? source.programs.filter(p => p && p.id && Array.isArray(p.routines))
    : [];
  return {
    ...DEFAULT_CUSTOM_ROUTINE,
    ...source,
    exerciseIds: ids.length ? ids : DEFAULT_CUSTOM_ROUTINE.exerciseIds,
    routines: routines.length ? routines : DEFAULT_CUSTOM_ROUTINE.routines,
    activeRoutineId:source.activeRoutineId || (routines[0]?.id || DEFAULT_CUSTOM_ROUTINE.activeRoutineId),
    favoriteExerciseIds: Array.isArray(source.favoriteExerciseIds) ? preserveOrFilterIds(source.favoriteExerciseIds, exerciseLibrary, validateIds) : [],
    avoidedExerciseIds: Array.isArray(source.avoidedExerciseIds) ? preserveOrFilterIds(source.avoidedExerciseIds, exerciseLibrary, validateIds) : [],
    schedule: normalizeRoutineSchedule(source.schedule, routines.length ? routines : DEFAULT_CUSTOM_ROUTINE.routines),
    programs,
  };
}

// ─── PERSONALIZED DEFAULT ────────────────────────────────────────────────────
// Selects a template that best fits the user's profile before any workouts have been done.
export function buildPersonalizedDefault(userProfile = {}, settings = {}) {
  const profile  = normalizeUserProfile(userProfile);
  const tier     = ageTier(profile);
  const age      = Number(profile.age) || 30;
  const exp      = profile.trainingExperience || "new";
  const mobility = profile.mobilityLevel || "normal";
  const equip    = settings.equipmentProfile || "fixed_dumbbells";
  const isOlder  = tier.ageFriendly || age >= 60;
  const limited  = mobility === "limited";

  let templateId;
  if (isOlder || limited) {
    templateId = "older_adult";
  } else if (equip === "machines") {
    templateId = exp === "trained" ? "machine_balanced" : "machine_starter";
  } else if (equip === "bands") {
    templateId = "band_only";
  } else if (exp === "trained") {
    templateId = "dumbbell_ppl";
  } else if (exp === "returning") {
    templateId = "dumbbell_ppl";
  } else {
    templateId = "beginner_3day";
  }

  const tpl = ROUTINE_TEMPLATES.find(t => t.id === templateId) || ROUTINE_TEMPLATES[0];
  return {
    ...DEFAULT_CUSTOM_ROUTINE,
    name: tpl.name,
    routines: tpl.routines.map(r => ({ ...r })),
    schedule: { ...tpl.defaultSchedule },
    enabled: false,
    programs: [],
  };
}

// ─── WORKOUT HELPERS ─────────────────────────────────────────────────────────

export function customRoutineWorkout(routine = DEFAULT_CUSTOM_ROUTINE, day = null, options = {}) {
  const { exerciseLibrary = null } = options;
  const safe = normalizeCustomRoutine(routine, options);
  const dayRoutineId = day ? safe.schedule?.[day] : null;
  const active = safe.routines.find(item => item.id === dayRoutineId) || safe.routines.find(item => item.id === safe.activeRoutineId);
  const ids = active ? (active.exerciseIds || []) : safe.exerciseIds;
  return {
    label:active?.name || safe.name || "Custom Routine",
    days:day || "Custom",
    color:"#fbbf24",
    custom:true,
    exercises:ids.map(id => getExerciseById(id, exerciseLibrary)).filter(Boolean).map(ex => ({
      ...ex,
      folder: exerciseFolder(ex),
    })),
  };
}

// Union of every exercise across every routine — for week-level balance/coverage.
export function allRoutineExercises(routine = DEFAULT_CUSTOM_ROUTINE, options = {}) {
  const { exerciseLibrary = null } = options;
  const safe = normalizeCustomRoutine(routine, options);
  const ids = new Set();
  (safe.routines || []).forEach(r => (r.exerciseIds || []).forEach(id => ids.add(id)));
  if (!ids.size) (safe.exerciseIds || []).forEach(id => ids.add(id));
  return [...ids]
    .map(id => getExerciseById(id, exerciseLibrary))
    .filter(Boolean)
    .map(ex => ({ ...ex, folder: exerciseFolder(ex) }));
}

export function routineCoverage(exercises = []) {
  return MUSCLE_COVERAGE_GROUPS.map(([key, label, muscles]) => {
    const hits = exercises.filter(ex => [...(ex.primary || []), ...(ex.secondary || [])].some(m => muscles.includes(m)));
    return { key, label, muscles, hits, ok:hits.length > 0 };
  });
}

export function routineBalanceScore(exercises = []) {
  const coverage = routineCoverage(exercises);
  const covered = coverage.filter(item => item.ok).length;
  const total = coverage.length || 1;
  const countPenalty = exercises.length < 4 ? 20 : exercises.length > 8 ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round((covered / total) * 100) - countPenalty));
}

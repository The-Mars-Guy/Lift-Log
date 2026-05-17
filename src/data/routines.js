import { exerciseId, getExerciseById, MUSCLE_COVERAGE_GROUPS, DAYS } from "./exercises.js";

export const DEFAULT_CUSTOM_ROUTINE = {
  enabled:false,
  name:"My Routine",
  difficulty:"beginner",
  exerciseIds:["box_squat", "wall_pushup", "supported_row", "glute_bridge", "dead_bug"],
  activeRoutineId:"starter",
  routines:[
    { id:"starter", name:"Starter Full Body", exerciseIds:["box_squat", "wall_pushup", "supported_row", "glute_bridge", "dead_bug"] },
  ],
  favoriteExerciseIds:[],
  avoidedExerciseIds:[],
  schedule:{ Monday:"starter", Wednesday:"starter", Friday:"starter" },
};

export const ROUTINE_TEMPLATES = [
  { id:"older_adult", name:"Older Adult Starter", difficulty:"beginner", exerciseIds:["sit_to_stand", "wall_pushup", "band_row", "glute_bridge", "bird_dog"] },
  { id:"beginner_full", name:"Beginner Full Body", difficulty:"beginner", exerciseIds:["box_squat", "incline_pushup", "supported_row", "glute_bridge", "dead_bug"] },
  { id:"dumbbell_balanced", name:"Dumbbell Balanced", difficulty:"novice", exerciseIds:["Goblet Squat", "Floor Press", "Bent Over Row", "Romanian Deadlift", "Crunch"].map(exerciseId) },
  { id:"low_impact", name:"Low Impact Strength", difficulty:"beginner", exerciseIds:["sit_to_stand", "band_chest_press", "band_row", "seated_press", "dead_bug"] },
  { id:"machine_starter", name:"Machine Starter", difficulty:"beginner", exerciseIds:["leg_press", "chest_press_machine", "lat_pulldown", "shoulder_press_machine", "cable_tricep_pushdown", "cable_bicep_curl", "dead_bug"] },
  { id:"machine_balanced", name:"Machine Full Body", difficulty:"novice", exerciseIds:["leg_press", "seated_leg_curl", "chest_press_machine", "seated_cable_row", "cable_face_pull", "cable_lateral_raise", "cable_tricep_pushdown", "dead_bug"] },
  { id:"band_only", name:"Bands Only", difficulty:"beginner", exerciseIds:["band_squat", "band_chest_press", "band_row", "band_overhead_press", "band_pull_apart", "band_hip_thrust", "dead_bug"] },
  { id:"mobility_focus", name:"Mobility & Movement", difficulty:"beginner", exerciseIds:["cat_cow", "hip_flexor_stretch", "hip_90_90", "thoracic_rotation", "downward_dog", "shoulder_cars", "childs_pose"] },
];

function normalizeRoutineSchedule(schedule = DEFAULT_CUSTOM_ROUTINE.schedule, routines = DEFAULT_CUSTOM_ROUTINE.routines) {
  const ids = new Set((routines || []).map(item => item.id));
  return DAYS.reduce((acc, day) => {
    const id = schedule?.[day];
    acc[day] = ids.has(id) ? id : (routines[0]?.id || "starter");
    return acc;
  }, {});
}

export function normalizeCustomRoutine(routine = DEFAULT_CUSTOM_ROUTINE) {
  const source = routine && typeof routine === "object" && !Array.isArray(routine) ? routine : {};
  const ids = Array.isArray(source.exerciseIds) ? source.exerciseIds.filter(id => getExerciseById(id)) : DEFAULT_CUSTOM_ROUTINE.exerciseIds;
  const rawRoutines = Array.isArray(source.routines)
    ? source.routines
    : (Array.isArray(source.exerciseIds) ? [{ id:source.activeRoutineId || "custom", name:source.name || "Custom Routine", exerciseIds:source.exerciseIds }] : DEFAULT_CUSTOM_ROUTINE.routines);
  const routines = rawRoutines.map((item, index) => ({
    id:item.id || `routine_${index + 1}`,
    name:item.name || `Routine ${index + 1}`,
    exerciseIds:(Array.isArray(item.exerciseIds) ? item.exerciseIds : []).filter(id => getExerciseById(id)),
  })).filter(item => item.exerciseIds.length);
  return {
    ...DEFAULT_CUSTOM_ROUTINE,
    ...source,
    exerciseIds: ids.length ? [...new Set(ids)] : DEFAULT_CUSTOM_ROUTINE.exerciseIds,
    routines: routines.length ? routines : DEFAULT_CUSTOM_ROUTINE.routines,
    activeRoutineId:source.activeRoutineId || (routines[0]?.id || DEFAULT_CUSTOM_ROUTINE.activeRoutineId),
    favoriteExerciseIds: Array.isArray(source.favoriteExerciseIds) ? [...new Set(source.favoriteExerciseIds.filter(id => getExerciseById(id)))] : [],
    avoidedExerciseIds: Array.isArray(source.avoidedExerciseIds) ? [...new Set(source.avoidedExerciseIds.filter(id => getExerciseById(id)))] : [],
    schedule: normalizeRoutineSchedule(source.schedule, routines.length ? routines : DEFAULT_CUSTOM_ROUTINE.routines),
  };
}

export function customRoutineWorkout(routine = DEFAULT_CUSTOM_ROUTINE, day = null) {
  const safe = normalizeCustomRoutine(routine);
  const dayRoutineId = day ? safe.schedule?.[day] : null;
  const active = safe.routines.find(item => item.id === dayRoutineId) || safe.routines.find(item => item.id === safe.activeRoutineId);
  const ids = active?.exerciseIds?.length ? active.exerciseIds : safe.exerciseIds;
  return {
    label:active?.name || safe.name || "Custom Routine",
    days:day || "Custom",
    color:"#fbbf24",
    custom:true,
    exercises:ids.map(id => getExerciseById(id)).filter(Boolean).map(ex => ({
      ...ex,
      folder: ex.source === "free-exercise-db" && ex.id
        ? ex.id.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("_")
        : ex.folder,
    })),
  };
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

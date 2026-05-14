// ─── WORKOUT DATA ────────────────────────────────────────────────────────────
export const WORKOUTS = {
  A: {
    label: "Workout A", days: "Mon & Fri", color: "#4ade80",
    exercises: [
      { name:"Goblet Squat",   sets:3, baseReps:10, repLabel:"×", tip:"Squat deep, chest up, elbows between knees",      folder:"Goblet_Squat",                                          primary:["quads","glutes"],       secondary:["core","calves"]    },
      { name:"Floor Press",    sets:3, baseReps:10, repLabel:"×", tip:"Elbows 45° from body, pause at chest",             folder:"Dumbbell_Floor_Press",                                  primary:["chest","triceps"],      secondary:["frontDelts"]       },
      { name:"Bent Over Row",  sets:3, baseReps:10, repLabel:"×", tip:"Hinge at hips, pull elbow to pocket",              folder:"Bent_Over_Two-Dumbbell_Row",                            primary:["lats","upperBack"],     secondary:["biceps","rearDelts"]},
      { name:"Arnold Press",   sets:3, baseReps:10, repLabel:"×", tip:"Rotate palms fully — that rotation is the point",  folder:"Arnold_Dumbbell_Press",                                 primary:["frontDelts","sideDelts"],secondary:["triceps","upperBack"]},
      { name:"Hammer Curl",    sets:3, baseReps:12, repLabel:"×", tip:"Neutral grip, 3s eccentric on the way down",       folder:"Hammer_Curls",                                          primary:["biceps"],               secondary:["forearms"]         },
    ],
  },
  B: {
    label: "Workout B", days: "Wednesday", color: "#60a5fa",
    exercises: [
      { name:"Romanian Deadlift", sets:3, baseReps:10, repLabel:"×", tip:"Push hips back, feel hamstring stretch first",   folder:"Romanian_Deadlift",                                      primary:["hamstrings","glutes"],  secondary:["lowerBack","upperBack"]},
      { name:"Reverse Lunge",     sets:3, baseReps:10, repLabel:"×", repSuffix:"/leg", tip:"Front shin stays vertical",   folder:"Dumbbell_Rear_Lunge",                                    primary:["quads","glutes"],       secondary:["hamstrings","calves"]  },
      { name:"Rear Delt Row",     sets:3, baseReps:12, repLabel:"×", tip:"Lead with pinky, flare elbows wide",             folder:"Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",  primary:["rearDelts","upperBack"],secondary:["lats"]                 },
      { name:"Tricep Kickback",   sets:3, baseReps:12, repLabel:"×", tip:"Lock upper arm parallel — only forearm moves",   folder:"Tricep_Dumbbell_Kickback",                               primary:["triceps"],              secondary:[]                       },
      { name:"Calf Raise",        sets:3, baseReps:15, repLabel:"×", tip:"Pause 2s at top, slow lower",                    folder:"Standing_Dumbbell_Calf_Raise",                           primary:["calves"],               secondary:[]                       },
      { name:"Crunch",            sets:2, baseReps:12, repLabel:"×", tip:"Curl ribs toward hips, exhale at the top, and avoid pulling on your neck", folder:"Crunches",                                          primary:["core"],                 secondary:[]                       },
    ],
  },
};

export const SCHEDULE = { Monday:"A", Wednesday:"B", Friday:"A" };
export const DAYS = ["Monday","Wednesday","Friday"];
export const CUSTOM_WORKOUT_KEY = "CUSTOM";

export const MUSCLE_LABELS = {
  chest:"Chest", triceps:"Triceps", biceps:"Biceps", forearms:"Forearms",
  frontDelts:"Front Delts", sideDelts:"Side Delts", rearDelts:"Rear Delts",
  upperBack:"Upper Back", lats:"Lats", lowerBack:"Lower Back",
  core:"Core", glutes:"Glutes", quads:"Quads", hamstrings:"Hamstrings", calves:"Calves",
};

const BASE_EXERCISES = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];

export const EXERCISE_LIBRARY = [
  ...BASE_EXERCISES.map(ex => ({
    ...ex,
    id: exerciseId(ex.name),
    category: ex.primary[0] || "general",
    difficulty: ["Crunch", "Calf Raise", "Hammer Curl"].includes(ex.name) ? "beginner" : "novice",
    equipment: ex.name === "Crunch" ? "bodyweight" : "dumbbells",
    ageFriendly: !["Reverse Lunge", "Romanian Deadlift", "Arnold Press"].includes(ex.name),
  })),
  { id:"box_squat", name:"Box Squat", sets:2, baseReps:8, repLabel:"×", tip:"Sit to a sturdy chair or box, stand tall, keep knees comfortable", folder:"Goblet_Squat", primary:["quads","glutes"], secondary:["core"], category:"quads", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"glute_bridge", name:"Glute Bridge", sets:2, baseReps:10, repLabel:"×", tip:"Drive through heels, squeeze glutes, keep ribs down", folder:"Glute_Bridge", primary:["glutes","hamstrings"], secondary:["core"], category:"glutes", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"wall_pushup", name:"Wall Push-Up", sets:2, baseReps:8, repLabel:"×", tip:"Hands on wall, body straight, lower under control", folder:"Pushups", primary:["chest","triceps"], secondary:["frontDelts"], category:"chest", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"supported_row", name:"Supported One-Arm Row", sets:2, baseReps:8, repLabel:"×", tip:"Brace one hand on chair, pull elbow toward pocket", folder:"Bent_Over_Two-Dumbbell_Row", primary:["lats","upperBack"], secondary:["biceps"], category:"lats", difficulty:"beginner", equipment:"dumbbells", ageFriendly:true },
  { id:"seated_press", name:"Seated Shoulder Press", sets:2, baseReps:8, repLabel:"×", tip:"Sit tall, press only through pain-free range", folder:"Arnold_Dumbbell_Press", primary:["frontDelts","sideDelts"], secondary:["triceps"], category:"frontDelts", difficulty:"beginner", equipment:"dumbbells", ageFriendly:true },
  { id:"dead_bug", name:"Dead Bug", sets:2, baseReps:8, repLabel:"×", repSuffix:"/side", tip:"Low back steady, move opposite arm and leg slowly", folder:"Crunches", primary:["core"], secondary:[], category:"core", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"sit_to_stand", name:"Sit-to-Stand", sets:2, baseReps:8, repLabel:"×", tip:"Stand from a chair without rushing, sit back down under control", folder:"Goblet_Squat", primary:["quads","glutes"], secondary:["core"], category:"quads", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"incline_pushup", name:"Incline Push-Up", sets:2, baseReps:8, repLabel:"×", tip:"Hands on counter or bench, body straight, lower slowly", folder:"Pushups", primary:["chest","triceps"], secondary:["frontDelts"], category:"chest", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"band_row", name:"Band Row", sets:2, baseReps:10, repLabel:"×", tip:"Pull band to ribs, pause, keep shoulders away from ears", folder:"Bent_Over_Two-Dumbbell_Row", primary:["lats","upperBack"], secondary:["biceps","rearDelts"], category:"lats", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"bird_dog", name:"Bird Dog", sets:2, baseReps:8, repLabel:"×", repSuffix:"/side", tip:"Reach opposite arm and leg, keep hips level", folder:"Crunches", primary:["core","lowerBack"], secondary:["glutes"], category:"core", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"step_up", name:"Low Step-Up", sets:2, baseReps:8, repLabel:"×", repSuffix:"/leg", tip:"Use a low step, drive through whole foot, hold support if needed", folder:"Dumbbell_Rear_Lunge", primary:["quads","glutes"], secondary:["hamstrings","calves"], category:"quads", difficulty:"novice", equipment:"bodyweight", ageFriendly:true },
  { id:"band_chest_press", name:"Band Chest Press", sets:2, baseReps:10, repLabel:"×", tip:"Press band forward at chest height, keep ribs down", folder:"Dumbbell_Floor_Press", primary:["chest","triceps"], secondary:["frontDelts"], category:"chest", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"lateral_raise", name:"Lateral Raise", sets:2, baseReps:10, repLabel:"×", tip:"Raise to shoulder height with soft elbows, no shrugging", folder:"Arnold_Dumbbell_Press", primary:["sideDelts"], secondary:["frontDelts"], category:"sideDelts", difficulty:"novice", equipment:"dumbbells", ageFriendly:true },
  { id:"plank", name:"Plank", sets:2, baseReps:20, repLabel:"sec", tip:"Brace gently, breathe, stop before back sags", folder:"Crunches", primary:["core"], secondary:["frontDelts"], category:"core", difficulty:"novice", equipment:"bodyweight", ageFriendly:true },
];

export const MUSCLE_COVERAGE_GROUPS = [
  ["push", "Push", ["chest", "triceps", "frontDelts", "sideDelts"]],
  ["pull", "Pull", ["lats", "upperBack", "rearDelts", "biceps"]],
  ["legs", "Legs", ["quads", "glutes", "hamstrings", "calves"]],
  ["core", "Core", ["core", "lowerBack"]],
];

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
];

export const DEFAULT_USER_PROFILE = {
  age:"",
  heightIn:"",
  weightLb:"",
  sex:"",
  goal:"general",
  mobility:"normal",
  trainingExperience:"new",
  limitations:[],
};

export function exerciseId(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function getExerciseById(id) {
  return EXERCISE_LIBRARY.find(ex => ex.id === id) || EXERCISE_LIBRARY.find(ex => exerciseId(ex.name) === id);
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

function normalizeRoutineSchedule(schedule = DEFAULT_CUSTOM_ROUTINE.schedule, routines = DEFAULT_CUSTOM_ROUTINE.routines) {
  const ids = new Set((routines || []).map(item => item.id));
  return DAYS.reduce((acc, day) => {
    const id = schedule?.[day];
    acc[day] = ids.has(id) ? id : (routines[0]?.id || "starter");
    return acc;
  }, {});
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
    exercises:ids.map(id => getExerciseById(id)).filter(Boolean).map(ex => ({ ...ex })),
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

export function normalizeUserProfile(profile = DEFAULT_USER_PROFILE) {
  const source = profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
  return { ...DEFAULT_USER_PROFILE, ...source, limitations:Array.isArray(source.limitations) ? source.limitations : [] };
}

export function profileFitnessEstimate(profile = DEFAULT_USER_PROFILE) {
  const safe = normalizeUserProfile(profile);
  const age = Number(safe.age) || 0;
  const heightIn = Number(safe.heightIn) || 0;
  const weightLb = Number(safe.weightLb) || 0;
  const bmi = weightLb > 0 && heightIn > 0 ? Math.round((weightLb / (heightIn * heightIn)) * 703 * 10) / 10 : null;
  const kg = weightLb / 2.20462;
  const cm = heightIn * 2.54;
  const sexAdj = safe.sex === "female" ? -161 : safe.sex === "male" ? 5 : -78;
  const bmr = kg && cm && age ? Math.round((10 * kg) + (6.25 * cm) - (5 * age) + sexAdj) : null;
  const leanMassLb = bmi && weightLb ? Math.round(weightLb * (bmi >= 30 ? 0.62 : bmi >= 25 ? 0.68 : 0.74)) : null;
  const category = !bmi ? "unknown" : bmi < 18.5 ? "under" : bmi >= 30 ? "high" : bmi >= 25 ? "moderate" : "standard";
  return { bmi, bmr, leanMassLb, category };
}

export const LIMITATION_OPTIONS = [
  ["knees", "Knees"],
  ["shoulders", "Shoulders"],
  ["back", "Back"],
  ["balance", "Balance"],
  ["wrists", "Wrists"],
];

export const BENCHMARK_TESTS_V2 = [
  { id:"sit_to_stand_30s", name:"30s Sit-to-Stand", target:"legs", note:"Count smooth chair stands in 30 seconds." },
  { id:"plank_hold", name:"Timed Plank", target:"core", note:"Stop before sagging or pain." },
  { id:"mobility_check", name:"Mobility Check", target:"mobility", note:"Rate squat, hinge, press, and balance comfort." },
];

export function profileRisk(profile = DEFAULT_USER_PROFILE) {
  const safe = normalizeUserProfile(profile);
  const age = Number(safe.age) || 0;
  const weight = Number(safe.weightLb) || 0;
  const height = Number(safe.heightIn) || 0;
  const bmi = weight > 0 && height > 0 ? Math.round((weight / (height * height)) * 703 * 10) / 10 : null;
  let score = 0;
  if (age >= 65) score += 2;
  else if (age >= 50) score += 1;
  if (safe.trainingExperience === "new") score += 1;
  if (safe.mobility === "limited") score += 1;
  if (safe.limitations?.length >= 2) score += 1;
  if (bmi && (bmi >= 35 || bmi < 18.5)) score += 1;
  const level = score >= 3 ? "protect" : score >= 1 ? "steady" : "standard";
  return { level, score, bmi };
}

export function benchmarkModeForProfile(profile = DEFAULT_USER_PROFILE) {
  const risk = profileRisk(profile);
  if (risk.level === "protect") return { key:"submax", label:"Submax", effort:0.55, note:"Stop well before strain. Use smooth reps only." };
  if (risk.level === "steady") return { key:"comfortable", label:"Comfortable", effort:0.6, note:"Stop with 2-3 good reps left." };
  return { key:"clean_max", label:"Clean Max", effort:0.65, note:"Stop when form breaks or pain appears." };
}

export function assessmentTargetForProfile(maxReps, profile = DEFAULT_USER_PROFILE) {
  const mode = benchmarkModeForProfile(profile);
  return Math.max(3, Math.ceil((Number(maxReps) || 0) * mode.effort));
}

export const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
export const VIDEO_BASE = "/Lift-Log/videos";

// ─── DEFAULTS ────────────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  restSeconds: 60,
  dumbbellWeight: 15,
  soundEnabled: true,
  vibrationEnabled: true,
  sessionsPerProgression: 6,
  maxRepBonus: 5,
  weightIncrement: 1,    // lbs to add when progression triggers or +/- buttons are tapped
  coachStyle: "balanced",
  autoDeload: true,
  showReadiness: true,
  fullscreenRest: true,
  visualTheme: "pop_light",
  scienceCoach: true,
  equipmentProfile: "fixed_dumbbells",
  trainingGoal: "hypertrophy",
  onboardingDone: false,
  cautiousJoints: [],
  beginnerFormMode: false,
};

// Default starting weights per exercise (lbs, per dumbbell)
export const DEFAULT_WEIGHTS = {
  "Goblet Squat": 15,   "Floor Press": 12,    "Bent Over Row": 15,
  "Arnold Press": 10,   "Hammer Curl": 10,    "Romanian Deadlift": 15,
  "Reverse Lunge": 10,  "Rear Delt Row": 8,   "Tricep Kickback": 8,
  "Calf Raise": 15,     "Crunch": 0,
};

export const EXERCISE_GUIDES = {
  "Goblet Squat": {
    setup: ["Hold one dumbbell tight at chest height", "Feet around shoulder width", "Brace before each rep"],
    movement: ["Sit between your hips", "Keep chest tall", "Stand by pushing the floor away"],
    mistakes: ["Knees collapsing inward", "Heels lifting", "Rushing the bottom"],
    pain: "If knees complain, reduce depth or swap to a box squat or glute bridge.",
  },
  "Floor Press": {
    setup: ["Lie flat with knees bent", "Elbows about 45 degrees from your body", "Wrists stacked over elbows"],
    movement: ["Lower until upper arms touch the floor", "Pause briefly", "Press without bouncing"],
    mistakes: ["Flaring elbows wide", "Letting wrists bend back", "Losing shoulder control"],
    pain: "If shoulders or wrists complain, use a neutral grip or swap to push-ups.",
  },
  "Bent Over Row": {
    setup: ["Hinge until torso is angled forward", "Keep back long", "Let dumbbells hang under shoulders"],
    movement: ["Pull elbows toward back pockets", "Pause at the top", "Lower with control"],
    mistakes: ["Standing up each rep", "Shrugging into the neck", "Swinging the dumbbells"],
    pain: "If lower back feels loaded, brace on a chair and row one arm at a time.",
  },
  "Arnold Press": {
    setup: ["Start dumbbells in front of shoulders", "Ribs down", "Palms face you"],
    movement: ["Rotate as you press", "Finish overhead without leaning back", "Lower through the same path"],
    mistakes: ["Arching the low back", "Turning it into a push press", "Dropping too fast"],
    pain: "If overhead pressing pinches, use lateral raises or front raises today.",
  },
  "Hammer Curl": {
    setup: ["Stand tall", "Palms face each other", "Elbows stay near your sides"],
    movement: ["Curl without swinging", "Squeeze briefly", "Lower for 3 seconds"],
    mistakes: ["Rocking the torso", "Elbows drifting forward", "Letting the weight drop"],
    pain: "If elbows or wrists complain, use alternating reps and a smaller range.",
  },
  "Romanian Deadlift": {
    setup: ["Dumbbells in front of thighs", "Soft knees", "Brace your trunk"],
    movement: ["Push hips back", "Stop when hamstrings stretch", "Stand by squeezing glutes"],
    mistakes: ["Squatting instead of hinging", "Rounding the back", "Chasing too much range"],
    pain: "If back feels sketchy, swap to glute bridges or shorten the range.",
  },
  "Reverse Lunge": {
    setup: ["Stand tall with dumbbells at sides", "Brace before stepping", "Keep front foot planted"],
    movement: ["Step back under control", "Front shin stays mostly vertical", "Drive through front foot"],
    mistakes: ["Pushing off the back leg", "Knee diving inward", "Taking a tiny unstable step"],
    pain: "If knees complain, swap to glute bridges or split squat holds.",
  },
  "Rear Delt Row": {
    setup: ["Hinge or support your head", "Let arms hang", "Keep neck relaxed"],
    movement: ["Lead with elbows wide", "Think upper back and rear shoulders", "Lower slowly"],
    mistakes: ["Turning it into a lat row", "Shrugging", "Using momentum"],
    pain: "If shoulders complain, reduce range or use a lighter rear delt fly pattern.",
  },
  "Tricep Kickback": {
    setup: ["Hinge forward", "Upper arms parallel to torso", "Elbows fixed"],
    movement: ["Extend only the forearm", "Squeeze at lockout", "Return slowly"],
    mistakes: ["Dropping upper arms", "Swinging the weight", "Overarching the back"],
    pain: "If elbows complain, swap to close-grip floor press.",
  },
  "Calf Raise": {
    setup: ["Stand tall near support", "Feet hip width", "Hold dumbbells if useful"],
    movement: ["Rise as high as possible", "Pause at the top", "Lower to a full stretch"],
    mistakes: ["Bouncing reps", "Rolling ankles out", "Skipping the bottom stretch"],
    pain: "If balance is limiting, hold a wall or do seated calf raises.",
  },
  "Crunch": {
    setup: ["Lie on your back with knees bent", "Hands lightly beside head or across chest", "Lower back gently stays down"],
    movement: ["Exhale and curl ribs toward hips", "Lift shoulder blades only", "Pause, then lower slowly"],
    mistakes: ["Pulling on the neck", "Sitting all the way up", "Holding your breath"],
    pain: "If your back or neck complains, swap to dead bugs, heel taps, or planks.",
  },
};

// ─── XP & LEVELS ─────────────────────────────────────────────────────────────
export const XP_VALUES = {
  set: 2, workout: 20, pr_weight: 40, pr_reps: 25,
  perfect_week: 60, streak_3: 20, streak_7: 50, checkin: 30,
};

export const LEVELS = [
  { min:0,    name:"Newcomer",   badge:"🌱", color:"#888"    },
  { min:80,   name:"Consistent", badge:"💪", color:"#60a5fa" },
  { min:220,  name:"Athlete",    badge:"⚡", color:"#4ade80" },
  { min:480,  name:"Strong",     badge:"🔥", color:"#fb923c" },
  { min:900,  name:"Elite",      badge:"⚔️", color:"#a78bfa" },
  { min:1600, name:"Legend",     badge:"👑", color:"#fbbf24" },
];

export function getLevel(xp) {
  let lv = LEVELS[0], idx = 0;
  for (let i = 0; i < LEVELS.length; i++) { if (xp >= LEVELS[i].min) { lv = LEVELS[i]; idx = i; } }
  const next = LEVELS[idx + 1];
  const pct  = next ? (xp - lv.min) / (next.min - lv.min) : 1;
  return { ...lv, idx, next, pct: Math.min(pct, 1), xp };
}

// ─── ACHIEVEMENTS ────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id:"first_lift",   name:"First Lift",       desc:"Complete your first session",              icon:"🎯", check:s=>s.totalSessions>=1  },
  { id:"week_one",     name:"Week One",          desc:"3 sessions completed",                     icon:"📅", check:s=>s.totalSessions>=3  },
  { id:"ten_sessions", name:"Double Digits",     desc:"10 sessions logged",                       icon:"🔟", check:s=>s.totalSessions>=10 },
  { id:"quarter",      name:"Quarter Century",   desc:"25 sessions logged",                       icon:"⚡", check:s=>s.totalSessions>=25 },
  { id:"halfway",      name:"Halfway There",     desc:"50 sessions logged",                       icon:"⚔️", check:s=>s.totalSessions>=50 },
  { id:"centurion",    name:"Centurion",          desc:"100 sessions logged",                      icon:"👑", check:s=>s.totalSessions>=100},
  { id:"first_prog",   name:"Onwards",           desc:"First rep increase unlocked",              icon:"↗️", check:s=>s.totalProgressions>=1},
  { id:"five_progs",   name:"Adapt & Overcome",  desc:"5 progressions unlocked",                  icon:"💪", check:s=>s.totalProgressions>=5},
  { id:"all_maxed",    name:"Topped Out",        desc:"Every exercise at max",                    icon:"🏆", check:s=>s.allMaxed         },
  { id:"streak_3",     name:"Building Habit",    desc:"3 sessions in a row",                      icon:"🔥", check:s=>s.streak>=3        },
  { id:"streak_10",    name:"Unstoppable",       desc:"10 sessions in a row",                     icon:"⚡", check:s=>s.streak>=10       },
  { id:"perfect_week", name:"Perfect Week",      desc:"All 3 scheduled days in a week",           icon:"✨", check:s=>s.perfectWeeks>=1  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const todayName = () => ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
export const dateStr   = (d=new Date()) => d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
export const isoDate   = (d=new Date()) => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dy=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${dy}`; };
export const isoWeek   = (d=new Date()) => { const dt=new Date(d); dt.setHours(0,0,0,0); dt.setDate(dt.getDate()+4-(dt.getDay()||7)); const ys=new Date(dt.getFullYear(),0,1); return `${dt.getFullYear()}-W${String(Math.ceil(((dt-ys)/86400000+1)/7)).padStart(2,"0")}`; };

// Epley 1-rep max estimate
export const epley1RM = (weight, reps) => reps <= 0 ? 0 : reps === 1 ? weight : Math.round(weight * (1 + reps / 30));

// Progressive overload recommendation
// Returns { action: 'increase'|'maintain'|'decrease', nextWeight, note }
export function calcNextLoad(setLogs, targetReps, currentWeight, increment=2.5) {
  if (!setLogs?.length) return { action:"maintain", nextWeight:currentWeight, note:"No data yet" };
  const cleanIncrement = Number.isFinite(Number(increment)) && Number(increment) > 0 ? Number(increment) : 1;
  const cleanWeight = Number.isFinite(Number(currentWeight)) ? Number(currentWeight) : 0;
  const allHit  = setLogs.every(l => (l.reps||0) >= targetReps);
  const anyFail = setLogs.some(l => (l.reps||0) < Math.round(targetReps * 0.75));
  if (allHit)  return { action:"increase", nextWeight: Math.round((cleanWeight + cleanIncrement) * 100) / 100, note:`Hit all reps → add ${cleanIncrement}lbs` };
  if (anyFail) return { action:"decrease", nextWeight: Math.max(Math.round((cleanWeight - cleanIncrement*2) * 100)/100, 0), note:`Failed reps → reduce load` };
  return { action:"maintain", nextWeight:cleanWeight, note:"Almost there — same weight" };
}

// ─── DYNAMIC PROGRESSION ─────────────────────────────────────────────────────
// feedback: 'too_easy' | 'good' | 'hard' | 'too_hard'
export function calcDynamicTarget(currentTarget, feedback, maxTest) {
  const floor   = Math.max(3, maxTest ? Math.ceil(maxTest * 0.35) : 3);
  const ceiling = maxTest ? maxTest + 10 : currentTarget + 20;
  const adj = { too_easy: +2, easy: +2, good: +1, hard: 0, too_hard: -1, pain: -2 }[feedback] ?? 0;
  return Math.max(floor, Math.min(ceiling, currentTarget + adj));
}

// Starting target from initial assessment (65% of max, minimum 3)
export function assessmentTarget(maxReps) {
  return Math.max(3, Math.ceil(maxReps * 0.65));
}

// Pull per-exercise session history for graphing
// Returns [{ date, totalReps, avgWeight, timestamp }] sorted oldest→newest
export function getExerciseHistory(exerciseName, history) {
  return history
    .filter(h => h.exercises?.some(e => exerciseMatches(e, exerciseName)))
    .map(h => {
      const ex = h.exercises.find(e => exerciseMatches(e, exerciseName));
      if (!ex) return null;
      const totalReps = ex.setLog?.length
        ? ex.setLog.reduce((s, l) => s + (l.reps || 0), 0)
        : (ex.reps || 0) * (ex.sets || 3);
      const avgWeight = ex.setLog?.length
        ? Math.round((ex.setLog.reduce((s, l) => s + (l.weight || 0), 0) / ex.setLog.length) * 10) / 10
        : null;
      return { date: h.date, totalReps, avgWeight, timestamp: h.timestamp };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-16);
}

export function exerciseMatches(exercise, exerciseName) {
  return exercise?.name === exerciseName
    || exercise?.originalName === exerciseName
    || exercise?.substitutedFor === exerciseName
    || exercise?.configName === exerciseName
    || exercise?.id === exerciseName
    || exercise?.plannedId === exerciseName
    || exercise?.id === exerciseId(exerciseName)
    || exercise?.plannedId === exerciseId(exerciseName);
}

export function computeStats({ history, progression, settings }) {
  const totalSessions = history.length;
  const sorted = [...history].sort((a,b) => b.timestamp - a.timestamp);
  let streak = 0;
  if (sorted.length > 0) { streak=1; for (let i=1;i<sorted.length;i++) { if((sorted[i-1].timestamp-sorted[i].timestamp)/86400000<=4.5) streak++; else break; } }
  const totalProgressions = Object.values(progression).reduce((s,p)=>s+(p.repBonus||0),0);
  const allExercises = [...WORKOUTS.A.exercises,...WORKOUTS.B.exercises];
  const allMaxed = allExercises.every(ex=>(progression[ex.name]?.repBonus||0)>=settings.maxRepBonus);
  const weekDays = {};
  for (const h of history) { const d=new Date(h.timestamp); const wk=isoWeek(d); if(!weekDays[wk]) weekDays[wk]=new Set(); weekDays[wk].add(h.day); }
  const perfectWeeks = Object.values(weekDays).filter(s=>s.has("Monday")&&s.has("Wednesday")&&s.has("Friday")).length;
  return { totalSessions, streak, totalProgressions, allMaxed, perfectWeeks, weekDays };
}

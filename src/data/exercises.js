import { EXERCISE_DB_EXTENDED } from "./exercisedb.js";

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

export function exerciseId(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

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

  // ── Machines ────────────────────────────────────────────────────────────────
  { id:"leg_press", name:"Leg Press", sets:3, baseReps:12, repLabel:"×", tip:"Press through whole foot, stop short of knee lockout, controlled descent", folder:"Leg_Press", primary:["quads","glutes"], secondary:["hamstrings","calves"], category:"quads", difficulty:"novice", equipment:"machines", ageFriendly:true },
  { id:"seated_leg_curl", name:"Seated Leg Curl", sets:3, baseReps:12, repLabel:"×", tip:"Pull pad slowly, pause at peak contraction, control the return", folder:"Lying_Leg_Curls", primary:["hamstrings"], secondary:["calves"], category:"hamstrings", difficulty:"novice", equipment:"machines", ageFriendly:true },
  { id:"leg_extension", name:"Leg Extension", sets:3, baseReps:12, repLabel:"×", tip:"Squeeze at top, lower with 3s count, avoid locking out aggressively", folder:"Leg_Extensions", primary:["quads"], secondary:[], category:"quads", difficulty:"beginner", equipment:"machines", ageFriendly:true },
  { id:"lat_pulldown", name:"Lat Pulldown", sets:3, baseReps:10, repLabel:"×", tip:"Pull bar to upper chest, lean back slightly, lead with elbows", folder:"Cable_Lat_Pulldown", primary:["lats","upperBack"], secondary:["biceps","rearDelts"], category:"lats", difficulty:"novice", equipment:"machines", ageFriendly:true },
  { id:"seated_cable_row", name:"Seated Cable Row", sets:3, baseReps:10, repLabel:"×", tip:"Pull handle to belly, keep chest up and shoulders down, pause briefly", folder:"Seated_Cable_Rows", primary:["lats","upperBack"], secondary:["biceps","rearDelts"], category:"lats", difficulty:"novice", equipment:"machines", ageFriendly:true },
  { id:"cable_face_pull", name:"Cable Face Pull", sets:3, baseReps:15, repLabel:"×", tip:"Set cable at face height, pull to forehead with elbows high and wide", folder:"Face_Pull", primary:["rearDelts","upperBack"], secondary:["biceps"], category:"rearDelts", difficulty:"novice", equipment:"machines", ageFriendly:true },
  { id:"cable_tricep_pushdown", name:"Cable Tricep Pushdown", sets:3, baseReps:12, repLabel:"×", tip:"Elbows pinned at sides, push down to full extension, squeeze hard", folder:"Triceps_Pushdown", primary:["triceps"], secondary:[], category:"triceps", difficulty:"beginner", equipment:"machines", ageFriendly:true },
  { id:"cable_bicep_curl", name:"Cable Bicep Curl", sets:3, baseReps:12, repLabel:"×", tip:"Keep elbows forward, curl to chin height, lower with 3s count", folder:"Cable_Hammer_Curls__With_Rope_", primary:["biceps"], secondary:["forearms"], category:"biceps", difficulty:"beginner", equipment:"machines", ageFriendly:true },
  { id:"chest_press_machine", name:"Chest Press Machine", sets:3, baseReps:12, repLabel:"×", tip:"Seat height so handles are at chest level, press through full range", folder:"Dumbbell_Floor_Press", primary:["chest","triceps"], secondary:["frontDelts"], category:"chest", difficulty:"beginner", equipment:"machines", ageFriendly:true },
  { id:"pec_deck_fly", name:"Pec Deck Fly", sets:3, baseReps:12, repLabel:"×", tip:"Slight bend in elbows throughout, feel a stretch at the open position", folder:"Dumbbell_Flyes", primary:["chest"], secondary:["frontDelts"], category:"chest", difficulty:"beginner", equipment:"machines", ageFriendly:true },
  { id:"shoulder_press_machine", name:"Shoulder Press Machine", sets:3, baseReps:10, repLabel:"×", tip:"Press without arching back, stop just before lockout, lower slowly", folder:"Arnold_Dumbbell_Press", primary:["frontDelts","sideDelts"], secondary:["triceps"], category:"frontDelts", difficulty:"beginner", equipment:"machines", ageFriendly:true },
  { id:"cable_lateral_raise", name:"Cable Lateral Raise", sets:2, baseReps:12, repLabel:"×", repSuffix:"/side", tip:"Cable low by your side, raise arm to shoulder height, soft elbow", folder:"Arnold_Dumbbell_Press", primary:["sideDelts"], secondary:["frontDelts"], category:"sideDelts", difficulty:"novice", equipment:"machines", ageFriendly:true },
  { id:"hip_abduction_machine", name:"Hip Abduction Machine", sets:3, baseReps:15, repLabel:"×", tip:"Press knees outward through full range, squeeze at the top", folder:"Glute_Bridge", primary:["glutes"], secondary:[], category:"glutes", difficulty:"beginner", equipment:"machines", ageFriendly:true },
  { id:"calf_press_machine", name:"Calf Press Machine", sets:3, baseReps:15, repLabel:"×", tip:"Full stretch at bottom, pause 2s at top, keep tempo controlled", folder:"Standing_Dumbbell_Calf_Raise", primary:["calves"], secondary:[], category:"calves", difficulty:"beginner", equipment:"machines", ageFriendly:true },

  // ── Additional Bands ────────────────────────────────────────────────────────
  { id:"band_pull_apart", name:"Band Pull-Apart", sets:3, baseReps:15, repLabel:"×", tip:"Arms straight at chest height, pull band apart, squeeze shoulder blades", folder:"Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", primary:["rearDelts","upperBack"], secondary:[], category:"rearDelts", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_face_pull", name:"Band Face Pull", sets:3, baseReps:15, repLabel:"×", tip:"Anchor band at face height, pull to forehead with elbows high and wide", folder:"Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", primary:["rearDelts","upperBack"], secondary:["biceps"], category:"rearDelts", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_bicep_curl", name:"Band Bicep Curl", sets:3, baseReps:12, repLabel:"×", tip:"Stand on band, curl up fully, lower for 3 seconds each rep", folder:"Hammer_Curls", primary:["biceps"], secondary:["forearms"], category:"biceps", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_overhead_press", name:"Band Overhead Press", sets:3, baseReps:10, repLabel:"×", tip:"Stand on band, press handles overhead while bracing your core", folder:"Arnold_Dumbbell_Press", primary:["frontDelts","sideDelts"], secondary:["triceps"], category:"frontDelts", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_lateral_raise", name:"Band Lateral Raise", sets:3, baseReps:12, repLabel:"×", tip:"Stand on band, raise arms to shoulder height with soft elbows", folder:"Arnold_Dumbbell_Press", primary:["sideDelts"], secondary:["frontDelts"], category:"sideDelts", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_squat", name:"Band Squat", sets:3, baseReps:12, repLabel:"×", tip:"Stand on band with handles at shoulders, squat with knees pushed out", folder:"Goblet_Squat", primary:["quads","glutes"], secondary:["core","calves"], category:"quads", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_hip_thrust", name:"Band Hip Thrust", sets:3, baseReps:12, repLabel:"×", tip:"Loop band over hips, drive upward through heels, squeeze glutes hard at top", folder:"Glute_Bridge", primary:["glutes","hamstrings"], secondary:["core"], category:"glutes", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_glute_kickback", name:"Band Glute Kickback", sets:3, baseReps:12, repLabel:"×", repSuffix:"/leg", tip:"Hands and knees, kick straight back with a slow controlled tempo", folder:"Glute_Bridge", primary:["glutes"], secondary:["hamstrings"], category:"glutes", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_tricep_pushdown", name:"Band Tricep Pushdown", sets:3, baseReps:12, repLabel:"×", tip:"Anchor band overhead, elbows pinned at sides, push down and squeeze", folder:"Tricep_Dumbbell_Kickback", primary:["triceps"], secondary:[], category:"triceps", difficulty:"beginner", equipment:"bands", ageFriendly:true },
  { id:"band_good_morning", name:"Band Good Morning", sets:3, baseReps:10, repLabel:"×", tip:"Band over shoulders, hinge at hips with soft knees, stand through glutes", folder:"Romanian_Deadlift", primary:["hamstrings","lowerBack"], secondary:["glutes"], category:"hamstrings", difficulty:"novice", equipment:"bands", ageFriendly:false },

  // ── Additional Bodyweight ───────────────────────────────────────────────────
  { id:"push_up", name:"Push-Up", sets:3, baseReps:8, repLabel:"×", tip:"Body straight, lower chest to floor, elbows 45° from body, full lockout", folder:"Pushups", primary:["chest","triceps"], secondary:["frontDelts","core"], category:"chest", difficulty:"novice", equipment:"bodyweight", ageFriendly:false },
  { id:"pike_push_up", name:"Pike Push-Up", sets:3, baseReps:8, repLabel:"×", tip:"Hips high in inverted V shape, lower head toward floor between your hands", folder:"Pushups", primary:["frontDelts","triceps"], secondary:["upperBack"], category:"frontDelts", difficulty:"novice", equipment:"bodyweight", ageFriendly:false },
  { id:"chair_dip", name:"Chair Dip", sets:3, baseReps:8, repLabel:"×", tip:"Hands on chair edge, lower body until elbows reach 90°, press back up", folder:"Tricep_Dumbbell_Kickback", primary:["triceps","chest"], secondary:["frontDelts"], category:"triceps", difficulty:"novice", equipment:"bodyweight", ageFriendly:false },
  { id:"bodyweight_squat", name:"Bodyweight Squat", sets:3, baseReps:12, repLabel:"×", tip:"Feet shoulder-width, sit to comfortable depth, drive through whole foot", folder:"Goblet_Squat", primary:["quads","glutes"], secondary:["core","calves"], category:"quads", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"bulgarian_split_squat", name:"Bulgarian Split Squat", sets:3, baseReps:8, repLabel:"×", repSuffix:"/leg", tip:"Rear foot elevated, front shin vertical, descend slowly and deliberately", folder:"Dumbbell_Rear_Lunge", primary:["quads","glutes"], secondary:["hamstrings","calves"], category:"quads", difficulty:"intermediate", equipment:"bodyweight", ageFriendly:false },
  { id:"superman", name:"Superman", sets:3, baseReps:10, repLabel:"×", tip:"Face down, lift arms and legs simultaneously, hold 2s at top, lower slowly", folder:"Crunches", primary:["lowerBack","glutes"], secondary:["hamstrings","upperBack"], category:"lowerBack", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },
  { id:"hollow_body_hold", name:"Hollow Body Hold", sets:3, baseReps:20, repLabel:"sec", tip:"Lower back pressed to floor, arms and legs extended low, breathe steadily", folder:"Crunches", primary:["core"], secondary:["frontDelts"], category:"core", difficulty:"novice", equipment:"bodyweight", ageFriendly:false },
  { id:"side_plank", name:"Side Plank", sets:2, baseReps:20, repLabel:"sec", repSuffix:"/side", tip:"Body in a straight line from head to feet, hips lifted, breathe normally", folder:"Crunches", primary:["core"], secondary:["sideDelts"], category:"core", difficulty:"novice", equipment:"bodyweight", ageFriendly:true },
  { id:"mountain_climber", name:"Mountain Climber", sets:3, baseReps:10, repLabel:"×", repSuffix:"/side", tip:"Plank position, drive knees alternately toward chest, keep hips level", folder:"Crunches", primary:["core","quads"], secondary:["frontDelts"], category:"core", difficulty:"novice", equipment:"bodyweight", ageFriendly:false },
  { id:"hip_hinge_bodyweight", name:"Hip Hinge (Bodyweight)", sets:3, baseReps:10, repLabel:"×", tip:"Push hips back toward a wall behind you, soft knees, stand through glutes", folder:"Romanian_Deadlift", primary:["hamstrings","glutes"], secondary:["lowerBack"], category:"hamstrings", difficulty:"beginner", equipment:"bodyweight", ageFriendly:true },

  // ── Mobility ────────────────────────────────────────────────────────────────
  { id:"cat_cow", name:"Cat-Cow", sets:1, baseReps:10, repLabel:"×", tip:"All fours, breathe in on arch, out on round, move slowly through full range", folder:"Crunches", primary:["lowerBack","core"], secondary:[], category:"lowerBack", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"hip_90_90", name:"Hip 90/90 Stretch", sets:1, baseReps:30, repLabel:"sec", repSuffix:"/side", tip:"Both hips at 90°, stay upright, shift weight slowly between sides", folder:"Glute_Bridge", primary:["glutes"], secondary:[], category:"glutes", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"thoracic_rotation", name:"Thoracic Rotation", sets:1, baseReps:8, repLabel:"×", repSuffix:"/side", tip:"On all fours, one hand behind head, rotate elbow up toward the ceiling", folder:"Crunches", primary:["upperBack"], secondary:["core"], category:"upperBack", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"worlds_greatest_stretch", name:"World's Greatest Stretch", sets:1, baseReps:5, repLabel:"×", repSuffix:"/side", tip:"From lunge, rotate elbow to floor then reach skyward — move slowly", folder:"Dumbbell_Rear_Lunge", primary:["quads","glutes","chest"], secondary:["hamstrings","upperBack"], category:"quads", difficulty:"beginner", equipment:"mobility", ageFriendly:false },
  { id:"hip_flexor_stretch", name:"Hip Flexor Stretch", sets:1, baseReps:30, repLabel:"sec", repSuffix:"/side", tip:"Half-kneeling, tuck hips under and lean forward gently until you feel the stretch", folder:"Dumbbell_Rear_Lunge", primary:["quads"], secondary:[], category:"quads", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"doorway_chest_stretch", name:"Doorway Chest Stretch", sets:1, baseReps:30, repLabel:"sec", tip:"Forearms on door frame, step through, chest and front shoulders open", folder:"Dumbbell_Floor_Press", primary:["chest","frontDelts"], secondary:[], category:"chest", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"shoulder_cars", name:"Shoulder CARs", sets:1, baseReps:5, repLabel:"×", repSuffix:"/side", tip:"Slow full circles at the shoulder joint through maximum range without compensation", folder:"Arnold_Dumbbell_Press", primary:["frontDelts","rearDelts","sideDelts"], secondary:[], category:"frontDelts", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"downward_dog", name:"Downward Dog", sets:1, baseReps:30, repLabel:"sec", tip:"Palms flat, hips high, pedal heels alternately, breathe into the hamstrings", folder:"Crunches", primary:["hamstrings","calves","lowerBack"], secondary:["frontDelts"], category:"hamstrings", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"couch_stretch", name:"Couch Stretch", sets:1, baseReps:45, repLabel:"sec", repSuffix:"/side", tip:"Rear knee on floor, foot elevated, keep torso tall and hips tucked", folder:"Dumbbell_Rear_Lunge", primary:["quads"], secondary:["glutes"], category:"quads", difficulty:"beginner", equipment:"mobility", ageFriendly:false },
  { id:"childs_pose", name:"Child's Pose", sets:1, baseReps:30, repLabel:"sec", tip:"Knees wide, arms reach forward, breathe into the lower back", folder:"Crunches", primary:["lowerBack","lats"], secondary:[], category:"lowerBack", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"ankle_circles", name:"Ankle Circles", sets:1, baseReps:10, repLabel:"×", repSuffix:"/ankle", tip:"Seated or standing, slow full circles each direction for both ankles", folder:"Standing_Dumbbell_Calf_Raise", primary:["calves"], secondary:[], category:"calves", difficulty:"beginner", equipment:"mobility", ageFriendly:true },
  { id:"pigeon_pose", name:"Pigeon Pose", sets:1, baseReps:45, repLabel:"sec", repSuffix:"/side", tip:"Front leg bent across body, sink hips level toward floor, stay relaxed", folder:"Glute_Bridge", primary:["glutes"], secondary:[], category:"glutes", difficulty:"beginner", equipment:"mobility", ageFriendly:false },

  // ── Barbell ─────────────────────────────────────────────────────────────────
  { id:"barbell_back_squat",   name:"Barbell Back Squat",        sets:3, baseReps:5,  repLabel:"×", tip:"Bar across traps, brace hard, sit between hips, drive floor away",          folder:"Barbell_Full_Squat",                   primary:["quads","glutes"], secondary:["hamstrings","lowerBack","core"], category:"quads",     difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:65  },
  { id:"barbell_front_squat",  name:"Barbell Front Squat",       sets:3, baseReps:5,  repLabel:"×", tip:"Elbows high, bar on front delts, upright torso, deep squat",                folder:"Barbell_Front_Squat",                  primary:["quads","glutes"], secondary:["core","upperBack"],             category:"quads",     difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:55  },
  { id:"barbell_bench_press",  name:"Barbell Bench Press",       sets:3, baseReps:5,  repLabel:"×", tip:"Shoulder blades retracted, elbows 45°, touch chest and drive up",           folder:"Barbell_Bench_Press",                  primary:["chest","triceps"], secondary:["frontDelts"],                  category:"chest",     difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:45  },
  { id:"incline_bench_press",  name:"Incline Bench Press",       sets:3, baseReps:6,  repLabel:"×", tip:"Bench at 30–45°, elbows slightly flared, feel upper chest work",            folder:"Barbell_Incline_Bench_Press",          primary:["chest","frontDelts"], secondary:["triceps"],              category:"chest",     difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:45  },
  { id:"close_grip_bench",     name:"Close-Grip Bench Press",    sets:3, baseReps:6,  repLabel:"×", tip:"Hands shoulder-width, elbows track close to torso, full lockout",           folder:"Barbell_Bench_Press",                  primary:["triceps","chest"], secondary:["frontDelts"],                  category:"triceps",   difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:45  },
  { id:"conventional_deadlift",name:"Conventional Deadlift",     sets:3, baseReps:5,  repLabel:"×", tip:"Bar over mid-foot, brace before lifting, drive floor through legs, lock hips at top", folder:"Barbell_Deadlift_Sumo",         primary:["hamstrings","glutes","lowerBack"], secondary:["quads","upperBack","forearms"], category:"hamstrings", difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:95  },
  { id:"sumo_deadlift",        name:"Sumo Deadlift",             sets:3, baseReps:5,  repLabel:"×", tip:"Wide stance, toes out, pull knees apart, keep chest up",                    folder:"Barbell_Deadlift_Sumo",                primary:["glutes","hamstrings","quads"], secondary:["lowerBack","forearms"], category:"glutes",  difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:95  },
  { id:"barbell_rdl",          name:"Barbell Romanian Deadlift", sets:3, baseReps:8,  repLabel:"×", tip:"Push hips back, bar stays close to legs, feel hamstring stretch before returning", folder:"Romanian_Deadlift",              primary:["hamstrings","glutes"], secondary:["lowerBack","upperBack"],    category:"hamstrings",difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:65  },
  { id:"good_morning",         name:"Good Morning",              sets:3, baseReps:8,  repLabel:"×", tip:"Bar on traps, push hips back, soft knee bend, stand through glutes",         folder:"Good_Morning",                         primary:["hamstrings","lowerBack"], secondary:["glutes"],              category:"hamstrings",difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:45  },
  { id:"barbell_ohp",          name:"Barbell Overhead Press",    sets:3, baseReps:5,  repLabel:"×", tip:"Tight grip, elbows forward, press straight up and lock out, ribs down",     folder:"Barbell_Standing_Military_Press",      primary:["frontDelts","sideDelts"], secondary:["triceps","upperBack"], category:"frontDelts",difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:45  },
  { id:"barbell_row",          name:"Barbell Row",               sets:3, baseReps:6,  repLabel:"×", tip:"Hinge to ~45°, pull bar to lower chest, retract shoulder blades at top",    folder:"Barbell_Row",                          primary:["lats","upperBack"], secondary:["biceps","rearDelts","lowerBack"], category:"lats", difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:65  },
  { id:"barbell_hip_thrust",   name:"Barbell Hip Thrust",        sets:3, baseReps:10, repLabel:"×", tip:"Upper back on bench, bar on hip crease with pad, drive through heels, squeeze at top", folder:"Barbell_Hip_Thrust",           primary:["glutes","hamstrings"], secondary:["core"],                 category:"glutes",    difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:45  },
  { id:"barbell_curl",         name:"Barbell Curl",              sets:3, baseReps:10, repLabel:"×", tip:"Elbows fixed at sides, curl to chin, lower 3s, no body swing",              folder:"Barbell_Curl",                         primary:["biceps"], secondary:["forearms"],                            category:"biceps",    difficulty:"novice",       equipment:"barbell", ageFriendly:false, defaultWeightLb:35  },
  { id:"barbell_lunge",        name:"Barbell Lunge",             sets:3, baseReps:8,  repLabel:"×", repSuffix:"/leg", tip:"Bar across traps, step forward, front shin vertical, drive back up", folder:"Barbell_Lunge",               primary:["quads","glutes"], secondary:["hamstrings","calves","core"], category:"quads",  difficulty:"intermediate", equipment:"barbell", ageFriendly:false, defaultWeightLb:45  },

  // ── Kettlebell ───────────────────────────────────────────────────────────────
  { id:"kb_swing",          name:"KB Swing",           sets:3, baseReps:15, repLabel:"×", tip:"Hinge not squat — snap hips forward, let bell float, control the backswing", folder:"Kettlebell_One_Arm_Swing",       primary:["glutes","hamstrings"], secondary:["lowerBack","core","forearms"], category:"glutes",     difficulty:"novice",       equipment:"kettlebell", ageFriendly:false, defaultWeightLb:26 },
  { id:"kb_goblet_squat",   name:"KB Goblet Squat",    sets:3, baseReps:10, repLabel:"×", tip:"Horns of bell at chest, sit between hips, use elbows to push knees out",     folder:"Goblet_Squat",                   primary:["quads","glutes"], secondary:["core","calves"],               category:"quads",      difficulty:"beginner",     equipment:"kettlebell", ageFriendly:true,  defaultWeightLb:26 },
  { id:"kb_deadlift",       name:"KB Deadlift",        sets:3, baseReps:8,  repLabel:"×", tip:"Bell between feet, hinge to grip, brace and stand, hips and knees extend together", folder:"Romanian_Deadlift",         primary:["hamstrings","glutes"], secondary:["lowerBack","forearms"],        category:"hamstrings", difficulty:"beginner",     equipment:"kettlebell", ageFriendly:true,  defaultWeightLb:35 },
  { id:"kb_single_arm_row", name:"KB Single-Arm Row",  sets:3, baseReps:10, repLabel:"×", repSuffix:"/arm", tip:"Brace free hand on bench, pull bell to hip, no rotation", folder:"Bent_Over_Two-Dumbbell_Row",     primary:["lats","upperBack"], secondary:["biceps","rearDelts"],          category:"lats",       difficulty:"novice",       equipment:"kettlebell", ageFriendly:true,  defaultWeightLb:26 },
  { id:"kb_clean_press",    name:"KB Clean & Press",   sets:3, baseReps:6,  repLabel:"×", repSuffix:"/side", tip:"Clean bell to rack position, press overhead, lower with control", folder:"Arnold_Dumbbell_Press",    primary:["frontDelts","sideDelts","glutes"], secondary:["triceps","core"],      category:"frontDelts", difficulty:"intermediate", equipment:"kettlebell", ageFriendly:false, defaultWeightLb:26 },
  { id:"kb_goblet_squat_pulse", name:"KB Goblet Pulse Squat", sets:3, baseReps:12, repLabel:"×", tip:"Hold bottom of squat, small pulses, keep tension throughout", folder:"Goblet_Squat",                  primary:["quads","glutes"], secondary:["core"],                         category:"quads",      difficulty:"novice",       equipment:"kettlebell", ageFriendly:true,  defaultWeightLb:18 },
  { id:"kb_farmer_carry",   name:"KB Farmer Carry",    sets:3, baseReps:30, repLabel:"sec", tip:"Bells at sides, stand tall, brace core, slow steady steps",                folder:"Goblet_Squat",                   primary:["core","forearms"], secondary:["quads","glutes","upperBack"],   category:"core",       difficulty:"beginner",     equipment:"kettlebell", ageFriendly:true,  defaultWeightLb:26 },
  { id:"kb_halo",           name:"KB Halo",            sets:2, baseReps:8,  repLabel:"×", repSuffix:"/dir", tip:"Circle bell slowly around head, keep ribs down, minimal neck movement", folder:"Arnold_Dumbbell_Press",  primary:["sideDelts","rearDelts","upperBack"], secondary:["core"],       category:"upperBack",  difficulty:"beginner",     equipment:"kettlebell", ageFriendly:true,  defaultWeightLb:18 },
  { id:"kb_turkish_getup",  name:"KB Turkish Get-Up",  sets:2, baseReps:3,  repLabel:"×", repSuffix:"/side", tip:"Keep arm vertical throughout, move in distinct steps, never rush", folder:"Crunches",                 primary:["core","frontDelts","glutes"], secondary:["quads","upperBack"],   category:"core",       difficulty:"intermediate", equipment:"kettlebell", ageFriendly:false, defaultWeightLb:18 },
  // ── Extended library (free-exercise-db, public domain) ──────────────────────
  ...EXERCISE_DB_EXTENDED,
];

// ─── EXERCISE METADATA ───────────────────────────────────────────────────────
// movement: primary movement pattern — used by coach push:pull ratio, pattern analysis
// bilateral: false = unilateral (one side at a time)
export const EXERCISE_MOVEMENT = {
  // Squat pattern
  "Goblet Squat":"squat",           "Box Squat":"squat",           "Bodyweight Squat":"squat",
  "Reverse Lunge":"squat",          "Bulgarian Split Squat":"squat","Low Step-Up":"squat",
  "Sit-to-Stand":"squat",           "Band Squat":"squat",          "Leg Press":"squat",
  "Leg Extension":"squat",          "Barbell Back Squat":"squat",  "Barbell Front Squat":"squat",
  "Barbell Lunge":"squat",          "KB Goblet Squat":"squat",     "KB Goblet Pulse Squat":"squat",
  // Hinge pattern
  "Romanian Deadlift":"hinge",      "Barbell Romanian Deadlift":"hinge","Conventional Deadlift":"hinge",
  "Sumo Deadlift":"hinge",          "Good Morning":"hinge",        "Band Good Morning":"hinge",
  "KB Swing":"hinge",               "KB Deadlift":"hinge",         "Glute Bridge":"hinge",
  "Band Hip Thrust":"hinge",        "Barbell Hip Thrust":"hinge",  "Hip Hinge (Bodyweight)":"hinge",
  "Seated Leg Curl":"hinge",        "Band Glute Kickback":"hinge", "Hip Abduction Machine":"hinge",
  // Horizontal push
  "Floor Press":"push_h",           "Barbell Bench Press":"push_h","Incline Bench Press":"push_h",
  "Close-Grip Bench Press":"push_h","Push-Up":"push_h",            "Incline Push-Up":"push_h",
  "Wall Push-Up":"push_h",          "Band Chest Press":"push_h",   "Chest Press Machine":"push_h",
  "Pec Deck Fly":"push_h",          "Chair Dip":"push_h",
  // Vertical push
  "Arnold Press":"push_v",          "Seated Shoulder Press":"push_v","Shoulder Press Machine":"push_v",
  "Band Overhead Press":"push_v",   "Barbell Overhead Press":"push_v","Pike Push-Up":"push_v",
  "KB Clean & Press":"push_v",
  // Horizontal pull
  "Bent Over Row":"pull_h",         "Rear Delt Row":"pull_h",      "Supported One-Arm Row":"pull_h",
  "Band Row":"pull_h",              "Seated Cable Row":"pull_h",   "Barbell Row":"pull_h",
  "KB Single-Arm Row":"pull_h",     "Cable Face Pull":"pull_h",    "Band Face Pull":"pull_h",
  "Band Pull-Apart":"pull_h",
  // Vertical pull
  "Lat Pulldown":"pull_v",
  // Isolation / single-joint
  "Hammer Curl":"isolation",        "Barbell Curl":"isolation",    "Cable Bicep Curl":"isolation",
  "Band Bicep Curl":"isolation",    "Tricep Kickback":"isolation", "Cable Tricep Pushdown":"isolation",
  "Band Tricep Pushdown":"isolation","Lateral Raise":"isolation",  "Cable Lateral Raise":"isolation",
  "Band Lateral Raise":"isolation", "Calf Raise":"isolation",      "Calf Press Machine":"isolation",
  "Ankle Circles":"isolation",      "KB Halo":"isolation",
  // Core
  "Crunch":"core",    "Dead Bug":"core",       "Bird Dog":"core",     "Superman":"core",
  "Plank":"core",     "Side Plank":"core",     "Hollow Body Hold":"core","Mountain Climber":"core",
  "Cat-Cow":"core",   "KB Farmer Carry":"core","KB Turkish Get-Up":"core",
  // Carry
  // Mobility / stretch
  "Hip 90/90 Stretch":"stretch",    "Thoracic Rotation":"stretch", "World's Greatest Stretch":"stretch",
  "Hip Flexor Stretch":"stretch",   "Doorway Chest Stretch":"stretch","Shoulder CARs":"stretch",
  "Downward Dog":"stretch",         "Couch Stretch":"stretch",     "Child's Pose":"stretch",
  "Pigeon Pose":"stretch",
};

// Exercises that train one side at a time (affects volume counting in coach)
export const EXERCISE_UNILATERAL = new Set([
  "Reverse Lunge","Bulgarian Split Squat","Low Step-Up","Barbell Lunge",
  "Supported One-Arm Row","KB Single-Arm Row","KB Clean & Press","KB Turkish Get-Up",
  "Cable Lateral Raise","Band Glute Kickback","Band Bicep Curl","Hip 90/90 Stretch",
  "Couch Stretch","Pigeon Pose","Shoulder CARs","Thoracic Rotation","Side Plank",
  "Ankle Circles","World's Greatest Stretch","Hip Flexor Stretch","Dead Bug","Bird Dog",
]);

// Comprehensive per-exercise default starting weights (lbs per implement)
// Barbell = total bar weight; Dumbbell = per hand; KB = single bell
export const EXERCISE_DEFAULT_WEIGHTS = {
  // Dumbbells
  "Goblet Squat":15,       "Floor Press":12,          "Bent Over Row":15,
  "Arnold Press":10,       "Hammer Curl":10,          "Romanian Deadlift":15,
  "Reverse Lunge":10,      "Rear Delt Row":8,         "Tricep Kickback":8,
  "Calf Raise":15,         "Lateral Raise":8,         "Seated Shoulder Press":10,
  "Supported One-Arm Row":12, "Incline Push-Up":0,    "Band Row":0,
  // Machines (weight stack lbs)
  "Leg Press":90,          "Seated Leg Curl":40,      "Leg Extension":40,
  "Lat Pulldown":50,       "Seated Cable Row":40,     "Cable Face Pull":20,
  "Cable Tricep Pushdown":25,"Cable Bicep Curl":20,   "Chest Press Machine":40,
  "Pec Deck Fly":30,       "Shoulder Press Machine":30,"Cable Lateral Raise":10,
  "Hip Abduction Machine":40,"Calf Press Machine":80,
  // Barbell (total bar + plates, lbs)
  "Barbell Back Squat":65, "Barbell Front Squat":55,  "Barbell Bench Press":45,
  "Incline Bench Press":45,"Close-Grip Bench Press":45,"Conventional Deadlift":95,
  "Sumo Deadlift":95,      "Barbell Romanian Deadlift":65,"Good Morning":45,
  "Barbell Overhead Press":45,"Barbell Row":65,       "Barbell Hip Thrust":45,
  "Barbell Curl":35,       "Barbell Lunge":45,
  // Kettlebell (single bell, lbs)
  "KB Swing":26,           "KB Goblet Squat":26,      "KB Deadlift":35,
  "KB Single-Arm Row":26,  "KB Clean & Press":26,     "KB Goblet Pulse Squat":18,
  "KB Farmer Carry":26,    "KB Halo":18,              "KB Turkish Get-Up":18,
};

export function getExerciseMovement(exerciseName) {
  return EXERCISE_MOVEMENT[exerciseName] || null;
}

export function isUnilateral(exerciseName) {
  return EXERCISE_UNILATERAL.has(exerciseName);
}

export function getDefaultWeight(exerciseName, fallback = 0) {
  return EXERCISE_DEFAULT_WEIGHTS[exerciseName] ?? fallback;
}

// Push:pull ratio from a list of exercises
// Returns { pushSets, pullSets, ratio, label }
export function pushPullRatio(exercises = []) {
  let push = 0, pull = 0;
  exercises.forEach(ex => {
    const mv = getExerciseMovement(ex.name);
    const sets = ex.sets || 3;
    if (mv === "push_h" || mv === "push_v") push += sets;
    else if (mv === "pull_h" || mv === "pull_v") pull += sets;
  });
  const ratio = pull > 0 ? push / pull : push > 0 ? Infinity : 1;
  const label = ratio > 1.5 ? "push heavy" : ratio < 0.67 ? "pull heavy" : "balanced";
  return { pushSets:push, pullSets:pull, ratio:Number.isFinite(ratio) ? Math.round(ratio*10)/10 : null, label };
}

export const MUSCLE_COVERAGE_GROUPS = [
  ["push", "Push", ["chest", "triceps", "frontDelts", "sideDelts"]],
  ["pull", "Pull", ["lats", "upperBack", "rearDelts", "biceps"]],
  ["legs", "Legs", ["quads", "glutes", "hamstrings", "calves"]],
  ["core", "Core", ["core", "lowerBack"]],
];

export function getExerciseById(id) {
  return EXERCISE_LIBRARY.find(ex => ex.id === id) || EXERCISE_LIBRARY.find(ex => exerciseId(ex.name) === id);
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

// Epley 1-rep max estimate
export const epley1RM = (weight, reps) => reps <= 0 ? 0 : reps === 1 ? weight : Math.round(weight * (1 + reps / 30));

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

// Machine guides
EXERCISE_GUIDES["Leg Press"] = {
  setup: ["Adjust seat so knees are at about 90° when feet are on the platform", "Feet shoulder-width, toes slightly out", "Back flat against the pad"],
  movement: ["Press through whole foot without locking knees at the top", "Lower slowly until knees reach 90°", "Never let hips curl off the pad"],
  mistakes: ["Feet too low on platform (shifts load to knees)", "Locking out hard at the top", "Letting the weight drop"],
  pain: "If knees complain, raise your foot position on the platform and reduce range.",
};
EXERCISE_GUIDES["Lat Pulldown"] = {
  setup: ["Grip slightly wider than shoulder-width, overhand", "Thighs tucked under pad, chest tall", "Lean back 10–15°"],
  movement: ["Pull bar to upper chest leading with elbows", "Squeeze lats at the bottom for a beat", "Let bar rise slowly to full arm extension"],
  mistakes: ["Leaning back too far and turning it into a row", "Pulling behind the neck", "Shrugging the shoulders up"],
  pain: "If shoulders pinch, try a neutral-grip handle and a narrower grip width.",
};
EXERCISE_GUIDES["Seated Cable Row"] = {
  setup: ["Sit tall with knees slightly bent", "Grip neutral handle, arms extended", "Chest lifted before every rep"],
  movement: ["Pull handle to belly button, elbows traveling back", "Pause with shoulder blades together", "Extend arms slowly under full control"],
  mistakes: ["Rocking the torso for momentum", "Shrugging into the pull", "Letting the stack crash between reps"],
  pain: "If lower back feels loaded, brace harder and shorten the forward lean.",
};
EXERCISE_GUIDES["Cable Face Pull"] = {
  setup: ["Set cable pulley at face height", "Grip rope with thumbs pointing toward you", "Step back until cable is taut"],
  movement: ["Pull toward forehead with elbows high and wide", "Rotate hands outward at the end", "Control the return, arms extending fully"],
  mistakes: ["Elbows dropping below shoulders", "Pulling to the chin instead of forehead", "Using body momentum"],
  pain: "If shoulders are sensitive, reduce weight and focus on the external rotation component.",
};
EXERCISE_GUIDES["Cable Tricep Pushdown"] = {
  setup: ["Set cable high, grip bar or rope", "Elbows pinned close to your ribs", "Stand close to the pulley"],
  movement: ["Push straight down to full extension", "Squeeze triceps hard at lockout", "Let hands rise slowly to 90°"],
  mistakes: ["Letting elbows flare out", "Using body weight to push down", "Not reaching full extension"],
  pain: "If elbows ache, try a rope attachment with a neutral grip.",
};
// Band guides
EXERCISE_GUIDES["Band Pull-Apart"] = {
  setup: ["Hold band at shoulder width, arms straight", "Thumbs pointing up", "Stand tall with ribs down"],
  movement: ["Pull band apart to chest level, arms straight", "Squeeze shoulder blades hard at full stretch", "Return slowly without letting arms drift down"],
  mistakes: ["Bending the elbows", "Shrugging up during the pull", "Rushing the reps"],
  pain: "If shoulders complain, use a lighter band and keep range smaller.",
};
EXERCISE_GUIDES["Band Hip Thrust"] = {
  setup: ["Sit with upper back against a bench or couch", "Loop band over hips, anchor ends under your hands", "Feet flat, knees at about 90°"],
  movement: ["Drive hips upward through your heels", "Squeeze glutes hard at the top for 2s", "Lower hips close to the floor and repeat"],
  mistakes: ["Hyperextending the lower back at the top", "Letting knees cave inward", "Rising onto the toes"],
  pain: "If lower back aches, keep the range smaller and focus on the glute squeeze.",
};
// Mobility guides
EXERCISE_GUIDES["Cat-Cow"] = {
  setup: ["Hands below shoulders, knees below hips", "Wrists, hips, and ankles all neutral", "Neck long"],
  movement: ["Inhale: drop belly, lift chest and tailbone (cow)", "Exhale: round spine toward ceiling, tuck chin and tailbone (cat)", "Move at breathing pace — never force the range"],
  mistakes: ["Moving too fast", "Using only the neck or only the lumbar", "Holding the breath"],
  pain: "If wrists are uncomfortable, do this movement on fists or forearms.",
};
EXERCISE_GUIDES["Hip 90/90 Stretch"] = {
  setup: ["Sit on the floor with both legs bent at 90°", "Front shin parallel, rear shin to the side", "Sit tall on your sit bones"],
  movement: ["Stay upright and breathe into the hip that's stretching", "Slowly shift weight toward the front knee over time", "Switch sides after your hold"],
  mistakes: ["Collapsing to the side", "Slouching the back", "Forcing the stretch aggressively"],
  pain: "Sit on a folded towel to reduce hip-floor distance if hips are tight.",
};
EXERCISE_GUIDES["Downward Dog"] = {
  setup: ["Hands shoulder-width, fingers spread", "Tuck toes under, press hips high", "Form an inverted V"],
  movement: ["Alternately pedal heels toward the floor", "Let the head hang between arms", "Push floor away to keep arms long"],
  mistakes: ["Rounding the back instead of lengthening it", "Locking the knees", "Weight too far forward into the wrists"],
  pain: "Bend knees generously if hamstrings are very tight — the spine position matters more.",
};
EXERCISE_GUIDES["Thoracic Rotation"] = {
  setup: ["Start on hands and knees", "One hand placed behind your head", "Spine in a neutral position"],
  movement: ["Rotate that elbow down toward the opposite knee", "Then open it up toward the ceiling", "Follow the movement with your eyes"],
  mistakes: ["Rotating from the lower back instead of the mid-back", "Moving too fast", "Letting the hips shift"],
  pain: "Stay within a pain-free range — rotation should feel like an opening, not a strain.",
};

// Barbell guides
EXERCISE_GUIDES["Barbell Back Squat"] = {
  setup: ["Bar rests on low traps, not neck", "Grip just outside shoulders, elbows down", "Take a big breath and brace before unracking"],
  movement: ["Break hips and knees simultaneously", "Sit between your hips — not straight down", "Drive knees out, stand by pushing the floor away"],
  mistakes: ["Good-morning squat (hips rise first)", "Knees caving inward", "Heels rising — fix with ankle mobility or heel wedge"],
  pain: "If knees ache, try a box squat to control depth. If lower back aches, check hip hinge mechanics first.",
};
EXERCISE_GUIDES["Barbell Bench Press"] = {
  setup: ["Retract shoulder blades and pin them into the bench", "Arch naturally — feet flat, glutes down", "Grip so wrists stay straight, elbows at 45°"],
  movement: ["Lower bar to lower chest with control", "Touch lightly, then drive explosively", "Keep feet planted and leg drive into the floor"],
  mistakes: ["Elbows flaring wide", "Bouncing bar off chest", "Losing shoulder blade retraction at the bottom"],
  pain: "If shoulders ache, narrow the grip and lower to the sternum instead of upper chest.",
};
EXERCISE_GUIDES["Conventional Deadlift"] = {
  setup: ["Bar over mid-foot (1 inch from shins)", "Grip just outside legs, double overhand or mixed", "Big breath, brace 360° — then pull slack out of the bar"],
  movement: ["Push the floor away through your heels", "Bar stays against legs the whole way up", "Lock hips and knees simultaneously at the top"],
  mistakes: ["Jerking the bar off the floor", "Bar drifting away from the body", "Hyperextending the lower back at lockout"],
  pain: "If lower back rounds, reduce weight and work on hip hinge. Try Romanian deadlift for hamstring flexibility first.",
};
EXERCISE_GUIDES["Barbell Overhead Press"] = {
  setup: ["Bar at collarbone, elbows slightly forward", "Grip just outside shoulders", "Tight core, glutes squeezed — no rib flare"],
  movement: ["Press straight up, head moves back slightly to clear the path", "Lock out fully overhead, shrug at the top", "Lower to collarbone under control"],
  mistakes: ["Leaning back excessively", "Bar drifting forward", "Not achieving full lockout"],
  pain: "If shoulder pinches overhead, try a landmine press first to build shoulder-friendly strength.",
};
EXERCISE_GUIDES["Barbell Row"] = {
  setup: ["Hip hinge to ~45° — more parallel for upper back, less for lats", "Overhand grip just outside hips", "Let bar hang below shoulders"],
  movement: ["Pull to lower chest / upper abdomen", "Lead with elbows, retract shoulder blades at the top", "Lower fully — let arms extend between reps"],
  mistakes: ["Standing up on each rep", "Shrugging into the pull", "Jerking the torso for momentum"],
  pain: "If lower back fatigues, use a chest-supported row or single-arm dumbbell row instead.",
};
EXERCISE_GUIDES["Conventional Deadlift"] = EXERCISE_GUIDES["Conventional Deadlift"]; // already set
EXERCISE_GUIDES["KB Swing"] = {
  setup: ["Bell 12 inches in front of you", "Hinge to grip handle, tilt bell back", "Pack lats, brace core"],
  movement: ["Hike bell back between legs — this is a HINGE not a squat", "Snap hips forward explosively, let bell float to chest height", "Hinge back immediately on the descent, guide bell between legs"],
  mistakes: ["Squatting instead of hinging", "Using shoulders to lift the bell", "Letting lower back round at the bottom"],
  pain: "If lower back aches, reduce weight and drill the hip hinge pattern with a Romanian deadlift first.",
};
EXERCISE_GUIDES["KB Turkish Get-Up"] = {
  setup: ["Lie on back, bell in one hand, arm vertical", "Knee bent on same side as bell, foot flat", "Other arm and leg at 45° from body"],
  movement: ["Roll to elbow → press to hand → bridge hips up → sweep leg through → half-kneeling → stand"],
  mistakes: ["Letting the arm collapse (bell drops)", "Rushing the transitions", "Not keeping eyes on the bell"],
  pain: "If shoulder is unstable, practice each position separately with a light bell or water bottle first.",
};
EXERCISE_GUIDES["KB Farmer Carry"] = {
  setup: ["Bells at sides at arm's length", "Stand tall — imagine a string pulling crown of head up", "Deep breath before moving"],
  movement: ["Walk with deliberate steps, don't let hips sway", "Keep shoulders level and packed", "Breathe steadily throughout"],
  mistakes: ["Leaning to one side", "Letting the bell pull shoulder down", "Short choppy steps"],
  pain: "If grip gives out before core, use straps — grip is a separate training component.",
};
EXERCISE_GUIDES["KB Clean & Press"] = {
  setup: ["Bell between feet, deadlift to swing position", "Clean to rack: forearm vertical, bell resting on forearm not wrist", "Press from rack position"],
  movement: ["Swing, guide bell into rack with a quarter turn", "Press overhead from rack, full lockout", "Lower to rack then swing back down"],
  mistakes: ["Bell crashing on the wrist (banana grip)", "Pressing from a bad rack position", "Not hinging on the descent"],
  pain: "If wrist gets beaten up, focus on the rack position first with racked holds before adding the press.",
};

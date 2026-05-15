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

// Maps exercise name → joints that make it risky when flagged in profile.limitations
// "risky" = high joint stress or common injury vector for that condition
export const EXERCISE_RISK_JOINTS = {
  // Knees
  "Goblet Squat":          ["knees"],
  "Box Squat":             ["knees"],
  "Bodyweight Squat":      ["knees"],
  "Reverse Lunge":         ["knees","balance"],
  "Bulgarian Split Squat": ["knees","balance"],
  "Low Step-Up":           ["knees","balance"],
  "Leg Extension":         ["knees"],
  "Band Squat":            ["knees"],
  "Leg Press":             ["knees"],
  "Worlds Greatest Stretch":["knees"],
  "Couch Stretch":         ["knees"],
  "Pigeon Pose":           ["knees"],
  "Hip 90/90 Stretch":     ["knees"],
  // Back (spine loading)
  "Romanian Deadlift":     ["back"],
  "Bent Over Row":         ["back"],
  "Band Good Morning":     ["back"],
  "Superman":              ["back"],
  "Crunch":                ["back"],
  "Hollow Body Hold":      ["back"],
  "Mountain Climber":      ["back","wrists"],
  "Downward Dog":          ["back","wrists"],
  "Seated Cable Row":      ["back"],
  "Lat Pulldown":          ["back"],
  // Shoulders
  "Arnold Press":          ["shoulders"],
  "Floor Press":           ["shoulders","wrists"],
  "Rear Delt Row":         ["shoulders"],
  "Lateral Raise":         ["shoulders"],
  "Cable Lateral Raise":   ["shoulders"],
  "Band Lateral Raise":    ["shoulders"],
  "Band Overhead Press":   ["shoulders"],
  "Shoulder Press Machine":["shoulders"],
  "Pike Push-Up":          ["shoulders","wrists"],
  "Doorway Chest Stretch": ["shoulders"],
  "Shoulder CARs":         ["shoulders"],
  "Cable Face Pull":       ["shoulders"],
  "Band Face Pull":        ["shoulders"],
  "Pec Deck Fly":          ["shoulders"],
  "Seated Shoulder Press": ["shoulders"],
  // Wrists
  "Hammer Curl":           ["wrists"],
  "Tricep Kickback":       ["wrists"],
  "Cable Tricep Pushdown": ["wrists"],
  "Band Tricep Pushdown":  ["wrists"],
  "Push-Up":               ["wrists"],
  "Chair Dip":             ["wrists"],
  "Plank":                 ["wrists"],
  "Side Plank":            ["wrists"],
  // Balance
  "Step-Up":               ["balance"],
  "Calf Raise":            ["balance"],
};

// Returns joints that are risky for a given exercise ([] if none)
export function exerciseRiskJoints(exerciseName) {
  return EXERCISE_RISK_JOINTS[exerciseName] || [];
}

// Returns true if this exercise is risky given the user's limitation list
export function exerciseIsRisky(exerciseName, limitations = []) {
  if (!limitations?.length) return false;
  const risks = exerciseRiskJoints(exerciseName);
  return risks.some(j => limitations.includes(j));
}

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

// Age tier — drives rest, progression speed, coach tone, mobility priority
export function ageTier(profile = DEFAULT_USER_PROFILE) {
  const age = Number(normalizeUserProfile(profile).age) || 0;
  if (!age || age < 35) return {
    tier:"young", label:"Under 35",
    restMult:1.0, deloadWeeks:6, progressStyle:"aggressive",
    coachFocus:"pr", mobilityPriority:false,
  };
  if (age < 50) return {
    tier:"mid", label:"35–50",
    restMult:1.25, deloadWeeks:5, progressStyle:"balanced",
    coachFocus:"consistency", mobilityPriority:false,
  };
  return {
    tier:"senior", label:"50+",
    restMult:1.5, deloadWeeks:4, progressStyle:"conservative",
    coachFocus:"joint_health", mobilityPriority:true,
  };
}

// Age-adjusted rest default (multiplies user's base rest by tier factor)
export function ageAdjustedRestSeconds(profile = DEFAULT_USER_PROFILE, base = 60) {
  return Math.round(ageTier(profile).restMult * base);
}

export const BENCHMARK_TESTS_V2 = [
  { id:"sit_to_stand_30s", name:"30s Sit-to-Stand", target:"legs", note:"Count smooth chair stands in 30 seconds." },
  { id:"plank_hold", name:"Timed Plank", target:"core", note:"Stop before sagging or pain." },
  { id:"mobility_check", name:"Mobility Check", target:"mobility", note:"Rate squat, hinge, press, and balance comfort." },
];

// ─── NORMATIVE BENCHMARK SYSTEM ──────────────────────────────────────────────
// Maps exercise name → performance category
export const EXERCISE_NORM_CATEGORY = {
  // Upper push (loaded)
  "Floor Press":"upper_push",          "Arnold Press":"upper_push",
  "Seated Shoulder Press":"upper_push","Shoulder Press Machine":"upper_push",
  "Band Chest Press":"upper_push",     "Chest Press Machine":"upper_push",
  "Band Overhead Press":"upper_push",  "Pec Deck Fly":"upper_push",
  "Cable Lateral Raise":"upper_push",  "Lateral Raise":"upper_push",
  "Pike Push-Up":"upper_push_bw",
  // Upper push bodyweight
  "Wall Push-Up":"upper_push_bw", "Incline Push-Up":"upper_push_bw",
  "Push-Up":"upper_push_bw",      "Chair Dip":"upper_push_bw",
  // Upper pull
  "Bent Over Row":"upper_pull",       "Rear Delt Row":"upper_pull",
  "Supported One-Arm Row":"upper_pull","Band Row":"upper_pull",
  "Lat Pulldown":"upper_pull",        "Seated Cable Row":"upper_pull",
  "Cable Face Pull":"upper_pull",     "Band Face Pull":"upper_pull",
  "Band Pull-Apart":"upper_pull",
  // Lower compound (loaded)
  "Goblet Squat":"lower",          "Romanian Deadlift":"lower",
  "Reverse Lunge":"lower",         "Leg Press":"lower",
  "Seated Leg Curl":"lower",       "Leg Extension":"lower",
  "Band Good Morning":"lower",
  // Lower bodyweight
  "Box Squat":"lower_bw",          "Glute Bridge":"lower_bw",
  "Sit-to-Stand":"lower_bw",       "Bodyweight Squat":"lower_bw",
  "Bulgarian Split Squat":"lower_bw","Low Step-Up":"lower_bw",
  "Hip Hinge (Bodyweight)":"lower_bw","Band Squat":"lower_bw",
  "Band Hip Thrust":"lower_bw",    "Band Glute Kickback":"lower_bw",
  "Hip Abduction Machine":"lower_bw",
  // Core reps
  "Crunch":"core",    "Dead Bug":"core",      "Bird Dog":"core",
  "Superman":"core",  "Mountain Climber":"core","Cat-Cow":"core",
  // Core holds (reps = seconds)
  "Plank":"core_hold",       "Hollow Body Hold":"core_hold",
  "Side Plank":"core_hold",
  // Isolation
  "Hammer Curl":"isolation",        "Tricep Kickback":"isolation",
  "Cable Tricep Pushdown":"isolation","Cable Bicep Curl":"isolation",
  "Band Bicep Curl":"isolation",    "Band Tricep Pushdown":"isolation",
  "Band Lateral Raise":"isolation",
  // Calf
  "Calf Raise":"calf", "Calf Press Machine":"calf", "Ankle Circles":"calf",
};

// Base norms [poor, below_avg, avg, good, excellent] — age 25–34
const _BNM = { // male
  upper_push:    [5,  9,  14, 20, 27],
  upper_push_bw: [8,  13, 18, 25, 32],
  upper_pull:    [6,  10, 15, 21, 28],
  lower:         [8,  13, 18, 24, 32],
  lower_bw:      [10, 16, 22, 28, 36],
  core:          [8,  12, 18, 25, 32],
  core_hold:     [15, 25, 40, 60, 90],
  isolation:     [8,  12, 16, 22, 30],
  calf:          [12, 18, 24, 32, 42],
};
const _BNF = { // female
  upper_push:    [3,  6,  10, 14, 20],
  upper_push_bw: [4,  7,  12, 17, 24],
  upper_pull:    [4,  7,  12, 17, 23],
  lower:         [7,  12, 17, 23, 30],
  lower_bw:      [9,  14, 20, 26, 34],
  core:          [7,  11, 16, 23, 30],
  core_hold:     [12, 20, 35, 55, 80],
  isolation:     [7,  10, 14, 19, 26],
  calf:          [10, 16, 22, 30, 40],
};
// Rep/sec drop per 10 years past 30
const _DECAY = {
  upper_push:2.5, upper_push_bw:3,   upper_pull:2.5,
  lower:2,        lower_bw:2.5,      core:2,
  core_hold:8,    isolation:1.5,     calf:2,
};
const _GRADE_LABELS = ["Poor", "Below Avg", "Average", "Good", "Excellent"];
const _GRADE_COLORS = ["#fb7185","#fbbf24","#94a3b8","#4ade80","#a78bfa"];

export function normativeGrade(reps, exerciseName, profile = DEFAULT_USER_PROFILE) {
  const safe = normalizeUserProfile(profile);
  const age = Math.max(18, Number(safe.age) || 30);
  const sex = safe.sex || "";
  const cat = EXERCISE_NORM_CATEGORY[exerciseName] || "isolation";
  const baseNorms = sex === "female" ? _BNF : _BNM;
  const base = baseNorms[cat] || _BNM.isolation;
  const decay = _DECAY[cat] || 2;
  const decades = Math.max(0, (age - 30) / 10);
  const thresh = base.map(t => Math.max(1, Math.round(t - decay * decades)));
  const n = Number(reps) || 0;
  const gradeIdx = n >= thresh[4] ? 4 : n >= thresh[3] ? 3 : n >= thresh[2] ? 2 : n >= thresh[1] ? 1 : 0;
  return {
    grade: _GRADE_LABELS[gradeIdx],
    color: _GRADE_COLORS[gradeIdx],
    gradeIdx,
    percentile: [10,30,50,75,90][gradeIdx],
    thresholds: thresh,
    cat,
  };
}

export function benchmarkModeForProfile(profile = DEFAULT_USER_PROFILE) {
  const risk = profileRisk(profile);
  if (risk.level === "protect") return { key:"submax", label:"Submax", effort:0.55, note:"Stop well before strain. Use smooth reps only." };
  if (risk.level === "steady") return { key:"comfortable", label:"Comfortable", effort:0.60, note:"Stop with 2-3 good reps left." };
  return { key:"clean_max", label:"Clean Max", effort:0.65, note:"Stop when form breaks or pain appears." };
}

// Precise effort multiplier: age-decade + sex (upper body) + BMI + experience + risk ceiling
export function benchmarkEffort(profile = DEFAULT_USER_PROFILE, exerciseName = "") {
  // Risk tier is the primary driver — age, BMI, experience, limitations
  // are already aggregated by profileRisk; stacking them again overshoots.
  const risk = profileRisk(profile);
  let effort = risk.level === "protect" ? 0.55
    : risk.level === "steady"            ? 0.62
    :                                      0.65;

  // Minor exercise-specific adjustment: upper-body work is harder relative
  // to true max for women (different strength curve), so ease target slightly.
  const safe = normalizeUserProfile(profile);
  const cat  = EXERCISE_NORM_CATEGORY[exerciseName] || "";
  if (safe.sex === "female" && exerciseName && cat.startsWith("upper")) effort -= 0.03;

  return Math.max(0.40, Math.min(0.70, effort));
}

// Per-exercise adaptive target (primary function going forward)
export function assessmentTargetForExercise(maxReps, exerciseName, profile = DEFAULT_USER_PROFILE) {
  const effort = benchmarkEffort(profile, exerciseName);
  return Math.max(3, Math.ceil((Number(maxReps) || 0) * effort));
}

// Backward-compat shim
export function assessmentTargetForProfile(maxReps, profile = DEFAULT_USER_PROFILE) {
  return assessmentTargetForExercise(maxReps, "", profile);
}

export const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
export const VIDEO_BASE = "/Lift-Log/videos";

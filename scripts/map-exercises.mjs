/**
 * map-exercises.mjs
 * Reads scripts/exercises_raw.json (free-exercise-db, 307 exercises, Unlicense)
 * Maps to Lift-Log schema, deduplicates against existing EXERCISE_LIBRARY names,
 * outputs src/data/exercisedb.js
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rawPath   = join(__dirname, "exercises_raw.json");
const outPath   = join(__dirname, "../src/data/exercisedb.js");

// ── Existing names to skip (dedup) ───────────────────────────────────────────
const EXISTING_NAMES = new Set([
  "Goblet Squat","Floor Press","Bent Over Row","Arnold Press","Hammer Curl",
  "Romanian Deadlift","Reverse Lunge","Rear Delt Row","Tricep Kickback","Calf Raise","Crunch",
  "Box Squat","Glute Bridge","Wall Push-Up","Supported One-Arm Row","Seated Shoulder Press",
  "Dead Bug","Sit-to-Stand","Incline Push-Up","Band Row","Bird Dog","Low Step-Up",
  "Band Chest Press","Lateral Raise","Plank","Leg Press","Seated Leg Curl","Leg Extension",
  "Lat Pulldown","Seated Cable Row","Cable Face Pull","Cable Tricep Pushdown","Cable Bicep Curl",
  "Chest Press Machine","Pec Deck Fly","Shoulder Press Machine","Cable Lateral Raise",
  "Hip Abduction Machine","Calf Press Machine","Band Pull-Apart","Band Face Pull",
  "Band Bicep Curl","Band Overhead Press","Band Lateral Raise","Band Squat","Band Hip Thrust",
  "Band Glute Kickback","Band Tricep Pushdown","Band Good Morning","Push-Up","Pike Push-Up",
  "Chair Dip","Bodyweight Squat","Bulgarian Split Squat","Superman","Hollow Body Hold",
  "Side Plank","Mountain Climber","Hip Hinge (Bodyweight)","Cat-Cow","Hip 90/90 Stretch",
  "Thoracic Rotation","World's Greatest Stretch","Hip Flexor Stretch","Doorway Chest Stretch",
  "Shoulder CARs","Downward Dog","Couch Stretch","Child's Pose","Ankle Circles","Pigeon Pose",
  "Barbell Back Squat","Barbell Front Squat","Barbell Bench Press","Incline Bench Press",
  "Close-Grip Bench Press","Conventional Deadlift","Sumo Deadlift","Barbell Romanian Deadlift",
  "Good Morning","Barbell Overhead Press","Barbell Row","Barbell Hip Thrust","Barbell Curl",
  "Barbell Lunge","KB Swing","KB Goblet Squat","KB Deadlift","KB Single-Arm Row",
  "KB Clean & Press","KB Goblet Pulse Squat","KB Farmer Carry","KB Halo","KB Turkish Get-Up",
]);

// ── Muscle map ────────────────────────────────────────────────────────────────
const MUSCLE_MAP = {
  "abdominals":   "core",
  "quadriceps":   "quads",
  "shoulders":    "sideDelts",
  "traps":        "upperBack",
  "lower back":   "lowerBack",
  "middle back":  "upperBack",
  "adductors":    "quads",
  "abductors":    "glutes",
  "hamstrings":   "hamstrings",
  "biceps":       "biceps",
  "calves":       "calves",
  "chest":        "chest",
  "lats":         "lats",
  "glutes":       "glutes",
  "triceps":      "triceps",
  "forearms":     "forearms",
  // skip: "neck", "soleus" (fold into calves below)
  "soleus":       "calves",
};

// ── Equipment map ─────────────────────────────────────────────────────────────
const EQUIP_MAP = {
  "body only":      "bodyweight",
  "machine":        "machines",
  "dumbbell":       "dumbbells",
  "barbell":        "barbell",
  "kettlebells":    "kettlebell",
  "bands":          "bands",
  "cable":          "machines",
  "foam roll":      "mobility",
  "e-z curl bar":   "barbell",
  "other":          "bodyweight",
  "medicine ball":  "bodyweight",
  "exercise ball":  "bodyweight",
};

// ── Difficulty map ────────────────────────────────────────────────────────────
const DIFF_MAP = {
  beginner:     "beginner",
  intermediate: "novice",
  expert:       "intermediate",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function exerciseId(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function mapMuscles(arr = []) {
  return [...new Set(
    arr.map(m => MUSCLE_MAP[m.toLowerCase()]).filter(Boolean)
  )];
}

function makeTip(instructions = []) {
  const sentences = instructions
    .flatMap(s => s.split(/(?<=\.)\s+/))
    .map(s => s.trim())
    .filter(Boolean);
  // Take up to 2 short sentences, cap at 120 chars
  let tip = sentences.slice(0, 2).join(" ");
  if (tip.length > 120) tip = sentences[0]?.slice(0, 120) || "";
  return tip;
}

function ageFriendly(equip, diff, name) {
  if (diff === "intermediate") return false;
  if (equip === "barbell" && diff !== "beginner") return false;
  const unsafe = ["deadlift","clean","snatch","jerk","spin","jump","plyometric","sprint"];
  if (unsafe.some(w => name.toLowerCase().includes(w))) return false;
  return true;
}

function defaultSetsReps(primary, equip, diff) {
  if (equip === "mobility") return { sets: 1, baseReps: 30, repLabel: "sec" };
  const isCompound = ["quads","glutes","hamstrings","chest","lats","upperBack"].includes(primary);
  const baseReps = diff === "intermediate" ? 5
    : diff === "novice"   ? 8
    : isCompound          ? 12
    : 15;
  const sets = diff === "intermediate" ? 4 : 3;
  return { sets, baseReps, repLabel: "×" };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(rawPath, "utf8"));
console.log(`Loaded ${raw.length} raw exercises`);

const seen = new Set([...EXISTING_NAMES].map(n => n.toLowerCase()));
// Also seed seen-IDs from existing names so hyphen/space variants don't slip through
const seenIds = new Set([...EXISTING_NAMES].map(n => exerciseId(n)));
const results = [];
const skipped = [];

for (const ex of raw) {
  const name = ex.name?.trim();
  if (!name) continue;

  const lname = name.toLowerCase();
  const id    = exerciseId(name);
  if (seen.has(lname) || seenIds.has(id)) { skipped.push(name); continue; }

  const equip = EQUIP_MAP[ex.equipment?.toLowerCase()] || "bodyweight";
  // Skip equipment we don't support in the app UI
  if (!["bodyweight","dumbbells","bands","machines","barbell","kettlebell","mobility"].includes(equip)) {
    skipped.push(name + " [unknown equip]");
    continue;
  }

  const diff = DIFF_MAP[ex.level] || "novice";
  const primary = mapMuscles(ex.primaryMuscles || []);
  const secondary = mapMuscles(ex.secondaryMuscles || []);

  if (primary.length === 0) { skipped.push(name + " [no muscles]"); continue; }

  const category = primary[0];
  const tip = makeTip(ex.instructions || []) || ex.name;
  const { sets, baseReps, repLabel } = defaultSetsReps(category, equip, diff);

  seenIds.add(id);
  results.push({
    id,
    name,
    sets,
    baseReps,
    repLabel,
    tip,
    folder: "Goblet_Squat", // placeholder — no local images for these
    primary,
    secondary,
    category,
    difficulty: diff,
    equipment: equip,
    ageFriendly: ageFriendly(equip, diff, name),
    source: "free-exercise-db",
  });

  seen.add(lname);
}

console.log(`Mapped: ${results.length}, Skipped: ${skipped.length}`);
console.log("Skipped:", skipped.slice(0, 20).join(", "), skipped.length > 20 ? `... +${skipped.length-20} more` : "");

// ── Write output ──────────────────────────────────────────────────────────────
const lines = results.map(ex => {
  const obj = {
    id: ex.id,
    name: ex.name,
    sets: ex.sets,
    baseReps: ex.baseReps,
    repLabel: ex.repLabel,
    tip: ex.tip,
    folder: ex.folder,
    primary: ex.primary,
    secondary: ex.secondary,
    category: ex.category,
    difficulty: ex.difficulty,
    equipment: ex.equipment,
    ageFriendly: ex.ageFriendly,
    source: ex.source,
  };
  return "  " + JSON.stringify(obj);
});

const output = `// AUTO-GENERATED by scripts/map-exercises.mjs — do not edit by hand
// Source: yuhonas/free-exercise-db (Unlicense / public domain)
// ${results.length} exercises mapped, deduped against EXERCISE_LIBRARY

export const EXERCISE_DB_EXTENDED = [
${lines.join(",\n")}
];
`;

writeFileSync(outPath, output, "utf8");
console.log(`Written → ${outPath}`);

// ─────────────────────────────────────────── WORKOUT DATA
export const WORKOUTS = {
  A: {
    label: "Workout A", days: "Mon & Fri", color: "#4ade80",
    exercises: [
      { name: "Goblet Squat", sets: 3, baseReps: 10, repLabel: "x", tip: "Squat deep, chest up", folder: "Goblet_Squat", primary: ["quads", "glutes"], secondary: ["core", "calves"] },
      { name: "Floor Press", sets: 3, baseReps: 10, repLabel: "x", tip: "Elbows 45° from body", folder: "Dumbbell_Floor_Press", primary: ["chest", "triceps"], secondary: ["frontDelts"] },
      { name: "Bent Over Row", sets: 3, baseReps: 10, repLabel: "x", tip: "Hinge at hips, pull to hip", folder: "Bent_Over_Two-Dumbbell_Row", primary: ["lats", "upperBack"], secondary: ["biceps", "rearDelts"] },
      { name: "Arnold Press", sets: 3, baseReps: 10, repLabel: "x", tip: "Rotate palms as you press", folder: "Arnold_Dumbbell_Press", primary: ["frontDelts", "sideDelts"], secondary: ["triceps", "upperBack"] },
      { name: "Hammer Curl", sets: 3, baseReps: 12, repLabel: "x", tip: "Neutral grip, control down", folder: "Hammer_Curls", primary: ["biceps"], secondary: ["forearms"] },
    ],
  },
  B: {
    label: "Workout B", days: "Wednesday", color: "#60a5fa",
    exercises: [
      { name: "Romanian Deadlift", sets: 3, baseReps: 10, repLabel: "x", tip: "Hinge at hips, soft knees", folder: "Romanian_Deadlift", primary: ["hamstrings", "glutes"], secondary: ["lowerBack", "upperBack"] },
      { name: "Reverse Lunge", sets: 3, baseReps: 10, repLabel: "x", repSuffix: "/leg", tip: "Keep front shin vertical", folder: "Dumbbell_Rear_Lunge", primary: ["quads", "glutes"], secondary: ["hamstrings", "calves"] },
      { name: "Rear Delt Row", sets: 3, baseReps: 12, repLabel: "x", tip: "Elbows flared, squeeze back", folder: "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", primary: ["rearDelts", "upperBack"], secondary: ["lats"] },
      { name: "Tricep Kickback", sets: 3, baseReps: 12, repLabel: "x", tip: "Lock upper arm, extend fully", folder: "Tricep_Dumbbell_Kickback", primary: ["triceps"], secondary: [] },
      { name: "Calf Raise", sets: 3, baseReps: 15, repLabel: "x", tip: "Pause at top, slow down", folder: "Standing_Dumbbell_Calf_Raise", primary: ["calves"], secondary: [] },
    ],
  },
};

export const SCHEDULE = { Monday: "A", Wednesday: "B", Friday: "A" };
export const DAYS = ["Monday", "Wednesday", "Friday"];

export const MUSCLE_LABELS = {
  chest: "Chest", triceps: "Triceps", biceps: "Biceps", forearms: "Forearms",
  frontDelts: "Front Delts", sideDelts: "Side Delts", rearDelts: "Rear Delts",
  upperBack: "Upper Back", lats: "Lats", lowerBack: "Lower Back",
  core: "Core", glutes: "Glutes", quads: "Quads", hamstrings: "Hamstrings",
  calves: "Calves",
};

export const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// ─────────────────────────────────────────── DEFAULTS
export const DEFAULT_SETTINGS = {
  restSeconds: 60,
  dumbbellWeight: 15,
  soundEnabled: true,
  vibrationEnabled: true,
  sessionsPerProgression: 6,
  maxRepBonus: 5,
};

// ─────────────────────────────────────────── ACHIEVEMENTS
// Each: { id, name, desc, icon, check: (state) => boolean }
export const ACHIEVEMENTS = [
  { id: "first_lift",    name: "First Lift",       desc: "Complete your first session",                  icon: "🎯", check: s => s.totalSessions >= 1 },
  { id: "week_one",      name: "Week One",         desc: "3 sessions completed",                         icon: "📅", check: s => s.totalSessions >= 3 },
  { id: "ten_sessions",  name: "Double Digits",    desc: "10 sessions logged",                           icon: "🔟", check: s => s.totalSessions >= 10 },
  { id: "quarter",       name: "Quarter Century",  desc: "25 sessions logged",                           icon: "⚡", check: s => s.totalSessions >= 25 },
  { id: "halfway",       name: "Halfway There",    desc: "50 sessions logged",                           icon: "⚔️", check: s => s.totalSessions >= 50 },
  { id: "centurion",     name: "Centurion",        desc: "100 sessions logged",                          icon: "👑", check: s => s.totalSessions >= 100 },
  { id: "first_prog",    name: "Onwards & Upwards", desc: "First rep increase unlocked",                 icon: "↗️", check: s => s.totalProgressions >= 1 },
  { id: "five_progs",    name: "Adapt & Overcome", desc: "5 rep increases unlocked",                     icon: "💪", check: s => s.totalProgressions >= 5 },
  { id: "all_maxed",     name: "Topped Out",       desc: "Every exercise at max progression",            icon: "🏆", check: s => s.allMaxed },
  { id: "streak_3",      name: "Building Habit",   desc: "3 sessions in a row",                          icon: "🔥", check: s => s.streak >= 3 },
  { id: "streak_10",     name: "Unstoppable",      desc: "10 sessions in a row",                         icon: "⚡", check: s => s.streak >= 10 },
  { id: "perfect_week",  name: "Perfect Week",     desc: "All 3 scheduled days in one week",             icon: "✨", check: s => s.perfectWeeks >= 1 },
];

// ─────────────────────────────────────────── HELPERS
export const todayName = () =>
  ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];

export const dateStr = (d = new Date()) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const isoDate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// ISO week number (year-W##)
export const isoWeek = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

// Compute aggregate stats from history + progression
export function computeStats({ history, progression, settings }) {
  const totalSessions = history.length;
  const sortedHist = [...history].sort((a, b) => b.timestamp - a.timestamp);

  // Streak: consecutive sessions w/ ≤4.5 day gap
  let streak = 0;
  if (sortedHist.length > 0) {
    streak = 1;
    for (let i = 1; i < sortedHist.length; i++) {
      const gap = (sortedHist[i - 1].timestamp - sortedHist[i].timestamp) / 86400000;
      if (gap > 4.5) break;
      streak++;
    }
  }

  // Total progressions across all exercises
  const totalProgressions = Object.values(progression).reduce((s, p) => s + (p.repBonus || 0), 0);

  // Are all exercises maxed?
  const allExercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];
  const allMaxed = allExercises.every(ex => (progression[ex.name]?.repBonus || 0) >= settings.maxRepBonus);

  // Perfect weeks: weeks where Mon/Wed/Fri all completed
  const weekDays = {};
  for (const h of history) {
    const d = new Date(h.timestamp);
    const wk = isoWeek(d);
    if (!weekDays[wk]) weekDays[wk] = new Set();
    weekDays[wk].add(h.day);
  }
  const perfectWeeks = Object.values(weekDays).filter(s => s.has("Monday") && s.has("Wednesday") && s.has("Friday")).length;

  // Volume: weight × reps × sets per exercise per session
  // Approximate: assume completed reps = displayed reps at session time
  // We'll estimate from current progression
  const calcExVolume = (ex, repBonusAtTime = 0) => {
    const reps = ex.baseReps + repBonusAtTime;
    const dumbbellsCount = ["Goblet Squat"].includes(ex.name) ? 1 : 2;
    return reps * ex.sets * settings.dumbbellWeight * dumbbellsCount;
  };

  return { totalSessions, streak, totalProgressions, allMaxed, perfectWeeks, weekDays, calcExVolume };
}

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
      { name:"Crunch",            sets:2, baseReps:12, repLabel:"×", tip:"Curl ribs toward hips, keep lower back gently pressed down", folder:"Crunch",                                          primary:["core"],                 secondary:[]                       },
    ],
  },
};

export const SCHEDULE = { Monday:"A", Wednesday:"B", Friday:"A" };
export const DAYS = ["Monday","Wednesday","Friday"];

export const MUSCLE_LABELS = {
  chest:"Chest", triceps:"Triceps", biceps:"Biceps", forearms:"Forearms",
  frontDelts:"Front Delts", sideDelts:"Side Delts", rearDelts:"Rear Delts",
  upperBack:"Upper Back", lats:"Lats", lowerBack:"Lower Back",
  core:"Core", glutes:"Glutes", quads:"Quads", hamstrings:"Hamstrings", calves:"Calves",
};

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
  weightIncrement: 2.5,  // lbs to add when progression triggers
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
};

// Default starting weights per exercise (lbs, per dumbbell)
export const DEFAULT_WEIGHTS = {
  "Goblet Squat": 15,   "Floor Press": 12,    "Bent Over Row": 15,
  "Arnold Press": 10,   "Hammer Curl": 10,    "Romanian Deadlift": 15,
  "Reverse Lunge": 10,  "Rear Delt Row": 8,   "Tricep Kickback": 8,
  "Calf Raise": 15,     "Crunch": 0,
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
  const allHit  = setLogs.every(l => (l.reps||0) >= targetReps);
  const anyFail = setLogs.some(l => (l.reps||0) < Math.round(targetReps * 0.75));
  if (allHit)  return { action:"increase", nextWeight: Math.round((currentWeight + increment) * 4) / 4, note:`Hit all reps → add ${increment}lbs` };
  if (anyFail) return { action:"decrease", nextWeight: Math.max(Math.round((currentWeight - increment*2) * 4)/4, increment), note:`Failed reps → reduce load` };
  return { action:"maintain", nextWeight:currentWeight, note:"Almost there — same weight" };
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
    .filter(h => h.exercises?.some(e => e.name === exerciseName))
    .map(h => {
      const ex = h.exercises.find(e => e.name === exerciseName);
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

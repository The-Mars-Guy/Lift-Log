import { WORKOUTS } from "./exercises.js";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const todayName = () => ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
export const dateStr   = (d=new Date()) => d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
export const isoDate   = (d=new Date()) => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dy=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${dy}`; };
export const isoWeek   = (d=new Date()) => { const dt=new Date(d); dt.setHours(0,0,0,0); dt.setDate(dt.getDate()+4-(dt.getDay()||7)); const ys=new Date(dt.getFullYear(),0,1); return `${dt.getFullYear()}-W${String(Math.ceil(((dt-ys)/86400000+1)/7)).padStart(2,"0")}`; };

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
  visualTheme: "dark",
  scienceCoach: true,
  equipmentProfile: "fixed_dumbbells",
  availableWeights: [],  // lbs per dumbbell the user owns (fixed dumbbells). Empty = no snapping.
  trainingGoal: "hypertrophy",
  onboardingDone: false,
  cautiousJoints: [],
  beginnerFormMode: false,
  simpleMode: false,
  workoutDays: ["Mon", "Wed", "Fri"],
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
  { min:0,     name:"Ore",      badge:"hammer",       color:"#6b6b6b"  },
  { min:120,   name:"Heated",   badge:"flame",        color:"#b45309"  },
  { min:300,   name:"Struck",   badge:"cross-hammer", color:"#dd6518"  },
  { min:600,   name:"Bent",     badge:"bolt",         color:"#f97316"  },
  { min:1100,  name:"Shaped",   badge:"shield",       color:"#fbbf24"  },
  { min:1800,  name:"Quenched", badge:"moon",         color:"#64748b"  },
  { min:2800,  name:"Tempered", badge:"thermometer",  color:"#60a5fa"  },
  { min:4200,  name:"Hardened", badge:"sword",        color:"#38bdf8"  },
  { min:6200,  name:"Honed",    badge:"swords",       color:"#cbd5e1"  },
  { min:9000,  name:"Forged",   badge:"trophy",       color:"#fbbf24"  },
  { min:13000, name:"Wrought",  badge:"crown",        color:"#f59e0b"  },
  { min:20000, name:"Eternal",  badge:"sparkle",      color:"#f0f4ff"  },
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
  { id:"first_lift",   name:"First Strike",      desc:"Complete your first session",              icon:"target",    check:s=>s.totalSessions>=1  },
  { id:"week_one",     name:"First Heat",        desc:"3 sessions in the forge",                  icon:"calendar",  check:s=>s.totalSessions>=3  },
  { id:"ten_sessions", name:"Ten Strikes",       desc:"10 sessions forged",                       icon:"medal",     check:s=>s.totalSessions>=10 },
  { id:"quarter",      name:"Veteran",           desc:"25 sessions in the forge",                 icon:"bolt",      check:s=>s.totalSessions>=25 },
  { id:"halfway",      name:"Half Forged",       desc:"50 sessions forged",                       icon:"swords",    check:s=>s.totalSessions>=50 },
  { id:"centurion",    name:"Iron Century",      desc:"100 sessions in the forge",                icon:"crown",     check:s=>s.totalSessions>=100},
  { id:"first_prog",   name:"First Progression", desc:"First rep increase earned",                icon:"trend-up",  check:s=>s.totalProgressions>=1},
  { id:"five_progs",   name:"Five Progressions", desc:"5 progressions earned",                    icon:"muscle",    check:s=>s.totalProgressions>=5},
  { id:"all_maxed",    name:"Fully Tempered",    desc:"Every movement at peak reps",              icon:"trophy",    check:s=>s.allMaxed         },
  { id:"streak_3",     name:"The Fire Holds",    desc:"3 sessions in a row",                      icon:"flame",     check:s=>s.streak>=3        },
  { id:"streak_10",    name:"Unquenchable",      desc:"10 sessions in a row",                     icon:"bolt",      check:s=>s.streak>=10       },
  { id:"perfect_week", name:"Flawless Heat",     desc:"All 3 forge days hit in a week",           icon:"sparkle",   check:s=>s.perfectWeeks>=1  },
];

// ─── PERIODIZATION ───────────────────────────────────────────────────────────
const MESO_PHASES = [
  { phase:"accumulation",    label:"Accumulation",    weeks:3, color:"#60a5fa", hint:"Volume focus. Hit your targets, push reps, build work capacity." },
  { phase:"intensification", label:"Intensification", weeks:1, color:"#fb923c", hint:"Push load. Add weight where possible, fewer but heavier sets." },
  { phase:"realization",     label:"Realization",     weeks:1, color:"#a78bfa", hint:"Performance week. Test new max reps and note PRs." },
  { phase:"deload",          label:"Deload",          weeks:1, color:"#4ade80", hint:"Cut volume by 40%. Move well, recover, don't skip — this is training too." },
];
const MESO_TOTAL_WEEKS = MESO_PHASES.reduce((s, p) => s + p.weeks, 0); // 6

export function mesocyclePhase(history = []) {
  const totalSessions = history.length;
  if (totalSessions === 0) return { ...MESO_PHASES[0], weekInPhase:1, sessionInMeso:0 };
  // Roughly 3 sessions/week → 6-week meso = 18 sessions
  const sessionsPerWeek = 3;
  const sessionsPerMeso = MESO_TOTAL_WEEKS * sessionsPerWeek;
  const posInMeso = totalSessions % sessionsPerMeso;
  let cursor = 0;
  for (const phase of MESO_PHASES) {
    const phaseSessions = phase.weeks * sessionsPerWeek;
    if (posInMeso < cursor + phaseSessions) {
      return { ...phase, weekInPhase: Math.floor((posInMeso - cursor) / sessionsPerWeek) + 1, sessionInMeso: posInMeso, totalSessions };
    }
    cursor += phaseSessions;
  }
  return { ...MESO_PHASES[0], weekInPhase:1, sessionInMeso:0, totalSessions };
}

// Detect if a deload is warranted from recent feedback
export function shouldDeload(checkIns = [], history = []) {
  const recentCheckIns = [...checkIns].sort((a, b) => (b.timestamp||0) - (a.timestamp||0)).slice(0, 6);
  const hardCount = recentCheckIns.filter(ci => ci.overallFeel === "hard" || ci.overallFeel === "too_hard" || ci.energy === "low").length;
  const recentHistory = [...history].sort((a, b) => (b.timestamp||0) - (a.timestamp||0)).slice(0, 4);
  const painCount = recentHistory.filter(h => (h.exercises||[]).some(ex => (ex.setLog||[]).some(l => l.pain))).length;
  const reason = hardCount >= 3 ? `${hardCount} of last 6 sessions rated hard` : painCount >= 2 ? `Pain reported in ${painCount} of last 4 sessions` : null;
  return { needed: !!(hardCount >= 3 || painCount >= 2), hardCount, painCount, reason };
}

// ─── AVAILABLE WEIGHTS (fixed dumbbells) ──────────────────────────────────────
// Clean a raw availableWeights list: numbers only, deduped, sorted ascending.
export function cleanAvailableWeights(list) {
  if (!Array.isArray(list)) return [];
  const nums = list.map(Number).filter(n => Number.isFinite(n) && n >= 0);
  return [...new Set(nums)].sort((a, b) => a - b);
}

// Snap a weight to the nearest owned weight. dir: "nearest" | "up" | "down".
// Returns the original weight when no list provided.
export function snapWeight(weight, list, dir = "nearest") {
  const owned = cleanAvailableWeights(list);
  if (!owned.length) return weight;
  const w = Number(weight) || 0;
  if (dir === "up")   return owned.find(o => o > w) ?? owned[owned.length - 1];
  if (dir === "down") return [...owned].reverse().find(o => o < w) ?? owned[0];
  return owned.reduce((best, o) => Math.abs(o - w) < Math.abs(best - w) ? o : best, owned[0]);
}

// ─── DYNAMIC PROGRESSION ─────────────────────────────────────────────────────
// feedback: 'too_easy' | 'good' | 'hard' | 'too_hard'
export function calcDynamicTarget(currentTarget, feedback, maxTest) {
  const floor   = Math.max(3, maxTest ? Math.ceil(maxTest * 0.35) : 3);
  const ceiling = maxTest ? maxTest + 10 : currentTarget + 20;
  const adj = { too_easy: +2, easy: +2, good: +1, hard: 0, too_hard: -1, pain: -2 }[feedback] ?? 0;
  return Math.max(floor, Math.min(ceiling, currentTarget + adj));
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

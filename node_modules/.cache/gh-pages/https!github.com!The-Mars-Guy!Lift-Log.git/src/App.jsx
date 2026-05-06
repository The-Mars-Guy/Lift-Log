import { useState, useEffect, useRef } from "react";

const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

const REST_SECONDS = 60;
const SESSIONS_PER_PROGRESSION = 6;
const MAX_REP_BONUS = 5;

const WORKOUTS = {
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

const SCHEDULE = { Monday: "A", Wednesday: "B", Friday: "A" };
const DAYS = ["Monday", "Wednesday", "Friday"];

const MUSCLE_LABELS = {
  chest: "Chest", triceps: "Triceps", biceps: "Biceps", forearms: "Forearms",
  frontDelts: "Front Delts", sideDelts: "Side Delts", rearDelts: "Rear Delts",
  upperBack: "Upper Back", lats: "Lats", lowerBack: "Lower Back",
  core: "Core", glutes: "Glutes", quads: "Quads", hamstrings: "Hamstrings",
  calves: "Calves",
};

const todayName = () => ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
const dateStr = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ────────────────────────────────────────────── Animation
function ExerciseAnimation({ folder, accent }) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState({ 0: false, 1: false });

  useEffect(() => {
    const id = setInterval(() => setFrame(f => 1 - f), 700);
    return () => clearInterval(id);
  }, []);

  const ready = loaded[0] && loaded[1];

  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "1",
      maxWidth: 300, margin: "0 auto",
      background: "#fafafa", borderRadius: 10, overflow: "hidden",
      border: `1px solid ${accent}40`,
      boxShadow: `0 0 24px ${accent}11`,
    }}>
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 11, letterSpacing: "0.15em" }}>
          LOADING DEMO...
        </div>
      )}
      {[0, 1].map(i => (
        <img
          key={i}
          src={`${IMG_BASE}/${folder}/${i}.jpg`}
          alt=""
          onLoad={() => setLoaded(p => ({ ...p, [i]: true }))}
          onError={() => setLoaded(p => ({ ...p, [i]: true }))}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "contain",
            opacity: ready && frame === i ? 1 : 0,
            transition: "opacity 0.18s ease",
          }}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────── Muscle Diagram
function MuscleDiagram({ primary = [], secondary = [], accent }) {
  const fill = (m) => primary.includes(m) ? accent : secondary.includes(m) ? accent + "70" : "#262626";
  const stroke = (m) => primary.includes(m) || secondary.includes(m) ? accent : "#3a3a3a";
  const props = (m) => ({ fill: fill(m), stroke: stroke(m), strokeWidth: 0.6, style: { transition: "fill 0.4s ease, stroke 0.4s ease" } });

  const Body = ({ back }) => (
    <svg viewBox="0 0 80 165" style={{ width: 120, height: 240 }}>
      {/* Base silhouette */}
      <g fill="#141414" stroke="#2a2a2a" strokeWidth="0.6">
        <ellipse cx="40" cy="10" rx="7" ry="8" />
        <rect x="37" y="16" width="6" height="4" />
        <path d="M28 22 L52 22 L54 50 L52 75 L28 75 L26 50 Z" />
        <path d="M26 24 L20 26 L17 50 L21 52 L25 28 Z" />
        <path d="M54 24 L60 26 L63 50 L59 52 L55 28 Z" />
        <path d="M17 50 L14 75 L18 76 L21 52 Z" />
        <path d="M63 50 L66 75 L62 76 L59 52 Z" />
        <path d="M28 75 L52 75 L53 85 L27 85 Z" />
        <path d="M28 85 L40 85 L40 120 L31 120 Z" />
        <path d="M40 85 L52 85 L49 120 L40 120 Z" />
        <path d="M31 120 L40 120 L39 152 L33 152 Z" />
        <path d="M40 120 L49 120 L47 152 L41 152 Z" />
      </g>

      {!back && <>
        <path d="M30 24 L50 24 L51 38 L40 41 L29 38 Z" {...props("chest")} />
        <path d="M34 42 L46 42 L46 62 L34 62 Z" {...props("core")} />
        <path d="M27 22 L33 22 L31 30 L25 28 Z" {...props("frontDelts")} />
        <path d="M53 22 L47 22 L49 30 L55 28 Z" {...props("frontDelts")} />
        <path d="M22 26 L26 24 L24 34 L19 32 Z" {...props("sideDelts")} />
        <path d="M58 26 L54 24 L56 34 L61 32 Z" {...props("sideDelts")} />
        <path d="M21 32 L25 32 L23 48 L19 47 Z" {...props("biceps")} />
        <path d="M59 32 L55 32 L57 48 L61 47 Z" {...props("biceps")} />
        <path d="M19 51 L22 51 L20 72 L16 71 Z" {...props("forearms")} />
        <path d="M61 51 L58 51 L60 72 L64 71 Z" {...props("forearms")} />
        <path d="M29 88 L39 88 L39 117 L31 117 Z" {...props("quads")} />
        <path d="M41 88 L51 88 L48 117 L41 117 Z" {...props("quads")} />
        <path d="M32 124 L38 124 L37 148 L33 148 Z" {...props("calves")} />
        <path d="M42 124 L48 124 L46 148 L42 148 Z" {...props("calves")} />
      </>}

      {back && <>
        <path d="M27 22 L33 23 L31 30 L25 29 Z" {...props("rearDelts")} />
        <path d="M53 22 L47 23 L49 30 L55 29 Z" {...props("rearDelts")} />
        <path d="M33 22 L47 22 L46 36 L34 36 Z" {...props("upperBack")} />
        <path d="M30 38 L37 38 L37 58 L29 56 Z" {...props("lats")} />
        <path d="M50 38 L43 38 L43 58 L51 56 Z" {...props("lats")} />
        <path d="M33 60 L47 60 L46 74 L34 74 Z" {...props("lowerBack")} />
        <path d="M19 32 L23 32 L21 48 L17 47 Z" {...props("triceps")} />
        <path d="M61 32 L57 32 L59 48 L63 47 Z" {...props("triceps")} />
        <path d="M16 51 L20 51 L18 72 L14 71 Z" {...props("forearms")} />
        <path d="M64 51 L60 51 L62 72 L66 71 Z" {...props("forearms")} />
        <path d="M28 76 L40 76 L40 88 L29 86 Z" {...props("glutes")} />
        <path d="M40 76 L52 76 L51 86 L40 88 Z" {...props("glutes")} />
        <path d="M29 90 L39 90 L39 117 L31 117 Z" {...props("hamstrings")} />
        <path d="M41 90 L51 90 L48 117 L41 117 Z" {...props("hamstrings")} />
        <path d="M32 122 L38 122 L37 148 L33 148 Z" {...props("calves")} />
        <path d="M42 122 L48 122 L46 148 L42 148 Z" {...props("calves")} />
      </>}

      <text x="40" y="162" textAnchor="middle" fontSize="5" fill="#888" fontFamily="DM Mono, monospace" letterSpacing="0.5">
        {back ? "BACK" : "FRONT"}
      </text>
    </svg>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
      <Body back={false} />
      <Body back={true} />
    </div>
  );
}

// ────────────────────────────────────────────── Rest Timer
function RestTimer({ seconds, label, onSkip, onComplete, accent }) {
  const [remaining, setRemaining] = useState(seconds);
  const completedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(id);
          if (!completedRef.current) {
            completedRef.current = true;
            try { navigator.vibrate?.(200); } catch {}
            onComplete();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onComplete]);

  const pct = (remaining / seconds) * 100;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
      borderTop: `1px solid ${accent}55`,
      padding: "14px 20px",
      zIndex: 100,
      boxShadow: `0 -8px 32px ${accent}22`,
      animation: "slideUp 0.25s ease-out",
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Circular timer */}
        <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="24" cy="24" r="20" fill="none" stroke="#1a1a1a" strokeWidth="3" />
            <circle cx="24" cy="24" r="20" fill="none" stroke={accent} strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: accent, fontWeight: 500, fontFamily: "DM Mono, monospace",
          }}>
            {remaining}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>
            REST · {remaining}s
          </div>
          <div style={{ fontSize: 13, color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
        </div>

        <button onClick={onSkip} style={{
          background: "transparent", border: `1px solid ${accent}55`,
          color: accent, padding: "8px 14px", borderRadius: 6,
          fontSize: 11, letterSpacing: "0.1em", cursor: "pointer",
          fontFamily: "DM Mono, monospace", flexShrink: 0,
        }}>
          SKIP
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────── Toast
function Toast({ msg, accent, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", top: 16, left: 16, right: 16, zIndex: 200,
      animation: "slideDown 0.3s ease-out",
      pointerEvents: "none",
    }}>
      <div style={{
        maxWidth: 488, margin: "0 auto",
        background: "#0a0a0a", border: `1.5px solid ${accent}`,
        borderRadius: 10, padding: "12px 16px",
        boxShadow: `0 0 32px ${accent}66`,
        display: "flex", alignItems: "center", gap: 10,
        pointerEvents: "auto",
      }}>
        <div style={{ fontSize: 22 }}>🎯</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: accent, letterSpacing: "0.12em", fontWeight: 500 }}>PROGRESSION UNLOCKED</div>
          <div style={{ fontSize: 13, color: "#f0f0f0", marginTop: 2 }}>{msg}</div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────── Main
export default function WorkoutTracker() {
  const [activeTab, setActiveTab] = useState(() => DAYS.includes(todayName()) ? todayName() : "Monday");
  const [sets, setSets] = useState(() => lsGet("wt_sets", {}));
  const [history, setHistory] = useState(() => lsGet("wt_history", []));
  const [completed, setCompleted] = useState(() => lsGet("wt_completed", {}));
  const [progression, setProgression] = useState(() => lsGet("wt_progression", {})); // { exName: { sessions, repBonus } }
  const [expanded, setExpanded] = useState(null);
  const [restState, setRestState] = useState(null); // { label, accent }
  const [toast, setToast] = useState(null); // { msg, accent }

  useEffect(() => lsSet("wt_sets", sets), [sets]);
  useEffect(() => lsSet("wt_history", history), [history]);
  useEffect(() => lsSet("wt_completed", completed), [completed]);
  useEffect(() => lsSet("wt_progression", progression), [progression]);

  const workoutKey = SCHEDULE[activeTab];
  const workout = WORKOUTS[workoutKey];
  const accent = workout.color;

  const getRepBonus = (exName) => progression[exName]?.repBonus || 0;
  const getSessionCount = (exName) => progression[exName]?.sessions || 0;
  const getDisplayReps = (ex) => ex.baseReps + getRepBonus(ex.name);

  const toggleSet = (exIdx, setIdx) => {
    const key = `${activeTab}_${exIdx}_${setIdx}`;
    const wasOn = !!sets[key];
    setSets(p => ({ ...p, [key]: !wasOn }));
    if (!wasOn) {
      // Just turned ON — start rest timer
      const ex = workout.exercises[exIdx];
      const remaining = ex.sets - (setIdx + 1);
      const next = remaining > 0
        ? `Set ${setIdx + 2} of ${ex.name}`
        : exIdx + 1 < workout.exercises.length
          ? `Up next: ${workout.exercises[exIdx + 1].name}`
          : "Last set complete — finish workout!";
      setRestState({ label: next, accent });
    }
  };

  const setDone = (exIdx, setIdx) => !!sets[`${activeTab}_${exIdx}_${setIdx}`];
  const exDone = (exIdx) => Array.from({ length: workout.exercises[exIdx].sets }, (_, i) => setDone(exIdx, i)).every(Boolean);

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = workout.exercises.reduce((a, ex, i) => a + Array.from({ length: ex.sets }, (_, j) => setDone(i, j) ? 1 : 0).reduce((x, y) => x + y, 0), 0);
  const allDone = doneSets === totalSets;
  const isCompleted = !!completed[activeTab];

  const finishWorkout = () => {
    if (!allDone) return;

    // Update progression for each completed exercise
    const newProg = { ...progression };
    const unlocked = [];
    workout.exercises.forEach(ex => {
      const cur = newProg[ex.name] || { sessions: 0, repBonus: 0 };
      const newSessions = cur.sessions + 1;
      let newBonus = cur.repBonus;
      if (newSessions >= SESSIONS_PER_PROGRESSION && newBonus < MAX_REP_BONUS) {
        newBonus += 1;
        unlocked.push(`${ex.name} → x${ex.baseReps + newBonus}`);
        newProg[ex.name] = { sessions: 0, repBonus: newBonus };
      } else if (newSessions >= SESSIONS_PER_PROGRESSION) {
        // At cap, just reset counter
        newProg[ex.name] = { sessions: 0, repBonus: newBonus };
      } else {
        newProg[ex.name] = { sessions: newSessions, repBonus: newBonus };
      }
    });
    setProgression(newProg);

    setHistory(p => [{ day: activeTab, workout: workoutKey, date: dateStr(), timestamp: Date.now() }, ...p].slice(0, 50));
    setCompleted(p => ({ ...p, [activeTab]: dateStr() }));
    setRestState(null);

    if (unlocked.length > 0) {
      setToast({
        msg: unlocked.length === 1 ? unlocked[0] : `+1 rep on ${unlocked.length} exercises`,
        accent,
      });
    }
  };

  const resetDay = () => {
    const newSets = { ...sets };
    workout.exercises.forEach((ex, i) => {
      Array.from({ length: ex.sets }, (_, j) => { delete newSets[`${activeTab}_${i}_${j}`]; });
    });
    setSets(newSets);
    setCompleted(p => { const n = { ...p }; delete n[activeTab]; return n; });
    setExpanded(null);
    setRestState(null);
  };

  // Stats
  const totalSessions = history.length;
  const streak = (() => {
    if (history.length === 0) return 0;
    let s = 1;
    for (let i = 1; i < history.length; i++) {
      const gap = (history[i - 1].timestamp - history[i].timestamp) / (1000 * 60 * 60 * 24);
      if (gap > 4.5) break;
      s++;
    }
    return s;
  })();

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at top, ${accent}0a 0%, #050505 50%, #000 100%)`,
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#f0f0f0",
      paddingBottom: restState ? 100 : 80,
      transition: "padding-bottom 0.25s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes glow { 0%, 100% { filter: drop-shadow(0 0 4px var(--c)); } 50% { filter: drop-shadow(0 0 12px var(--c)); } }

        .set-btn {
          width: 34px; height: 34px; border-radius: 7px;
          border: 1.5px solid #3a3a3a; background: transparent;
          cursor: pointer; transition: all 0.15s ease;
          display: flex; align-items: center; justify-content: center;
          color: #777; font-size: 11px;
        }
        .set-btn:hover { border-color: #555; background: #1a1a1a; color: #aaa; }
        .set-btn.done { border-color: var(--c); background: var(--c-dim); color: var(--c); animation: glow 2s ease-in-out infinite; }
        .tab-btn {
          flex: 1; padding: 12px 4px; background: transparent;
          border: none; color: #777; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.08em; transition: all 0.18s;
          border-bottom: 2px solid transparent;
          text-transform: uppercase; font-weight: 500;
        }
        .tab-btn.active { color: var(--c); border-bottom-color: var(--c); }
        .tab-btn:hover:not(.active) { color: #bbb; }
        .ex-row { padding: 16px 20px; border-bottom: 1px solid #1a1a1a; transition: background 0.15s; }
        .ex-row.done-ex .ex-name { opacity: 0.5; text-decoration: line-through; text-decoration-color: var(--c); text-decoration-thickness: 1.5px; }
        .ex-header { cursor: pointer; }
        .ex-header:hover .ex-name { color: var(--c); }
        .finish-btn {
          width: calc(100% - 40px); margin: 0 20px;
          padding: 18px; border-radius: 12px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px; letter-spacing: 0.12em;
          cursor: pointer; border: none;
          transition: all 0.2s ease;
        }
        .finish-btn.ready { background: var(--c); color: #050505; box-shadow: 0 0 40px var(--c-glow); }
        .finish-btn.ready:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .finish-btn.not-ready { background: #1a1a1a; color: #555; cursor: not-allowed; border: 1px solid #2a2a2a; }
        .demo-card {
          margin-top: 16px; padding: 16px;
          background: linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%);
          border: 1px solid #232323; border-radius: 10px;
          animation: slideDown 0.25s ease-out;
        }
        .chevron { font-size: 9px; color: #777; transition: transform 0.2s; display: inline-block; }
        .chevron.open { transform: rotate(180deg); color: var(--c); }
        .section-label {
          font-size: 9px; color: #888; letter-spacing: 0.14em;
          text-transform: uppercase; margin-bottom: 8px; font-weight: 500;
        }
        .muscle-pill {
          display: inline-block; font-size: 11px;
          padding: 4px 10px; border-radius: 4px;
          margin: 3px; letter-spacing: 0.04em; font-weight: 500;
        }
        .yt-link {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 10px;
          background: #181818; color: #aaa;
          border: 1px solid #2a2a2a; border-radius: 7px;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.06em; cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .yt-link:hover { background: #1f1f1f; color: #ddd; border-color: #3a3a3a; }
        .stat-card {
          flex: 1; padding: 10px 12px;
          background: #0d0d0d; border: 1px solid #1f1f1f;
          border-radius: 8px;
        }
        .progress-mini {
          height: 4px; background: #1a1a1a; border-radius: 2px;
          overflow: hidden; margin-top: 6px;
        }
        .progress-mini-fill {
          height: 100%; border-radius: 2px;
          transition: width 0.4s ease;
        }
      `}</style>

      <div style={{ maxWidth: 520, margin: "0 auto", "--c": accent, "--c-dim": accent + "22", "--c-glow": accent + "55" }}>

        {/* HEADER */}
        <div style={{ padding: "32px 20px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: "0.06em", lineHeight: 0.9, color: "#fafafa" }}>
                LIFT LOG
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 6, letterSpacing: "0.12em" }}>
                15LB DUMBBELL · 3X/WEEK
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8 }}>
            <div className="stat-card">
              <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase" }}>Sessions</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#fafafa", marginTop: 2, letterSpacing: "0.04em" }}>{totalSessions}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase" }}>Streak</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: streak > 0 ? accent : "#fafafa", marginTop: 2, letterSpacing: "0.04em" }}>
                {streak} {streak > 1 && <span style={{ fontSize: 12, color: accent }}>🔥</span>}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase" }}>Today</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#fafafa", marginTop: 2, letterSpacing: "0.04em" }}>
                {DAYS.includes(todayName()) ? todayName().slice(0, 3) : "REST"}
              </div>
            </div>
          </div>
        </div>

        {/* DAY TABS */}
        <div style={{ display: "flex", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
          {DAYS.map(day => (
            <button
              key={day}
              className={`tab-btn${activeTab === day ? " active" : ""}`}
              style={{ "--c": WORKOUTS[SCHEDULE[day]].color }}
              onClick={() => { setActiveTab(day); setExpanded(null); }}
            >
              {day.slice(0, 3)}
              {completed[day] && <span style={{ display: "block", fontSize: 9, color: WORKOUTS[SCHEDULE[day]].color, marginTop: 2 }}>✓ done</span>}
            </button>
          ))}
        </div>

        {/* WORKOUT HEADER */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: accent, letterSpacing: "0.06em" }}>
                {workout.label}
              </span>
              <span style={{ fontSize: 11, color: "#999", marginLeft: 10, letterSpacing: "0.05em" }}>
                {workout.days}
              </span>
            </div>
            <button onClick={resetDay} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 6, color: "#999", fontSize: 10, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace" }}>
              RESET
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#999", letterSpacing: "0.1em" }}>PROGRESS</span>
              <span style={{ fontSize: 11, color: doneSets > 0 ? accent : "#999", letterSpacing: "0.04em" }}>
                {doneSets}/{totalSets} sets
              </span>
            </div>
            <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2 }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${(doneSets / totalSets) * 100}%`,
                background: accent,
                transition: "width 0.3s ease",
                boxShadow: doneSets > 0 ? `0 0 10px ${accent}aa` : "none",
              }} />
            </div>
          </div>
        </div>

        <div style={{ margin: "14px 20px", padding: "11px 14px", background: "#111", borderRadius: 8, border: "1px solid #1f1f1f", fontSize: 11, color: "#aaa", letterSpacing: "0.04em", lineHeight: 1.5 }}>
          💡 Tap an exercise for animation · muscle map · auto rest timer between sets
        </div>

        {/* EXERCISES */}
        <div>
          {workout.exercises.map((ex, i) => {
            const open = expanded === i;
            const reps = getDisplayReps(ex);
            const bonus = getRepBonus(ex.name);
            const sessions = getSessionCount(ex.name);
            const atMax = bonus >= MAX_REP_BONUS;

            return (
              <div key={i} className={`ex-row${exDone(i) ? " done-ex" : ""}`} style={{ "--c": accent }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div className="ex-header" style={{ flex: 1, minWidth: 0 }} onClick={() => setExpanded(open ? null : i)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {exDone(i) && <span style={{ color: accent, fontSize: 13 }}>✓</span>}
                      <span className="ex-name" style={{ fontSize: 15, fontWeight: 500, color: "#f5f5f5", transition: "color 0.15s" }}>
                        {ex.name}
                      </span>
                      <span className={`chevron${open ? " open" : ""}`}>▼</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>{ex.sets} × {ex.repLabel}{reps}{ex.repSuffix || ""}</span>
                      {bonus > 0 && (
                        <span style={{ color: accent, fontSize: 10, fontWeight: 500 }}>↑+{bonus}{atMax ? " MAX" : ""}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {Array.from({ length: ex.sets }, (_, j) => (
                      <button
                        key={j}
                        className={`set-btn${setDone(i, j) ? " done" : ""}`}
                        onClick={() => toggleSet(i, j)}
                      >
                        {setDone(i, j) ? "✓" : j + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {open && (
                  <div className="demo-card">
                    <div className="section-label">Animation</div>
                    <ExerciseAnimation folder={ex.folder} accent={accent} />

                    <div style={{ marginTop: 14, padding: "12px 14px", background: "#080808", borderRadius: 7, border: `1px solid ${accent}33` }}>
                      <div className="section-label" style={{ marginBottom: 4 }}>Form Cue</div>
                      <div style={{ fontSize: 13, color: "#f0f0f0" }}>→ {ex.tip}</div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div className="section-label">Muscles Targeted</div>
                      <MuscleDiagram primary={ex.primary} secondary={ex.secondary} accent={accent} />
                    </div>

                    <div style={{ marginTop: 12, textAlign: "center" }}>
                      <div style={{ marginBottom: 6 }}>
                        {ex.primary.map(m => (
                          <span key={m} className="muscle-pill" style={{ background: accent, color: "#0a0a0a" }}>{MUSCLE_LABELS[m]}</span>
                        ))}
                      </div>
                      {ex.secondary.length > 0 && (
                        <div>
                          {ex.secondary.map(m => (
                            <span key={m} className="muscle-pill" style={{ background: "transparent", color: accent, border: `1px solid ${accent}66` }}>{MUSCLE_LABELS[m]}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 9, color: "#888", marginTop: 6, letterSpacing: "0.1em" }}>■ PRIMARY · □ SECONDARY</div>
                    </div>

                    {/* Progression bar */}
                    <div style={{ marginTop: 16, padding: "12px 14px", background: "#080808", borderRadius: 7, border: "1px solid #1f1f1f" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="section-label" style={{ marginBottom: 0 }}>Progression</span>
                        <span style={{ fontSize: 10, color: atMax ? accent : "#aaa" }}>
                          {atMax ? "MAX REACHED" : `${sessions}/${SESSIONS_PER_PROGRESSION} sessions`}
                        </span>
                      </div>
                      <div className="progress-mini" style={{ marginTop: 8 }}>
                        <div className="progress-mini-fill" style={{
                          width: `${(sessions / SESSIONS_PER_PROGRESSION) * 100}%`,
                          background: accent,
                          boxShadow: sessions > 0 ? `0 0 6px ${accent}88` : "none",
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#999", marginTop: 8, lineHeight: 1.5 }}>
                        {atMax
                          ? `You've maxed reps at ${ex.repLabel}${reps}. Try slowing the eccentric (3s down) for more stimulus.`
                          : `Complete ${SESSIONS_PER_PROGRESSION - sessions} more session${SESSIONS_PER_PROGRESSION - sessions === 1 ? "" : "s"} to bump to ${ex.repLabel}${reps + 1}`}
                      </div>
                    </div>

                    <a
                      className="yt-link"
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " dumbbell form")}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ marginTop: 14 }}
                    >
                      ▶ MORE DEMOS ON YOUTUBE
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FINISH */}
        <div style={{ marginTop: 28 }}>
          {isCompleted ? (
            <div style={{ textAlign: "center", padding: "20px", margin: "0 20px", background: `${accent}11`, borderRadius: 12, border: `1px solid ${accent}44` }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: accent, letterSpacing: "0.1em" }}>
                ✓ COMPLETED {completed[activeTab]}
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>solid work. see you next session.</div>
            </div>
          ) : (
            <button
              className={`finish-btn${allDone ? " ready" : " not-ready"}`}
              onClick={finishWorkout}
              disabled={!allDone}
            >
              {allDone ? "FINISH WORKOUT" : `${totalSets - doneSets} SETS REMAINING`}
            </button>
          )}
        </div>

        {/* HISTORY */}
        {history.length > 0 && (
          <div style={{ padding: "32px 20px 0" }}>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.14em", marginBottom: 14, textTransform: "uppercase", fontWeight: 500 }}>
              Recent Sessions
            </div>
            {history.slice(0, 8).map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #161616" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, padding: "3px 9px", borderRadius: 4,
                    background: WORKOUTS[h.workout].color + "22",
                    color: WORKOUTS[h.workout].color,
                    letterSpacing: "0.06em", fontWeight: 500,
                  }}>{h.workout}</span>
                  <span style={{ fontSize: 13, color: "#e0e0e0" }}>{h.day}</span>
                </div>
                <span style={{ fontSize: 12, color: "#999" }}>{h.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OVERLAYS */}
      {restState && (
        <RestTimer
          seconds={REST_SECONDS}
          label={restState.label}
          accent={restState.accent}
          onSkip={() => setRestState(null)}
          onComplete={() => setRestState(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} accent={toast.accent} onClose={() => setToast(null)} />}
    </div>
  );
}

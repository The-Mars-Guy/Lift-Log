// src/views/ProfileView.jsx
// Polished profile screen — identity, XP, goals, achievements, quick settings list.
// Settings detail accessible via gear button → onSettings()

import { useMemo, useState } from "react";
import { ACHIEVEMENTS, DEFAULT_GOALS, goalProgress, makeGoal } from "../data.js";
import { FULL_EXERCISE_LIBRARY as EXERCISE_LIBRARY } from "../data/exerciseLibrary.js";
import { buildT } from "../theme.js";
import { Caps, Bar, Disp } from "../components/Primitives.jsx";
import { Icon } from "../components/Icons.jsx";

const GOAL_LABELS = {
  hypertrophy:      "Build Muscle",
  strength:         "Raw Strength",
  fatigue_friendly: "Lean & Toned",
  general:          "General Fitness",
};
const EQUIP_LABELS = {
  fixed_dumbbells:      "Fixed Dumbbells",
  adjustable_dumbbells: "Adjustable Dumbbells",
  gym_access:           "Full Gym",
};

export default function ProfileView({
  _userProfile = {},
  settings     = {},
  history      = [],
  achievements = [],
  goals        = DEFAULT_GOALS,
  setGoals,
  exConfig     = {},
  accent,
  theme,
  level,
  onSettings,
}) {
  const [addingGoal, setAddingGoal]   = useState(false);
  const [goalForm,   setGoalForm]     = useState({ exerciseName:"", type:"weight", targetValue:"", targetDate:"", note:"" });

  const t     = buildT(accent);
  const light = theme === "pop_light";

  // Streak — count consecutive-day sessions from most recent
  const streak = useMemo(() => {
    if (!history.length) return 0;
    const days = [...new Set(
      history.map(s => new Date(s.timestamp || 0).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));
    let count = 0;
    let prev  = null;
    for (const d of days) {
      const curr = new Date(d);
      if (!prev) { count = 1; prev = curr; continue; }
      const diff = Math.round((prev - curr) / 86400000);
      if (diff === 1) { count++; prev = curr; }
      else break;
    }
    return count;
  }, [history]);

  // Sessions this week (Mon–Sun)
  const sessionsThisWeek = useMemo(() => {
    const d   = new Date();
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    return history.filter(s => (s.timestamp || 0) >= mon.getTime()).length;
  }, [history]);

  const xpPct    = level?.pct   ?? 0;
  const levelNum = (level?.idx  ?? 0) + 1;
  const levelName = level?.name ?? "Apprentice";

  const saveGoal = () => {
    if (!goalForm.targetValue) return;
    const g = makeGoal({ ...goalForm, targetValue: Number(goalForm.targetValue) });
    setGoals?.(prev => [...(prev || []), g]);
    setAddingGoal(false);
    setGoalForm({ exerciseName:"", type:"weight", targetValue:"", targetDate:"", note:"" });
  };
  const deleteGoal   = (id) => setGoals?.(prev => (prev||[]).filter(g => g.id !== id));
  const markAchieved = (id) => setGoals?.(prev => (prev||[]).map(g => g.id === id ? { ...g, achieved:true, achievedAt:Date.now() } : g));

  const activeGoals = (Array.isArray(goals) ? goals : DEFAULT_GOALS).filter(g => !g.achieved);
  const doneGoals   = (Array.isArray(goals) ? goals : DEFAULT_GOALS).filter(g => g.achieved);

  const trainingGoal = settings.trainingGoal      || "general";
  const equipProfile = settings.equipmentProfile  || "fixed_dumbbells";
  const workoutDays  = settings.workoutDays        || ["Mon","Wed","Fri"];
  const coachOn      = settings.scienceCoach       !== false;
  const soundOn      = settings.soundEnabled       !== false;

  // Theme tokens
  const cardBg  = light ? "rgba(255,255,255,.90)" : "#0e0b08";
  const cardBg2 = light ? "rgba(240,245,252,.80)" : "#130f0a";
  const border  = light ? "rgba(112,132,160,.18)" : "rgba(255,140,50,.09)";
  const lineSep = light ? "rgba(112,132,160,.10)" : "rgba(255,140,50,.06)";
  const tp      = light ? "#172033" : "#f4efe6";
  const ts      = light ? "#435166" : "#bdb1a1";
  const tm      = light ? "#6b788c" : "#928574";
  const tt      = light ? "#8a97a8" : "#6c6153";
  const shadow  = light ? "0 8px 24px rgba(25,45,80,.10)" : "0 8px 24px rgba(0,0,0,.28)";
  const iconBg  = light ? "rgba(0,0,0,.06)"  : "rgba(255,255,255,.06)";

  const SETTINGS_ROWS = [
    { icon:"target",   label:"Forge Goal",     sub: GOAL_LABELS[trainingGoal] || trainingGoal, section:"Smith"           },
    { icon:"barbell",  label:"Equipment",      sub: EQUIP_LABELS[equipProfile] || equipProfile, section:"Smith"          },
    { icon:"calendar", label:"Schedule",       sub: workoutDays.join(" · "),                    section:"Profile"        },
    { icon:"robot",    label:"Smith",          sub: coachOn ? "Smith · On" : "Smith · Off",     section:"Smith"          },
    { icon:"note",     label:"Sound & Haptics",sub: soundOn ? "Sound on" : "Sound off",         section:"Device Feedback"},
    { icon:"save",     label:"Data & Settings",sub: "Export, backup, advanced options",          section:"Data"          },
  ];

  return (
    <div style={{ overflowX:"hidden", paddingBottom:120 }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ padding:"34px 16px 18px", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <Caps t={t} size={10} color={tm}>ACCOUNT</Caps>
          <div style={{ fontSize:30, fontFamily:"'Bebas Neue', sans-serif", letterSpacing:".06em", color:tp, marginTop:3, lineHeight:1 }}>Profile</div>
          <div style={{ fontSize:12, color:tt, marginTop:4 }}>{levelName} · {EQUIP_LABELS[equipProfile] || equipProfile}</div>
        </div>
        <button
          onClick={onSettings}
          style={{
            marginTop:4, width:36, height:36, borderRadius:9,
            background:cardBg2, border:`1px solid ${border}`,
            color:ts, display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer",
          }}
        >
          <GearIcon size={17} color={ts} />
        </button>
      </div>

      {/* ── Identity card ─────────────────────────────────────────── */}
      <div style={{ padding:"0 16px" }}>
        <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${border}`, padding:18, display:"flex", alignItems:"center", gap:14, boxShadow:shadow }}>
          {/* Level avatar */}
          <div style={{
            width:64, height:64, borderRadius:12, flexShrink:0,
            background:`linear-gradient(135deg, ${accent}, ${accent}60)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Bebas Neue', sans-serif", fontSize:28, color:"#0a0604",
            border:`1px solid ${border}`,
          }}>
            {levelNum}
          </div>
          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <Caps t={t} size={9} color={tm}>LEVEL {levelNum} · STREAK {streak}</Caps>
            <div style={{ color:tp, fontWeight:700, fontSize:18, marginTop:3 }}>{levelName}</div>
            {/* XP bar */}
            <div style={{ marginTop:9, position:"relative", height:4, background:light?"rgba(0,0,0,.10)":"rgba(255,255,255,.08)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ width:`${Math.round(xpPct * 100)}%`, height:"100%", background:accent, borderRadius:99, transition:"width 0.5s ease" }}/>
            </div>
            <div style={{ marginTop:4, color:tt, fontSize:10, fontFamily:"'Geist Mono', monospace" }}>
              {level?.xp ?? 0} XP{level?.next ? ` · ${level.next.min - (level.xp ?? 0)} to ${level.next.name}` : " · Max rank"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats ───────────────────────────────────────────── */}
      <div style={{ padding:"10px 16px 0", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          { label:"THIS WEEK", value:sessionsThisWeek, sub:"sessions" },
          { label:"ALL TIME",  value:history.length,   sub:"sessions" },
          { label:"STREAK",    value:streak,            sub:`day${streak !== 1 ? "s" : ""}` },
        ].map((s, i) => (
          <div key={i} style={{ background:cardBg, borderRadius:12, border:`1px solid ${border}`, padding:"12px 13px", boxShadow:shadow }}>
            <Caps t={t} size={10} color={tm}>{s.label}</Caps>
            <Disp t={t} size={24} style={{ display:"block", marginTop:4 }}>{s.value}</Disp>
            <div style={{ color:tt, fontSize:11, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Goals ────────────────────────────────────────────────── */}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10, paddingLeft:2 }}>
          <Caps t={t} size={10} color={ts}>GOALS · {activeGoals.length} ACTIVE</Caps>
          <button onClick={() => setAddingGoal(v => !v)} style={{
            padding:"5px 11px", borderRadius:8, cursor:"pointer",
            border:`1px solid ${accent}66`, background:"transparent",
            color:accent, fontSize:11, fontWeight:800,
          }}>+ NEW</button>
        </div>

        {/* Add form */}
        {addingGoal && (
          <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${accent}44`, padding:14, marginBottom:10, boxShadow:shadow }}>
            <div style={{ display:"grid", gap:8 }}>
              <select value={goalForm.exerciseName} onChange={e => setGoalForm(f => ({...f, exerciseName:e.target.value}))}
                style={{ width:"100%", background:cardBg2, border:`1px solid ${border}`, borderRadius:8, color:tp, padding:"10px 11px", fontSize:13, outline:"none" }}>
                <option value="">— exercise (or blank for sessions) —</option>
                {EXERCISE_LIBRARY.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
              </select>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                {[["weight","Weight (lb)"],["reps","Max reps"],["sessions","Sessions"]].map(([k,l]) => (
                  <button key={k} onClick={() => setGoalForm(f => ({...f, type:k}))}
                    style={{ padding:"9px 4px", borderRadius:8, border:`1px solid ${goalForm.type===k?accent:border}`, background:goalForm.type===k?`${accent}22`:cardBg2, color:goalForm.type===k?accent:tm, fontSize:11, fontWeight:800, cursor:"pointer" }}>
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <input type="number" min="1" value={goalForm.targetValue} onChange={e => setGoalForm(f => ({...f, targetValue:e.target.value}))}
                  placeholder="Target value" inputMode="numeric"
                  style={{ background:cardBg2, border:`1px solid ${border}`, borderRadius:8, color:tp, padding:"10px 11px", fontSize:14, fontWeight:700, outline:"none", width:"100%", boxSizing:"border-box" }} />
                <input type="date" value={goalForm.targetDate} onChange={e => setGoalForm(f => ({...f, targetDate:e.target.value}))}
                  style={{ background:cardBg2, border:`1px solid ${border}`, borderRadius:8, color:tp, padding:"10px 11px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <button onClick={() => setAddingGoal(false)} style={{ padding:"11px", border:`1px solid ${border}`, borderRadius:9, background:"transparent", color:tm, fontWeight:800, cursor:"pointer" }}>CANCEL</button>
                <button onClick={saveGoal} disabled={!goalForm.targetValue}
                  style={{ padding:"11px", border:"none", borderRadius:9, background:goalForm.targetValue?accent:iconBg, color:goalForm.targetValue?"#0a0604":tm, fontWeight:900, letterSpacing:".06em", cursor:goalForm.targetValue?"pointer":"default" }}>
                  SAVE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active goals */}
        {activeGoals.length === 0 && !addingGoal && (
          <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${border}`, padding:"18px 16px", textAlign:"center", color:tm, fontSize:13, boxShadow:shadow }}>
            No active goals — tap + NEW to set your first target.
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {activeGoals.map(goal => {
            const prog = goalProgress(goal, history, exConfig, history.length);
            const barColor = prog.achieved ? "#4ade80" : prog.onTrack ? accent : "#fbbf24";
            const typeLabel = goal.type === "weight" ? " lb" : goal.type === "sessions" ? " sessions" : " reps";
            return (
              <div key={goal.id} style={{ background:cardBg, borderRadius:14, border:`1px solid ${prog.achieved?"#4ade8044":border}`, padding:"14px 16px", boxShadow:shadow }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:tp, fontWeight:600, fontSize:14 }}>{goal.exerciseName || "Total Sessions"}</div>
                    {goal.note && <div style={{ color:tt, fontSize:11, marginTop:1 }}>{goal.note}</div>}
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <Disp t={t} size={20} color={barColor}>
                      {prog.current}<span style={{ fontSize:10, color:tt }}>{typeLabel}</span>
                    </Disp>
                    <div style={{ color:tt, fontSize:9, marginTop:1 }}>of {goal.targetValue}{typeLabel}</div>
                  </div>
                </div>
                <div style={{ margin:"10px 0 6px" }}>
                  <Bar t={t} value={prog.pct} max={1} color={barColor} bg={light?"rgba(0,0,0,.08)":"rgba(255,255,255,.07)"} height={4} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:tt }}>{Math.round(prog.pct*100)}%{prog.daysLeft != null ? ` · ${prog.daysLeft}d left` : ""}</span>
                  <div style={{ display:"flex", gap:6 }}>
                    {!goal.achieved && prog.pct >= 1 && (
                      <button onClick={() => markAchieved(goal.id)} style={{ padding:"4px 8px", border:`1px solid #4ade8066`, borderRadius:6, background:"#4ade8022", color:"#4ade80", fontSize:10, fontWeight:800, cursor:"pointer" }}>MARK ✓</button>
                    )}
                    <button onClick={() => deleteGoal(goal.id)} style={{ background:"transparent", border:"none", color:tt, fontSize:13, cursor:"pointer", padding:"2px 4px" }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Achieved goals (compact) */}
        {doneGoals.length > 0 && (
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:5 }}>
            {doneGoals.map(goal => (
              <div key={goal.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:`#4ade8012`, border:`1px solid #4ade8033`, borderRadius:10 }}>
                <span style={{ fontSize:12, color:"#4ade80", fontWeight:700 }}>✓ {goal.exerciseName || "Sessions"} — {goal.targetValue}{goal.type==="weight"?" lb":goal.type==="reps"?" reps":" sessions"}</span>
                <button onClick={() => deleteGoal(goal.id)} style={{ background:"transparent", border:"none", color:tt, fontSize:12, cursor:"pointer" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Achievements ─────────────────────────────────────────── */}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10, paddingLeft:2 }}>
          <Caps t={t} size={10} color={ts}>ACHIEVEMENTS · {achievements.length} OF {ACHIEVEMENTS.length}</Caps>
        </div>
        <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${border}`, boxShadow:shadow }}>
          <div style={{ padding:12, display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
            {ACHIEVEMENTS.map(a => {
              const unlocked = achievements.includes(a.id);
              return (
                <div key={a.id} style={{
                  background: unlocked ? `${accent}1a` : iconBg,
                  borderRadius:10, padding:"12px 8px 10px", textAlign:"center",
                  border:`1px solid ${unlocked ? `${accent}44` : border}`,
                  opacity: unlocked ? 1 : 0.45,
                }}>
                  <div style={{
                    width:32, height:32, margin:"0 auto", borderRadius:99,
                    background: unlocked ? accent : iconBg,
                    color: unlocked ? "#0a0604" : tm,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}><Icon name={a.icon} size={16} color={unlocked ? "#0a0604" : tm} /></div>
                  <div style={{ color:tp, fontWeight:600, fontSize:12, marginTop:6, lineHeight:1.2 }}>{a.name}</div>
                  <div style={{ color:tt, fontSize:11, marginTop:2, lineHeight:1.3 }}>{a.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Settings quick-list ───────────────────────────────────── */}
      <div style={{ padding:"16px 16px 0" }}>
        <Caps t={t} size={10} color={ts} style={{ paddingLeft:2, marginBottom:10, display:"inline-block" }}>SETTINGS</Caps>
        <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${border}`, boxShadow:shadow, overflow:"hidden" }}>
          {SETTINGS_ROWS.map((row, i) => (
            <div key={i} onClick={() => onSettings(row.section)} style={{
              padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
              borderBottom: i < SETTINGS_ROWS.length - 1 ? `1px solid ${lineSep}` : "none",
              cursor:"pointer",
            }}>
              <div style={{
                width:32, height:32, borderRadius:8, flexShrink:0,
                background:iconBg,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}><Icon name={row.icon} size={16} color={ts} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:tp, fontWeight:600, fontSize:14 }}>{row.label}</div>
                <div style={{ color:tt, fontSize:11, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.sub}</div>
              </div>
              <span style={{ color: light ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.18)", fontSize:18 }}>›</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function GearIcon({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

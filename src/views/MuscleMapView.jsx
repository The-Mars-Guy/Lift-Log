import { useState } from "react";
import { WORKOUTS, MUSCLE_LABELS, customRoutineWorkout } from "../data.js";
import { FULL_EXERCISE_LIBRARY } from "../data/exerciseLibrary.js";
import MuscleDiagram from "../components/MuscleDiagram.jsx";
import { muscleRecoveryStats, latestMuscleSoreness } from "../coach.js";
import { surface, text, status } from "../theme.js";
import { buildT } from "../theme.js";
import { Card, Caps, Bar, Pill, Dot } from "../components/Primitives.jsx";

// Research-backed per-muscle recovery baselines (hours)
const MUSCLE_BASE_RECOVERY_HOURS = {
  quads:      60,
  hamstrings: 60,
  glutes:     64,
  lats:       60,
  upperBack:  68,
  lowerBack:  72,
  chest:      52,
  frontDelts: 40,
  sideDelts:  40,
  rearDelts:  44,
  biceps:     42,
  triceps:    44,
  calves:     36,
  core:       28,
  forearms:   36,
};

const RECOVERY_LEGEND = [
  { color:status.good,    label:"Ready"      },
  { color:status.info,    label:"Recovering" },
  { color:status.warn,    label:"Fatigued"   },
  { color:status.caution, label:"Sore"       },
  { color:"#333",         label:"No data"    },
];

const MUSCLE_LEVELS = [
  { key:"beginner",     label:"Beginner",     min:0,   color:"#64748b" },
  { key:"novice",       label:"Novice",       min:80,  color:status.info },
  { key:"intermediate", label:"Intermediate", min:180, color:status.good },
  { key:"advanced",     label:"Advanced",     min:360, color:status.warn },
  { key:"elite",        label:"Elite",        min:650, color:"#f472b6"  },
];

const SORE_LEVELS = [
  { key:"fresh", label:"Fresh", color:status.good    },
  { key:"mild",  label:"Mild",  color:status.warn    },
  { key:"sore",  label:"Sore",  color:status.caution },
];

export default function MuscleMapView({ history, accent, checkIns = [], setCheckIns, customRoutine }) {
  const [filter, setFilter] = useState("all");
  const exercises       = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises, ...(customRoutine?.enabled ? customRoutineWorkout(customRoutine, null, { exerciseLibrary: FULL_EXERCISE_LIBRARY }).exercises : [])];
  const currentSoreness = latestMuscleSoreness(checkIns);
  const muscleStatus    = buildMuscleStatus({ history, exercises, soreness: currentSoreness });
  const fatigued        = muscleStatus.rows.filter(r => r.fatigue >= 55 || r.soreness === "sore");

  const levelColors = Object.fromEntries(muscleStatus.rows.map(row => {
    if (!row.lastHit)            return [row.muscle, "#333"];
    if (row.soreness === "sore") return [row.muscle, status.caution];
    if (row.recoveredPct >= 90)  return [row.muscle, status.good];
    if (row.recoveredPct >= 60)  return [row.muscle, status.info];
    if (row.recoveredPct >= 30)  return [row.muscle, status.warn];
    return [row.muscle, "#fb923c"];
  }));

  const focusItems  = buildMuscleFocus({ rows: muscleStatus.rows, avg: muscleStatus.avg });
  const filteredRows = muscleStatus.rows.filter(row => {
    if (filter === "ready")     return row.readiness === "Ready";
    if (filter === "recovering")return row.readiness === "Recovering";
    if (filter === "sore")      return row.soreness === "sore" || row.soreness === "mild";
    if (filter === "needs")     return muscleStatus.avg && row.recentPoints < muscleStatus.avg * 0.65 && row.planned > 0;
    return true;
  });

  const logSoreness = (muscle, level) => {
    if (!setCheckIns) return;
    setCheckIns(p => [...(p || []), { kind:"muscle_soreness", muscle, level, timestamp:Date.now() }].slice(-2000));
  };

  // Theme tokens
  const cardBg  = "#0e0b08";
  const border  = "rgba(255,140,50,.09)";
  const lineSep = "rgba(255,140,50,.06)";
  const tp      = "#f4efe6";
  const tm      = "#928574";
  const tt      = "#6c6153";
  const shadow  = "0 8px 24px rgba(0,0,0,.28)";

  return (
    <div style={{ overflowX:"hidden", paddingBottom:120 }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ padding:"34px 16px 18px", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <Caps size={10} color={tm} style={{ letterSpacing:".14em", textTransform:"uppercase", fontWeight:600 }}>RECOVERY</Caps>
          <div style={{ fontSize:30, fontFamily:"'Bebas Neue', sans-serif", letterSpacing:".06em", color:tp, marginTop:3, lineHeight:1 }}>Body Load</div>
          <div style={{ fontSize:12, color:tt, marginTop:4 }}>7-day rolling · fresh, hit, sore</div>
        </div>
        {fatigued.length > 0 && (
          <Pill color={status.caution} bg={`${status.caution}22`} style={{ marginTop:6 }}>
            {fatigued.length} sore
          </Pill>
        )}
      </div>

      {/* ── Body map ─────────────────────────────────────────────── */}
      <div style={{ padding:"0 16px" }}>
        <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${border}`, overflow:"hidden", boxShadow:shadow }}>
          <div style={{ padding:18 }}>
            <MuscleDiagram activation={muscleStatus.activation} levelColors={levelColors} accent={accent} />
          </div>
          {/* Legend */}
          <div style={{ padding:"10px 18px 14px", borderTop:`1px solid ${lineSep}`, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {RECOVERY_LEGEND.map(item => (
              <div key={item.color} style={{ display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
                <Dot color={item.color} size={6} />
                <span style={{ fontSize:10, color:tt, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top coach tip (compact, 1 item max) ─────────────────── */}
      {focusItems.length > 0 && focusItems[0].tag !== "learning" && (
        <div style={{ padding:"12px 16px 0" }}>
          <div style={{ background:cardBg, borderRadius:12, border:`1px solid ${focusItems[0].color}33`, padding:"12px 14px", display:"flex", alignItems:"flex-start", gap:10, boxShadow:shadow }}>
            <Dot color={focusItems[0].color} size={8} style={{ marginTop:4, flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:focusItems[0].color, fontWeight:700 }}>{focusItems[0].title}</div>
              <div style={{ fontSize:12, color:tm, lineHeight:1.4, marginTop:3 }}>{focusItems[0].detail}</div>
            </div>
            <Caps size={9} color={tt}>{focusItems[0].tag}</Caps>
          </div>
        </div>
      )}

      {/* ── Muscle load list ─────────────────────────────────────── */}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:10, paddingLeft:2 }}>
          <Caps size={10} color="#bdb1a1">WEEKLY LOAD · BY MUSCLE</Caps>
        </div>

        {/* Filter tabs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5, marginBottom:10 }}>
          {[["all","All"],["ready","Ready"],["recovering","Recover"],["sore","Sore"],["needs","Needs"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding:"7px 4px", borderRadius:7,
                border:`1px solid ${filter === key ? accent : "rgba(255,140,50,.10)"}`,
                background: filter === key ? `${accent}1e` : "transparent",
                color: filter === key ? accent : tm,
                fontSize:10, fontWeight:700, cursor:"pointer",
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${border}`, overflow:"hidden", boxShadow:shadow }}>
          {filteredRows.map((row, i) => (
            <MuscleRow
              key={row.muscle}
              row={row}
              avg={muscleStatus.avg}
              currentSoreness={currentSoreness[row.muscle] || null}
              onSoreness={logSoreness}
              accent={accent}
              lineSep={lineSep}
              isLast={i === filteredRows.length - 1}
            />
          ))}
          {!filteredRows.length && (
            <div style={{ padding:"18px 16px", fontSize:13, color:tm, textAlign:"center" }}>
              Nothing in this group yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Check-in CTA ─────────────────────────────────────────── */}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:shadow }}>
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background:`${accent}22`, color:accent,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, fontWeight:700,
          }}>?</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:tp, fontWeight:600, fontSize:14 }}>How does your body feel today?</div>
            <div style={{ color:tt, fontSize:12, marginTop:2, lineHeight:1.4 }}>Use Fresh · Mild · Sore chips on each muscle below.</div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Muscle row ───────────────────────────────────────────────────────────────

function MuscleRow({ row, avg, currentSoreness, onSoreness, accent, lineSep, isLast }) {
  const recovery = row.recoveryHours
    ? row.recoveredPct >= 100
      ? "Recovered"
      : `~${Math.max(1, Math.ceil(row.recoveryHours - (row.hoursSince || 0)))}h left`
    : "No recent work";
  const hitAgo = row.hoursSince != null
    ? `hit ${row.hoursSince < 1 ? `${Math.round(row.hoursSince * 60)}m` : `${Math.round(row.hoursSince)}h`} ago`
    : "not yet hit";
  const readinessColor = row.readiness === "Fatigued" ? status.caution : row.readiness === "Recovering" ? status.warn : status.good;
  const loadPct = Math.round((row.recentPoints / Math.max(row.recentPoints, 1)) * 100);

  return (
    <div style={{
      padding:"12px 16px",
      borderBottom: isLast ? "none" : `1px solid ${lineSep}`,
    }}>
      {/* Top row: name + times + % */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 120px 48px", gap:10, alignItems:"center", marginBottom:8 }}>
        <div>
          <div style={{ color:"#f4efe6", fontWeight:600, fontSize:13 }}>{row.label}</div>
          <div style={{ color:"#6c6153", fontSize:10, marginTop:2, fontFamily:"'Geist Mono', monospace" }}>
            {hitAgo} · {recovery}
          </div>
        </div>
        <Bar value={row.fatigue} max={100} color={readinessColor} bg="rgba(255,255,255,.07)" height={4} />
        <div style={{ textAlign:"right", color:readinessColor, fontFamily:"'Geist Mono', monospace", fontSize:15, fontWeight:600 }}>
          {Math.round(row.fatigue)}<span style={{ fontSize:9, color:"#443a2e", marginLeft:1 }}>%</span>
        </div>
      </div>
      {/* Soreness chips */}
      <div style={{ display:"flex", gap:4 }}>
        {SORE_LEVELS.map(level => {
          const active = currentSoreness === level.key;
          return (
            <button key={level.key} onClick={() => onSoreness?.(row.muscle, active ? null : level.key)}
              style={{
                padding:"3px 8px", borderRadius:6,
                border:`1px solid ${active ? level.color : "rgba(255,140,50,.12)"}`,
                background: active ? `${level.color}22` : "transparent",
                color: active ? level.color : "#564c3e",
                fontSize:10, fontWeight:700, cursor:"pointer", letterSpacing:".04em",
              }}>
              {level.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Data helpers (unchanged logic) ──────────────────────────────────────────

function formatHours(hours) {
  if (!hours && hours !== 0) return "—";
  if (hours < 1)  return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24 * 10) / 10}d`;
}

export function buildMuscleStatus({ history, exercises, soreness = {} }) {
  const now      = Date.now();
  const lookback = now - 28 * 86400000;
  const byMuscle = {};
  Object.keys(MUSCLE_LABELS).forEach(muscle => {
    byMuscle[muscle] = { muscle, points:0, recentPoints:0, planned:0, lastHit:null, exercises:new Set() };
  });

  exercises.forEach(ex => {
    [...(ex.primary || []), ...(ex.secondary || [])].forEach(muscle => {
      const weight = ex.primary?.includes(muscle) ? 1 : 0.5;
      byMuscle[muscle].planned += weight;
      byMuscle[muscle].exercises.add(ex.name);
    });
  });

  history.forEach(session => {
    (session.exercises || []).forEach(logged => {
      const base = exercises.find(ex => ex.name === (logged.originalName || logged.name)) || exercises.find(ex => ex.name === logged.name);
      if (!base) return;
      const sets = logged.setLog?.length || logged.sets || base.sets || 1;
      const reps = logged.setLog?.reduce((sum, set) => sum + (set.reps || 0), 0) || ((logged.reps || base.baseReps || 0) * sets);
      [...(base.primary || []), ...(base.secondary || [])].forEach(muscle => {
        const role   = base.primary?.includes(muscle) ? 1 : 0.5;
        const points = Math.round((sets * 8 + reps) * role);
        byMuscle[muscle].points       += points;
        if ((session.timestamp || 0) >= lookback) byMuscle[muscle].recentPoints += points;
        byMuscle[muscle].lastHit = Math.max(byMuscle[muscle].lastHit || 0, session.timestamp || 0);
        byMuscle[muscle].exercises.add(base.name);
      });
    });
  });

  const rows = Object.values(byMuscle).map(item => {
    const level       = [...MUSCLE_LEVELS].reverse().find(l => item.points >= l.min) || MUSCLE_LEVELS[0];
    const hoursSince  = item.lastHit ? Math.max(0, (now - item.lastHit) / 3600000) : null;
    const baseHours   = MUSCLE_BASE_RECOVERY_HOURS[item.muscle] || 48;
    const loadMult    = item.recentPoints > 180 ? 1.2 : item.recentPoints > 50 ? 1.0 : item.recentPoints > 0 ? 0.7 : 0;
    const recoveryHours   = Math.round(baseHours * loadMult);
    const recoveredPct    = recoveryHours ? Math.min(100, Math.round((hoursSince / recoveryHours) * 100)) : 100;
    const sorenessLevel   = soreness[item.muscle] || null;
    const sorenessPenalty = sorenessLevel === "sore" ? 35 : sorenessLevel === "mild" ? 15 : 0;
    const fatigue         = Math.min(100, (recoveryHours ? Math.max(0, 100 - recoveredPct) : 0) + sorenessPenalty);
    const readiness       = sorenessLevel === "sore" || fatigue >= 55 ? "Fatigued" : fatigue >= 25 ? "Recovering" : "Ready";
    return {
      ...item,
      label:MUSCLE_LABELS[item.muscle] || item.muscle,
      level,
      hoursSince,
      recoveryHours,
      recoveredPct,
      fatigue,
      readiness,
      soreness:sorenessLevel,
      exercises:[...item.exercises],
    };
  });

  const activeRows = rows.filter(row => row.planned > 0 || row.points > 0);
  const avg        = activeRows.length ? activeRows.reduce((s, r) => s + r.recentPoints, 0) / activeRows.length : 0;
  const max        = Math.max(...activeRows.map(r => r.recentPoints), 1);
  return {
    rows: activeRows.sort((a,b) => b.fatigue - a.fatigue || b.recentPoints - a.recentPoints),
    activation: Object.fromEntries(rows.map(r => [r.muscle, r.recentPoints / max])),
    avg,
  };
}

function buildMuscleFocus({ rows, avg }) {
  const sore      = rows.find(r => r.soreness === "sore");
  const needs     = rows.find(r => avg && r.recentPoints < avg * 0.65 && r.planned > 0);
  const ready     = rows.find(r => r.readiness === "Ready" && r.planned > 0);
  const recovering = rows.find(r => r.readiness === "Recovering");
  const items = [];
  if (sore)      items.push({ title:`Ease ${sore.label}`, tag:"protect", color:status.caution, detail:`Marked sore. Bias swaps or lighter tempo for ${sore.exercises.slice(0,2).join(" / ")}.` });
  if (needs)     items.push({ title:`Bring Up ${needs.label}`, tag:"balance", color:status.warn, detail:`Below average recent volume. Add clean sets when not sore.` });
  if (ready)     items.push({ title:`Push ${ready.label}`, tag:"ready", color:status.good, detail:`Recovery looks good — strong candidate for normal or harder work.` });
  if (recovering && items.length < 2) items.push({ title:`Watch ${recovering.label}`, tag:"recover", color:status.info, detail:`Not fully fresh. Keep reps clean, avoid chasing failure.` });
  return items.slice(0, 2).length ? items.slice(0, 2) : [{ title:"Keep Logging", tag:"learning", color:status.info, detail:"More workouts and check-ins sharpen these recommendations." }];
}

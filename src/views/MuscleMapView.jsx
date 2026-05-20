import { useState } from "react";
import { WORKOUTS, MUSCLE_LABELS, customRoutineWorkout } from "../data.js";
import MuscleDiagram from "../components/MuscleDiagram.jsx";
import { muscleRecoveryStats, latestMuscleSoreness } from "../coach.js";
import { surface, text, status } from "../theme.js";
import { Card, Caps, Bar, Pill, Dot } from "../components/Primitives.jsx";

// Research-backed per-muscle recovery baselines (hours)
// Sources: NSCA JSCR 2011, PMC11057610, PubMed 30036284, 28965198
const MUSCLE_BASE_RECOVERY_HOURS = {
  quads:      60,  // 48-72h — large compound, squat/leg-press dominant
  hamstrings: 60,  // 48-72h — eccentric-dominant (RDLs, curls)
  glutes:     64,  // 48-72h — hip-hinge emphasis extends recovery
  lats:       60,  // 48-72h — multi-joint pulling
  upperBack:  68,  // 48-72h — traps/mid-back; deadlift emphasis → higher
  lowerBack:  72,  // 72-96h — erectors; longest recovery of any group
  chest:      52,  // 48-60h — upper-body pressing recovers faster than lower
  frontDelts: 40,  // 36-48h — smaller volume, faster clearance
  sideDelts:  40,  // 36-48h
  rearDelts:  44,  // ~48h — slightly slower than front/side
  biceps:     42,  // 36-48h — single-joint, fast recovery
  triceps:    44,  // 36-48h — slightly higher when paired with heavy chest day
  calves:     36,  // 24-48h — high slow-twitch ratio, fastest recovery
  core:       28,  // 24-36h — endurance fibers, tolerates high frequency
  forearms:   36,  // 24-48h — similar to calves
};

// Recovery state legend (replaces strength-level legend on body map)
const RECOVERY_LEGEND = [
  { color:status.good, label:"Ready" },
  { color:status.info, label:"Recovering" },
  { color:status.warn, label:"Fatigued" },
  { color:status.caution, label:"Sore" },
  { color:"#333",    label:"No data" },
];

// Strength-level lookup (still used in detail rows)
const MUSCLE_LEVELS = [
  { key:"beginner", label:"Beginner", min:0, color:"#64748b" },
  { key:"novice", label:"Novice", min:80, color:status.info },
  { key:"intermediate", label:"Intermediate", min:180, color:status.good },
  { key:"advanced", label:"Advanced", min:360, color:status.warn },
  { key:"elite", label:"Elite", min:650, color:"#f472b6" },
];

const SORE_LEVELS = [
  { key:"fresh", label:"Fresh", color:status.good },
  { key:"mild", label:"Mild", color:status.warn },
  { key:"sore", label:"Sore", color:status.caution },
];

export default function MuscleMapView({ history, accent, checkIns = [], setCheckIns, customRoutine }) {
  const [filter, setFilter] = useState("all");
  const exercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises, ...(customRoutine?.enabled ? customRoutineWorkout(customRoutine).exercises : [])];
  const currentSoreness = latestMuscleSoreness(checkIns);
  const muscleStatus = buildMuscleStatus({ history, exercises, soreness:currentSoreness });
  const ahead = muscleStatus.rows.filter(row => muscleStatus.avg && row.recentPoints > muscleStatus.avg * 1.25);
  const behind = muscleStatus.rows.filter(row => muscleStatus.avg && row.recentPoints < muscleStatus.avg * 0.65 && row.planned > 0);
  const fatigued = muscleStatus.rows.filter(row => row.fatigue >= 55 || row.soreness === "sore");
  const levelColors = Object.fromEntries(muscleStatus.rows.map(row => {
    if (!row.lastHit) return [row.muscle, "#333"];          // no data
    if (row.soreness === "sore") return [row.muscle, status.caution]; // self-reported sore
    if (row.recoveredPct >= 90) return [row.muscle, status.good]; // ready
    if (row.recoveredPct >= 60) return [row.muscle, status.info]; // recovering
    if (row.recoveredPct >= 30) return [row.muscle, status.warn]; // fatigued
    return [row.muscle, "#fb923c"];                         // very fatigued
  }));
  const recovery = muscleRecoveryStats(checkIns);
  const focusItems = buildMuscleFocus({ rows:muscleStatus.rows, avg:muscleStatus.avg });
  const filteredRows = muscleStatus.rows.filter(row => {
    if (filter === "ready") return row.readiness === "Ready";
    if (filter === "recovering") return row.readiness === "Recovering";
    if (filter === "sore") return row.soreness === "sore" || row.soreness === "mild";
    if (filter === "needs") return muscleStatus.avg && row.recentPoints < muscleStatus.avg * 0.65 && row.planned > 0;
    return true;
  });

  const logSoreness = (muscle, level) => {
    if (!setCheckIns) return;
    const entry = {
      kind:"muscle_soreness",
      muscle,
      level,
      timestamp:Date.now(),
    };
    setCheckIns(p => [...(p || []), entry].slice(-2000));
  };

  return (
    <div style={{overflowX:"hidden"}}>
      <div style={{padding:"34px 16px 18px"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".06em",lineHeight:.88,color:"#fafafa"}}>MUSCLE MAP</div>
        <div style={{fontSize:13,color:"#999",marginTop:7,fontWeight:600}}>readiness, recovery, balance</div>
      </div>

      <div style={{margin:"0 16px 14px",padding:"16px",background:surface.bg0,border:`1.5px solid ${accent}33`,borderRadius:12,boxShadow:`0 0 24px ${accent}10`}}>
        <MuscleDiagram activation={muscleStatus.activation} levelColors={levelColors} accent={accent}/>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",marginTop:12}}>
          {RECOVERY_LEGEND.map(item=>(
            <div key={item.color} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#aaa"}}>
              <Dot color={item.color} size={8} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <Mini label="Most Fatigued" value={fatigued[0]?.label || "None"} color={status.caution}/>
        <Mini label="Most Ready" value={muscleStatus.rows.find(row => row.readiness === "Ready")?.label || "Learning"} color={status.good}/>
        <Mini label="Ahead" value={ahead[0]?.label || "Balanced"} color={status.info}/>
        <Mini label="Needs Touch" value={behind[0]?.label || "None"} color={status.warn}/>
      </div>

      <Section title="Coach Focus" sub="what the muscle map thinks you should do next">
        <div style={{display:"grid",gap:8}}>
          {focusItems.map(item => (
            <Card key={item.title} level={1} style={{border:`1px solid ${item.color}55`,boxShadow:`0 0 20px ${item.color}10`}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}>
                <div style={{fontSize:14,color:item.color,fontWeight:800}}>{item.title}</div>
                <Caps size={9} color="#777">{item.tag}</Caps>
              </div>
              <div style={{fontSize:12,color:text.secondary,lineHeight:1.45,marginTop:5}}>{item.detail}</div>
            </Card>
          ))}
        </div>
      </Section>

      {(recovery.slowest || recovery.fastest) && (
        <Section title="Recovery Profile" sub="learned from how long each muscle stays sore">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Mini
              label="Slowest to Heal"
              value={recovery.slowest ? `${MUSCLE_LABELS[recovery.slowest.muscle] || recovery.slowest.muscle} · ${formatHours(recovery.slowest.avgHours)}` : "Learning"}
              color={status.caution}
            />
            <Mini
              label="Fastest to Heal"
              value={recovery.fastest ? `${MUSCLE_LABELS[recovery.fastest.muscle] || recovery.fastest.muscle} · ${formatHours(recovery.fastest.avgHours)}` : "Learning"}
              color={status.good}
            />
          </div>
          {recovery.entries.length > 0 && (
            <div style={{display:"grid",gap:6,marginTop:10}}>
              {recovery.entries.slice(0,6).map(item => (
                <div key={item.muscle} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:8,fontSize:12,color:"#ccc"}}>
                  <span>{MUSCLE_LABELS[item.muscle] || item.muscle}</span>
                  <span style={{color:text.tertiary}}>{formatHours(item.avgHours)} avg · {item.samples} log{item.samples===1?"":"s"}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section title="Muscle Groups" sub="fatigue is estimated from recent logged work and time since last hit">
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:10}}>
          {[
            ["all","All"],
            ["ready","Ready"],
            ["recovering","Recover"],
            ["sore","Sore"],
            ["needs","Needs"],
          ].map(([key,label]) => (
            <button key={key} onClick={()=>setFilter(key)}
              style={{padding:"8px 5px",borderRadius:7,border:`1px solid ${filter===key?accent:"#272727"}`,background:filter===key?`${accent}20`:"#0d0d0d",color:filter===key?accent:"#888",fontSize:10,fontWeight:700}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gap:8}}>
          {filteredRows.map(row=><MuscleRow key={row.muscle} row={row} avg={muscleStatus.avg} currentSoreness={currentSoreness[row.muscle]||null} onSoreness={logSoreness}/>)}
          {!filteredRows.length&&(
            <div style={{padding:"14px",background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:10,fontSize:13,color:text.tertiary,textAlign:"center"}}>Nothing in this group yet.</div>
          )}
        </div>
      </Section>

      <Section title="Reference" sub="anatomy model">
        <div style={{padding:"13px 14px",background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:10,fontSize:12,color:text.tertiary,lineHeight:1.5}}>
          The simplified body map is maintained in-app. Anatomy proportions are checked against the Wikimedia/OpenStax reference credited in CREDITS.md.
        </div>
      </Section>
    </div>
  );
}

function formatHours(hours) {
  if (!hours && hours !== 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24 * 10) / 10}d`;
}

export function buildMuscleStatus({ history, exercises, soreness = {} }) {
  const now = Date.now();
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
        const role = base.primary?.includes(muscle) ? 1 : 0.5;
        const points = Math.round((sets * 8 + reps) * role);
        byMuscle[muscle].points += points;
        if ((session.timestamp || 0) >= lookback) byMuscle[muscle].recentPoints += points;
        byMuscle[muscle].lastHit = Math.max(byMuscle[muscle].lastHit || 0, session.timestamp || 0);
        byMuscle[muscle].exercises.add(base.name);
      });
    });
  });

  const rows = Object.values(byMuscle).map(item => {
    const level = [...MUSCLE_LEVELS].reverse().find(l => item.points >= l.min) || MUSCLE_LEVELS[0];
    const hoursSince = item.lastHit ? Math.max(0, (now - item.lastHit) / 3600000) : null;
    // Per-muscle research baseline scaled by training load
    // Light load (<50pts) → 70% of base, moderate → 100%, heavy (>180pts) → 120%
    const baseHours = MUSCLE_BASE_RECOVERY_HOURS[item.muscle] || 48;
    const loadMult = item.recentPoints > 180 ? 1.2 : item.recentPoints > 50 ? 1.0 : item.recentPoints > 0 ? 0.7 : 0;
    const recoveryHours = Math.round(baseHours * loadMult);
    const recoveredPct = recoveryHours ? Math.min(100, Math.round((hoursSince / recoveryHours) * 100)) : 100;
    const sorenessLevel = soreness[item.muscle] || null;
    const sorenessPenalty = sorenessLevel === "sore" ? 35 : sorenessLevel === "mild" ? 15 : 0;
    const fatigue = Math.min(100, (recoveryHours ? Math.max(0, 100 - recoveredPct) : 0) + sorenessPenalty);
    const readiness = sorenessLevel === "sore" || fatigue >= 55 ? "Fatigued" : fatigue >= 25 ? "Recovering" : "Ready";
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
  const avg = activeRows.length ? activeRows.reduce((sum, row) => sum + row.recentPoints, 0) / activeRows.length : 0;
  const max = Math.max(...activeRows.map(row => row.recentPoints), 1);
  return {
    rows: activeRows.sort((a,b)=>b.fatigue-a.fatigue || b.recentPoints-a.recentPoints),
    activation:Object.fromEntries(rows.map(row => [row.muscle, row.recentPoints / max])),
    avg,
  };
}

function buildMuscleFocus({ rows, avg }) {
  const sorted = [...rows];
  const sore = sorted.find(row => row.soreness === "sore");
  const recovering = sorted.find(row => row.readiness === "Recovering");
  const needs = sorted.find(row => avg && row.recentPoints < avg * 0.65 && row.planned > 0);
  const ready = sorted.find(row => row.readiness === "Ready" && row.planned > 0);
  const items = [];
  if (sore) items.push({
    title:`Ease ${sore.label}`,
    tag:"protect",
    color:status.caution,
    detail:`Marked sore right now. Bias swaps, lighter tempo, or fewer sets for ${sore.exercises.slice(0,2).join(" / ")}.`,
  });
  if (needs) items.push({
    title:`Bring Up ${needs.label}`,
    tag:"balance",
    color:status.warn,
    detail:`Recent work is below your other trained muscles. Add clean volume when it is not sore.`,
  });
  if (ready) items.push({
    title:`Push ${ready.label}`,
    tag:"ready",
    color:status.good,
    detail:`Recovery looks good. This is a strong candidate for normal or slightly harder work today.`,
  });
  if (recovering && items.length < 3) items.push({
    title:`Watch ${recovering.label}`,
    tag:"recover",
    color:status.info,
    detail:`Not fully fresh yet. Keep reps clean and avoid chasing failure on related lifts.`,
  });
  return items.slice(0, 3).length ? items.slice(0, 3) : [{
    title:"Keep Logging",
    tag:"learning",
    color:status.info,
    detail:"More workouts and soreness check-ins will make these recommendations sharper.",
  }];
}

function MuscleRow({ row, avg, currentSoreness, onSoreness }) {
  const ahead = avg && row.recentPoints > avg * 1.25;
  const behind = avg && row.recentPoints < avg * 0.65 && row.planned > 0;
  const recovery = row.recoveryHours
    ? row.recoveredPct >= 100 ? "Recovered" : `~${Math.max(1, Math.ceil(row.recoveryHours - (row.hoursSince || 0)))}h left`
    : "No recent work";
  const readinessColor = row.readiness === "Fatigued" ? status.caution : row.readiness === "Recovering" ? status.warn : status.good;
  return (
    <div style={{padding:"12px 13px",background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:10}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:15,color:"#f0f0f0",fontWeight:700}}>{row.label}</div>
          <div style={{fontSize:11,color:"#777",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.exercises.slice(0,3).join(", ")}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:12,color:row.level.color,fontWeight:800,marginBottom:4}}>{row.level.label}</div>
          <Pill color={readinessColor} bg={`${readinessColor}18`}>{row.readiness}</Pill>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <SmallMeter label="Fatigue" value={row.fatigue} color={readinessColor}/>
        <SmallMeter label="Recovery" value={row.recoveredPct} color={row.recoveredPct>=100?status.good:status.info}/>
      </div>
      {/* Bottom row: stats left, soreness chips right */}
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",overflow:"hidden"}}>
        <span style={{fontSize:11,color:text.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>
          {ahead ? "ahead" : behind ? "behind" : "even"} · {row.recentPoints} pts · {recovery}
        </span>
        <div style={{display:"flex",gap:3,flexShrink:0}}>
          {SORE_LEVELS.map(level => {
            const active = currentSoreness === level.key;
            return (
              <button key={level.key} onClick={() => onSoreness?.(row.muscle, active ? null : level.key)}
                style={{padding:"4px 7px",borderRadius:6,border:`1px solid ${active?level.color:"#232323"}`,background:active?`${level.color}28`:"#101010",color:active?level.color:text.ghost,fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:".03em",lineHeight:1.2}}>
                {level.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SmallMeter({ label, value, color }) {
  return (
    <div style={{minWidth:0,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#777",fontWeight:600,marginBottom:4}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
        <span style={{flexShrink:0,marginLeft:4}}>{Math.round(value)}%</span>
      </div>
      <Bar value={value} max={100} color={color} height={6} />
    </div>
  );
}

function Mini({ label, value, color }) {
  return (
    <div style={{padding:"12px 13px",background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:10,minWidth:0,overflow:"hidden"}}>
      <Caps style={{display:"block",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</Caps>
      <div style={{fontSize:13,color,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <div style={{padding:"24px 16px 8px"}}>
      <Caps size={11} color="#ddd" weight={500}>{title}</Caps>
      {sub&&<div style={{fontSize:11,color:text.tertiary,marginTop:3,letterSpacing:".04em"}}>{sub}</div>}
      <div style={{marginTop:14}}>{children}</div>
    </div>
  );
}

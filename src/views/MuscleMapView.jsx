import { WORKOUTS, MUSCLE_LABELS } from "../data.js";
import MuscleDiagram from "../components/MuscleDiagram.jsx";

const MUSCLE_LEVELS = [
  { key:"beginner", label:"Beginner", min:0, color:"#64748b" },
  { key:"novice", label:"Novice", min:80, color:"#60a5fa" },
  { key:"intermediate", label:"Intermediate", min:180, color:"#4ade80" },
  { key:"advanced", label:"Advanced", min:360, color:"#fbbf24" },
  { key:"elite", label:"Elite", min:650, color:"#f472b6" },
];

export default function MuscleMapView({ history, accent }) {
  const exercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];
  const status = buildMuscleStatus({ history, exercises });
  const ahead = status.rows.filter(row => status.avg && row.recentPoints > status.avg * 1.25);
  const behind = status.rows.filter(row => status.avg && row.recentPoints < status.avg * 0.65 && row.planned > 0);
  const fatigued = status.rows.filter(row => row.fatigue >= 55);

  return (
    <div>
      <div style={{padding:"34px 16px 18px"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".06em",lineHeight:.88,color:"#fafafa"}}>MUSCLE MAP</div>
        <div style={{fontSize:13,color:"#999",marginTop:7,letterSpacing:".1em",textTransform:"uppercase"}}>readiness, recovery, balance</div>
      </div>

      <div style={{margin:"0 16px 14px",padding:"16px",background:"#0d0d0d",border:`1.5px solid ${accent}33`,borderRadius:12,boxShadow:`0 0 24px ${accent}12`}}>
        <MuscleDiagram activation={status.activation} accent={accent}/>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:12}}>
          {MUSCLE_LEVELS.map(level=>(
            <div key={level.key} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#aaa"}}>
              <span style={{width:9,height:9,borderRadius:3,background:level.color,display:"inline-block"}}/>
              {level.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <Mini label="Most Fatigued" value={fatigued[0]?.label || "None"} color="#fb7185"/>
        <Mini label="Most Ready" value={status.rows.find(row => row.readiness === "Ready")?.label || "Learning"} color="#4ade80"/>
        <Mini label="Ahead" value={ahead[0]?.label || "Balanced"} color="#60a5fa"/>
        <Mini label="Needs Touch" value={behind[0]?.label || "None"} color="#fbbf24"/>
      </div>

      <Section title="Muscle Groups" sub="fatigue is estimated from recent logged work and time since last hit">
        <div style={{display:"grid",gap:8}}>
          {status.rows.map(row=><MuscleRow key={row.muscle} row={row} avg={status.avg}/>)}
        </div>
      </Section>

      <Section title="Reference" sub="anatomy model">
        <div style={{padding:"13px 14px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:10,fontSize:12,color:"#888",lineHeight:1.5}}>
          The simplified body map is maintained in-app. Anatomy proportions are checked against the Wikimedia/OpenStax reference credited in CREDITS.md.
        </div>
      </Section>
    </div>
  );
}

function buildMuscleStatus({ history, exercises }) {
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
    const recoveryHours = item.recentPoints >= 180 ? 72 : item.recentPoints >= 95 ? 48 : item.recentPoints > 0 ? 24 : 0;
    const recoveredPct = recoveryHours ? Math.min(100, Math.round((hoursSince / recoveryHours) * 100)) : 100;
    const fatigue = recoveryHours ? Math.max(0, 100 - recoveredPct) : 0;
    const readiness = fatigue >= 55 ? "Fatigued" : fatigue >= 25 ? "Recovering" : "Ready";
    return {
      ...item,
      label:MUSCLE_LABELS[item.muscle] || item.muscle,
      level,
      hoursSince,
      recoveryHours,
      recoveredPct,
      fatigue,
      readiness,
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

function MuscleRow({ row, avg }) {
  const ahead = avg && row.recentPoints > avg * 1.25;
  const behind = avg && row.recentPoints < avg * 0.65 && row.planned > 0;
  const recovery = row.recoveryHours
    ? row.recoveredPct >= 100 ? "Recovered" : `~${Math.max(1, Math.ceil(row.recoveryHours - (row.hoursSince || 0)))}h left`
    : "No recent work";
  const readinessColor = row.readiness === "Fatigued" ? "#fb7185" : row.readiness === "Recovering" ? "#fbbf24" : "#4ade80";
  return (
    <div style={{padding:"12px 13px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:10}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:15,color:"#f0f0f0",fontWeight:700}}>{row.label}</div>
          <div style={{fontSize:11,color:"#777",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.exercises.slice(0,3).join(", ")}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:12,color:row.level.color,fontWeight:800}}>{row.level.label}</div>
          <div style={{fontSize:11,color:readinessColor,marginTop:2}}>{row.readiness}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <SmallMeter label="Fatigue" value={row.fatigue} color={readinessColor}/>
        <SmallMeter label="Recovery" value={row.recoveredPct} color={row.recoveredPct>=100?"#4ade80":"#60a5fa"}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:11,color:"#888"}}>
        <span>{ahead ? "ahead" : behind ? "behind" : "even"} · {row.recentPoints} work pts</span>
        <span>{recovery}</span>
      </div>
    </div>
  );
}

function SmallMeter({ label, value, color }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#777",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>
        <span>{label}</span><span>{Math.round(value)}%</span>
      </div>
      <div style={{height:6,background:"#171717",borderRadius:5,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(100, value)}%`,background:color,transition:"width .3s"}}/>
      </div>
    </div>
  );
}

function Mini({ label, value, color }) {
  return (
    <div style={{padding:"12px 13px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:10}}>
      <div style={{fontSize:10,color:"#888",letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,color,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <div style={{padding:"24px 16px 8px"}}>
      <div style={{fontSize:13,color:"#ddd",letterSpacing:".14em",textTransform:"uppercase",fontWeight:500}}>{title}</div>
      {sub&&<div style={{fontSize:12,color:"#888",marginTop:3,letterSpacing:".04em"}}>{sub}</div>}
      <div style={{marginTop:14}}>{children}</div>
    </div>
  );
}

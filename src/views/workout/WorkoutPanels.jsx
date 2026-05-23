import { useState } from "react";
import { WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, todayName, forgeWorkoutName, forgeWorkoutColor } from "../../data.js";
import { completionKey } from "../../session.js";
import { SUBSTITUTIONS, weeklyMuscleCoverage } from "../../coach.js";
import { surface, text, status } from "../../theme.js";
import { Disp, Bar, Caps, Card } from "../../components/Primitives.jsx";
import { fmtDuration } from "../../hooks.js";

function PanelLabel({ children, small }) {
  return <div style={{fontSize:small?11:12,color:text.muted,textTransform:"uppercase",letterSpacing:".12em",marginBottom:8,fontWeight:600}}>{children}</div>;
}

function GuideLine({ title, items, color }) {
  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:11,color,fontWeight:600,marginBottom:5}}>{title}</div>
      <div style={{display:"grid",gap:4}}>
        {items.map(item=><div key={item} style={{fontSize:13,color:text.secondary,lineHeight:1.45}}>• {item}</div>)}
      </div>
    </div>
  );
}

export function ExerciseGuide({ guide, accent }) {
  if (!guide) return null;
  return (
    <div style={{marginTop:20}}>
      <PanelLabel small>How to do it</PanelLabel>
      <GuideLine title="Setup" items={guide.setup} color={accent}/>
      <GuideLine title="Move" items={guide.movement} color={accent}/>
      <GuideLine title="Avoid" items={guide.mistakes} color="#fb923c"/>
      {guide.pain&&<div style={{fontSize:12,color:status.caution,lineHeight:1.45,marginTop:12}}>{guide.pain}</div>}
    </div>
  );
}

export function CoachWhyPanel({ lines }) {
  if (!lines?.length) return null;
  return (
    <details style={{marginTop:20}}>
      <summary style={{fontSize:12,color:text.faint,fontWeight:600,cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:10,color:text.ghost}}>▶</span> Why this plan
      </summary>
      <div style={{display:"grid",gap:6,marginTop:10,paddingLeft:16}}>
        {lines.map(line=>(
          <div key={line} style={{fontSize:13,color:text.tertiary,lineHeight:1.5}}>{line}</div>
        ))}
      </div>
    </details>
  );
}

export function ThisWeek({ completed, setActiveTab }) {
  const today = todayName();
  return (
    <div style={{padding:"24px 16px 16px"}}>
      <div style={{fontSize:13,color:text.tertiary,fontWeight:600,marginBottom:14}}>This Week</div>
      <div style={{display:"flex",gap:10}}>
        {DAYS.map(day=>{
          const fc=forgeWorkoutColor(day,SCHEDULE); const isDone=!!completed[completionKey(day)],isToday=day===today;
          return(
            <button key={day} onClick={()=>setActiveTab(day)}
              style={{flex:1,padding:"16px 8px",borderRadius:13,border:"none",background:isDone?`${fc}22`:isToday?surface.bg3:surface.bg1,outline:isToday?`2px solid ${fc}99`:isDone?`1px solid ${fc}44`:`1px solid rgba(255,140,50,.10)`,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:12,color:isToday?fc:isDone?fc:text.muted,letterSpacing:".1em",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>{day.slice(0,3)}</div>
              <Disp size={20} color={isDone?fc:isToday?text.primary:text.muted}>{forgeWorkoutName(day, SCHEDULE).slice(0,3).toUpperCase()}</Disp>
              <div style={{fontSize:20,marginTop:5}}>{isDone?<span style={{color:fc}}>✓</span>:isToday?<span style={{color:fc}}>→</span>:<span style={{color:text.ghost}}>·</span>}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeeklyMusclePlan({ completed, accent }) {
  const coverage = weeklyMuscleCoverage({ completed, schedule:SCHEDULE, workouts:WORKOUTS, completionKeyFn:completionKey });
  const rows = Object.entries(coverage)
    .map(([muscle, item]) => ({ muscle, label:MUSCLE_LABELS[muscle] || muscle, ...item }))
    .sort((a,b)=>b.planned-a.planned);
  const undertrained = rows.filter(row => row.planned < 1).map(row => row.label);
  return (
    <div style={{padding:"0 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{fontSize:13,color:text.tertiary,fontWeight:600}}>Muscle Coverage</div>
          <div style={{fontSize:12,color:text.muted,marginTop:3}}>planned for this week</div>
        </div>
        <div style={{fontSize:12,color:accent}}>{rows.filter(r=>r.done>0).length}/{rows.length} active</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
        {rows.slice(0,12).map(row=>{
          const pct = Math.min(100, Math.round((row.done / Math.max(row.planned, 1)) * 100));
          return (
            <div key={row.muscle} style={{padding:"10px 11px",background:surface.bg0,border:`1px solid rgba(255,140,50,.08)`,borderRadius:10}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:7}}>
                <span style={{fontSize:12,color:text.secondary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.label}</span>
                <span style={{fontSize:11,color:pct>0?accent:text.muted}}>{pct}%</span>
              </div>
              <Bar value={pct} max={100} color={accent} height={5} />
            </div>
          );
        })}
      </div>
      <div style={{fontSize:12,color:text.tertiary,lineHeight:1.45,marginTop:10}}>
        {undertrained.length ? `Watch next: ${undertrained.slice(0,3).join(", ")}.` : "Every listed muscle has at least one planned touch this week."}
      </div>
    </div>
  );
}

export function PlateauFixPanel({ fixes }) {
  if (!fixes?.length) return null;
  return (
    <div style={{marginTop:20}}>
      <PanelLabel small>Plateau fix</PanelLabel>
      <div style={{display:"grid",gap:6}}>
        {fixes.map((fix,i)=>(
          <div key={fix} style={{fontSize:13,color:"#c9a84c",lineHeight:1.5}}>{i+1}. {fix}</div>
        ))}
      </div>
      <div style={{fontSize:12,color:text.faint,lineHeight:1.45,marginTop:8}}>Shown when recent reps are fading or targets are being missed.</div>
    </div>
  );
}

export function SLabel({ children, small }) {
  return <div style={{fontSize:small?11:12,color:text.tertiary,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6,fontWeight:600}}>{children}</div>;
}

export function NoteField({ value, onChange }) {
  const [open, setOpen] = useState(!!value);
  return (
    <div style={{marginTop:10}}>
      {!open ? (
        <button onClick={()=>setOpen(true)}
          style={{background:"transparent",border:"none",padding:0,color:text.faint,fontSize:12,letterSpacing:".06em",cursor:"pointer"}}>
          + add forge note
        </button>
      ) : (
        <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder="Sleep, joints, mood, anything worth remembering..." autoFocus
          style={{width:"100%",minHeight:54,resize:"vertical",boxSizing:"border-box",padding:"11px 12px",background:surface.bg0,border:`1px solid rgba(255,140,50,.12)`,borderRadius:10,color:text.secondary,fontSize:13,lineHeight:1.45,outline:"none"}}/>
      )}
    </div>
  );
}

export function RestReady({ label, accent, onNext }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Rest complete — ready for next set" style={{position:"fixed",inset:0,zIndex:185,background:surface.bgSolid,display:"flex",alignItems:"center",justifyContent:"center",padding:"28px 22px"}}>
      <div className="mobile-shell" style={{textAlign:"center"}}>
        <div style={{fontSize:12,color:accent,fontWeight:600,marginBottom:14}}>Heat Recovered</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:54,color:text.primary,letterSpacing:".06em",lineHeight:.92,marginBottom:14}}>READY</div>
        <div style={{fontSize:15,color:text.secondary,lineHeight:1.5,marginBottom:30}}>{label}</div>
        <button onClick={onNext}
          style={{width:"100%",padding:"20px",background:accent,border:"none",borderRadius:14,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".12em",boxShadow:`0 0 42px ${accent}5c`}}>
          NEXT SET
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, sub, accent }) {
  return (
    <div style={{padding:"15px 14px",background:surface.bg0,border:`1px solid rgba(255,140,50,.10)`,borderRadius:12}}>
      <Caps style={{display:"block",marginBottom:4}}>{label}</Caps>
      <Disp size={32} color={accent} style={{display:"block"}}>{value}</Disp>
      {sub&&<div style={{fontSize:11,color:text.muted,marginTop:2}}>{sub}</div>}
    </div>
  );
}

export function WorkoutSummary({ summary, accent, onClose }) {
  if (!summary) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Workout summary" style={{position:"fixed",inset:0,zIndex:230,background:surface.bgSolid,overflowY:"auto",padding:"calc(28px + env(safe-area-inset-top)) 20px 30px"}}>
      <div className="mobile-shell">
        <div style={{fontSize:12,color:accent,fontWeight:600,marginBottom:10}}>Strike Complete</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:text.primary,letterSpacing:".06em",lineHeight:.92,marginBottom:18}}>FORGE<br/>REPORT</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <SummaryStat label="Sets" value={summary.sets} accent={accent}/>
          <SummaryStat label="Reps" value={summary.reps} accent={accent}/>
          <SummaryStat label="Volume" value={`${Math.round(summary.volume).toLocaleString()}`} sub="lbs" accent={accent}/>
          <SummaryStat label="Time" value={fmtDuration(summary.duration || 0)} accent={accent}/>
        </div>
        {summary.prs?.length>0&&(
          <div style={{padding:16,background:`${status.warn}10`,border:`1px solid ${status.warn}44`,borderRadius:12,marginBottom:12}}>
            <div style={{fontSize:11,color:status.warn,fontWeight:600,marginBottom:8}}>PRs</div>
            <div style={{fontSize:14,color:text.primary,lineHeight:1.5}}>{summary.prs.map(p=>`${p.name}: ${p.val}lbs`).join(" · ")}</div>
          </div>
        )}
        <div style={{display:"grid",gap:10,marginBottom:14}}>
          {summary.bestSet&&(
            <Card level={1}>
              <Caps style={{display:"block",marginBottom:6}}>Best Set</Caps>
              <div style={{fontSize:15,color:text.primary,lineHeight:1.45}}>{summary.bestSet.name}: {summary.bestSet.weight > 0 ? `${summary.bestSet.weight}lbs` : "bodyweight"} x {summary.bestSet.reps}</div>
            </Card>
          )}
          {summary.hardest&&(
            <Card level={1}>
              <Caps style={{display:"block",marginBottom:6}}>Limiter</Caps>
              <div style={{fontSize:15,color:text.primary,lineHeight:1.45}}>{summary.hardest.name} was the main limiter today.</div>
            </Card>
          )}
        </div>
        <Card level={1} style={{marginBottom:14}}>
          <Caps color={accent} style={{display:"block",marginBottom:8}}>Forge Note</Caps>
          <div style={{fontSize:15,color:text.secondary,lineHeight:1.55}}>{summary.coachNote}</div>
          {summary.nextChange&&<div style={{fontSize:13,color:accent,marginTop:10,lineHeight:1.45}}>{summary.nextChange}</div>}
          {summary.reasoning?.length>0&&(
            <div style={{display:"grid",gap:7,marginTop:12}}>
              {summary.reasoning.map((reason,i)=>(
                <div key={i} style={{fontSize:12,color:text.secondary,lineHeight:1.45,padding:"8px 9px",background:surface.bg0,border:`1px solid rgba(255,140,50,.08)`,borderRadius:8}}>{reason}</div>
              ))}
            </div>
          )}
          {summary.nextWorkout&&<div style={{fontSize:13,color:text.tertiary,marginTop:10}}>Next up: {summary.nextWorkout}</div>}
        </Card>
        <button onClick={onClose}
          style={{width:"100%",padding:19,background:accent,border:"none",borderRadius:14,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:".12em",boxShadow:`0 0 42px ${accent}5c`}}>
          DONE
        </button>
      </div>
    </div>
  );
}

const SET_FEELINGS = [
  { key:"easy", label:"EASY" },
  { key:"good", label:"GOOD" },
  { key:"hard", label:"HARD" },
  { key:"pain", label:"PAIN" },
];

export function SetFeelingButtons({ onPick }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}>
      {SET_FEELINGS.map(({ key, label })=>(
        <button key={key} onClick={()=>onPick(key)}
          style={{padding:"8px 4px",background:key==="pain"?`${status.caution}18`:surface.bg2,border:`1px solid ${key==="pain"?status.caution+"55":"rgba(255,140,50,.12)"}`,borderRadius:8,color:key==="pain"?status.caution:text.secondary,fontSize:10,letterSpacing:".08em"}}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function SwapLibrary({ exerciseName, activeName, accent, onApply, onRemove }) {
  const options = SUBSTITUTIONS[exerciseName] || [];
  if (!options.length) return null;
  return (
    <div style={{marginTop:20}}>
      <SLabel small>Swap options</SLabel>
      <div style={{display:"grid",gap:6}}>
        {options.map(option=>{
          const active = activeName === option.name;
          return (
            <button key={option.name} onClick={()=>active ? onRemove(exerciseName) : onApply({ exercise:exerciseName, substitute:option.name, reason:option.reason, alternatives:options }, option)}
              style={{padding:"10px 12px",background:active?`${accent}18`:surface.bg2,border:"none",borderRadius:10,textAlign:"left",color:active?accent:text.secondary}}>
              <div style={{fontSize:13,fontWeight:600}}>{option.name}{active ? " · active" : ""}</div>
              <div style={{fontSize:12,color:active?accent:text.muted,lineHeight:1.4,marginTop:2}}>{option.reason}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

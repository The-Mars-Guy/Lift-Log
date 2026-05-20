import { useState, useMemo } from "react";
import {
  EXERCISE_LIBRARY, DEFAULT_GOALS,
  goalProgress, makeGoal, mesocyclePhase, shouldDeload,
} from "../data.js";
import { surface, text, status } from "../theme.js";

export default function GoalsView({ goals = DEFAULT_GOALS, setGoals, history = [], exConfig = {}, checkIns = [], accent, totalSessions = 0 }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ exerciseName:"", type:"weight", targetValue:"", targetDate:"", note:"" });

  const phase = useMemo(() => mesocyclePhase(history), [history]);
  const deload = useMemo(() => shouldDeload(checkIns, history), [checkIns, history]);

  const activeGoals  = goals.filter(g => !g.achieved);
  const doneGoals    = goals.filter(g => g.achieved);

  const saveGoal = () => {
    if (!form.type || !form.targetValue) return;
    const g = makeGoal({ ...form, targetValue: Number(form.targetValue) });
    setGoals(prev => [...(prev || []), g]);
    setAdding(false);
    setForm({ exerciseName:"", type:"weight", targetValue:"", targetDate:"", note:"" });
  };

  const markAchieved = (id) => {
    setGoals(prev => (prev||[]).map(g => g.id === id ? { ...g, achieved:true, achievedAt:Date.now() } : g));
  };

  const deleteGoal = (id) => {
    setGoals(prev => (prev||[]).filter(g => g.id !== id));
  };

  return (
    <div>
      <div style={{padding:"34px 16px 18px"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".06em",lineHeight:.88,color:"#fafafa"}}>GOALS</div>
        <div style={{fontSize:13,color:"#999",marginTop:7,fontWeight:600}}>track targets · stay on course</div>
      </div>

      {/* Mesocycle Phase Card */}
      <div style={{margin:"0 16px 14px",padding:"14px 16px",background:surface.bg0,border:`1.5px solid ${phase.color}55`,borderRadius:12,boxShadow:`0 0 24px ${phase.color}12`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10,color:phase.color,fontWeight:700}}>Training Phase</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#fafafa",letterSpacing:".06em",lineHeight:1.1,marginTop:2}}>{phase.label}</div>
            <div style={{fontSize:12,color:text.tertiary,marginTop:5,lineHeight:1.5}}>{phase.hint}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:phase.color,letterSpacing:".04em"}}>{totalSessions}</div>
            <div style={{fontSize:10,color:"#777",fontWeight:600}}>Sessions</div>
          </div>
        </div>
      </div>

      {/* Deload alert */}
      {deload.needed && (
        <div style={{margin:"0 16px 14px",padding:"12px 14px",background:"#fb718511",border:"1px solid #fb718555",borderRadius:10}}>
          <div style={{fontSize:12,color:status.caution,fontWeight:900}}>⚠ Deload Recommended</div>
          <div style={{fontSize:12,color:"#aaa",lineHeight:1.45,marginTop:4}}>{deload.reason}. Cut sets by 40% for 1 week — keep moving, let the body consolidate.</div>
        </div>
      )}

      {/* Active Goals */}
      <Section title={`Active Goals (${activeGoals.length})`} action={<button onClick={()=>setAdding(a=>!a)} style={{padding:"6px 12px",border:`1px solid ${accent}66`,borderRadius:8,background:"transparent",color:accent,fontSize:11,fontWeight:900}}>+ NEW</button>}>
        {adding && (
          <div style={{padding:"14px",background:surface.bg0,border:`1px solid ${accent}44`,borderRadius:11,marginBottom:8}}>
            <div style={{display:"grid",gap:8}}>
              {/* Exercise name */}
              <div>
                <Label>Exercise</Label>
                <select value={form.exerciseName} onChange={e=>setForm(f=>({...f,exerciseName:e.target.value}))}
                  style={{width:"100%",background:"#101010",border:"1px solid #292929",borderRadius:8,color:"#f0f0f0",padding:"10px 11px",fontSize:13,outline:"none"}}>
                  <option value="">— pick exercise (or leave blank for sessions) —</option>
                  {EXERCISE_LIBRARY.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                </select>
              </div>
              {/* Type */}
              <div>
                <Label>Goal type</Label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                  {[["weight","Weight (lb)"],["reps","Max reps"],["sessions","Sessions"]].map(([k,l])=>(
                    <button key={k} onClick={()=>setForm(f=>({...f,type:k}))}
                      style={{padding:"9px 6px",borderRadius:8,border:`1px solid ${form.type===k?accent:"#292929"}`,background:form.type===k?`${accent}22`:"#101010",color:form.type===k?accent:"#aaa",fontSize:11,fontWeight:800}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Target value + date */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <Label>Target {form.type === "weight" ? "(lb)" : form.type === "sessions" ? "count" : "reps"}</Label>
                  <input type="number" min="1" value={form.targetValue} onChange={e=>setForm(f=>({...f,targetValue:e.target.value}))}
                    placeholder="e.g. 135" inputMode="numeric"
                    style={{width:"100%",boxSizing:"border-box",background:"#101010",border:"1px solid #292929",borderRadius:8,color:"#f0f0f0",padding:"10px 11px",fontSize:14,fontWeight:700,outline:"none"}} />
                </div>
                <div>
                  <Label>Target date (opt)</Label>
                  <input type="date" value={form.targetDate} onChange={e=>setForm(f=>({...f,targetDate:e.target.value}))}
                    style={{width:"100%",boxSizing:"border-box",background:"#101010",border:"1px solid #292929",borderRadius:8,color:"#f0f0f0",padding:"10px 11px",fontSize:13,outline:"none"}} />
                </div>
              </div>
              {/* Note */}
              <div>
                <Label>Note (opt)</Label>
                <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                  placeholder="Why this goal matters"
                  style={{width:"100%",boxSizing:"border-box",background:"#101010",border:"1px solid #292929",borderRadius:8,color:"#f0f0f0",padding:"10px 11px",fontSize:13,outline:"none"}} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>setAdding(false)} style={{padding:"12px",border:"1px solid #333",borderRadius:9,background:"transparent",color:text.tertiary,fontWeight:800}}>CANCEL</button>
                <button onClick={saveGoal} disabled={!form.targetValue}
                  style={{padding:"12px",border:"none",borderRadius:9,background:form.targetValue?accent:"#242424",color:form.targetValue?"#050505":"#777",fontWeight:900,letterSpacing:".06em"}}>
                  SAVE GOAL
                </button>
              </div>
            </div>
          </div>
        )}

        {activeGoals.length === 0 && !adding && (
          <div style={{padding:"20px",textAlign:"center",color:text.faint,fontSize:13}}>No active goals. Tap + NEW to set your first target.</div>
        )}

        <div style={{display:"grid",gap:8}}>
          {activeGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} history={history} exConfig={exConfig} totalSessions={totalSessions} accent={accent}
              onAchieve={()=>markAchieved(goal.id)} onDelete={()=>deleteGoal(goal.id)} />
          ))}
        </div>
      </Section>

      {/* Done goals */}
      {doneGoals.length > 0 && (
        <Section title={`Achieved (${doneGoals.length})`}>
          <div style={{display:"grid",gap:6}}>
            {doneGoals.map(goal => (
              <div key={goal.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 13px",background:"#4ade8011",border:"1px solid #4ade8044",borderRadius:9}}>
                <div>
                  <span style={{fontSize:13,color:status.good,fontWeight:800}}>✓ {goal.exerciseName || "Sessions"}</span>
                  <span style={{fontSize:12,color:text.tertiary,marginLeft:8}}>{goal.targetValue}{goal.type==="weight"?"lb":goal.type==="reps"?" reps":" sessions"}</span>
                  {goal.note && <div style={{fontSize:11,color:text.muted,marginTop:2}}>{goal.note}</div>}
                </div>
                <button onClick={()=>deleteGoal(goal.id)} style={{background:"transparent",border:"none",color:text.faint,fontSize:14,padding:"4px 8px"}}>✕</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div style={{height:32}}/>
    </div>
  );
}

function GoalCard({ goal, history, exConfig, totalSessions, accent, onAchieve, onDelete }) {
  const prog = goalProgress(goal, history, exConfig, totalSessions);
  const barColor = prog.achieved ? status.good : prog.onTrack ? accent : status.warn;
  const typeLabel = goal.type === "weight" ? "lb" : goal.type === "sessions" ? " sessions" : " reps";
  return (
    <div style={{padding:"13px 14px",background:surface.bg0,border:`1px solid ${prog.achieved?"#4ade8066":prog.onTrack?"#1f1f1f":"#fbbf2455"}`,borderRadius:11}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#f0f0f0"}}>{goal.exerciseName || "Total Sessions"}</div>
          {goal.note && <div style={{fontSize:11,color:text.muted,marginTop:2}}>{goal.note}</div>}
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:barColor,letterSpacing:".04em"}}>
            {prog.current}<span style={{fontSize:13,color:text.tertiary}}>/{goal.targetValue}{typeLabel}</span>
          </div>
          {prog.daysLeft != null && <div style={{fontSize:10,color:text.muted}}>{prog.daysLeft}d left</div>}
        </div>
      </div>
      {/* Progress bar */}
      <div style={{height:6,background:surface.bg4,borderRadius:3,overflow:"hidden",margin:"10px 0 6px"}}>
        <div style={{height:"100%",width:`${Math.round(prog.pct*100)}%`,background:barColor,borderRadius:3,transition:"width .4s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,color:text.tertiary}}>
          {prog.pct >= 1 ? "🎯 Target reached!" : `${Math.round(prog.pct*100)}% · ${prog.weeklyRate > 0 ? `+${prog.weeklyRate.toFixed(1)}/wk pace` : "no pace yet"}`}
          {prog.weeklyNeeded && prog.weeklyRate > 0 && (
            <span style={{color:prog.onTrack?status.good:status.warn,marginLeft:6}}>
              ({prog.onTrack?"on track":"need +"+prog.weeklyNeeded.toFixed(1)+"/wk"})
            </span>
          )}
        </div>
        <div style={{display:"flex",gap:6}}>
          {!goal.achieved && prog.pct >= 1 && (
            <button onClick={onAchieve} style={{padding:"5px 9px",border:"1px solid #4ade8066",borderRadius:7,background:"#4ade8022",color:status.good,fontSize:10,fontWeight:900}}>MARK ✓</button>
          )}
          <button onClick={onDelete} style={{padding:"5px 8px",border:"none",borderRadius:7,background:"transparent",color:text.faint,fontSize:12}}>✕</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <div style={{padding:"20px 16px 6px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
        <div style={{fontSize:13,color:"#ddd",fontWeight:700}}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{fontSize:10,color:text.tertiary,fontWeight:800,marginBottom:5}}>{children}</div>;
}

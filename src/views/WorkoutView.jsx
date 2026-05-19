import { useState, useEffect, useMemo, useRef } from "react";
import {
  WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, DEFAULT_WEIGHTS,
  EXERCISE_GUIDES, todayName, dateStr, calcDynamicTarget, assessmentTargetForProfile,
  getExerciseHistory, XP_VALUES, getLevel, customRoutineWorkout,
  ageTier, ageAdjustedRestSeconds, EXERCISE_LIBRARY, exerciseFolder,
} from "../data.js";
import { useSessionTimer, fmtDuration } from "../hooks.js";
import { ExerciseAnimation, RestTimer, Toast, MiniGraph } from "../components/shared.jsx";
import MuscleDiagram from "../components/MuscleDiagram.jsx";
import { completionKey, defaultWorkoutDay, scheduledDate, logKey as makeLogKey } from "../session.js";
import { bestEstimated1RM, buildCoachMemory, buildCoachPlan, buildSessionIntent, coachSetCount, coachTargetReps, DEFAULT_READINESS, evaluateProgression, explainExerciseDecision, plateauFixes, readinessLabel, sciencePrescription, summarizeWorkout, weeklyMuscleCoverage, SUBSTITUTIONS } from "../coach.js";
import { Confetti, XpFloat } from "./workout/Effects.jsx";
import { FirstRunSetup, AssessmentFlow, ASSESSMENT_EXERCISES } from "./workout/Assessment.jsx";
import PostWorkoutFeedback from "./workout/PostWorkoutFeedback.jsx";
import { buildSuggestions, CoachDrawer, CoachFab, CoachCard } from "./workout/Coach.jsx";
import { surface, text, status } from "../theme.js";

const SET_FEELINGS = [
  { key:"easy", label:"EASY" },
  { key:"good", label:"GOOD" },
  { key:"hard", label:"HARD" },
  { key:"pain", label:"PAIN" },
];

function ReadinessCheckIn({ value, onSave, accent }) {
  const [draft, setDraft] = useState(value || DEFAULT_READINESS);
  const [open, setOpen] = useState(false);
  const groups = [
    { key:"energy", label:"Energy", options:[["low","Low"],["okay","Okay"],["high","High"]] },
    { key:"soreness", label:"Body", options:[["none","Fresh"],["mild","Mild"],["sore","Sore"]] },
    { key:"time", label:"Time", options:[["short","Short"],["normal","Normal"],["full","Full"]] },
  ];
  const ENERGY_ICON = { low:"🔋", okay:"⚡", high:"🚀" };
  const BODY_ICON   = { none:"✅", mild:"🟡", sore:"🔴" };
  const TIME_ICON   = { short:"⏱", normal:"🕐", full:"🏁" };
  const summary = `${ENERGY_ICON[draft.energy]||""} ${draft.energy} · ${BODY_ICON[draft.soreness]||""} ${draft.soreness} · ${TIME_ICON[draft.time]||""} ${draft.time}`;

  return (
    <div style={{margin:"0 16px 14px",background:surface.bg0,border:`1px solid ${accent}33`,borderRadius:12}}>
      {/* Compact row */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px"}}>
        <button onClick={()=>setOpen(v=>!v)}
          style={{flex:1,background:"transparent",border:"none",padding:0,textAlign:"left",cursor:"pointer"}}>
          <div style={{fontSize:11,color:accent,fontWeight:700,marginBottom:3}}>Check-In</div>
          <div style={{fontSize:12,color:"#aaa"}}>{summary} <span style={{fontSize:14,display:"inline-block",transform:open?"rotate(180deg)":"none",transition:"transform .2s",verticalAlign:"middle"}}>⌄</span></div>
        </button>
        <button onClick={()=>onSave(draft)}
          style={{flexShrink:0,background:accent,border:"none",borderRadius:8,color:"#050505",padding:"9px 16px",fontSize:12,fontWeight:700,letterSpacing:".08em"}}>
          START
        </button>
      </div>
      {/* Expanded picker */}
      {open && (
        <div style={{padding:"0 14px 14px",display:"grid",gap:10,borderTop:"1px solid #1a1a1a",paddingTop:12}}>
          {groups.map(group=>(
            <div key={group.key}>
              <div style={{fontSize:10,color:"#777",fontWeight:600,marginBottom:6}}>{group.label}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                {group.options.map(([key,label])=>{
                  const active = draft[group.key] === key;
                  return (
                    <button key={key} onClick={()=>setDraft(p=>({...p,[group.key]:key}))}
                      style={{padding:"9px 6px",borderRadius:8,border:`1px solid ${active?accent:"#2a2a2a"}`,background:active?`${accent}22`:"#101010",color:active?accent:"#aaa",fontSize:12,fontWeight:active?700:400}}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteField({ value, onChange }) {
  const [open, setOpen] = useState(!!value);
  return (
    <div style={{marginTop:10}}>
      {!open ? (
        <button onClick={()=>setOpen(true)}
          style={{background:"transparent",border:"none",padding:0,color:text.faint,fontSize:12,letterSpacing:".06em",cursor:"pointer"}}>
          + add session note
        </button>
      ) : (
        <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder="Sleep, joints, mood, anything worth remembering..." autoFocus
          style={{width:"100%",minHeight:54,resize:"vertical",boxSizing:"border-box",padding:"11px 12px",background:surface.bg0,border:"1px solid #242424",borderRadius:10,color:"#ddd",fontSize:13,lineHeight:1.45,outline:"none"}}/>
      )}
    </div>
  );
}

function TodayPlan({ plan, readiness, accent, substitutions, onApplySubstitution, onRemoveSubstitution }) {
  const [open, setOpen] = useState(false);
  if (!plan) return null;
  return (
    <div style={{margin:"0 16px 12px",padding:"14px 15px",background:`linear-gradient(180deg,${accent}13,#0d0d0d)`,border:`1.5px solid ${accent}44`,borderRadius:14,boxShadow:`0 0 24px ${accent}12`}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"transparent",border:"none",padding:0,textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:5}}>Today's Coach</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:27,color:"#f5f5f5",letterSpacing:".06em",lineHeight:1}}>{plan.headline}</div>
          <div style={{fontSize:12,color:text.tertiary,marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{plan.focus}</div>
        </div>
        <div style={{fontSize:20,color:text.secondary,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}>⌄</div>
      </button>
      {open&&(
        <div style={{animation:"slideDown .2s ease-out"}}>
      <div style={{fontSize:13,color:text.tertiary,marginTop:12}}>{readiness ? readinessLabel(readiness) : "Default readiness"}</div>
      <div style={{fontSize:14,color:"#ddd",lineHeight:1.55,marginTop:8}}>{plan.focus}</div>
      {plan.science&&(
        <div style={{marginTop:12,padding:"10px 11px",background:"#101010",borderRadius:8,border:`1px solid ${accent}33`}}>
          <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:5}}>Science Coach</div>
          <div style={{fontSize:12,color:"#ddd",lineHeight:1.5}}>
            {plan.science.label}: {plan.science.note}
            {plan.science.est1RM&&<span style={{color:text.tertiary}}> Est. 1RM {plan.science.est1RM}lbs.</span>}
          </div>
        </div>
      )}
      {plan.substitutions?.length>0&&(
        <div style={{display:"grid",gap:7,marginTop:12}}>
          {plan.substitutions.map((sub,i)=>{
            const active = substitutions?.[sub.exercise]?.name === sub.substitute;
            return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#ddd",padding:"10px 11px",background:"#101010",borderRadius:8,border:`1px solid ${active ? accent : `${accent}33`}`}}>
              <div style={{flex:1,lineHeight:1.45}}>
                Swap {sub.exercise} to <span style={{color:accent}}>{sub.substitute}</span>
                <div style={{fontSize:11,color:"#777",marginTop:2}}>{sub.reason}</div>
              </div>
              <button onClick={() => active ? onRemoveSubstitution(sub.exercise) : onApplySubstitution(sub)}
                style={{background:active?accent:"transparent",border:`1px solid ${accent}77`,borderRadius:8,color:active?"#050505":accent,padding:"8px 10px",fontSize:11,letterSpacing:".08em",flexShrink:0}}>
                {active ? "ACTIVE" : "USE"}
              </button>
              {sub.alternatives?.length>1&&(
                <div style={{display:"flex",gap:6,flexWrap:"wrap",gridColumn:"1 / -1",marginTop:2}}>
                  {sub.alternatives.slice(1).map(alt=>(
                    <button key={alt.name} onClick={()=>onApplySubstitution(sub, alt)}
                      style={{background:"transparent",border:"1px solid #2a2a2a",borderRadius:7,color:"#aaa",padding:"6px 8px",fontSize:10,letterSpacing:".06em"}}>
                      {alt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )})}
        </div>
      )}
      {plan.adjustments?.length>0&&(
        <div style={{display:"grid",gap:7,marginTop:12}}>
          {plan.adjustments.slice(0,2).map((item,i)=>(
            <div key={i} style={{fontSize:12,color:text.secondary,padding:"9px 11px",background:"#080808",borderRadius:8,border:"1px solid #202020"}}>{item}</div>
          ))}
        </div>
      )}
        </div>
      )}
    </div>
  );
}

function FocusWorkoutMode({
  workout, accent, activeTab, doneSets, totalSets, setDone, sessionLogs, logKey,
  getTargetReps, getSetCount, getWeight, getScience, toggleSet, onExit, onFinish, allDone, isCompleted,
  substitutions = [], onApplySubstitution, onRemoveSubstitution,
  getPreviousPerformance, beginnerFormMode=false, estimatedRemaining=0,
  playSound,
}) {
  const [tempoOn, setTempoOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const next = (() => {
    for (let i=0;i<workout.exercises.length;i++) {
      const ex = workout.exercises[i];
      for (let j=0;j<getSetCount(ex);j++) {
        if (!setDone(i,j)) return { ex, exIdx:i, setIdx:j };
      }
    }
    return { ex:workout.exercises[workout.exercises.length-1], exIdx:workout.exercises.length-1, setIdx:workout.exercises[workout.exercises.length-1].sets-1 };
  })();
  const target = getTargetReps(next.ex);
  const science = getScience(next.ex);
  const repText = `x${target}`;
  const weight = getWeight(next.ex);
  const weightText = weight > 0 ? `${weight}lbs` : "bodyweight";
  const plannedSets = getSetCount(next.ex);
  const currentDone = Array.from({length:plannedSets},(_,j)=>setDone(next.exIdx,j)).filter(Boolean).length;
  const originalName = next.ex.configName || next.ex.originalName || next.ex.name;
  const focusSwap = substitutions.find(sub => sub.exercise === originalName);
  const guide = EXERCISE_GUIDES[originalName] || EXERCISE_GUIDES[next.ex.name];
  const previous = getPreviousPerformance?.(next.ex);
  const tempoParts = parseTempoCode(science.tempo?.code);
  const tempoPattern = tempoParts ? [
    { label:"Lower", seconds:tempoParts[0] },
    { label:"Hold", seconds:tempoParts[1] },
    { label:"Lift", seconds:tempoParts[2] },
  ].filter(part => part.seconds > 0) : [];
  const tempoCycle = tempoPattern.reduce((sum, part) => sum + part.seconds, 0);
  const tempoPosition = tempoCycle ? beat % tempoCycle : 0;
  let elapsed = 0;
  const tempoPhase = tempoPattern.find(part => {
    const active = tempoPosition >= elapsed && tempoPosition < elapsed + part.seconds;
    elapsed += part.seconds;
    return active;
  }) || tempoPattern[0];

  useEffect(() => {
    setTempoOn(false);
    setBeat(0);
  }, [next.ex.name, science.tempo?.code]);

  useEffect(() => {
    if (!tempoOn || !tempoCycle) return undefined;
    playSound?.("tempoAccent");
    const id = setInterval(() => {
      setBeat(current => {
        const nextBeat = (current + 1) % tempoCycle;
        playSound?.(nextBeat === 0 ? "tempoAccent" : "tempoBeat");
        return nextBeat;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [tempoOn, tempoCycle, playSound]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:"#050505",overflowY:"auto",padding:"calc(10px + env(safe-area-inset-top)) 16px 18px"}}>
      <div className="mobile-shell">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
          <button onClick={onExit} style={{background:"transparent",border:"none",color:text.faint,padding:"8px 12px",fontSize:12}}>Pause</button>
          {tempoPattern.length > 0&&(
            <button
              aria-label={tempoOn ? "Stop tempo metronome" : "Start tempo metronome"}
              title={tempoOn ? "Stop tempo metronome" : "Start tempo metronome"}
              onClick={()=>setTempoOn(on=>!on)}
              style={{width:42,height:42,borderRadius:12,border:`1px solid ${tempoOn?accent:"#2c2c2c"}`,background:tempoOn?`${accent}22`:"#0d0d0d",color:tempoOn?accent:"#aaa",fontSize:18,fontWeight:900,boxShadow:tempoOn?`0 0 18px ${accent}33`:"none",flexShrink:0}}
            >
              {tempoOn ? "●" : "♪"}
            </button>
          )}
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"#777",fontWeight:600}}>{activeTab}</div>
            <div style={{fontSize:13,color:accent}}>{doneSets}/{totalSets} sets</div>
            <div style={{fontSize:11,color:"#777",marginTop:2}}>{fmtDuration(estimatedRemaining)} left</div>
          </div>
        </div>

        <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:6}}>Focus Mode</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:beginnerFormMode?46:38,color:"#f5f5f5",letterSpacing:".06em",lineHeight:.92,marginBottom:5}}>{next.ex.name}</div>
        <div style={{fontSize:beginnerFormMode?15:13,color:"#aaa",lineHeight:1.35,marginBottom:science.enabled&&science.targetRepReason?4:8}}>
          Set {Math.min(currentDone+1,plannedSets)} of {plannedSets} · {weightText} · target {repText}{next.ex.repSuffix||""}
        </div>
        {science.enabled&&science.targetRepReason&&(
          <div style={{fontSize:11,color:status.science,lineHeight:1.35,marginBottom:8,opacity:.9}}>{science.targetRepReason}</div>
        )}

        {previous&&(
          <div style={{marginBottom:8,padding:"9px 11px",background:surface.bg0,border:`1px solid ${accent}33`,borderRadius:10}}>
            <div style={{fontSize:10,color:accent,fontWeight:600,marginBottom:3}}>Last Time</div>
            <div style={{fontSize:13,color:"#ddd",lineHeight:1.4}}>{previous.sets} sets · {previous.totalReps} reps · best {previous.bestReps} reps{previous.bestWeight > 0 ? ` @ ${previous.bestWeight}lbs` : " bodyweight"}</div>
          </div>
        )}

        <ExerciseAnimation folder={exerciseFolder(next.ex)} video={next.ex.video} accent={accent} compact bare/>

        <div style={{marginTop:10,display:"grid",gridTemplateColumns:`repeat(${plannedSets},1fr)`,gap:8}}>
          {Array.from({length:plannedSets},(_,j)=>{
            const isDone=setDone(next.exIdx,j);
            const logged=sessionLogs[logKey(next.exIdx,j)];
            return (
              <button key={j} onClick={()=>toggleSet(next.exIdx,j)}
                style={{height:48,borderRadius:11,border:`1.5px solid ${isDone?accent:"#333"}`,background:isDone?`${accent}25`:"#0d0d0d",color:isDone?accent:"#aaa",fontSize:13,fontWeight:700,boxShadow:isDone?`0 0 14px ${accent}55`:"none"}}>
                {isDone ? (logged ? `${logged.reps}r` : "DONE") : `SET ${j+1}`}
              </button>
            );
          })}
        </div>

        <div style={{marginTop:10,padding:"10px 12px",background:surface.bg0,border:"1px solid #202020",borderRadius:11}}>
          <div style={{fontSize:10,color:"#777",fontWeight:600,marginBottom:4}}>Cue</div>
          <div style={{fontSize:beginnerFormMode?17:13,color:"#ddd",lineHeight:1.38}}>{beginnerFormMode && guide ? guide.movement[0] : next.ex.tip}</div>
          {science.enabled&&science.tempo&&(
            <div style={{fontSize:12,color:accent,lineHeight:1.4,marginTop:7}}>
              Tempo {science.tempo.code}: {science.tempo.label}
            </div>
          )}
        </div>

        {tempoPattern.length > 0&&tempoOn&&(
          <div style={{marginTop:10,padding:"10px 12px",background:surface.bg0,border:`1px solid ${accent}`,borderRadius:11,boxShadow:`0 0 22px ${accent}22`}}>
            <div style={{fontSize:10,color:accent,fontWeight:600,marginBottom:7}}>Tempo Beat · {tempoPhase?.label || "Beat"} {tempoPosition + 1}/{tempoCycle}</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${tempoPattern.length},1fr)`,gap:7}}>
              {tempoPattern.map((part, idx)=>(
                <div key={part.label} style={{padding:"8px 6px",borderRadius:8,border:`1px solid ${tempoPhase?.label===part.label?accent:"#242424"}`,background:tempoPhase?.label===part.label?`${accent}24`:"#090909",textAlign:"center"}}>
                  <div style={{fontSize:10,color:tempoPhase?.label===part.label?accent:"#777",fontWeight:600}}>{part.label}</div>
                  <div style={{fontSize:15,color:"#eee",fontFamily:"DM Mono,monospace",marginTop:2}}>{part.seconds}s</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {focusSwap&&(
          <div style={{marginTop:10,padding:"10px 12px",background:surface.bg0,border:`1px solid ${accent}44`,borderRadius:11}}>
            <div style={{fontSize:10,color:accent,fontWeight:600,marginBottom:4}}>Safer Option</div>
            <div style={{fontSize:13,color:"#ddd",lineHeight:1.4}}>If this feels rough today, swap to {focusSwap.substitute}. {focusSwap.reason}</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:8}}>
              <button onClick={()=>onApplySubstitution?.(focusSwap)}
                style={{background:accent,border:"none",borderRadius:8,color:"#050505",padding:"8px 10px",fontSize:11,letterSpacing:".08em",fontWeight:700}}>USE SWAP</button>
              {next.ex.substitutedFor&&<button onClick={()=>onRemoveSubstitution?.(next.ex.substitutedFor)}
                style={{background:"transparent",border:"none",color:text.muted,padding:"8px 10px",fontSize:12}}>Original</button>}
            </div>
          </div>
        )}

        {guide&&!beginnerFormMode&&(
          <div style={{marginTop:10,padding:"10px 12px",background:surface.bg0,border:"1px solid #202020",borderRadius:11}}>
            <div style={{fontSize:10,color:"#777",fontWeight:600,marginBottom:5}}>Quick Form</div>
            <div style={{fontSize:13,color:"#ddd",lineHeight:1.45}}>{guide.movement[0]}</div>
            <div style={{fontSize:12,color:text.tertiary,lineHeight:1.45,marginTop:4}}>Avoid: {guide.mistakes.slice(0,2).join(", ")}.</div>
          </div>
        )}

        <div style={{height:6,background:"#181818",borderRadius:5,overflow:"hidden",marginTop:12}}>
          <div style={{height:"100%",width:`${(doneSets/totalSets)*100}%`,background:accent,boxShadow:`0 0 12px ${accent}`,transition:"width .25s"}}/>
        </div>

        {allDone&&!isCompleted&&(
          <button onClick={onFinish}
            style={{width:"100%",marginTop:12,padding:16,borderRadius:14,border:"none",background:accent,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:".12em",boxShadow:`0 0 48px ${accent}77`}}>
            FINISH WORKOUT
          </button>
        )}
      </div>
    </div>
  );
}

function RestReady({ label, accent, onNext }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:185,background:"#050505",display:"flex",alignItems:"center",justifyContent:"center",padding:"28px 22px"}}>
      <div className="mobile-shell" style={{textAlign:"center"}}>
        <div style={{fontSize:12,color:accent,fontWeight:600,marginBottom:14}}>Rest Complete</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:54,color:"#f5f5f5",letterSpacing:".06em",lineHeight:.92,marginBottom:14}}>READY</div>
        <div style={{fontSize:15,color:"#aaa",lineHeight:1.5,marginBottom:30}}>{label}</div>
        <button onClick={onNext}
          style={{width:"100%",padding:"20px",background:accent,border:"none",borderRadius:14,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".12em",boxShadow:`0 0 42px ${accent}66`}}>
          NEXT SET
        </button>
      </div>
    </div>
  );
}

function WorkoutSummary({ summary, accent, onClose }) {
  if (!summary) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:230,background:"#050505",overflowY:"auto",padding:"calc(28px + env(safe-area-inset-top)) 20px 30px"}}>
      <div className="mobile-shell">
        <div style={{fontSize:12,color:accent,fontWeight:600,marginBottom:10}}>Workout Complete</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#f5f5f5",letterSpacing:".06em",lineHeight:.92,marginBottom:18}}>SESSION<br/>SUMMARY</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <SummaryStat label="Sets" value={summary.sets} accent={accent}/>
          <SummaryStat label="Reps" value={summary.reps} accent={accent}/>
          <SummaryStat label="Volume" value={`${Math.round(summary.volume).toLocaleString()}`} sub="lbs" accent={accent}/>
          <SummaryStat label="Time" value={fmtDuration(summary.duration || 0)} accent={accent}/>
        </div>
        {summary.prs?.length>0&&(
          <div style={{padding:16,background:"#101008",border:"1px solid #fbbf2455",borderRadius:12,marginBottom:12}}>
            <div style={{fontSize:11,color:status.warn,fontWeight:600,marginBottom:8}}>PRs</div>
            <div style={{fontSize:14,color:"#eee",lineHeight:1.5}}>{summary.prs.map(p=>`${p.name}: ${p.val}lbs`).join(" · ")}</div>
          </div>
        )}
        <div style={{display:"grid",gap:10,marginBottom:14}}>
          {summary.bestSet&&(
            <div style={{padding:14,background:surface.bg0,border:"1px solid #202020",borderRadius:12}}>
              <div style={{fontSize:11,color:text.tertiary,fontWeight:600,marginBottom:6}}>Best Set</div>
              <div style={{fontSize:15,color:"#eee",lineHeight:1.45}}>{summary.bestSet.name}: {summary.bestSet.weight > 0 ? `${summary.bestSet.weight}lbs` : "bodyweight"} x {summary.bestSet.reps}</div>
            </div>
          )}
          {summary.hardest&&(
            <div style={{padding:14,background:surface.bg0,border:"1px solid #202020",borderRadius:12}}>
              <div style={{fontSize:11,color:text.tertiary,fontWeight:600,marginBottom:6}}>Limiter</div>
              <div style={{fontSize:15,color:"#eee",lineHeight:1.45}}>{summary.hardest.name} was the main limiter today.</div>
            </div>
          )}
        </div>
        <div style={{padding:16,background:surface.bg0,border:"1px solid #202020",borderRadius:12,marginBottom:14}}>
          <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:8}}>Coach Note</div>
          <div style={{fontSize:15,color:"#ddd",lineHeight:1.55}}>{summary.coachNote}</div>
          {summary.nextChange&&<div style={{fontSize:13,color:accent,marginTop:10,lineHeight:1.45}}>{summary.nextChange}</div>}
          {summary.reasoning?.length>0&&(
            <div style={{display:"grid",gap:7,marginTop:12}}>
              {summary.reasoning.map((reason,i)=>(
                <div key={i} style={{fontSize:12,color:"#aaa",lineHeight:1.45,padding:"8px 9px",background:"#080808",border:"1px solid #1d1d1d",borderRadius:8}}>{reason}</div>
              ))}
            </div>
          )}
          {summary.nextWorkout&&<div style={{fontSize:13,color:text.tertiary,marginTop:10}}>Next up: Workout {summary.nextWorkout}</div>}
        </div>
        <button onClick={onClose}
          style={{width:"100%",padding:19,background:accent,border:"none",borderRadius:14,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:".12em",boxShadow:`0 0 42px ${accent}66`}}>
          DONE
        </button>
      </div>
    </div>
  );
}

function ExerciseGuide({ guide, accent }) {
  if (!guide) return null;
  return (
    <div style={{marginTop:20}}>
      <SLabel small>How to do it</SLabel>
      <GuideLine title="Setup" items={guide.setup} color={accent}/>
      <GuideLine title="Move" items={guide.movement} color={accent}/>
      <GuideLine title="Avoid" items={guide.mistakes} color="#fb923c"/>
      {guide.pain&&<div style={{fontSize:12,color:status.caution,lineHeight:1.45,marginTop:12}}>{guide.pain}</div>}
    </div>
  );
}

function GuideLine({ title, items, color }) {
  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:11,color,fontWeight:600,marginBottom:5}}>{title}</div>
      <div style={{display:"grid",gap:4}}>
        {items.map(item=><div key={item} style={{fontSize:13,color:"#aaa",lineHeight:1.45}}>• {item}</div>)}
      </div>
    </div>
  );
}

function SetFeelingButtons({ onPick }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}>
      {SET_FEELINGS.map(({ key, label })=>(
        <button key={key} onClick={()=>onPick(key)}
          style={{padding:"8px 4px",background:key==="pain"?"#2a1014":"#0c0c0c",border:`1px solid ${key==="pain"?"#fb718555":"#2a2a2a"}`,borderRadius:8,color:key==="pain"?status.caution:"#bbb",fontSize:10,letterSpacing:".08em"}}>
          {label}
        </button>
      ))}
    </div>
  );
}

function SummaryStat({ label, value, sub, accent }) {
  return (
    <div style={{padding:"15px 14px",background:surface.bg0,border:"1px solid #202020",borderRadius:12}}>
      <div style={{fontSize:10,color:text.tertiary,fontWeight:600,marginBottom:4}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:accent,letterSpacing:".04em",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#777",marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ── SET LOGGER ────────────────────────────────────────────────────────────────
function SetLogger({ exerciseName, setNum, defaultWeight, defaultReps, accent, onSave, onSkip, editing, increment = 1 }) {
  const [weight, setWeight] = useState(defaultWeight);
  const [reps,   setReps]   = useState(defaultReps);
  useEffect(() => {
    setWeight(defaultWeight);
    setReps(defaultReps);
  }, [defaultWeight, defaultReps, exerciseName, setNum]);
  const cleanWeight = Number.isFinite(Number(weight)) ? Math.max(Number(weight), 0) : 0;
  const cleanReps = Number.isFinite(Number(reps)) ? Math.max(Math.round(Number(reps)), 0) : 0;
  const step = Number.isFinite(Number(increment)) && Number(increment) > 0 ? Number(increment) : 1;
  return (
    <div style={{position:"fixed",bottom:82,left:0,right:0,zIndex:220,background:"#0a0a0a",borderTop:`1.5px solid ${accent}99`,padding:"14px 18px 12px",boxShadow:`0 -8px 32px ${accent}44`,animation:"slideUp .22s ease-out"}}>
      <div className="mobile-shell">
        <div style={{fontSize:12,color:accent,fontWeight:600,marginBottom:12}}>Log Set {setNum} · {exerciseName}</div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={{fontSize:11,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>WEIGHT (lbs)</div>
            <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setWeight(w=>Math.max((Number(w)||0)-step,0))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>−</button>
              <input value={weight} onChange={e=>setWeight(e.target.value)} inputMode="decimal" type="number" min="0" step="any" aria-label="Weight used in pounds"
                style={{flex:1,minWidth:0,textAlign:"center",fontSize:18,fontWeight:500,color:"#fff",background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono, monospace"}}/>
              <button onClick={()=>setWeight(w=>(Number(w)||0)+step)} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>+</button>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>REPS DONE</div>
            <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setReps(r=>Math.max((Number(r)||0)-1,0))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>−</button>
              <input value={reps} onChange={e=>setReps(e.target.value)} inputMode="numeric" type="number" min="0" step="1" aria-label="Reps completed"
                style={{flex:1,minWidth:0,textAlign:"center",fontSize:18,fontWeight:500,color:"#fff",background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono, monospace"}}/>
              <button onClick={()=>setReps(r=>(Number(r)||0)+1)} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>+</button>
            </div>
          </div>
          <button onClick={()=>onSave({weight:cleanWeight,reps:cleanReps})}
            style={{width:"100%",height:48,background:accent,border:"none",borderRadius:10,color:"#0a0a0a",fontSize:13,fontWeight:700,boxShadow:`0 0 16px ${accent}66`,letterSpacing:".08em"}}>LOG SET</button>
        </div>
        <button onClick={onSkip} style={{background:"none",border:"none",color:text.faint,fontSize:12,letterSpacing:".08em",marginTop:10,width:"100%",textAlign:"center",padding:4}}>{editing ? "keep current log" : "use planned numbers"}</button>
      </div>
    </div>
  );
}

function CoachWhyPanel({ lines, accent }) {
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

// ── THIS WEEK STRIP ───────────────────────────────────────────────────────────
function ThisWeek({ completed, setActiveTab }) {
  const today = todayName();
  return (
    <div style={{padding:"24px 16px 16px"}}>
      <div style={{fontSize:13,color:text.tertiary,fontWeight:600,marginBottom:14}}>This Week</div>
      <div style={{display:"flex",gap:10}}>
        {DAYS.map(day=>{
          const wk=WORKOUTS[SCHEDULE[day]]; const isDone=!!completed[completionKey(day)],isToday=day===today;
          return(
            <button key={day} onClick={()=>setActiveTab(day)}
              style={{flex:1,padding:"16px 8px",borderRadius:13,border:"none",background:isDone?`${wk.color}25`:isToday?"#161616":"#0d0d0d",outline:isToday?`2px solid ${wk.color}99`:isDone?`1px solid ${wk.color}55`:"1px solid #1e1e1e",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:12,color:isToday?wk.color:isDone?wk.color:text.muted,letterSpacing:".1em",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>{day.slice(0,3)}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:isDone?wk.color:isToday?"#fff":"#777",letterSpacing:".06em"}}>{wk.label.split(" ")[1]}</div>
              <div style={{fontSize:20,marginTop:5}}>{isDone?<span style={{color:wk.color}}>✓</span>:isToday?<span style={{color:wk.color}}>→</span>:<span style={{color:"#333"}}>·</span>}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyMusclePlan({ completed, accent }) {
  const coverage = weeklyMuscleCoverage({ completed, schedule:SCHEDULE, workouts:WORKOUTS, completionKeyFn:completionKey });
  const rows = Object.entries(coverage)
    .map(([muscle, item]) => ({ muscle, label:MUSCLE_LABELS[muscle] || muscle, ...item }))
    .sort((a,b)=>b.planned-a.planned);
  const undertrained = rows.filter(row => row.planned < 1).map(row => row.label);
  return (
    <div style={{padding:"0 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{fontSize:13,color:"#999",fontWeight:600}}>Muscle Coverage</div>
          <div style={{fontSize:12,color:"#777",marginTop:3}}>planned for this week</div>
        </div>
        <div style={{fontSize:12,color:accent}}>{rows.filter(r=>r.done>0).length}/{rows.length} active</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
        {rows.slice(0,12).map(row=>{
          const pct = Math.min(100, Math.round((row.done / Math.max(row.planned, 1)) * 100));
          return (
            <div key={row.muscle} style={{padding:"10px 11px",background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:10}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:7}}>
                <span style={{fontSize:12,color:"#ddd",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.label}</span>
                <span style={{fontSize:11,color:pct>0?accent:"#666"}}>{pct}%</span>
              </div>
              <div style={{height:5,background:surface.bg4,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:accent,boxShadow:pct?`0 0 8px ${accent}88`:"none"}}/>
              </div>
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

function ProgressionPreview({ items, accent }) {
  if (!items.length) return null;
  return (
    <div style={{marginTop:12,padding:"12px 13px",background:surface.bg0,border:`1px solid ${accent}33`,borderRadius:12}}>
      <div style={{fontSize:10,color:accent,fontWeight:700,marginBottom:8}}>Today's Plan</div>
      <div style={{display:"grid",gap:7}}>
        {items.slice(0,4).map((item,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:12,color:"#ddd",lineHeight:1.4}}>
            <span style={{color:accent,flexShrink:0}}>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SwapLibrary({ exerciseName, activeName, accent, onApply, onRemove }) {
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
              style={{padding:"10px 12px",background:active?`${accent}18`:"#161616",border:"none",borderRadius:10,textAlign:"left",color:active?accent:"#ccc"}}>
              <div style={{fontSize:13,fontWeight:600}}>{option.name}{active ? " · active" : ""}</div>
              <div style={{fontSize:12,color:active?accent:"#666",lineHeight:1.4,marginTop:2}}>{option.reason}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlateauFixPanel({ fixes, accent }) {
  if (!fixes?.length) return null;
  return (
    <div style={{marginTop:20}}>
      <SLabel small>Plateau fix</SLabel>
      <div style={{display:"grid",gap:6}}>
        {fixes.map((fix,i)=>(
          <div key={fix} style={{fontSize:13,color:"#c9a84c",lineHeight:1.5}}>{i+1}. {fix}</div>
        ))}
      </div>
      <div style={{fontSize:12,color:text.faint,lineHeight:1.45,marginTop:8}}>Shown when recent reps are fading or targets are being missed.</div>
    </div>
  );
}

function parseTempoCode(code) {
  if (!code || typeof code !== "string") return null;
  const parts = code.split("-").map(part => Number(part.trim()));
  if (parts.length < 3 || parts.some(part => !Number.isFinite(part) || part < 0)) return null;
  return parts.slice(0, 3);
}

// ── LOGBOOK MODE ──────────────────────────────────────────────────────────────
function LogbookPanel({ accent, onClose, onSave }) {
  const [entries, setEntries] = useState([]); // [{name, sets:[{weight,reps}]}]
  const [query, setQuery]     = useState("");
  const [addingSet, setAddingSet] = useState(null); // exercise name currently open
  const [setDraft, setSetDraft]   = useState({ weight: 0, reps: 10 });
  const timer = useSessionTimer(true);
  const totalSets = entries.reduce((s, e) => s + e.sets.length, 0);
  const hasEntries = entries.length > 0;

  const libMatches = query.trim().length > 0
    ? EXERCISE_LIBRARY.filter(ex => ex.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const addExercise = (name) => {
    if (!entries.find(e => e.name === name)) setEntries(p => [...p, { name, sets: [] }]);
    setQuery("");
    setAddingSet(name);
    setSetDraft({ weight: 0, reps: 10 });
  };

  const logSet = (name) => {
    setEntries(p => p.map(e => e.name === name ? { ...e, sets: [...e.sets, { weight: setDraft.weight, reps: setDraft.reps }] } : e));
    setAddingSet(null);
  };

  const removeSet = (name, idx) => setEntries(p => p.map(e => e.name === name ? { ...e, sets: e.sets.filter((_, i) => i !== idx) } : e));
  const removeExercise = (name) => { setEntries(p => p.filter(e => e.name !== name)); if (addingSet === name) setAddingSet(null); };

  const finish = () => {
    if (!hasEntries) { onClose(); return; }
    const exSnap = entries.map(e => ({
      id: e.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      name: e.name,
      sets: e.sets.length,
      reps: e.sets[0]?.reps || 0,
      setLog: e.sets,
    }));
    onSave({ exercises: exSnap, duration: timer });
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:"#050505",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:`calc(16px + env(safe-area-inset-top)) 16px calc(80px + env(safe-area-inset-bottom))`}}>
      <div className="mobile-shell">
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,color:accent,fontWeight:700,marginBottom:2}}>Free Log</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:"#fafafa",letterSpacing:".06em",lineHeight:.9}}>LOGBOOK</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:accent}}>{fmtDuration(timer)}</div>
            <div style={{fontSize:11,color:"#777",marginTop:2}}>{totalSets} set{totalSets!==1?"s":""} logged</div>
            <button onClick={onClose} style={{marginTop:6,background:"transparent",border:"1px solid #2c2c2c",borderRadius:8,color:text.tertiary,padding:"6px 12px",fontSize:11,letterSpacing:".08em",cursor:"pointer"}}>EXIT</button>
          </div>
        </div>

        {/* Exercise entries */}
        {entries.map(entry => (
          <div key={entry.name} style={{marginBottom:12,background:surface.bg0,border:`1.5px solid ${addingSet===entry.name?accent:"#1f1f1f"}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 13px"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:"#f0f0f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.name}</div>
                <div style={{fontSize:12,color:text.muted,marginTop:2}}>{entry.sets.length} set{entry.sets.length!==1?"s":""}</div>
              </div>
              <button onClick={() => { setAddingSet(addingSet===entry.name?null:entry.name); setSetDraft({ weight:0, reps:10 }); }}
                style={{padding:"8px 12px",background:addingSet===entry.name?`${accent}22`:"#161616",border:`1px solid ${addingSet===entry.name?accent:"#2a2a2a"}`,borderRadius:8,color:addingSet===entry.name?accent:"#aaa",fontSize:12,fontWeight:800,letterSpacing:".06em",cursor:"pointer"}}>
                + SET
              </button>
              <button onClick={() => removeExercise(entry.name)}
                style={{padding:"6px 10px",background:"transparent",border:"none",color:text.faint,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
            </div>
            {/* Logged sets */}
            {entry.sets.length > 0 && (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"0 13px 12px"}}>
                {entry.sets.map((s, idx) => (
                  <div key={idx} onClick={() => removeSet(entry.name, idx)} title="Tap to remove"
                    style={{padding:"7px 10px",background:`${accent}18`,border:`1px solid ${accent}44`,borderRadius:8,fontSize:12,color:accent,fontWeight:700,cursor:"pointer"}}>
                    {s.weight > 0 ? `${s.weight}lb` : "BW"} × {s.reps}
                  </div>
                ))}
              </div>
            )}
            {/* Inline set logger */}
            {addingSet === entry.name && (
              <div style={{borderTop:"1px solid #1a1a1a",padding:"13px"}}>
                <div style={{display:"grid",gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:10,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>WEIGHT (lbs)</div>
                    <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:9,border:`1px solid ${accent}33`,overflow:"hidden"}}>
                      <button onClick={() => setSetDraft(p => ({...p,weight:Math.max(p.weight-5,0)}))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,cursor:"pointer",flexShrink:0}}>−</button>
                      <input value={setDraft.weight} onChange={e=>setSetDraft(p=>({...p,weight:Math.max(Number(e.target.value)||0,0)}))} onFocus={e=>e.target.select()} inputMode="decimal" type="number" min="0"
                        style={{flex:1,minWidth:0,width:"100%",textAlign:"center",fontSize:18,fontWeight:700,color:"#fff",background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono,monospace",padding:"0 4px"}}/>
                      <button onClick={() => setSetDraft(p => ({...p,weight:p.weight+5}))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,cursor:"pointer",flexShrink:0}}>+</button>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>REPS</div>
                    <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:9,border:`1px solid ${accent}33`,overflow:"hidden"}}>
                      <button onClick={() => setSetDraft(p => ({...p,reps:Math.max(p.reps-1,0)}))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,cursor:"pointer",flexShrink:0}}>−</button>
                      <input value={setDraft.reps} onChange={e=>setSetDraft(p=>({...p,reps:Math.max(Math.round(Number(e.target.value)||0),0)}))} onFocus={e=>e.target.select()} inputMode="numeric" type="number" min="0"
                        style={{flex:1,minWidth:0,width:"100%",textAlign:"center",fontSize:18,fontWeight:700,color:"#fff",background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono,monospace",padding:"0 4px"}}/>
                      <button onClick={() => setSetDraft(p => ({...p,reps:p.reps+1}))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,cursor:"pointer",flexShrink:0}}>+</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => logSet(entry.name)}
                  style={{width:"100%",padding:"13px",background:accent,border:"none",borderRadius:9,color:"#050505",fontSize:14,fontWeight:800,letterSpacing:".08em",cursor:"pointer"}}>LOG SET</button>
              </div>
            )}
          </div>
        ))}

        {/* Add exercise search */}
        <div style={{marginBottom:16}}>
          <div style={{position:"relative"}}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && query.trim() && !libMatches.length) addExercise(query.trim()); }}
              placeholder="Search or type exercise name…"
              style={{width:"100%",boxSizing:"border-box",padding:"13px 54px 13px 14px",background:surface.bg0,border:`1px solid ${accent}44`,borderRadius:10,color:"#f0f0f0",fontSize:14,outline:"none"}}
            />
            {query.trim() && (
              <button onClick={() => addExercise(query.trim())}
                style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",padding:"7px 10px",background:accent,border:"none",borderRadius:7,color:"#050505",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:".06em"}}>ADD</button>
            )}
          </div>
          {libMatches.length > 0 && (
            <div style={{marginTop:4,background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:10,overflow:"hidden"}}>
              {libMatches.map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex.name)}
                  style={{width:"100%",display:"flex",justifyContent:"space-between",padding:"11px 14px",background:"transparent",border:"none",borderBottom:"1px solid #141414",color:"#f0f0f0",textAlign:"left",cursor:"pointer"}}>
                  <span style={{fontSize:14,fontWeight:700}}>{ex.name}</span>
                  <span style={{fontSize:11,color:"#777"}}>{ex.equipment}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Finish */}
        <button onClick={finish} disabled={!hasEntries}
          style={{width:"100%",padding:"18px",borderRadius:13,border:hasEntries?"none":"1px solid #2a2a2a",background:hasEntries?accent:"#1a1a1a",color:hasEntries?"#050505":"#555",fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:".12em",boxShadow:hasEntries?`0 0 36px ${accent}55`:"none",cursor:hasEntries?"pointer":"default"}}>
          {hasEntries ? "💾 SAVE SESSION" : "ADD AN EXERCISE TO BEGIN"}
        </button>

        {hasEntries && (
          <button onClick={onClose}
            style={{display:"block",margin:"12px auto 0",background:"transparent",border:"none",color:text.faint,fontSize:12,letterSpacing:".06em",cursor:"pointer"}}>discard &amp; exit</button>
        )}
      </div>
    </div>
  );
}

// ── SESSION DEBRIEF ──────────────────────────────────────────────────────────
function buildDebrief(firedTypes) {
  const bullets = [];
  for (const type of firedTypes) {
    if (type.startsWith("pr-")) {
      bullets.push({ icon: "↑", text: `Strength improved on ${type.slice(3)}.` });
    } else if (type.startsWith("rep-drop-")) {
      bullets.push({ icon: "↓", text: `Fatigue accumulated quickly on ${type.slice(9)}.` });
    } else if (type.startsWith("sore-start-")) {
      const muscle = type.includes(":") ? type.split(":")[1] : type.slice(11);
      bullets.push({ icon: "~", text: `You trained through limited recovery on ${muscle}.` });
    }
  }
  if (bullets.length === 0) {
    bullets.push({ icon: "✓", text: "Session stayed within target recovery range." });
  }
  return bullets;
}

// ── MAIN VIEW ─────────────────────────────────────────────────────────────────
export default function WorkoutView({
  sets, setSets, history, setHistory, completed, setCompleted,
  progression, setProgression, settings,
  setSettings,
  exConfig, setExConfig, xp, addXp, level,
  checkIns, setCheckIns,
  playSound, vibrate, setActiveView, theme="dark",
  assessmentDone, setAssessmentDone,
  benchmarkEditorOpen=false, setBenchmarkEditorOpen,
  customRoutine,
  userProfile,
  goals = [],
  bodyMetrics = [],
}) {
  const [activeTab,    setActiveTab]   = useState(()=>defaultWorkoutDay());
  const [expanded,     setExpanded]    = useState(null);
  const [restState,    setRestState]   = useState(null);
  const [loggerState,  setLoggerState] = useState(null);
  const [toast,        setToast]       = useState(null);
  const [confetti,     setConfetti]    = useState(false);
  const [bounceSets,   setBounceSets]  = useState({});
  const [xpVisible,    setXpVisible]   = useState(false);
  const [xpAmount,     setXpAmount]    = useState(0);
  const [sessionLogs,  setSessionLogs] = useState({});
  const [xpAwards,     setXpAwards]    = useState({});
  const [showFeedback, setShowFeedback]= useState(false);
  const [focusMode,    setFocusMode]   = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [undoSet,      setUndoSet]      = useState(null);
  const [substitutions, setSubstitutions] = useState({});
  const [coachOpen,    setCoachOpen]    = useState(false);
  const [workoutNote,  setWorkoutNote]  = useState("");
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [benchmarkDismissed, setBenchmarkDismissed] = useState(false);
  const [logbookMode, setLogbookMode] = useState(false);
  const [coachAlerts, setCoachAlerts] = useState([]);
  const [debrief,     setDebrief]     = useState(null);
  const firedAlertTypes = useRef(new Set());

  const customWorkout = customRoutine?.enabled ? customRoutineWorkout(customRoutine, activeTab) : null;
  const wKey    = customWorkout ? "CUSTOM" : SCHEDULE[activeTab];
  const workout = customWorkout || WORKOUTS[wKey];
  const accent  = workout.color;
  const workoutPlan = useMemo(() => {
    const applySubstitution = (ex) => {
      const sub = substitutions[ex.name];
      if (!sub) return ex;
      return {
        ...ex,
        name: sub.name,
        originalName: ex.name,
        configName: ex.name,
        substitutedFor: ex.name,
        tip: `Substitute for ${ex.name}: ${sub.reason}. Keep the reps controlled and pain-free.`,
      };
    };
    const base = workout.exercises.map(applySubstitution);
    const keyOf = (ex) => ex.configName || ex.name;
    const ordered = exerciseOrder.length
      ? [...base].sort((a,b)=>(exerciseOrder.indexOf(keyOf(a)) === -1 ? 999 : exerciseOrder.indexOf(keyOf(a))) - (exerciseOrder.indexOf(keyOf(b)) === -1 ? 999 : exerciseOrder.indexOf(keyOf(b))))
      : base;
    return { ...workout, exercises: ordered };
  }, [workout, substitutions, exerciseOrder]);

  const sessionKey = completionKey(activeTab);
  const logKey  = (i,j) => makeLogKey(sessionKey,i,j);
  const setKey  = (i,j) => `${sessionKey}_${i}_${j}`;
  const setDone = (i,j) => !!sets[setKey(i,j)];
  const isCompleted = !!completed[sessionKey];
  const completedSession = useMemo(() => {
    const scheduled = scheduledDate(activeTab);
    const scheduledTime = scheduled.getTime();
    const scheduledLabel = dateStr(scheduled);
    return history.find(h =>
      h.day === activeTab
      && (h.timestamp === scheduledTime || h.date === scheduledLabel)
    );
  }, [history, activeTab]);

  // Apply any pending adjustments at session start
  useEffect(()=>{
    const pending=Object.entries(exConfig).filter(([,cfg])=>cfg.pendingAdj!==undefined&&cfg.pendingAdj!==null);
    if(pending.length){
      setExConfig(p=>{
        const n={...p};
        pending.forEach(([name,cfg])=>{
          n[name]={...cfg,pendingAdj:null};
        });
        return n;
      });
    }
  },[activeTab]); // eslint-disable-line

  useEffect(() => {
    setSubstitutions({});
    setExerciseOrder([]);
  }, [sessionKey]);

  const readinessEntry = useMemo(
    () => (checkIns||[]).find(ci=>ci.kind==="readiness"&&ci.sessionKey===sessionKey),
    [checkIns, sessionKey]
  );
  const readiness = readinessEntry?.readiness;
  const effectiveReadiness = readiness || DEFAULT_READINESS;
  const effectiveRest = useMemo(
    () => ageAdjustedRestSeconds(userProfile, settings.restSeconds || 60),
    [userProfile, settings.restSeconds]
  );
  const coachPlan = useMemo(
    () => buildCoachPlan({workout,history,checkIns,exConfig,settings,readiness:effectiveReadiness,userProfile,goals,bodyMetrics}),
    [workout, history, checkIns, exConfig, settings, effectiveReadiness, userProfile, goals, bodyMetrics]
  );
  const suggestions = useMemo(
    () => [...coachPlan.cards, ...(WORKOUTS[wKey] ? buildSuggestions({history,progression,settings,exConfig,workoutKey:wKey}) : [])],
    [coachPlan, history, progression, settings, exConfig, wKey]
  );
  const coachMemory = useMemo(
    () => buildCoachMemory({ history, checkIns, exercises:workout.exercises, exConfig, userProfile, goals, bodyMetrics }),
    [history, checkIns, exConfig, workout, userProfile, goals, bodyMetrics]
  );
  const exerciseKey = (exOrName) => typeof exOrName === "string" ? exOrName : (exOrName.configName || exOrName.name);
  const exerciseIdFor = (ex) => ex.id || exerciseKey(ex).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const getBaseTargetReps = (ex) => exConfig[exerciseKey(ex)]?.targetReps ?? (ex.baseReps + (progression[exerciseKey(ex)]?.repBonus||0));
  const getScience = (ex) => sciencePrescription({ exercise:ex, history, checkIns, settings, readiness:effectiveReadiness, baseTarget:getBaseTargetReps(ex), exConfig });
  const getTargetReps = (ex) => {
    const science = getScience(ex);
    return science.enabled ? science.targetReps : coachTargetReps(getBaseTargetReps(ex), effectiveReadiness);
  };
  const getSetCount = (ex) => {
    const science = getScience(ex);
    return science.enabled ? science.sets : coachSetCount(ex.sets, effectiveReadiness);
  };
  const getWeight     = (n)  => {
    const configured = exConfig[exerciseKey(n)]?.weight ?? DEFAULT_WEIGHTS[exerciseKey(n)] ?? settings.dumbbellWeight;
    if (typeof n !== "string") {
      const science = getScience(n);
      if (science.suggestedWeight && science.suggestedWeight > 0) return science.suggestedWeight;
    }
    return configured;
  };
  const getNextW      = (n)  => exConfig[exerciseKey(n)]?.nextWeight;
  const getMaxTest    = (n)  => exConfig[exerciseKey(n)]?.maxRepsTest;
  const exDone  = (i)   => Array.from({length:getSetCount(workoutPlan.exercises[i])},(_,j)=>setDone(i,j)).every(Boolean);
  const totalSets = workoutPlan.exercises.reduce((a,e)=>a+getSetCount(e),0);
  const doneSets  = workoutPlan.exercises.reduce((a,ex,i)=>a+Array.from({length:getSetCount(ex)},(_,j)=>setDone(i,j)?1:0).reduce((x,y)=>x+y,0),0);
  const allDone   = doneSets===totalSets;
  const sessionRunning = doneSets>0&&!isCompleted;
  const sessionElapsed = useSessionTimer(sessionRunning);
  const remainingSets = Math.max(0, totalSets - doneSets);
  const estimatedRemaining = remainingSets
    ? (remainingSets * 35) + (Math.max(0, remainingSets - 1) * effectiveRest)
    : 0;

  const getPreviousPerformance = (ex) => {
    const key = exerciseKey(ex);
    const session = [...history].sort((a,b)=>(b.timestamp||0)-(a.timestamp||0))
      .find(h => h.exercises?.some(item => (item.originalName || item.substitutedFor || item.name) === key || item.name === key));
    const logged = session?.exercises?.find(item => (item.originalName || item.substitutedFor || item.name) === key || item.name === key);
    if (!logged?.setLog?.length) return null;
    const totalReps = logged.setLog.reduce((s,l)=>s+(l.reps||0),0);
    const best = [...logged.setLog].sort((a,b)=>(b.reps||0)-(a.reps||0))[0];
    return { sets: logged.setLog.length, totalReps, bestReps: best?.reps || 0, bestWeight: best?.weight || 0, date: session.date };
  };

  const progressionPreview = useMemo(() => {
    return workoutPlan.exercises.flatMap(ex => {
      const science = getScience(ex);
      const prev = getPreviousPerformance(ex);
      const items = [];
      const curW = getWeight(ex);
      const nextW = getNextW(ex);
      if (nextW && nextW > curW) items.push({ icon:"↑", text:`${ex.name}: try ${nextW}lbs if warm-ups feel clean.` });
      if (science.variation?.level > 1) items.push({ icon:"↗", text:`${ex.name}: use ${science.variation.name} to make fixed weight harder.` });
      if (science.tempo) items.push({ icon:"T", text:`${ex.name}: tempo ${science.tempo.code} today.` });
      if (prev) items.push({ icon:"=", text:`${ex.name}: last time ${prev.totalReps} reps total; match or beat cleanly.` });
      return items.slice(0,1);
    });
  }, [workoutPlan, history, exConfig, progression, settings, checkIns, effectiveReadiness]); // eslint-disable-line

  const streak = useMemo(() => {
    if(!history.length) return 0;
    const s=[...history].sort((a,b)=>b.timestamp-a.timestamp);
    let r=1; for(let i=1;i<s.length;i++){if((s[i-1].timestamp-s[i].timestamp)/86400000<=4.5)r++;else break;}
    return r;
  }, [history]);

  const muscleReadiness = useMemo(() => {
    const muscles = [...new Set(workoutPlan.exercises.flatMap(ex => ex.primary || []))];
    if (!muscles.length) return [];
    const soreness = {};
    [...checkIns].filter(ci => ci.kind === "muscle_soreness" && ci.muscle && ci.level)
      .sort((a,b)=>(b.timestamp||0)-(a.timestamp||0))
      .forEach(ci => { if (!soreness[ci.muscle]) soreness[ci.muscle] = ci.level; });
    const now = Date.now();
    return muscles.slice(0,6).map(m => {
      const last = [...history].sort((a,b)=>(b.timestamp||0)-(a.timestamp||0))
        .find(h => h.exercises?.some(ex => (ex.primary||[]).includes(m) || (ex.secondary||[]).includes(m)));
      const hoursSince = last ? (now - (last.timestamp||0)) / 3600000 : 999;
      const sore = soreness[m];
      const state = sore === "sore" ? "sore" : (sore === "mild" || hoursSince < 36) ? "recovering" : "ready";
      return { muscle: m, state };
    });
  }, [workoutPlan, history, checkIns]);

  const sessionIntent = useMemo(() => {
    const labeled = muscleReadiness.map(m => ({ ...m, label: MUSCLE_LABELS[m.muscle] || m.muscle }));
    return buildSessionIntent({ readiness: effectiveReadiness, history, checkIns, muscleReadiness: labeled });
  }, [effectiveReadiness, history, checkIns, muscleReadiness]); // eslint-disable-line

  const saveReadiness = (nextReadiness) => {
    const entry = {
      kind:"readiness",
      sessionKey,
      day:activeTab,
      workout:wKey,
      date:dateStr(scheduledDate(activeTab)),
      timestamp:Date.now(),
      readiness:nextReadiness,
    };
    setCheckIns(p=>[...(p||[]).filter(ci=>!(ci.kind==="readiness"&&ci.sessionKey===sessionKey)),entry]);
  };

  const logCoachEvent = (entry) => {
    setCheckIns(p => [...(p || []), {
      sessionKey,
      day:activeTab,
      workout:wKey,
      date:dateStr(scheduledDate(activeTab)),
      timestamp:Date.now(),
      ...entry,
    }].slice(-1000));
  };

  const useSubstitution = (sub, option) => {
    const chosen = option || sub.alternatives?.find(item => item.name === sub.substitute) || { name: sub.substitute, reason: sub.reason };
    setSubstitutions(p => ({ ...p, [sub.exercise]: { name: chosen.name, reason: chosen.reason || sub.reason } }));
    setToast({ icon:"🔁", title:"SWAP ACTIVE", msg:`${sub.exercise} swapped for ${chosen.name} today.`, accent });
  };

  const removeSubstitution = (exerciseName) => {
    setSubstitutions(p => {
      const n = { ...p };
      delete n[exerciseName];
      return n;
    });
  };

  useEffect(() => {
    if (!undoSet) return;
    const duration = restState && !restState.done
      ? Math.max((restState.plannedSeconds || effectiveRest || 0) * 1000 + 1200, 4500)
      : 4500;
    const id = setTimeout(() => setUndoSet(null), duration);
    return () => clearTimeout(id);
  }, [undoSet, restState?.restId, restState?.done, restState?.plannedSeconds, effectiveRest]);

  const spawnXp = (amount) => {
    addXp(amount);
    setXpAmount(amount);
    setXpVisible(true);
    setTimeout(()=>setXpVisible(false),900);
  };

  const fireCoachAlert = (type, msg) => {
    if (firedAlertTypes.current.has(type)) return;
    firedAlertTypes.current.add(type);
    const id = Date.now() + Math.random();
    setCoachAlerts(prev => [...prev.slice(-1), { id, msg }]);
    setTimeout(() => setCoachAlerts(prev => prev.filter(a => a.id !== id)), 5000);
  };

  const completeLoggedSet = (i, j, log, action = "save") => {
    const k = setKey(i,j);
    const ex = workoutPlan.exercises[i];
    const lk = logKey(i,j);
    const cleanLog = {
      weight: Number.isFinite(Number(log.weight)) ? Math.max(Number(log.weight), 0) : getWeight(ex),
      reps: Number.isFinite(Number(log.reps)) ? Math.max(Math.round(Number(log.reps)), 0) : getTargetReps(ex),
    };

    // — Coach event: rep drop (fatigue signal) ——————————————————
    const prevSessionSets = Object.entries({...sessionLogs, [lk]: cleanLog})
      .filter(([k2]) => k2.startsWith(`${i}-`))
      .sort(([a],[b]) => Number(a.split("-")[1]) - Number(b.split("-")[1]))
      .map(([,v]) => v.reps);
    if (prevSessionSets.length >= 2) {
      const first = prevSessionSets[0];
      const last  = prevSessionSets[prevSessionSets.length - 1];
      if (first > 0 && last <= first * 0.72) {
        fireCoachAlert(`rep-drop-${ex.name}`, `Fatigue on ${ex.name} — reps dropped from ${first} to ${last}. Keep form clean.`);
      }
    }

    // — Coach event: PR (new est1RM) ——————————————————————————
    if (cleanLog.weight > 0 && cleanLog.reps > 0) {
      const newEst = cleanLog.weight * (1 + cleanLog.reps / 30);
      const prevBest = bestEstimated1RM(history, exerciseKey(ex), exConfig);
      if (!prevBest || newEst > prevBest * 1.02) {
        fireCoachAlert(`pr-${ex.name}`, `New est. 1RM on ${ex.name} — up to ${Math.round(newEst)}lbs. Strong set.`);
      }
    }

    // — Coach event: sore-muscle start ————————————————————————
    if (j === 0) {
      const sore = muscleReadiness.find(m => m.state === "sore" && (ex.primary||[]).includes(m.muscle));
      if (sore) {
        const label = MUSCLE_LABELS[sore.muscle] || sore.muscle;
        fireCoachAlert(`sore-start-${ex.name}:${label}`, `${ex.name} targets ${label}, which is still sore. Targets are already adjusted.`);
      }
    }

    setSets(p=>({...p,[k]:true}));
    setSessionLogs(p=>({...p,[lk]:cleanLog}));
    logCoachEvent({kind:"set_log",action,exercise:ex.name,set:j+1,weight:cleanLog.weight,reps:cleanLog.reps});
    if(!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    setUndoSet({exIdx:i,setIdx:j,setKey:k,logKey:lk,label:`${ex.name} set ${j+1}`});
    playSound("setComplete"); vibrate([28]);
    setBounceSets(p=>({...p,[lk]:true}));
    setTimeout(()=>setBounceSets(p=>{const n={...p};delete n[lk];return n;}),500);
    const remaining=getSetCount(ex)-(j+1);
    const hasNextExercise=i+1<workoutPlan.exercises.length;
    const next=remaining>0?`Set ${j+2} of ${ex.name}`:hasNextExercise?`Up next: ${workoutPlan.exercises[i+1].name}`:null;
    if(next) {
      const restId = `${sessionKey}_${i}_${j}_${Date.now()}`;
      logCoachEvent({kind:"rest",action:"start",restId,exercise:ex.name,set:j+1,plannedSeconds:effectiveRest});
      setRestState({label:next,accent,restId,startedAt:Date.now(),plannedSeconds:effectiveRest});
    }
    else setRestState(null);
  };

  const toggleSet = (i,j) => {
    const k=setKey(i,j); const was=!!sets[k];
    const ex=workoutPlan.exercises[i];
    const lk=logKey(i,j);

    if(was){
      const logged=sessionLogs[lk]||{weight:getWeight(ex),reps:getTargetReps(ex)};
      setLoggerState({exIdx:i,setIdx:j,weight:logged.weight,reps:logged.reps,editing:true});
      return;
    }

    setLoggerState({exIdx:i,setIdx:j,weight:getWeight(ex),reps:getTargetReps(ex),editing:false});
  };

  const saveSetFeedback = (feeling) => {
    if(!undoSet) return;
    const ex = workoutPlan.exercises[undoSet.exIdx];
    const entry = {
      kind:"set_feedback",
      sessionKey,
      setKey:undoSet.setKey,
      day:activeTab,
      workout:wKey,
      exercise:ex.name,
      originalName:ex.originalName || ex.configName || ex.name,
      set:undoSet.setIdx + 1,
      feeling,
      date:dateStr(scheduledDate(activeTab)),
      timestamp:Date.now(),
    };
    setCheckIns(p=>[...(p||[]).filter(ci=>ci.kind!=="set_feedback"||ci.setKey!==undoSet.setKey),entry]);
    setToast({
      icon:feeling==="pain"?"🛑":"🧠",
      title:"COACH NOTE SAVED",
      msg:feeling==="pain" ? `${ex.name} flagged for discomfort.` : `${ex.name} set ${undoSet.setIdx+1}: ${feeling}.`,
      accent:feeling==="pain"?status.caution:accent,
      duration:2000,
    });
    setUndoSet(null);
  };

  const undoLastSet = () => {
    if(!undoSet) return;
    setSets(p=>{const n={...p};delete n[undoSet.setKey];return n;});
    setSessionLogs(p=>{const n={...p};delete n[undoSet.logKey];return n;});
    if(xpAwards[undoSet.logKey]) addXp(-XP_VALUES.set);
    setXpAwards(p=>{const n={...p};delete n[undoSet.logKey];return n;});
    if(loggerState?.exIdx===undoSet.exIdx&&loggerState?.setIdx===undoSet.setIdx) setLoggerState(null);
    setRestState(null);
    setUndoSet(null);
    playSound("uncheck");
  };

  const saveLog = ({weight,reps}) => {
    if(!loggerState) return;
    const {exIdx,setIdx,editing}=loggerState;
    const lk=logKey(exIdx,setIdx);
    if(editing){
      setSessionLogs(p=>({...p,[lk]:{weight,reps}}));
      logCoachEvent({kind:"set_log",action:"edit",exercise:workoutPlan.exercises[exIdx].name,set:setIdx+1,weight,reps});
    } else {
      completeLoggedSet(exIdx,setIdx,{weight,reps},"save");
    }
    setLoggerState(null);
  };

  const skipLog = () => {
    if(!loggerState) return;
    const {exIdx,setIdx,editing}=loggerState;
    if(editing){
      setLoggerState(null);
      return;
    }
    const ex=workoutPlan.exercises[exIdx];
    completeLoggedSet(exIdx,setIdx,{weight:getWeight(ex),reps:getTargetReps(ex)},"skip");
    setLoggerState(null);
  };

  const finishWorkout = () => {
    if(!allDone) return;
    const exSnap = workoutPlan.exercises.map((ex,i)=>{
      const sets=getSetCount(ex);
      const logs=Array.from({length:sets},(_,j)=>sessionLogs[logKey(i,j)]||{weight:getWeight(ex),reps:getTargetReps(ex)});
      return {id:exerciseIdFor(ex),plannedId:exerciseIdFor({ ...ex, name:ex.configName || ex.originalName || ex.name }),name:ex.name,originalName:ex.originalName,substitutedFor:ex.substitutedFor,sets,reps:getTargetReps(ex),setLog:logs};
    });

    // Update weights / next weight suggestions
    // weight calc inline
    const newConfig={...exConfig};
    const prs=[];
    exSnap.forEach((exS,i)=>{
      const ex=workoutPlan.exercises[i];
      const key=exerciseKey(ex);
      const curW=getWeight(ex);
      const rec=evaluateProgression({setLog:exS.setLog,targetReps:getTargetReps(ex),currentWeight:curW,previous:exConfig[key],increment:settings.weightIncrement||2.5,style:settings.coachStyle||ageTier(userProfile).progressStyle,autoDeload:settings.autoDeload!==false});
      const curMaxW=exConfig[key]?.maxWeight||0;
      const newMaxW=Math.max(...exS.setLog.map(l=>l.weight));
      if(newMaxW>curMaxW) prs.push({name:ex.name,val:newMaxW});
      newConfig[key]={...newConfig[key],weight:rec.action==="deload"?rec.nextWeight:curW,nextWeight:rec.action==="increase"?rec.nextWeight:undefined,maxWeight:Math.max(newMaxW,curMaxW),cleanSessions:rec.cleanSessions,missSessions:rec.missSessions,lastRec:rec.action,lastRecNote:rec.note};
    });
    setExConfig(newConfig);

    // Rep progression (legacy fallback)
    const newProg={...progression};
    const unlocked=[];
    workout.exercises.forEach(ex=>{
      const cur=newProg[ex.name]||{sessions:0,repBonus:0};
      const newS=cur.sessions+1; let newB=cur.repBonus;
      if(newS>=settings.sessionsPerProgression&&newB<settings.maxRepBonus){
        newB+=1; unlocked.push(`${ex.name} → ×${ex.baseReps+newB}`);
        newProg[ex.name]={sessions:0,repBonus:newB};
      } else if(newS>=settings.sessionsPerProgression){
        newProg[ex.name]={sessions:0,repBonus:newB};
      } else { newProg[ex.name]={sessions:newS,repBonus:newB}; }
    });
    setProgression(newProg);

    setWorkoutSummary(summarizeWorkout({
      exercises:exSnap,
      duration:sessionElapsed,
      readiness:effectiveReadiness,
      prs,
      nextWorkout:wKey==="A"?"B":customWorkout?"Custom":"A",
    }));
    setHistory(p=>[{day:activeTab,workout:wKey,date:dateStr(scheduledDate(activeTab)),timestamp:scheduledDate(activeTab).getTime(),duration:sessionElapsed,exercises:exSnap,readiness:effectiveReadiness,note:workoutNote.trim()||undefined,warmup:"Easy movement + light first set",cooldown:"Slow breathing + gentle mobility"} ,...p].slice(0,120));
    setCompleted(p=>({...p,[sessionKey]:dateStr(scheduledDate(activeTab))}));
    setDebrief(buildDebrief(firedAlertTypes.current));
    playSound("workoutDone"); vibrate([100,60,100]);
    setConfetti(true);
    spawnXp(XP_VALUES.workout);

    if(prs.length) setTimeout(()=>{playSound("achievement");setToast({icon:"🏆",title:"PERSONAL RECORD",msg:prs.map(p=>`${p.name}: ${p.val}lbs`).join(", "),accent:status.warn});},600);
  };

  const handleFeedback = (feedbackPayload) => {
    setShowFeedback(false);
    const feedbackMap = feedbackPayload?.exercises || feedbackPayload || {};
    const workoutFeeling = feedbackPayload?.workoutFeeling;
    if (workoutFeeling) {
      logCoachEvent({kind:"workout_feedback",feeling:workoutFeeling});
    }
    const workoutAdj = { easy: 1, good: 0, hard: -1, pain: -2 }[workoutFeeling] || 0;
    // Apply feedback as pending adjustments
    const newConfig={...exConfig};
    workoutPlan.exercises.forEach(ex=>{
      const fb=feedbackMap[ex.name];
      if(!fb&&!workoutAdj) return;
      const key=exerciseKey(ex);
      const cur=newConfig[key]||{};
      const maxTest=cur.maxRepsTest;
      const baseFeedbackTarget = fb ? calcDynamicTarget(getTargetReps(ex),fb,maxTest) : getTargetReps(ex);
      const newTarget=Math.max(3, baseFeedbackTarget + workoutAdj);
      const adj=newTarget-getTargetReps(ex);
      newConfig[key]={...cur,targetReps:newTarget,pendingAdj:adj};
    });
    setExConfig(newConfig);
    setSessionLogs({});
    setXpAwards({});
    setFocusMode(false);
    setWorkoutSummary(null);
    setDebrief(null);
    setUndoSet(null);
    setRestState(null);
    setLoggerState(null);
    setWorkoutNote("");
  };

  const assessmentExercises = workout.exercises?.length ? workout.exercises : ASSESSMENT_EXERCISES;
  const getAssessmentResults = () => Object.fromEntries(assessmentExercises.map(ex => {
    const config = exConfig[ex.name] || {};
    const fromTarget = config.targetReps ? Math.max(1, Math.round(config.targetReps / 0.65)) : ex.baseReps;
    return [ex.name, config.maxRepsTest || fromTarget];
  }));

  const completeAssessment = (results) => {
    const newConfig={...exConfig};
    assessmentExercises.forEach(ex=>{
      const maxReps=results?.[ex.name];
      const target=maxReps ? assessmentTargetForProfile(maxReps, userProfile) : ex.baseReps;
      newConfig[ex.name]={
        ...newConfig[ex.name],
        maxRepsTest:maxReps||null,
        targetReps:target,
        weight:newConfig[ex.name]?.weight ?? DEFAULT_WEIGHTS[ex.name] ?? settings.dumbbellWeight,
      };
    });
    setExConfig(newConfig);
    setAssessmentDone(true);
    setBenchmarkEditorOpen?.(false);
  };

  // Show assessment if not done yet and no history
  if (!settings.onboardingDone && history.length === 0) {
    return <FirstRunSetup settings={settings} setSettings={setSettings} accent={accent}/>;
  }

  if (benchmarkEditorOpen) {
    return (
      <AssessmentFlow
        onComplete={completeAssessment}
        onCancel={()=>setBenchmarkEditorOpen?.(false)}
        accent={accent}
        theme={theme}
        initialResults={getAssessmentResults()}
        exercises={assessmentExercises}
        userProfile={userProfile}
        editing
      />
    );
  }

  // Assessment is now optional — users can dismiss and do it later via Settings → Edit Benchmark

  if (logbookMode) {
    return (
      <LogbookPanel
        accent={accent}
        onClose={() => setLogbookMode(false)}
        onSave={({ exercises, duration }) => {
          setHistory(p => [{
            day: activeTab,
            workout: "LOGBOOK",
            date: dateStr(scheduledDate(activeTab)),
            timestamp: Date.now(),
            duration,
            exercises,
            note: "Free log session",
          }, ...p].slice(0, 120));
          setLogbookMode(false);
        }}
      />
    );
  }

  return (
    <div>
      {xpVisible&&<XpFloat amount={xpAmount} onDone={()=>setXpVisible(false)}/>}

      {/* HEADER */}
      <div style={{padding:"20px 16px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:".06em",lineHeight:1,color:"#fafafa"}}>LIFT LOG</div>
            <div style={{fontSize:11,color:text.tertiary,letterSpacing:".08em"}}>{level.badge} {level.name} · LV.{level.idx+1}</div>
          </div>
          <div style={{textAlign:"right"}}>
            {sessionRunning?(<>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:accent,filter:`drop-shadow(0 0 6px ${accent}99)`}}>{fmtDuration(sessionElapsed)}</div>
              <div style={{fontSize:10,color:text.tertiary}}>~{fmtDuration(estimatedRemaining)} left</div>
            </>):streak>0?(
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#fb923c",filter:"drop-shadow(0 0 6px #fb923c88)"}}>{streak} 🔥</div>
            ):null}
          </div>
        </div>
        {/* Slim XP bar — no labels */}
        <div style={{marginTop:8,height:3,background:surface.bg4,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${level.pct*100}%`,background:`linear-gradient(90deg,${level.color}88,${level.color})`,transition:"width .5s ease"}}/>
        </div>
      </div>

      {!readiness&&!isCompleted&&doneSets===0&&(
        settings.showReadiness!==false&&<ReadinessCheckIn value={DEFAULT_READINESS} onSave={saveReadiness} accent={accent}/>
      )}
      {/* BENCHMARK SUGGESTION — dismissable, shown until assessment done */}
      {!assessmentDone && !benchmarkDismissed && history.length < 3 && (
        <div style={{margin:"0 16px 8px",padding:"13px 14px",background:surface.bg0,border:`1px solid ${accent}44`,borderRadius:11,display:"flex",alignItems:"flex-start",gap:12}}>
          <span style={{fontSize:20,flexShrink:0}}>🧠</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,color:accent,fontWeight:800,marginBottom:3}}>Help the coach learn your baseline</div>
            <div style={{fontSize:12,color:text.tertiary,lineHeight:1.45}}>A quick 3-exercise test (plank, push-ups, squats) lets the coach calibrate your starting reps and targets. Optional — skip anytime.</div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={()=>setBenchmarkEditorOpen?.(true)} style={{padding:"8px 14px",background:accent,border:"none",borderRadius:8,color:"#050505",fontSize:12,fontWeight:800,cursor:"pointer",letterSpacing:".06em"}}>TAKE TEST</button>
              <button onClick={()=>setBenchmarkDismissed(true)} style={{padding:"8px 10px",background:"transparent",border:"none",color:text.faint,fontSize:12,cursor:"pointer"}}>Skip for now</button>
            </div>
          </div>
        </div>
      )}

      {/* DAY TABS */}
      <div style={{display:"flex",borderTop:"1px solid #1a1a1a",borderBottom:"1px solid #1a1a1a",background:"#080808"}}>
        {DAYS.map(day=>{
          const isActive=activeTab===day; const dc=WORKOUTS[SCHEDULE[day]].color;
          return(
            <button key={day} onClick={()=>{setActiveTab(day);setExpanded(null);}}
              style={{flex:1,padding:"16px 4px",background:"transparent",border:"none",color:isActive?dc:"#888",fontSize:14,letterSpacing:".1em",fontWeight:600,borderBottom:`2.5px solid ${isActive?dc:"transparent"}`,transition:"all .2s",textTransform:"uppercase"}}>
              {day.slice(0,3)}
              {completed[completionKey(day)]&&<div style={{fontSize:10,color:dc,marginTop:2}}>✓</div>}
            </button>
          );
        })}
      </div>

      {/* WORKOUT META */}
      <div style={{padding:"22px 16px 18px",borderBottom:"1px solid #111"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:accent,letterSpacing:".06em",filter:`drop-shadow(0 0 10px ${accent}66)`}}>{workout.label}</span>
            {sessionIntent&&(
              <div style={{marginTop:2}}>
                <span style={{
                  fontSize:12,fontWeight:600,
                  color: sessionIntent.tone==="boost"?accent : sessionIntent.tone==="caution"?status.warn : sessionIntent.tone==="deload"?status.info : "#666"
                }}>{sessionIntent.label}</span>
              </div>
            )}
          </div>
          <button onClick={()=>{if(!confirm("Reset today's sets?"))return;const n={...sets};workoutPlan.exercises.forEach((ex,i)=>Array.from({length:getSetCount(ex)},(_,j)=>{delete n[setKey(i,j)];}));setSets(n);setCompleted(p=>{const n2={...p};delete n2[sessionKey];return n2;});setExpanded(null);setRestState(null);setLoggerState(null);setSessionLogs({});setXpAwards({});setFocusMode(false);setWorkoutSummary(null);setUndoSet(null);}}
            style={{background:"none",border:"none",color:text.ghost,fontSize:12,padding:"8px 10px"}}>Reset</button>
        </div>
        <div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:13,color:"#777",fontWeight:500}}>Progress</span>
            <span style={{fontSize:13,color:doneSets>0?accent:"#aaa"}}>{doneSets}/{totalSets} sets · ~{fmtDuration(estimatedRemaining)} left</span>
          </div>
          <div style={{height:7,background:surface.bg4,borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(doneSets/totalSets)*100}%`,background:`linear-gradient(90deg,${accent}bb,${accent})`,transition:"width .4s ease",boxShadow:doneSets>0?`0 0 14px ${accent}bb`:"none"}}/>
          </div>
          {doneSets===0&&!isCompleted&&sessionIntent?.note&&(
            <div style={{marginTop:12,fontSize:13,color:"#777",lineHeight:1.55}}>
              {sessionIntent.note}
            </div>
          )}
          {doneSets===0&&!isCompleted&&muscleReadiness.length>0&&(
            <div style={{marginTop:20}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
                <div style={{fontSize:12,color:text.faint,fontWeight:600}}>Muscle readiness</div>
                <div style={{fontSize:11,color:"#3a3a3a"}}>Adapts around recovery.</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {muscleReadiness.map(({muscle,state})=>{
                  const col = state==="sore"?status.caution:state==="recovering"?status.warn:status.good;
                  return (
                    <span key={muscle} style={{fontSize:11,color:col,borderRadius:999,padding:"3px 10px",background:`${col}18`,fontWeight:500}}>
                      {MUSCLE_LABELS[muscle]||muscle}{state==="ready"?" ✓":state==="recovering"?" ~":" ✗"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {doneSets===0&&!isCompleted&&<ProgressionPreview items={progressionPreview} accent={accent}/>}
          {!isCompleted&&(
            <NoteField value={workoutNote} onChange={setWorkoutNote} />
          )}
          {!isCompleted&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,marginTop:12}}>
              <button onClick={()=>setFocusMode(true)}
                style={{padding:"18px",background:accent,border:"none",borderRadius:13,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:25,letterSpacing:".12em",boxShadow:`0 0 36px ${accent}55`}}>
                START WORKOUT
              </button>
              <button onClick={() => setLogbookMode(true)}
                style={{padding:"14px 16px",background:surface.bg3,border:"none",borderRadius:13,color:text.muted,fontSize:11,fontWeight:500,lineHeight:1.3,textAlign:"center"}}>
                📓{"\n"}Free{"\n"}log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EXERCISES */}
      <div>
        {workoutPlan.exercises.map((ex,i)=>{
          const open=expanded===i;
          const exKey=exerciseKey(ex);
          const reps=getTargetReps(ex); const bonus=progression[exKey]?.repBonus||0;
          const atMax=bonus>=settings.maxRepBonus; const done=exDone(i);
          const curW=getWeight(ex); const nextW=getNextW(ex);
          const hasNxtW=nextW&&nextW>curW;
          const maxTest=getMaxTest(ex);
          const science=getScience(ex);
          const exColor=WORKOUTS.A.exercises.some(e=>e.name===ex.name)?WORKOUTS.A.color:WORKOUTS.B.color;
          const histData=getExerciseHistory(exKey,history);
          const guide=EXERCISE_GUIDES[exKey] || EXERCISE_GUIDES[ex.name];
          const fixes=plateauFixes({history,exercise:{...ex,name:exKey},targetReps:reps});
          const why=explainExerciseDecision({
            exercise:ex,
            history,
            exConfig,
            targetReps:reps,
            science,
            progressionRec:exConfig[exKey],
            settings,
            checkIns,
          });

          return(
            <div key={i} style={{padding:"18px 16px",borderBottom:"1px solid #1a1a1a",background:done?`${accent}08`:"transparent",transition:"background .3s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div onClick={()=>setExpanded(open?null:i)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {done&&<span style={{color:accent,fontSize:17}}>✓</span>}
                    <span style={{fontSize:18,fontWeight:500,color:"#f5f5f5",opacity:done?.5:1,textDecoration:done?"line-through":"none",textDecorationColor:accent,textDecorationThickness:"1.5px"}}>{ex.name}</span>
                    {ex.substitutedFor&&<span style={{fontSize:11,color:accent,fontWeight:600}}>swap</span>}
                    <span style={{fontSize:14,color:open?accent:"#aaa",transform:open?"rotate(180deg)":"none",transition:"all .2s",display:"inline-block"}}>⌄</span>
                  </div>
                  <div style={{fontSize:14,color:text.secondary,marginTop:5,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span>{getSetCount(ex)} × {reps}{ex.repSuffix||""}</span>
                    <span style={{color:text.faint}}>{curW > 0 ? `@ ${curW}lbs` : "bodyweight"}</span>
                    {hasNxtW&&<span style={{color:accent,fontSize:12,fontWeight:500}}>→ {nextW}lbs</span>}
                    {maxTest&&<span style={{color:text.tertiary,fontSize:11}}>max: {maxTest}</span>}
                  </div>
                  {!isCompleted&&doneSets===0&&(
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      <button onClick={(e)=>{e.stopPropagation();setExerciseOrder(order=>moveExerciseOrder(order, workoutPlan.exercises, i, -1, exerciseKey));}} style={{background:"none",border:"none",color:text.ghost,padding:"4px 6px",fontSize:13}}>↑</button>
                      <button onClick={(e)=>{e.stopPropagation();setExerciseOrder(order=>moveExerciseOrder(order, workoutPlan.exercises, i, 1, exerciseKey));}} style={{background:"none",border:"none",color:text.ghost,padding:"4px 6px",fontSize:13}}>↓</button>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  {Array.from({length:getSetCount(ex)},(_,j)=>{
                    const isDone=setDone(i,j); const bk=logKey(i,j); const logged=sessionLogs[logKey(i,j)];
                    return(
                      <button key={j} onClick={()=>toggleSet(i,j)}
                        style={{width:48,height:48,borderRadius:11,border:`1.5px solid ${isDone?accent:"#3a3a3a"}`,background:isDone?`${accent}25`:"#0d0d0d",color:isDone?accent:"#999",fontSize:isDone&&logged?11:14,fontWeight:500,transition:!!bounceSets[bk]?"none":"all .18s",boxShadow:isDone?`0 0 12px ${accent}55,inset 0 0 8px ${accent}22`:"none",animation:!!bounceSets[bk]?"setBounce .4s ease-out":"none",lineHeight:1.1}}>
                        {isDone?(logged?`${logged.reps}r`:"✓"):j+1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {open&&(
                <div style={{marginTop:18,padding:18,background:surface.bg1,borderRadius:18,animation:"slideDown .25s ease-out"}}>
                  <SLabel>Animation</SLabel>
                  <ExerciseAnimation folder={exerciseFolder(ex)} video={ex.video} accent={accent}/>

                  {/* Progress graph */}
                  <div style={{marginTop:16,padding:"16px",background:"#0a0a0a",borderRadius:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:0}}>
                      <SLabel small>Your Progress</SLabel>
                      {histData.length>=2&&(
                        <span style={{fontSize:12,color:exColor}}>{histData[histData.length-1].totalReps} reps last session</span>
                      )}
                    </div>
                    <MiniGraph data={histData} color={exColor} height={85}/>
                  </div>

                  <div style={{marginTop:20}}>
                    <SLabel small>Form cue</SLabel>
                    <div style={{fontSize:15,color:"#e0e0e0",lineHeight:1.6}}>{ex.tip}</div>
                    {ex.substitutedFor&&<div style={{fontSize:12,color:text.faint,marginTop:6}}>Original: {ex.substitutedFor}</div>}
                  </div>

                  <ExerciseGuide guide={guide} accent={accent}/>
                  <CoachWhyPanel lines={why} accent={accent}/>
                  <PlateauFixPanel fixes={fixes} accent={accent}/>
                  <SwapLibrary
                    exerciseName={exKey}
                    activeName={substitutions[exKey]?.name}
                    accent={accent}
                    onApply={useSubstitution}
                    onRemove={removeSubstitution}
                  />

                  <CoachCard suggestions={suggestions.filter(s => s.cat === "Form" || s.cat === "Science" || s.cat === "Watch" || s.cat === "Habits").slice(0, 4)} accent={accent} onOpen={()=>setCoachOpen(true)}/>

                  {science.enabled&&(
                    <div style={{marginTop:20}}>
                      <SLabel small>Science coach</SLabel>
                      <div style={{fontSize:14,color:text.secondary,lineHeight:1.6}}>{science.note}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
                        {science.targetRepReason&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>target {science.targetReps} reps</span>}
                        {science.tempo&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>tempo {science.tempo.code}</span>}
                        {science.est1RM&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>est. 1RM {science.est1RM}lbs</span>}
                        {science.percent&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>{Math.round(science.percent*100)}% target</span>}
                      </div>
                      {science.tempo&&<div style={{fontSize:13,color:"#777",lineHeight:1.45,marginTop:10}}>{science.tempo.note}</div>}
                      {science.variation&&<div style={{fontSize:13,color:"#777",lineHeight:1.45,marginTop:8}}>Variation: <span style={{color:status.scienceSoft}}>{science.variation.name}</span>. {science.variation.note}</div>}
                    </div>
                  )}

                  <div style={{marginTop:20}}>
                    <SLabel>Muscles</SLabel>
                    <MuscleDiagram primary={ex.primary} secondary={ex.secondary} accent={accent}/>
                    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:12}}>
                      {ex.primary.map(m=><span key={m} style={{fontSize:13,color:accent,fontWeight:600}}>{MUSCLE_LABELS[m]}</span>)}
                      {ex.secondary.map(m=><span key={m} style={{fontSize:13,color:text.faint}}>{MUSCLE_LABELS[m]}</span>)}
                    </div>
                  </div>

                  {/* Weight config */}
                  <div style={{marginTop:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <SLabel small>Working weight</SLabel>
                      {hasNxtW&&<span style={{fontSize:12,color:accent,fontWeight:500}}>→ Try {nextW}lbs</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",background:surface.bg3,borderRadius:12,overflow:"hidden"}}>
                      <button onClick={()=>setExConfig(p=>({...p,[exKey]:{...p[exKey],weight:Math.max((p[exKey]?.weight||curW)-(settings.weightIncrement||1),0)}}))} style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>−</button>
                      <input value={curW} onChange={e=>setExConfig(p=>({...p,[exKey]:{...p[exKey],weight:Math.max(Number(e.target.value)||0,0)}}))} type="number" inputMode="decimal" min="0" step="any" aria-label={`${ex.name} working weight`}
                        style={{flex:1,minWidth:0,textAlign:"center",fontSize:20,fontWeight:500,color:"#fff",background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono, monospace"}}/>
                      <button onClick={()=>setExConfig(p=>({...p,[exKey]:{...p[exKey],weight:(p[exKey]?.weight||curW)+(settings.weightIncrement||1)}}))} style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>+</button>
                    </div>
                    <div style={{fontSize:11,color:"#777",lineHeight:1.45,marginTop:8}}>Type any number, including 5, 7.5, 12, or 15. The +/- buttons use your progression increment.</div>
                  </div>

                  {/* Logged sets today */}
                  {Array.from({length:getSetCount(ex)},(_,j)=>sessionLogs[logKey(i,j)]).some(Boolean)&&(
                    <div style={{marginTop:16}}>
                      <SLabel small>Today's sets</SLabel>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                        {Array.from({length:getSetCount(ex)},(_,j)=>{const lg=sessionLogs[logKey(i,j)];return lg?(
                          <span key={j} style={{fontSize:13,color:accent,fontWeight:500}}>S{j+1} {lg.weight > 0 ? `${lg.weight}lbs` : "bw"} × {lg.reps}</span>
                        ):null;})}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FINISH */}
      <div style={{margin:"28px 16px 0"}}>
        {isCompleted?(
          <div style={{textAlign:"center",padding:"24px 20px",background:`${accent}12`,borderRadius:15,border:`1.5px solid ${accent}55`,boxShadow:`0 0 44px ${accent}22`,animation:"completePulse 1s ease-out","--glow":`${accent}55`}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:accent,letterSpacing:".1em"}}>✓ DONE · {completed[sessionKey]}</div>
            <div style={{fontSize:14,color:"#ccc",marginTop:7,lineHeight:1.5}}>Solid work. Rest, eat, sleep. Come back strong.</div>
            {completedSession?.duration&&<div style={{fontSize:13,color:text.tertiary,marginTop:4}}>{fmtDuration(completedSession.duration)}</div>}
          </div>
        ):(
          <button onClick={finishWorkout} disabled={!allDone}
            style={{width:"100%",padding:22,borderRadius:15,fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".12em",border:allDone?"none":"1px solid #2a2a2a",background:allDone?accent:"#1a1a1a",color:allDone?"#050505":"#555",boxShadow:allDone?`0 0 56px ${accent}88`:"none",transition:"all .2s"}}>
            {allDone?"🏁 FINISH WORKOUT":`${totalSets-doneSets} SETS REMAINING`}
          </button>
        )}
      </div>

      {isCompleted && debrief && (
        <div style={{margin:"16px 16px 0",padding:"18px",background:surface.bg2,borderRadius:16}}>
          <div style={{fontSize:12,color:text.faint,fontWeight:600,marginBottom:14}}>Session debrief</div>
          {debrief.map((b,i)=>{
            const col = b.icon==="↑"?accent : b.icon==="↓"?status.warn : b.icon==="~"?status.caution : status.good;
            return (
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<debrief.length-1?10:0}}>
                <span style={{fontSize:12,color:col,fontWeight:700,minWidth:14,lineHeight:1.55}}>{b.icon}</span>
                <span style={{fontSize:13,color:"#999",lineHeight:1.55}}>{b.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <ThisWeek completed={completed} setActiveTab={setActiveTab}/>
      <WeeklyMusclePlan completed={completed} accent={accent}/>

      {history.length>0&&(
        <div style={{padding:"0 16px"}}>
          <div style={{fontSize:13,color:"#999",fontWeight:600,marginBottom:12}}>Recent</div>
          {history.slice(0,4).map((h,i)=>(
            <div key={i} style={{padding:"13px 0",borderBottom:"1px solid #161616"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:12,padding:"4px 10px",borderRadius:6,background:WORKOUTS[h.workout]?.color+"22",color:WORKOUTS[h.workout]?.color,letterSpacing:".06em",fontWeight:500}}>{h.workout}</span>
                  <span style={{fontSize:15,color:"#e0e0e0"}}>{h.day}</span>
                  {h.duration&&<span style={{fontSize:12,color:text.tertiary}}>{fmtDuration(h.duration)}</span>}
                </div>
                <span style={{fontSize:13,color:"#aaa"}}>{h.date}</span>
              </div>
              {h.note&&<div style={{fontSize:12,color:"#777",lineHeight:1.4,marginTop:6}}>Note: {h.note}</div>}
            </div>
          ))}
          {history.length>4&&<button onClick={()=>setActiveView("calendar")} style={{background:"none",border:"1px solid #2c2c2c",borderRadius:9,color:text.secondary,padding:"12px 18px",fontSize:13,letterSpacing:".04em",marginTop:14}}>View all → Calendar</button>}
        </div>
      )}
      <div style={{height:32}}/>

      {/* OVERLAYS */}
      {loggerState&&<SetLogger exerciseName={workoutPlan.exercises[loggerState.exIdx].name} setNum={loggerState.setIdx+1} defaultWeight={loggerState.weight} defaultReps={loggerState.reps} accent={accent} editing={loggerState.editing} increment={settings.weightIncrement || 1} onSave={saveLog} onSkip={skipLog}/>}
      {undoSet&&(
        <div style={{position:"fixed",left:16,right:16,bottom:restState&&!restState.done&&!loggerState&&!focusMode?"calc(166px + env(safe-area-inset-bottom))":"calc(82px + env(safe-area-inset-bottom))",zIndex:260,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:surface.bg1,border:`1.5px solid ${accent}66`,borderRadius:12,padding:"13px 14px",boxShadow:`0 0 28px ${accent}33`,pointerEvents:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:accent,fontWeight:600}}>Set Logged</div>
                <div style={{fontSize:13,color:"#ddd",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{undoSet.label}</div>
              </div>
              <button onClick={undoLastSet} style={{background:"transparent",border:`1px solid ${accent}77`,color:accent,borderRadius:8,padding:"9px 12px",fontSize:12,letterSpacing:".1em"}}>UNDO</button>
              <button onClick={()=>setUndoSet(null)} style={{background:"transparent",border:"none",color:text.muted,fontSize:18,padding:"4px 2px"}}>×</button>
            </div>
            <SetFeelingButtons onPick={saveSetFeedback}/>
          </div>
        </div>
      )}
      {focusMode&&(
        <FocusWorkoutMode
          workout={workoutPlan} accent={accent} activeTab={activeTab}
          doneSets={doneSets} totalSets={totalSets} setDone={setDone}
          sessionLogs={sessionLogs} logKey={logKey}
          getTargetReps={getTargetReps} getSetCount={getSetCount} getWeight={getWeight}
          getScience={getScience}
          toggleSet={toggleSet} onExit={()=>setFocusMode(false)}
          onFinish={finishWorkout} allDone={allDone} isCompleted={isCompleted}
          substitutions={coachPlan.substitutions || []}
          onApplySubstitution={useSubstitution}
          onRemoveSubstitution={removeSubstitution}
          getPreviousPerformance={getPreviousPerformance}
          beginnerFormMode={settings.beginnerFormMode === true}
          estimatedRemaining={estimatedRemaining}
          playSound={playSound}
        />
      )}
      {workoutSummary&&<WorkoutSummary summary={workoutSummary} accent={accent} onClose={()=>{setWorkoutSummary(null);setShowFeedback(true);}}/>}
      {restState?.done&&focusMode&&<RestReady label={restState.label} accent={restState.accent} onNext={()=>setRestState(null)}/>}
      {restState&&!restState.done&&!loggerState&&<RestTimer fullscreen={focusMode&&settings.fullscreenRest!==false} seconds={effectiveRest} label={restState.label} accent={restState.accent}
        onSkip={()=>{
          logCoachEvent({kind:"rest",action:"skip",restId:restState.restId,plannedSeconds:restState.plannedSeconds||effectiveRest,elapsedSeconds:Math.round((Date.now()-(restState.startedAt||Date.now()))/1000)});
          setRestState(null);
        }}
        onComplete={()=>{
          logCoachEvent({kind:"rest",action:"complete",restId:restState.restId,plannedSeconds:restState.plannedSeconds||effectiveRest,elapsedSeconds:restState.plannedSeconds||effectiveRest});
          playSound("restEnd");vibrate([200,60,200]);focusMode?setRestState(p=>p?{...p,done:true}:null):setRestState(null);
        }}/>}
      {showFeedback&&<PostWorkoutFeedback exercises={workoutPlan.exercises} sessionLogs={sessionLogs} getLogKey={logKey} exConfig={exConfig} history={history} onComplete={handleFeedback} accent={accent}/>}
      {coachAlerts.length > 0 && (
        <div style={{position:"fixed",bottom:"calc(88px + env(safe-area-inset-bottom))",left:16,right:16,zIndex:270,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:"#0a0a0a",border:`1px solid ${accent}55`,borderRadius:12,padding:"11px 14px",boxShadow:`0 0 24px ${accent}22`,animation:"slideDown .2s ease-out"}}>
            <div style={{fontSize:10,color:accent,fontWeight:600,marginBottom:4}}>Coach</div>
            <div style={{fontSize:13,color:"#ddd",lineHeight:1.45}}>{coachAlerts[coachAlerts.length-1].msg}</div>
          </div>
        </div>
      )}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <Confetti active={confetti} accent={accent} onDone={()=>setConfetti(false)}/>
      <CoachFab onClick={()=>setCoachOpen(true)} accent={accent}/>
      <CoachDrawer open={coachOpen} onClose={()=>setCoachOpen(false)} suggestions={suggestions} memory={coachMemory} plan={coachPlan} accent={accent}
        exercises={workout.exercises} history={history} checkIns={checkIns} exConfig={exConfig}
        userProfile={userProfile} goals={goals} bodyMetrics={bodyMetrics}/>
    </div>
  );
}

function StatCard({label,value,accent}){return(<div style={{flex:1,padding:"16px",background:surface.bg3,borderRadius:14}}><div style={{fontSize:11,color:text.faint,letterSpacing:".02em",fontWeight:600}}>{label}</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:accent||"#fafafa",marginTop:4,letterSpacing:".04em"}}>{value}</div></div>);}
function SLabel({children,small}){return(<div style={{fontSize:small?11:12,color:text.muted,letterSpacing:".02em",fontWeight:600,marginBottom:small?6:10}}>{children}</div>);}

function moveExerciseOrder(order, exercises, index, delta, keyFn) {
  const keys = order.length ? [...order] : exercises.map(keyFn);
  const target = index + delta;
  if (target < 0 || target >= exercises.length) return keys;
  const currentKey = keyFn(exercises[index]);
  const targetKey = keyFn(exercises[target]);
  const currentIdx = keys.indexOf(currentKey);
  const targetIdx = keys.indexOf(targetKey);
  if (currentIdx < 0 || targetIdx < 0) return exercises.map(keyFn);
  [keys[currentIdx], keys[targetIdx]] = [keys[targetIdx], keys[currentIdx]];
  return keys;
}

import { useState, useEffect } from "react";
import {
  WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, DEFAULT_WEIGHTS,
  todayName, dateStr, calcDynamicTarget, assessmentTarget,
  getExerciseHistory, XP_VALUES, getLevel
} from "../data.js";
import { useSessionTimer, fmtDuration } from "../hooks.js";
import { ExerciseAnimation, RestTimer, Toast, MiniGraph } from "../components/shared.jsx";
import MuscleDiagram from "../components/MuscleDiagram.jsx";
import { completionKey, defaultWorkoutDay, scheduledDate, logKey as makeLogKey } from "../session.js";
import { buildCoachMemory, buildCoachPlan, coachSetCount, coachTargetReps, DEFAULT_READINESS, evaluateProgression, readinessLabel, sciencePrescription, summarizeWorkout } from "../coach.js";
import { Confetti, XpFloat } from "./workout/Effects.jsx";

// ── INITIAL ASSESSMENT FLOW ───────────────────────────────────────────────────
const ALL_EXERCISES = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];

function AssessmentFlow({ onComplete, accent, theme="dark" }) {
  const [step, setStep] = useState(-1);
  const [results, setResults] = useState({});
  const [count, setCount] = useState(10);

  const total = ALL_EXERCISES.length;
  const light = theme === "pop_light";
  const ui = {
    page: light ? "linear-gradient(180deg,#f8fffb 0%,#eef7ff 58%,#ffffff 100%)" : "#050505",
    card: light ? "rgba(255,255,255,.88)" : "#0d0d0d",
    control: light ? "#f3f8fd" : "#141414",
    border: light ? "rgba(103,122,150,.32)" : "#1c1c1c",
    text: light ? "#172033" : "#f0f0f0",
    title: light ? "#123047" : "#fafafa",
    soft: light ? "#435166" : "#ccc",
    muted: light ? "#6b788c" : "#888",
    rail: light ? "#d8e4ef" : "#1a1a1a",
    shadow: light ? `0 14px 34px ${accent}16` : "none",
  };

  // ── INTRO ──
  if (step === -1) return (
    <div style={{minHeight:"100vh",overflowY:"auto",padding:"40px 20px 40px",background:ui.page,color:ui.text}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(44px, 14vw, 54px)",color:accent,letterSpacing:".04em",lineHeight:.9,marginBottom:20,filter:`drop-shadow(0 0 20px ${accent}55)`}}>
        STRENGTH<br/>ASSESSMENT
      </div>
      <div style={{fontSize:16,color:ui.soft,lineHeight:1.65,marginBottom:28}}>
        Before your first workout, set a safe starting point. Stop any test if form breaks or something hurts.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:36}}>
        {[
          {n:"01", t:"Do each exercise", d:"As many clean reps as you can. Stop before ugly reps."},
          {n:"02", t:"Log your count",   d:"Tap + until you hit your number, or skip a movement."},
          {n:"03", t:"We do the math",   d:"Targets start conservative and adapt as you train."},
        ].map(s=>(
          <div key={s.n} style={{display:"flex",gap:14,padding:"16px",background:ui.card,borderRadius:13,border:`1px solid ${ui.border}`,alignItems:"flex-start",boxShadow:ui.shadow}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:accent,opacity:.6,flexShrink:0,lineHeight:1,marginTop:2}}>{s.n}</div>
            <div>
              <div style={{fontSize:15,color:ui.text,fontWeight:500,marginBottom:3}}>{s.t}</div>
              <div style={{fontSize:13,color:ui.muted,lineHeight:1.55}}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:ui.muted,marginBottom:20,textAlign:"center"}}>Takes about 5-10 minutes · done only once</div>
        <button onClick={()=>{setStep(0);setCount(10);}}
        style={{width:"100%",padding:"22px",background:accent,border:"none",borderRadius:14,fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#050505",letterSpacing:".1em",boxShadow:`0 0 50px ${accent}66`}}>
        BEGIN ASSESSMENT
      </button>
      <button onClick={()=>onComplete(null)}
        style={{width:"100%",marginTop:12,padding:"16px",background:light ? "rgba(255,255,255,.58)" : "transparent",border:`1px solid ${light ? "rgba(103,122,150,.32)" : "#2a2a2a"}`,borderRadius:12,fontSize:13,color:ui.soft,letterSpacing:".08em"}}>
        USE DEFAULTS FOR NOW
      </button>
    </div>
  );

  // ── SUMMARY ──
  if (step >= total) {
    const targets = Object.entries(results).map(([name, max]) => ({ name, max, target: assessmentTarget(max) }));
    return (
      <div style={{minHeight:"100vh",overflowY:"auto",padding:"44px 24px 40px",background:ui.page,color:ui.text}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:"#4ade80",letterSpacing:".06em",lineHeight:.9,marginBottom:12}}>
          ASSESSMENT<br/>COMPLETE ✓
        </div>
        <div style={{fontSize:14,color:ui.soft,marginBottom:24,lineHeight:1.55}}>Your personalized starting targets. They'll adjust each week based on how each session feels.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
          {targets.map(t=>(
            <div key={t.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:ui.card,borderRadius:11,border:`1px solid ${ui.border}`,boxShadow:ui.shadow}}>
              <div>
                <div style={{fontSize:15,color:ui.text,fontWeight:500}}>{t.name}</div>
                <div style={{fontSize:12,color:ui.muted,marginTop:2}}>Max: {t.max} reps</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#4ade80",letterSpacing:".04em"}}>×{t.target}</div>
                <div style={{fontSize:11,color:ui.muted}}>starting target</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={()=>onComplete(results)}
          style={{width:"100%",padding:"22px",background:"#4ade80",border:"none",borderRadius:14,fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#050505",letterSpacing:".1em",boxShadow:"0 0 50px #4ade8066"}}>
          START TRAINING →
        </button>
      </div>
    );
  }

  // ── PER-EXERCISE ──
  const ex = ALL_EXERCISES[step];
  const exColor = WORKOUTS.A.exercises.some(e=>e.name===ex.name) ? WORKOUTS.A.color : WORKOUTS.B.color;

  return (
    <div style={{minHeight:"100vh",overflowY:"auto",padding:"32px 20px 40px",background:ui.page,color:ui.text}}>
      {/* Progress */}
      <div style={{marginBottom:22}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:ui.muted,marginBottom:7,letterSpacing:".1em",textTransform:"uppercase"}}>
          <span>Exercise {step+1} of {total}</span>
          <span style={{color:exColor}}>{ex.name}</span>
        </div>
        <div style={{height:5,background:ui.rail,borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(step/total)*100}%`,background:exColor,transition:"width .4s",boxShadow:`0 0 8px ${exColor}`}}/>
        </div>
      </div>

      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:ui.title,letterSpacing:".06em",lineHeight:.95,marginBottom:5}}>{ex.name}</div>
      <div style={{fontSize:14,color:ui.muted,marginBottom:16,lineHeight:1.45}}>→ {ex.tip}</div>

      {/* Animation */}
      <div style={{marginBottom:16}}>
        <ExerciseAnimation folder={ex.folder} accent={exColor}/>
      </div>

      {/* Instruction */}
      <div style={{padding:"14px 18px",background:ui.card,borderRadius:12,border:`1.5px solid ${exColor}44`,marginBottom:24,boxShadow:ui.shadow}}>
        <div style={{fontSize:14,color:ui.soft,lineHeight:1.55}}>
          Do as many clean <strong style={{color:exColor}}>{ex.name}</strong> reps as you can. Stop if form breaks, if pain appears, or if the movement feels unsafe today.
        </div>
      </div>

      {/* Counter */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:12,color:ui.soft,letterSpacing:".14em",textTransform:"uppercase",textAlign:"center",marginBottom:12}}>How many did you do?</div>
        <div style={{display:"flex",alignItems:"center",background:ui.control,borderRadius:16,border:`2px solid ${exColor}55`,overflow:"hidden",boxShadow:ui.shadow}}>
          <button onClick={()=>setCount(c=>Math.max(1,c-1))}
            style={{width:72,height:76,background:"transparent",border:"none",color:ui.soft,fontSize:34,fontWeight:300}}>−</button>
          <div style={{flex:1,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:56,color:ui.title,letterSpacing:".04em"}}>{count}</div>
          <button onClick={()=>setCount(c=>c+1)}
            style={{width:72,height:76,background:"transparent",border:"none",color:ui.soft,fontSize:34,fontWeight:300}}>+</button>
        </div>
        <div style={{fontSize:13,color:ui.muted,letterSpacing:".06em",textAlign:"center",marginTop:10}}>
          Starting target → <strong style={{color:exColor}}>×{assessmentTarget(count)}</strong> per set
        </div>
      </div>

      <button onClick={()=>{
        setResults(r=>({...r,[ex.name]:count}));
        setCount(10);
        setStep(s=>s+1);
      }}
        style={{width:"100%",padding:"20px",background:exColor,border:"none",borderRadius:14,fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#050505",letterSpacing:".1em",marginTop:16,boxShadow:`0 0 40px ${exColor}66`}}>
        {step < total-1 ? "NEXT EXERCISE →" : "SEE MY RESULTS →"}
      </button>
      <button onClick={()=>{
        setResults(r=>{const n={...r};delete n[ex.name];return n;});
        setCount(10);
        setStep(s=>s+1);
      }}
        style={{width:"100%",padding:"14px",background:light ? "rgba(255,255,255,.58)" : "transparent",border:`1px solid ${light ? "rgba(103,122,150,.32)" : "#2a2a2a"}`,borderRadius:12,fontSize:13,color:ui.muted,letterSpacing:".08em",marginTop:10}}>
        SKIP THIS EXERCISE
      </button>
    </div>
  );
}

// ── POST-WORKOUT FEEDBACK ─────────────────────────────────────────────────────
const FEEDBACK_OPTIONS = [
  { key:"easy",     label:"Easy",      emoji:"😴", desc:"+2 reps next session" },
  { key:"good",     label:"Good",      emoji:"👍", desc:"+1 rep next session"  },
  { key:"hard",     label:"Hard",      emoji:"💪", desc:"Keep same target"     },
  { key:"pain",     label:"Pain",      emoji:"🛑", desc:"Lower target + bias swaps"  },
];

const SET_FEELINGS = [
  { key:"easy", label:"EASY" },
  { key:"good", label:"GOOD" },
  { key:"hard", label:"HARD" },
  { key:"pain", label:"PAIN" },
];

function PostWorkoutFeedback({ exercises, sessionLogs, getLogKey, exConfig, history, onComplete, accent }) {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({});

  const submitFeedback = (key) => {
    const newFb = { ...feedback, [exercises[step].name]: key };
    setFeedback(newFb);
    if (step >= exercises.length - 1) {
      onComplete(newFb);
    } else {
      setStep(s=>s+1);
    }
  };

  const ex = exercises[step];
  const logs = Array.from({length:ex.sets},(_,j)=>sessionLogs[getLogKey(step,j)]).filter(Boolean);
  const totalReps = logs.reduce((s,l)=>s+(l.reps||0),0);
  const exColor = WORKOUTS.A.exercises.some(e=>e.name===ex.name) ? WORKOUTS.A.color : WORKOUTS.B.color;
  const histData = getExerciseHistory(ex.configName || ex.originalName || ex.name, history);

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"flex-end"}}>
      <div className="mobile-shell" style={{background:"#0a0a0a",borderTop:`2px solid ${accent}`,borderRadius:"18px 18px 0 0",padding:"24px 20px 36px",animation:"slideUp .3s ease-out"}}>
        {/* Progress dots */}
        <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:20}}>
          {exercises.map((_,i)=>(
            <div key={i} style={{width:i===step?20:7,height:7,borderRadius:4,background:i<step?"#4ade8088":i===step?accent:"#222",transition:"all .25s"}}/>
          ))}
        </div>

        <div style={{fontSize:12,color:"#888",letterSpacing:".14em",textTransform:"uppercase",marginBottom:5}}>How did it feel?</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#fafafa",letterSpacing:".06em",marginBottom:4}}>{ex.name}</div>

        {logs.length > 0 && (
          <div style={{fontSize:14,color:exColor,marginBottom:16}}>
            {ex.sets} sets · <strong>{totalReps} total reps today</strong>
            {logs[0]?.weight && <span style={{color:"#888"}}> @ {logs[0].weight}lbs</span>}
          </div>
        )}

        {/* Mini graph for context */}
        {histData.length>=2&&(
          <div style={{padding:"12px 14px",background:"#111",borderRadius:10,border:`1px solid ${exColor}22`,marginBottom:18}}>
            <div style={{fontSize:11,color:"#888",letterSpacing:".12em",marginBottom:6}}>YOUR PROGRESS</div>
            <MiniGraph data={histData} color={exColor} height={72}/>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {FEEDBACK_OPTIONS.map(opt=>(
            <button key={opt.key} onClick={()=>submitFeedback(opt.key)}
              style={{padding:"16px 12px",background:"#141414",border:"1.5px solid #2a2a2a",borderRadius:13,cursor:"pointer",textAlign:"center",transition:"all .18s"}}
              onMouseDown={e=>{ e.currentTarget.style.background="#1e1e1e"; e.currentTarget.style.borderColor=accent; }}
              onMouseUp={e=>{ e.currentTarget.style.background="#141414"; e.currentTarget.style.borderColor="#2a2a2a"; }}
            >
              <div style={{fontSize:30,marginBottom:6}}>{opt.emoji}</div>
              <div style={{fontSize:14,color:"#f0f0f0",fontWeight:500,marginBottom:3}}>{opt.label}</div>
              <div style={{fontSize:11,color:"#888"}}>{opt.desc}</div>
            </button>
          ))}
        </div>

        <button onClick={()=>submitFeedback("good")}
          style={{width:"100%",marginTop:14,padding:"12px",background:"transparent",border:"none",color:"#555",fontSize:13,letterSpacing:".06em"}}>
          skip feedback for this exercise
        </button>
      </div>
    </div>
  );
}

// ── COACH CARD ────────────────────────────────────────────────────────────────
function buildSuggestions({ history, progression, settings, exConfig, workoutKey }) {
  const workout = WORKOUTS[workoutKey];
  const suggs = [];
  const today = todayName();
  const sorted = [...history].sort((a,b)=>b.timestamp-a.timestamp);
  let streak=0;
  if(sorted.length>0){streak=1;for(let i=1;i<sorted.length;i++){if((sorted[i-1].timestamp-sorted[i].timestamp)/86400000<=4.5)streak++;else break;}}
  if(streak>=3&&streak<7) suggs.push({icon:"🔥",cat:"Streak",msg:`${streak} sessions in a row. You're building a real habit.`});
  if(streak>=7) suggs.push({icon:"⚡",cat:"Streak",msg:`${streak}-session streak. Your body is different than when you started.`});

  workout.exercises.forEach(ex=>{
    const cfg=exConfig[ex.name];
    if(cfg?.pendingAdj>0) suggs.push({icon:"↗️",cat:"Progression",msg:`${ex.name}: +${cfg.pendingAdj} rep${cfg.pendingAdj>1?"s":""} unlocked based on last session. New target: ×${cfg.targetReps}.`});
    if(cfg?.pendingAdj<0) suggs.push({icon:"🎯",cat:"Adjustment",msg:`${ex.name}: target reduced to ×${cfg.targetReps}. Dialing in the right challenge.`});
  });

  const FORM={A:[
    {icon:"🦵",cat:"Form",msg:"Goblet Squat: drive elbows between knees at the bottom. Creates a natural brace."},
    {icon:"💪",cat:"Form",msg:"Floor Press: 45° elbows, pause at chest. Control over momentum."},
    {icon:"🔙",cat:"Form",msg:"Row: elbow to back pocket — not hand to hip. Your lats do the work."},
    {icon:"🙌",cat:"Form",msg:"Arnold Press: the rotation IS the point. Don't skip it."},
    {icon:"💪",cat:"Form",msg:"Hammer Curl: 3s down on every rep. The eccentric is where muscle grows."},
  ],B:[
    {icon:"🍑",cat:"Form",msg:"RDL: push hips BACK before bending. Feel the hamstring stretch first."},
    {icon:"⚡",cat:"Form",msg:"Kickback: lock upper arm parallel. If it drops, weight is too heavy."},
    {icon:"🦵",cat:"Form",msg:"Lunge: step back far enough that front shin stays vertical."},
    {icon:"🔙",cat:"Form",msg:"Rear Delt Row: lead with pinky, elbows wide. Rear delts, not biceps."},
    {icon:"🦵",cat:"Form",msg:"Calf Raise: 2s pause at top. Rushing defeats the purpose."},
  ]};
  const tips=FORM[workoutKey]||[];
  const pick=tips[(new Date().getDate())%tips.length];
  if(pick) suggs.push(pick);
  if(!DAYS.includes(today)) suggs.push({icon:"🛌",cat:"Recovery",msg:"Rest day. Muscle grows during recovery. Protein + sleep > extra sets."});
  if(history.length===0) suggs.push({icon:"🌱",cat:"Welcome",msg:"Form now = gains forever. Feel the muscle work, don't just move weight."});
  return suggs.filter(Boolean);
}

function CoachDrawer({ open, onClose, suggestions, memory, plan, accent }) {
  const [idx, setIdx] = useState(0);
  if (!open) return null;
  const s = suggestions[idx] || suggestions[0];
  const behavior = memory?.behavior || {};
  return (
    <div style={{position:"fixed",inset:0,zIndex:240,pointerEvents:"none"}}>
      <button aria-label="Close coach" onClick={onClose} style={{position:"absolute",inset:0,border:"none",background:"rgba(0,0,0,.32)",pointerEvents:"auto"}} />
      <div className="mobile-shell" style={{position:"absolute",left:0,right:0,bottom:"calc(82px + env(safe-area-inset-bottom))",padding:"0 14px",pointerEvents:"auto"}}>
        <div style={{background:"#ffffff",color:"#172033",border:`1.5px solid ${accent}66`,borderRadius:18,boxShadow:"0 22px 70px rgba(20,40,80,.28)",overflow:"hidden",animation:"slideUp .24s ease-out"}}>
          <div style={{padding:"16px 17px",background:`linear-gradient(135deg,${accent}24,#ffffff)`,borderBottom:"1px solid rgba(120,135,160,.22)",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:13,background:accent,color:"#050505",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 10px 26px ${accent}55`}}>AI</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:"#25536f",letterSpacing:".16em",textTransform:"uppercase",fontWeight:700}}>Coach</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,letterSpacing:".05em",lineHeight:1,color:"#123047"}}>{plan?.headline || "Training assistant"}</div>
            </div>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:10,border:"1px solid rgba(112,132,160,.28)",background:"rgba(255,255,255,.68)",color:"#435166",fontSize:18}}>×</button>
          </div>
          <div style={{padding:"15px 17px",display:"grid",gap:12,maxHeight:"58vh",overflowY:"auto"}}>
            {s&&(
              <div style={{padding:"13px 14px",background:"#f3f8fd",border:"1px solid rgba(112,132,160,.24)",borderRadius:13}}>
                <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:700,marginBottom:7}}>{s.cat}</div>
                <div style={{fontSize:14,lineHeight:1.55,color:"#263348"}}>{s.icon} {s.msg}</div>
                {suggestions.length>1&&(
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <button onClick={()=>setIdx(i=>(i+suggestions.length-1)%suggestions.length)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid #d9e4ef",background:"#fff",color:"#435166"}}>BACK</button>
                    <button onClick={()=>setIdx(i=>(i+1)%suggestions.length)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:accent,color:"#050505",fontWeight:700}}>NEXT</button>
                  </div>
                )}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              <MiniStat label="Memory" value={`${memory?.readinessCount || 0}+${memory?.setFeedbackCount || 0}`} />
              <MiniStat label="Rests Skipped" value={behavior.restSkips || 0} />
              <MiniStat label="Avg Rest" value={behavior.avgRestSeconds ? `${behavior.avgRestSeconds}s` : "-"} />
            </div>
            <div style={{padding:"13px 14px",background:"#fff",border:"1px solid rgba(112,132,160,.24)",borderRadius:13}}>
              <div style={{fontSize:11,color:"#25536f",letterSpacing:".14em",textTransform:"uppercase",fontWeight:700,marginBottom:7}}>What I remember</div>
              <div style={{fontSize:13,lineHeight:1.55,color:"#435166"}}>{memory?.summary || "I am still collecting enough sessions to spot patterns."}</div>
              {behavior.notes?.length>0&&<div style={{fontSize:13,lineHeight:1.55,color:"#435166",marginTop:8}}>{behavior.notes[0]}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{padding:"11px 8px",background:"#f3f8fd",border:"1px solid rgba(112,132,160,.22)",borderRadius:11,textAlign:"center"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#123047",letterSpacing:".05em"}}>{value}</div>
      <div style={{fontSize:10,color:"#6b788c",letterSpacing:".1em",textTransform:"uppercase"}}>{label}</div>
    </div>
  );
}

function CoachFab({ onClick, accent, count }) {
  return (
    <button onClick={onClick} style={{position:"fixed",right:16,bottom:"calc(98px + env(safe-area-inset-bottom))",zIndex:130,width:62,height:62,borderRadius:19,border:`1.5px solid ${accent}88`,background:accent,color:"#050505",boxShadow:`0 16px 42px ${accent}66`,fontWeight:900,letterSpacing:".04em"}}>
      AI
      {count>0&&<span style={{position:"absolute",right:-4,top:-5,minWidth:20,height:20,borderRadius:10,background:"#123047",color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff"}}>{Math.min(count,9)}</span>}
    </button>
  );
}

function CoachCard({ suggestions, accent, onOpen }) {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  if (!suggestions.length) return null;
  const s = suggestions[idx];
  const cc = {Streak:"#fb923c",Form:"#60a5fa",Progress:accent,Progression:accent,Adjustment:"#fbbf24",Recovery:"#a78bfa",Welcome:accent}[s.cat]||accent;
  return (
    <div style={{margin:"0 16px 18px",padding:"13px 14px",background:"#0e0e0e",border:`1.5px solid ${cc}44`,borderRadius:14,boxShadow:`0 0 28px ${cc}15`}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <span style={{fontSize:28,flexShrink:0,marginTop:1}}>{s.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:cc,letterSpacing:".14em",textTransform:"uppercase",marginBottom:5,fontWeight:500}}>{s.cat}</div>
          <div key={key} style={{fontSize:15,color:"#eee",lineHeight:1.55,animation:"coachSlide .3s ease-out"}}>{s.msg}</div>
        </div>
        <button onClick={onOpen}
          style={{background:"transparent",border:`1px solid ${cc}44`,color:cc,borderRadius:8,padding:"8px 10px",fontSize:12,flexShrink:0,alignSelf:"center",letterSpacing:".08em"}}>OPEN</button>
      </div>
      {suggestions.length>1&&(
        <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:12}}>
          {suggestions.map((_,i)=><div key={i} onClick={()=>{setIdx(i);setKey(k=>k+1);}}
            style={{width:i===idx?18:6,height:5,borderRadius:3,background:i===idx?cc:"#333",transition:"all .25s",cursor:"pointer"}}/>)}
        </div>
      )}
    </div>
  );
}

function ReadinessCheckIn({ value, onSave, accent }) {
  const [draft, setDraft] = useState(value || DEFAULT_READINESS);
  const groups = [
    { key:"energy", label:"Energy", options:[["low","Low"],["okay","Okay"],["high","High"]] },
    { key:"soreness", label:"Body", options:[["none","Fresh"],["mild","Mild"],["sore","Sore"]] },
    { key:"time", label:"Time", options:[["short","Short"],["normal","Normal"],["full","Full"]] },
  ];

  return (
    <div style={{margin:"0 16px 18px",padding:"16px 18px",background:"#0d0d0d",border:`1.5px solid ${accent}44`,borderRadius:14,boxShadow:`0 0 28px ${accent}12`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
        <div>
          <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:500}}>Coach Check-In</div>
          <div style={{fontSize:14,color:"#ddd",marginTop:4,lineHeight:1.45}}>Tune today's plan before the first set.</div>
        </div>
        <button onClick={()=>onSave(draft)}
          style={{background:accent,border:"none",borderRadius:9,color:"#050505",padding:"10px 13px",fontSize:12,fontWeight:700,letterSpacing:".08em",flexShrink:0}}>
          START
        </button>
      </div>
      <div style={{display:"grid",gap:10}}>
        {groups.map(group=>(
          <div key={group.key}>
            <div style={{fontSize:10,color:"#777",letterSpacing:".14em",textTransform:"uppercase",marginBottom:6}}>{group.label}</div>
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
          <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:500,marginBottom:5}}>Today's Coach</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:27,color:"#f5f5f5",letterSpacing:".06em",lineHeight:1}}>{plan.headline}</div>
          <div style={{fontSize:12,color:"#888",marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{plan.focus}</div>
        </div>
        <div style={{fontSize:18,color:accent,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}>⌄</div>
      </button>
      {open&&(
        <div style={{animation:"slideDown .2s ease-out"}}>
      <div style={{fontSize:13,color:"#888",marginTop:12}}>{readiness ? readinessLabel(readiness) : "Default readiness"}</div>
      <div style={{fontSize:14,color:"#ddd",lineHeight:1.55,marginTop:8}}>{plan.focus}</div>
      {plan.science&&(
        <div style={{marginTop:12,padding:"10px 11px",background:"#101010",borderRadius:8,border:`1px solid ${accent}33`}}>
          <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",marginBottom:5}}>Science Coach</div>
          <div style={{fontSize:12,color:"#ddd",lineHeight:1.5}}>
            {plan.science.label}: {plan.science.note}
            {plan.science.est1RM&&<span style={{color:"#888"}}> Est. 1RM {plan.science.est1RM}lbs.</span>}
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
            <div key={i} style={{fontSize:12,color:"#bbb",padding:"9px 11px",background:"#080808",borderRadius:8,border:"1px solid #202020"}}>{item}</div>
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
}) {
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
  const repText = science.enabled && science.repRange ? `${science.repRange.min}-${science.repRange.max}` : `x${target}`;
  const weight = getWeight(next.ex);
  const plannedSets = getSetCount(next.ex);
  const currentDone = Array.from({length:plannedSets},(_,j)=>setDone(next.exIdx,j)).filter(Boolean).length;

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:"#050505",overflowY:"auto",padding:"calc(10px + env(safe-area-inset-top)) 16px 18px"}}>
      <div className="mobile-shell">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button onClick={onExit} style={{background:"transparent",border:"1px solid #2c2c2c",borderRadius:9,color:"#aaa",padding:"8px 12px",fontSize:12,letterSpacing:".08em"}}>PAUSE</button>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"#777",letterSpacing:".14em",textTransform:"uppercase"}}>{activeTab}</div>
            <div style={{fontSize:13,color:accent}}>{doneSets}/{totalSets} sets</div>
          </div>
        </div>

        <div style={{fontSize:11,color:accent,letterSpacing:".16em",textTransform:"uppercase",marginBottom:6}}>Focus Mode</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,color:"#f5f5f5",letterSpacing:".06em",lineHeight:.92,marginBottom:5}}>{next.ex.name}</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.35,marginBottom:8}}>
          Set {Math.min(currentDone+1,plannedSets)} of {plannedSets} · {weight}lbs · target {repText}{next.ex.repSuffix||""}
        </div>

        <ExerciseAnimation folder={next.ex.folder} video={next.ex.video} accent={accent} compact bare/>

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

        <div style={{marginTop:10,padding:"10px 12px",background:"#0d0d0d",border:"1px solid #202020",borderRadius:11}}>
          <div style={{fontSize:10,color:"#777",letterSpacing:".14em",textTransform:"uppercase",marginBottom:4}}>Cue</div>
          <div style={{fontSize:13,color:"#ddd",lineHeight:1.38}}>{next.ex.tip}</div>
          {science.enabled&&science.tempo&&(
            <div style={{fontSize:12,color:accent,lineHeight:1.4,marginTop:7}}>
              Tempo {science.tempo.code}: {science.tempo.label}
            </div>
          )}
        </div>

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
        <div style={{fontSize:12,color:accent,letterSpacing:".16em",textTransform:"uppercase",marginBottom:14}}>Rest Complete</div>
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
        <div style={{fontSize:12,color:accent,letterSpacing:".16em",textTransform:"uppercase",marginBottom:10}}>Workout Complete</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#f5f5f5",letterSpacing:".06em",lineHeight:.92,marginBottom:18}}>SESSION<br/>SUMMARY</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <SummaryStat label="Sets" value={summary.sets} accent={accent}/>
          <SummaryStat label="Reps" value={summary.reps} accent={accent}/>
          <SummaryStat label="Volume" value={`${Math.round(summary.volume).toLocaleString()}`} sub="lbs" accent={accent}/>
          <SummaryStat label="Time" value={fmtDuration(summary.duration || 0)} accent={accent}/>
        </div>
        {summary.prs?.length>0&&(
          <div style={{padding:16,background:"#101008",border:"1px solid #fbbf2455",borderRadius:12,marginBottom:12}}>
            <div style={{fontSize:11,color:"#fbbf24",letterSpacing:".14em",textTransform:"uppercase",marginBottom:8}}>PRs</div>
            <div style={{fontSize:14,color:"#eee",lineHeight:1.5}}>{summary.prs.map(p=>`${p.name}: ${p.val}lbs`).join(" · ")}</div>
          </div>
        )}
        <div style={{padding:16,background:"#0d0d0d",border:"1px solid #202020",borderRadius:12,marginBottom:14}}>
          <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",marginBottom:8}}>Coach Note</div>
          <div style={{fontSize:15,color:"#ddd",lineHeight:1.55}}>{summary.coachNote}</div>
          {summary.nextWorkout&&<div style={{fontSize:13,color:"#888",marginTop:10}}>Next up: Workout {summary.nextWorkout}</div>}
        </div>
        <button onClick={onClose}
          style={{width:"100%",padding:19,background:accent,border:"none",borderRadius:14,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:".12em",boxShadow:`0 0 42px ${accent}66`}}>
          DONE
        </button>
      </div>
    </div>
  );
}

function SetFeelingButtons({ onPick }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}>
      {SET_FEELINGS.map(({ key, label })=>(
        <button key={key} onClick={()=>onPick(key)}
          style={{padding:"8px 4px",background:key==="pain"?"#2a1014":"#0c0c0c",border:`1px solid ${key==="pain"?"#fb718555":"#2a2a2a"}`,borderRadius:8,color:key==="pain"?"#fb7185":"#bbb",fontSize:10,letterSpacing:".08em"}}>
          {label}
        </button>
      ))}
    </div>
  );
}

function SummaryStat({ label, value, sub, accent }) {
  return (
    <div style={{padding:"15px 14px",background:"#0d0d0d",border:"1px solid #202020",borderRadius:12}}>
      <div style={{fontSize:10,color:"#888",letterSpacing:".14em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:accent,letterSpacing:".04em",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#777",marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ── SET LOGGER ────────────────────────────────────────────────────────────────
function SetLogger({ exerciseName, setNum, defaultWeight, defaultReps, accent, onSave, onSkip }) {
  const [weight, setWeight] = useState(defaultWeight);
  const [reps,   setReps]   = useState(defaultReps);
  return (
    <div style={{position:"fixed",bottom:82,left:0,right:0,zIndex:220,background:"#0a0a0a",borderTop:`1.5px solid ${accent}99`,padding:"14px 18px 12px",boxShadow:`0 -8px 32px ${accent}44`,animation:"slideUp .22s ease-out"}}>
      <div className="mobile-shell">
        <div style={{fontSize:12,color:accent,letterSpacing:".14em",textTransform:"uppercase",marginBottom:12,fontWeight:500}}>Log Set {setNum} · {exerciseName}</div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#888",letterSpacing:".1em",marginBottom:5}}>WEIGHT (lbs)</div>
            <div style={{display:"flex",alignItems:"center",background:"#141414",borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setWeight(w=>Math.max(w-2.5,0))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>−</button>
              <div style={{flex:1,textAlign:"center",fontSize:18,fontWeight:500,color:"#fff"}}>{weight}</div>
              <button onClick={()=>setWeight(w=>w+2.5)} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>+</button>
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#888",letterSpacing:".1em",marginBottom:5}}>REPS DONE</div>
            <div style={{display:"flex",alignItems:"center",background:"#141414",borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setReps(r=>Math.max(r-1,0))} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>−</button>
              <div style={{flex:1,textAlign:"center",fontSize:18,fontWeight:500,color:"#fff"}}>{reps}</div>
              <button onClick={()=>setReps(r=>r+1)} style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20}}>+</button>
            </div>
          </div>
          <button onClick={()=>onSave({weight,reps})}
            style={{width:54,height:46,background:accent,border:"none",borderRadius:10,color:"#0a0a0a",fontSize:13,fontWeight:700,flexShrink:0,alignSelf:"flex-end",boxShadow:`0 0 16px ${accent}66`}}>LOG</button>
        </div>
        <button onClick={onSkip} style={{background:"none",border:"none",color:"#555",fontSize:12,letterSpacing:".08em",marginTop:10,width:"100%",textAlign:"center",padding:4}}>skip logging</button>
      </div>
    </div>
  );
}

// ── THIS WEEK STRIP ───────────────────────────────────────────────────────────
function ThisWeek({ completed, setActiveTab }) {
  const today = todayName();
  return (
    <div style={{padding:"24px 16px 16px"}}>
      <div style={{fontSize:13,color:"#888",letterSpacing:".14em",textTransform:"uppercase",marginBottom:13,fontWeight:500}}>This Week</div>
      <div style={{display:"flex",gap:10}}>
        {DAYS.map(day=>{
          const wk=WORKOUTS[SCHEDULE[day]]; const isDone=!!completed[completionKey(day)],isToday=day===today;
          return(
            <button key={day} onClick={()=>setActiveTab(day)}
              style={{flex:1,padding:"16px 8px",borderRadius:13,border:"none",background:isDone?`${wk.color}25`:isToday?"#161616":"#0d0d0d",outline:isToday?`2px solid ${wk.color}99`:isDone?`1px solid ${wk.color}55`:"1px solid #1e1e1e",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:12,color:isToday?wk.color:isDone?wk.color:"#666",letterSpacing:".1em",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>{day.slice(0,3)}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:isDone?wk.color:isToday?"#fff":"#777",letterSpacing:".06em"}}>{wk.label.split(" ")[1]}</div>
              <div style={{fontSize:20,marginTop:5}}>{isDone?<span style={{color:wk.color}}>✓</span>:isToday?<span style={{color:wk.color}}>→</span>:<span style={{color:"#333"}}>·</span>}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN VIEW ─────────────────────────────────────────────────────────────────
export default function WorkoutView({
  sets, setSets, history, setHistory, completed, setCompleted,
  progression, setProgression, settings,
  exConfig, setExConfig, xp, addXp, level,
  checkIns, setCheckIns,
  playSound, vibrate, setActiveView, theme="dark",
  assessmentDone, setAssessmentDone,
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

  const wKey    = SCHEDULE[activeTab];
  const workout = WORKOUTS[wKey];
  const accent  = workout.color;
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
  const workoutPlan = { ...workout, exercises: workout.exercises.map(applySubstitution) };

  const sessionKey = completionKey(activeTab);
  const logKey  = (i,j) => makeLogKey(sessionKey,i,j);
  const setKey  = (i,j) => `${sessionKey}_${i}_${j}`;
  const setDone = (i,j) => !!sets[setKey(i,j)];
  const isCompleted = !!completed[sessionKey];

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
  }, [sessionKey]);

  const readinessEntry = (checkIns||[]).find(ci=>ci.kind==="readiness"&&ci.sessionKey===sessionKey);
  const readiness = readinessEntry?.readiness;
  const coachPlan = buildCoachPlan({workout,history,checkIns,exConfig,settings,readiness:readiness||DEFAULT_READINESS});
  const suggestions = [...coachPlan.cards, ...buildSuggestions({history,progression,settings,exConfig,workoutKey:wKey})];
  const coachMemory = buildCoachMemory({ history, checkIns, exercises:[...WORKOUTS.A.exercises,...WORKOUTS.B.exercises], exConfig });
  const exerciseKey = (exOrName) => typeof exOrName === "string" ? exOrName : (exOrName.configName || exOrName.name);
  const getBaseTargetReps = (ex) => exConfig[exerciseKey(ex)]?.targetReps ?? (ex.baseReps + (progression[exerciseKey(ex)]?.repBonus||0));
  const getScience = (ex) => sciencePrescription({ exercise:ex, history, checkIns, settings, readiness:readiness||DEFAULT_READINESS, baseTarget:getBaseTargetReps(ex) });
  const getTargetReps = (ex) => {
    const science = getScience(ex);
    return science.enabled ? science.targetReps : coachTargetReps(getBaseTargetReps(ex), readiness||DEFAULT_READINESS);
  };
  const getSetCount = (ex) => {
    const science = getScience(ex);
    return science.enabled ? science.sets : coachSetCount(ex.sets, readiness||DEFAULT_READINESS);
  };
  const getWeight     = (n)  => {
    const configured = exConfig[exerciseKey(n)]?.weight || DEFAULT_WEIGHTS[exerciseKey(n)] || settings.dumbbellWeight;
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

  const streak = (() => {
    if(!history.length) return 0;
    const s=[...history].sort((a,b)=>b.timestamp-a.timestamp);
    let r=1; for(let i=1;i<s.length;i++){if((s[i-1].timestamp-s[i].timestamp)/86400000<=4.5)r++;else break;}
    return r;
  })();

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
    const id = setTimeout(() => setUndoSet(null), 4500);
    return () => clearTimeout(id);
  }, [undoSet]);

  const spawnXp = (amount) => {
    addXp(amount);
    setXpAmount(amount);
    setXpVisible(true);
    setTimeout(()=>setXpVisible(false),900);
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

    setSets(p=>({...p,[k]:true}));
    setSessionLogs(p=>({...p,[lk]:{weight:getWeight(ex),reps:getTargetReps(ex)}}));
    if(!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    setUndoSet({exIdx:i,setIdx:j,setKey:k,logKey:lk,label:`${ex.name} set ${j+1}`});
    playSound("setComplete"); vibrate([28]);
    const bk=lk;
      setBounceSets(p=>({...p,[bk]:true}));
      setTimeout(()=>setBounceSets(p=>{const n={...p};delete n[bk];return n;}),500);
    const remaining=getSetCount(ex)-(j+1);
    const hasNextExercise=i+1<workoutPlan.exercises.length;
    const next=remaining>0?`Set ${j+2} of ${ex.name}`:hasNextExercise?`Up next: ${workoutPlan.exercises[i+1].name}`:null;
    if(next) {
      const restId = `${sessionKey}_${i}_${j}_${Date.now()}`;
      logCoachEvent({kind:"rest",action:"start",restId,exercise:ex.name,set:j+1,plannedSeconds:settings.restSeconds});
      setRestState({label:next,accent,restId,startedAt:Date.now(),plannedSeconds:settings.restSeconds});
    }
    else setRestState(null);
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
      accent:feeling==="pain"?"#fb7185":accent,
      duration:3500,
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
    setSessionLogs(p=>({...p,[lk]:{weight,reps}}));
    logCoachEvent({kind:"set_log",action:"save",exercise:workoutPlan.exercises[exIdx].name,set:setIdx+1,weight,reps});
    if(!editing&&!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    setLoggerState(null);
  };

  const skipLog = () => {
    if(!loggerState) return;
    const {exIdx,setIdx}=loggerState;
    const ex=workoutPlan.exercises[exIdx];
    const lk=logKey(exIdx,setIdx);
    setSessionLogs(p=>({...p,[lk]:{weight:getWeight(ex),reps:getTargetReps(ex)}}));
    logCoachEvent({kind:"set_log",action:"skip",exercise:ex.name,set:setIdx+1,weight:getWeight(ex),reps:getTargetReps(ex)});
    if(!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    setLoggerState(null);
  };

  const finishWorkout = () => {
    if(!allDone) return;
    const exSnap = workoutPlan.exercises.map((ex,i)=>{
      const sets=getSetCount(ex);
      const logs=Array.from({length:sets},(_,j)=>sessionLogs[logKey(i,j)]||{weight:getWeight(ex),reps:getTargetReps(ex)});
      return {name:ex.name,originalName:ex.originalName,substitutedFor:ex.substitutedFor,sets,reps:getTargetReps(ex),setLog:logs};
    });

    // Update weights / next weight suggestions
    // weight calc inline
    const newConfig={...exConfig};
    const prs=[];
    exSnap.forEach((exS,i)=>{
      const ex=workoutPlan.exercises[i];
      const key=exerciseKey(ex);
      const curW=getWeight(ex);
      const rec=evaluateProgression({setLog:exS.setLog,targetReps:getTargetReps(ex),currentWeight:curW,previous:exConfig[key],increment:settings.weightIncrement||2.5,style:settings.coachStyle||"balanced",autoDeload:settings.autoDeload!==false});
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
      readiness:readiness||DEFAULT_READINESS,
      prs,
      nextWorkout:wKey==="A"?"B":"A",
    }));
    setHistory(p=>[{day:activeTab,workout:wKey,date:dateStr(scheduledDate(activeTab)),timestamp:scheduledDate(activeTab).getTime(),duration:sessionElapsed,exercises:exSnap,readiness:readiness||DEFAULT_READINESS},...p].slice(0,120));
    setCompleted(p=>({...p,[sessionKey]:dateStr(scheduledDate(activeTab))}));
    playSound("workoutDone"); vibrate([100,60,100]);
    setConfetti(true);
    spawnXp(XP_VALUES.workout);

    if(prs.length) setTimeout(()=>{playSound("achievement");setToast({icon:"🏆",title:"PERSONAL RECORD",msg:prs.map(p=>`${p.name}: ${p.val}lbs`).join(", "),accent:"#fbbf24"});},600);
  };

  const handleFeedback = (feedbackMap) => {
    setShowFeedback(false);
    // Apply feedback as pending adjustments
    const newConfig={...exConfig};
    workoutPlan.exercises.forEach(ex=>{
      const fb=feedbackMap[ex.name];
      if(!fb) return;
      const key=exerciseKey(ex);
      const cur=newConfig[key]||{};
      const maxTest=cur.maxRepsTest;
      const newTarget=calcDynamicTarget(getTargetReps(ex),fb,maxTest);
      const adj=newTarget-getTargetReps(ex);
      newConfig[key]={...cur,targetReps:newTarget,pendingAdj:adj};
    });
    setExConfig(newConfig);
    setSessionLogs({});
    setXpAwards({});
    setFocusMode(false);
    setWorkoutSummary(null);
    setUndoSet(null);
    setRestState(null);
    setLoggerState(null);
  };

  const completeAssessment = (results) => {
    const newConfig={...exConfig};
    ALL_EXERCISES.forEach(ex=>{
      const maxReps=results?.[ex.name];
      const target=maxReps ? assessmentTarget(maxReps) : ex.baseReps;
      newConfig[ex.name]={...newConfig[ex.name],maxRepsTest:maxReps||null,targetReps:target,weight:DEFAULT_WEIGHTS[ex.name]||settings.dumbbellWeight};
    });
    setExConfig(newConfig);
    setAssessmentDone(true);
  };

  // Show assessment if not done yet and no history
  if (!assessmentDone && history.length===0) {
    return <AssessmentFlow onComplete={completeAssessment} accent={accent} theme={theme}/>;
  }

  return (
    <div>
      {xpVisible&&<XpFloat amount={xpAmount} onDone={()=>setXpVisible(false)}/>}

      {/* HEADER */}
      <div style={{padding:"34px 16px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".06em",lineHeight:.88,color:"#fafafa"}}>LIFT LOG</div>
            <div style={{fontSize:13,color:"#999",marginTop:7,letterSpacing:".1em"}}>{level.badge} {level.name.toUpperCase()} · LV.{level.idx+1}</div>
          </div>
          <div style={{textAlign:"right"}}>
            {sessionRunning?(<>
              <div style={{fontSize:11,color:"#888",letterSpacing:".12em"}}>SESSION</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:accent,marginTop:2,filter:`drop-shadow(0 0 8px ${accent}99)`}}>{fmtDuration(sessionElapsed)}</div>
            </>):streak>0?(<>
              <div style={{fontSize:11,color:"#888",letterSpacing:".1em"}}>STREAK</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#fb923c",marginTop:2,filter:"drop-shadow(0 0 8px #fb923c88)"}}>{streak} 🔥</div>
            </>):null}
          </div>
        </div>

        {/* XP bar */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:level.color,fontWeight:500}}>{level.badge} {level.name}</span>
            <span style={{fontSize:12,color:"#888"}}>{level.next?`${xp} / ${level.next.min} XP`:"MAX LEVEL"}</span>
          </div>
          <div style={{height:7,background:"#1a1a1a",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${level.pct*100}%`,background:`linear-gradient(90deg,${level.color}aa,${level.color})`,transition:"width .5s ease",boxShadow:`0 0 10px ${level.color}88`}}/>
          </div>
        </div>

        <div style={{display:"flex",gap:8}}>
          <StatCard label="Sessions" value={history.length}/>
          <StatCard label="Workout" value={workout.label.split(" ")[1]} accent={accent}/>
          <StatCard label="Today" value={DAYS.includes(todayName())?todayName().slice(0,3).toUpperCase():"REST"}/>
        </div>
      </div>

      {!readiness&&!isCompleted&&doneSets===0&&(
        settings.showReadiness!==false&&<ReadinessCheckIn value={DEFAULT_READINESS} onSave={saveReadiness} accent={accent}/>
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
      <div style={{padding:"18px 16px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:accent,letterSpacing:".06em",filter:`drop-shadow(0 0 10px ${accent}66)`}}>{workout.label}</span>
          <button onClick={()=>{if(!confirm("Reset today's sets?"))return;const n={...sets};workoutPlan.exercises.forEach((ex,i)=>Array.from({length:getSetCount(ex)},(_,j)=>{delete n[setKey(i,j)];}));setSets(n);setCompleted(p=>{const n2={...p};delete n2[sessionKey];return n2;});setExpanded(null);setRestState(null);setLoggerState(null);setSessionLogs({});setXpAwards({});setFocusMode(false);setWorkoutSummary(null);setUndoSet(null);}}
            style={{background:"none",border:"1px solid #2c2c2c",borderRadius:8,color:"#aaa",fontSize:12,padding:"8px 16px",letterSpacing:".08em"}}>RESET</button>
        </div>
        <div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
            <span style={{fontSize:13,color:"#aaa",letterSpacing:".1em"}}>PROGRESS</span>
            <span style={{fontSize:13,color:doneSets>0?accent:"#aaa"}}>{doneSets}/{totalSets} sets</span>
          </div>
          <div style={{height:7,background:"#1a1a1a",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(doneSets/totalSets)*100}%`,background:`linear-gradient(90deg,${accent}bb,${accent})`,transition:"width .4s ease",boxShadow:doneSets>0?`0 0 14px ${accent}bb`:"none"}}/>
          </div>
          {!isCompleted&&(
            <button onClick={()=>setFocusMode(true)}
              style={{width:"100%",marginTop:14,padding:"18px",background:accent,border:"none",borderRadius:13,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:25,letterSpacing:".12em",boxShadow:`0 0 36px ${accent}55`}}>
              START WORKOUT
            </button>
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

          return(
            <div key={i} style={{padding:"18px 16px",borderBottom:"1px solid #1a1a1a",background:done?`${accent}08`:"transparent",transition:"background .3s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div onClick={()=>setExpanded(open?null:i)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {done&&<span style={{color:accent,fontSize:17}}>✓</span>}
                    <span style={{fontSize:18,fontWeight:500,color:"#f5f5f5",opacity:done?.5:1,textDecoration:done?"line-through":"none",textDecorationColor:accent,textDecorationThickness:"1.5px"}}>{ex.name}</span>
                    {ex.substitutedFor&&<span style={{fontSize:10,color:accent,border:`1px solid ${accent}66`,borderRadius:5,padding:"2px 6px",letterSpacing:".08em"}}>SWAP</span>}
                    <span style={{fontSize:11,color:open?accent:"#888",transform:open?"rotate(180deg)":"none",transition:"all .2s",display:"inline-block"}}>▼</span>
                  </div>
                  <div style={{fontSize:14,color:"#bbb",marginTop:5,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span>{getSetCount(ex)} × {science.enabled&&science.repRange ? `${science.repRange.min}-${science.repRange.max}` : `×${reps}`}{ex.repSuffix||""}</span>
                    <span style={{color:"#666"}}>@ {curW}lbs</span>
                    {science.enabled&&<span style={{color:"#a78bfa",fontSize:12,padding:"2px 7px",borderRadius:5,background:"#a78bfa18",fontWeight:500}}>{science.label}</span>}
                    {science.tempo&&<span style={{color:"#a78bfa",fontSize:12,padding:"2px 7px",borderRadius:5,background:"#a78bfa18",fontWeight:500}}>tempo {science.tempo.code}</span>}
                    {hasNxtW&&<span style={{color:accent,fontSize:12,padding:"2px 7px",borderRadius:5,background:`${accent}18`,fontWeight:500}}>next: {nextW}lbs</span>}
                    {maxTest&&<span style={{color:"#888",fontSize:11}}>max: {maxTest}</span>}
                  </div>
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
                <div style={{marginTop:18,padding:18,background:"linear-gradient(180deg,#0e0e0e,#090909)",border:"1px solid #232323",borderRadius:14,animation:"slideDown .25s ease-out"}}>
                  <SLabel>Animation</SLabel>
                  <ExerciseAnimation folder={ex.folder} video={ex.video} accent={accent}/>

                  {/* Progress graph */}
                  <div style={{marginTop:16,padding:"14px 16px",background:"#080808",borderRadius:10,border:`1.5px solid ${exColor}33`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <SLabel small>Your Progress</SLabel>
                      {histData.length>=2&&(
                        <span style={{fontSize:12,color:exColor}}>{histData[histData.length-1].totalReps} reps last session</span>
                      )}
                    </div>
                    <MiniGraph data={histData} color={exColor} height={85}/>
                  </div>

                  <div style={{marginTop:14,padding:"13px 16px",background:"#080808",borderRadius:10,border:`1.5px solid ${accent}33`}}>
                    <SLabel small>Form Cue</SLabel>
                    <div style={{fontSize:15,color:"#f0f0f0",marginTop:5,lineHeight:1.55}}>→ {ex.tip}</div>
                    {ex.substitutedFor&&<div style={{fontSize:12,color:"#888",marginTop:8}}>Original: {ex.substitutedFor}</div>}
                  </div>

                  <CoachCard suggestions={suggestions.filter(s => s.cat === "Form" || s.cat === "Science" || s.cat === "Watch" || s.cat === "Habits").slice(0, 4)} accent={accent} onOpen={()=>setCoachOpen(true)}/>

                  {science.enabled&&(
                    <div style={{marginTop:14,padding:"13px 16px",background:"#080808",borderRadius:10,border:"1.5px solid #a78bfa44"}}>
                      <SLabel small>Science Coach</SLabel>
                      <div style={{fontSize:14,color:"#ddd",marginTop:5,lineHeight:1.55}}>{science.note}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:9}}>
                        {science.repRange&&<span style={{fontSize:12,color:"#a78bfa",background:"#a78bfa18",border:"1px solid #a78bfa44",borderRadius:7,padding:"6px 8px"}}>{science.repRange.min}-{science.repRange.max} reps</span>}
                        {science.tempo&&<span style={{fontSize:12,color:"#a78bfa",background:"#a78bfa18",border:"1px solid #a78bfa44",borderRadius:7,padding:"6px 8px"}}>tempo {science.tempo.code}</span>}
                        {science.est1RM&&<span style={{fontSize:12,color:"#a78bfa",background:"#a78bfa18",border:"1px solid #a78bfa44",borderRadius:7,padding:"6px 8px"}}>est. 1RM {science.est1RM}lbs</span>}
                        {science.percent&&<span style={{fontSize:12,color:"#a78bfa",background:"#a78bfa18",border:"1px solid #a78bfa44",borderRadius:7,padding:"6px 8px"}}>{Math.round(science.percent*100)}% target</span>}
                      </div>
                      {science.tempo&&<div style={{fontSize:13,color:"#aaa",lineHeight:1.45,marginTop:9}}>{science.tempo.note}</div>}
                      {science.variation&&<div style={{fontSize:13,color:"#aaa",lineHeight:1.45,marginTop:7}}>Variation: <span style={{color:"#d8b4fe"}}>{science.variation.name}</span>. {science.variation.note}</div>}
                    </div>
                  )}

                  <div style={{marginTop:18}}>
                    <SLabel>Muscles</SLabel>
                    <MuscleDiagram primary={ex.primary} secondary={ex.secondary} accent={accent}/>
                    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:7,marginTop:12}}>
                      {ex.primary.map(m=><span key={m} style={{fontSize:13,padding:"5px 12px",borderRadius:7,background:accent,color:"#0a0a0a",fontWeight:500}}>{MUSCLE_LABELS[m]}</span>)}
                      {ex.secondary.map(m=><span key={m} style={{fontSize:13,padding:"5px 12px",borderRadius:7,border:`1px solid ${accent}66`,color:accent}}>{MUSCLE_LABELS[m]}</span>)}
                    </div>
                  </div>

                  {/* Weight config */}
                  <div style={{marginTop:18,padding:"14px 16px",background:"#080808",borderRadius:10,border:"1px solid #1f1f1f"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <SLabel small>Working Weight</SLabel>
                      {hasNxtW&&<span style={{fontSize:12,color:accent,background:`${accent}18`,padding:"3px 9px",borderRadius:6}}>→ Try {nextW}lbs</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",background:"#101010",borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
                      <button onClick={()=>setExConfig(p=>({...p,[exKey]:{...p[exKey],weight:Math.max((p[exKey]?.weight||curW)-2.5,0)}}))} style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>−</button>
                      <div style={{flex:1,textAlign:"center",fontSize:20,fontWeight:500,color:"#fff"}}>{curW} lbs</div>
                      <button onClick={()=>setExConfig(p=>({...p,[exKey]:{...p[exKey],weight:(p[exKey]?.weight||curW)+2.5}}))} style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>+</button>
                    </div>
                  </div>

                  {/* Logged sets today */}
                  {Array.from({length:getSetCount(ex)},(_,j)=>sessionLogs[logKey(i,j)]).some(Boolean)&&(
                    <div style={{marginTop:12,padding:"14px 16px",background:"#080808",borderRadius:10,border:`1px solid ${accent}22`}}>
                      <SLabel small>Today's Sets</SLabel>
                      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                        {Array.from({length:getSetCount(ex)},(_,j)=>{const lg=sessionLogs[logKey(i,j)];return lg?(
                          <div key={j} style={{padding:"8px 12px",background:`${accent}15`,borderRadius:8,border:`1px solid ${accent}44`,fontSize:13,color:accent,fontWeight:500}}>S{j+1}: {lg.weight}lbs × {lg.reps}</div>
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
            {history[0]?.duration&&<div style={{fontSize:13,color:"#888",marginTop:4}}>{fmtDuration(history[0].duration)}</div>}
          </div>
        ):(
          <button onClick={finishWorkout} disabled={!allDone}
            style={{width:"100%",padding:22,borderRadius:15,fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".12em",border:allDone?"none":"1px solid #2a2a2a",background:allDone?accent:"#1a1a1a",color:allDone?"#050505":"#555",boxShadow:allDone?`0 0 56px ${accent}88`:"none",transition:"all .2s"}}>
            {allDone?"🏁 FINISH WORKOUT":`${totalSets-doneSets} SETS REMAINING`}
          </button>
        )}
      </div>

      <ThisWeek completed={completed} setActiveTab={setActiveTab}/>

      {history.length>0&&(
        <div style={{padding:"0 16px"}}>
          <div style={{fontSize:13,color:"#999",letterSpacing:".14em",marginBottom:12,textTransform:"uppercase",fontWeight:500}}>Recent</div>
          {history.slice(0,4).map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:"1px solid #161616"}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:12,padding:"4px 10px",borderRadius:6,background:WORKOUTS[h.workout]?.color+"22",color:WORKOUTS[h.workout]?.color,letterSpacing:".06em",fontWeight:500}}>{h.workout}</span>
                <span style={{fontSize:15,color:"#e0e0e0"}}>{h.day}</span>
                {h.duration&&<span style={{fontSize:12,color:"#888"}}>{fmtDuration(h.duration)}</span>}
              </div>
              <span style={{fontSize:13,color:"#aaa"}}>{h.date}</span>
            </div>
          ))}
          {history.length>4&&<button onClick={()=>setActiveView("calendar")} style={{background:"none",border:"1px solid #2c2c2c",borderRadius:9,color:"#bbb",padding:"12px 18px",fontSize:13,letterSpacing:".1em",marginTop:14,fontFamily:"DM Mono,monospace"}}>VIEW ALL → CALENDAR</button>}
        </div>
      )}
      <div style={{height:32}}/>

      {/* OVERLAYS */}
      {loggerState&&<SetLogger exerciseName={workoutPlan.exercises[loggerState.exIdx].name} setNum={loggerState.setIdx+1} defaultWeight={loggerState.weight} defaultReps={loggerState.reps} accent={accent} onSave={saveLog} onSkip={skipLog}/>}
      {undoSet&&(
        <div style={{position:"fixed",left:16,right:16,bottom:"calc(82px + env(safe-area-inset-bottom))",zIndex:260,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:"#111",border:`1.5px solid ${accent}66`,borderRadius:12,padding:"13px 14px",boxShadow:`0 0 28px ${accent}33`,pointerEvents:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:accent,letterSpacing:".12em",textTransform:"uppercase"}}>Set Logged</div>
                <div style={{fontSize:13,color:"#ddd",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{undoSet.label}</div>
              </div>
              <button onClick={undoLastSet} style={{background:"transparent",border:`1px solid ${accent}77`,color:accent,borderRadius:8,padding:"9px 12px",fontSize:12,letterSpacing:".1em"}}>UNDO</button>
              <button onClick={()=>setUndoSet(null)} style={{background:"transparent",border:"none",color:"#666",fontSize:18,padding:"4px 2px"}}>×</button>
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
        />
      )}
      {workoutSummary&&<WorkoutSummary summary={workoutSummary} accent={accent} onClose={()=>{setWorkoutSummary(null);setShowFeedback(true);}}/>}
      {restState?.done&&focusMode&&<RestReady label={restState.label} accent={restState.accent} onNext={()=>setRestState(null)}/>}
      {restState&&!restState.done&&!loggerState&&<RestTimer fullscreen={focusMode&&settings.fullscreenRest!==false} seconds={settings.restSeconds} label={restState.label} accent={restState.accent}
        onSkip={()=>{
          logCoachEvent({kind:"rest",action:"skip",restId:restState.restId,plannedSeconds:restState.plannedSeconds||settings.restSeconds,elapsedSeconds:Math.round((Date.now()-(restState.startedAt||Date.now()))/1000)});
          setRestState(null);
        }}
        onComplete={()=>{
          logCoachEvent({kind:"rest",action:"complete",restId:restState.restId,plannedSeconds:restState.plannedSeconds||settings.restSeconds,elapsedSeconds:restState.plannedSeconds||settings.restSeconds});
          playSound("restEnd");vibrate([200,60,200]);focusMode?setRestState(p=>p?{...p,done:true}:null):setRestState(null);
        }}/>}
      {showFeedback&&<PostWorkoutFeedback exercises={workoutPlan.exercises} sessionLogs={sessionLogs} getLogKey={logKey} exConfig={exConfig} history={history} onComplete={handleFeedback} accent={accent}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <Confetti active={confetti} accent={accent} onDone={()=>setConfetti(false)}/>
      <CoachFab onClick={()=>setCoachOpen(true)} accent={accent} count={suggestions.length}/>
      <CoachDrawer open={coachOpen} onClose={()=>setCoachOpen(false)} suggestions={suggestions} memory={coachMemory} plan={coachPlan} accent={accent}/>
    </div>
  );
}

function StatCard({label,value,accent}){return(<div style={{flex:1,padding:"14px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:11}}><div style={{fontSize:11,color:"#aaa",letterSpacing:".14em",textTransform:"uppercase"}}>{label}</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:accent||"#fafafa",marginTop:3,letterSpacing:".04em"}}>{value}</div></div>);}
function SLabel({children,small}){return(<div style={{fontSize:small?10:11,color:"#aaa",letterSpacing:".16em",textTransform:"uppercase",fontWeight:500,marginBottom:small?0:9}}>{children}</div>);}

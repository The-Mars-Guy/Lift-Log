import { useState, useEffect, useRef } from "react";
import {
  WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, DEFAULT_WEIGHTS,
  todayName, dateStr, calcDynamicTarget, assessmentTarget,
  getExerciseHistory, XP_VALUES, getLevel
} from "../data.js";
import { useSessionTimer, fmtDuration } from "../hooks.js";
import { ExerciseAnimation, RestTimer, Toast, MiniGraph } from "../components/shared.jsx";
import MuscleDiagram from "../components/MuscleDiagram.jsx";
import { completionKey, defaultWorkoutDay, scheduledDate, logKey as makeLogKey } from "../session.js";
import { buildCoachPlan, DEFAULT_READINESS, readinessLabel } from "../coach.js";

// ── CONFETTI ──────────────────────────────────────────────────────────────────
function Confetti({ active, accent, onDone }) {
  const ref = useRef();
  useEffect(() => {
    if (!active || !ref.current) return;
    const cv = ref.current;
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const ctx = cv.getContext("2d");
    const cols = [accent,"#fbbf24","#fb923c","#60a5fa","#f9fafb","#a78bfa","#f472b6"];
    const ps   = Array.from({length:90},(_,i)=>({
      x:Math.random()*cv.width, y:cv.height*.6+Math.random()*cv.height*.2,
      vx:(Math.random()-.5)*9, vy:-(Math.random()*14+7),
      col:cols[i%cols.length], sz:Math.random()*9+4,
      rot:Math.random()*Math.PI*2, spin:(Math.random()-.5)*.22,
      alpha:1, shape:i%3,
    }));
    let fr;
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      let alive=false;
      for(const p of ps){
        p.x+=p.vx; p.y+=p.vy; p.vy+=.38; p.vx*=.99; p.rot+=p.spin; p.alpha-=.011;
        if(p.alpha<=0) continue; alive=true;
        ctx.save(); ctx.globalAlpha=Math.max(0,p.alpha); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.col;
        if(p.shape===0) ctx.fillRect(-p.sz/2,-p.sz*.4,p.sz,p.sz*.8);
        else if(p.shape===1){ctx.beginPath();ctx.arc(0,0,p.sz*.45,0,Math.PI*2);ctx.fill();}
        else ctx.fillRect(-p.sz*.18,-p.sz*.6,p.sz*.36,p.sz*1.2);
        ctx.restore();
      }
      if(alive) fr=requestAnimationFrame(draw); else onDone?.();
    };
    fr=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(fr);
  },[active,accent,onDone]);
  if(!active) return null;
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:300,pointerEvents:"none"}}/>;
}

// ── XP FLOAT ─────────────────────────────────────────────────────────────────
function XpFloat({ amount, onDone }) {
  useEffect(()=>{ const id=setTimeout(onDone,900); return()=>clearTimeout(id); },[onDone]);
  return (
    <div style={{
      position:"fixed", right:24, top:"45%", zIndex:250,
      fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#fbbf24",
      letterSpacing:".08em", pointerEvents:"none",
      animation:"xpFloat .9s ease-out forwards",
      filter:"drop-shadow(0 0 8px #fbbf2499)",
    }}>+{amount} XP</div>
  );
}

// ── INITIAL ASSESSMENT FLOW ───────────────────────────────────────────────────
const ALL_EXERCISES = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];

function AssessmentFlow({ onComplete, accent }) {
  const [step, setStep] = useState(-1);
  const [results, setResults] = useState({});
  const [count, setCount] = useState(10);

  const total = ALL_EXERCISES.length;

  // ── INTRO ──
  if (step === -1) return (
    <div style={{minHeight:"100vh",overflowY:"auto",padding:"44px 24px 40px",background:"#050505"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:54,color:accent,letterSpacing:".06em",lineHeight:.9,marginBottom:20,filter:`drop-shadow(0 0 20px ${accent}55)`}}>
        STRENGTH<br/>ASSESSMENT
      </div>
      <div style={{fontSize:16,color:"#ccc",lineHeight:1.65,marginBottom:28}}>
        Before your first workout, we need to find your personal starting point.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:36}}>
        {[
          {n:"01", t:"Do each exercise", d:"As many reps as you can without stopping, to failure."},
          {n:"02", t:"Log your count",   d:"Just tap + until you hit your number. No pressure."},
          {n:"03", t:"We do the math",   d:"Targets start at 65% of your max and adapt weekly."},
        ].map(s=>(
          <div key={s.n} style={{display:"flex",gap:16,padding:"16px 18px",background:"#0d0d0d",borderRadius:13,border:"1px solid #1c1c1c",alignItems:"flex-start"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:accent,opacity:.6,flexShrink:0,lineHeight:1,marginTop:2}}>{s.n}</div>
            <div>
              <div style={{fontSize:15,color:"#f0f0f0",fontWeight:500,marginBottom:3}}>{s.t}</div>
              <div style={{fontSize:13,color:"#888",lineHeight:1.55}}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:"#888",marginBottom:20,textAlign:"center"}}>Takes about 5–10 minutes · done only once</div>
      <button onClick={()=>{setStep(0);setCount(10);}}
        style={{width:"100%",padding:"22px",background:accent,border:"none",borderRadius:14,fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#050505",letterSpacing:".1em",boxShadow:`0 0 50px ${accent}66`}}>
        BEGIN ASSESSMENT
      </button>
    </div>
  );

  // ── SUMMARY ──
  if (step >= total) {
    const targets = Object.entries(results).map(([name, max]) => ({ name, max, target: assessmentTarget(max) }));
    return (
      <div style={{minHeight:"100vh",overflowY:"auto",padding:"44px 24px 40px",background:"#050505"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:"#4ade80",letterSpacing:".06em",lineHeight:.9,marginBottom:12}}>
          ASSESSMENT<br/>COMPLETE ✓
        </div>
        <div style={{fontSize:14,color:"#bbb",marginBottom:24,lineHeight:1.55}}>Your personalized starting targets. They'll adjust each week based on how each session feels.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
          {targets.map(t=>(
            <div key={t.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"#0d0d0d",borderRadius:11,border:"1px solid #1c1c1c"}}>
              <div>
                <div style={{fontSize:15,color:"#f0f0f0",fontWeight:500}}>{t.name}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>Max: {t.max} reps</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#4ade80",letterSpacing:".04em"}}>×{t.target}</div>
                <div style={{fontSize:11,color:"#888"}}>starting target</div>
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
    <div style={{minHeight:"100vh",overflowY:"auto",padding:"32px 20px 40px",background:"#050505"}}>
      {/* Progress */}
      <div style={{marginBottom:22}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:7,letterSpacing:".1em",textTransform:"uppercase"}}>
          <span>Exercise {step+1} of {total}</span>
          <span style={{color:exColor}}>{ex.name}</span>
        </div>
        <div style={{height:5,background:"#1a1a1a",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(step/total)*100}%`,background:exColor,transition:"width .4s",boxShadow:`0 0 8px ${exColor}`}}/>
        </div>
      </div>

      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"#fafafa",letterSpacing:".06em",lineHeight:.95,marginBottom:5}}>{ex.name}</div>
      <div style={{fontSize:14,color:"#888",marginBottom:16,lineHeight:1.45}}>→ {ex.tip}</div>

      {/* Animation */}
      <div style={{marginBottom:16}}>
        <ExerciseAnimation folder={ex.folder} accent={exColor}/>
      </div>

      {/* Instruction */}
      <div style={{padding:"14px 18px",background:"#0d0d0d",borderRadius:12,border:`1.5px solid ${exColor}44`,marginBottom:24}}>
        <div style={{fontSize:14,color:"#ccc",lineHeight:1.55}}>
          Do as many <strong style={{color:exColor}}>{ex.name}</strong> reps as you can <strong style={{color:"#fff"}}>without stopping</strong>. Go to failure, then log your count.
        </div>
      </div>

      {/* Counter */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:12,color:"#aaa",letterSpacing:".14em",textTransform:"uppercase",textAlign:"center",marginBottom:12}}>How many did you do?</div>
        <div style={{display:"flex",alignItems:"center",background:"#141414",borderRadius:16,border:`2px solid ${exColor}55`,overflow:"hidden"}}>
          <button onClick={()=>setCount(c=>Math.max(1,c-1))}
            style={{width:72,height:76,background:"transparent",border:"none",color:"#ccc",fontSize:34,fontWeight:300}}>−</button>
          <div style={{flex:1,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:56,color:"#fff",letterSpacing:".04em"}}>{count}</div>
          <button onClick={()=>setCount(c=>c+1)}
            style={{width:72,height:76,background:"transparent",border:"none",color:"#ccc",fontSize:34,fontWeight:300}}>+</button>
        </div>
        <div style={{fontSize:13,color:"#888",letterSpacing:".06em",textAlign:"center",marginTop:10}}>
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
    </div>
  );
}

// ── POST-WORKOUT FEEDBACK ─────────────────────────────────────────────────────
const FEEDBACK_OPTIONS = [
  { key:"too_easy", label:"Too Easy",  emoji:"😴", desc:"+2 reps next session" },
  { key:"good",     label:"Good",      emoji:"👍", desc:"+1 rep next session"  },
  { key:"hard",     label:"Hard",      emoji:"💪", desc:"Keep same target"     },
  { key:"too_hard", label:"Too Much",  emoji:"🛑", desc:"−1 rep next session"  },
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
  const histData = getExerciseHistory(ex.name, history);

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

function CoachCard({ suggestions, accent }) {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  if (!suggestions.length) return null;
  const s = suggestions[idx];
  const cc = {Streak:"#fb923c",Form:"#60a5fa",Progress:accent,Progression:accent,Adjustment:"#fbbf24",Recovery:"#a78bfa",Welcome:accent}[s.cat]||accent;
  return (
    <div style={{margin:"0 16px 18px",padding:"16px 18px",background:"#0e0e0e",border:`1.5px solid ${cc}44`,borderRadius:14,boxShadow:`0 0 28px ${cc}15`}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <span style={{fontSize:28,flexShrink:0,marginTop:1}}>{s.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:cc,letterSpacing:".14em",textTransform:"uppercase",marginBottom:5,fontWeight:500}}>{s.cat}</div>
          <div key={key} style={{fontSize:15,color:"#eee",lineHeight:1.55,animation:"coachSlide .3s ease-out"}}>{s.msg}</div>
        </div>
        {suggestions.length>1&&<button onClick={()=>{setIdx(i=>(i+1)%suggestions.length);setKey(k=>k+1);}}
          style={{background:"transparent",border:`1px solid ${cc}44`,color:cc,borderRadius:8,padding:"8px 12px",fontSize:14,flexShrink:0,alignSelf:"center"}}>→</button>}
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

function TodayPlan({ plan, readiness, accent }) {
  if (!plan) return null;
  return (
    <div style={{margin:"0 16px 18px",padding:"17px 18px",background:`linear-gradient(180deg,${accent}16,#0d0d0d)`,border:`1.5px solid ${accent}55`,borderRadius:14,boxShadow:`0 0 32px ${accent}18`}}>
      <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:500,marginBottom:6}}>Today's Coach</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#f5f5f5",letterSpacing:".06em",lineHeight:1}}>{plan.headline}</div>
      <div style={{fontSize:13,color:"#888",marginTop:4}}>{readiness ? readinessLabel(readiness) : "Default readiness"}</div>
      <div style={{fontSize:14,color:"#ddd",lineHeight:1.55,marginTop:12}}>{plan.focus}</div>
      {plan.adjustments?.length>0&&(
        <div style={{display:"grid",gap:7,marginTop:12}}>
          {plan.adjustments.slice(0,2).map((item,i)=>(
            <div key={i} style={{fontSize:12,color:"#bbb",padding:"9px 11px",background:"#080808",borderRadius:8,border:"1px solid #202020"}}>{item}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function FocusWorkoutMode({
  workout, accent, activeTab, doneSets, totalSets, setDone, sessionLogs, logKey,
  getTargetReps, getWeight, toggleSet, onExit, onFinish, allDone, isCompleted,
}) {
  const next = (() => {
    for (let i=0;i<workout.exercises.length;i++) {
      const ex = workout.exercises[i];
      for (let j=0;j<ex.sets;j++) {
        if (!setDone(i,j)) return { ex, exIdx:i, setIdx:j };
      }
    }
    return { ex:workout.exercises[workout.exercises.length-1], exIdx:workout.exercises.length-1, setIdx:workout.exercises[workout.exercises.length-1].sets-1 };
  })();
  const target = getTargetReps(next.ex);
  const weight = getWeight(next.ex.name);
  const currentDone = Array.from({length:next.ex.sets},(_,j)=>setDone(next.exIdx,j)).filter(Boolean).length;

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:`radial-gradient(circle at top,${accent}12,#050505 46%,#000)`,overflowY:"auto",padding:"calc(18px + env(safe-area-inset-top)) 18px 28px"}}>
      <div className="mobile-shell">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <button onClick={onExit} style={{background:"transparent",border:"1px solid #2c2c2c",borderRadius:9,color:"#aaa",padding:"10px 13px",fontSize:12,letterSpacing:".08em"}}>EXIT</button>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"#777",letterSpacing:".14em",textTransform:"uppercase"}}>{activeTab}</div>
            <div style={{fontSize:13,color:accent}}>{doneSets}/{totalSets} sets</div>
          </div>
        </div>

        <div style={{fontSize:12,color:accent,letterSpacing:".16em",textTransform:"uppercase",marginBottom:8}}>Focus Mode</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:46,color:"#f5f5f5",letterSpacing:".06em",lineHeight:.92,marginBottom:6}}>{next.ex.name}</div>
        <div style={{fontSize:15,color:"#aaa",lineHeight:1.5,marginBottom:18}}>
          Set {Math.min(currentDone+1,next.ex.sets)} of {next.ex.sets} · {weight}lbs · target ×{target}{next.ex.repSuffix||""}
        </div>

        <ExerciseAnimation folder={next.ex.folder} accent={accent}/>

        <div style={{marginTop:20,display:"grid",gridTemplateColumns:`repeat(${next.ex.sets},1fr)`,gap:9}}>
          {Array.from({length:next.ex.sets},(_,j)=>{
            const isDone=setDone(next.exIdx,j);
            const logged=sessionLogs[logKey(next.exIdx,j)];
            return (
              <button key={j} onClick={()=>toggleSet(next.exIdx,j)}
                style={{height:58,borderRadius:13,border:`1.5px solid ${isDone?accent:"#333"}`,background:isDone?`${accent}25`:"#0d0d0d",color:isDone?accent:"#aaa",fontSize:15,fontWeight:700,boxShadow:isDone?`0 0 14px ${accent}55`:"none"}}>
                {isDone ? (logged ? `${logged.reps}r` : "DONE") : `SET ${j+1}`}
              </button>
            );
          })}
        </div>

        <div style={{marginTop:18,padding:"14px 16px",background:"#0d0d0d",border:"1px solid #202020",borderRadius:12}}>
          <div style={{fontSize:11,color:"#777",letterSpacing:".14em",textTransform:"uppercase",marginBottom:6}}>Cue</div>
          <div style={{fontSize:15,color:"#ddd",lineHeight:1.5}}>{next.ex.tip}</div>
        </div>

        <div style={{height:7,background:"#181818",borderRadius:5,overflow:"hidden",marginTop:22}}>
          <div style={{height:"100%",width:`${(doneSets/totalSets)*100}%`,background:accent,boxShadow:`0 0 12px ${accent}`,transition:"width .25s"}}/>
        </div>

        {allDone&&!isCompleted&&(
          <button onClick={onFinish}
            style={{width:"100%",marginTop:22,padding:20,borderRadius:15,border:"none",background:accent,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".12em",boxShadow:`0 0 48px ${accent}77`}}>
            FINISH WORKOUT
          </button>
        )}
      </div>
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
  playSound, vibrate, setActiveView,
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

  const wKey    = SCHEDULE[activeTab];
  const workout = WORKOUTS[wKey];
  const accent  = workout.color;

  const sessionKey = completionKey(activeTab);
  const logKey  = (i,j) => makeLogKey(sessionKey,i,j);
  const setKey  = (i,j) => `${sessionKey}_${i}_${j}`;
  const setDone = (i,j) => !!sets[setKey(i,j)];
  const exDone  = (i)   => Array.from({length:workout.exercises[i].sets},(_,j)=>setDone(i,j)).every(Boolean);
  const totalSets = workout.exercises.reduce((a,e)=>a+e.sets,0);
  const doneSets  = workout.exercises.reduce((a,ex,i)=>a+Array.from({length:ex.sets},(_,j)=>setDone(i,j)?1:0).reduce((x,y)=>x+y,0),0);
  const allDone   = doneSets===totalSets;
  const isCompleted = !!completed[sessionKey];

  const sessionRunning = doneSets>0&&!isCompleted;
  const sessionElapsed = useSessionTimer(sessionRunning);

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

  // Dynamic target or fallback to base
  const getTargetReps = (ex) => exConfig[ex.name]?.targetReps ?? (ex.baseReps + (progression[ex.name]?.repBonus||0));
  const getWeight     = (n)  => exConfig[n]?.weight  || DEFAULT_WEIGHTS[n] || settings.dumbbellWeight;
  const getNextW      = (n)  => exConfig[n]?.nextWeight;
  const getMaxTest    = (n)  => exConfig[n]?.maxRepsTest;

  const streak = (() => {
    if(!history.length) return 0;
    const s=[...history].sort((a,b)=>b.timestamp-a.timestamp);
    let r=1; for(let i=1;i<s.length;i++){if((s[i-1].timestamp-s[i].timestamp)/86400000<=4.5)r++;else break;}
    return r;
  })();

  const readinessEntry = (checkIns||[]).find(ci=>ci.kind==="readiness"&&ci.sessionKey===sessionKey);
  const readiness = readinessEntry?.readiness;
  const coachPlan = buildCoachPlan({workout,history,exConfig,settings,readiness:readiness||DEFAULT_READINESS});
  const suggestions = [...coachPlan.cards, ...buildSuggestions({history,progression,settings,exConfig,workoutKey:wKey})];

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

  const spawnXp = (amount) => {
    addXp(amount);
    setXpAmount(amount);
    setXpVisible(true);
    setTimeout(()=>setXpVisible(false),900);
  };

  const toggleSet = (i,j) => {
    const k=setKey(i,j); const was=!!sets[k];
    const ex=workout.exercises[i];
    const lk=logKey(i,j);

    if(was){
      const logged=sessionLogs[lk]||{weight:getWeight(ex.name),reps:getTargetReps(ex)};
      setLoggerState({exIdx:i,setIdx:j,weight:logged.weight,reps:logged.reps,editing:true});
      return;
    }

    setSets(p=>({...p,[k]:true}));
    setSessionLogs(p=>({...p,[lk]:{weight:getWeight(ex.name),reps:getTargetReps(ex)}}));
    if(!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    playSound("setComplete"); vibrate([28]);
    const bk=lk;
      setBounceSets(p=>({...p,[bk]:true}));
      setTimeout(()=>setBounceSets(p=>{const n={...p};delete n[bk];return n;}),500);
    const remaining=ex.sets-(j+1);
    const hasNextExercise=i+1<workout.exercises.length;
    const next=remaining>0?`Set ${j+2} of ${ex.name}`:hasNextExercise?`Up next: ${workout.exercises[i+1].name}`:null;
    if(next) setRestState({label:next,accent});
    else setRestState(null);
  };

  const saveLog = ({weight,reps}) => {
    if(!loggerState) return;
    const {exIdx,setIdx,editing}=loggerState;
    const lk=logKey(exIdx,setIdx);
    setSessionLogs(p=>({...p,[lk]:{weight,reps}}));
    if(!editing&&!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    setLoggerState(null);
  };

  const skipLog = () => {
    if(!loggerState) return;
    const {exIdx,setIdx}=loggerState;
    const ex=workout.exercises[exIdx];
    const lk=logKey(exIdx,setIdx);
    setSessionLogs(p=>({...p,[lk]:{weight:getWeight(ex.name),reps:getTargetReps(ex)}}));
    if(!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    setLoggerState(null);
  };

  const finishWorkout = () => {
    if(!allDone) return;
    const exSnap = workout.exercises.map((ex,i)=>{
      const logs=Array.from({length:ex.sets},(_,j)=>sessionLogs[logKey(i,j)]||{weight:getWeight(ex.name),reps:getTargetReps(ex)});
      return {name:ex.name,sets:ex.sets,reps:getTargetReps(ex),setLog:logs};
    });

    // Update weights / next weight suggestions
    // weight calc inline
    const newConfig={...exConfig};
    const prs=[];
    exSnap.forEach((exS,i)=>{
      const ex=workout.exercises[i];
      const curW=getWeight(ex.name);
      const allHit=exS.setLog.every(l=>(l.reps||0)>=getTargetReps(ex));
      const anyFail=exS.setLog.some(l=>(l.reps||0)<Math.round(getTargetReps(ex)*.75));
      const nextW=allHit?Math.round((curW+2.5)*4)/4:anyFail?Math.max(Math.round((curW-2.5)*4)/4,2.5):curW;
      const curMaxW=exConfig[ex.name]?.maxWeight||0;
      const newMaxW=Math.max(...exS.setLog.map(l=>l.weight));
      if(newMaxW>curMaxW) prs.push({name:ex.name,val:newMaxW});
      newConfig[ex.name]={...newConfig[ex.name],weight:curW,nextWeight:allHit?nextW:undefined,maxWeight:Math.max(newMaxW,curMaxW)};
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

    setHistory(p=>[{day:activeTab,workout:wKey,date:dateStr(scheduledDate(activeTab)),timestamp:scheduledDate(activeTab).getTime(),duration:sessionElapsed,exercises:exSnap},...p].slice(0,120));
    setCompleted(p=>({...p,[sessionKey]:dateStr(scheduledDate(activeTab))}));
    playSound("workoutDone"); vibrate([100,60,100]);
    setConfetti(true);
    spawnXp(XP_VALUES.workout);

    if(prs.length) setTimeout(()=>{playSound("achievement");setToast({icon:"🏆",title:"PERSONAL RECORD",msg:prs.map(p=>`${p.name}: ${p.val}lbs`).join(", "),accent:"#fbbf24"});},600);
    // Show feedback modal
    setTimeout(()=>setShowFeedback(true),1200);
  };

  const handleFeedback = (feedbackMap) => {
    setShowFeedback(false);
    // Apply feedback as pending adjustments
    const newConfig={...exConfig};
    workout.exercises.forEach(ex=>{
      const fb=feedbackMap[ex.name];
      if(!fb) return;
      const cur=newConfig[ex.name]||{};
      const maxTest=cur.maxRepsTest;
      const newTarget=calcDynamicTarget(getTargetReps(ex),fb,maxTest);
      const adj=newTarget-getTargetReps(ex);
      newConfig[ex.name]={...cur,targetReps:newTarget,pendingAdj:adj};
    });
    setExConfig(newConfig);
    setSessionLogs({});
    setXpAwards({});
    setFocusMode(false);
    setRestState(null);
    setLoggerState(null);
  };

  const completeAssessment = (results) => {
    const newConfig={...exConfig};
    ALL_EXERCISES.forEach(ex=>{
      const maxReps=results[ex.name]||10;
      const target=assessmentTarget(maxReps);
      newConfig[ex.name]={...newConfig[ex.name],maxRepsTest:maxReps,targetReps:target,weight:DEFAULT_WEIGHTS[ex.name]||settings.dumbbellWeight};
    });
    setExConfig(newConfig);
    setAssessmentDone(true);
  };

  // Show assessment if not done yet and no history
  if (!assessmentDone && history.length===0) {
    return <AssessmentFlow onComplete={completeAssessment} accent={accent}/>;
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
        <ReadinessCheckIn value={DEFAULT_READINESS} onSave={saveReadiness} accent={accent}/>
      )}
      <TodayPlan plan={coachPlan} readiness={readiness} accent={accent}/>
      <CoachCard suggestions={suggestions} accent={accent}/>

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
          <button onClick={()=>{if(!confirm("Reset today's sets?"))return;const n={...sets};workout.exercises.forEach((_,i)=>Array.from({length:workout.exercises[i].sets},(_,j)=>{delete n[setKey(i,j)];}));setSets(n);setCompleted(p=>{const n2={...p};delete n2[sessionKey];return n2;});setExpanded(null);setRestState(null);setLoggerState(null);setSessionLogs({});setXpAwards({});setFocusMode(false);}}
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
        {workout.exercises.map((ex,i)=>{
          const open=expanded===i;
          const reps=getTargetReps(ex); const bonus=progression[ex.name]?.repBonus||0;
          const atMax=bonus>=settings.maxRepBonus; const done=exDone(i);
          const curW=getWeight(ex.name); const nextW=getNextW(ex.name);
          const hasNxtW=nextW&&nextW>curW;
          const maxTest=getMaxTest(ex.name);
          const exColor=WORKOUTS.A.exercises.some(e=>e.name===ex.name)?WORKOUTS.A.color:WORKOUTS.B.color;
          const histData=getExerciseHistory(ex.name,history);

          return(
            <div key={i} style={{padding:"18px 16px",borderBottom:"1px solid #1a1a1a",background:done?`${accent}08`:"transparent",transition:"background .3s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div onClick={()=>setExpanded(open?null:i)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {done&&<span style={{color:accent,fontSize:17}}>✓</span>}
                    <span style={{fontSize:18,fontWeight:500,color:"#f5f5f5",opacity:done?.5:1,textDecoration:done?"line-through":"none",textDecorationColor:accent,textDecorationThickness:"1.5px"}}>{ex.name}</span>
                    <span style={{fontSize:11,color:open?accent:"#888",transform:open?"rotate(180deg)":"none",transition:"all .2s",display:"inline-block"}}>▼</span>
                  </div>
                  <div style={{fontSize:14,color:"#bbb",marginTop:5,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span>{ex.sets} × ×{reps}{ex.repSuffix||""}</span>
                    <span style={{color:"#666"}}>@ {curW}lbs</span>
                    {hasNxtW&&<span style={{color:accent,fontSize:12,padding:"2px 7px",borderRadius:5,background:`${accent}18`,fontWeight:500}}>next: {nextW}lbs</span>}
                    {maxTest&&<span style={{color:"#888",fontSize:11}}>max: {maxTest}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  {Array.from({length:ex.sets},(_,j)=>{
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
                  <ExerciseAnimation folder={ex.folder} accent={accent}/>

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
                  </div>

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
                      <button onClick={()=>setExConfig(p=>({...p,[ex.name]:{...p[ex.name],weight:Math.max((p[ex.name]?.weight||curW)-2.5,0)}}))} style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>−</button>
                      <div style={{flex:1,textAlign:"center",fontSize:20,fontWeight:500,color:"#fff"}}>{curW} lbs</div>
                      <button onClick={()=>setExConfig(p=>({...p,[ex.name]:{...p[ex.name],weight:(p[ex.name]?.weight||curW)+2.5}}))} style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>+</button>
                    </div>
                  </div>

                  {/* Logged sets today */}
                  {Array.from({length:ex.sets},(_,j)=>sessionLogs[logKey(i,j)]).some(Boolean)&&(
                    <div style={{marginTop:12,padding:"14px 16px",background:"#080808",borderRadius:10,border:`1px solid ${accent}22`}}>
                      <SLabel small>Today's Sets</SLabel>
                      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                        {Array.from({length:ex.sets},(_,j)=>{const lg=sessionLogs[logKey(i,j)];return lg?(
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
      {loggerState&&<SetLogger exerciseName={workout.exercises[loggerState.exIdx].name} setNum={loggerState.setIdx+1} defaultWeight={loggerState.weight} defaultReps={loggerState.reps} accent={accent} onSave={saveLog} onSkip={skipLog}/>}
      {focusMode&&(
        <FocusWorkoutMode
          workout={workout} accent={accent} activeTab={activeTab}
          doneSets={doneSets} totalSets={totalSets} setDone={setDone}
          sessionLogs={sessionLogs} logKey={logKey}
          getTargetReps={getTargetReps} getWeight={getWeight}
          toggleSet={toggleSet} onExit={()=>setFocusMode(false)}
          onFinish={finishWorkout} allDone={allDone} isCompleted={isCompleted}
        />
      )}
      {restState&&!loggerState&&<RestTimer fullscreen={focusMode} seconds={settings.restSeconds} label={restState.label} accent={restState.accent} onSkip={()=>setRestState(null)} onComplete={()=>{setRestState(null);playSound("restEnd");vibrate([200,60,200]);}}/>}
      {showFeedback&&<PostWorkoutFeedback exercises={workout.exercises} sessionLogs={sessionLogs} getLogKey={logKey} exConfig={exConfig} history={history} onComplete={handleFeedback} accent={accent}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <Confetti active={confetti} accent={accent} onDone={()=>setConfetti(false)}/>
    </div>
  );
}

function StatCard({label,value,accent}){return(<div style={{flex:1,padding:"14px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:11}}><div style={{fontSize:11,color:"#aaa",letterSpacing:".14em",textTransform:"uppercase"}}>{label}</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:accent||"#fafafa",marginTop:3,letterSpacing:".04em"}}>{value}</div></div>);}
function SLabel({children,small}){return(<div style={{fontSize:small?10:11,color:"#aaa",letterSpacing:".16em",textTransform:"uppercase",fontWeight:500,marginBottom:small?0:9}}>{children}</div>);}

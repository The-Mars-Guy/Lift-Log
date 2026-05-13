import { useState, useEffect } from "react";
import { WORKOUTS, assessmentTarget } from "../../data.js";
import { ExerciseAnimation } from "../../components/shared.jsx";

export const ASSESSMENT_EXERCISES = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];

export function FirstRunSetup({ settings, setSettings, accent }) {
  const [goal, setGoal] = useState(settings.trainingGoal || "hypertrophy");
  const [joints, setJoints] = useState(settings.cautiousJoints || []);
  const toggleJoint = (key) => setJoints(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);
  const finish = () => setSettings(s => ({
    ...s,
    scienceCoach: true,
    trainingGoal: goal,
    equipmentProfile: "fixed_dumbbells",
    coachStyle: "balanced",
    autoDeload: true,
    showReadiness: true,
    cautiousJoints: joints,
    onboardingDone: true,
  }));

  return (
    <div style={{minHeight:"100vh",padding:"44px 20px",background:"linear-gradient(180deg,#f8fffb,#eef7ff)",color:"#172033"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:50,letterSpacing:".05em",lineHeight:.9,color:"#123047",marginBottom:12}}>SET UP<br/>YOUR COACH</div>
      <div style={{fontSize:15,color:"#435166",lineHeight:1.6,marginBottom:22}}>Built around two 15lb dumbbells, clean reps, and steady muscle gain.</div>
      <div style={{display:"grid",gap:12}}>
        <SetupBlock title="Goal">
          {[["hypertrophy","Build muscle"],["general","General fitness"],["fatigue_friendly","Easy recovery bias"]].map(([key,label])=>(
            <button key={key} onClick={()=>setGoal(key)} style={{padding:"13px 12px",borderRadius:11,border:`1.5px solid ${goal===key?accent:"#d7e3ef"}`,background:goal===key?`${accent}22`:"#fff",color:"#172033",fontWeight:700,textAlign:"left"}}>{label}</button>
          ))}
        </SetupBlock>
        <SetupBlock title="Joints to protect">
          {["knees","shoulders","wrists","back"].map(key=>(
            <button key={key} onClick={()=>toggleJoint(key)} style={{padding:"12px",borderRadius:11,border:`1.5px solid ${joints.includes(key)?accent:"#d7e3ef"}`,background:joints.includes(key)?`${accent}22`:"#fff",color:"#172033",textTransform:"capitalize",fontWeight:700}}>{key}</button>
          ))}
        </SetupBlock>
      </div>
      <button onClick={finish} style={{width:"100%",marginTop:24,padding:"20px",border:"none",borderRadius:15,background:accent,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:27,letterSpacing:".12em",boxShadow:`0 16px 42px ${accent}55`}}>SAVE SETUP</button>
    </div>
  );
}

function SetupBlock({ title, children }) {
  return (
    <div style={{padding:15,background:"rgba(255,255,255,.82)",border:"1px solid rgba(112,132,160,.25)",borderRadius:14}}>
      <div style={{fontSize:11,color:"#25536f",letterSpacing:".14em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{title}</div>
      <div style={{display:"grid",gap:8}}>{children}</div>
    </div>
  );
}

export function AssessmentFlow({ onComplete, accent, theme="dark", initialResults=null, editing=false, onCancel }) {
  const [step, setStep] = useState(-1);
  const [results, setResults] = useState(initialResults || {});
  const [count, setCount] = useState(10);

  const total = ASSESSMENT_EXERCISES.length;
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

  useEffect(() => {
    if (step < 0 || step >= total) return;
    const ex = ASSESSMENT_EXERCISES[step];
    setCount(results[ex.name] || 10);
  }, [step, total]); // eslint-disable-line

  if (step === -1) return (
    <div style={{minHeight:"100vh",overflowY:"auto",padding:"40px 20px 40px",background:ui.page,color:ui.text}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(44px, 14vw, 54px)",color:accent,letterSpacing:".04em",lineHeight:.9,marginBottom:20,filter:`drop-shadow(0 0 20px ${accent}55)`}}>
        {editing ? "EDIT" : "STRENGTH"}<br/>{editing ? "BENCHMARK" : "ASSESSMENT"}
      </div>
      <div style={{fontSize:16,color:ui.soft,lineHeight:1.65,marginBottom:28}}>
        {editing
          ? "Update your clean max reps if the original test was off, skipped, or no longer matches your current ability."
          : "Before your first workout, set a safe starting point. Stop any test if form breaks or something hurts."}
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
      <div style={{fontSize:13,color:ui.muted,marginBottom:20,textAlign:"center"}}>{editing ? "Current numbers are prefilled" : "Takes about 5-10 minutes · done only once"}</div>
        <button onClick={()=>setStep(0)}
        style={{width:"100%",padding:"22px",background:accent,border:"none",borderRadius:14,fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#050505",letterSpacing:".1em",boxShadow:`0 0 50px ${accent}66`}}>
        {editing ? "EDIT BENCHMARKS" : "BEGIN ASSESSMENT"}
      </button>
      <button onClick={()=>editing ? onCancel?.() : onComplete(null)}
        style={{width:"100%",marginTop:12,padding:"16px",background:light ? "rgba(255,255,255,.58)" : "transparent",border:`1px solid ${light ? "rgba(103,122,150,.32)" : "#2a2a2a"}`,borderRadius:12,fontSize:13,color:ui.soft,letterSpacing:".08em"}}>
        {editing ? "CANCEL" : "USE DEFAULTS FOR NOW"}
      </button>
    </div>
  );

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
          {editing ? "SAVE BENCHMARKS →" : "START TRAINING →"}
        </button>
      </div>
    );
  }

  const ex = ASSESSMENT_EXERCISES[step];
  const exColor = WORKOUTS.A.exercises.some(e=>e.name===ex.name) ? WORKOUTS.A.color : WORKOUTS.B.color;

  return (
    <div style={{minHeight:"100vh",overflowY:"auto",padding:"32px 20px 40px",background:ui.page,color:ui.text}}>
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

      <div style={{marginBottom:16}}>
        <ExerciseAnimation folder={ex.folder} accent={exColor}/>
      </div>

      <div style={{padding:"14px 18px",background:ui.card,borderRadius:12,border:`1.5px solid ${exColor}44`,marginBottom:24,boxShadow:ui.shadow}}>
        <div style={{fontSize:14,color:ui.soft,lineHeight:1.55}}>
          Do as many clean <strong style={{color:exColor}}>{ex.name}</strong> reps as you can. Stop if form breaks, if pain appears, or if the movement feels unsafe today.
        </div>
      </div>

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
        setStep(s=>s+1);
      }}
        style={{width:"100%",padding:"20px",background:exColor,border:"none",borderRadius:14,fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#050505",letterSpacing:".1em",marginTop:16,boxShadow:`0 0 40px ${exColor}66`}}>
        {step < total-1 ? "NEXT EXERCISE →" : "SEE MY RESULTS →"}
      </button>
      <button onClick={()=>{
        setResults(r=>{const n={...r};delete n[ex.name];return n;});
        setStep(s=>s+1);
      }}
        style={{width:"100%",padding:"14px",background:light ? "rgba(255,255,255,.58)" : "transparent",border:`1px solid ${light ? "rgba(103,122,150,.32)" : "#2a2a2a"}`,borderRadius:12,fontSize:13,color:ui.muted,letterSpacing:".08em",marginTop:10}}>
        SKIP THIS EXERCISE
      </button>
    </div>
  );
}

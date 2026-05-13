import { useState } from "react";
import { WORKOUTS, getExerciseHistory } from "../../data.js";
import { MiniGraph } from "../../components/shared.jsx";

export const FEEDBACK_OPTIONS = [
  { key:"easy",     label:"Easy",      emoji:"😴", desc:"+2 reps next session" },
  { key:"good",     label:"Good",      emoji:"👍", desc:"+1 rep next session"  },
  { key:"hard",     label:"Hard",      emoji:"💪", desc:"Keep same target"     },
  { key:"pain",     label:"Pain",      emoji:"🛑", desc:"Lower target + bias swaps"  },
];

export default function PostWorkoutFeedback({ exercises, sessionLogs, getLogKey, exConfig, history, onComplete, accent }) {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({});

  const submitFeedback = (key) => {
    if (step >= exercises.length) {
      onComplete({ exercises: feedback, workoutFeeling: key });
      return;
    }
    const newFb = { ...feedback, [exercises[step].name]: key };
    setFeedback(newFb);
    setStep(s=>s+1);
  };

  if (step >= exercises.length) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"flex-end"}}>
        <div className="mobile-shell" style={{background:"#0a0a0a",borderTop:`2px solid ${accent}`,borderRadius:"18px 18px 0 0",padding:"24px 20px 36px",animation:"slideUp .3s ease-out"}}>
          <div style={{fontSize:12,color:"#888",letterSpacing:".14em",textTransform:"uppercase",marginBottom:5}}>Overall Workout</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:"#fafafa",letterSpacing:".06em",marginBottom:8}}>HOW WAS TODAY?</div>
          <div style={{fontSize:14,color:"#aaa",lineHeight:1.5,marginBottom:18}}>This tunes the next session's overall volume, not just one exercise.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {FEEDBACK_OPTIONS.map(opt=>(
              <button key={opt.key} onClick={()=>submitFeedback(opt.key)}
                style={{padding:"16px 12px",background:"#141414",border:"1.5px solid #2a2a2a",borderRadius:13,cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:30,marginBottom:6}}>{opt.emoji}</div>
                <div style={{fontSize:14,color:"#f0f0f0",fontWeight:500,marginBottom:3}}>{opt.label}</div>
                <div style={{fontSize:11,color:"#888"}}>{opt.key==="easy"?"small push next time":opt.key==="hard"?"slightly less volume":opt.key==="pain"?"protect and swap sooner":"steady plan"}</div>
              </button>
            ))}
          </div>
          <button onClick={()=>submitFeedback("good")}
            style={{width:"100%",marginTop:14,padding:"12px",background:"transparent",border:"none",color:"#555",fontSize:13,letterSpacing:".06em"}}>
            skip overall rating
          </button>
        </div>
      </div>
    );
  }

  const ex = exercises[step];
  const logs = Array.from({length:ex.sets},(_,j)=>sessionLogs[getLogKey(step,j)]).filter(Boolean);
  const totalReps = logs.reduce((s,l)=>s+(l.reps||0),0);
  const exColor = WORKOUTS.A.exercises.some(e=>e.name===ex.name) ? WORKOUTS.A.color : WORKOUTS.B.color;
  const histData = getExerciseHistory(ex.configName || ex.originalName || ex.name, history);

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"flex-end"}}>
      <div className="mobile-shell" style={{background:"#0a0a0a",borderTop:`2px solid ${accent}`,borderRadius:"18px 18px 0 0",padding:"24px 20px 36px",animation:"slideUp .3s ease-out"}}>
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
            {logs[0]?.weight != null && <span style={{color:"#888"}}> @ {logs[0].weight > 0 ? `${logs[0].weight}lbs` : "bodyweight"}</span>}
          </div>
        )}

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

import { useEffect, useState } from "react";
import { surface, text } from "../../theme.js";

export default function SetLogger({ exerciseName, setNum, defaultWeight, defaultReps, accent, onSave, onSkip, editing, increment = 1 }) {
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
    <div style={{position:"fixed",bottom:82,left:0,right:0,zIndex:220,background:surface.bg1,borderTop:`1.5px solid ${accent}99`,padding:"14px 18px 12px",boxShadow:`0 -8px 32px ${accent}3d`,animation:"slideUp .22s ease-out"}}>
      <div className="mobile-shell">
        <div style={{fontSize:12,color:accent,fontWeight:600,marginBottom:12}}>Log Set {setNum} · {exerciseName}</div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={{fontSize:11,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>WEIGHT (lbs)</div>
            <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setWeight(w=>Math.max((Number(w)||0)-step,0))} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20}}>−</button>
              <input value={weight} onChange={e=>setWeight(e.target.value)} inputMode="decimal" type="number" min="0" step="any" aria-label="Weight used in pounds"
                style={{flex:1,minWidth:0,textAlign:"center",fontSize:18,fontWeight:500,color:text.primary,background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono, monospace"}}/>
              <button onClick={()=>setWeight(w=>(Number(w)||0)+step)} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20}}>+</button>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>REPS DONE</div>
            <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setReps(r=>Math.max((Number(r)||0)-1,0))} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20}}>−</button>
              <input value={reps} onChange={e=>setReps(e.target.value)} inputMode="numeric" type="number" min="0" step="1" aria-label="Reps completed"
                style={{flex:1,minWidth:0,textAlign:"center",fontSize:18,fontWeight:500,color:text.primary,background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono, monospace"}}/>
              <button onClick={()=>setReps(r=>(Number(r)||0)+1)} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20}}>+</button>
            </div>
          </div>
          <button onClick={()=>onSave({weight:cleanWeight,reps:cleanReps})}
            style={{width:"100%",height:48,background:accent,border:"none",borderRadius:10,color:"#0a0a0a",fontSize:13,fontWeight:700,boxShadow:`0 0 16px ${accent}5c`,letterSpacing:".08em"}}>LOG SET</button>
        </div>
        <button onClick={onSkip} style={{background:"none",border:"none",color:text.faint,fontSize:12,letterSpacing:".08em",marginTop:10,width:"100%",textAlign:"center",padding:4}}>{editing ? "keep current log" : "use planned numbers"}</button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { WORKOUTS, DAYS, todayName } from "../../data.js";

export function buildSuggestions({ history, progression, settings, exConfig, workoutKey }) {
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

export function CoachDrawer({ open, onClose, suggestions, memory, plan, accent }) {
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

export function CoachFab({ onClick, accent, count }) {
  const [pos, setPos] = useState(null);
  const drag = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wt_coach_fab_pos") || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) setPos(saved);
    } catch {
      setPos(null);
    }
  }, []);

  const clampPos = (x, y) => {
    const pad = 10;
    const size = 62;
    const maxX = Math.max(pad, window.innerWidth - size - pad);
    const maxY = Math.max(pad, window.innerHeight - size - pad);
    return {
      x: Math.min(Math.max(x, pad), maxX),
      y: Math.min(Math.max(y, pad), maxY),
    };
  };

  const beginDrag = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = event.touches?.[0] || event;
    const current = pos || { x: window.innerWidth - 78, y: window.innerHeight - 160 };
    drag.current = { startX:point.clientX, startY:point.clientY, x:current.x, y:current.y, moved:false, last:current };
  };

  const moveDrag = (event) => {
    if (!drag.current) return;
    const point = event.touches?.[0] || event;
    const dx = point.clientX - drag.current.startX;
    const dy = point.clientY - drag.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.current.moved = true;
    const next = clampPos(drag.current.x + dx, drag.current.y + dy);
    drag.current.last = next;
    setPos(next);
  };

  const endDrag = () => {
    if (!drag.current) return;
    const wasMoved = drag.current.moved;
    const last = drag.current.last;
    drag.current = null;
    if (last) {
      try { localStorage.setItem("wt_coach_fab_pos", JSON.stringify(last)); }
      catch {}
    }
    if (!wasMoved) onClick();
  };

  const position = pos
    ? { left:pos.x, top:pos.y }
    : { right:16, bottom:"calc(98px + env(safe-area-inset-bottom))" };

  return (
    <button
      onPointerDown={beginDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={()=>{drag.current=null;}}
      style={{position:"fixed",...position,zIndex:130,width:62,height:62,borderRadius:19,border:`1.5px solid ${accent}88`,background:accent,color:"#050505",boxShadow:`0 16px 42px ${accent}66`,fontWeight:900,letterSpacing:".04em",touchAction:"none",cursor:"grab"}}
    >
      AI
      {count>0&&<span style={{position:"absolute",right:-4,top:-5,minWidth:20,height:20,borderRadius:10,background:"#123047",color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff"}}>{Math.min(count,9)}</span>}
    </button>
  );
}

export function CoachCard({ suggestions, accent, onOpen }) {
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

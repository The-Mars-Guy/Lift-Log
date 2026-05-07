import { useState, useEffect, useRef, useCallback } from "react";
import { WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, DEFAULT_WEIGHTS, todayName, dateStr, isoDate, calcNextLoad, epley1RM, XP_VALUES, getLevel } from "../data.js";
import { useSessionTimer, fmtDuration } from "../hooks.js";
import { ExerciseAnimation, RestTimer, Toast } from "../components/shared.jsx";
import MuscleDiagram from "../components/MuscleDiagram.jsx";

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
function XpFloat({ amount, x, y, onDone }) {
  useEffect(() => { const id=setTimeout(onDone, 900); return()=>clearTimeout(id); }, [onDone]);
  return (
    <div style={{
      position:"fixed", left:x, top:y, zIndex:250,
      fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#fbbf24",
      letterSpacing:".08em", pointerEvents:"none",
      animation:"xpFloat .9s ease-out forwards",
      filter:"drop-shadow(0 0 6px #fbbf2488)",
    }}>+{amount} XP</div>
  );
}

// ── COACH CARD ────────────────────────────────────────────────────────────────
function buildSuggestions({ history, progression, settings, exConfig, workoutKey }) {
  const workout = WORKOUTS[workoutKey];
  const suggs = [];
  const today = todayName();

  // Streak
  const sorted = [...history].sort((a,b)=>b.timestamp-a.timestamp);
  let streak=0;
  if(sorted.length>0){streak=1;for(let i=1;i<sorted.length;i++){if((sorted[i-1].timestamp-sorted[i].timestamp)/86400000<=4.5)streak++;else break;}}
  if(streak>=3&&streak<7) suggs.push({icon:"🔥",cat:"Streak",msg:`${streak} sessions running. Consistency compounds.`});
  if(streak>=7)            suggs.push({icon:"⚡",cat:"Streak",msg:`${streak}-session streak. You're in elite territory.`});

  // Upcoming weight progressions
  workout.exercises.forEach(ex=>{
    const cfg = exConfig[ex.name]||{weight:DEFAULT_WEIGHTS[ex.name]||15};
    if(cfg.nextWeight&&cfg.nextWeight>cfg.weight)
      suggs.push({icon:"↗️",cat:"Load",msg:`${ex.name}: target ${ex.baseReps} reps at ${cfg.nextWeight}lbs today to confirm progression.`});
  });

  // Rep progression near-miss
  workout.exercises.forEach(ex=>{
    const left = settings.sessionsPerProgression-(progression[ex.name]?.sessions||0);
    if(left===1&&(progression[ex.name]?.repBonus||0)<settings.maxRepBonus)
      suggs.push({icon:"📈",cat:"Progress",msg:`${ex.name}: 1 more full session → +1 rep auto-unlock.`});
  });

  const FORM={A:[
    {icon:"🦵",cat:"Form",msg:"Goblet Squat: drive elbows between knees at the bottom. Creates a natural brace."},
    {icon:"💪",cat:"Form",msg:"Floor Press: pause 0.5s at chest. Control beats momentum every time."},
    {icon:"🔙",cat:"Form",msg:"Row: think 'elbow to back pocket', not hand to hip. Lats do the work."},
    {icon:"🙌",cat:"Form",msg:"Arnold Press: rotate through the full arc. That rotation IS the point — don't skip it."},
    {icon:"💪",cat:"Form",msg:"Hammer Curl: 3s down on every rep. The eccentric is where the muscle grows."},
  ],B:[
    {icon:"🍑",cat:"Form",msg:"RDL: push hips BACK before bending. Feel the hamstring stretch before pulling."},
    {icon:"⚡",cat:"Form",msg:"Kickback: freeze your upper arm. If it drops, the weight is too heavy."},
    {icon:"🦵",cat:"Form",msg:"Lunge: step far enough back that front shin stays vertical at the bottom."},
    {icon:"🔙",cat:"Form",msg:"Rear Delt Row: lead with your pinky. Isolates rear delts vs biceps."},
    {icon:"🦵",cat:"Form",msg:"Calf Raise: pause 2s at top. A rushed range of motion does nothing for growth."},
  ]};
  const tips=FORM[workoutKey]||[];
  const pick=tips[(new Date().getDate())%tips.length];
  if(pick) suggs.push(pick);

  if(!DAYS.includes(today))
    suggs.push({icon:"🛌",cat:"Recovery",msg:"Rest day. Muscle grows during recovery. Protein + sleep > extra sets."});
  if(history.length===0)
    suggs.push({icon:"🌱",cat:"Welcome",msg:"Focus on feeling each muscle work — not on moving weight fast. Form now = gains forever."});

  return suggs.filter(Boolean);
}

function CoachCard({ suggestions, accent }) {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  if (!suggestions.length) return null;
  const s = suggestions[idx];
  const cc = {Milestone:"#fbbf24",Streak:"#fb923c",Form:"#60a5fa",Progress:accent,Load:accent,Recovery:"#a78bfa",Welcome:accent}[s.cat]||accent;
  return (
    <div style={{margin:"0 16px 18px",padding:"16px 18px",background:"#0e0e0e",border:`1.5px solid ${cc}44`,borderRadius:14,boxShadow:`0 0 28px ${cc}15`}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <span style={{fontSize:28,flexShrink:0,marginTop:1}}>{s.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:cc,letterSpacing:".14em",textTransform:"uppercase",marginBottom:5,fontWeight:500}}>{s.cat}</div>
          <div key={key} style={{fontSize:15,color:"#eee",lineHeight:1.55,animation:"coachSlide .3s ease-out"}}>{s.msg}</div>
        </div>
        {suggestions.length>1&&(
          <button onClick={()=>{setIdx(i=>(i+1)%suggestions.length);setKey(k=>k+1);}}
            style={{background:"transparent",border:`1px solid ${cc}44`,color:cc,borderRadius:8,padding:"8px 12px",fontSize:14,flexShrink:0,alignSelf:"center"}}>→</button>
        )}
      </div>
      {suggestions.length>1&&(
        <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:12}}>
          {suggestions.map((_,i)=>(
            <div key={i} onClick={()=>{setIdx(i);setKey(k=>k+1);}}
              style={{width:i===idx?18:6,height:5,borderRadius:3,background:i===idx?cc:"#333",transition:"all .25s",cursor:"pointer"}}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SET LOGGER (pops above rest timer) ───────────────────────────────────────
function SetLogger({ exerciseName, setNum, defaultWeight, defaultReps, accent, onSave, onSkip }) {
  const [weight, setWeight] = useState(defaultWeight);
  const [reps,   setReps]   = useState(defaultReps);
  const inc = 0.25; // increment step

  return (
    <div style={{
      position:"fixed", bottom:82, left:0, right:0, zIndex:105,
      background:"#0a0a0a", borderTop:`1.5px solid ${accent}99`,
      padding:"14px 18px 12px",
      boxShadow:`0 -8px 32px ${accent}44`,
      animation:"slideUp .22s ease-out",
    }}>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <div style={{fontSize:12,color:accent,letterSpacing:".14em",textTransform:"uppercase",marginBottom:12,fontWeight:500}}>
          Log Set {setNum} · {exerciseName}
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          {/* Weight stepper */}
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#888",letterSpacing:".1em",marginBottom:6}}>WEIGHT (lbs)</div>
            <div style={{display:"flex",alignItems:"center",gap:0,background:"#141414",borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setWeight(w=>Math.max(w-2.5,0))}
                style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,fontWeight:300}}>−</button>
              <div style={{flex:1,textAlign:"center",fontSize:18,fontWeight:500,color:"#fff"}}>{weight}</div>
              <button onClick={()=>setWeight(w=>w+2.5)}
                style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,fontWeight:300}}>+</button>
            </div>
          </div>
          {/* Reps stepper */}
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#888",letterSpacing:".1em",marginBottom:6}}>REPS DONE</div>
            <div style={{display:"flex",alignItems:"center",gap:0,background:"#141414",borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setReps(r=>Math.max(r-1,0))}
                style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,fontWeight:300}}>−</button>
              <div style={{flex:1,textAlign:"center",fontSize:18,fontWeight:500,color:"#fff"}}>{reps}</div>
              <button onClick={()=>setReps(r=>r+1)}
                style={{width:44,height:46,background:"transparent",border:"none",color:"#ccc",fontSize:20,fontWeight:300}}>+</button>
            </div>
          </div>
          {/* Save */}
          <button onClick={()=>onSave({weight,reps})}
            style={{width:56,height:46,background:accent,border:"none",borderRadius:10,color:"#0a0a0a",fontSize:13,fontWeight:700,letterSpacing:".04em",flexShrink:0,alignSelf:"flex-end",boxShadow:`0 0 16px ${accent}66`}}>
            LOG
          </button>
        </div>
        <button onClick={onSkip}
          style={{background:"none",border:"none",color:"#666",fontSize:12,letterSpacing:".08em",marginTop:10,width:"100%",textAlign:"center",padding:4}}>
          skip logging
        </button>
      </div>
    </div>
  );
}

// ── CHECK-IN MODAL ────────────────────────────────────────────────────────────
function CheckInModal({ workout, exConfig, settings, onSave, onDismiss, accent }) {
  const [selected, setSelected] = useState(workout.exercises[0].name);
  const [weight,   setWeight]   = useState(null);
  const [maxReps,  setMaxReps]  = useState(1);

  useEffect(() => {
    const ex = workout.exercises.find(e=>e.name===selected);
    setWeight((exConfig[selected]?.weight) || DEFAULT_WEIGHTS[selected] || settings.dumbbellWeight);
  },[selected,exConfig,settings.dumbbellWeight]);

  const est = epley1RM(weight||0, maxReps);

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{
        width:"100%",maxWidth:520,
        background:"#0d0d0d",borderTop:`2px solid ${accent}`,borderRadius:"18px 18px 0 0",
        padding:"24px 20px 32px",animation:"slideUp .3s ease-out",
      }}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:accent,letterSpacing:".08em",marginBottom:4}}>BI-WEEKLY CHECK-IN</div>
        <div style={{fontSize:14,color:"#bbb",marginBottom:20,lineHeight:1.5}}>
          Pick an exercise, go to failure at your current weight, and log how many reps you got. This calibrates your progression.
        </div>

        {/* Exercise selector */}
        <div style={{fontSize:12,color:"#aaa",letterSpacing:".12em",marginBottom:8}}>EXERCISE</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:18}}>
          {workout.exercises.map(ex=>(
            <button key={ex.name} onClick={()=>setSelected(ex.name)}
              style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${selected===ex.name?accent:accent+"33"}`,background:selected===ex.name?`${accent}22`:"transparent",color:selected===ex.name?accent:"#aaa",fontSize:13,fontWeight:selected===ex.name?500:400}}>
              {ex.name.split(" ").slice(-1)[0]}
            </button>
          ))}
        </div>

        {/* Weight */}
        <div style={{display:"flex",gap:12,marginBottom:18}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:"#aaa",letterSpacing:".12em",marginBottom:8}}>WEIGHT USED (lbs)</div>
            <div style={{display:"flex",alignItems:"center",background:"#141414",borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setWeight(w=>Math.max((w||0)-2.5,0))} style={{width:48,height:50,background:"transparent",border:"none",color:"#ccc",fontSize:22}}>−</button>
              <div style={{flex:1,textAlign:"center",fontSize:20,fontWeight:500,color:"#fff"}}>{weight}</div>
              <button onClick={()=>setWeight(w=>(w||0)+2.5)} style={{width:48,height:50,background:"transparent",border:"none",color:"#ccc",fontSize:22}}>+</button>
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:"#aaa",letterSpacing:".12em",marginBottom:8}}>MAX REPS (to failure)</div>
            <div style={{display:"flex",alignItems:"center",background:"#141414",borderRadius:10,border:`1px solid ${accent}33`,overflow:"hidden"}}>
              <button onClick={()=>setMaxReps(r=>Math.max(r-1,1))} style={{width:48,height:50,background:"transparent",border:"none",color:"#ccc",fontSize:22}}>−</button>
              <div style={{flex:1,textAlign:"center",fontSize:20,fontWeight:500,color:"#fff"}}>{maxReps}</div>
              <button onClick={()=>setMaxReps(r=>r+1)} style={{width:48,height:50,background:"transparent",border:"none",color:"#ccc",fontSize:22}}>+</button>
            </div>
          </div>
        </div>

        {/* 1RM estimate */}
        <div style={{padding:"14px 16px",background:`${accent}12`,borderRadius:11,border:`1px solid ${accent}44`,marginBottom:20,textAlign:"center"}}>
          <div style={{fontSize:12,color:accent,letterSpacing:".14em",marginBottom:4}}>ESTIMATED 1-REP MAX</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:"#fff",letterSpacing:".06em"}}>{est} LBS</div>
          <div style={{fontSize:12,color:"#888",marginTop:2}}>Epley formula · {weight}lbs × {maxReps} reps</div>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onSave({exercise:selected,weight,maxReps,est1RM:est})}
            style={{flex:2,padding:"16px",background:accent,border:"none",borderRadius:12,color:"#0a0a0a",fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:".1em",boxShadow:`0 0 24px ${accent}66`}}>
            SAVE CHECK-IN
          </button>
          <button onClick={onDismiss}
            style={{flex:1,padding:"16px",background:"transparent",border:"1px solid #333",borderRadius:12,color:"#888",fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".08em"}}>
            LATER
          </button>
        </div>
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
          const wk=WORKOUTS[SCHEDULE[day]];
          const isDone=!!completed[day],isToday=day===today;
          return(
            <button key={day} onClick={()=>setActiveTab(day)}
              style={{flex:1,padding:"16px 8px",borderRadius:13,border:"none",
                background:isDone?`${wk.color}25`:isToday?"#161616":"#0d0d0d",
                outline:isToday?`2px solid ${wk.color}99`:isDone?`1px solid ${wk.color}55`:"1px solid #1e1e1e",
                cursor:"pointer",transition:"all .2s",textAlign:"center"}}>
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
}) {
  const [activeTab,   setActiveTab]  = useState(()=>DAYS.includes(todayName())?todayName():"Monday");
  const [expanded,    setExpanded]   = useState(null);
  const [restState,   setRestState]  = useState(null);
  const [loggerState, setLoggerState]= useState(null); // { exIdx, setIdx }
  const [toast,       setToast]      = useState(null);
  const [confetti,    setConfetti]   = useState(false);
  const [bounceSets,  setBounceSets] = useState({});
  const [xpFloats,    setXpFloats]   = useState([]);
  const [showCheckIn, setShowCheckIn]= useState(false);
  const [sessionLogs, setSessionLogs]= useState({});// key: exIdx_setIdx => {weight,reps}

  const wKey    = SCHEDULE[activeTab];
  const workout = WORKOUTS[wKey];
  const accent  = workout.color;

  const setKey  = (i,j) => `${activeTab}_${i}_${j}`;
  const setDone = (i,j) => !!sets[setKey(i,j)];
  const exDone  = (i)   => Array.from({length:workout.exercises[i].sets},(_,j)=>setDone(i,j)).every(Boolean);
  const totalSets = workout.exercises.reduce((a,e)=>a+e.sets,0);
  const doneSets  = workout.exercises.reduce((a,ex,i)=>a+Array.from({length:ex.sets},(_,j)=>setDone(i,j)?1:0).reduce((x,y)=>x+y,0),0);
  const allDone   = doneSets===totalSets;
  const isCompleted = !!completed[activeTab];

  const sessionRunning = doneSets>0&&!isCompleted;
  const sessionElapsed = useSessionTimer(sessionRunning);

  const getRepBonus = n => progression[n]?.repBonus||0;
  const getSessions = n => progression[n]?.sessions||0;
  const getReps     = ex => ex.baseReps+getRepBonus(ex.name);
  const getWeight   = n => exConfig[n]?.weight || DEFAULT_WEIGHTS[n] || settings.dumbbellWeight;
  const getNextW    = n => exConfig[n]?.nextWeight;

  // Check if check-in is due (every 14 days)
  const lastCheckIn = checkIns.length ? checkIns[checkIns.length-1].timestamp : null;
  const checkInDue  = !lastCheckIn || (Date.now()-lastCheckIn) > 14*86400000;

  // Streak
  const streak = (() => {
    if(!history.length) return 0;
    const s=[...history].sort((a,b)=>b.timestamp-a.timestamp);
    let r=1; for(let i=1;i<s.length;i++){if((s[i-1].timestamp-s[i].timestamp)/86400000<=4.5)r++;else break;}
    return r;
  })();

  const suggestions = buildSuggestions({history,progression,settings,exConfig,workoutKey:wKey});

  // Spawn XP float
  const spawnXp = (amount) => {
    addXp(amount);
    setXpFloats(f=>[...f,{id:Date.now(),amount,x:window.innerWidth*.55,y:window.innerHeight*.5}]);
  };

  const toggleSet = (i,j) => {
    const k   = setKey(i,j);
    const was = !!sets[k];
    setSets(p=>({...p,[k]:!was}));
    if(!was){
      playSound("setComplete");
      vibrate([28]);
      // Bounce
      const bk=`${i}_${j}`;
      setBounceSets(p=>({...p,[bk]:true}));
      setTimeout(()=>setBounceSets(p=>{const n={...p};delete n[bk];return n;}),500);
      // Show logger above rest timer
      const ex=workout.exercises[i];
      setLoggerState({exIdx:i,setIdx:j,weight:getWeight(ex.name),reps:getReps(ex)});
      // Queue rest timer (will show after logger save/skip)
      const remaining=ex.sets-(j+1);
      const next=remaining>0?`Set ${j+2} of ${ex.name}`:i+1<workout.exercises.length?`Up next: ${workout.exercises[i+1].name}`:"Last set! Finish when ready.";
      setRestState({label:next,accent});
    } else {
      playSound("uncheck");
    }
  };

  const saveLog = ({weight,reps}) => {
    if(!loggerState) return;
    const {exIdx,setIdx}=loggerState;
    setSessionLogs(p=>({...p,[`${exIdx}_${setIdx}`]:{weight,reps}}));
    spawnXp(XP_VALUES.set);
    setLoggerState(null);
  };

  const skipLog = () => {
    if(!loggerState) return;
    const {exIdx,setIdx}=loggerState;
    const ex=workout.exercises[exIdx];
    setSessionLogs(p=>({...p,[`${exIdx}_${setIdx}`]:{weight:getWeight(ex.name),reps:getReps(ex)}}));
    spawnXp(XP_VALUES.set);
    setLoggerState(null);
  };

  const finishWorkout = () => {
    if(!allDone) return;

    // Build exercise snapshot with set logs
    const exSnap = workout.exercises.map((ex,i)=>{
      const logs=Array.from({length:ex.sets},(_,j)=>sessionLogs[`${i}_${j}`]||{weight:getWeight(ex.name),reps:getReps(ex)});
      return {name:ex.name,sets:ex.sets,reps:getReps(ex),setLog:logs};
    });

    // Progressive overload + PR detection
    const newConfig={...exConfig};
    const prs=[];
    exSnap.forEach((exS,i)=>{
      const ex=workout.exercises[i];
      const curWeight=getWeight(ex.name);
      const rec=calcNextLoad(exS.setLog,getReps(ex),curWeight,settings.weightIncrement||2.5);
      // Check PRs
      const curMax=exConfig[ex.name]?.maxWeight||0;
      const newMax=Math.max(...exS.setLog.map(l=>l.weight));
      if(newMax>curMax) prs.push({name:ex.name,type:"weight",val:newMax});
      // Update config
      newConfig[ex.name]={...newConfig[ex.name],weight:curWeight,nextWeight:rec.nextWeight,lastRec:rec.action,maxWeight:Math.max(newMax,curMax)};
    });
    setExConfig(newConfig);

    // Rep progression (old system, kept for continuity)
    const newProg={...progression};
    const unlocked=[];
    workout.exercises.forEach(ex=>{
      const cur=newProg[ex.name]||{sessions:0,repBonus:0};
      const newS=cur.sessions+1;
      let newB=cur.repBonus;
      if(newS>=settings.sessionsPerProgression&&newB<settings.maxRepBonus){
        newB+=1; unlocked.push(`${ex.name} → ×${ex.baseReps+newB}`);
        newProg[ex.name]={sessions:0,repBonus:newB};
      } else if(newS>=settings.sessionsPerProgression){
        newProg[ex.name]={sessions:0,repBonus:newB};
      } else {
        newProg[ex.name]={sessions:newS,repBonus:newB};
      }
    });
    setProgression(newProg);

    // Save history
    setHistory(p=>[{day:activeTab,workout:wKey,date:dateStr(),timestamp:Date.now(),duration:sessionElapsed,exercises:exSnap},...p].slice(0,120));
    setCompleted(p=>({...p,[activeTab]:dateStr()}));
    setSessionLogs({});
    setRestState(null);
    setLoggerState(null);
    playSound("workoutDone");
    vibrate([100,60,100]);
    setConfetti(true);
    spawnXp(XP_VALUES.workout);

    if(prs.length) {
      setTimeout(()=>{
        playSound("achievement");
        setToast({icon:"🏆",title:"PERSONAL RECORD",msg:`New max: ${prs.map(p=>`${p.name} ${p.val}lbs`).join(", ")}`,accent:"#fbbf24"});
      },600);
    }
    if(unlocked.length){
      setTimeout(()=>{
        playSound("progression");
        setToast({icon:"↗️",title:"REPS INCREASED",msg:unlocked.length===1?unlocked[0]:`+1 rep on ${unlocked.length} exercises`,accent});
      },unlocked.length&&prs.length?1800:800);
    }

    // Check-in prompt
    if(checkInDue && history.length > 0) {
      setTimeout(()=>setShowCheckIn(true), 2400);
    }
  };

  const saveCheckIn = (data) => {
    setCheckIns(p=>[...p,{...data,timestamp:Date.now(),date:dateStr()}]);
    spawnXp(XP_VALUES.checkin);
    setShowCheckIn(false);
    setToast({icon:"📊",title:"CHECK-IN SAVED",msg:`${data.exercise}: ~${data.est1RM}lbs estimated 1RM`,accent});
  };

  const resetDay = () => {
    if(!confirm("Reset today's sets?")) return;
    const n={...sets};
    workout.exercises.forEach((_,i)=>Array.from({length:workout.exercises[i].sets},(_,j)=>{delete n[setKey(i,j)];}));
    setSets(n);
    setCompleted(p=>{const n2={...p};delete n2[activeTab];return n2;});
    setExpanded(null); setRestState(null); setLoggerState(null); setSessionLogs({});
  };

  return (
    <div>
      {/* XP Floats */}
      {xpFloats.map(f=>(
        <XpFloat key={f.id} amount={f.amount} x={f.x} y={f.y} onDone={()=>setXpFloats(p=>p.filter(x=>x.id!==f.id))}/>
      ))}

      {/* HEADER */}
      <div style={{padding:"34px 16px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".06em",lineHeight:.88,color:"#fafafa"}}>LIFT LOG</div>
            <div style={{fontSize:13,color:"#999",marginTop:7,letterSpacing:".1em"}}>
              {level.badge} {level.name.toUpperCase()} · LV.{level.idx+1}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            {sessionRunning?(
              <>
                <div style={{fontSize:11,color:"#888",letterSpacing:".12em"}}>SESSION</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:accent,marginTop:2,filter:`drop-shadow(0 0 8px ${accent}99)`}}>{fmtDuration(sessionElapsed)}</div>
              </>
            ):streak>0?(
              <>
                <div style={{fontSize:11,color:"#888",letterSpacing:".1em"}}>STREAK</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#fb923c",marginTop:2,filter:"drop-shadow(0 0 8px #fb923c88)"}}>{streak} 🔥</div>
              </>
            ):null}
          </div>
        </div>

        {/* XP bar */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:level.color,fontWeight:500,letterSpacing:".06em"}}>{level.badge} {level.name}</span>
            <span style={{fontSize:12,color:"#888"}}>{level.next?`${xp} / ${level.next.min} XP`:"MAX LEVEL"}</span>
          </div>
          <div style={{height:7,background:"#1a1a1a",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${level.pct*100}%`,background:`linear-gradient(90deg,${level.color}aa,${level.color})`,transition:"width .5s ease",boxShadow:`0 0 10px ${level.color}88`}}/>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:8}}>
          <StatCard label="Sessions" value={history.length}/>
          <StatCard label="Workout"  value={workout.label.split(" ")[1]} accent={accent}/>
          <StatCard label="Today"    value={DAYS.includes(todayName())?todayName().slice(0,3).toUpperCase():"REST"}/>
        </div>
      </div>

      {/* COACH */}
      <CoachCard suggestions={suggestions} accent={accent}/>

      {/* CHECK-IN BADGE */}
      {checkInDue&&history.length>0&&!isCompleted&&(
        <button onClick={()=>setShowCheckIn(true)}
          style={{display:"flex",alignItems:"center",gap:12,width:"calc(100% - 32px)",margin:"0 16px 16px",padding:"14px 18px",background:"#0e0e12",border:"1.5px solid #a78bfa66",borderRadius:13,cursor:"pointer",textAlign:"left"}}>
          <span style={{fontSize:24}}>📊</span>
          <div>
            <div style={{fontSize:14,color:"#a78bfa",fontWeight:500,marginBottom:2}}>Bi-Weekly Check-In Available</div>
            <div style={{fontSize:12,color:"#888",lineHeight:1.4}}>Test your max reps to calibrate your progression</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:18,color:"#a78bfa"}}>→</span>
        </button>
      )}

      {/* DAY TABS */}
      <div style={{display:"flex",borderTop:"1px solid #1a1a1a",borderBottom:"1px solid #1a1a1a",background:"#080808"}}>
        {DAYS.map(day=>{
          const isActive=activeTab===day;
          const dc=WORKOUTS[SCHEDULE[day]].color;
          return(
            <button key={day} onClick={()=>{setActiveTab(day);setExpanded(null);}}
              style={{flex:1,padding:"16px 4px",background:"transparent",border:"none",color:isActive?dc:"#888",fontSize:14,letterSpacing:".1em",fontWeight:600,borderBottom:`2.5px solid ${isActive?dc:"transparent"}`,transition:"all .2s",textTransform:"uppercase"}}>
              {day.slice(0,3)}
              {completed[day]&&<div style={{fontSize:10,color:dc,marginTop:2}}>✓</div>}
            </button>
          );
        })}
      </div>

      {/* WORKOUT META */}
      <div style={{padding:"18px 16px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:accent,letterSpacing:".06em",filter:`drop-shadow(0 0 10px ${accent}66)`}}>{workout.label}</span>
          <button onClick={resetDay} style={{background:"none",border:"1px solid #2c2c2c",borderRadius:8,color:"#aaa",fontSize:12,padding:"8px 16px",letterSpacing:".08em"}}>RESET</button>
        </div>
        <div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
            <span style={{fontSize:13,color:"#aaa",letterSpacing:".1em"}}>PROGRESS</span>
            <span style={{fontSize:13,color:doneSets>0?accent:"#aaa"}}>{doneSets}/{totalSets} sets</span>
          </div>
          <div style={{height:7,background:"#1a1a1a",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(doneSets/totalSets)*100}%`,background:`linear-gradient(90deg,${accent}bb,${accent})`,transition:"width .4s ease",boxShadow:doneSets>0?`0 0 14px ${accent}bb`:"none"}}/>
          </div>
        </div>
      </div>

      {/* EXERCISES */}
      <div>
        {workout.exercises.map((ex,i)=>{
          const open   = expanded===i;
          const reps   = getReps(ex);
          const bonus  = getRepBonus(ex.name);
          const sess   = getSessions(ex.name);
          const atMax  = bonus>=settings.maxRepBonus;
          const done   = exDone(i);
          const curW   = getWeight(ex.name);
          const nextW  = getNextW(ex.name);
          const hasNxtW= nextW&&nextW>curW;

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
                    <span>{ex.sets} × {ex.repLabel}{reps}{ex.repSuffix||""}</span>
                    <span style={{color:"#666"}}>@ {curW}lbs</span>
                    {hasNxtW&&<span style={{color:accent,fontSize:12,padding:"2px 7px",borderRadius:5,background:`${accent}18`,fontWeight:500}}>next: {nextW}lbs</span>}
                    {bonus>0&&<span style={{color:accent,fontSize:12,padding:"2px 7px",borderRadius:5,background:`${accent}18`,fontWeight:500}}>↑rep+{bonus}{atMax?" MAX":""}</span>}
                  </div>
                </div>
                {/* SET BUTTONS */}
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  {Array.from({length:ex.sets},(_,j)=>{
                    const isDone=setDone(i,j);
                    const bk=`${i}_${j}`;
                    const logged=sessionLogs[`${i}_${j}`];
                    return(
                      <button key={j} onClick={()=>toggleSet(i,j)}
                        style={{width:48,height:48,borderRadius:11,border:`1.5px solid ${isDone?accent:"#3a3a3a"}`,background:isDone?`${accent}25`:"#0d0d0d",color:isDone?accent:"#999",fontSize:isDone&&logged?11:14,fontWeight:500,transition:!!bounceSets[bk]?"none":"all .18s",boxShadow:isDone?`0 0 12px ${accent}55,inset 0 0 8px ${accent}22`:"none",animation:!!bounceSets[bk]?"setBounce .4s ease-out":"none",lineHeight:1.1}}>
                        {isDone?(logged?`${logged.reps}r`:"✓"):j+1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EXPANDED PANEL */}
              {open&&(
                <div style={{marginTop:18,padding:18,background:"linear-gradient(180deg,#0e0e0e,#090909)",border:"1px solid #232323",borderRadius:14,animation:"slideDown .25s ease-out"}}>
                  <SLabel>Animation</SLabel>
                  <ExerciseAnimation folder={ex.folder} accent={accent}/>

                  <div style={{marginTop:16,padding:"13px 16px",background:"#080808",borderRadius:10,border:`1.5px solid ${accent}33`}}>
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
                      <button onClick={()=>setExConfig(p=>({...p,[ex.name]:{...p[ex.name],weight:Math.max((p[ex.name]?.weight||curW)-2.5,0)}}))}
                        style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>−</button>
                      <div style={{flex:1,textAlign:"center",fontSize:20,fontWeight:500,color:"#fff"}}>{curW} lbs</div>
                      <button onClick={()=>setExConfig(p=>({...p,[ex.name]:{...p[ex.name],weight:(p[ex.name]?.weight||curW)+2.5}}))}
                        style={{width:52,height:52,background:"transparent",border:"none",color:"#ccc",fontSize:24}}>+</button>
                    </div>
                    <div style={{fontSize:12,color:"#888",marginTop:8,lineHeight:1.5}}>
                      {hasNxtW?"System suggests adding 2.5lbs based on last session. Try the higher weight today.":atMax?"Reps are maxed. Focus on adding weight progressively.":"Hit all reps at this weight → system will suggest +2.5lbs next session."}
                    </div>
                  </div>

                  {/* Rep progression */}
                  <div style={{marginTop:12,padding:"14px 16px",background:"#080808",borderRadius:10,border:"1px solid #1f1f1f"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <SLabel small>Rep Progression</SLabel>
                      <span style={{fontSize:12,color:atMax?accent:"#bbb"}}>{atMax?"🏆 MAX":`${sess}/${settings.sessionsPerProgression}`}</span>
                    </div>
                    <div style={{height:5,background:"#1a1a1a",borderRadius:3,overflow:"hidden",marginTop:8}}>
                      <div style={{height:"100%",width:`${(sess/settings.sessionsPerProgression)*100}%`,background:accent,transition:"width .4s"}}/>
                    </div>
                    <div style={{fontSize:12,color:"#888",marginTop:8,lineHeight:1.5}}>
                      {atMax?"All reps maxed. Keep adding weight.":` ${settings.sessionsPerProgression-sess} more session${settings.sessionsPerProgression-sess===1?"":"s"} → ×${reps+1} reps`}
                    </div>
                  </div>

                  {/* Session logs for this exercise */}
                  {Array.from({length:ex.sets},(_,j)=>sessionLogs[`${i}_${j}`]).some(Boolean)&&(
                    <div style={{marginTop:12,padding:"14px 16px",background:"#080808",borderRadius:10,border:`1px solid ${accent}22`}}>
                      <SLabel small>Today's Sets</SLabel>
                      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                        {Array.from({length:ex.sets},(_,j)=>{
                          const lg=sessionLogs[`${i}_${j}`];
                          return lg?(
                            <div key={j} style={{padding:"8px 12px",background:`${accent}15`,borderRadius:8,border:`1px solid ${accent}44`,fontSize:13,color:accent,fontWeight:500}}>
                              S{j+1}: {lg.weight}lbs × {lg.reps}
                            </div>
                          ):null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FINISH BUTTON */}
      <div style={{margin:"28px 16px 0"}}>
        {isCompleted?(
          <div style={{textAlign:"center",padding:"24px 20px",background:`${accent}12`,borderRadius:15,border:`1.5px solid ${accent}55`,boxShadow:`0 0 44px ${accent}22`,animation:"completePulse 1s ease-out","--glow":`${accent}55`}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:accent,letterSpacing:".1em"}}>✓ DONE · {completed[activeTab]}</div>
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

      {/* HISTORY */}
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
          {history.length>4&&(
            <button onClick={()=>setActiveView("calendar")}
              style={{background:"none",border:"1px solid #2c2c2c",borderRadius:9,color:"#bbb",padding:"12px 18px",fontSize:13,letterSpacing:".1em",marginTop:14,fontFamily:"DM Mono,monospace"}}>
              VIEW ALL → CALENDAR
            </button>
          )}
        </div>
      )}
      <div style={{height:32}}/>

      {/* OVERLAYS */}
      {loggerState&&(
        <SetLogger
          exerciseName={workout.exercises[loggerState.exIdx].name}
          setNum={loggerState.setIdx+1}
          defaultWeight={loggerState.weight}
          defaultReps={loggerState.reps}
          accent={accent}
          onSave={saveLog}
          onSkip={skipLog}
        />
      )}
      {restState&&!loggerState&&(
        <RestTimer seconds={settings.restSeconds} label={restState.label} accent={restState.accent}
          onSkip={()=>setRestState(null)}
          onComplete={()=>{setRestState(null);playSound("restEnd");vibrate([200,60,200]);}}/>
      )}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      {showCheckIn&&(
        <CheckInModal workout={workout} exConfig={exConfig} settings={settings} accent={accent}
          onSave={saveCheckIn} onDismiss={()=>setShowCheckIn(false)}/>
      )}
      <Confetti active={confetti} accent={accent} onDone={()=>setConfetti(false)}/>
    </div>
  );
}

function StatCard({label,value,accent}){
  return(
    <div style={{flex:1,padding:"14px 14px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:11}}>
      <div style={{fontSize:11,color:"#aaa",letterSpacing:".14em",textTransform:"uppercase"}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:accent||"#fafafa",marginTop:3,letterSpacing:".04em"}}>{value}</div>
    </div>
  );
}
function SLabel({children,small}){
  return(
    <div style={{fontSize:small?10:11,color:"#aaa",letterSpacing:".16em",textTransform:"uppercase",fontWeight:500,marginBottom:small?0:9}}>{children}</div>
  );
}

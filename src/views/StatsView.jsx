import { useState } from "react";
import { WORKOUTS, ACHIEVEMENTS, computeStats, isoWeek, getLevel, epley1RM, getExerciseHistory, customRoutineWorkout, routineBalanceScore, routineCoverage } from "../data.js";
import { BarChart, Heatmap, MiniGraph } from "../components/shared.jsx";
import { fmtDuration } from "../hooks.js";
import { exerciseVolume } from "../session.js";
import { buildCoachMemory, buildWeeklyReview, computePersonalRecords, detectWeakPoints } from "../coach.js";

export default function StatsView({ history, progression, settings, achievements, accent, xp, level, exConfig, checkIns, bodyMetrics = [], setBodyMetrics, customRoutine, userProfile = null, goals = [] }) {
  const [tab, setTab] = useState("overview");

  const stats = computeStats({ history, progression, settings });
  const allExercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises, ...(customRoutine?.enabled ? customRoutineWorkout(customRoutine).exercises : [])];
  const customWorkout = customRoutine?.enabled ? customRoutineWorkout(customRoutine) : null;
  const balance = customWorkout ? routineBalanceScore(customWorkout.exercises) : null;
  const coachMemory = buildCoachMemory({ history, checkIns, exercises: allExercises, exConfig, userProfile, goals, bodyMetrics });
  const weeklyReview = buildWeeklyReview({ history, checkIns });
  const weakPoints = detectWeakPoints({ history, exercises: allExercises, exConfig });
  const records = computePersonalRecords({ history });

  // Sessions per week chart (last 8 weeks)
  const weekData = (() => {
    const now=new Date(), weeks=[];
    for(let i=7;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i*7);weeks.push(isoWeek(d));}
    return weeks.map((w,i)=>{
      const count=(stats.weekDays[w]||new Set()).size;
      return{label:i===7?"now":`−${7-i}w`,value:count,color:count>=3?"#4ade80":count>=2?"#60a5fa":"#2a2a2a"};
    });
  })();

  // Weekly volume chart (last 8 weeks)
  const weekVolumeData = (() => {
    const now = new Date(), weeks = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weeks.push(isoWeek(d));
    }
    return weeks.map((w, i) => {
      const weekSessions = history.filter(h => isoWeek(new Date(h.timestamp)) === w);
      const vol = weekSessions.reduce((sum, h) => {
        if (h.exercises) return sum + h.exercises.reduce((s, ex) => s + exerciseVolume(ex, settings.dumbbellWeight), 0);
        const wk = WORKOUTS[h.workout];
        if (!wk) return sum;
        return sum + wk.exercises.reduce((s, ex) => {
          const reps = ex.baseReps + (progression[ex.name]?.repBonus || 0);
          return s + (reps * ex.sets * settings.dumbbellWeight * (ex.name === "Goblet Squat" ? 1 : 2));
        }, 0);
      }, 0);
      const color = vol > 5000 ? "#4ade80" : vol > 1000 ? accent : vol > 0 ? "#60a5fa" : "#2a2a2a";
      return { label: i === 7 ? "now" : `-${7 - i}w`, value: vol, color };
    });
  })();

  const totalVolume = history.reduce((sum,h)=>{
    if(h.exercises){
      return sum+h.exercises.reduce((s,ex)=>{
        return s+exerciseVolume(ex, settings.dumbbellWeight);
      },0);
    }
    const w=WORKOUTS[h.workout];
    if(!w) return sum;
    return sum+w.exercises.reduce((s,ex)=>{
      const reps=ex.baseReps+(progression[ex.name]?.repBonus||0);
      return s+(reps*ex.sets*settings.dumbbellWeight*(ex.name==="Goblet Squat"?1:2));
    },0);
  },0);

  const totalDuration = history.reduce((s,h)=>s+(h.duration||0),0);
  const avgDuration   = history.filter(h=>h.duration).length>0
    ? Math.floor(totalDuration/history.filter(h=>h.duration).length) : 0;

  // Check-in history grouped by exercise
  const checkInsByEx = {};
  const strengthCheckIns = (checkIns||[]).filter(ci=>ci.exercise&&ci.est1RM);
  for(const ci of strengthCheckIns){
    if(!checkInsByEx[ci.exercise]) checkInsByEx[ci.exercise]=[];
    checkInsByEx[ci.exercise].push(ci);
  }

  const nextLevel = level.next;
  const xpToNext  = nextLevel ? nextLevel.min - xp : 0;

  const TABS = [
    { id: "overview", label: "OVERVIEW" },
    { id: "lifts",    label: "LIFTS" },
    { id: "records",  label: "RECORDS" },
    { id: "body",     label: "BODY" },
  ];

  return (
    <div>
      {/* TAB BAR */}
      <div style={{padding:"12px 16px 4px",position:"sticky",top:0,zIndex:10,background:"#050505"}}>
        <div style={{display:"flex",gap:6}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{
                flex:1,padding:"9px 4px",borderRadius:999,border:tab===t.id?"none":"1px solid #333",
                background:tab===t.id?accent:"transparent",
                color:tab===t.id?"#050505":"#888",
                fontSize:11,fontWeight:800,letterSpacing:".08em",cursor:"pointer",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {tab==="overview"&&(
        <div>
          {/* HEADER */}
          <div style={{padding:"34px 16px 18px"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".06em",lineHeight:.88,color:"#fafafa"}}>STATS</div>
            <div style={{fontSize:13,color:"#999",marginTop:7,letterSpacing:".1em",textTransform:"uppercase"}}>your numbers</div>
          </div>

          {/* KEY STAT GRID */}
          <div style={{padding:"0 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
            <BigStat label="Total Sessions" value={stats.totalSessions} accent="#4ade80"/>
            <BigStat label="Current Streak" value={stats.streak} suffix={stats.streak>1?"🔥":""} accent="#fb923c"/>
            <BigStat label="Volume Lifted"  value={`${(totalVolume/1000).toFixed(1)}K`} unit="LBS" accent="#60a5fa"/>
            <BigStat label="Time Lifting"   value={fmtDuration(totalDuration)} accent="#a78bfa"/>
          </div>

          {/* LEVEL CARD */}
          <div style={{margin:"16px 16px 4px",padding:"20px 18px",background:"#0d0d0d",borderRadius:15,border:`1.5px solid ${level.color}44`,boxShadow:`0 0 32px ${level.color}18`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{fontSize:13,color:"#888",letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>Current Level</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:level.color,letterSpacing:".06em",filter:`drop-shadow(0 0 10px ${level.color}66)`}}>
                  {level.badge} {level.name}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:"#fff",letterSpacing:".04em",lineHeight:1}}>{xp}</div>
                <div style={{fontSize:12,color:"#888",letterSpacing:".1em"}}>TOTAL XP</div>
              </div>
            </div>
            <div style={{height:8,background:"#1a1a1a",borderRadius:4,overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:`${level.pct*100}%`,background:`linear-gradient(90deg,${level.color}aa,${level.color})`,boxShadow:`0 0 12px ${level.color}88`,transition:"width .5s"}}/>
            </div>
            {nextLevel?(
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888"}}>
                <span>{level.name}</span>
                <span style={{color:level.color}}>{xpToNext} XP to {nextLevel.name}</span>
              </div>
            ):<div style={{fontSize:13,color:level.color,textAlign:"center"}}>🏆 Maximum Level Reached</div>}
          </div>

          {/* TRAINING CALENDAR */}
          <Section title="Training Calendar" sub="last 12 weeks">
            <div style={{padding:"14px",background:"#0d0d0d",borderRadius:12,border:"1px solid #1c1c1c"}}>
              <Heatmap history={history} />
            </div>
          </Section>

          {/* WEEKLY REVIEW */}
          <Section title="Weekly Review" sub="last 7 days">
            <div style={{padding:"16px",background:"#0d0d0d",borderRadius:12,border:"1px solid #1f1f1f"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <MemoryPill label="Sessions" value={weeklyReview.sessions} color="#4ade80"/>
                <MemoryPill label="Consistency" value={`${weeklyReview.consistency}%`} color="#fbbf24"/>
                <MemoryPill label="Volume" value={`${Math.round(weeklyReview.volume/100)/10}K`} color="#60a5fa"/>
                <MemoryPill label="Best Lift" value={weeklyReview.best?.name || "learning"} color="#a78bfa"/>
              </div>
              <div style={{fontSize:14,color:"#ddd",lineHeight:1.55}}>{weeklyReview.focus}</div>
            </div>
          </Section>

          {/* SESSIONS PER WEEK */}
          <Section title="Sessions Per Week" sub="last 8 weeks · target 3/wk">
            <BarChart data={weekData} height={150}/>
            <div style={{display:"flex",gap:14,marginTop:10,fontSize:12,color:"#aaa",flexWrap:"wrap"}}>
              <Leg color="#4ade80" label="3+ (target)"/>
              <Leg color="#60a5fa" label="2"/>
              <Leg color="#2a2a2a" label="0–1"/>
            </div>
          </Section>

          {/* ACHIEVEMENTS */}
          <Section title="Achievements" sub={`${achievements.length} of ${ACHIEVEMENTS.length} unlocked`}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
              {ACHIEVEMENTS.map(a=>{
                const ul=achievements.includes(a.id);
                return(
                  <div key={a.id} style={{padding:"16px 12px",borderRadius:10,background:ul?"#101010":"#0a0a0a",border:`1px solid ${ul?"#fbbf2455":"#1a1a1a"}`,textAlign:"center",opacity:ul?1:.45,boxShadow:ul?"0 0 18px #fbbf2422":"none"}}>
                    <div style={{fontSize:28,marginBottom:8,filter:ul?"none":"grayscale(1) brightness(.4)"}}>{a.icon}</div>
                    <div style={{fontSize:12,color:ul?"#fbbf24":"#666",letterSpacing:".06em",fontWeight:500,marginBottom:5}}>{a.name}</div>
                    <div style={{fontSize:11,color:"#888",lineHeight:1.4}}>{a.desc}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          {history.length===0&&(
            <Section title="Getting Started" sub="your stats will fill in automatically">
              <EmptyState
                accent={accent}
                title="No sessions yet"
                body="Complete your first workout and this page will start showing coach memory, weekly review, volume, progression, and exercise graphs."
                items={["Log sets during Workout A or B", "Finish the workout summary", "Use easy/good/hard/pain notes so the coach learns faster"]}
              />
            </Section>
          )}
        </div>
      )}

      {/* LIFTS TAB */}
      {tab==="lifts"&&(
        <div>
          {/* VOLUME TREND */}
          <Section title="Weekly Volume" sub="lbs lifted per week · last 8 weeks">
            <BarChart data={weekVolumeData} height={130}/>
          </Section>

          {/* EXERCISE PROGRESS */}
          <Section title="Exercise Progress" sub="reps logged per session">
            {allExercises.map(ex=>{
              const data = getExerciseHistory(ex.name, history);
              const exColor = WORKOUTS.A.exercises.some(e=>e.name===ex.name)?WORKOUTS.A.color:WORKOUTS.B.color;
              const latestTotal = data.length ? data[data.length-1].totalReps : null;
              const trend = data.length>=2 ? data[data.length-1].totalReps - data[0].totalReps : null;
              return(
                <div key={ex.name} style={{background:"#0d0d0d",borderRadius:11,border:"1px solid #1c1c1c",marginBottom:10,padding:"13px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{fontSize:15,color:"#f0f0f0",fontWeight:500}}>{ex.name}</div>
                    <div style={{textAlign:"right"}}>
                      {latestTotal!=null&&<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:exColor,letterSpacing:".04em"}}>{latestTotal}</div>}
                      {trend!=null&&data.length>=2&&<div style={{fontSize:11,color:trend>=0?"#4ade80":"#fb923c"}}>{trend>=0?"+":""}{trend} since start</div>}
                    </div>
                  </div>
                  {data.length>=2
                    ?<MiniGraph data={data} color={exColor} height={72}/>
                    :<div style={{fontSize:12,color:"#555",padding:"8px 0"}}>Log 2+ sessions to see progress</div>}
                </div>
              );
            })}
          </Section>

          {/* REP PROGRESSION */}
          <Section title="Rep Progression" sub="sessions toward next rep unlock">
            {allExercises.map(ex=>{
              const bonus = progression[ex.name]?.repBonus||0;
              const sess  = progression[ex.name]?.sessions||0;
              const atMax = bonus>=settings.maxRepBonus;
              const col   = WORKOUTS.A.exercises.some(e=>e.name===ex.name)?WORKOUTS.A.color:WORKOUTS.B.color;
              return(
                <div key={ex.name} style={{padding:"13px 14px",background:"#0d0d0d",borderRadius:10,border:"1px solid #1c1c1c",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <span style={{fontSize:15,color:"#f0f0f0"}}>{ex.name}</span>
                    <span style={{fontSize:13,color:col,fontWeight:500}}>×{ex.baseReps} → ×{ex.baseReps+bonus}{atMax?" 🏆":""}</span>
                  </div>
                  <div style={{height:5,background:"#1a1a1a",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(sess/settings.sessionsPerProgression)*100}%`,background:col,boxShadow:`0 0 7px ${col}88`,transition:"width .4s"}}/>
                  </div>
                </div>
              );
            })}
          </Section>

          {/* WEAK POINTS */}
          <Section title="Weak Points" sub="coverage and performance signals">
            <div style={{display:"grid",gap:8}}>
              {weakPoints.length ? weakPoints.map((item,i)=>(
                <div key={i} style={{padding:"13px 14px",background:"#0d0d0d",borderRadius:10,border:`1px solid ${item.type==="coverage"?"#fbbf2444":"#60a5fa44"}`}}>
                  <div style={{fontSize:14,color:item.type==="coverage"?"#fbbf24":"#60a5fa",fontWeight:700,marginBottom:4}}>{item.title}</div>
                  <div style={{fontSize:13,color:"#aaa",lineHeight:1.45}}>{item.detail}</div>
                </div>
              )) : (
                <div style={{padding:"14px 16px",background:"#0d0d0d",borderRadius:10,border:"1px solid #1c1c1c",fontSize:14,color:"#aaa"}}>No clear weak points yet. A few more sessions will make this sharper.</div>
              )}
            </div>
          </Section>

          {customWorkout&&(
            <Section title="Routine Balance" sub="custom routine coverage">
              <div style={{padding:"16px",background:"#0d0d0d",borderRadius:12,border:"1px solid #1f1f1f"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,color:balance>=90?"#4ade80":balance>=70?"#fbbf24":"#fb7185",letterSpacing:".06em"}}>{balance}%</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}>
                  {routineCoverage(customWorkout.exercises).map(item=>(
                    <div key={item.key} style={{padding:"8px 5px",borderRadius:8,border:`1px solid ${item.ok?"#4ade8066":"#fb718555"}`,background:item.ok?"#4ade8011":"#fb718511",textAlign:"center",fontSize:10,color:item.ok?"#4ade80":"#fb7185",fontWeight:900,textTransform:"uppercase"}}>{item.label}</div>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* RECORDS TAB */}
      {tab==="records"&&(
        <div>
          <RecordsSection records={records} accent={accent}/>

          {/* MAX WEIGHT TRACKED */}
          <Section title="Max Weight Tracked" sub="per dumbbell · updates as you log sets">
            {allExercises.map(ex=>{
              const cfg  = exConfig[ex.name]||{};
              const curW = cfg.weight || settings.dumbbellWeight;
              const maxW = cfg.maxWeight || curW;
              const wColor = WORKOUTS.A.exercises.some(e=>e.name===ex.name)?WORKOUTS.A.color:WORKOUTS.B.color;
              return(
                <div key={ex.name} style={{padding:"13px 14px",background:"#0d0d0d",borderRadius:10,border:"1px solid #1c1c1c",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:15,color:"#f0f0f0"}}>{ex.name}</span>
                    <span style={{fontSize:14,color:wColor,fontWeight:500}}>{maxW} lbs</span>
                  </div>
                  {cfg.nextWeight&&cfg.nextWeight>curW&&(
                    <div style={{fontSize:12,color:"#888"}}>Next target: <span style={{color:wColor}}>{cfg.nextWeight}lbs</span> · {cfg.lastRec==="increase"?"🏋️ Ready to progress!":"Keep grinding"}</div>
                  )}
                </div>
              );
            })}
          </Section>

          {strengthCheckIns.length>0&&(
            <Section title="Strength Check-Ins" sub="bi-weekly 1RM estimates">
              {Object.entries(checkInsByEx).map(([exName,cis])=>(
                <div key={exName} style={{padding:"13px 14px",background:"#0d0d0d",borderRadius:10,border:"1px solid #1c1c1c",marginBottom:10}}>
                  <div style={{fontSize:14,color:"#e0e0e0",marginBottom:10,fontWeight:500}}>{exName}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {cis.map((ci,i)=>(
                      <div key={i} style={{padding:"8px 12px",background:"#141414",borderRadius:8,border:"1px solid #2a2a2a",textAlign:"center"}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:accent,letterSpacing:".04em"}}>{ci.est1RM}</div>
                        <div style={{fontSize:10,color:"#888",letterSpacing:".08em"}}>LBS 1RM</div>
                        <div style={{fontSize:10,color:"#666",marginTop:2}}>{ci.date}</div>
                      </div>
                    ))}
                  </div>
                  {cis.length>=2&&(
                    <div style={{marginTop:10,fontSize:13,color:cis[cis.length-1].est1RM>cis[0].est1RM?"#4ade80":"#fb923c"}}>
                      {cis[cis.length-1].est1RM>cis[0].est1RM?"↑":"↓"} {Math.abs(cis[cis.length-1].est1RM-cis[0].est1RM)}lbs since first check-in
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* BODY TAB */}
      {tab==="body"&&(
        <div>
          <BodyMetricsSection metrics={bodyMetrics} setMetrics={setBodyMetrics} accent={accent}/>

          {/* COACH MEMORY */}
          <Section title="Coach Memory" sub="what the coach has learned">
            <div style={{padding:"16px",background:"#0d0d0d",borderRadius:12,border:`1.5px solid ${accent}33`,boxShadow:`0 0 24px ${accent}12`}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:accent,letterSpacing:".06em",lineHeight:1}}>FOCUS: {coachMemory.focus}</div>
              <div style={{fontSize:14,color:"#ddd",lineHeight:1.55,marginTop:8}}>{coachMemory.summary}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
                <MemoryPill label="Readiness" value={coachMemory.readinessCount ? coachMemory.commonEnergy : "learning"} color="#a78bfa"/>
                <MemoryPill label="Strongest" value={coachMemory.strongest?.maxWeight ? coachMemory.strongest.name : "learning"} color="#4ade80"/>
                <MemoryPill label="Set Notes" value={coachMemory.setFeedbackCount || 0} color="#60a5fa"/>
                <MemoryPill label="Pain Flags" value={coachMemory.painFlags?.length || 0} color="#fb7185"/>
              </div>
              <div style={{display:"grid",gap:8,marginTop:10}}>
                <MemoryLine label="Hardest lately" value={coachMemory.hardest?.hardCount ? `${coachMemory.hardest.name} (${coachMemory.hardest.hardCount})` : "learning"} color="#fb923c"/>
                <MemoryLine label="Easiest lately" value={coachMemory.easiest?.easyCount ? `${coachMemory.easiest.name} (${coachMemory.easiest.easyCount})` : "learning"} color="#4ade80"/>
                <MemoryLine label="Favorite swap" value={coachMemory.favoriteSwap ? `${coachMemory.favoriteSwap.label} (${coachMemory.favoriteSwap.count})` : "learning"} color="#a78bfa"/>
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function BodyMetricsSection({ metrics = [], setMetrics, accent }) {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [photo, setPhoto] = useState(null);
  const latest = metrics[0];
  const first = metrics[metrics.length - 1];
  const weightDelta = latest?.weight && first?.weight && metrics.length > 1 ? Math.round((latest.weight - first.weight) * 10) / 10 : null;

  const addMetric = () => {
    if (!weight && !waist && !photo) return;
    setMetrics?.(p => [{
      date: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),
      timestamp: Date.now(),
      weight: weight ? Number(weight) : null,
      waist: waist ? Number(waist) : null,
      photo,
    }, ...(p || [])].slice(0, 24));
    setWeight("");
    setWaist("");
    setPhoto(null);
  };

  const loadPhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <Section title="Body Check-Ins" sub="optional and stored only on this device">
      <div style={{padding:"15px",background:"#0d0d0d",borderRadius:12,border:`1px solid ${accent}33`,marginBottom:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <MetricInput label="Body Weight" value={weight} onChange={setWeight} suffix="lb"/>
          <MetricInput label="Waist" value={waist} onChange={setWaist} suffix="in"/>
        </div>
        <label style={{display:"block",marginTop:10,padding:"12px",background:"#101010",border:"1px solid #242424",borderRadius:9,color:photo?accent:"#aaa",fontSize:13,textAlign:"center"}}>
          {photo ? "Photo attached" : "Add optional progress photo"}
          <input type="file" accept="image/*" onChange={e=>loadPhoto(e.target.files?.[0])} style={{display:"none"}}/>
        </label>
        <button onClick={addMetric}
          style={{width:"100%",marginTop:10,padding:"13px",background:accent,border:"none",borderRadius:10,color:"#050505",fontSize:13,fontWeight:800,letterSpacing:".1em"}}>
          SAVE CHECK-IN
        </button>
      </div>
      {latest&&(
        <div style={{padding:"14px",background:"#0d0d0d",borderRadius:12,border:"1px solid #1c1c1c",marginBottom:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MemoryPill label="Latest Weight" value={latest.weight ? `${latest.weight}lb` : "—"} color="#4ade80"/>
            <MemoryPill label="Change" value={weightDelta == null ? "—" : `${weightDelta>0?"+":""}${weightDelta}lb`} color="#60a5fa"/>
          </div>
        </div>
      )}
      <div style={{display:"grid",gap:8}}>
        {metrics.slice(0,4).map(item=>(
          <div key={item.timestamp} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",background:"#0d0d0d",borderRadius:10,border:"1px solid #1c1c1c"}}>
            {item.photo&&<img src={item.photo} alt="" style={{width:48,height:48,objectFit:"cover",borderRadius:8,border:"1px solid #333"}}/>}
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:"#ddd"}}>{item.date}</div>
              <div style={{fontSize:12,color:"#888",marginTop:2}}>{item.weight ? `${item.weight}lb` : "no weight"} · {item.waist ? `${item.waist}in waist` : "no waist"}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function RecordsSection({ records, accent }) {
  const exerciseRecords = Object.entries(records.exerciseRecords || {});
  return (
    <Section title="Personal Records" sub="best logged performances">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <MemoryPill label="Best Volume" value={records.bestSessionVolume ? `${Math.round(records.bestSessionVolume.value).toLocaleString()}lb` : "—"} color="#4ade80"/>
        <MemoryPill label="Fastest" value={records.fastestSession ? fmtDuration(records.fastestSession.value) : "—"} color="#60a5fa"/>
        <MemoryPill label="Longest" value={records.longestSession ? fmtDuration(records.longestSession.value) : "—"} color="#a78bfa"/>
        <MemoryPill label="Tracked Lifts" value={exerciseRecords.length} color="#fbbf24"/>
      </div>
      <div style={{display:"grid",gap:8}}>
        {exerciseRecords.length ? exerciseRecords.map(([name, rec])=>(
          <div key={name} style={{padding:"13px 14px",background:"#0d0d0d",borderRadius:10,border:"1px solid #1c1c1c"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{fontSize:15,color:"#f0f0f0",fontWeight:700}}>{name}</div>
              <div style={{fontSize:12,color:accent}}>{rec.maxVolume?.date || rec.maxWeight?.date || rec.maxReps?.date || ""}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              <RecordMini label="Weight" value={rec.maxWeight ? `${rec.maxWeight.value}lb` : "—"} sub={rec.maxWeight ? `${rec.maxWeight.reps} reps` : ""}/>
              <RecordMini label="Reps" value={rec.maxReps ? rec.maxReps.value : "—"} sub={rec.maxReps ? `${rec.maxReps.weight}lb` : ""}/>
              <RecordMini label="Volume" value={rec.maxVolume ? Math.round(rec.maxVolume.value) : "—"} sub={rec.maxVolume ? `${rec.maxVolume.reps} reps` : ""}/>
            </div>
          </div>
        )) : (
          <div style={{padding:"14px 16px",background:"#0d0d0d",borderRadius:10,border:"1px solid #1c1c1c",fontSize:14,color:"#aaa"}}>Finish a workout with logged sets and records will appear here.</div>
        )}
      </div>
    </Section>
  );
}

function RecordMini({ label, value, sub }) {
  return (
    <div style={{padding:"9px 8px",background:"#101010",border:"1px solid #222",borderRadius:8,textAlign:"center"}}>
      <div style={{fontSize:10,color:"#777",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:23,color:"#fff",letterSpacing:".04em",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:"#777",marginTop:2}}>{sub}</div>}
    </div>
  );
}

function MetricInput({ label, value, onChange, suffix }) {
  return (
    <label style={{display:"block"}}>
      <div style={{fontSize:10,color:"#777",letterSpacing:".12em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",background:"#101010",border:"1px solid #242424",borderRadius:9,overflow:"hidden"}}>
        <input value={value} onChange={e=>onChange(e.target.value)} type="number" inputMode="decimal"
          style={{flex:1,minWidth:0,padding:"11px 10px",background:"transparent",border:"none",outline:"none",color:"#fff",fontFamily:"DM Mono, monospace",fontSize:15}}/>
        <span style={{fontSize:12,color:"#777",paddingRight:10}}>{suffix}</span>
      </div>
    </label>
  );
}

function Section({title,sub,children}){
  return(
    <div style={{padding:"24px 16px 8px"}}>
      <div style={{fontSize:13,color:"#ddd",letterSpacing:".14em",textTransform:"uppercase",fontWeight:500}}>{title}</div>
      {sub&&<div style={{fontSize:12,color:"#888",marginTop:3,letterSpacing:".04em"}}>{sub}</div>}
      <div style={{marginTop:14}}>{children}</div>
    </div>
  );
}

function BigStat({label,value,unit,suffix,accent}){
  return(
    <div style={{padding:"18px 16px",background:"#0d0d0d",border:"1px solid #1c1c1c",borderRadius:12,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at top right,${accent}12,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{fontSize:11,color:"#aaa",letterSpacing:".14em",textTransform:"uppercase",position:"relative"}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:accent||"#fafafa",marginTop:5,letterSpacing:".04em",filter:`drop-shadow(0 0 7px ${accent}55)`,position:"relative"}}>
        {value}
        {unit&&<span style={{fontSize:14,color:"#999",marginLeft:5,letterSpacing:".1em"}}>{unit}</span>}
        {suffix&&<span style={{fontSize:20,marginLeft:6}}>{suffix}</span>}
      </div>
    </div>
  );
}

function MemoryPill({label,value,color}){
  return(
    <div style={{padding:"11px 12px",background:"#080808",border:"1px solid #202020",borderRadius:9}}>
      <div style={{fontSize:10,color:"#888",letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,color,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
    </div>
  );
}

function MemoryLine({label,value,color}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",gap:10,padding:"10px 12px",background:"#080808",border:"1px solid #202020",borderRadius:9}}>
      <span style={{fontSize:11,color:"#888",letterSpacing:".12em",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:12,color,fontWeight:600,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</span>
    </div>
  );
}

function Leg({color,label}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:10,height:10,background:color,borderRadius:2}}/>
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ accent, title, body, items=[] }) {
  return (
    <div style={{padding:"18px 16px",background:`linear-gradient(180deg,${accent}12,#0d0d0d)`,border:`1.5px solid ${accent}33`,borderRadius:12,boxShadow:`0 0 24px ${accent}12`}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:accent,letterSpacing:".06em",lineHeight:1}}>{title}</div>
      <div style={{fontSize:14,color:"#ddd",lineHeight:1.55,marginTop:8}}>{body}</div>
      <div style={{display:"grid",gap:7,marginTop:13}}>
        {items.map((item,i)=>(
          <div key={item} style={{display:"flex",gap:10,padding:"9px 10px",background:"#080808",border:"1px solid #202020",borderRadius:8,fontSize:12,color:"#bbb",lineHeight:1.4}}>
            <span style={{color:accent,fontWeight:700}}>{String(i+1).padStart(2,"0")}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

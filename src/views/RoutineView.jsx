import { useMemo, useState } from "react";
import { BENCHMARK_TESTS_V2, DAYS, EXERCISE_LIBRARY, LIMITATION_OPTIONS, MUSCLE_COVERAGE_GROUPS, MUSCLE_LABELS, ROUTINE_TEMPLATES, ageTier, customRoutineWorkout, exerciseId, exerciseIsRisky, exerciseRiskJoints, getDefaultWeight, getExerciseMovement, isUnilateral, normalizeCustomRoutine, normalizeUserProfile, profileFitnessEstimate, profileRisk, routineBalanceScore, routineCoverage } from "../data.js";
import { routineEditSuggestions } from "../coach.js";

const DIFFICULTIES = [
  ["beginner", "Beginner"],
  ["novice", "Novice"],
  ["intermediate", "All"],
];

export default function RoutineView({ customRoutine, setCustomRoutine, userProfile, setUserProfile, history = [], accent, setActiveView }) {
  const routine = normalizeCustomRoutine(customRoutine);
  const profile = normalizeUserProfile(userProfile);
  const risk = profileRisk(profile);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState("all");
  const [difficulty, setDifficulty] = useState(routine.difficulty || "beginner");
  const [showRisky, setShowRisky] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const selected = useMemo(() => customRoutineWorkout(routine).exercises, [routine]);
  const coverage = routineCoverage(selected);
  const balance = routineBalanceScore(selected);
  const estimate = profileFitnessEstimate(profile);
  const suggestions = useMemo(() => routineEditSuggestions({ routine, exercises:selected, history, userProfile:profile }), [routine, selected, history, profile]);
  const recentIds = useMemo(() => [...new Set(history.flatMap(h => h.exercises || []).slice(0, 18).map(ex => ex.id || ex.plannedId || exerciseId(ex.name)).filter(Boolean))], [history]);
  const complete = coverage.every(item => item.ok);
  const categories = [["all", "All"], ...MUSCLE_COVERAGE_GROUPS.map(([key, label]) => [key, label])];
  const tier = useMemo(() => ageTier(profile), [profile]);
  const hasMobility = useMemo(() => selected.some(ex => ex.category === "mobility" || ex.folder === "Mobility"), [selected]);
  const riskyHidden = useMemo(
    () => !showRisky && profile.limitations?.length > 0
      ? EXERCISE_LIBRARY.filter(ex => exerciseIsRisky(ex.name, profile.limitations) && !routine.avoidedExerciseIds?.includes(ex.id)).length
      : 0,
    [showRisky, profile.limitations, routine.avoidedExerciseIds]
  );
  const visible = EXERCISE_LIBRARY.filter(ex => {
    const inCategory = category === "all" || MUSCLE_COVERAGE_GROUPS.find(([key]) => key === category)?.[2].some(m => [...(ex.primary || []), ...(ex.secondary || [])].includes(m));
    const inDifficulty = difficulty === "intermediate" || ex.difficulty === "beginner" || difficulty === ex.difficulty;
    const inEquipment = equipment === "all" || ex.equipment === equipment;
    const mv = getExerciseMovement(ex.name) || "";
    const inSearch = !query.trim() || `${ex.name} ${ex.tip} ${ex.equipment} ${ex.primary?.join(" ")} ${mv}`.toLowerCase().includes(query.trim().toLowerCase());
    const notAvoided = !routine.avoidedExerciseIds?.includes(ex.id);
    const notRisky = showRisky || !exerciseIsRisky(ex.name, profile.limitations);
    return inCategory && inDifficulty && inEquipment && inSearch && notAvoided && notRisky;
  });

  const save = (patch) => setCustomRoutine(prev => normalizeCustomRoutine({ ...prev, ...patch }));
  const saveProfile = (patch) => setUserProfile?.(prev => normalizeUserProfile({ ...prev, ...patch }));
  const toggle = (id) => {
    const has = routine.exerciseIds.includes(id);
    save({ exerciseIds: has ? routine.exerciseIds.filter(item => item !== id) : [...routine.exerciseIds, id] });
  };
  const enableRoutine = () => save({ enabled:true, difficulty });
  const applyTemplate = (template) => save({
    name:template.name,
    difficulty:template.difficulty,
    exerciseIds:template.exerciseIds,
    activeRoutineId:template.id,
    routines:[...routine.routines.filter(item => item.id !== template.id), { id:template.id, name:template.name, exerciseIds:template.exerciseIds }],
  });
  const saveCurrentAsRoutine = () => {
    const id = `routine_${Date.now()}`;
    save({ activeRoutineId:id, routines:[...routine.routines, { id, name:routine.name || "Custom Routine", exerciseIds:routine.exerciseIds }] });
  };
  const toggleFavorite = (id) => {
    const set = new Set(routine.favoriteExerciseIds || []);
    set.has(id) ? set.delete(id) : set.add(id);
    save({ favoriteExerciseIds:[...set] });
  };
  const toggleAvoid = (id) => {
    const set = new Set(routine.avoidedExerciseIds || []);
    set.has(id) ? set.delete(id) : set.add(id);
    save({ avoidedExerciseIds:[...set], exerciseIds:routine.exerciseIds.filter(item => item !== id) });
  };
  const toggleLimitation = (id) => {
    const set = new Set(profile.limitations || []);
    set.has(id) ? set.delete(id) : set.add(id);
    saveProfile({ limitations:[...set] });
  };
  const assignDay = (day, id) => save({ schedule:{ ...routine.schedule, [day]:id } });

  const duplicateRoutine = (item) => {
    const newId = `routine_${Date.now()}`;
    const copy = { id:newId, name:`${item.name} (copy)`, exerciseIds:[...item.exerciseIds] };
    save({ routines:[...routine.routines, copy] });
  };
  const deleteRoutine = (id) => {
    if (routine.routines.length <= 1) return;
    const next = routine.routines.filter(item => item.id !== id);
    const newActive = routine.activeRoutineId === id ? next[0]?.id : routine.activeRoutineId;
    const newSchedule = Object.fromEntries(
      Object.entries(routine.schedule || {}).map(([day, rid]) => [day, rid === id ? next[0]?.id : rid])
    );
    save({ routines:next, activeRoutineId:newActive, schedule:newSchedule });
  };
  const renameRoutine = (id, name) => {
    save({ routines:routine.routines.map(item => item.id === id ? { ...item, name } : item) });
  };
  const moveRoutine = (id, dir) => {
    const idx = routine.routines.findIndex(item => item.id === id);
    if (idx < 0) return;
    const next = [...routine.routines];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    save({ routines:next });
  };

  return (
    <div>
      <div style={{padding:"34px 16px 18px"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".06em",lineHeight:.88,color:"#fafafa"}}>ROUTINE</div>
        <div style={{fontSize:13,color:"#999",marginTop:7,letterSpacing:".1em",textTransform:"uppercase"}}>build balanced workouts</div>
      </div>

      <Section title="Body Profile">
        <div style={{padding:"13px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:10}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
            <ProfileInput label="Age" value={profile.age} onChange={v=>saveProfile({age:v})} />
            <ProfileInput label="Height In" value={profile.heightIn} onChange={v=>saveProfile({heightIn:v})} />
            <ProfileInput label="Weight Lb" value={profile.weightLb} onChange={v=>saveProfile({weightLb:v})} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginTop:9}}>
            {[["","Any"],["male","Male"],["female","Female"]].map(([key,label])=>(
              <button key={label} onClick={()=>saveProfile({sex:key})}
                style={{padding:"10px 6px",borderRadius:8,border:`1px solid ${profile.sex===key?accent:"#292929"}`,background:profile.sex===key?`${accent}22`:"#101010",color:profile.sex===key?accent:"#aaa",fontSize:11,fontWeight:800}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginTop:9}}>
            {LIMITATION_OPTIONS.map(([key,label])=>(
              <button key={key} onClick={()=>toggleLimitation(key)}
                style={{padding:"9px 4px",borderRadius:8,border:`1px solid ${profile.limitations?.includes(key)?accent:"#292929"}`,background:profile.limitations?.includes(key)?`${accent}22`:"#101010",color:profile.limitations?.includes(key)?accent:"#aaa",fontSize:10,fontWeight:800}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginTop:9}}>
            {[["new","New"],["returning","Returning"],["trained","Trained"]].map(([key,label])=>(
              <button key={key} onClick={()=>saveProfile({trainingExperience:key})}
                style={{padding:"10px 6px",borderRadius:8,border:`1px solid ${profile.trainingExperience===key?accent:"#292929"}`,background:profile.trainingExperience===key?`${accent}22`:"#101010",color:profile.trainingExperience===key?accent:"#aaa",fontSize:11,fontWeight:800}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginTop:9}}>
            {[["general","General"],["strength","Strength"],["mobility","Mobility"]].map(([key,label])=>(
              <button key={key} onClick={()=>saveProfile({goal:key})}
                style={{padding:"10px 6px",borderRadius:8,border:`1px solid ${profile.goal===key?accent:"#292929"}`,background:profile.goal===key?`${accent}22`:"#101010",color:profile.goal===key?accent:"#aaa",fontSize:11,fontWeight:800}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7,marginTop:9}}>
            {[["normal","Normal mobility"],["limited","Limited mobility"]].map(([key,label])=>(
              <button key={key} onClick={()=>saveProfile({mobility:key})}
                style={{padding:"10px 6px",borderRadius:8,border:`1px solid ${profile.mobility===key?accent:"#292929"}`,background:profile.mobility===key?`${accent}22`:"#101010",color:profile.mobility===key?accent:"#aaa",fontSize:11,fontWeight:800}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{marginTop:10,padding:"10px 11px",borderRadius:8,border:`1px solid ${risk.level==="protect"?"#fb718566":risk.level==="steady"?"#fbbf2466":"#4ade8066"}`,background:risk.level==="protect"?"#fb718511":risk.level==="steady"?"#fbbf2411":"#4ade8011"}}>
            <div style={{fontSize:12,color:risk.level==="protect"?"#fb7185":risk.level==="steady"?"#fbbf24":"#4ade80",fontWeight:900,textTransform:"uppercase"}}>{risk.level} benchmark mode</div>
            <div style={{fontSize:12,color:"#aaa",lineHeight:1.45,marginTop:3}}>Targets start {risk.level==="protect"?"extra conservative":risk.level==="steady"?"moderately conservative":"standard"}{estimate.bmi ? ` · BMI ${estimate.bmi}` : ""}{estimate.bmr ? ` · BMR ${estimate.bmr}` : ""}{estimate.leanMassLb ? ` · lean est ${estimate.leanMassLb}lb` : ""}.</div>
          </div>
        </div>
      </Section>

      {/* 50+ mobility tip */}
      {tier.mobilityPriority && !hasMobility && (
        <div style={{margin:"0 16px 14px",padding:"12px 14px",background:"#0d9488" + "11",border:"1px solid #0d948855",borderRadius:10}}>
          <div style={{fontSize:12,color:"#2dd4bf",fontWeight:900,textTransform:"uppercase",marginBottom:4}}>🧘 Mobility Tip for {tier.label}</div>
          <div style={{fontSize:12,color:"#aaa",lineHeight:1.45}}>Recovery and joint health improve significantly with dedicated mobility work. Add at least one mobility or stretching exercise to your routine — search "Mobility" in the exercise picker below.</div>
        </div>
      )}
      {tier.coachFocus !== "pr" && profile.age && (
        <div style={{margin:"0 16px 14px",padding:"10px 13px",background:"#05050566",border:"1px solid #333",borderRadius:9,display:"flex",gap:10,alignItems:"center"}}>
          <div style={{fontSize:18}}>
            {tier.tier === "senior" ? "🦴" : "📈"}
          </div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.4}}>
            <strong style={{color:"#ccc"}}>{tier.label} training style:</strong>{" "}
            {tier.tier === "senior"
              ? `Rest ${Math.round(60 * tier.restMult)}s between sets · progress after ${tier.progressStyle === "conservative" ? "3" : "2"} clean sessions · deload every ~${tier.deloadWeeks} weeks.`
              : `Rest ${Math.round(60 * tier.restMult)}s between sets · deload every ~${tier.deloadWeeks} weeks.`}
          </div>
        </div>
      )}

      <Section title="Weekly Schedule">
        <div style={{display:"grid",gap:8}}>
          {DAYS.map(day => (
            <label key={day} style={{display:"grid",gridTemplateColumns:"92px 1fr",gap:8,alignItems:"center",padding:"10px 12px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:9}}>
              <span style={{fontSize:12,color:"#aaa",fontWeight:900,textTransform:"uppercase"}}>{day}</span>
              <select value={routine.schedule?.[day] || routine.activeRoutineId} onChange={e=>assignDay(day, e.target.value)}
                style={{background:"#101010",border:"1px solid #292929",borderRadius:8,color:"#f0f0f0",padding:"9px",fontWeight:800}}>
                {routine.routines.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      </Section>

      {suggestions.length > 0 && (
        <Section title="Coach Edits">
          <div style={{display:"grid",gap:8}}>
            {suggestions.map((item, index) => {
              const isHigh = item.priority >= 3;
              const borderCol = isHigh ? "#fb718566" : item.type === "risk" ? "#fbbf2455" : "#1f1f1f";
              const titleCol  = isHigh ? "#fb7185"   : item.type === "risk" ? "#fbbf24"   : "#eee";
              return (
                <div key={`${item.type}_${index}`} style={{padding:"11px 12px",background:"#0d0d0d",border:`1px solid ${borderCol}`,borderRadius:9}}>
                  <div style={{fontSize:13,color:titleCol,fontWeight:900}}>{item.title}</div>
                  <div style={{fontSize:12,color:"#888",lineHeight:1.4,marginTop:4}}>{item.detail}</div>
                  {item.actionId && item.actionLabel && (
                    <button onClick={()=>{
                      if (item.actionType === "add") {
                        save({ exerciseIds:[...new Set([...routine.exerciseIds, item.actionId])] });
                      } else if (item.actionType === "swap" && item.swapFromId) {
                        const next = routine.exerciseIds.map(id => id === item.swapFromId ? item.actionId : id);
                        save({ exerciseIds:[...new Set(next)] });
                      }
                    }} style={{marginTop:8,padding:"7px 12px",border:`1px solid ${titleCol}66`,borderRadius:7,background:"transparent",color:titleCol,fontSize:11,fontWeight:900,letterSpacing:".06em"}}>
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Templates">
        <div style={{display:"grid",gap:8}}>
          {ROUTINE_TEMPLATES.map(template => (
            <button key={template.id} onClick={()=>applyTemplate(template)}
              style={{textAlign:"left",padding:"12px 13px",background:routine.activeRoutineId===template.id?`${accent}18`:"#0d0d0d",border:`1px solid ${routine.activeRoutineId===template.id?accent:"#1f1f1f"}`,borderRadius:10,color:"#eee"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                <span style={{fontSize:14,fontWeight:900,color:routine.activeRoutineId===template.id?accent:"#eee"}}>{template.name}</span>
                <span style={{fontSize:11,color:"#888",textTransform:"uppercase"}}>{template.difficulty}</span>
              </div>
              <div style={{fontSize:12,color:"#888",marginTop:5}}>{template.exerciseIds.length} movements · balanced full body</div>
            </button>
          ))}
        </div>
      </Section>

      {routine.routines?.length > 0 && (
        <Section title="Saved Routines">
          <div style={{display:"grid",gap:7}}>
            {routine.routines.map((item, idx) => {
              const isActive = routine.activeRoutineId === item.id;
              const isRenaming = renamingId === item.id;
              return (
                <div key={item.id} style={{background:isActive?`${accent}14`:"#0d0d0d",border:`1px solid ${isActive?accent:"#1f1f1f"}`,borderRadius:10,overflow:"hidden"}}>
                  {/* Name row */}
                  <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 12px"}}>
                    <button onClick={()=>{ setRenamingId(null); save({ activeRoutineId:item.id, name:item.name, exerciseIds:item.exerciseIds }); }}
                      style={{flex:1,textAlign:"left",background:"transparent",border:"none",color:isActive?accent:"#eee",padding:0}}>
                      {isRenaming ? (
                        <input autoFocus value={item.name}
                          onChange={e=>renameRoutine(item.id, e.target.value)}
                          onBlur={()=>setRenamingId(null)}
                          onKeyDown={e=>e.key==="Enter"&&setRenamingId(null)}
                          onClick={e=>e.stopPropagation()}
                          style={{width:"100%",background:"#1a1a1a",border:`1px solid ${accent}66`,borderRadius:6,color:"#f0f0f0",padding:"6px 8px",fontSize:13,fontWeight:800,outline:"none"}} />
                      ) : (
                        <span style={{fontSize:13,fontWeight:800}}>{item.name}</span>
                      )}
                    </button>
                    <span style={{fontSize:11,color:"#888",flexShrink:0}}>{item.exerciseIds.length} moves</span>
                  </div>
                  {/* Action row */}
                  <div style={{display:"flex",borderTop:"1px solid #1a1a1a"}}>
                    {[
                      { label:"✏", title:"Rename", action:()=>setRenamingId(isRenaming ? null : item.id) },
                      { label:"⧉", title:"Duplicate", action:()=>duplicateRoutine(item) },
                      { label:"↑", title:"Move up",   action:()=>moveRoutine(item.id, -1), disabled:idx===0 },
                      { label:"↓", title:"Move down", action:()=>moveRoutine(item.id,  1), disabled:idx===routine.routines.length-1 },
                      { label:"✕", title:"Delete", action:()=>deleteRoutine(item.id), disabled:routine.routines.length<=1, color:"#fb7185" },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                        title={btn.title}
                        style={{flex:1,padding:"8px 4px",background:"transparent",border:"none",borderRight:"1px solid #1a1a1a",color:btn.disabled?"#333":btn.color||"#888",fontSize:13,fontWeight:800,cursor:btn.disabled?"default":"pointer"}}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div style={{margin:"0 16px 14px",padding:"15px",background:"#0d0d0d",border:`1.5px solid ${complete ? "#4ade80" : accent}55`,borderRadius:12,boxShadow:`0 0 24px ${accent}12`}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:12}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:800}}>Current Routine</div>
            <input value={routine.name} onChange={e=>save({name:e.target.value})}
              style={{width:"100%",boxSizing:"border-box",marginTop:6,background:"#101010",border:"1px solid #252525",borderRadius:8,color:"#f0f0f0",padding:"10px 11px",fontSize:16,fontWeight:700,outline:"none"}} />
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:complete ? "#4ade80" : "#fbbf24",letterSpacing:".05em"}}>{selected.length}</div>
            <div style={{fontSize:10,color:"#888",letterSpacing:".1em",textTransform:"uppercase"}}>Exercises</div>
            <div style={{fontSize:10,color:balance >= 80 ? "#4ade80" : "#fbbf24",marginTop:3}}>Balance {balance}</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
          {coverage.map(item => (
            <div key={item.key} style={{padding:"9px 6px",borderRadius:8,border:`1px solid ${item.ok ? "#4ade8066" : "#fb718555"}`,background:item.ok ? "#4ade8014" : "#fb718511",textAlign:"center"}}>
              <div style={{fontSize:10,color:item.ok ? "#4ade80" : "#fb7185",fontWeight:900,letterSpacing:".08em",textTransform:"uppercase"}}>{item.label}</div>
              <div style={{fontSize:10,color:"#888",marginTop:3}}>{item.hits.length || 0} hit</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={enableRoutine} disabled={!complete}
            style={{padding:"13px 10px",border:"none",borderRadius:10,background:complete?accent:"#242424",color:complete?"#050505":"#777",fontWeight:900,letterSpacing:".08em"}}>
            {routine.enabled ? "CUSTOM ON" : "USE ROUTINE"}
          </button>
          <button onClick={()=>{ save({ enabled:false }); setActiveView?.("workout"); }}
            style={{padding:"13px 10px",border:`1px solid ${accent}66`,borderRadius:10,background:"transparent",color:accent,fontWeight:800,letterSpacing:".08em"}}>
            USE DEFAULT
          </button>
        </div>
        <button onClick={saveCurrentAsRoutine}
          style={{width:"100%",marginTop:8,padding:"11px 10px",border:"1px solid #2a2a2a",borderRadius:10,background:"#101010",color:"#aaa",fontWeight:800,letterSpacing:".08em"}}>
          SAVE AS NEW ROUTINE
        </button>
        {!complete&&<div style={{fontSize:12,color:"#fbbf24",lineHeight:1.45,marginTop:10}}>Add at least one push, pull, legs, and core movement before using this routine.</div>}
      </div>

      <Section title="Training Level">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
          {DIFFICULTIES.map(([key,label]) => (
            <button key={key} onClick={()=>{ setDifficulty(key); save({difficulty:key}); }}
              style={{padding:"11px 8px",borderRadius:9,border:`1px solid ${difficulty===key?accent:"#292929"}`,background:difficulty===key?`${accent}22`:"#0d0d0d",color:difficulty===key?accent:"#aaa",fontWeight:800}}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Browse Exercises">
        {recentIds.length > 0 && (
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8}}>
            {recentIds.slice(0, 8).map(id => {
              const ex = EXERCISE_LIBRARY.find(item => item.id === id);
              return ex ? <button key={id} onClick={()=>toggle(ex.id)} style={{flexShrink:0,padding:"8px 10px",border:`1px solid ${accent}66`,borderRadius:8,background:"#101010",color:accent,fontSize:11,fontWeight:800}}>{ex.name}</button> : null;
            })}
          </div>
        )}
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search exercises, muscles, equipment"
          style={{width:"100%",boxSizing:"border-box",marginBottom:8,background:"#101010",border:"1px solid #292929",borderRadius:9,color:"#f0f0f0",padding:"11px 12px",fontSize:14,outline:"none"}} />
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:10}}>
          {categories.map(([key,label]) => (
            <button key={key} onClick={()=>setCategory(key)}
              style={{padding:"8px 4px",borderRadius:7,border:`1px solid ${category===key?accent:"#272727"}`,background:category===key?`${accent}20`:"#0d0d0d",color:category===key?accent:"#888",fontSize:10,fontWeight:800}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:10}}>
          {[["all","All"],["bodyweight","BW"],["dumbbells","DBs"],["bands","Bands"],["machines","Mach."],["barbell","Barbell"],["kettlebell","KB"],["mobility","Mobility"]].map(([key,label]) => (
            <button key={key} onClick={()=>setEquipment(key)}
              style={{padding:"8px 4px",borderRadius:7,border:`1px solid ${equipment===key?accent:"#272727"}`,background:equipment===key?`${accent}20`:"#0d0d0d",color:equipment===key?accent:"#888",fontSize:10,fontWeight:800,textTransform:"uppercase"}}>
              {label}
            </button>
          ))}
        </div>
        {riskyHidden > 0 && (
          <button onClick={()=>setShowRisky(v=>!v)}
            style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",marginBottom:8,background:"#fb718511",border:"1px solid #fb718555",borderRadius:9,color:"#fb7185",textAlign:"left"}}>
            <span style={{fontSize:12,fontWeight:800}}>⚠ {riskyHidden} exercise{riskyHidden===1?"":"s"} hidden for your limitations ({profile.limitations?.join(", ")})</span>
            <span style={{fontSize:11,fontWeight:900,opacity:.8}}>{showRisky ? "HIDE" : "SHOW"}</span>
          </button>
        )}
        <div style={{display:"grid",gap:8}}>
          {visible.map(ex => (
            <ExercisePick key={ex.id} ex={ex}
              active={routine.exerciseIds.includes(ex.id)}
              favorite={routine.favoriteExerciseIds?.includes(ex.id)}
              risky={exerciseIsRisky(ex.name, profile.limitations)}
              riskJoints={exerciseRiskJoints(ex.name).filter(j=>profile.limitations?.includes(j))}
              accent={accent}
              onToggle={()=>toggle(ex.id)}
              onFavorite={()=>toggleFavorite(ex.id)}
              onAvoid={()=>toggleAvoid(ex.id)} />
          ))}
          {(routine.avoidedExerciseIds?.length > 0 || riskyHidden > 0) && (
            <div style={{fontSize:12,color:"#888"}}>
              {routine.avoidedExerciseIds?.length > 0 && `${routine.avoidedExerciseIds.length} avoided hidden. `}
              {riskyHidden > 0 && !showRisky && `${riskyHidden} risky for your limitations hidden.`}
            </div>
          )}
        </div>
      </Section>

      <Section title="Benchmark V2">
        <div style={{display:"grid",gap:8}}>
          {BENCHMARK_TESTS_V2.map(test => (
            <div key={test.id} style={{padding:"11px 12px",background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:9}}>
              <div style={{fontSize:13,color:"#eee",fontWeight:900}}>{test.name}</div>
              <div style={{fontSize:12,color:"#888",lineHeight:1.4,marginTop:4}}>{test.note}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const _MOVEMENT_LABELS = { squat:"Squat", hinge:"Hinge", push_h:"Push H", push_v:"Push V", pull_h:"Pull H", pull_v:"Pull V", isolation:"Isolation", core:"Core", stretch:"Stretch" };

function ExercisePick({ ex, active, favorite, risky, riskJoints, accent, onToggle, onFavorite, onAvoid }) {
  const borderColor = active ? accent : risky ? "#fb718566" : "#1f1f1f";
  const bg = active ? `${accent}17` : risky ? "#fb718508" : "#0d0d0d";
  const mv = getExerciseMovement(ex.name);
  const uni = isUnilateral(ex.name);
  const defW = ex.defaultWeightLb ?? getDefaultWeight(ex.name);
  return (
    <div onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }} style={{width:"100%",textAlign:"left",padding:"12px 13px",background:bg,border:`1.5px solid ${borderColor}`,borderRadius:10,color:"#f0f0f0"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontSize:15,fontWeight:800,color:active?accent:"#f0f0f0"}}>{ex.name}</span>
            {risky && riskJoints?.length > 0 && (
              <span style={{fontSize:9,fontWeight:900,color:"#fb7185",background:"#fb718522",border:"1px solid #fb718544",borderRadius:10,padding:"2px 6px",textTransform:"uppercase"}}>⚠ {riskJoints.join("/")}</span>
            )}
            {uni && <span style={{fontSize:9,color:"#94a3b8",background:"#94a3b822",border:"1px solid #94a3b844",borderRadius:10,padding:"2px 6px",fontWeight:700}}>UNI</span>}
          </div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.4,marginTop:4}}>{ex.tip}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
            {mv && <span style={{fontSize:10,color:"#60a5fa",border:"1px solid #60a5fa44",borderRadius:5,padding:"3px 6px"}}>{_MOVEMENT_LABELS[mv]||mv}</span>}
            {[...(ex.primary || []), ...(ex.secondary || [])].slice(0,3).map(m => (
              <span key={m} style={{fontSize:10,color:"#aaa",border:"1px solid #2a2a2a",borderRadius:5,padding:"3px 6px"}}>{MUSCLE_LABELS[m] || m}</span>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,textAlign:"right"}}>
          <div style={{fontSize:11,color:ex.ageFriendly?"#4ade80":"#fbbf24",fontWeight:800,textTransform:"uppercase"}}>{ex.difficulty}</div>
          <div style={{fontSize:11,color:"#777",marginTop:3}}>{ex.equipment}</div>
          {defW > 0 && <div style={{fontSize:10,color:"#555",marginTop:2}}>~{defW}lb</div>}
          <button onClick={(e)=>{ e.stopPropagation(); onFavorite(); }} style={{background:"transparent",border:"none",color:favorite?"#fbbf24":"#555",fontSize:17,padding:0,marginTop:4}}>★</button>
          <button onClick={(e)=>{ e.stopPropagation(); onAvoid(); }} style={{display:"block",background:"transparent",border:"none",color:"#fb7185",fontSize:10,fontWeight:900,padding:0,marginTop:4}}>AVOID</button>
          <div style={{fontSize:20,color:active?accent:"#555",marginTop:4}}>{active ? "✓" : "+"}</div>
        </div>
      </div>
    </div>
  );
}

function ProfileInput({ label, value, onChange }) {
  return (
    <label style={{display:"grid",gap:5}}>
      <span style={{fontSize:10,color:"#888",letterSpacing:".1em",textTransform:"uppercase",fontWeight:800}}>{label}</span>
      <input value={value} onChange={e=>onChange(e.target.value)} inputMode="numeric" type="number" min="0"
        style={{minWidth:0,background:"#101010",border:"1px solid #292929",borderRadius:8,color:"#f0f0f0",padding:"10px 8px",fontSize:14,fontWeight:800,outline:"none"}} />
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div style={{padding:"20px 16px 6px"}}>
      <div style={{fontSize:13,color:"#ddd",letterSpacing:".14em",textTransform:"uppercase",fontWeight:700,marginBottom:11}}>{title}</div>
      {children}
    </div>
  );
}

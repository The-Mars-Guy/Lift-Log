import { useMemo, useState } from "react";
import { BENCHMARK_TESTS_V2, DAYS, EXERCISE_LIBRARY, LIMITATION_OPTIONS, MUSCLE_COVERAGE_GROUPS, MUSCLE_LABELS, ROUTINE_TEMPLATES, customRoutineWorkout, exerciseId, normalizeCustomRoutine, normalizeUserProfile, profileFitnessEstimate, profileRisk, routineBalanceScore, routineCoverage } from "../data.js";
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
  const selected = useMemo(() => customRoutineWorkout(routine).exercises, [routine]);
  const coverage = routineCoverage(selected);
  const balance = routineBalanceScore(selected);
  const estimate = profileFitnessEstimate(profile);
  const suggestions = useMemo(() => routineEditSuggestions({ routine, exercises:selected, history }), [routine, selected, history]);
  const recentIds = useMemo(() => [...new Set(history.flatMap(h => h.exercises || []).slice(0, 18).map(ex => ex.id || ex.plannedId || exerciseId(ex.name)).filter(Boolean))], [history]);
  const complete = coverage.every(item => item.ok);
  const categories = [["all", "All"], ...MUSCLE_COVERAGE_GROUPS.map(([key, label]) => [key, label])];
  const visible = EXERCISE_LIBRARY.filter(ex => {
    const inCategory = category === "all" || MUSCLE_COVERAGE_GROUPS.find(([key]) => key === category)?.[2].some(m => [...(ex.primary || []), ...(ex.secondary || [])].includes(m));
    const inDifficulty = difficulty === "intermediate" || ex.difficulty === "beginner" || difficulty === ex.difficulty;
    const inEquipment = equipment === "all" || ex.equipment === equipment;
    const inSearch = !query.trim() || `${ex.name} ${ex.tip} ${ex.equipment} ${ex.primary?.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    return inCategory && inDifficulty && inEquipment && inSearch && !routine.avoidedExerciseIds?.includes(ex.id);
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
            {suggestions.map((item, index) => (
              <div key={`${item.type}_${index}`} style={{padding:"11px 12px",background:"#0d0d0d",border:`1px solid ${item.priority >= 3 ? "#fb718566" : "#1f1f1f"}`,borderRadius:9}}>
                <div style={{fontSize:13,color:item.priority >= 3 ? "#fb7185" : "#eee",fontWeight:900}}>{item.title}</div>
                <div style={{fontSize:12,color:"#888",lineHeight:1.4,marginTop:4}}>{item.detail}</div>
              </div>
            ))}
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
            {routine.routines.map(item => (
              <button key={item.id} onClick={()=>save({ activeRoutineId:item.id, name:item.name, exerciseIds:item.exerciseIds })}
                style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",textAlign:"left",padding:"10px 12px",background:routine.activeRoutineId===item.id?`${accent}18`:"#0d0d0d",border:`1px solid ${routine.activeRoutineId===item.id?accent:"#1f1f1f"}`,borderRadius:9,color:"#eee"}}>
                <span style={{fontSize:13,fontWeight:800}}>{item.name}</span>
                <span style={{fontSize:11,color:"#888"}}>{item.exerciseIds.length} moves</span>
              </button>
            ))}
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
          {["all","bodyweight","dumbbells","bands"].map(key => (
            <button key={key} onClick={()=>setEquipment(key)}
              style={{padding:"8px 4px",borderRadius:7,border:`1px solid ${equipment===key?accent:"#272727"}`,background:equipment===key?`${accent}20`:"#0d0d0d",color:equipment===key?accent:"#888",fontSize:10,fontWeight:800,textTransform:"uppercase"}}>
              {key}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gap:8}}>
          {visible.map(ex => (
            <ExercisePick key={ex.id} ex={ex} active={routine.exerciseIds.includes(ex.id)} favorite={routine.favoriteExerciseIds?.includes(ex.id)} accent={accent} onToggle={()=>toggle(ex.id)} onFavorite={()=>toggleFavorite(ex.id)} onAvoid={()=>toggleAvoid(ex.id)} />
          ))}
          {routine.avoidedExerciseIds?.length > 0 && <div style={{fontSize:12,color:"#888"}}>{routine.avoidedExerciseIds.length} avoided movement{routine.avoidedExerciseIds.length === 1 ? "" : "s"} hidden.</div>}
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

function ExercisePick({ ex, active, favorite, accent, onToggle, onFavorite, onAvoid }) {
  return (
    <button onClick={onToggle} style={{width:"100%",textAlign:"left",padding:"12px 13px",background:active?`${accent}17`:"#0d0d0d",border:`1.5px solid ${active?accent:"#1f1f1f"}`,borderRadius:10,color:"#f0f0f0"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:15,fontWeight:800,color:active?accent:"#f0f0f0"}}>{ex.name}</div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.4,marginTop:4}}>{ex.tip}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
            {[...(ex.primary || []), ...(ex.secondary || [])].slice(0,4).map(m => (
              <span key={m} style={{fontSize:10,color:"#aaa",border:"1px solid #2a2a2a",borderRadius:5,padding:"3px 6px"}}>{MUSCLE_LABELS[m] || m}</span>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,textAlign:"right"}}>
          <div style={{fontSize:11,color:ex.ageFriendly?"#4ade80":"#fbbf24",fontWeight:800,textTransform:"uppercase"}}>{ex.difficulty}</div>
          <div style={{fontSize:11,color:"#777",marginTop:5}}>{ex.equipment}</div>
          <button onClick={(e)=>{ e.stopPropagation(); onFavorite(); }} style={{background:"transparent",border:"none",color:favorite?"#fbbf24":"#555",fontSize:17,padding:0,marginTop:6}}>★</button>
          <button onClick={(e)=>{ e.stopPropagation(); onAvoid(); }} style={{display:"block",background:"transparent",border:"none",color:"#fb7185",fontSize:10,fontWeight:900,padding:0,marginTop:6}}>AVOID</button>
          <div style={{fontSize:20,color:active?accent:"#555",marginTop:6}}>{active ? "✓" : "+"}</div>
        </div>
      </div>
    </button>
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

import { useMemo, useState } from "react";
import { MusclePickerDiagram } from "../components/MuscleDiagram.jsx";
import { BENCHMARK_TESTS_V2, EXERCISE_LIBRARY, MUSCLE_COVERAGE_GROUPS, MUSCLE_LABELS, ROUTINE_TEMPLATES, allRoutineExercises, customRoutineWorkout, exerciseId, exerciseIsRisky, exerciseRiskJoints, getDefaultWeight, getExerciseMovement, isUnilateral, normalizeCustomRoutine, normalizeUserProfile, routineBalanceScore, routineCoverage } from "../data.js";
import { buildCoachNotes, generateCoachRoutine, routineEditSuggestions } from "../coach.js";
import { surface, text, status } from "../theme.js";
import { Disp, Caps, Bar, Card } from "../components/Primitives.jsx";

const DIFFICULTIES = [
  ["beginner", "Beginner"],
  ["novice", "Novice"],
  ["intermediate", "All"],
];

export default function RoutineView({ customRoutine, setCustomRoutine, userProfile, setUserProfile, history = [], accent, setActiveView, checkIns = [], settings = {}, goals = [], exConfig = {} }) {
  const routine = normalizeCustomRoutine(customRoutine);
  const profile = normalizeUserProfile(userProfile);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState("all");
  const [difficulty, setDifficulty] = useState(routine.difficulty || "beginner");
  const [showRisky, setShowRisky] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState(null);
  const [musclePickerOpen, setMusclePickerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [coachGenerated, setCoachGenerated] = useState(null);
  const [browseTab, setBrowseTab] = useState("browse"); // "browse" | "selected"
  const selected = useMemo(() => customRoutineWorkout(routine).exercises, [routine]);
  // Week-level view: union of exercises across every routine (A + B + ...)
  // so push/pull/leg/core balance is judged against the full split, not one day.
  const weekExercises = useMemo(() => allRoutineExercises(routine), [routine]);
  const coverage = routineCoverage(weekExercises);
  const balance = routineBalanceScore(weekExercises);
  const suggestions = useMemo(() => routineEditSuggestions({ routine, exercises:selected, allExercises:weekExercises, history, userProfile:profile }), [routine, selected, weekExercises, history, profile]);
  const coachNotes = useMemo(() => buildCoachNotes({ routine, allExercises:weekExercises, history, checkIns, balance, coverage }), [routine, weekExercises, history, checkIns, balance, coverage]);
  const recentIds = useMemo(() => [...new Set(history.flatMap(h => h.exercises || []).slice(0, 18).map(ex => ex.id || ex.plannedId || exerciseId(ex.name)).filter(Boolean))], [history]);
  const complete = coverage.every(item => item.ok);
  const categories = [["all", "All"], ...MUSCLE_COVERAGE_GROUPS.map(([key, label]) => [key, label])];
  const riskyHidden = useMemo(
    () => !showRisky && profile.limitations?.length > 0
      ? EXERCISE_LIBRARY.filter(ex => exerciseIsRisky(ex.name, profile.limitations) && !routine.avoidedExerciseIds?.includes(ex.id)).length
      : 0,
    [showRisky, profile.limitations, routine.avoidedExerciseIds]
  );
  const visible = EXERCISE_LIBRARY.filter(ex => {
    const muscles = [...(ex.primary || []), ...(ex.secondary || [])];
    const inMuscle = !muscleFilter || muscles.includes(muscleFilter);
    const inCategory = muscleFilter ? true : category === "all" || MUSCLE_COVERAGE_GROUPS.find(([key]) => key === category)?.[2].some(m => muscles.includes(m));
    const inDifficulty = difficulty === "intermediate" || ex.difficulty === "beginner" || difficulty === ex.difficulty;
    const inEquipment = equipment === "all" || ex.equipment === equipment;
    const mv = getExerciseMovement(ex.name) || "";
    const inSearch = !query.trim() || `${ex.name} ${ex.tip} ${ex.equipment} ${ex.primary?.join(" ")} ${mv}`.toLowerCase().includes(query.trim().toLowerCase());
    const notAvoided = !routine.avoidedExerciseIds?.includes(ex.id);
    const notRisky = showRisky || !exerciseIsRisky(ex.name, profile.limitations);
    return inMuscle && inCategory && inDifficulty && inEquipment && inSearch && notAvoided && notRisky;
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
  const buildWithCoach = () => {
    const result = generateCoachRoutine({ userProfile:profile, settings, history, checkIns, goals, exConfig });
    save({ name:result.name, exerciseIds:result.exerciseIds, difficulty:result.difficulty });
    setCoachGenerated(result.rationale);
    setTemplatesOpen(false);
    setBrowseTab("selected");
  };

  const moveExerciseInRoutine = (id, dir) => {
    const ids = [...routine.exerciseIds];
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= ids.length) return;
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    save({ exerciseIds: ids });
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
        <div style={{fontSize:13,color:"#999",marginTop:7,fontWeight:600}}>build balanced workouts</div>
      </div>

      {/* BUILD WITH COACH */}
      <div style={{padding:"12px 16px 0"}}>
        <button onClick={buildWithCoach}
          style={{width:"100%",padding:"16px",background:`linear-gradient(135deg,${accent}22,${accent}0a)`,border:`1.5px solid ${accent}66`,borderRadius:12,color:accent,fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:".1em",cursor:"pointer",boxShadow:`0 0 24px ${accent}1e`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <span style={{fontSize:20}}>🤖</span> BUILD ROUTINE WITH COACH
        </button>
        {coachGenerated && (
          <div style={{marginTop:8,padding:"10px 12px",background:surface.bg0,border:`1px solid ${accent}33`,borderRadius:9}}>
            <div style={{fontSize:11,color:accent,fontWeight:800,marginBottom:5}}>Coach built your routine</div>
            {coachGenerated.map((line, i) => (
              <div key={i} style={{fontSize:12,color:text.tertiary,lineHeight:1.45}}>· {line}</div>
            ))}
            <button onClick={()=>setCoachGenerated(null)} style={{marginTop:6,fontSize:11,color:text.faint,background:"transparent",border:"none",cursor:"pointer",padding:0}}>dismiss</button>
          </div>
        )}
      </div>

      <div style={{padding:"12px 16px 6px"}}>
        <button onClick={() => setTemplatesOpen(v => !v)}
          style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 15px",background:surface.bg0,border:`1.5px solid ${templatesOpen?"#2a2a2a":"#1a1a1a"}`,borderRadius:10,cursor:"pointer",textAlign:"left",marginBottom:templatesOpen?10:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:13,color:"#e0e0e0",fontWeight:700}}>Templates</span>
            {!templatesOpen && routine.activeRoutineId && (() => { const t = ROUTINE_TEMPLATES.find(t => t.id === routine.activeRoutineId); return t ? <span style={{fontSize:11,color:text.muted,background:surface.bg3,padding:"3px 8px",borderRadius:5}}>{t.name}</span> : null; })()}
          </div>
          <span style={{fontSize:16,color:"#aaa",transition:"transform .2s",display:"inline-block",transform:templatesOpen?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
        </button>
        {templatesOpen && (
          <div style={{display:"grid",gap:8}}>
            {ROUTINE_TEMPLATES.map(template => (
              <button key={template.id} onClick={()=>{ applyTemplate(template); setTemplatesOpen(false); }}
                style={{textAlign:"left",padding:"12px 13px",background:routine.activeRoutineId===template.id?`${accent}18`:"#0d0d0d",border:`1px solid ${routine.activeRoutineId===template.id?accent:"#1f1f1f"}`,borderRadius:10,color:"#eee",cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <span style={{fontSize:14,fontWeight:900,color:routine.activeRoutineId===template.id?accent:"#eee"}}>{template.name}</span>
                  <span style={{fontSize:11,color:text.tertiary,textTransform:"uppercase"}}>{template.difficulty}</span>
                </div>
                <div style={{fontSize:12,color:text.tertiary,marginTop:5}}>{template.exerciseIds.length} movements · balanced full body</div>
              </button>
            ))}
          </div>
        )}
      </div>

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
                          style={{width:"100%",background:surface.bg4,border:`1px solid ${accent}66`,borderRadius:6,color:"#f0f0f0",padding:"6px 8px",fontSize:13,fontWeight:800,outline:"none"}} />
                      ) : (
                        <span style={{fontSize:13,fontWeight:800}}>{item.name}</span>
                      )}
                    </button>
                    <span style={{fontSize:11,color:text.tertiary,flexShrink:0}}>{item.exerciseIds.length} moves</span>
                  </div>
                  {/* Action row */}
                  <div style={{display:"flex",borderTop:"1px solid #1a1a1a"}}>
                    {[
                      { label:"✏", title:"Rename", action:()=>setRenamingId(isRenaming ? null : item.id) },
                      { label:"⧉", title:"Duplicate", action:()=>duplicateRoutine(item) },
                      { label:"↑", title:"Move up",   action:()=>moveRoutine(item.id, -1), disabled:idx===0 },
                      { label:"↓", title:"Move down", action:()=>moveRoutine(item.id,  1), disabled:idx===routine.routines.length-1 },
                      { label:"✕", title:"Delete", action:()=>deleteRoutine(item.id), disabled:routine.routines.length<=1, color:status.caution },
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

      {/* ── COACH NOTES (open by default) ───────────────────────────────────── */}
      <CoachNotesSection notes={coachNotes} />

      {/* ── CURRENT ROUTINE CARD ─────────────────────────────────────────────── */}
      <div style={{margin:"0 16px 14px",padding:"15px",background:surface.bg0,border:`1.5px solid ${complete ? status.good : accent}55`,borderRadius:12,boxShadow:`0 0 24px ${accent}10`}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:14}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11,color:accent,fontWeight:700}}>Current Routine</div>
            <input value={routine.name} onChange={e=>save({name:e.target.value})}
              style={{width:"100%",boxSizing:"border-box",marginTop:6,background:"#101010",border:"1px solid #252525",borderRadius:8,color:"#f0f0f0",padding:"10px 11px",fontSize:16,fontWeight:700,outline:"none"}} />
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <Disp size={34} color={complete ? status.good : status.warn} style={{display:"block"}}>{selected.length}</Disp>
            <Caps style={{display:"block",marginTop:2}}>Exercises</Caps>
            <Caps size={9} color={balance >= 80 ? status.good : status.warn} style={{display:"block",marginTop:3}}>Balance {balance}/100</Caps>
          </div>
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
        {!complete&&<div style={{fontSize:12,color:status.warn,lineHeight:1.45,marginTop:10}}>Add at least one push, pull, legs, and core movement before using this routine.</div>}
      </div>

      {/* ── ROUTINE BALANCE (collapsed) ─────────────────────────────────────── */}
      <Section title={`Routine balance · ${balance}/100`} defaultOpen={false}>
        <div style={{marginBottom:12}}>
          <Bar value={balance} max={100} color={balance >= 80 ? status.good : balance >= 60 ? status.warn : status.caution} height={6} />
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {coverage.map(item => (
            <div key={item.key} style={{padding:"9px 6px",borderRadius:8,border:`1px solid ${item.ok ? "#4ade8066" : "#fb718555"}`,background:item.ok ? "#4ade8014" : "#fb718511",textAlign:"center"}}>
              <div style={{fontSize:10,color:item.ok ? status.good : status.caution,fontWeight:900}}>{item.label}</div>
              <div style={{fontSize:10,color:text.tertiary,marginTop:3}}>{item.hits.length || 0} hit</div>
            </div>
          ))}
        </div>
        {!complete && <div style={{fontSize:12,color:status.warn,lineHeight:1.45,marginTop:10}}>Cover push, pull, legs, and core before using this routine.</div>}
      </Section>

      {/* ── EXERCISE SUGGESTIONS (collapsed) ────────────────────────────────── */}
      {suggestions.length > 0 && (
        <CoachEditsSection suggestions={suggestions} save={save} routine={routine} accent={accent} />
      )}

      <Section title="Exercises">
        {/* SELECTED / BROWSE tabs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
          {[["selected",`Selected (${selected.length})`],["browse","Browse"]].map(([tab,label])=>(
            <button key={tab} onClick={()=>setBrowseTab(tab)}
              style={{padding:"10px",borderRadius:9,border:`1.5px solid ${browseTab===tab?accent:"#1f1f1f"}`,background:browseTab===tab?`${accent}18`:"#0d0d0d",color:browseTab===tab?accent:"#777",fontSize:12,fontWeight:800,cursor:"pointer"}}>
              {label}
            </button>
          ))}
        </div>

        {/* ── SELECTED VIEW ─────────────────────────────────────── */}
        {browseTab === "selected" && (
          <div style={{display:"grid",gap:7}}>
            {selected.length === 0 && (
              <div style={{padding:"20px",textAlign:"center",color:text.faint,fontSize:13}}>No exercises selected yet. Use Browse or Build with Coach.</div>
            )}
            {selected.map((ex, idx) => (
              <div key={ex.id || ex.name} style={{display:"flex",alignItems:"center",gap:8,padding:"11px 12px",background:surface.bg0,border:`1.5px solid ${accent}33`,borderRadius:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:accent,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.name}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>
                    {[...(ex.primary||[]),...(ex.secondary||[])].slice(0,3).map(m=>(
                      <span key={m} style={{fontSize:10,color:text.tertiary,border:"1px solid #2a2a2a",borderRadius:5,padding:"2px 6px"}}>{MUSCLE_LABELS[m]||m}</span>
                    ))}
                    <span style={{fontSize:10,color:text.muted,border:"1px solid #1f1f1f",borderRadius:5,padding:"2px 6px"}}>{ex.equipment}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button onClick={()=>moveExerciseInRoutine(ex.id,-1)} disabled={idx===0}
                    style={{width:30,height:30,background:surface.bg3,border:"1px solid #2a2a2a",borderRadius:7,color:idx===0?"#333":"#aaa",fontSize:13,cursor:idx===0?"default":"pointer"}}>↑</button>
                  <button onClick={()=>moveExerciseInRoutine(ex.id,1)} disabled={idx===selected.length-1}
                    style={{width:30,height:30,background:surface.bg3,border:"1px solid #2a2a2a",borderRadius:7,color:idx===selected.length-1?"#333":"#aaa",fontSize:13,cursor:idx===selected.length-1?"default":"pointer"}}>↓</button>
                  <button onClick={()=>toggle(ex.id)}
                    style={{width:30,height:30,background:surface.bg3,border:"1px solid #fb718544",borderRadius:7,color:status.caution,fontSize:14,cursor:"pointer"}}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BROWSE VIEW ───────────────────────────────────────── */}
        {browseTab === "browse" && (<>
        {recentIds.length > 0 && (
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:4}}>
            {recentIds.slice(0, 8).map(id => {
              const ex = EXERCISE_LIBRARY.find(item => item.id === id);
              return ex ? <button key={id} onClick={()=>toggle(ex.id)} style={{flexShrink:0,padding:"8px 10px",border:`1px solid ${accent}66`,borderRadius:8,background:"#101010",color:accent,fontSize:11,fontWeight:800,cursor:"pointer"}}>{ex.name}</button> : null;
            })}
          </div>
        )}

        {/* Search — always visible */}
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search exercises, muscles, equipment…"
          style={{width:"100%",boxSizing:"border-box",marginBottom:8,background:"#101010",border:"1px solid #2a2a2a",borderRadius:10,color:"#f0f0f0",padding:"13px 14px",fontSize:14,outline:"none"}} />

        {/* Filters accordion — contains muscle map, category chips, equipment, difficulty */}
        {(() => {
          const filtersActive = muscleFilter || category !== "all" || equipment !== "all" || difficulty !== "beginner";
          return (
            <>
              <button onClick={() => setFiltersOpen(v => !v)}
                style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 15px",marginBottom:filtersOpen?0:8,background:filtersActive?`${accent}14`:"#0d0d0d",border:`1.5px solid ${filtersActive?`${accent}66`:"#1f1f1f"}`,borderRadius:10,cursor:"pointer",textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,color:filtersActive?accent:"#bbb",fontWeight:800}}>Filters</span>
                  {filtersActive && (
                    <span style={{fontSize:10,color:accent,background:`${accent}22`,border:`1px solid ${accent}44`,borderRadius:10,padding:"2px 8px",fontWeight:800,letterSpacing:".06em"}}>ACTIVE</span>
                  )}
                </div>
                <span style={{fontSize:16,color:"#aaa",transition:"transform .2s",display:"inline-block",transform:filtersOpen?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
              </button>
              {filtersOpen && (
                <div style={{padding:"14px",background:"#070707",border:`1px solid #1f1f1f`,borderRadius:10,marginBottom:10,display:"grid",gap:12}}>
                  {/* Muscle map */}
                  <div>
                    <div style={{fontSize:10,color:"#777",fontWeight:700,marginBottom:8}}>Filter by Muscle</div>
                    <MusclePickerDiagram
                      selectedMuscle={muscleFilter}
                      onSelect={m => { setMuscleFilter(prev => prev === m ? null : m); }}
                      accent={accent}
                    />
                    {muscleFilter && (
                      <button onClick={() => setMuscleFilter(null)} style={{marginTop:6,fontSize:11,color:text.tertiary,background:"transparent",border:"1px solid #2a2a2a",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>
                        Clear muscle filter
                      </button>
                    )}
                  </div>
                  {/* Category chips */}
                  <div>
                    <div style={{fontSize:10,color:"#777",fontWeight:700,marginBottom:8}}>Category</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {categories.map(([key, label]) => (
                        <button key={key} onClick={() => setCategory(key)}
                          style={{flexShrink:0,padding:"7px 14px",borderRadius:20,border:`1.5px solid ${category===key?accent:"#2a2a2a"}`,background:category===key?`${accent}22`:"#101010",color:category===key?accent:"#888",fontSize:12,fontWeight:800,letterSpacing:".05em",cursor:"pointer"}}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Equipment */}
                  <div>
                    <div style={{fontSize:10,color:"#777",fontWeight:700,marginBottom:8}}>Equipment</div>
                    <select value={equipment} onChange={e=>setEquipment(e.target.value)}
                      style={{width:"100%",background:"#101010",border:"1px solid #2a2a2a",borderRadius:9,color:"#f0f0f0",padding:"10px 12px",fontSize:13,outline:"none"}}>
                      {[["all","All Equipment"],["bodyweight","Bodyweight"],["dumbbells","Dumbbells"],["bands","Bands"],["machines","Machines"],["barbell","Barbell"],["kettlebell","Kettlebell"],["mobility","Mobility"]].map(([k,l])=>(<option key={k} value={k}>{l}</option>))}
                    </select>
                  </div>
                  {/* Difficulty */}
                  <div>
                    <div style={{fontSize:10,color:"#777",fontWeight:700,marginBottom:8}}>Difficulty</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                      {DIFFICULTIES.map(([key,label])=>(
                        <button key={key} onClick={()=>{setDifficulty(key);save({difficulty:key});}}
                          style={{padding:"9px 6px",borderRadius:8,border:`1.5px solid ${difficulty===key?accent:"#2a2a2a"}`,background:difficulty===key?`${accent}22`:"#101010",color:difficulty===key?accent:"#888",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
        {riskyHidden > 0 && (
          <button onClick={()=>setShowRisky(v=>!v)}
            style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",marginBottom:8,background:"#fb718511",border:"1px solid #fb718555",borderRadius:9,color:status.caution,textAlign:"left"}}>
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
            <div style={{fontSize:12,color:text.tertiary}}>
              {routine.avoidedExerciseIds?.length > 0 && `${routine.avoidedExerciseIds.length} avoided hidden. `}
              {riskyHidden > 0 && !showRisky && `${riskyHidden} risky for your limitations hidden.`}
            </div>
          )}
        </div>
        </>)}
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
              <span style={{fontSize:9,fontWeight:900,color:status.caution,background:"#fb718522",border:"1px solid #fb718544",borderRadius:10,padding:"2px 6px",textTransform:"uppercase"}}>⚠ {riskJoints.join("/")}</span>
            )}
            {uni && <span style={{fontSize:9,color:"#94a3b8",background:"#94a3b822",border:"1px solid #94a3b844",borderRadius:10,padding:"2px 6px",fontWeight:700}}>UNI</span>}
          </div>
          <div style={{fontSize:12,color:text.tertiary,lineHeight:1.4,marginTop:4}}>{ex.tip}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
            {mv && <span style={{fontSize:10,color:status.info,border:"1px solid #60a5fa44",borderRadius:5,padding:"3px 6px"}}>{_MOVEMENT_LABELS[mv]||mv}</span>}
            {[...(ex.primary || []), ...(ex.secondary || [])].slice(0,3).map((m, i) => (
              <span key={`${m}_${i}`} style={{fontSize:10,color:"#aaa",border:"1px solid #2a2a2a",borderRadius:5,padding:"3px 6px"}}>{MUSCLE_LABELS[m] || m}</span>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,textAlign:"right"}}>
          <div style={{fontSize:11,color:ex.ageFriendly?status.good:status.warn,fontWeight:800,textTransform:"uppercase"}}>{ex.difficulty}</div>
          <div style={{fontSize:11,color:"#777",marginTop:3}}>{ex.equipment}</div>
          {defW > 0 && <div style={{fontSize:10,color:text.faint,marginTop:2}}>~{defW}lb</div>}
          <button onClick={(e)=>{ e.stopPropagation(); onFavorite(); }} style={{background:"transparent",border:"none",color:favorite?status.warn:"#555",fontSize:17,padding:0,marginTop:4}}>★</button>
          <button onClick={(e)=>{ e.stopPropagation(); onAvoid(); }} style={{display:"block",background:"transparent",border:"none",color:status.caution,fontSize:10,fontWeight:900,padding:0,marginTop:4}}>AVOID</button>
          <div style={{fontSize:20,color:active?accent:"#555",marginTop:4}}>{active ? "✓" : "+"}</div>
        </div>
      </div>
    </div>
  );
}

function ProfileInput({ label, value, onChange }) {
  return (
    <label style={{display:"grid",gap:5}}>
      <span style={{fontSize:10,color:text.tertiary,fontWeight:800}}>{label}</span>
      <input value={value} onChange={e=>onChange(e.target.value)} inputMode="numeric" type="number" min="0"
        style={{minWidth:0,background:"#101010",border:"1px solid #292929",borderRadius:8,color:"#f0f0f0",padding:"10px 8px",fontSize:14,fontWeight:800,outline:"none"}} />
    </label>
  );
}

function CoachEditsSection({ suggestions, save, routine, accent }) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const actionable = suggestions.filter(s => s.actionId && s.actionType);
  const highPriority = suggestions.filter(s => s.priority >= 3);

  const applyAll = () => {
    let ids = [...routine.exerciseIds];
    for (const s of actionable) {
      if (s.actionType === "add") {
        if (!ids.includes(s.actionId)) ids.push(s.actionId);
      } else if (s.actionType === "swap" && s.swapFromId) {
        ids = ids.map(id => id === s.swapFromId ? s.actionId : id);
      }
    }
    save({ exerciseIds: [...new Set(ids)] });
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div style={{padding:"20px 16px 6px"}}>
      {/* Bulk fix banner — shows when there are high-priority actionable suggestions */}
      {actionable.length > 0 && (
        <div style={{marginBottom:10,padding:"13px 14px",background:"#fb923c12",border:"1px solid #fb923c55",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,color:"#fb923c",fontWeight:900}}>
              {applied ? "✓ Applied!" : `Coach found ${actionable.length} fix${actionable.length===1?"":"es"}`}
            </div>
            <div style={{fontSize:11,color:text.tertiary,marginTop:3}}>
              {applied ? "Routine updated." : highPriority.length > 0 ? `${highPriority.length} high-priority · gaps, swaps, risks` : "Balance and coverage improvements available"}
            </div>
          </div>
          <button onClick={applyAll} disabled={applied}
            style={{flexShrink:0,padding:"9px 14px",background:applied?"#4ade8022":"#fb923c",border:"none",borderRadius:8,color:applied?status.good:"#1a0a00",fontSize:12,fontWeight:900,letterSpacing:".06em",cursor:applied?"default":"pointer"}}>
            {applied ? "DONE ✓" : "LET COACH FIX THIS"}
          </button>
        </div>
      )}

      {/* Collapsible detail list */}
      <button onClick={() => setOpen(v => !v)}
        style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:surface.bg0,border:"1px solid #1f1f1f",borderRadius:10,cursor:"pointer",textAlign:"left",marginBottom:open?8:0}}>
        <span style={{fontSize:13,color:"#ddd",fontWeight:700}}>Exercise suggestions ({suggestions.length})</span>
        <span style={{fontSize:12,color:text.tertiary}}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{display:"grid",gap:8}}>
          {suggestions.map((item, index) => {
            const isHigh = item.priority >= 3;
            const borderCol = isHigh ? "#fb718566" : item.type === "risk" ? "#fbbf2455" : "#1f1f1f";
            const titleCol  = isHigh ? status.caution   : item.type === "risk" ? status.warn   : "#eee";
            return (
              <div key={`${item.type}_${index}`} style={{padding:"11px 12px",background:surface.bg0,border:`1px solid ${borderCol}`,borderRadius:9}}>
                <div style={{fontSize:13,color:titleCol,fontWeight:900}}>{item.title}</div>
                <div style={{fontSize:12,color:text.tertiary,lineHeight:1.4,marginTop:4}}>{item.detail}</div>
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
      )}
    </div>
  );
}

const TONE_COLOR = { warning:"#fb7185", good:"#4ade80", neutral:"#aaa" };

function CoachNotesSection({ notes }) {
  const [open, setOpen] = useState(true);
  if (!notes?.length) return null;
  return (
    <div style={{padding:"0 16px 8px"}}>
      <button onClick={() => setOpen(v => !v)}
        style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:surface.bg0,border:"1.5px solid #1f1f1f",borderRadius:10,padding:"13px 15px",cursor:"pointer",textAlign:"left",marginBottom:open?10:0}}>
        <span style={{fontSize:13,color:"#e0e0e0",fontWeight:700}}>What the coach noticed</span>
        <span style={{fontSize:16,color:"#aaa",transition:"transform .2s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
      </button>
      {open && (
        <div style={{display:"grid",gap:8}}>
          {notes.map((note, i) => {
            const col = TONE_COLOR[note.tone] || "#aaa";
            return (
              <Card key={i} level={1} style={{border:`1px solid ${col}44`}}>
                <div style={{fontSize:13,color:col,fontWeight:700,marginBottom:5}}>{note.title}</div>
                <div style={{fontSize:13,color:"#bbb",lineHeight:1.55}}>{note.text}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{padding:"8px 16px 6px"}}>
      <button onClick={() => setOpen(v => !v)}
        style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:surface.bg0,border:"1.5px solid #1f1f1f",borderRadius:10,padding:"13px 15px",cursor:"pointer",textAlign:"left",marginBottom:open?10:0}}>
        <Caps size={11} color="#e0e0e0" weight={700}>{title}</Caps>
        <span style={{fontSize:16,color:"#aaa",transition:"transform .2s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
      </button>
      {open && children}
    </div>
  );
}

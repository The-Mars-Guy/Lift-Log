import { useState } from "react";
import { EXERCISE_LIBRARY } from "../../data.js";
import { useSessionTimer, fmtDuration } from "../../hooks.js";
import { surface, text } from "../../theme.js";

export default function LogbookPanel({ accent, onClose, onSave }) {
  const [entries, setEntries] = useState([]); // [{name, sets:[{weight,reps}]}]
  const [query, setQuery]     = useState("");
  const [addingSet, setAddingSet] = useState(null); // exercise name currently open
  const [setDraft, setSetDraft]   = useState({ weight: 0, reps: 10 });
  const timer = useSessionTimer(true);
  const totalSets = entries.reduce((s, e) => s + e.sets.length, 0);
  const hasEntries = entries.length > 0;

  const libMatches = query.trim().length > 0
    ? EXERCISE_LIBRARY.filter(ex => ex.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const addExercise = (name) => {
    if (!entries.find(e => e.name === name)) setEntries(p => [...p, { name, sets: [] }]);
    setQuery("");
    setAddingSet(name);
    setSetDraft({ weight: 0, reps: 10 });
  };

  const logSet = (name) => {
    setEntries(p => p.map(e => e.name === name ? { ...e, sets: [...e.sets, { weight: setDraft.weight, reps: setDraft.reps }] } : e));
    setAddingSet(null);
  };

  const removeSet = (name, idx) => setEntries(p => p.map(e => e.name === name ? { ...e, sets: e.sets.filter((_, i) => i !== idx) } : e));
  const removeExercise = (name) => { setEntries(p => p.filter(e => e.name !== name)); if (addingSet === name) setAddingSet(null); };

  const finish = () => {
    if (!hasEntries) { onClose(); return; }
    const exSnap = entries.map(e => ({
      id: e.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      name: e.name,
      sets: e.sets.length,
      reps: e.sets[0]?.reps || 0,
      setLog: e.sets,
    }));
    onSave({ exercises: exSnap, duration: timer });
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:surface.bgSolid,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:`calc(16px + env(safe-area-inset-top)) 16px calc(80px + env(safe-area-inset-bottom))`}}>
      <div className="mobile-shell">
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,color:accent,fontWeight:700,marginBottom:2}}>Free Log</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:text.primary,letterSpacing:".06em",lineHeight:.9}}>LOGBOOK</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:accent}}>{fmtDuration(timer)}</div>
            <div style={{fontSize:11,color:text.muted,marginTop:2}}>{totalSets} set{totalSets!==1?"s":""} logged</div>
            <button onClick={onClose} style={{marginTop:6,background:"transparent",border:`1px solid rgba(255,140,50,.15)`,borderRadius:8,color:text.tertiary,padding:"6px 12px",fontSize:11,letterSpacing:".08em",cursor:"pointer"}}>EXIT</button>
          </div>
        </div>

        {/* Exercise entries */}
        {entries.map(entry => (
          <div key={entry.name} style={{marginBottom:12,background:surface.bg0,border:`1.5px solid ${addingSet===entry.name?accent:"rgba(255,140,50,.10)"}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 13px"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:text.primary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.name}</div>
                <div style={{fontSize:12,color:text.muted,marginTop:2}}>{entry.sets.length} set{entry.sets.length!==1?"s":""}</div>
              </div>
              <button onClick={() => { setAddingSet(addingSet===entry.name?null:entry.name); setSetDraft({ weight:0, reps:10 }); }}
                style={{padding:"8px 12px",background:addingSet===entry.name?`${accent}22`:surface.bg2,border:`1px solid ${addingSet===entry.name?accent:"rgba(255,140,50,.15)"}`,borderRadius:8,color:addingSet===entry.name?accent:text.secondary,fontSize:12,fontWeight:800,letterSpacing:".06em",cursor:"pointer"}}>
                + SET
              </button>
              <button onClick={() => removeExercise(entry.name)}
                style={{padding:"6px 10px",background:"transparent",border:"none",color:text.faint,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
            </div>
            {/* Logged sets */}
            {entry.sets.length > 0 && (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"0 13px 12px"}}>
                {entry.sets.map((s, idx) => (
                  <div key={idx} onClick={() => removeSet(entry.name, idx)} title="Tap to remove"
                    style={{padding:"7px 10px",background:`${accent}18`,border:`1px solid ${accent}44`,borderRadius:8,fontSize:12,color:accent,fontWeight:700,cursor:"pointer"}}>
                    {s.weight > 0 ? `${s.weight}lb` : "BW"} × {s.reps}
                  </div>
                ))}
              </div>
            )}
            {/* Inline set logger */}
            {addingSet === entry.name && (
              <div style={{borderTop:`1px solid rgba(255,140,50,.08)`,padding:"13px"}}>
                <div style={{display:"grid",gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:10,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>WEIGHT (lbs)</div>
                    <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:9,border:`1px solid ${accent}33`,overflow:"hidden"}}>
                      <button onClick={() => setSetDraft(p => ({...p,weight:Math.max(p.weight-5,0)}))} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20,cursor:"pointer",flexShrink:0}}>−</button>
                      <input value={setDraft.weight} onChange={e=>setSetDraft(p=>({...p,weight:Math.max(Number(e.target.value)||0,0)}))} onFocus={e=>e.target.select()} inputMode="decimal" type="number" min="0"
                        style={{flex:1,minWidth:0,width:"100%",textAlign:"center",fontSize:18,fontWeight:700,color:text.primary,background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono,monospace",padding:"0 4px"}}/>
                      <button onClick={() => setSetDraft(p => ({...p,weight:p.weight+5}))} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20,cursor:"pointer",flexShrink:0}}>+</button>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:text.tertiary,letterSpacing:".1em",marginBottom:5}}>REPS</div>
                    <div style={{display:"flex",alignItems:"center",background:surface.bg2,borderRadius:9,border:`1px solid ${accent}33`,overflow:"hidden"}}>
                      <button onClick={() => setSetDraft(p => ({...p,reps:Math.max(p.reps-1,0)}))} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20,cursor:"pointer",flexShrink:0}}>−</button>
                      <input value={setDraft.reps} onChange={e=>setSetDraft(p=>({...p,reps:Math.max(Math.round(Number(e.target.value)||0),0)}))} onFocus={e=>e.target.select()} inputMode="numeric" type="number" min="0"
                        style={{flex:1,minWidth:0,width:"100%",textAlign:"center",fontSize:18,fontWeight:700,color:text.primary,background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono,monospace",padding:"0 4px"}}/>
                      <button onClick={() => setSetDraft(p => ({...p,reps:p.reps+1}))} style={{width:44,height:46,background:"transparent",border:"none",color:text.secondary,fontSize:20,cursor:"pointer",flexShrink:0}}>+</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => logSet(entry.name)}
                  style={{width:"100%",padding:"13px",background:accent,border:"none",borderRadius:9,color:"#050505",fontSize:14,fontWeight:800,letterSpacing:".08em",cursor:"pointer"}}>LOG SET</button>
              </div>
            )}
          </div>
        ))}

        {/* Add exercise search */}
        <div style={{marginBottom:16}}>
          <div style={{position:"relative"}}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && query.trim() && !libMatches.length) addExercise(query.trim()); }}
              placeholder="Search or type exercise name…"
              style={{width:"100%",boxSizing:"border-box",padding:"13px 54px 13px 14px",background:surface.bg0,border:`1px solid ${accent}44`,borderRadius:10,color:text.primary,fontSize:14,outline:"none"}}
            />
            {query.trim() && (
              <button onClick={() => addExercise(query.trim())}
                style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",padding:"7px 10px",background:accent,border:"none",borderRadius:7,color:"#050505",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:".06em"}}>ADD</button>
            )}
          </div>
          {libMatches.length > 0 && (
            <div style={{marginTop:4,background:surface.bg0,border:`1px solid rgba(255,140,50,.10)`,borderRadius:10,overflow:"hidden"}}>
              {libMatches.map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex.name)}
                  style={{width:"100%",display:"flex",justifyContent:"space-between",padding:"11px 14px",background:"transparent",border:"none",borderBottom:`1px solid rgba(255,140,50,.07)`,color:text.primary,textAlign:"left",cursor:"pointer"}}>
                  <span style={{fontSize:14,fontWeight:700}}>{ex.name}</span>
                  <span style={{fontSize:11,color:text.muted}}>{ex.equipment}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Finish */}
        <button onClick={finish} disabled={!hasEntries}
          style={{width:"100%",padding:"18px",borderRadius:13,border:hasEntries?"none":`1px solid rgba(255,140,50,.12)`,background:hasEntries?accent:surface.bg2,color:hasEntries?"#050505":text.muted,fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:".12em",boxShadow:hasEntries?`0 0 36px ${accent}4d`:"none",cursor:hasEntries?"pointer":"default"}}>
          {hasEntries ? "SEAL THE WORK" : "ADD A MOVEMENT TO BEGIN"}
        </button>

        {hasEntries && (
          <button onClick={onClose}
            style={{display:"block",margin:"12px auto 0",background:"transparent",border:"none",color:text.faint,fontSize:12,letterSpacing:".06em",cursor:"pointer"}}>discard &amp; exit</button>
        )}
      </div>
    </div>
  );
}

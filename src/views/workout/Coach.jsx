import { useEffect, useMemo, useRef, useState } from "react";
import { WORKOUTS, DAYS, todayName, pushPullRatio } from "../../data.js";
import { buildCoachInsights } from "../../coach.js";
import { surface, text, status } from "../../theme.js";
import { Caps, Disp } from "../../components/Primitives.jsx";

// ─── Insight constants ────────────────────────────────────────────────────────
const MUSCLE_SHORT = {
  chest:"Chest", lats:"Lats", upperBack:"Back", sideDelts:"Delts",
  biceps:"Bi", triceps:"Tri", quads:"Quads", hamstrings:"Hams",
  glutes:"Glutes", calves:"Calves", core:"Core",
};
const MUSCLE_ROW_ORDER = ["chest","lats","upperBack","sideDelts","biceps","triceps","quads","hamstrings","glutes","calves","core"];

function muscleDayColor(days) {
  if (days === null) return "#3a3b42";
  if (days === 0)    return "#4ade80";
  if (days <= 2)     return "#86efac";
  if (days <= 4)     return "#fbbf24";
  if (days <= 7)     return "#f97316";
  return "#ef4444";
}

function muscleDayLabel(days) {
  if (days === null) return "—";
  if (days === 0)    return "today";
  return `${days}d`;
}

// ─── Build suggestions (used externally) ─────────────────────────────────────
export function buildSuggestions({ history, progression, settings, exConfig, workoutKey }) {
  const workout = WORKOUTS[workoutKey];
  const suggs = [];
  const today = todayName();
  const sorted = [...history].sort((a,b)=>b.timestamp-a.timestamp);
  let streak=0;
  if(sorted.length>0){streak=1;for(let i=1;i<sorted.length;i++){if((sorted[i-1].timestamp-sorted[i].timestamp)/86400000<=4.5)streak++;else break;}}
  if(streak>=3&&streak<7) suggs.push({icon:"🔥",cat:"Streak",msg:`${streak} sessions in a row. You're building a real habit.`});
  if(streak>=7) suggs.push({icon:"⚡",cat:"Streak",msg:`${streak}-session streak. Your body is different than when you started.`});

  workout?.exercises.forEach(ex=>{
    const cfg=exConfig[ex.name];
    if(cfg?.pendingAdj>0) suggs.push({icon:"↗️",cat:"Progression",msg:`${ex.name}: +${cfg.pendingAdj} rep${cfg.pendingAdj>1?"s":""} unlocked. New target: ×${cfg.targetReps}.`});
    if(cfg?.pendingAdj<0) suggs.push({icon:"🎯",cat:"Adjustment",msg:`${ex.name}: target reduced to ×${cfg.targetReps}. Dialing in the right challenge.`});
  });

  if(!DAYS.includes(today)) suggs.push({icon:"🛌",cat:"Recovery",msg:"Rest day. Muscle grows during recovery. Protein + sleep > extra sets."});
  if(history.length===0) suggs.push({icon:"🌱",cat:"Welcome",msg:"Form now = gains forever. Feel the muscle work, don't just move weight."});
  return suggs.filter(Boolean);
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
export function CoachDrawer({ open, onClose, suggestions, memory, plan, accent, exercises = [], history = [], checkIns = [], exConfig = {}, userProfile = null, goals = [], bodyMetrics = [] }) {

  const insights = useMemo(
    () => buildCoachInsights({ history, exercises, exConfig, checkIns, userProfile, goals, bodyMetrics }),
    [history, exercises, exConfig, checkIns, userProfile, goals, bodyMetrics]
  );

  // Full-week push/pull across both workouts
  const allWeekExercises = useMemo(
    () => [...(WORKOUTS.A?.exercises || []), ...(WORKOUTS.B?.exercises || [])],
    []
  );
  const pp = useMemo(() => pushPullRatio(allWeekExercises), [allWeekExercises]);

  if (!open) return null;

  const behavior = memory?.behavior || {};
  const ppColor = pp.label === "balanced" ? "#4ade80" : "#fbbf24";
  const ppBarPush = pp.pushSets + pp.pullSets > 0
    ? Math.round((pp.pushSets / (pp.pushSets + pp.pullSets)) * 100)
    : 50;

  return (
    <div style={{position:"fixed",inset:0,zIndex:240,pointerEvents:"none"}}>
      <button aria-label="Close coach" onClick={onClose}
        style={{position:"absolute",inset:0,border:"none",background:"rgba(0,0,0,.52)",pointerEvents:"auto"}} />
      <div className="mobile-shell" style={{position:"absolute",left:0,right:0,bottom:"calc(82px + env(safe-area-inset-bottom))",padding:"0 14px",pointerEvents:"auto"}}>
        <div style={{
          background: surface.bg1,
          border: `1px solid rgba(255,255,255,.08)`,
          borderRadius: 20,
          boxShadow: `0 28px 80px rgba(0,0,0,.72), 0 0 0 1px rgba(255,255,255,.04)`,
          overflow: "hidden",
          animation: "slideUp .24s ease-out",
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 18px",
            background: `linear-gradient(135deg,${accent}1a,transparent)`,
            borderBottom: `1px solid rgba(255,255,255,.07)`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: accent, color: "#050505",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, letterSpacing: ".06em",
              boxShadow: `0 8px 20px ${accent}44`,
            }}>AI</div>
            <div style={{flex:1, minWidth:0}}>
              <Caps color={accent} size={9}>Coach</Caps>
              <Disp size={24} style={{display:"block", marginTop:2}}>
                {plan?.headline || "Training assistant"}
              </Disp>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 9,
              border: `1px solid rgba(255,255,255,.1)`,
              background: "rgba(255,255,255,.04)",
              color: text.tertiary, fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>

          <div style={{padding:"14px 16px", display:"grid", gap:10, maxHeight:"60vh", overflowY:"auto"}}>

            {/* Muscle Frequency */}
            <Section>
              <Caps style={{display:"block", marginBottom:10}}>Muscle Frequency</Caps>
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5}}>
                {MUSCLE_ROW_ORDER.map(m => {
                  const days = insights.muscleLastTrained[m];
                  const col = muscleDayColor(days);
                  return (
                    <div key={m} style={{
                      textAlign:"center", padding:"7px 4px", borderRadius:8,
                      background: `${col}14`, border: `1px solid ${col}33`,
                    }}>
                      <div style={{fontSize:10, color:col, fontWeight:700}}>{muscleDayLabel(days)}</div>
                      <div style={{fontSize:9, color:text.tertiary, letterSpacing:".06em", textTransform:"uppercase", marginTop:2}}>{MUSCLE_SHORT[m]}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex", gap:10, marginTop:8, flexWrap:"wrap"}}>
                {[["#4ade80","Today"],["#fbbf24","3–4d"],["#f97316","5–7d"],["#ef4444","8d+"],["#3a3b42","Never"]].map(([c,l])=>(
                  <div key={l} style={{display:"flex", alignItems:"center", gap:4}}>
                    <div style={{width:7, height:7, borderRadius:2, background:c}}/>
                    <Caps size={9} color={text.muted}>{l}</Caps>
                  </div>
                ))}
              </div>
              {insights.suggestion && (
                <div style={{marginTop:9, padding:"8px 10px", background:`${status.warn}16`, border:`1px solid ${status.warn}33`, borderRadius:8, fontSize:12, color:status.warn, lineHeight:1.45}}>
                  {insights.suggestion}
                </div>
              )}
            </Section>

            {/* Push · Pull Balance (full week) */}
            {(pp.pushSets > 0 || pp.pullSets > 0) && (
              <Section>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
                  <Caps>Push · Pull · Week</Caps>
                  <Caps color={ppColor} size={9}>{pp.label}</Caps>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                  <Caps color="#60a5fa" size={9} style={{minWidth:28}}>PUSH</Caps>
                  <div style={{flex:1, height:6, background:"rgba(255,255,255,.08)", borderRadius:999, overflow:"hidden", position:"relative"}}>
                    <div style={{position:"absolute", left:0, top:0, height:"100%", width:`${ppBarPush}%`, background:"#60a5fa", borderRadius:999, transition:"width .4s"}}/>
                    <div style={{position:"absolute", right:0, top:0, height:"100%", width:`${100-ppBarPush}%`, background:"#f97316", borderRadius:999}}/>
                  </div>
                  <Caps color="#f97316" size={9} style={{minWidth:28, textAlign:"right"}}>PULL</Caps>
                </div>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <Caps size={9} color={text.muted}>{pp.pushSets} sets</Caps>
                  <Caps size={9} color={text.muted}>{pp.ratio != null ? `${pp.ratio}:1 ratio` : "—"}</Caps>
                  <Caps size={9} color={text.muted}>{pp.pullSets} sets</Caps>
                </div>
                {pp.label !== "balanced" && (
                  <div style={{marginTop:8, fontSize:11, color:status.warn, lineHeight:1.4}}>
                    {pp.label === "push heavy"
                      ? "Add pull movements (rows, pulldowns) to balance the week."
                      : "Add push movements (press, fly) to balance the week."}
                  </div>
                )}
              </Section>
            )}

            {/* Weak Points */}
            {insights.weakPoints.length > 0 && (
              <Section>
                <Caps style={{display:"block", marginBottom:9}}>Weak Points</Caps>
                <div style={{display:"grid", gap:7}}>
                  {insights.weakPoints.map((wp, i) => (
                    <div key={i} style={{
                      padding: "9px 11px",
                      background: wp.type==="coverage" ? `${status.warn}14` : `${status.caution}14`,
                      border: `1px solid ${wp.type==="coverage" ? status.warn : status.caution}33`,
                      borderRadius: 9,
                    }}>
                      <div style={{fontSize:12, fontWeight:700, color: wp.type==="coverage" ? status.warn : status.caution}}>{wp.title}</div>
                      <div style={{fontSize:11, color:text.tertiary, marginTop:2, lineHeight:1.4}}>{wp.detail}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Stats row */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
              <MiniStat label="Logged" value={`${memory?.readinessCount||0}+${memory?.setFeedbackCount||0}`} accent={accent}/>
              <MiniStat label="Rest Skips" value={behavior.restSkips||0} accent={accent}/>
              <MiniStat label="Avg Rest" value={behavior.avgRestSeconds ? `${behavior.avgRestSeconds}s` : "—"} accent={accent}/>
            </div>

            {/* Coach memory */}
            <Section>
              <Caps style={{display:"block", marginBottom:7}}>What I Remember</Caps>
              <div style={{fontSize:13, lineHeight:1.55, color:text.secondary}}>
                {memory?.summary || "Still collecting enough sessions to spot patterns."}
              </div>
              {memory?.recoverySummary && (
                <div style={{fontSize:13, lineHeight:1.55, color:text.secondary, marginTop:8}}>{memory.recoverySummary}</div>
              )}
              {behavior.notes?.length>0 && (
                <div style={{fontSize:13, lineHeight:1.55, color:text.secondary, marginTop:8}}>{behavior.notes[0]}</div>
              )}
              {(memory?.profileNote || memory?.goalNote || memory?.weightNote) && (
                <div style={{marginTop:10, paddingTop:10, borderTop:`1px solid rgba(255,255,255,.06)`, display:"grid", gap:5}}>
                  {memory.profileNote && <div style={{fontSize:12, color:text.tertiary, lineHeight:1.45}}>👤 {memory.profileNote}</div>}
                  {memory.goalNote    && <div style={{fontSize:12, color:status.good, lineHeight:1.45}}>🎯 {memory.goalNote}</div>}
                  {memory.weightNote  && <div style={{fontSize:12, color:"#a78bfa", lineHeight:1.45}}>⚖️ {memory.weightNote}</div>}
                </div>
              )}
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ children }) {
  return (
    <div style={{
      padding: "12px 14px",
      background: surface.bg2,
      border: `1px solid rgba(255,255,255,.06)`,
      borderRadius: 14,
    }}>{children}</div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={{
      padding: "11px 8px",
      background: surface.bg2,
      border: `1px solid rgba(255,255,255,.06)`,
      borderRadius: 11,
      textAlign: "center",
    }}>
      <Disp size={22} color={accent} style={{display:"block"}}>{value}</Disp>
      <Caps size={9} style={{marginTop:3}}>{label}</Caps>
    </div>
  );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────
export function CoachFab({ onClick, accent }) {
  const [pos, setPos] = useState(null);
  const drag = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wt_coach_fab_pos") || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) setPos(saved);
    } catch { setPos(null); }
  }, []);

  const clampPos = (x, y) => {
    const pad = 10, size = 52;
    const maxX = Math.max(pad, window.innerWidth - size - pad);
    const maxY = Math.max(pad, window.innerHeight - size - pad);
    return { x: Math.min(Math.max(x, pad), maxX), y: Math.min(Math.max(y, pad), maxY) };
  };

  const beginDrag = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = event.touches?.[0] || event;
    const current = pos || { x: window.innerWidth - 72, y: window.innerHeight - 160 };
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
    if (last) { try { localStorage.setItem("wt_coach_fab_pos", JSON.stringify(last)); } catch {} }
    if (!wasMoved) onClick();
  };

  const position = pos
    ? { left:pos.x, top:pos.y }
    : { right:16, bottom:"calc(96px + env(safe-area-inset-bottom))" };

  return (
    <button
      onPointerDown={beginDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={() => { drag.current = null; }}
      style={{
        position: "fixed", ...position, zIndex: 130,
        width: 50, height: 50, borderRadius: 16,
        border: `1px solid ${accent}55`,
        background: `${accent}20`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: accent,
        boxShadow: `0 8px 28px ${accent}30, inset 0 1px 0 ${accent}30`,
        fontWeight: 900, letterSpacing: ".06em", fontSize: 11,
        touchAction: "none", cursor: "grab",
      }}
    >
      AI
    </button>
  );
}

// ─── CoachCard (kept for API compat, noop if no suggestions) ──────────────────
export function CoachCard() { return null; }

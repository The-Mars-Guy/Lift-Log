import { useState, useEffect, useRef } from "react";
import { IMG_BASE, VIDEO_BASE, WORKOUTS, isoDate, isoWeek, dateStr } from "../data.js";
import { remainingSeconds } from "../session.js";

// ── Exercise Animation ───────────────────────────────────────────────────────
export function ExerciseAnimation({ folder, accent, video }) {
  const [loaded, setLoaded] = useState({ 0:false, 1:false });
  const [videoFailed, setVideoFailed] = useState(false);
  const ready = loaded[0] && loaded[1];
  const videoSrc = video || `${VIDEO_BASE}/${folder}.mp4`;
  const frameStyle = {
    position:"absolute",
    inset:0,
    width:"100%",
    height:"100%",
    objectFit:"contain",
    willChange:"opacity, transform",
  };

  return (
    <div style={{
      position:"relative", width:"100%", aspectRatio:"1",
      maxWidth:340, margin:"0 auto",
      background:"linear-gradient(180deg,#fafafa,#eee)",
      borderRadius:13, overflow:"hidden",
      border:`1.5px solid ${accent}40`,
      boxShadow:`0 0 36px ${accent}18`,
    }}>
      {!videoFailed && (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded({ 0:true, 1:true })}
          onCanPlay={e => e.currentTarget.play().catch(() => setVideoFailed(true))}
          onError={() => setVideoFailed(true)}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",background:"#f2f2f2"}}
        />
      )}
      {videoFailed && !ready && (
        <div style={{
          position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#999", fontSize:12, letterSpacing:"0.15em",
          background:"linear-gradient(90deg,#f5f5f5,#fafafa,#f5f5f5)",
          backgroundSize:"200% 100%",
          animation:"shimmer 1.4s ease-in-out infinite",
        }}>LOADING...</div>
      )}
      {videoFailed && <img src={`${IMG_BASE}/${folder}/0.jpg`} alt="" onLoad={() => setLoaded(p=>({...p,0:true}))} onError={() => setLoaded(p=>({...p,0:true}))}
        style={{ ...frameStyle, opacity:ready?1:0, animation:ready?"exerciseFrameA 2.1s ease-in-out infinite":"none" }}/>
      }
      {videoFailed && <img src={`${IMG_BASE}/${folder}/1.jpg`} alt="" onLoad={() => setLoaded(p=>({...p,1:true}))} onError={() => setLoaded(p=>({...p,1:true}))}
        style={{ ...frameStyle, opacity:0, animation:ready?"exerciseFrameB 2.1s ease-in-out infinite":"none" }}/>
      }
    </div>
  );
}

// ── Rest Timer ───────────────────────────────────────────────────────────────
export function RestTimer({ seconds, label, onSkip, onComplete, accent, fullscreen=false }) {
  const [remaining, setRemaining] = useState(seconds);
  const fired = useRef(false);
  const endsAt = useRef(Date.now() + seconds * 1000);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    endsAt.current = Date.now() + seconds * 1000;
    fired.current = false;

    const tick = () => {
      const next = remainingSeconds(endsAt.current);
      setRemaining(next);
      if (next === 0 && !fired.current) {
        fired.current = true;
        onCompleteRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [seconds]);
  const pct  = (remaining / seconds) * 100;
  const r    = 22;
  const circ = 2 * Math.PI * r;
  if (fullscreen) {
    const bigR = 62;
    const bigCirc = 2 * Math.PI * bigR;
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:180,
        background:"#050505",
        display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 22px",
      }}>
        <div className="mobile-shell" style={{textAlign:"center"}}>
          <div style={{fontSize:12,color:"#888",letterSpacing:".16em",textTransform:"uppercase",marginBottom:20}}>Rest</div>
          <div style={{position:"relative",width:168,height:168,margin:"0 auto 26px"}}>
            <svg width="168" height="168" viewBox="0 0 168 168" style={{transform:"rotate(-90deg)"}}>
              <circle cx="84" cy="84" r={bigR} fill="none" stroke="#171717" strokeWidth="8"/>
              <circle cx="84" cy="84" r={bigR} fill="none" stroke={accent} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={bigCirc}
                strokeDashoffset={bigCirc*(1-pct/100)}
                style={{transition:"stroke-dashoffset .25s linear",filter:`drop-shadow(0 0 12px ${accent})`}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:72,color:accent,letterSpacing:".04em"}}>{remaining}</div>
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:"#f5f5f5",letterSpacing:".06em",lineHeight:1.05,marginBottom:10}}>{label}</div>
          <div style={{fontSize:13,color:"#888",lineHeight:1.5,marginBottom:30}}>Breathe, shake it out, then hit the next set clean.</div>
          <button onClick={onSkip}
            style={{width:"100%",padding:"18px",background:"transparent",border:`1.5px solid ${accent}77`,borderRadius:13,color:accent,fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:".12em"}}>
            SKIP REST
          </button>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      position:"fixed", bottom:64, left:0, right:0, zIndex:100,
      background:"linear-gradient(180deg,#0f0f0f,#050505)",
      borderTop:`1px solid ${accent}66`,
      padding:"16px 22px",
      boxShadow:`0 -8px 36px ${accent}33`,
      animation:"slideUp .25s ease-out",
    }}>
      <div className="mobile-shell" style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ position:"relative", width:56, height:56, flexShrink:0 }}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="28" cy="28" r={r} fill="none" stroke="#1a1a1a" strokeWidth="3.5"/>
            <circle cx="28" cy="28" r={r} fill="none" stroke={accent} strokeWidth="3.5"
              strokeLinecap="round" strokeDasharray={circ}
              strokeDashoffset={circ*(1-pct/100)}
              style={{ transition:"stroke-dashoffset 1s linear", filter:`drop-shadow(0 0 5px ${accent})` }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:accent, fontWeight:500 }}>{remaining}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, color:"#aaa", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:3 }}>REST · {remaining}s</div>
          <div style={{ fontSize:14, color:"#f0f0f0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</div>
        </div>
        <button onClick={onSkip}
          style={{ background:"transparent", border:`1.5px solid ${accent}66`, color:accent, padding:"10px 18px", borderRadius:8, fontSize:12, letterSpacing:"0.12em", flexShrink:0 }}>
          SKIP
        </button>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ icon="🎯", title, msg, accent, onClose, duration=4000 }) {
  useEffect(() => { const id=setTimeout(onClose,duration); return ()=>clearTimeout(id); }, [onClose,duration]);
  return (
    <div style={{ position:"fixed",top:16,left:16,right:16,zIndex:200, animation:"slideDown .3s ease-out", pointerEvents:"none" }}>
      <div style={{
        width:"100%", maxWidth:488, margin:"0 auto",
        background:"#0c0c0c", border:`1.5px solid ${accent}`,
        borderRadius:13, padding:"14px 18px",
        boxShadow:`0 0 40px ${accent}88,0 4px 24px rgba(0,0,0,.6)`,
        display:"flex", alignItems:"center", gap:14, pointerEvents:"auto",
      }}>
        <div style={{ fontSize:28 }}>{icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:accent, letterSpacing:"0.14em", fontWeight:500 }}>{title}</div>
          <div style={{ fontSize:14, color:"#f5f5f5", marginTop:3 }}>{msg}</div>
        </div>
      </div>
    </div>
  );
}

// ── Bottom Nav ───────────────────────────────────────────────────────────────
function IconDumbbell({ color, size=22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.2"/>
      <rect x="17.5" y="9.5" width="5" height="5" rx="1.2"/>
      <line x1="6.5" y1="12" x2="17.5" y2="12" strokeWidth="3"/>
      <line x1="5.5" y1="7.5" x2="5.5" y2="16.5"/>
      <line x1="18.5" y1="7.5" x2="18.5" y2="16.5"/>
    </svg>
  );
}
function IconStats({ color, size=22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="3" y="13" width="4.5" height="8" rx="1"/>
      <rect x="9.75" y="8" width="4.5" height="13" rx="1" opacity="0.75"/>
      <rect x="16.5" y="4" width="4.5" height="17" rx="1" opacity="0.9"/>
    </svg>
  );
}
function IconCalendar({ color, size=22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <circle cx="8.5" cy="14" r="1.3" fill={color} stroke="none"/>
      <circle cx="12" cy="14" r="1.3" fill={color} stroke="none"/>
      <circle cx="15.5" cy="14" r="1.3" fill={color} stroke="none"/>
    </svg>
  );
}
function IconGear({ color, size=22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { id:"workout",  label:"Workout",  Icon:IconDumbbell },
  { id:"stats",    label:"Stats",    Icon:IconStats    },
  { id:"calendar", label:"Calendar", Icon:IconCalendar },
  { id:"settings", label:"Settings", Icon:IconGear     },
];

export function BottomNav({ active, onSelect, accent, level, theme="dark" }) {
  const light = theme === "pop_light";
  return (
    <nav style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:90,
      background:light ? "rgba(255,255,255,0.94)" : "rgba(6,6,6,0.97)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderTop:light ? "1px solid rgba(120,135,160,.25)" : "1px solid #222",
      boxShadow:light ? "0 -12px 34px rgba(29,78,216,.10)" : "none",
      paddingBottom:"env(safe-area-inset-bottom)",
    }}>
      <div className="mobile-shell" style={{ display:"flex", justifyContent:"space-around", padding:"12px 4px 10px" }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const color = isActive ? accent : (light ? "#718096" : "#666");
          return (
            <button key={id} onClick={() => onSelect(id)}
              style={{
                flex:1, background:"transparent", border:"none",
                padding:"8px 4px", borderRadius:10,
                display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                position:"relative",
              }}>
              {/* Level badge on stats tab */}
              {id==="stats" && level && (
                <div style={{
                  position:"absolute", top:2, right:"18%",
                  width:18, height:18, borderRadius:"50%",
                  background:level.color, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:9, fontWeight:700, color:"#000", lineHeight:1,
                  boxShadow:`0 0 8px ${level.color}88`,
                }}>
                  {level.idx+1}
                </div>
              )}
              <div style={{ filter: isActive ? `drop-shadow(0 0 7px ${accent}bb)` : "none", transition:"filter .2s" }}>
                <Icon color={color} size={26} />
              </div>
              <div style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:isActive?700:400, color, lineHeight:1 }}>
                {label}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
export function BarChart({ data, color="#4ade80", height=130, label }) {
  if (!data?.length) return (
    <div style={{ padding:32, textAlign:"center", color:"#666", fontSize:12, letterSpacing:"0.1em" }}>NO DATA YET</div>
  );
  const max = Math.max(...data.map(d=>d.value), 1);
  const w   = 100/data.length;
  return (
    <div>
      {label && <div style={{ fontSize:11, color:"#888", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>{label}</div>}
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width:"100%", height }}>
        {data.map((d,i) => {
          const bh = (d.value/max)*(height-26);
          return (
            <g key={i}>
              <rect x={i*w+w*.18} y={height-20-bh} width={w*.64} height={bh}
                fill={d.color||color} opacity={d.value>0?.9:.25} rx="0.8"/>
              <text x={i*w+w/2} y={height-6} textAnchor="middle" fontSize="4" fill="#888" fontFamily="DM Mono,monospace">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Heatmap ──────────────────────────────────────────────────────────────────
export function Heatmap({ history }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const weeksBack = 12;
  const dateMap = {};
  for (const h of history) {
    const d = new Date(h.timestamp); d.setHours(0,0,0,0);
    dateMap[isoDate(d)] = h.workout;
  }
  const cells = [];
  for (let col=weeksBack-1; col>=0; col--) {
    const week = [];
    for (let row=0; row<7; row++) {
      const offset = col*7+(6-row);
      const d = new Date(today); d.setDate(d.getDate()-offset);
      const iso = isoDate(d);
      const w = dateMap[iso];
      week.push({ date:d, iso, workout:w, isFuture:d>today });
    }
    cells.push(week);
  }
  const cSz = 14, gap = 3;
  return (
    <div style={{ width:"100%" }}>
      <div style={{ display:"flex", gap }}>
        {cells.map((week,ci) => (
          <div key={ci} style={{ display:"flex", flexDirection:"column", gap }}>
            {week.map((c,ri) => {
              const color = c.workout ? WORKOUTS[c.workout].color : c.isFuture ? "#0a0a0a" : "#161616";
              const isToday = c.iso === isoDate(today);
              return (
                <div key={ri} title={`${dateStr(c.date)}${c.workout?" — "+WORKOUTS[c.workout].label:""}`}
                  style={{ width:cSz, height:cSz, background:color, borderRadius:3,
                    border:isToday?"1.5px solid #f0f0f0":"1px solid transparent",
                    boxShadow: c.workout ? `0 0 6px ${WORKOUTS[c.workout].color}66` : "none" }}/>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:11, fontSize:10, color:"#888", letterSpacing:"0.1em" }}>
        <span>{weeksBack} WEEKS AGO</span><span>TODAY</span>
      </div>
    </div>
  );
}

// ── MINI PROGRESS GRAPH ───────────────────────────────────────────────────────
export function MiniGraph({ data, color = "#4ade80", height = 80 }) {
  if (!data || data.length < 2) return (
    <div style={{ padding:"16px 0 8px", textAlign:"center", color:"#666", fontSize:13, letterSpacing:".06em" }}>
      Complete 2+ sessions to see your progress graph
    </div>
  );
  const max = Math.max(...data.map(d=>d.totalReps), 1);
  const min = Math.min(...data.map(d=>d.totalReps));
  const range = Math.max(max - min, 1);
  const W = 100, H = height, pad = 6;
  const pts = data.map((d,i)=>({
    x: pad + (i / (data.length-1)) * (W - pad*2),
    y: (H - 18) - ((d.totalReps - min) / range) * (H - 30),
    d,
  }));
  const path = pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length-1].x} ${H-12} L ${pts[0].x} ${H-12} Z`;
  const trend = data[data.length-1].totalReps - data[0].totalReps;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}>
        <span style={{color:"#aaa"}}>{data[0].date}</span>
        <span style={{color:trend>=0?"#4ade80":"#fb923c",fontWeight:500}}>{trend>=0?"+":""}{trend} reps {trend>=0?"↑":"↓"}</span>
        <span style={{color:"#aaa"}}>{data[data.length-1].date}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height,overflow:"visible"}}>
        <defs>
          <linearGradient id={`g-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#g-${color.replace("#","")})`}/>
        <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.5" fill={color}/>
            {(i===0||i===pts.length-1||pts.length<=6)&&(
              <text x={p.x} y={p.y-7} textAnchor="middle" fontSize="4.5" fill={color} fontFamily="DM Mono,monospace">{p.d.totalReps}</text>
            )}
          </g>
        ))}
        {pts.filter((_,i)=>i%(Math.ceil(pts.length/5))===0).map((p,i)=>(
          <text key={i} x={p.x} y={H-2} textAnchor="middle" fontSize="4" fill="#777" fontFamily="DM Mono,monospace">
            {p.d.date?.split(" ")[1]||""}
          </text>
        ))}
      </svg>
    </div>
  );
}

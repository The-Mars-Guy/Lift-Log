import { useState, useEffect, useRef } from "react";
import { IMG_BASE, WORKOUTS, isoDate, isoWeek, dateStr } from "../data.js";

// ── Exercise Animation ───────────────────────────────────────────────────────
export function ExerciseAnimation({ folder, accent }) {
  const [loaded, setLoaded] = useState({ 0:false, 1:false });
  const ready = loaded[0] && loaded[1];
  return (
    <div style={{
      position:"relative", width:"100%", aspectRatio:"1",
      maxWidth:340, margin:"0 auto",
      background:"linear-gradient(180deg,#fafafa,#eee)",
      borderRadius:13, overflow:"hidden",
      border:`1.5px solid ${accent}40`,
      boxShadow:`0 0 36px ${accent}18`,
    }}>
      {!ready && (
        <div style={{
          position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#999", fontSize:12, letterSpacing:"0.15em",
          background:"linear-gradient(90deg,#f5f5f5,#fafafa,#f5f5f5)",
          backgroundSize:"200% 100%",
          animation:"shimmer 1.4s ease-in-out infinite",
        }}>LOADING...</div>
      )}
      <img src={`${IMG_BASE}/${folder}/0.jpg`} alt="" onLoad={() => setLoaded(p=>({...p,0:true}))} onError={() => setLoaded(p=>({...p,0:true}))}
        style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain", opacity:ready?1:0, animation:ready?"exerciseFlip 1.6s ease-in-out infinite":"none" }}/>
      <img src={`${IMG_BASE}/${folder}/1.jpg`} alt="" onLoad={() => setLoaded(p=>({...p,1:true}))} onError={() => setLoaded(p=>({...p,1:true}))}
        style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain", opacity:0, animation:ready?"exerciseFlipAlt 1.6s ease-in-out infinite":"none" }}/>
    </div>
  );
}

// ── Rest Timer ───────────────────────────────────────────────────────────────
export function RestTimer({ seconds, label, onSkip, onComplete, accent }) {
  const [remaining, setRemaining] = useState(seconds);
  const fired = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setRemaining(r => {
      if (r <= 1) { clearInterval(id); if (!fired.current) { fired.current=true; onComplete(); } return 0; }
      return r-1;
    }), 1000);
    return () => clearInterval(id);
  }, [onComplete]);
  const pct  = (remaining / seconds) * 100;
  const r    = 22;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{
      position:"fixed", bottom:64, left:0, right:0, zIndex:100,
      background:"linear-gradient(180deg,#0f0f0f,#050505)",
      borderTop:`1px solid ${accent}66`,
      padding:"16px 22px",
      boxShadow:`0 -8px 36px ${accent}33`,
      animation:"slideUp .25s ease-out",
    }}>
      <div style={{ maxWidth:520, margin:"0 auto", display:"flex", alignItems:"center", gap:16 }}>
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
        maxWidth:488, margin:"0 auto",
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
function IconDumbbell({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.2"/>
      <rect x="17.5" y="9.5" width="5" height="5" rx="1.2"/>
      <line x1="6.5" y1="12" x2="17.5" y2="12" strokeWidth="3"/>
      <line x1="5.5" y1="7.5" x2="5.5" y2="16.5"/>
      <line x1="18.5" y1="7.5" x2="18.5" y2="16.5"/>
    </svg>
  );
}
function IconStats({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <rect x="3" y="13" width="4.5" height="8" rx="1"/>
      <rect x="9.75" y="8" width="4.5" height="13" rx="1" opacity="0.75"/>
      <rect x="16.5" y="4" width="4.5" height="17" rx="1" opacity="0.9"/>
    </svg>
  );
}
function IconCalendar({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
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
function IconGear({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
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

export function BottomNav({ active, onSelect, accent }) {
  return (
    <nav style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:90,
      background:"rgba(8,8,8,0.95)", backdropFilter:"blur(16px)",
      WebkitBackdropFilter:"blur(16px)", borderTop:"1px solid #1e1e1e",
      paddingBottom:"env(safe-area-inset-bottom)",
    }}>
      <div style={{ maxWidth:520, margin:"0 auto", display:"flex", justifyContent:"space-around", padding:"10px 4px" }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const color = isActive ? accent : "#666";
          return (
            <button key={id} onClick={() => onSelect(id)}
              style={{
                flex:1, background:"transparent", border:"none",
                padding:"8px 4px", borderRadius:9,
                display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                transition:"opacity .15s",
              }}>
              <div style={{ filter: isActive ? `drop-shadow(0 0 5px ${accent}99)` : "none", transition:"filter .2s" }}>
                <Icon color={color} />
              </div>
              <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:isActive?600:400, color }}>
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

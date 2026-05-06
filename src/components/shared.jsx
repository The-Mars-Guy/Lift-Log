import { useState, useEffect, useRef } from "react";
import { IMG_BASE, WORKOUTS, isoDate, isoWeek, dateStr } from "../data.js";

// ─────────────────────────────────────────── Exercise Animation
// Smooth crossfade between 0.jpg and 1.jpg using CSS keyframes for buttery motion.
export function ExerciseAnimation({ folder, accent }) {
  const [loaded, setLoaded] = useState({ 0: false, 1: false });
  const ready = loaded[0] && loaded[1];

  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "1",
      maxWidth: 320, margin: "0 auto",
      background: "linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)",
      borderRadius: 12, overflow: "hidden",
      border: `1.5px solid ${accent}40`,
      boxShadow: `0 0 32px ${accent}15`,
    }}>
      {!ready && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#999", fontSize: 11, letterSpacing: "0.15em",
          background: "linear-gradient(90deg, #f5f5f5 0%, #fafafa 50%, #f5f5f5 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s ease-in-out infinite",
        }}>LOADING DEMO...</div>
      )}
      <img
        src={`${IMG_BASE}/${folder}/0.jpg`}
        alt=""
        onLoad={() => setLoaded(p => ({ ...p, 0: true }))}
        onError={() => setLoaded(p => ({ ...p, 0: true }))}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain",
          opacity: ready ? 1 : 0,
          animation: ready ? "exerciseFlip 1.6s ease-in-out infinite" : "none",
        }}
      />
      <img
        src={`${IMG_BASE}/${folder}/1.jpg`}
        alt=""
        onLoad={() => setLoaded(p => ({ ...p, 1: true }))}
        onError={() => setLoaded(p => ({ ...p, 1: true }))}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain",
          opacity: ready ? 0 : 0,
          animation: ready ? "exerciseFlipAlt 1.6s ease-in-out infinite" : "none",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────── Rest Timer
export function RestTimer({ seconds, label, onSkip, onComplete, accent }) {
  const [remaining, setRemaining] = useState(seconds);
  const fired = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(id);
          if (!fired.current) { fired.current = true; onComplete(); }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onComplete]);

  const pct = (remaining / seconds) * 100;
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{
      position: "fixed", bottom: 64, left: 0, right: 0, zIndex: 100,
      background: "linear-gradient(180deg, #0f0f0f 0%, #050505 100%)",
      borderTop: `1px solid ${accent}66`,
      padding: "14px 20px",
      boxShadow: `0 -8px 32px ${accent}33`,
      animation: "slideUp 0.25s ease-out",
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="26" cy="26" r={r} fill="none" stroke="#1a1a1a" strokeWidth="3.5" />
            <circle cx="26" cy="26" r={r} fill="none" stroke={accent} strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 4px ${accent})` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, color: accent, fontWeight: 500,
          }}>{remaining}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 2 }}>
            REST · {remaining}s
          </div>
          <div style={{ fontSize: 13, color: "#f0f0f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
        </div>

        <button onClick={onSkip} style={{
          background: "transparent", border: `1.5px solid ${accent}66`,
          color: accent, padding: "9px 16px", borderRadius: 7,
          fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", flexShrink: 0,
        }}>SKIP</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── Toast
export function Toast({ icon = "🎯", title, msg, accent, onClose, duration = 4000 }) {
  useEffect(() => {
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [onClose, duration]);

  return (
    <div style={{
      position: "fixed", top: 16, left: 16, right: 16, zIndex: 200,
      animation: "slideDown 0.3s ease-out",
      pointerEvents: "none",
    }}>
      <div style={{
        maxWidth: 488, margin: "0 auto",
        background: "#0c0c0c", border: `1.5px solid ${accent}`,
        borderRadius: 11, padding: "12px 16px",
        boxShadow: `0 0 36px ${accent}77, 0 4px 20px rgba(0,0,0,0.6)`,
        display: "flex", alignItems: "center", gap: 12,
        pointerEvents: "auto",
      }}>
        <div style={{ fontSize: 26 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: accent, letterSpacing: "0.14em", fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: 13, color: "#f5f5f5", marginTop: 2 }}>{msg}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── Bottom Nav
const NAV_ITEMS = [
  { id: "workout", label: "Workout", icon: "🏋️" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "calendar", label: "Calendar", icon: "🗓️" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav({ active, onSelect, accent }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: "rgba(8, 8, 8, 0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderTop: "1px solid #1c1c1c",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      <div style={{
        maxWidth: 520, margin: "0 auto",
        display: "flex", justifyContent: "space-around",
        padding: "8px 4px",
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onSelect(item.id)}
              style={{
                flex: 1, background: "transparent", border: "none", cursor: "pointer",
                padding: "8px 4px", borderRadius: 8,
                color: isActive ? accent : "#888",
                transition: "color 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}>
              <div style={{ fontSize: 18, opacity: isActive ? 1 : 0.65, filter: isActive ? `drop-shadow(0 0 5px ${accent})` : "none" }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                fontWeight: isActive ? 500 : 400,
              }}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────── Bar Chart
export function BarChart({ data, color = "#4ade80", height = 120, label }) {
  if (!data || data.length === 0) return (
    <div style={{ padding: 30, textAlign: "center", color: "#666", fontSize: 11, letterSpacing: "0.1em" }}>
      NO DATA YET
    </div>
  );

  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100 / data.length;

  return (
    <div>
      {label && <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>}
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 24);
          return (
            <g key={i}>
              <rect
                x={i * w + w * 0.18} y={height - 18 - barH}
                width={w * 0.64} height={barH}
                fill={d.color || color} opacity={d.value > 0 ? 0.9 : 0.3} rx="0.6"
              />
              <text
                x={i * w + w / 2} y={height - 6}
                textAnchor="middle" fontSize="3.6" fill="#888"
                fontFamily="DM Mono, monospace"
              >{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────── Line Chart (progression)
export function ProgressionChart({ data, color = "#4ade80", baseReps = 10 }) {
  if (!data || data.length < 2) return (
    <div style={{ padding: 20, textAlign: "center", color: "#666", fontSize: 11, letterSpacing: "0.1em" }}>
      MORE SESSIONS NEEDED
    </div>
  );

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value), baseReps - 0.5);
  const range = Math.max(max - min, 1);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 96 + 2,
    y: 36 - ((d.value - min) / range) * 30,
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} 38 L ${points[0].x} 38 Z`;

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: 80 }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="0.9" fill={color} />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────── Heatmap (calendar)
export function Heatmap({ history }) {
  // Show last 12 weeks. Each cell = a day. Color by which workout was done.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeksBack = 12;

  // Build map of date -> workout type
  const dateMap = {};
  for (const h of history) {
    const d = new Date(h.timestamp);
    d.setHours(0, 0, 0, 0);
    dateMap[isoDate(d)] = h.workout;
  }

  // Build grid: 7 rows (days of week) x weeksBack columns
  const cells = [];
  for (let col = weeksBack - 1; col >= 0; col--) {
    const week = [];
    for (let row = 0; row < 7; row++) {
      const offset = col * 7 + (6 - row); // most recent on right
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      const iso = isoDate(d);
      const w = dateMap[iso];
      week.push({ date: d, iso, workout: w, dayOfWeek: d.getDay(), isFuture: d > today });
    }
    cells.push(week);
  }

  const cellSize = 14;
  const gap = 3;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap }}>
        {cells.map((week, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap }}>
            {week.map((c, ri) => {
              const color = c.workout
                ? WORKOUTS[c.workout].color
                : c.isFuture ? "#0a0a0a" : "#161616";
              const isToday = c.iso === isoDate(today);
              return (
                <div key={ri} title={`${dateStr(c.date)}${c.workout ? ` — ${WORKOUTS[c.workout].label}` : ""}`}
                  style={{
                    width: cellSize, height: cellSize,
                    background: color,
                    borderRadius: 3,
                    border: isToday ? "1.5px solid #f0f0f0" : "1px solid transparent",
                    boxShadow: c.workout ? `0 0 6px ${WORKOUTS[c.workout].color}66` : "none",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 9, color: "#888", letterSpacing: "0.1em" }}>
        <span>{weeksBack} WEEKS AGO</span>
        <span>TODAY</span>
      </div>
    </div>
  );
}

import { WORKOUTS, computeStats, dateStr } from "../data.js";
import { Heatmap } from "../components/shared.jsx";
import { fmtDuration } from "../hooks.js";

export default function CalendarView({ history, progression, settings, accent }) {
  const stats = computeStats({ history, progression, settings });

  const longestStreak = (() => {
    if (history.length === 0) return 0;
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    let max = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const gap = (sorted[i].timestamp - sorted[i - 1].timestamp) / 86400000;
      if (gap <= 4.5) { cur++; max = Math.max(max, cur); }
      else cur = 1;
    }
    return max;
  })();

  return (
    <div>
      <div style={{ padding: "32px 20px 18px" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: "0.06em", lineHeight: 0.9, color: "#fafafa" }}>
          CALENDAR
        </div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 6, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          your consistency, at a glance
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
        <Metric label="Current" value={stats.streak} unit="streak" />
        <Metric label="Longest" value={longestStreak} unit="streak" />
        <Metric label="Perfect" value={stats.perfectWeeks} unit="weeks" />
      </div>

      {/* HEATMAP */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 11, color: "#ddd", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>
          Last 12 Weeks
        </div>
        <div style={{
          padding: 16, background: "#0d0d0d", borderRadius: 11,
          border: "1px solid #1c1c1c", overflowX: "auto",
        }}>
          <Heatmap history={history} />
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 10, color: "#aaa", letterSpacing: "0.06em", flexWrap: "wrap" }}>
          <Swatch color={WORKOUTS.A.color} label="Workout A" />
          <Swatch color={WORKOUTS.B.color} label="Workout B" />
          <Swatch color="#161616" label="Rest" />
        </div>
      </div>

      {/* FULL HISTORY */}
      <div style={{ padding: "32px 20px 0" }}>
        <div style={{ fontSize: 11, color: "#ddd", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>
          Session History
        </div>
        {history.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#666", fontSize: 12, letterSpacing: "0.1em" }}>
            NO SESSIONS LOGGED YET
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                padding: "12px 14px", background: "#0d0d0d", borderRadius: 9,
                border: "1px solid #1a1a1a",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 10, padding: "3px 9px", borderRadius: 5,
                      background: WORKOUTS[h.workout]?.color + "22" || "#222",
                      color: WORKOUTS[h.workout]?.color || "#aaa",
                      letterSpacing: "0.06em", fontWeight: 500, flexShrink: 0,
                    }}>{h.workout}</span>
                    <span style={{ fontSize: 13, color: "#e0e0e0" }}>{h.day}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                    {h.duration && <span style={{ fontSize: 11, color: "#888" }}>{fmtDuration(h.duration)}</span>}
                    <span style={{ fontSize: 12, color: "#aaa" }}>{h.date}</span>
                  </div>
                </div>
                {h.exercises && (
                  <div style={{ marginTop: 8, fontSize: 10, color: "#888", letterSpacing: "0.04em" }}>
                    {h.exercises.map(e => `${e.name} ${e.sets}×${e.reps}`).join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div style={{ padding: "12px 10px", background: "#0d0d0d", borderRadius: 9, border: "1px solid #1c1c1c", textAlign: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#fafafa", letterSpacing: "0.04em" }}>{value}</div>
      <div style={{ fontSize: 9, color: "#aaa", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>{label} {unit}</div>
    </div>
  );
}

function Swatch({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 12, height: 12, background: color, borderRadius: 3, boxShadow: color !== "#161616" ? `0 0 6px ${color}66` : "none" }} />
      <span>{label}</span>
    </div>
  );
}

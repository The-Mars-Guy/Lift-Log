import { WORKOUTS, ACHIEVEMENTS, computeStats, isoWeek, dateStr } from "../data.js";
import { BarChart, ProgressionChart } from "../components/shared.jsx";
import { fmtDuration } from "../hooks.js";

export default function StatsView({ history, progression, settings, achievements, accent }) {
  const stats = computeStats({ history, progression, settings });

  // Build progression timeline per exercise
  const allExercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];

  // Build sessions-per-week chart (last 8 weeks)
  const weekData = (() => {
    const now = new Date();
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weeks.push(isoWeek(d));
    }
    return weeks.map((w, i) => {
      const count = (stats.weekDays[w] || new Set()).size;
      return {
        label: i === 7 ? "now" : `−${7 - i}w`,
        value: count,
        color: count >= 3 ? "#4ade80" : count >= 2 ? "#60a5fa" : "#666",
      };
    });
  })();

  // Total volume (lbs lifted) — approx based on current progression
  const totalVolume = history.reduce((sum, h) => {
    if (h.exercises) {
      return sum + h.exercises.reduce((s, ex) => {
        const dumbbells = ex.name === "Goblet Squat" ? 1 : 2;
        return s + (ex.reps * ex.sets * settings.dumbbellWeight * dumbbells);
      }, 0);
    }
    // Fallback for legacy entries: estimate from current progression
    const w = WORKOUTS[h.workout];
    if (!w) return sum;
    return sum + w.exercises.reduce((s, ex) => {
      const reps = ex.baseReps + (progression[ex.name]?.repBonus || 0);
      const dumbbells = ex.name === "Goblet Squat" ? 1 : 2;
      return s + (reps * ex.sets * settings.dumbbellWeight * dumbbells);
    }, 0);
  }, 0);

  const totalDuration = history.reduce((s, h) => s + (h.duration || 0), 0);
  const avgDuration = history.filter(h => h.duration).length > 0
    ? Math.floor(totalDuration / history.filter(h => h.duration).length)
    : 0;

  const personalBests = allExercises.map(ex => {
    const bonus = progression[ex.name]?.repBonus || 0;
    return { ex, peakReps: ex.baseReps + bonus, color: getExerciseColor(ex.name) };
  });

  return (
    <div>
      <Header title="STATS" subtitle="your numbers, visualized" accent={accent} />

      {/* TOP METRICS */}
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <BigStat label="Total Sessions" value={stats.totalSessions} accent="#4ade80" />
        <BigStat label="Current Streak" value={stats.streak} suffix={stats.streak > 1 ? "🔥" : ""} accent="#fb923c" />
        <BigStat label="Volume Lifted" value={`${(totalVolume / 1000).toFixed(1)}K`} unit="LBS" accent="#60a5fa" />
        <BigStat label="Time Lifting" value={fmtDuration(totalDuration)} accent="#a78bfa" />
      </div>

      {/* SESSIONS PER WEEK */}
      <Section title="Sessions per Week" subtitle="last 8 weeks · target: 3/wk">
        <BarChart data={weekData} height={140} />
        <Legend items={[
          { color: "#4ade80", label: "3+ sessions (target hit)" },
          { color: "#60a5fa", label: "2 sessions" },
          { color: "#666", label: "0–1 sessions" },
        ]} />
      </Section>

      {/* PROGRESSION OVERVIEW */}
      <Section title="Progression Map" subtitle="rep targets earned per exercise">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {personalBests.map(({ ex, peakReps, color }) => {
            const bonus = progression[ex.name]?.repBonus || 0;
            const pct = (bonus / settings.maxRepBonus) * 100;
            const atMax = bonus >= settings.maxRepBonus;
            return (
              <div key={ex.name} style={{ padding: "12px 14px", background: "#0d0d0d", borderRadius: 9, border: "1px solid #1c1c1c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 15, color: "#f0f0f0" }}>{ex.name}</span>
                  <span style={{ fontSize: 14, color, fontWeight: 500 }}>
                    {ex.repLabel}{ex.baseReps} → {ex.repLabel}{peakReps} {atMax && "🏆"}
                  </span>
                </div>
                <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: color, boxShadow: `0 0 6px ${color}88`,
                    transition: "width 0.4s",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ACHIEVEMENTS */}
      <Section title="Achievements" subtitle={`${achievements.length} of ${ACHIEVEMENTS.length} unlocked`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = achievements.includes(a.id);
            return (
              <div key={a.id} style={{
                padding: "14px 10px", borderRadius: 9,
                background: unlocked ? "#101010" : "#0a0a0a",
                border: `1px solid ${unlocked ? "#fbbf2455" : "#1a1a1a"}`,
                textAlign: "center",
                opacity: unlocked ? 1 : 0.5,
                boxShadow: unlocked ? "0 0 16px #fbbf2422" : "none",
              }}>
                <div style={{ fontSize: 26, marginBottom: 6, filter: unlocked ? "none" : "grayscale(1) brightness(0.5)" }}>{a.icon}</div>
                <div style={{ fontSize: 15, color: unlocked ? "#fbbf24" : "#666", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 4 }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 15, color: "#888", lineHeight: 1.4 }}>{a.desc}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* AVG SESSION TIME */}
      {avgDuration > 0 && (
        <Section title="Average Session" subtitle={`across ${history.filter(h => h.duration).length} timed sessions`}>
          <div style={{
            padding: 20, background: "#0d0d0d", borderRadius: 11, border: "1px solid #1c1c1c",
            textAlign: "center",
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#a78bfa", letterSpacing: "0.06em", filter: "drop-shadow(0 0 8px #a78bfa55)" }}>
              {fmtDuration(avgDuration)}
            </div>
            <div style={{ fontSize: 15, color: "#aaa", letterSpacing: "0.14em", marginTop: 4 }}>PER WORKOUT</div>
          </div>
        </Section>
      )}
    </div>
  );
}

function getExerciseColor(name) {
  const inA = WORKOUTS.A.exercises.some(e => e.name === name);
  return inA ? WORKOUTS.A.color : WORKOUTS.B.color;
}

function Header({ title, subtitle, accent }) {
  return (
    <div style={{ padding: "32px 20px 18px" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: "0.06em", lineHeight: 0.9, color: "#fafafa" }}>
        {title}
      </div>
      <div style={{ fontSize: 15, color: "#999", marginTop: 6, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        {subtitle}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ padding: "24px 20px 8px" }}>
      <div style={{ fontSize: 15, color: "#ddd", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 14, color: "#888", marginTop: 3, letterSpacing: "0.04em" }}>{subtitle}</div>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

function BigStat({ label, value, unit, suffix, accent }) {
  return (
    <div style={{
      padding: 16, background: "#0d0d0d", border: "1px solid #1c1c1c",
      borderRadius: 11, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at top right, ${accent}10 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontSize: 15, color: "#aaa", letterSpacing: "0.14em", textTransform: "uppercase", position: "relative" }}>{label}</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 32,
        color: accent || "#fafafa", marginTop: 4, letterSpacing: "0.04em",
        filter: `drop-shadow(0 0 6px ${accent}55)`,
        position: "relative",
      }}>
        {value}
        {unit && <span style={{ fontSize: 14, color: "#999", marginLeft: 4, letterSpacing: "0.1em" }}>{unit}</span>}
        {suffix && <span style={{ fontSize: 18, marginLeft: 4 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10, fontSize: 14, color: "#aaa" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 8, height: 8, background: item.color, borderRadius: 2 }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

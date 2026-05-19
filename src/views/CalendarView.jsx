import { useState } from "react";
import { WORKOUTS, SCHEDULE, DAYS, computeStats, dateStr, todayName } from "../data.js";
import { Heatmap } from "../components/shared.jsx";
import { fmtDuration } from "../hooks.js";
import { surface, text, status } from "../theme.js";

export default function CalendarView({ history, progression, settings, accent, theme = "dark" }) {
  const stats = computeStats({ history, progression, settings });
  const [selected, setSelected] = useState(null);
  const ui = makeCalendarTheme(theme, accent);
  const insights = calendarInsights(history);

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
    <div style={{ color:ui.text }}>
      <div style={{ padding: "32px 20px 18px" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: "0.06em", lineHeight: 0.9, color: ui.title }}>
          CALENDAR
        </div>
        <div style={{ fontSize: 15, color: ui.muted, marginTop: 6, fontWeight: 600 }}>
          your consistency, at a glance
        </div>
      </div>

      <NextSessionCard insights={insights} accent={accent} ui={ui} />

      {/* SUMMARY METRICS */}
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
        <Metric label="Current" value={stats.streak} unit="streak" ui={ui} />
        <Metric label="Longest" value={longestStreak} unit="streak" ui={ui} />
        <Metric label="Adherence" value={`${insights.adherence}%`} unit="4 weeks" ui={ui} />
      </div>
      <div style={{ padding:"0 20px 22px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <Metric label="Perfect" value={stats.perfectWeeks} unit="weeks" ui={ui} compact />
        <Metric label="Avg Time" value={insights.avgDuration ? fmtDuration(insights.avgDuration) : "--"} unit="session" ui={ui} compact />
      </div>

      {/* HEATMAP */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 15, color: ui.section, fontWeight: 500, marginBottom: 14 }}>
          Last 12 Weeks
        </div>
        {history.length===0&&(
          <div style={{padding:"16px",background:`linear-gradient(180deg,${accent}18,${ui.card})`,border:`1.5px solid ${accent}33`,borderRadius:11,marginBottom:12,boxShadow:ui.shadow}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:accent,letterSpacing:".06em"}}>CALENDAR STARTS AFTER SESSION ONE</div>
            <div style={{fontSize:14,color:ui.soft,lineHeight:1.55,marginTop:6}}>Finish a workout and this heatmap will become your consistency tracker.</div>
          </div>
        )}
        <div style={{
          padding: 16, background: ui.card, borderRadius: 11,
          border: `1px solid ${ui.border}`, overflowX: "auto", boxShadow:ui.shadow,
        }}>
          <Heatmap history={history} theme={theme} />
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 14, color: ui.soft, letterSpacing: "0.06em", flexWrap: "wrap" }}>
          <Swatch color={WORKOUTS.A.color} label="Workout A" />
          <Swatch color={WORKOUTS.B.color} label="Workout B" />
          <Swatch color={ui.restCell} label="Rest" />
        </div>
      </div>

      {/* FULL HISTORY */}
      <div style={{ padding: "32px 20px 0" }}>
        <div style={{ fontSize: 15, color: ui.section, fontWeight: 500, marginBottom: 14 }}>
          Session History
        </div>
        {history.length === 0 ? (
          <div style={{ padding: 24, background:ui.card, border:`1px solid ${ui.border}`, borderRadius:11, color: ui.muted, fontSize: 14, lineHeight:1.55, boxShadow:ui.shadow }}>
            Your completed workouts will appear here with duration, exercises, logged sets, and readiness notes.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h, i) => (
              <button key={i} onClick={() => setSelected(h)} style={{
                padding: "12px 14px", background: ui.card, borderRadius: 9,
                border: `1px solid ${ui.border}`, textAlign:"left", width:"100%",
                boxShadow:ui.shadow,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 14, padding: "3px 9px", borderRadius: 5,
                      background: `${WORKOUTS[h.workout]?.color || status.warn}22`,
                      color: WORKOUTS[h.workout]?.color || status.warn,
                      letterSpacing: "0.06em", fontWeight: 500, flexShrink: 0,
                    }}>{h.workout}</span>
                    <span style={{ fontSize: 15, color: ui.text }}>{h.day}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                    {h.duration && <span style={{ fontSize: 15, color: ui.muted }}>{fmtDuration(h.duration)}</span>}
                    <span style={{ fontSize: 14, color: ui.soft }}>{h.date}</span>
                  </div>
                </div>
                {h.exercises && (
                  <div style={{ marginTop: 8, fontSize: 14, color: ui.muted, letterSpacing: "0.04em" }}>
                    {h.exercises.map(e => `${e.name} ${e.sets}×${e.reps}`).join(" · ")}
                  </div>
                )}
                {h.note && <div style={{ marginTop: 7, fontSize: 12, color: ui.soft, lineHeight: 1.4 }}>Note: {h.note}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
      {selected&&<SessionDetail session={selected} onClose={()=>setSelected(null)} theme={theme} />}
    </div>
  );
}

function makeCalendarTheme(theme, accent) {
  const light = theme === "pop_light";
  return {
    light,
    title: light ? "#123047" : "#fafafa",
    section: light ? "#25536f" : "#ddd",
    text: light ? "#172033" : "#f0f0f0",
    soft: light ? "#435166" : "#aaa",
    muted: light ? "#6b788c" : "#888",
    card: light ? "rgba(255,255,255,.88)" : "#0d0d0d",
    border: light ? "rgba(112,132,160,.28)" : "#1c1c1c",
    restCell: light ? "#dce7f2" : "#161616",
    shadow: light ? `0 12px 26px ${accent}10` : "none",
  };
}

function calendarInsights(history) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 27);
  const recent = history.filter(h => h.timestamp >= fourWeeksAgo.getTime());
  const uniqueDays = new Set(recent.map(h => {
    const d = new Date(h.timestamp);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }));
  const adherence = Math.min(100, Math.round((uniqueDays.size / 12) * 100));
  const durations = history.map(h => h.duration).filter(Boolean);
  const avgDuration = durations.length ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length) : 0;
  const currentDay = todayName();
  const nextDay = DAYS.includes(currentDay)
    ? currentDay
    : DAYS.find(day => DAY_INDEX[day] > (today.getDay() || 7)) || "Monday";
  const nextWorkout = SCHEDULE[nextDay];
  const last = [...history].sort((a, b) => b.timestamp - a.timestamp)[0];
  const missedThisWeek = DAYS.filter(day => {
    const workoutDate = weekDate(day, today);
    return workoutDate <= today && !history.some(h => sameDay(new Date(h.timestamp), workoutDate));
  });
  const guidance = history.length === 0
    ? "Start with the benchmark or Workout A. Keep every rep clean."
    : missedThisWeek.length >= 2
      ? "Treat the next session as a re-entry workout. Clean reps matter more than extra volume."
      : adherence >= 75
        ? "Consistency is strong. Keep using notes and set feedback so the coach can fine tune."
        : "Aim for the next scheduled session and keep rests honest.";
  return { adherence, avgDuration, nextDay, nextWorkout, last, missedThisWeek, guidance };
}

const DAY_INDEX = { Monday:1, Wednesday:3, Friday:5 };

function weekDate(day, base) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const current = d.getDay() || 7;
  d.setDate(d.getDate() + DAY_INDEX[day] - current);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function NextSessionCard({ insights, accent, ui }) {
  return (
    <div style={{ padding:"0 20px 18px" }}>
      <div style={{ padding:16, background:`linear-gradient(180deg,${accent}1f,${ui.card})`, border:`1.5px solid ${accent}44`, borderRadius:14, boxShadow:ui.shadow }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:accent, fontWeight:700, marginBottom:6 }}>Next Best Move</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:ui.title, letterSpacing:".06em", lineHeight:.95 }}>
              {insights.nextDay}<br/>WORKOUT {insights.nextWorkout}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, color:accent, letterSpacing:".04em", lineHeight:1 }}>{insights.adherence}%</div>
            <div style={{ fontSize:10, color:ui.muted }}>4 week hit rate</div>
          </div>
        </div>
        <div style={{ fontSize:14, color:ui.soft, lineHeight:1.5, marginTop:12 }}>{insights.guidance}</div>
        {insights.last && (
          <div style={{ fontSize:12, color:ui.muted, lineHeight:1.45, marginTop:10 }}>
            Last logged: Workout {insights.last.workout} on {insights.last.date}{insights.last.duration ? ` in ${fmtDuration(insights.last.duration)}` : ""}.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, unit, ui, compact = false }) {
  return (
    <div style={{ padding: compact ? "10px 9px" : "12px 10px", background: ui.card, borderRadius: 9, border: `1px solid ${ui.border}`, textAlign: "center", boxShadow:ui.shadow }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: compact ? 24 : 28, color: ui.title, letterSpacing: "0.04em" }}>{value}</div>
      <div style={{ fontSize: compact ? 12 : 15, color: ui.soft, fontWeight: 600, marginTop: 2 }}>{label} {unit}</div>
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

function SessionDetail({ session, onClose, theme = "dark" }) {
  const color = WORKOUTS[session.workout]?.color || status.good;
  const ui = makeCalendarTheme(theme, color);
  const totalReps = (session.exercises||[]).reduce((sum, ex)=>sum+(ex.setLog||[]).reduce((s,l)=>s+(l.reps||0),0),0);
  return (
    <div style={{position:"fixed",inset:0,zIndex:240,background:ui.light?"#f8fffb":"#050505",overflowY:"auto",padding:"calc(28px + env(safe-area-inset-top)) 20px 30px"}}>
      <div className="mobile-shell">
        <button onClick={onClose} style={{background:"transparent",border:`1px solid ${ui.border}`,borderRadius:9,color:ui.soft,padding:"10px 13px",fontSize:12,letterSpacing:".08em",marginBottom:22}}>CLOSE</button>
        <div style={{fontSize:12,color,fontWeight:600,marginBottom:8}}>{session.date}</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:ui.title,letterSpacing:".06em",lineHeight:.95,marginBottom:8}}>WORKOUT {session.workout}</div>
        <div style={{fontSize:14,color:ui.muted,marginBottom:18}}>{session.day} · {fmtDuration(session.duration||0)} · {totalReps} reps</div>
        {session.note&&(
          <div style={{padding:13,background:ui.card,border:`1px solid ${ui.border}`,borderRadius:10,marginBottom:14,fontSize:13,color:ui.soft,lineHeight:1.5,boxShadow:ui.shadow}}>
            Note: {session.note}
          </div>
        )}
        {session.readiness&&(
          <div style={{padding:13,background:ui.card,border:`1px solid ${ui.border}`,borderRadius:10,marginBottom:14,fontSize:13,color:ui.soft,boxShadow:ui.shadow}}>
            Readiness: {session.readiness.energy} / {session.readiness.soreness} / {session.readiness.time}
          </div>
        )}
        <div style={{display:"grid",gap:10}}>
          {(session.exercises||[]).map(ex=>(
            <div key={ex.name} style={{padding:14,background:ui.card,border:`1px solid ${ui.border}`,borderRadius:11,boxShadow:ui.shadow}}>
              <div style={{fontSize:15,color:ui.text,fontWeight:600,marginBottom:8}}>{ex.name}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {(ex.setLog||[]).map((log,i)=>(
                  <span key={i} style={{fontSize:12,color,background:`${color}15`,border:`1px solid ${color}44`,borderRadius:7,padding:"7px 9px"}}>
                    S{i+1}: {log.weight}lbs x {log.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

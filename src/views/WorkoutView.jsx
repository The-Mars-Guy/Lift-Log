import { useState, useEffect, useRef } from "react";
import { WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, todayName, dateStr } from "../data.js";
import { useSessionTimer, fmtDuration } from "../hooks.js";
import { ExerciseAnimation, RestTimer, Toast } from "../components/shared.jsx";
import MuscleDiagram from "../components/MuscleDiagram.jsx";

export default function WorkoutView({
  sets, setSets,
  history, setHistory,
  completed, setCompleted,
  progression, setProgression,
  settings,
  playSound, vibrate,
  setActiveView,
}) {
  const [activeTab, setActiveTab] = useState(() => DAYS.includes(todayName()) ? todayName() : "Monday");
  const [expanded, setExpanded] = useState(null);
  const [restState, setRestState] = useState(null);
  const [toast, setToast] = useState(null);

  const workoutKey = SCHEDULE[activeTab];
  const workout = WORKOUTS[workoutKey];
  const accent = workout.color;

  const setKey = (i, j) => `${activeTab}_${i}_${j}`;
  const setDone = (i, j) => !!sets[setKey(i, j)];
  const exDone = (i) => Array.from({ length: workout.exercises[i].sets }, (_, j) => setDone(i, j)).every(Boolean);
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = workout.exercises.reduce((a, ex, i) =>
    a + Array.from({ length: ex.sets }, (_, j) => setDone(i, j) ? 1 : 0).reduce((x, y) => x + y, 0), 0);
  const allDone = doneSets === totalSets;
  const isCompleted = !!completed[activeTab];

  // Session timer - starts when first set checked, stops when finished
  const sessionRunning = doneSets > 0 && !isCompleted;
  const sessionElapsed = useSessionTimer(sessionRunning);

  const getRepBonus = (n) => progression[n]?.repBonus || 0;
  const getSessions = (n) => progression[n]?.sessions || 0;
  const getReps = (ex) => ex.baseReps + getRepBonus(ex.name);

  const toggleSet = (i, j) => {
    const k = setKey(i, j);
    const wasOn = !!sets[k];
    setSets(p => ({ ...p, [k]: !wasOn }));

    if (!wasOn) {
      playSound("setComplete");
      vibrate([30]);
      const ex = workout.exercises[i];
      const remaining = ex.sets - (j + 1);
      const next = remaining > 0
        ? `Set ${j + 2} of ${ex.name}`
        : i + 1 < workout.exercises.length
          ? `Up next: ${workout.exercises[i + 1].name}`
          : "Last set complete — finish workout!";
      setRestState({ label: next, accent });
    } else {
      playSound("uncheck");
    }
  };

  const finishWorkout = () => {
    if (!allDone) return;

    // Snapshot exercise data for history
    const exerciseSnapshot = workout.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets,
      reps: getReps(ex),
    }));

    // Update progression
    const newProg = { ...progression };
    const unlocked = [];
    workout.exercises.forEach(ex => {
      const cur = newProg[ex.name] || { sessions: 0, repBonus: 0 };
      const newSessions = cur.sessions + 1;
      let newBonus = cur.repBonus;
      if (newSessions >= settings.sessionsPerProgression && newBonus < settings.maxRepBonus) {
        newBonus += 1;
        unlocked.push(`${ex.name} → x${ex.baseReps + newBonus}`);
        newProg[ex.name] = { sessions: 0, repBonus: newBonus };
      } else if (newSessions >= settings.sessionsPerProgression) {
        newProg[ex.name] = { sessions: 0, repBonus: newBonus };
      } else {
        newProg[ex.name] = { sessions: newSessions, repBonus: newBonus };
      }
    });
    setProgression(newProg);

    setHistory(p => [{
      day: activeTab, workout: workoutKey, date: dateStr(),
      timestamp: Date.now(),
      duration: sessionElapsed,
      exercises: exerciseSnapshot,
    }, ...p].slice(0, 100));

    setCompleted(p => ({ ...p, [activeTab]: dateStr() }));
    setRestState(null);
    playSound("workoutDone");
    vibrate([100, 60, 100]);

    if (unlocked.length > 0) {
      setTimeout(() => {
        playSound("progression");
        setToast({
          icon: "↗️",
          title: "PROGRESSION UNLOCKED",
          msg: unlocked.length === 1 ? unlocked[0] : `+1 rep on ${unlocked.length} exercises`,
          accent,
        });
      }, 800);
    }
  };

  const resetDay = () => {
    if (!confirm("Reset today's progress? (Doesn't affect history)")) return;
    const newSets = { ...sets };
    workout.exercises.forEach((ex, i) => {
      Array.from({ length: ex.sets }, (_, j) => { delete newSets[setKey(i, j)]; });
    });
    setSets(newSets);
    setCompleted(p => { const n = { ...p }; delete n[activeTab]; return n; });
    setExpanded(null);
    setRestState(null);
  };

  // Quick stats for header
  const totalSessions = history.length;
  const streak = (() => {
    if (history.length === 0) return 0;
    const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
    let s = 1;
    for (let i = 1; i < sorted.length; i++) {
      const gap = (sorted[i - 1].timestamp - sorted[i].timestamp) / 86400000;
      if (gap > 4.5) break;
      s++;
    }
    return s;
  })();

  return (
    <div style={{ "--c": accent, "--c-dim": accent + "22", "--c-glow": accent + "55" }}>
      {/* HEADER */}
      <div style={{ padding: "32px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: "0.06em", lineHeight: 0.9, color: "#fafafa" }}>
              LIFT LOG
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6, letterSpacing: "0.14em" }}>
              {settings.dumbbellWeight}LB DUMBBELL · 3X/WEEK
            </div>
          </div>
          {sessionRunning && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.14em", textTransform: "uppercase" }}>Session</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: accent, marginTop: 2, letterSpacing: "0.04em", filter: `drop-shadow(0 0 6px ${accent}88)` }}>
                {fmtDuration(sessionElapsed)}
              </div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard label="Sessions" value={totalSessions} />
          <StatCard label="Streak" value={streak} accent={streak > 0 ? accent : undefined} suffix={streak > 1 ? "🔥" : ""} />
          <StatCard label="Today" value={DAYS.includes(todayName()) ? todayName().slice(0, 3) : "REST"} />
        </div>
      </div>

      {/* DAY TABS */}
      <div style={{ display: "flex", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", background: "#080808" }}>
        {DAYS.map(day => {
          const isActive = activeTab === day;
          const dayColor = WORKOUTS[SCHEDULE[day]].color;
          return (
            <button key={day}
              onClick={() => { setActiveTab(day); setExpanded(null); }}
              style={{
                flex: 1, padding: "13px 4px", background: "transparent", border: "none",
                color: isActive ? dayColor : "#888", cursor: "pointer",
                fontSize: 11, letterSpacing: "0.1em", fontWeight: 500,
                borderBottom: `2px solid ${isActive ? dayColor : "transparent"}`,
                transition: "all 0.2s", textTransform: "uppercase",
              }}>
              {day.slice(0, 3)}
              {completed[day] && <div style={{ fontSize: 9, color: dayColor, marginTop: 2 }}>✓ done</div>}
            </button>
          );
        })}
      </div>

      {/* WORKOUT META */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: accent, letterSpacing: "0.06em", filter: `drop-shadow(0 0 8px ${accent}55)` }}>
              {workout.label}
            </span>
            <span style={{ fontSize: 11, color: "#999", marginLeft: 10, letterSpacing: "0.05em" }}>
              {workout.days}
            </span>
          </div>
          <button onClick={resetDay}
            style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 6, color: "#aaa", fontSize: 10, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.08em" }}>
            RESET
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.12em" }}>PROGRESS</span>
            <span style={{ fontSize: 11, color: doneSets > 0 ? accent : "#aaa" }}>
              {doneSets}/{totalSets} sets
            </span>
          </div>
          <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(doneSets / totalSets) * 100}%`,
              background: `linear-gradient(90deg, ${accent}cc 0%, ${accent} 100%)`,
              transition: "width 0.4s ease",
              boxShadow: doneSets > 0 ? `0 0 12px ${accent}cc` : "none",
            }} />
          </div>
        </div>
      </div>

      <div style={{ margin: "14px 20px", padding: "11px 14px", background: "#101010", borderRadius: 8, border: "1px solid #1f1f1f", fontSize: 11, color: "#bbb", letterSpacing: "0.04em", lineHeight: 1.5 }}>
        💡 Tap an exercise for animation, muscle map, and form cue
      </div>

      {/* EXERCISES */}
      <div>
        {workout.exercises.map((ex, i) => {
          const open = expanded === i;
          const reps = getReps(ex);
          const bonus = getRepBonus(ex.name);
          const sessions = getSessions(ex.name);
          const atMax = bonus >= settings.maxRepBonus;
          const done = exDone(i);

          return (
            <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a", background: done ? `${accent}06` : "transparent", transition: "background 0.3s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div onClick={() => setExpanded(open ? null : i)}
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {done && <span style={{ color: accent, fontSize: 14 }}>✓</span>}
                    <span style={{
                      fontSize: 15, fontWeight: 500, color: "#f5f5f5",
                      opacity: done ? 0.55 : 1,
                      textDecoration: done ? "line-through" : "none",
                      textDecorationColor: accent, textDecorationThickness: "1.5px",
                    }}>
                      {ex.name}
                    </span>
                    <span style={{ fontSize: 9, color: open ? accent : "#888", transform: open ? "rotate(180deg)" : "none", transition: "all 0.2s", display: "inline-block" }}>▼</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>{ex.sets} × {ex.repLabel}{reps}{ex.repSuffix || ""}</span>
                    {bonus > 0 && (
                      <span style={{
                        color: accent, fontSize: 10, fontWeight: 500,
                        padding: "2px 6px", borderRadius: 4, background: `${accent}20`, letterSpacing: "0.04em",
                      }}>
                        ↑+{bonus}{atMax ? " MAX" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {Array.from({ length: ex.sets }, (_, j) => {
                    const isDone = setDone(i, j);
                    return (
                      <button key={j} onClick={() => toggleSet(i, j)}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: `1.5px solid ${isDone ? accent : "#3a3a3a"}`,
                          background: isDone ? `${accent}22` : "transparent",
                          color: isDone ? accent : "#999",
                          cursor: "pointer", transition: "all 0.18s",
                          fontSize: 12, fontWeight: 500,
                          boxShadow: isDone ? `0 0 8px ${accent}44, inset 0 0 8px ${accent}22` : "none",
                        }}>
                        {isDone ? "✓" : j + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {open && (
                <div style={{
                  marginTop: 16, padding: 16,
                  background: "linear-gradient(180deg, #0e0e0e 0%, #0a0a0a 100%)",
                  border: "1px solid #232323", borderRadius: 11,
                  animation: "slideDown 0.25s ease-out",
                }}>
                  <SectionLabel>Animation</SectionLabel>
                  <ExerciseAnimation folder={ex.folder} accent={accent} />

                  <div style={{ marginTop: 14, padding: "12px 14px", background: "#080808", borderRadius: 8, border: `1.5px solid ${accent}33` }}>
                    <SectionLabel small>Form Cue</SectionLabel>
                    <div style={{ fontSize: 13, color: "#f0f0f0", marginTop: 4 }}>→ {ex.tip}</div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <SectionLabel>Muscles Targeted</SectionLabel>
                    <MuscleDiagram primary={ex.primary} secondary={ex.secondary} accent={accent} />
                  </div>

                  <div style={{ marginTop: 14, textAlign: "center" }}>
                    <div>
                      {ex.primary.map(m2 => (
                        <span key={m2} style={{
                          display: "inline-block", fontSize: 11,
                          padding: "4px 10px", borderRadius: 5,
                          margin: 3, background: accent, color: "#0a0a0a",
                          fontWeight: 500, letterSpacing: "0.04em",
                        }}>{MUSCLE_LABELS[m2]}</span>
                      ))}
                    </div>
                    {ex.secondary.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {ex.secondary.map(m2 => (
                          <span key={m2} style={{
                            display: "inline-block", fontSize: 11,
                            padding: "4px 10px", borderRadius: 5,
                            margin: 3, background: "transparent", color: accent,
                            border: `1px solid ${accent}66`, letterSpacing: "0.04em",
                          }}>{MUSCLE_LABELS[m2]}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: "#888", marginTop: 8, letterSpacing: "0.1em" }}>■ PRIMARY · □ SECONDARY</div>
                  </div>

                  {/* Progression */}
                  <div style={{ marginTop: 16, padding: "12px 14px", background: "#080808", borderRadius: 8, border: "1px solid #1f1f1f" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <SectionLabel small>Progression</SectionLabel>
                      <span style={{ fontSize: 10, color: atMax ? accent : "#bbb" }}>
                        {atMax ? "MAX REACHED" : `${sessions}/${settings.sessionsPerProgression} sessions`}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                      <div style={{
                        height: "100%",
                        width: `${(sessions / settings.sessionsPerProgression) * 100}%`,
                        background: accent, boxShadow: sessions > 0 ? `0 0 6px ${accent}aa` : "none",
                        transition: "width 0.4s",
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 8, lineHeight: 1.5 }}>
                      {atMax
                        ? `You've maxed reps at ${ex.repLabel}${reps}. Try slowing the eccentric (3s down).`
                        : `Complete ${settings.sessionsPerProgression - sessions} more session${settings.sessionsPerProgression - sessions === 1 ? "" : "s"} to bump to ${ex.repLabel}${reps + 1}`}
                    </div>
                  </div>

                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " dumbbell form")}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: 11, background: "#181818", color: "#bbb",
                      border: "1px solid #2a2a2a", borderRadius: 8,
                      fontSize: 11, letterSpacing: "0.06em",
                      textDecoration: "none", marginTop: 14,
                    }}>
                    ▶ MORE DEMOS ON YOUTUBE
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FINISH */}
      <div style={{ marginTop: 28 }}>
        {isCompleted ? (
          <div style={{
            textAlign: "center", padding: "20px", margin: "0 20px",
            background: `${accent}11`, borderRadius: 14, border: `1.5px solid ${accent}55`,
            boxShadow: `0 0 32px ${accent}22`,
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: accent, letterSpacing: "0.1em" }}>
              ✓ COMPLETED {completed[activeTab]}
            </div>
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>solid work. see you next session.</div>
          </div>
        ) : (
          <button
            onClick={finishWorkout} disabled={!allDone}
            style={{
              width: "calc(100% - 40px)", margin: "0 20px",
              padding: 18, borderRadius: 13,
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
              letterSpacing: "0.12em", cursor: allDone ? "pointer" : "not-allowed",
              border: allDone ? "none" : "1px solid #2a2a2a",
              background: allDone ? accent : "#1a1a1a",
              color: allDone ? "#050505" : "#666",
              boxShadow: allDone ? `0 0 44px ${accent}77` : "none",
              transition: "all 0.2s",
            }}>
            {allDone ? "FINISH WORKOUT" : `${totalSets - doneSets} SETS REMAINING`}
          </button>
        )}
      </div>

      {/* HISTORY */}
      {history.length > 0 && (
        <div style={{ padding: "32px 20px 0" }}>
          <div style={{ fontSize: 10, color: "#999", letterSpacing: "0.14em", marginBottom: 14, textTransform: "uppercase", fontWeight: 500 }}>
            Recent Sessions
          </div>
          {history.slice(0, 6).map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #161616" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{
                  fontSize: 10, padding: "3px 9px", borderRadius: 5,
                  background: WORKOUTS[h.workout].color + "22",
                  color: WORKOUTS[h.workout].color,
                  letterSpacing: "0.06em", fontWeight: 500,
                }}>{h.workout}</span>
                <span style={{ fontSize: 13, color: "#e0e0e0" }}>{h.day}</span>
                {h.duration && <span style={{ fontSize: 10, color: "#888" }}>{fmtDuration(h.duration)}</span>}
              </div>
              <span style={{ fontSize: 12, color: "#aaa" }}>{h.date}</span>
            </div>
          ))}
          {history.length > 6 && (
            <button onClick={() => setActiveView("calendar")}
              style={{
                background: "none", border: "1px solid #2a2a2a", borderRadius: 8,
                color: "#bbb", padding: "10px 16px", cursor: "pointer",
                fontSize: 11, letterSpacing: "0.1em", marginTop: 14,
                fontFamily: "DM Mono, monospace",
              }}>
              VIEW ALL → CALENDAR
            </button>
          )}
        </div>
      )}

      {/* OVERLAYS */}
      {restState && (
        <RestTimer
          seconds={settings.restSeconds}
          label={restState.label}
          accent={restState.accent}
          onSkip={() => setRestState(null)}
          onComplete={() => { setRestState(null); playSound("restEnd"); vibrate([200, 60, 200]); }}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function StatCard({ label, value, suffix, accent }) {
  return (
    <div style={{ flex: 1, padding: "11px 12px", background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 9 }}>
      <div style={{ fontSize: 9, color: "#aaa", letterSpacing: "0.14em", textTransform: "uppercase" }}>{label}</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 23,
        color: accent || "#fafafa", marginTop: 2, letterSpacing: "0.04em",
      }}>
        {value} {suffix && <span style={{ fontSize: 13, color: accent }}>{suffix}</span>}
      </div>
    </div>
  );
}

function SectionLabel({ children, small }) {
  return (
    <div style={{
      fontSize: small ? 9 : 10, color: "#aaa",
      letterSpacing: "0.16em", textTransform: "uppercase",
      fontWeight: 500, marginBottom: small ? 0 : 8,
    }}>{children}</div>
  );
}

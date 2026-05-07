import { useState, useEffect, useRef, useCallback } from "react";
import { WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, todayName, dateStr, computeStats } from "../data.js";
import { useSessionTimer, fmtDuration } from "../hooks.js";
import { ExerciseAnimation, RestTimer, Toast } from "../components/shared.jsx";
import MuscleDiagram from "../components/MuscleDiagram.jsx";

// ─── CONFETTI ────────────────────────────────────────────────────────────────
function Confetti({ active, accent, onDone }) {
  const canvasRef = useRef();
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    const colors = [accent, "#fbbf24", "#fb923c", "#60a5fa", "#f9fafb", "#a78bfa", "#f472b6"];
    const particles = Array.from({ length: 90 }, (_, i) => ({
      x:  Math.random() * canvas.width,
      y:  canvas.height * (0.55 + Math.random() * 0.2),
      vx: (Math.random() - 0.5) * 9,
      vy: -(Math.random() * 14 + 7),
      color: colors[i % colors.length],
      size: Math.random() * 9 + 4,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.22,
      alpha: 1,
      shape: i % 3, // 0=square, 1=circle, 2=strip
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38;
        p.vx *= 0.99;
        p.rotation += p.spin;
        p.alpha -= 0.011;
        if (p.alpha <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size * 0.4, p.size, p.size * 0.8);
        else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.size * 0.18, -p.size * 0.6, p.size * 0.36, p.size * 1.2);
        ctx.restore();
      }
      if (alive) { frame = requestAnimationFrame(draw); }
      else { onDone?.(); }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active, accent, onDone]);
  if (!active) return null;
  return (
    <canvas ref={canvasRef}
      style={{ position:"fixed", inset:0, zIndex:300, pointerEvents:"none" }}
    />
  );
}

// ─── COACH CARD ──────────────────────────────────────────────────────────────
function buildSuggestions({ history, progression, settings, workoutKey, activeDay }) {
  const workout = WORKOUTS[workoutKey];
  const suggs = [];

  // Streak recognition
  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
  let streak = 0;
  if (sorted.length > 0) {
    streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i-1].timestamp - sorted[i].timestamp) / 86400000 <= 4.5) streak++;
      else break;
    }
  }
  if (streak === 1 && history.length === 1)  suggs.push({ icon:"🎯", cat:"Milestone", msg:"First session done. The hardest part is starting — you've done it." });
  if (streak >= 3 && streak < 7)  suggs.push({ icon:"🔥", cat:"Streak", msg:`${streak} sessions in a row. This is where habits are built.` });
  if (streak >= 7)  suggs.push({ icon:"⚡", cat:"Streak", msg:`${streak}-session streak. Your body is literally different than when you started.` });

  // Upcoming progressions
  workout.exercises.forEach(ex => {
    const cur = progression[ex.name] || { sessions:0, repBonus:0 };
    const left = settings.sessionsPerProgression - cur.sessions;
    if (left === 1 && cur.repBonus < settings.maxRepBonus) {
      suggs.push({ icon:"↗️", cat:"Milestone", msg:`${ex.name}: one more session to unlock ${ex.repLabel}${ex.baseReps + cur.repBonus + 1} reps.` });
    }
    if (left === 2 && cur.repBonus < settings.maxRepBonus) {
      suggs.push({ icon:"📈", cat:"Progress", msg:`${ex.name}: 2 sessions from a rep increase. Stay consistent.` });
    }
  });

  // Form tips per workout
  const FORM = {
    A: [
      { icon:"🦵", cat:"Form", msg:"Goblet Squat: drive your elbows between your knees at the bottom. Creates a brace." },
      { icon:"💪", cat:"Form", msg:"Floor Press: tuck elbows to 45°, not flared wide. Protects your shoulders long-term." },
      { icon:"🔙", cat:"Form", msg:"Row: think 'elbow to pocket', not 'hand to hip'. Keeps lats engaged." },
      { icon:"🙌", cat:"Form", msg:"Arnold Press: rotate through the full range. The rotation is the point — don't skip it." },
      { icon:"💪", cat:"Form", msg:"Hammer Curl: resist on the way DOWN. 3-second eccentric = more muscle." },
    ],
    B: [
      { icon:"🍑", cat:"Form", msg:"RDL: push your hips BACK, not just bend forward. You should feel a deep hamstring stretch." },
      { icon:"⚡", cat:"Form", msg:"Tricep Kickback: lock your upper arm parallel to the floor. If it drops, the weight is too heavy." },
      { icon:"🦵", cat:"Form", msg:"Reverse Lunge: step back far enough that your front shin stays vertical at the bottom." },
      { icon:"🔙", cat:"Form", msg:"Rear Delt Row: lead with your pinky, flare elbows wide. This isolates rear delts vs biceps." },
      { icon:"🦵", cat:"Form", msg:"Calf Raise: pause 1–2s at the top. A rushed range of motion does nothing for calf growth." },
    ],
  };
  const tips = FORM[workoutKey] || [];
  const pick = tips[(new Date().getDate() + (workoutKey === "B" ? 3 : 0)) % tips.length];
  if (pick) suggs.push(pick);

  // Recovery on rest days
  if (!DAYS.includes(activeDay)) {
    suggs.push({ icon:"🛌", cat:"Recovery", msg:"Rest day. Muscle grows during rest, not during training. Eat protein, sleep 7–8h." });
    suggs.push({ icon:"🚶", cat:"Recovery", msg:"A 20-min walk today keeps blood flowing and reduces next-session soreness." });
    suggs.push({ icon:"💧", cat:"Hydration", msg:"Drink ~0.6oz per lb of bodyweight today. Muscles are 75% water." });
  }

  // Volume milestone
  if (history.length > 0 && history.length % 10 === 0) {
    suggs.push({ icon:"📊", cat:"Milestone", msg:`${history.length} sessions logged. That's real, accumulated effort.` });
  }

  // When all progressions maxed
  const allExercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];
  const allMaxed = allExercises.every(ex => (progression[ex.name]?.repBonus || 0) >= settings.maxRepBonus);
  if (allMaxed) suggs.push({ icon:"🏆", cat:"Milestone", msg:"All reps maxed out. Try slowing the eccentric: 3s down on every rep. New growth incoming." });

  // First session ever
  if (history.length === 0) {
    suggs.push({ icon:"🌱", cat:"Welcome", msg:"Brand new. Focus on feeling the muscle work, not moving weight fast. Perfect form now = results forever." });
    suggs.push({ icon:"📅", cat:"Welcome", msg:"Target: Mon / Wed / Fri. 3 sessions/week is the sweet spot for this program." });
  }

  return suggs;
}

function CoachCard({ suggestions, accent }) {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);

  const next = () => {
    setIdx(i => (i + 1) % suggestions.length);
    setKey(k => k + 1);
  };

  if (!suggestions.length) return null;
  const s = suggestions[idx];
  const catColor = { Milestone:"#fbbf24", Streak:"#fb923c", Form:"#60a5fa", Progress:accent, Recovery:"#a78bfa", Hydration:"#67e8f9", Welcome:accent }[s.cat] || accent;

  return (
    <div style={{
      margin:"0 20px 20px", padding:"14px 16px",
      background:"linear-gradient(135deg, #0e0e0e 0%, #111 100%)",
      border:`1.5px solid ${catColor}44`,
      borderRadius:13,
      boxShadow:`0 0 24px ${catColor}18`,
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <span style={{ fontSize:26, flexShrink:0, marginTop:1 }}>{s.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:catColor, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4, fontWeight:500 }}>
            {s.cat}
          </div>
          <div key={key} style={{ fontSize:14, color:"#eee", lineHeight:1.55, animation:"coachSlide .3s ease-out" }}>
            {s.msg}
          </div>
        </div>
        {suggestions.length > 1 && (
          <button onClick={next}
            style={{
              background:"transparent", border:`1px solid ${catColor}44`,
              color:catColor, borderRadius:7, padding:"6px 10px",
              fontSize:12, flexShrink:0, alignSelf:"center",
            }}>→</button>
        )}
      </div>
      {suggestions.length > 1 && (
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:10 }}>
          {suggestions.map((_, i) => (
            <div key={i} onClick={() => { setIdx(i); setKey(k => k+1); }}
              style={{ width:i===idx?16:5, height:4, borderRadius:2, background:i===idx?catColor:"#333", transition:"all .25s", cursor:"pointer" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WORKOUT VIEW ─────────────────────────────────────────────────────────────
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
  const [confetti, setConfetti] = useState(false);
  const [bounceSets, setBounceSets] = useState({});

  const workoutKey = SCHEDULE[activeTab];
  const workout = WORKOUTS[workoutKey];
  const accent = workout.color;

  const setKey = (i, j) => `${activeTab}_${i}_${j}`;
  const setDone  = (i, j) => !!sets[setKey(i, j)];
  const exDone   = (i)    => Array.from({ length: workout.exercises[i].sets }, (_, j) => setDone(i, j)).every(Boolean);
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets  = workout.exercises.reduce((a, ex, i) =>
    a + Array.from({ length: ex.sets }, (_, j) => setDone(i, j) ? 1 : 0).reduce((x,y)=>x+y,0), 0);
  const allDone    = doneSets === totalSets;
  const isCompleted = !!completed[activeTab];

  const sessionRunning = doneSets > 0 && !isCompleted;
  const sessionElapsed = useSessionTimer(sessionRunning);

  const getRepBonus = n => progression[n]?.repBonus || 0;
  const getSessions  = n => progression[n]?.sessions  || 0;
  const getReps      = ex => ex.baseReps + getRepBonus(ex.name);

  // Streak
  const streak = (() => {
    if (history.length === 0) return 0;
    const s = [...history].sort((a,b)=>b.timestamp-a.timestamp);
    let r=1;
    for (let i=1;i<s.length;i++){
      if((s[i-1].timestamp-s[i].timestamp)/86400000<=4.5)r++;
      else break;
    }
    return r;
  })();

  const suggestions = buildSuggestions({ history, progression, settings, workoutKey, activeDay: todayName() });

  const toggleSet = (i, j) => {
    const k = setKey(i, j);
    const wasOn = !!sets[k];
    setSets(p => ({ ...p, [k]: !wasOn }));
    if (!wasOn) {
      playSound("setComplete");
      vibrate([28]);
      // Bounce animation
      const bk = `${i}_${j}`;
      setBounceSets(p => ({ ...p, [bk]: true }));
      setTimeout(() => setBounceSets(p => { const n={...p}; delete n[bk]; return n; }), 500);
      const ex = workout.exercises[i];
      const remaining = ex.sets - (j + 1);
      const next = remaining > 0
        ? `Set ${j+2} of ${ex.name}`
        : i+1 < workout.exercises.length
          ? `Up next: ${workout.exercises[i+1].name}`
          : "Last set! Finish workout when ready.";
      setRestState({ label: next, accent });
    } else {
      playSound("uncheck");
    }
  };

  const finishWorkout = () => {
    if (!allDone) return;
    const exerciseSnapshot = workout.exercises.map(ex => ({ name:ex.name, sets:ex.sets, reps:getReps(ex) }));
    const newProg = { ...progression };
    const unlocked = [];
    workout.exercises.forEach(ex => {
      const cur = newProg[ex.name] || { sessions:0, repBonus:0 };
      const newSess = cur.sessions + 1;
      let newBonus = cur.repBonus;
      if (newSess >= settings.sessionsPerProgression && newBonus < settings.maxRepBonus) {
        newBonus += 1;
        unlocked.push(`${ex.name} → ×${ex.baseReps + newBonus}`);
        newProg[ex.name] = { sessions:0, repBonus:newBonus };
      } else if (newSess >= settings.sessionsPerProgression) {
        newProg[ex.name] = { sessions:0, repBonus:newBonus };
      } else {
        newProg[ex.name] = { sessions:newSess, repBonus:newBonus };
      }
    });
    setProgression(newProg);
    setHistory(p => [{ day:activeTab, workout:workoutKey, date:dateStr(), timestamp:Date.now(), duration:sessionElapsed, exercises:exerciseSnapshot }, ...p].slice(0,100));
    setCompleted(p => ({ ...p, [activeTab]: dateStr() }));
    setRestState(null);
    playSound("workoutDone");
    vibrate([100,60,100]);
    setConfetti(true);

    if (unlocked.length > 0) {
      setTimeout(() => {
        playSound("progression");
        setToast({ icon:"↗️", title:"PROGRESSION UNLOCKED", msg: unlocked.length===1 ? unlocked[0] : `+1 rep on ${unlocked.length} exercises`, accent });
      }, 900);
    }
  };

  const resetDay = () => {
    if (!confirm("Reset today's sets? (Doesn't affect history)")) return;
    const newSets = { ...sets };
    workout.exercises.forEach((_, i) => Array.from({ length: workout.exercises[i].sets }, (_, j) => { delete newSets[setKey(i,j)]; }));
    setSets(newSets);
    setCompleted(p => { const n={...p}; delete n[activeTab]; return n; });
    setExpanded(null);
    setRestState(null);
  };

  const totalSessions = history.length;

  return (
    <div>
      {/* HEADER */}
      <div style={{ padding:"34px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:50, letterSpacing:"0.06em", lineHeight:0.88, color:"#fafafa" }}>
              LIFT LOG
            </div>
            <div style={{ fontSize:13, color:"#999", marginTop:7, letterSpacing:"0.1em" }}>
              {settings.dumbbellWeight}LB · 3×/WEEK
            </div>
          </div>
          {sessionRunning ? (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:"#888", letterSpacing:"0.12em" }}>SESSION</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:accent, marginTop:2, letterSpacing:"0.04em", filter:`drop-shadow(0 0 8px ${accent}99)` }}>
                {fmtDuration(sessionElapsed)}
              </div>
            </div>
          ) : (
            streak > 0 && (
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#888", letterSpacing:"0.1em" }}>STREAK</div>
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#fb923c",
                  marginTop:2, letterSpacing:"0.04em",
                  filter:"drop-shadow(0 0 8px #fb923c88)",
                  animation: streak >= 5 ? "pulseGlow 2s ease-in-out infinite" : "none",
                  ["--c"]: "#fb923c",
                }}>
                  {streak} 🔥
                </div>
              </div>
            )
          )}
        </div>

        {/* Stats cards */}
        <div style={{ display:"flex", gap:8 }}>
          <StatCard label="Sessions" value={totalSessions} />
          <StatCard label="Workout" value={workout.label.split(" ")[1]} accent={accent} />
          <StatCard label="Today" value={DAYS.includes(todayName()) ? todayName().slice(0,3).toUpperCase() : "REST"} />
        </div>
      </div>

      {/* COACH CARD */}
      <CoachCard suggestions={suggestions} accent={accent} />

      {/* DAY TABS */}
      <div style={{ display:"flex", borderTop:"1px solid #1a1a1a", borderBottom:"1px solid #1a1a1a", background:"#080808" }}>
        {DAYS.map(day => {
          const isActive = activeTab === day;
          const dayColor = WORKOUTS[SCHEDULE[day]].color;
          return (
            <button key={day}
              onClick={() => { setActiveTab(day); setExpanded(null); }}
              style={{
                flex:1, padding:"14px 4px", background:"transparent", border:"none",
                color: isActive ? dayColor : "#888",
                fontSize:13, letterSpacing:"0.1em", fontWeight:500,
                borderBottom:`2.5px solid ${isActive ? dayColor : "transparent"}`,
                transition:"all 0.2s", textTransform:"uppercase",
              }}>
              {day.slice(0,3)}
              {completed[day] && <div style={{ fontSize:10, color:dayColor, marginTop:2 }}>✓</div>}
            </button>
          );
        })}
      </div>

      {/* WORKOUT META */}
      <div style={{ padding:"18px 20px 16px", borderBottom:"1px solid #1a1a1a" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:accent, letterSpacing:"0.06em", filter:`drop-shadow(0 0 10px ${accent}66)` }}>
            {workout.label}
          </span>
          <button onClick={resetDay}
            style={{ background:"none", border:"1px solid #2c2c2c", borderRadius:7, color:"#aaa", fontSize:11, padding:"7px 14px", letterSpacing:"0.08em" }}>
            RESET
          </button>
        </div>

        <div style={{ marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ fontSize:11, color:"#aaa", letterSpacing:"0.1em" }}>PROGRESS</span>
            <span style={{ fontSize:12, color: doneSets>0 ? accent : "#aaa" }}>{doneSets}/{totalSets} sets</span>
          </div>
          <div style={{ height:6, background:"#1a1a1a", borderRadius:3, overflow:"hidden" }}>
            <div style={{
              height:"100%", width:`${(doneSets/totalSets)*100}%`,
              background:`linear-gradient(90deg, ${accent}bb 0%, ${accent} 100%)`,
              transition:"width .4s ease",
              boxShadow: doneSets>0 ? `0 0 14px ${accent}bb` : "none",
            }}/>
          </div>
        </div>
      </div>

      <div style={{ margin:"16px 20px", padding:"12px 16px", background:"#101010", borderRadius:9, border:"1px solid #1f1f1f", fontSize:13, color:"#bbb", letterSpacing:"0.02em", lineHeight:1.5 }}>
        💡 Tap an exercise to see animation, muscle map &amp; form cue
      </div>

      {/* EXERCISES */}
      <div>
        {workout.exercises.map((ex, i) => {
          const open   = expanded === i;
          const reps   = getReps(ex);
          const bonus  = getRepBonus(ex.name);
          const sess   = getSessions(ex.name);
          const atMax  = bonus >= settings.maxRepBonus;
          const done   = exDone(i);

          return (
            <div key={i} style={{ padding:"18px 20px", borderBottom:"1px solid #1a1a1a", background: done ? `${accent}08` : "transparent", transition:"background .3s" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                <div onClick={() => setExpanded(open ? null : i)}
                  style={{ flex:1, minWidth:0, cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    {done && <span style={{ color:accent, fontSize:16 }}>✓</span>}
                    <span style={{
                      fontSize:17, fontWeight:500, color:"#f5f5f5",
                      opacity: done ? 0.5 : 1,
                      textDecoration: done ? "line-through" : "none",
                      textDecorationColor: accent, textDecorationThickness:"1.5px",
                    }}>{ex.name}</span>
                    <span style={{ fontSize:10, color: open ? accent : "#888", transform: open ? "rotate(180deg)" : "none", transition:"all .2s", display:"inline-block" }}>▼</span>
                  </div>
                  <div style={{ fontSize:13, color:"#bbb", marginTop:5, display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                    <span>{ex.sets} × {ex.repLabel}{reps}{ex.repSuffix || ""}</span>
                    {bonus > 0 && (
                      <span style={{
                        color:accent, fontSize:11, fontWeight:500,
                        padding:"2px 7px", borderRadius:5, background:`${accent}20`, letterSpacing:"0.04em",
                      }}>↑+{bonus}{atMax?" MAX":""}</span>
                    )}
                  </div>
                </div>

                {/* SET BUTTONS */}
                <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                  {Array.from({ length: ex.sets }, (_, j) => {
                    const isDone  = setDone(i, j);
                    const bk      = `${i}_${j}`;
                    const bouncing = !!bounceSets[bk];
                    return (
                      <button key={j} onClick={() => toggleSet(i, j)}
                        style={{
                          width:44, height:44, borderRadius:10,
                          border:`1.5px solid ${isDone ? accent : "#3a3a3a"}`,
                          background: isDone ? `${accent}25` : "#0d0d0d",
                          color: isDone ? accent : "#999",
                          transition: bouncing ? "none" : "all .18s",
                          fontSize:13, fontWeight:500,
                          boxShadow: isDone ? `0 0 10px ${accent}55, inset 0 0 8px ${accent}22` : "none",
                          animation: bouncing ? "setBounce .4s ease-out" : "none",
                        }}>
                        {isDone ? "✓" : j+1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {open && (
                <div style={{
                  marginTop:18, padding:18,
                  background:"linear-gradient(180deg,#0e0e0e,#090909)",
                  border:"1px solid #232323", borderRadius:13,
                  animation:"slideDown .25s ease-out",
                }}>
                  <Label>Animation</Label>
                  <ExerciseAnimation folder={ex.folder} accent={accent} />

                  <div style={{ marginTop:16, padding:"13px 16px", background:"#080808", borderRadius:9, border:`1.5px solid ${accent}33` }}>
                    <Label small>Form Cue</Label>
                    <div style={{ fontSize:14, color:"#f0f0f0", marginTop:5, lineHeight:1.55 }}>→ {ex.tip}</div>
                  </div>

                  <div style={{ marginTop:18 }}>
                    <Label>Muscles Targeted</Label>
                    <MuscleDiagram primary={ex.primary} secondary={ex.secondary} accent={accent} />
                  </div>

                  {/* Muscle legend */}
                  <div style={{ marginTop:12, textAlign:"center" }}>
                    <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:6 }}>
                      {ex.primary.map(m2 => (
                        <span key={m2} style={{
                          fontSize:12, padding:"5px 11px", borderRadius:6,
                          background:accent, color:"#0a0a0a", fontWeight:500, letterSpacing:"0.04em",
                        }}>{MUSCLE_LABELS[m2]}</span>
                      ))}
                    </div>
                    {ex.secondary.length > 0 && (
                      <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:6, marginTop:6 }}>
                        {ex.secondary.map(m2 => (
                          <span key={m2} style={{
                            fontSize:12, padding:"5px 11px", borderRadius:6,
                            background:"transparent", color:accent, border:`1px solid ${accent}66`, letterSpacing:"0.04em",
                          }}>{MUSCLE_LABELS[m2]}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize:10, color:"#888", marginTop:8, letterSpacing:"0.1em" }}>■ PRIMARY · □ SECONDARY</div>
                  </div>

                  {/* Progression tracker */}
                  <div style={{ marginTop:18, padding:"13px 16px", background:"#080808", borderRadius:9, border:"1px solid #1f1f1f" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <Label small>Progression</Label>
                      <span style={{ fontSize:11, color: atMax ? accent : "#bbb" }}>
                        {atMax ? "🏆 MAX REACHED" : `${sess}/${settings.sessionsPerProgression}`}
                      </span>
                    </div>
                    <div style={{ height:5, background:"#1a1a1a", borderRadius:3, overflow:"hidden", marginTop:10 }}>
                      <div style={{ height:"100%", width:`${(sess/settings.sessionsPerProgression)*100}%`, background:accent, boxShadow:`0 0 8px ${accent}aa`, transition:"width .4s" }}/>
                    </div>
                    <div style={{ fontSize:12, color:"#bbb", marginTop:10, lineHeight:1.55 }}>
                      {atMax
                        ? `All reps maxed at ×${reps}. Slow the eccentric (3s down) for continued gains.`
                        : `${settings.sessionsPerProgression - sess} more session${settings.sessionsPerProgression-sess===1?"":"s"} to unlock ×${reps+1}`}
                    </div>
                  </div>

                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+" dumbbell form tutorial")}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      padding:13, background:"#181818", color:"#bbb",
                      border:"1px solid #2a2a2a", borderRadius:9, fontSize:12,
                      letterSpacing:"0.06em", textDecoration:"none", marginTop:16,
                    }}>
                    ▶ MORE FORM DEMOS
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FINISH BUTTON */}
      <div style={{ margin:"30px 20px 0" }}>
        {isCompleted ? (
          <div style={{
            textAlign:"center", padding:"22px 20px",
            background:`${accent}12`, borderRadius:14, border:`1.5px solid ${accent}55`,
            boxShadow:`0 0 40px ${accent}22`, animation:"completePulse 1s ease-out",
            ["--glow"]: `${accent}55`,
          }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:accent, letterSpacing:"0.1em" }}>✓ DONE · {completed[activeTab]}</div>
            <div style={{ fontSize:13, color:"#ccc", marginTop:7, lineHeight:1.5 }}>Solid work. Rest, eat protein, come back strong.</div>
            {history[0]?.duration && (
              <div style={{ fontSize:12, color:"#888", marginTop:4 }}>Session time: {fmtDuration(history[0].duration)}</div>
            )}
          </div>
        ) : (
          <button onClick={finishWorkout} disabled={!allDone}
            style={{
              width:"100%", padding:20, borderRadius:14,
              fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:"0.12em",
              border: allDone ? "none" : "1px solid #2a2a2a",
              background: allDone ? accent : "#1a1a1a",
              color: allDone ? "#050505" : "#555",
              boxShadow: allDone ? `0 0 50px ${accent}88` : "none",
              transition:"all .2s",
            }}>
            {allDone ? "🏁 FINISH WORKOUT" : `${totalSets-doneSets} SETS REMAINING`}
          </button>
        )}
      </div>

      {/* RECENT HISTORY */}
      {history.length > 0 && (
        <div style={{ padding:"32px 20px 0" }}>
          <div style={{ fontSize:12, color:"#999", letterSpacing:"0.14em", marginBottom:14, textTransform:"uppercase", fontWeight:500 }}>
            Recent Sessions
          </div>
          {history.slice(0,5).map((h, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #161616" }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{
                  fontSize:11, padding:"4px 10px", borderRadius:5,
                  background:WORKOUTS[h.workout]?.color+"22", color:WORKOUTS[h.workout]?.color,
                  letterSpacing:"0.06em", fontWeight:500,
                }}>{h.workout}</span>
                <span style={{ fontSize:14, color:"#e0e0e0" }}>{h.day}</span>
                {h.duration && <span style={{ fontSize:11, color:"#888" }}>{fmtDuration(h.duration)}</span>}
              </div>
              <span style={{ fontSize:13, color:"#aaa" }}>{h.date}</span>
            </div>
          ))}
          {history.length > 5 && (
            <button onClick={() => setActiveView("calendar")}
              style={{
                background:"none", border:"1px solid #2c2c2c", borderRadius:8,
                color:"#bbb", padding:"11px 16px", fontSize:12, letterSpacing:"0.1em",
                marginTop:14, fontFamily:"DM Mono,monospace",
              }}>
              VIEW ALL → CALENDAR
            </button>
          )}
        </div>
      )}

      <div style={{ height:40 }}/>

      {/* OVERLAYS */}
      {restState && (
        <RestTimer
          seconds={settings.restSeconds}
          label={restState.label}
          accent={restState.accent}
          onSkip={() => setRestState(null)}
          onComplete={() => { setRestState(null); playSound("restEnd"); vibrate([200,60,200]); }}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <Confetti active={confetti} accent={accent} onDone={() => setConfetti(false)} />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ flex:1, padding:"13px 14px", background:"#0d0d0d", border:"1px solid #1f1f1f", borderRadius:10 }}>
      <div style={{ fontSize:10, color:"#aaa", letterSpacing:"0.14em", textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:accent||"#fafafa", marginTop:3, letterSpacing:"0.04em" }}>
        {value}
      </div>
    </div>
  );
}

function Label({ children, small }) {
  return (
    <div style={{ fontSize: small?10:11, color:"#aaa", letterSpacing:"0.16em", textTransform:"uppercase", fontWeight:500, marginBottom: small?0:8 }}>
      {children}
    </div>
  );
}

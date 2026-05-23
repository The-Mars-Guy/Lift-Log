import { useState, useEffect, useMemo, useRef } from "react";
import {
  WORKOUTS, SCHEDULE, DAYS, MUSCLE_LABELS, DEFAULT_WEIGHTS,
  EXERCISE_GUIDES, dateStr, calcDynamicTarget, assessmentTargetForProfile,
  getExerciseHistory, XP_VALUES, customRoutineWorkout,
  ageTier, EXERCISE_LIBRARY, exerciseFolder,
  forgeWorkoutName, forgeWorkoutColor, nextForgeWorkoutName,
} from "../data.js";
import { fmtDuration } from "../hooks.js";
import { useWorkoutSession } from "./workout/useWorkoutSession.js";
import { useWorkoutProgression } from "./workout/useWorkoutProgression.js";
import { ExerciseAnimation, RestTimer, Toast } from "../components/shared.jsx";
import MuscleDiagram from "../components/MuscleDiagram.jsx";
import { completionKey, defaultWorkoutDay, scheduledDate, logKey as makeLogKey } from "../session.js";
import { bestEstimated1RM, evaluateProgression, explainExerciseDecision, plateauFixes, summarizeWorkout } from "../coach.js";
import { Confetti, XpFloat } from "./workout/Effects.jsx";
import { FirstRunSetup, AssessmentFlow, ASSESSMENT_EXERCISES } from "./workout/Assessment.jsx";
import PostWorkoutFeedback from "./workout/PostWorkoutFeedback.jsx";
import { CoachDrawer, CoachFab } from "./workout/Coach.jsx";
import SetLogger from "./workout/SetLogger.jsx";
import LogbookPanel from "./workout/LogbookPanel.jsx";
import { CoachWhyPanel, ExerciseGuide, NoteField, PlateauFixPanel, RestReady, SetFeelingButtons, SLabel, SwapLibrary, ThisWeek, WeeklyMusclePlan, WorkoutSummary } from "./workout/WorkoutPanels.jsx";
import { Icon } from "../components/Icons.jsx";
import { surface, text, status } from "../theme.js";
import { Disp, Caps, Bar, Card, Sparkline } from "../components/Primitives.jsx";

function routineNeedsFullLibrary(routine) {
  if (!routine?.enabled) return false;
  const ids = [
    ...(Array.isArray(routine.exerciseIds) ? routine.exerciseIds : []),
    ...(Array.isArray(routine.routines) ? routine.routines.flatMap(day => day.exerciseIds || []) : []),
  ];
  return ids.some(id => id && !EXERCISE_LIBRARY.some(ex => ex.id === id));
}

function FocusWorkoutMode({
  workout, accent, activeTab, doneSets, totalSets, setDone, sessionLogs, logKey,
  getTargetReps, getSetCount, getWeight, getScience, toggleSet, onExit, onFinish, allDone, isCompleted,
  substitutions = [], onApplySubstitution, onRemoveSubstitution,
  getPreviousPerformance, beginnerFormMode=false, estimatedRemaining=0,
  playSound,
}) {
  const [tempoOn, setTempoOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const next = (() => {
    for (let i=0;i<workout.exercises.length;i++) {
      const ex = workout.exercises[i];
      for (let j=0;j<getSetCount(ex);j++) {
        if (!setDone(i,j)) return { ex, exIdx:i, setIdx:j };
      }
    }
    return { ex:workout.exercises[workout.exercises.length-1], exIdx:workout.exercises.length-1, setIdx:workout.exercises[workout.exercises.length-1].sets-1 };
  })();
  const target = getTargetReps(next.ex);
  const science = getScience(next.ex);
  const repText = `x${target}`;
  const weight = getWeight(next.ex);
  const weightText = weight > 0 ? `${weight}lbs` : "bodyweight";
  const plannedSets = getSetCount(next.ex);
  const currentDone = Array.from({length:plannedSets},(_,j)=>setDone(next.exIdx,j)).filter(Boolean).length;
  const originalName = next.ex.configName || next.ex.originalName || next.ex.name;
  const focusSwap = substitutions.find(sub => sub.exercise === originalName);
  const guide = EXERCISE_GUIDES[originalName] || EXERCISE_GUIDES[next.ex.name];
  const previous = getPreviousPerformance?.(next.ex);
  const tempoParts = parseTempoCode(science.tempo?.code);
  const tempoPattern = tempoParts ? [
    { label:"Lower", seconds:tempoParts[0] },
    { label:"Hold", seconds:tempoParts[1] },
    { label:"Lift", seconds:tempoParts[2] },
  ].filter(part => part.seconds > 0) : [];
  const tempoCycle = tempoPattern.reduce((sum, part) => sum + part.seconds, 0);
  const tempoPosition = tempoCycle ? beat % tempoCycle : 0;
  let elapsed = 0;
  const tempoPhase = tempoPattern.find(part => {
    const active = tempoPosition >= elapsed && tempoPosition < elapsed + part.seconds;
    elapsed += part.seconds;
    return active;
  }) || tempoPattern[0];

  useEffect(() => {
    setTempoOn(false);
    setBeat(0);
  }, [next.ex.name, science.tempo?.code]);

  useEffect(() => {
    if (!tempoOn || !tempoCycle) return undefined;
    playSound?.("tempoAccent");
    const id = setInterval(() => {
      setBeat(current => {
        const nextBeat = (current + 1) % tempoCycle;
        playSound?.(nextBeat === 0 ? "tempoAccent" : "tempoBeat");
        return nextBeat;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [tempoOn, tempoCycle, playSound]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Focus workout mode" style={{position:"fixed",inset:0,zIndex:150,background:surface.bgSolid,overflowY:"auto",padding:"calc(10px + env(safe-area-inset-top)) 16px 18px"}}>
      <div className="mobile-shell">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
          <button onClick={onExit} style={{background:"transparent",border:"none",color:text.faint,padding:"8px 12px",fontSize:12}}>Pause</button>
          {tempoPattern.length > 0&&(
            <button
              aria-label={tempoOn ? "Stop tempo metronome" : "Start tempo metronome"}
              title={tempoOn ? "Stop tempo metronome" : "Start tempo metronome"}
              onClick={()=>setTempoOn(on=>!on)}
              style={{width:42,height:42,borderRadius:12,border:`1px solid ${tempoOn?accent:"rgba(255,140,50,.15)"}`,background:tempoOn?`${accent}22`:surface.bg2,color:tempoOn?accent:text.muted,fontSize:18,fontWeight:900,boxShadow:tempoOn?`0 0 18px ${accent}2e`:"none",flexShrink:0}}
            >
              {tempoOn ? "●" : "♪"}
            </button>
          )}
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:text.muted,fontWeight:600}}>{activeTab}</div>
            <div style={{fontSize:13,color:accent}}>{doneSets}/{totalSets} sets</div>
            <div style={{fontSize:11,color:text.muted,marginTop:2}}>{fmtDuration(estimatedRemaining)} left</div>
          </div>
        </div>

        <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:6}}>Focus Mode</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:beginnerFormMode?46:38,color:text.primary,letterSpacing:".06em",lineHeight:.92,marginBottom:5}}>{next.ex.name}</div>
        <div style={{fontSize:beginnerFormMode?15:13,color:text.secondary,lineHeight:1.35,marginBottom:science.enabled&&science.targetRepReason?4:8}}>
          Set {Math.min(currentDone+1,plannedSets)} of {plannedSets} · {weightText} · target {repText}{next.ex.repSuffix||""}
        </div>
        {science.enabled&&science.targetRepReason&&(
          <div style={{fontSize:11,color:status.science,lineHeight:1.35,marginBottom:8,opacity:.9}}>{science.targetRepReason}</div>
        )}

        {previous&&(
          <Card level={1} style={{marginBottom:8,border:`1px solid ${accent}33`}}>
            <Caps color={accent} style={{display:"block",marginBottom:3}}>Last Time</Caps>
            <div style={{fontSize:13,color:text.secondary,lineHeight:1.4}}>{previous.sets} sets · {previous.totalReps} reps · best {previous.bestReps} reps{previous.bestWeight > 0 ? ` @ ${previous.bestWeight}lbs` : " bodyweight"}</div>
          </Card>
        )}

        <ExerciseAnimation folder={exerciseFolder(next.ex)} video={next.ex.video} accent={accent} compact bare/>

        <div style={{marginTop:10,display:"grid",gridTemplateColumns:`repeat(${plannedSets},1fr)`,gap:8}}>
          {Array.from({length:plannedSets},(_,j)=>{
            const isDone=setDone(next.exIdx,j);
            const logged=sessionLogs[logKey(next.exIdx,j)];
            return (
              <button key={j} onClick={()=>toggleSet(next.exIdx,j)}
                style={{height:48,borderRadius:11,border:`1.5px solid ${isDone?accent:"rgba(255,140,50,.18)"}`,background:isDone?`${accent}22`:surface.bg3,color:isDone?accent:text.muted,fontSize:13,fontWeight:700,boxShadow:isDone?`0 0 16px ${accent}6b, inset 0 0 10px ${accent}1e`:"none"}}>
                {isDone ? (logged ? `${logged.reps}r` : "DONE") : `SET ${j+1}`}
              </button>
            );
          })}
        </div>

        <Card level={1} style={{marginTop:10}}>
          <Caps style={{display:"block",marginBottom:4}}>Cue</Caps>
          <div style={{fontSize:beginnerFormMode?17:13,color:text.secondary,lineHeight:1.38}}>{beginnerFormMode && guide ? guide.movement[0] : next.ex.tip}</div>
          {science.enabled&&science.tempo&&(
            <div style={{fontSize:12,color:accent,lineHeight:1.4,marginTop:7}}>
              Tempo {science.tempo.code}: {science.tempo.label}
            </div>
          )}
        </Card>

        {tempoPattern.length > 0&&tempoOn&&(
          <div style={{marginTop:10,padding:"10px 12px",background:surface.bg0,border:`1px solid ${accent}`,borderRadius:11,boxShadow:`0 0 22px ${accent}1e`}}>
            <div style={{fontSize:10,color:accent,fontWeight:600,marginBottom:7}}>Tempo Beat · {tempoPhase?.label || "Beat"} {tempoPosition + 1}/{tempoCycle}</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${tempoPattern.length},1fr)`,gap:7}}>
              {tempoPattern.map((part)=>(
                <div key={part.label} style={{padding:"8px 6px",borderRadius:8,border:`1px solid ${tempoPhase?.label===part.label?accent:"rgba(255,140,50,.10)"}`,background:tempoPhase?.label===part.label?`${accent}24`:surface.bg1,textAlign:"center"}}>
                  <div style={{fontSize:10,color:tempoPhase?.label===part.label?accent:text.muted,fontWeight:600}}>{part.label}</div>
                  <div style={{fontSize:15,color:text.primary,fontFamily:"DM Mono,monospace",marginTop:2}}>{part.seconds}s</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {focusSwap&&(
          <div style={{marginTop:10,padding:"10px 12px",background:surface.bg0,border:`1px solid ${accent}44`,borderRadius:11}}>
            <div style={{fontSize:10,color:accent,fontWeight:600,marginBottom:4}}>Safer Option</div>
            <div style={{fontSize:13,color:text.secondary,lineHeight:1.4}}>If this feels rough today, swap to {focusSwap.substitute}. {focusSwap.reason}</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:8}}>
              <button onClick={()=>onApplySubstitution?.(focusSwap)}
                style={{background:accent,border:"none",borderRadius:8,color:"#050505",padding:"8px 10px",fontSize:11,letterSpacing:".08em",fontWeight:700}}>USE SWAP</button>
              {next.ex.substitutedFor&&<button onClick={()=>onRemoveSubstitution?.(next.ex.substitutedFor)}
                style={{background:"transparent",border:"none",color:text.muted,padding:"8px 10px",fontSize:12}}>Original</button>}
            </div>
          </div>
        )}

        {guide&&!beginnerFormMode&&(
          <div style={{marginTop:10,padding:"10px 12px",background:surface.bg0,border:`1px solid rgba(255,140,50,.10)`,borderRadius:11}}>
            <div style={{fontSize:10,color:text.muted,fontWeight:600,marginBottom:5}}>Quick Form</div>
            <div style={{fontSize:13,color:text.secondary,lineHeight:1.45}}>{guide.movement[0]}</div>
            <div style={{fontSize:12,color:text.tertiary,lineHeight:1.45,marginTop:4}}>Avoid: {guide.mistakes.slice(0,2).join(", ")}.</div>
          </div>
        )}

        <div style={{marginTop:12}}>
          <Bar value={doneSets} max={totalSets} color={accent} height={6} />
        </div>

        {allDone&&!isCompleted&&(
          <button onClick={onFinish}
            style={{width:"100%",marginTop:12,padding:16,borderRadius:14,border:"none",background:accent,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:".12em",boxShadow:`0 0 48px ${accent}6b`}}>
            LEAVE THE FORGE
          </button>
        )}
      </div>
    </div>
  );
}


function parseTempoCode(code) {
  if (!code || typeof code !== "string") return null;
  const parts = code.split("-").map(part => Number(part.trim()));
  if (parts.length < 3 || parts.some(part => !Number.isFinite(part) || part < 0)) return null;
  return parts.slice(0, 3);
}

// ── SESSION DEBRIEF ──────────────────────────────────────────────────────────
function buildDebrief(firedTypes) {
  const bullets = [];
  for (const type of firedTypes) {
    if (type.startsWith("pr-")) {
      bullets.push({ icon: "↑", text: `Strength improved on ${type.slice(3)}.` });
    } else if (type.startsWith("rep-drop-")) {
      bullets.push({ icon: "↓", text: `Fatigue accumulated quickly on ${type.slice(9)}.` });
    } else if (type.startsWith("sore-start-")) {
      const muscle = type.includes(":") ? type.split(":")[1] : type.slice(11);
      bullets.push({ icon: "~", text: `You trained through limited recovery on ${muscle}.` });
    }
  }
  if (bullets.length === 0) {
    bullets.push({ icon: "✓", text: "Session stayed within target recovery range." });
  }
  return bullets;
}

// ── MAIN VIEW ─────────────────────────────────────────────────────────────────
export default function WorkoutView({
  sets, setSets, history, setHistory, completed, setCompleted,
  progression, setProgression, settings,
  setSettings,
  exConfig, setExConfig, addXp, level,
  checkIns, setCheckIns,
  playSound, vibrate, setActiveView, theme="dark",
  assessmentDone, setAssessmentDone,
  benchmarkEditorOpen=false, setBenchmarkEditorOpen,
  customRoutine,
  userProfile,
  goals = [],
  bodyMetrics = [],
}) {
  const simpleMode = settings.simpleMode === true;
  const [activeTab,    setActiveTab]   = useState(()=>defaultWorkoutDay());
  const [expanded,     setExpanded]    = useState(null);
  const [restState,    setRestState]   = useState(null);
  const [loggerState,  setLoggerState] = useState(null);
  const [toast,        setToast]       = useState(null);
  const [confetti,     setConfetti]    = useState(false);
  const [bounceSets,   setBounceSets]  = useState({});
  const [xpVisible,    setXpVisible]   = useState(false);
  const [xpAmount,     setXpAmount]    = useState(0);
  const [showFeedback, setShowFeedback]= useState(false);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [undoSet,      setUndoSet]      = useState(null);
  const [coachOpen,    setCoachOpen]    = useState(false);
  const [benchmarkDismissed, setBenchmarkDismissed] = useState(false);
  const [logbookMode, setLogbookMode] = useState(false);
  const [coachAlerts, setCoachAlerts] = useState([]);
  const [debrief,     setDebrief]     = useState(null);
  const [fullExerciseLibrary, setFullExerciseLibrary] = useState(null);
  const firedAlertTypes = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    if (!routineNeedsFullLibrary(customRoutine) || fullExerciseLibrary) return undefined;
    import("../data/exerciseLibrary.js").then(mod => {
      if (!cancelled) setFullExerciseLibrary(mod.FULL_EXERCISE_LIBRARY);
    });
    return () => { cancelled = true; };
  }, [customRoutine, fullExerciseLibrary]);

  const routineLibrary = fullExerciseLibrary || EXERCISE_LIBRARY;
  const dbLoading = !!(customRoutine?.enabled && routineNeedsFullLibrary(customRoutine) && !fullExerciseLibrary);
  const customWorkout = customRoutine?.enabled ? customRoutineWorkout(customRoutine, activeTab, { exerciseLibrary: routineLibrary }) : null;
  const wKey    = customWorkout ? "CUSTOM" : SCHEDULE[activeTab];
  const workout = customWorkout || WORKOUTS[wKey];
  const effectiveSchedule = customRoutine?.enabled ? customRoutine.schedule : SCHEDULE;
  const forgeName = forgeWorkoutName(activeTab, effectiveSchedule);
  const accent    = forgeWorkoutColor(activeTab, effectiveSchedule);

  // Derive session identity before the hook (hook needs these; workoutPlan needs hook output)
  const sessionKey  = completionKey(activeTab);
  const isCompleted = !!completed[sessionKey];

  const {
    sessionLogs, setSessionLogs, xpAwards, setXpAwards,
    workoutNote, setWorkoutNote, focusMode, setFocusMode,
    substitutions, setSubstitutions, exerciseOrder, setExerciseOrder,
    activeSession, setActiveSession,
    pendingRecovery, continueRecovery, discardRecovery,
    sessionHydrated, skipSessionPersist,
  } = useWorkoutSession({ sessionKey, isCompleted });

  const workoutPlan = useMemo(() => {
    const applySubstitution = (ex) => {
      const sub = substitutions[ex.name];
      if (!sub) return ex;
      return {
        ...ex,
        name: sub.name,
        originalName: ex.name,
        configName: ex.name,
        substitutedFor: ex.name,
        tip: `Substitute for ${ex.name}: ${sub.reason}. Keep the reps controlled and pain-free.`,
      };
    };
    const base = workout.exercises.map(applySubstitution);
    const keyOf = (ex) => ex.configName || ex.name;
    const ordered = exerciseOrder.length
      ? [...base].sort((a,b)=>(exerciseOrder.indexOf(keyOf(a)) === -1 ? 999 : exerciseOrder.indexOf(keyOf(a))) - (exerciseOrder.indexOf(keyOf(b)) === -1 ? 999 : exerciseOrder.indexOf(keyOf(b))))
      : base;
    return { ...workout, exercises: ordered };
  }, [workout, substitutions, exerciseOrder]);

  const {
    effectiveReadiness, effectiveRest,
    coachPlan, coachMemory,
    exerciseKey, exerciseIdFor, configKey, getConfig,
    getScience, getTargetReps, getSetCount, getWeight, getNextW, getMaxTest,
    ownedWeights, stepWeight,
    exDone, totalSets, doneSets, allDone,
    sessionRunning, sessionElapsed,
    estimatedRemaining,
    getPreviousPerformance,
    streak, muscleReadiness, sessionIntent,
  } = useWorkoutProgression({
    workoutPlan, exConfig, sets, history, checkIns, settings, progression,
    userProfile, goals, bodyMetrics, sessionKey, dbLoading, workout, isCompleted,
  });

  const logKey  = (i,j) => makeLogKey(sessionKey,i,j);
  const setKey  = (i,j) => `${sessionKey}_${i}_${j}`;
  const setDone = (i,j) => !!sets[setKey(i,j)];
  const completedSession = useMemo(() => {
    const scheduled = scheduledDate(activeTab);
    const scheduledTime = scheduled.getTime();
    const scheduledLabel = dateStr(scheduled);
    return history.find(h =>
      h.day === activeTab
      && (h.timestamp === scheduledTime || h.date === scheduledLabel)
    );
  }, [history, activeTab]);

  // Apply any pending adjustments at session start
  useEffect(()=>{
    const pending=Object.entries(exConfig).filter(([,cfg])=>cfg.pendingAdj!==undefined&&cfg.pendingAdj!==null);
    if(pending.length){
      setExConfig(p=>{
        const n={...p};
        pending.forEach(([name,cfg])=>{
          n[name]={...cfg,pendingAdj:null};
        });
        return n;
      });
    }
  },[activeTab]); // eslint-disable-line

  useEffect(() => {
    if (!sessionHydrated.current) return;
    if (skipSessionPersist.current) {
      skipSessionPersist.current = false;
      return;
    }
    if (isCompleted) {
      if (activeSession?.sessionKey === sessionKey) setActiveSession(null);
      return;
    }
    if (doneSets > 0) {
      setActiveSession({
        version: 1,
        sessionKey,
        day: activeTab,
        workout: wKey,
        updatedAt: Date.now(),
        sessionLogs,
        xpAwards,
        workoutNote,
        focusMode,
        substitutions,
        exerciseOrder,
      });
    } else if (activeSession?.sessionKey === sessionKey) {
      setActiveSession(null);
    }
  }, [sessionKey, activeTab, wKey, doneSets, isCompleted, sessionLogs, xpAwards, workoutNote, focusMode, substitutions, exerciseOrder]); // eslint-disable-line

  const logCoachEvent = (entry) => {
    setCheckIns(p => [...(p || []), {
      sessionKey,
      day:activeTab,
      workout:wKey,
      date:dateStr(scheduledDate(activeTab)),
      timestamp:Date.now(),
      ...entry,
    }].slice(-1000));
  };

  const useSubstitution = (sub, option) => {
    const chosen = option || sub.alternatives?.find(item => item.name === sub.substitute) || { name: sub.substitute, reason: sub.reason };
    setSubstitutions(p => ({ ...p, [sub.exercise]: { name: chosen.name, reason: chosen.reason || sub.reason } }));
    setToast({ icon:"refresh", title:"SWAP ACTIVE", msg:`${sub.exercise} swapped for ${chosen.name} today.`, accent });
  };

  const removeSubstitution = (exerciseName) => {
    setSubstitutions(p => {
      const n = { ...p };
      delete n[exerciseName];
      return n;
    });
  };

  useEffect(() => {
    if (!undoSet) return;
    const duration = restState && !restState.done
      ? Math.max((restState.plannedSeconds || effectiveRest || 0) * 1000 + 1200, 4500)
      : 4500;
    const id = setTimeout(() => setUndoSet(null), duration);
    return () => clearTimeout(id);
  }, [undoSet, restState?.restId, restState?.done, restState?.plannedSeconds, effectiveRest]); // eslint-disable-line react-hooks/exhaustive-deps

  const spawnXp = (amount) => {
    addXp(amount);
    setXpAmount(amount);
    setXpVisible(true);
    setTimeout(()=>setXpVisible(false),900);
  };

  const fireCoachAlert = (type, msg) => {
    if (firedAlertTypes.current.has(type)) return;
    firedAlertTypes.current.add(type);
    const id = Date.now() + Math.random();
    setCoachAlerts(prev => [...prev.slice(-1), { id, msg }]);
    setTimeout(() => setCoachAlerts(prev => prev.filter(a => a.id !== id)), 5000);
  };

  const completeLoggedSet = (i, j, log, action = "save") => {
    const k = setKey(i,j);
    const ex = workoutPlan.exercises[i];
    const lk = logKey(i,j);
    const cleanLog = {
      weight: Number.isFinite(Number(log.weight)) ? Math.max(Number(log.weight), 0) : getWeight(ex),
      reps: Number.isFinite(Number(log.reps)) ? Math.max(Math.round(Number(log.reps)), 0) : getTargetReps(ex),
    };

    // — Coach event: rep drop (fatigue signal) ——————————————————
    const prevSessionSets = Object.entries({...sessionLogs, [lk]: cleanLog})
      .filter(([k2]) => k2.startsWith(`${i}-`))
      .sort(([a],[b]) => Number(a.split("-")[1]) - Number(b.split("-")[1]))
      .map(([,v]) => v.reps);
    if (prevSessionSets.length >= 2) {
      const first = prevSessionSets[0];
      const last  = prevSessionSets[prevSessionSets.length - 1];
      if (first > 0 && last <= first * 0.72) {
        fireCoachAlert(`rep-drop-${ex.name}`, `Fatigue on ${ex.name} — reps dropped from ${first} to ${last}. Keep form clean.`);
      }
    }

    // — Coach event: PR (new est1RM) ——————————————————————————
    if (cleanLog.weight > 0 && cleanLog.reps > 0) {
      const newEst = cleanLog.weight * (1 + cleanLog.reps / 30);
      const prevBest = bestEstimated1RM(history, exerciseKey(ex), exConfig);
      if (!prevBest || newEst > prevBest * 1.02) {
        fireCoachAlert(`pr-${ex.name}`, `New est. 1RM on ${ex.name} — up to ${Math.round(newEst)}lbs. Strong set.`);
      }
    }

    // — Coach event: sore-muscle start ————————————————————————
    if (j === 0) {
      const sore = muscleReadiness.find(m => m.state === "sore" && (ex.primary||[]).includes(m.muscle));
      if (sore) {
        const label = MUSCLE_LABELS[sore.muscle] || sore.muscle;
        fireCoachAlert(`sore-start-${ex.name}:${label}`, `${ex.name} targets ${label}, which is still sore. Targets are already adjusted.`);
      }
    }

    setSets(p=>({...p,[k]:true}));
    setSessionLogs(p=>({...p,[lk]:cleanLog}));
    logCoachEvent({kind:"set_log",action,exercise:ex.name,set:j+1,weight:cleanLog.weight,reps:cleanLog.reps});
    if(!xpAwards[lk]){
      setXpAwards(p=>({...p,[lk]:true}));
      spawnXp(XP_VALUES.set);
    }
    setUndoSet({exIdx:i,setIdx:j,setKey:k,logKey:lk,label:`${ex.name} set ${j+1}`});
    playSound("setComplete"); vibrate([28]);
    setBounceSets(p=>({...p,[lk]:true}));
    setTimeout(()=>setBounceSets(p=>{const n={...p};delete n[lk];return n;}),500);
    const remaining=getSetCount(ex)-(j+1);
    const hasNextExercise=i+1<workoutPlan.exercises.length;
    const next=remaining>0?`Set ${j+2} of ${ex.name}`:hasNextExercise?`Up next: ${workoutPlan.exercises[i+1].name}`:null;
    if(next) {
      const restId = `${sessionKey}_${i}_${j}_${Date.now()}`;
      logCoachEvent({kind:"rest",action:"start",restId,exercise:ex.name,set:j+1,plannedSeconds:effectiveRest});
      setRestState({label:next,accent,restId,startedAt:Date.now(),plannedSeconds:effectiveRest});
    }
    else setRestState(null);
  };

  const toggleSet = (i,j) => {
    const k=setKey(i,j); const was=!!sets[k];
    const ex=workoutPlan.exercises[i];
    const lk=logKey(i,j);

    if(was){
      const logged=sessionLogs[lk]||{weight:getWeight(ex),reps:getTargetReps(ex)};
      setLoggerState({exIdx:i,setIdx:j,weight:logged.weight,reps:logged.reps,editing:true});
      return;
    }

    setLoggerState({exIdx:i,setIdx:j,weight:getWeight(ex),reps:getTargetReps(ex),editing:false});
  };

  const saveSetFeedback = (feeling) => {
    if(!undoSet) return;
    const ex = workoutPlan.exercises[undoSet.exIdx];
    const entry = {
      kind:"set_feedback",
      sessionKey,
      setKey:undoSet.setKey,
      day:activeTab,
      workout:wKey,
      exercise:ex.name,
      originalName:ex.originalName || ex.configName || ex.name,
      set:undoSet.setIdx + 1,
      feeling,
      date:dateStr(scheduledDate(activeTab)),
      timestamp:Date.now(),
    };
    setCheckIns(p=>[...(p||[]).filter(ci=>ci.kind!=="set_feedback"||ci.setKey!==undoSet.setKey),entry]);
    setToast({
      icon:feeling==="pain"?"alert":"robot",
      title:"COACH NOTE SAVED",
      msg:feeling==="pain" ? `${ex.name} flagged for discomfort.` : `${ex.name} set ${undoSet.setIdx+1}: ${feeling}.`,
      accent:feeling==="pain"?status.caution:accent,
      duration:2000,
    });
    setUndoSet(null);
  };

  const undoLastSet = () => {
    if(!undoSet) return;
    setSets(p=>{const n={...p};delete n[undoSet.setKey];return n;});
    setSessionLogs(p=>{const n={...p};delete n[undoSet.logKey];return n;});
    if(xpAwards[undoSet.logKey]) addXp(-XP_VALUES.set);
    setXpAwards(p=>{const n={...p};delete n[undoSet.logKey];return n;});
    if(loggerState?.exIdx===undoSet.exIdx&&loggerState?.setIdx===undoSet.setIdx) setLoggerState(null);
    setRestState(null);
    setUndoSet(null);
    playSound("uncheck");
  };

  const saveLog = ({weight,reps}) => {
    if(!loggerState) return;
    const {exIdx,setIdx,editing}=loggerState;
    const lk=logKey(exIdx,setIdx);
    if(editing){
      setSessionLogs(p=>({...p,[lk]:{weight,reps}}));
      logCoachEvent({kind:"set_log",action:"edit",exercise:workoutPlan.exercises[exIdx].name,set:setIdx+1,weight,reps});
    } else {
      completeLoggedSet(exIdx,setIdx,{weight,reps},"save");
    }
    setLoggerState(null);
  };

  const skipLog = () => {
    if(!loggerState) return;
    const {exIdx,setIdx,editing}=loggerState;
    if(editing){
      setLoggerState(null);
      return;
    }
    const ex=workoutPlan.exercises[exIdx];
    completeLoggedSet(exIdx,setIdx,{weight:getWeight(ex),reps:getTargetReps(ex)},"skip");
    setLoggerState(null);
  };

  const finishWorkout = () => {
    if(!allDone) return;
    const exSnap = workoutPlan.exercises.map((ex,i)=>{
      const sets=getSetCount(ex);
      const logs=Array.from({length:sets},(_,j)=>sessionLogs[logKey(i,j)]||{weight:getWeight(ex),reps:getTargetReps(ex)});
      return {id:exerciseIdFor(ex),plannedId:exerciseIdFor({ ...ex, name:ex.configName || ex.originalName || ex.name }),name:ex.name,originalName:ex.originalName,substitutedFor:ex.substitutedFor,sets,reps:getTargetReps(ex),setLog:logs};
    });

    // Update weights / next weight suggestions
    // weight calc inline
    const newConfig={...exConfig};
    const prs=[];
    exSnap.forEach((exS,i)=>{
      const ex=workoutPlan.exercises[i];
      const key=configKey(ex);
      const curW=getWeight(ex);
      const prevConfig=getConfig(ex);
      const rec=evaluateProgression({setLog:exS.setLog,targetReps:getTargetReps(ex),currentWeight:curW,previous:prevConfig,increment:settings.weightIncrement||2.5,style:settings.coachStyle||ageTier(userProfile).progressStyle,autoDeload:settings.autoDeload!==false,availableWeights:ownedWeights});
      const curMaxW=prevConfig?.maxWeight||0;
      const newMaxW=Math.max(...exS.setLog.map(l=>l.weight));
      if(newMaxW>curMaxW) prs.push({name:ex.name,val:newMaxW});
      newConfig[key]={...newConfig[key],weight:rec.action==="deload"?rec.nextWeight:curW,nextWeight:rec.action==="increase"?rec.nextWeight:undefined,maxWeight:Math.max(newMaxW,curMaxW),cleanSessions:rec.cleanSessions,missSessions:rec.missSessions,lastRec:rec.action,lastRecNote:rec.note};
    });
    setExConfig(newConfig);

    // Rep progression (legacy fallback)
    const newProg={...progression};
    const unlocked=[];
    workout.exercises.forEach(ex=>{
      const cur=newProg[ex.name]||{sessions:0,repBonus:0};
      const newS=cur.sessions+1; let newB=cur.repBonus;
      if(newS>=settings.sessionsPerProgression&&newB<settings.maxRepBonus){
        newB+=1; unlocked.push(`${ex.name} → ×${ex.baseReps+newB}`);
        newProg[ex.name]={sessions:0,repBonus:newB};
      } else if(newS>=settings.sessionsPerProgression){
        newProg[ex.name]={sessions:0,repBonus:newB};
      } else { newProg[ex.name]={sessions:newS,repBonus:newB}; }
    });
    setProgression(newProg);

    setWorkoutSummary(summarizeWorkout({
      exercises:exSnap,
      duration:sessionElapsed,
      readiness:effectiveReadiness,
      prs,
      nextWorkout: nextForgeWorkoutName(activeTab, effectiveSchedule),
    }));
    setHistory(p=>[{day:activeTab,workout:wKey,date:dateStr(scheduledDate(activeTab)),timestamp:scheduledDate(activeTab).getTime(),duration:sessionElapsed,exercises:exSnap,readiness:effectiveReadiness,note:workoutNote.trim()||undefined,warmup:"Easy movement + light first set",cooldown:"Slow breathing + gentle mobility"} ,...p].slice(0,120));
    setCompleted(p=>({...p,[sessionKey]:dateStr(scheduledDate(activeTab))}));
    setActiveSession(null);
    setDebrief(buildDebrief(firedAlertTypes.current));
    playSound("workoutDone"); vibrate([100,60,100]);
    setConfetti(true);
    spawnXp(XP_VALUES.workout);

    if(prs.length) setTimeout(()=>{playSound("achievement");setToast({icon:"trophy",title:"NEW PEAK",msg:prs.map(p=>`${p.name}: ${p.val}lbs`).join(", "),accent:status.warn});},600);
  };

  const handleFeedback = (feedbackPayload) => {
    setShowFeedback(false);
    const feedbackMap = feedbackPayload?.exercises || feedbackPayload || {};
    const workoutFeeling = feedbackPayload?.workoutFeeling;
    if (workoutFeeling) {
      logCoachEvent({kind:"workout_feedback",feeling:workoutFeeling});
    }
    const workoutAdj = { easy: 1, good: 0, hard: -1, pain: -2 }[workoutFeeling] || 0;
    // Apply feedback as pending adjustments
    const newConfig={...exConfig};
    workoutPlan.exercises.forEach(ex=>{
      const fb=feedbackMap[ex.name];
      if(!fb&&!workoutAdj) return;
      const key=configKey(ex);
      const cur=newConfig[key]||{};
      const maxTest=cur.maxRepsTest;
      const baseFeedbackTarget = fb ? calcDynamicTarget(getTargetReps(ex),fb,maxTest) : getTargetReps(ex);
      const newTarget=Math.max(3, baseFeedbackTarget + workoutAdj);
      const adj=newTarget-getTargetReps(ex);
      newConfig[key]={...cur,targetReps:newTarget,pendingAdj:adj};
    });
    setExConfig(newConfig);
    setSessionLogs({});
    setXpAwards({});
    setFocusMode(false);
    setWorkoutSummary(null);
    setDebrief(null);
    setUndoSet(null);
    setRestState(null);
    setLoggerState(null);
    setWorkoutNote("");
  };

  const assessmentExercises = workout.exercises?.length ? workout.exercises : ASSESSMENT_EXERCISES;
  const getAssessmentResults = () => Object.fromEntries(assessmentExercises.map(ex => {
    const config = getConfig(ex);
    const fromTarget = config.targetReps ? Math.max(1, Math.round(config.targetReps / 0.65)) : ex.baseReps;
    return [ex.name, config.maxRepsTest || fromTarget];
  }));

  const completeAssessment = (results) => {
    const newConfig={...exConfig};
    assessmentExercises.forEach(ex=>{
      const maxReps=results?.[ex.name];
      const target=maxReps ? assessmentTargetForProfile(maxReps, userProfile) : ex.baseReps;
      const key=configKey(ex);
      newConfig[key]={
        ...newConfig[key],
        maxRepsTest:maxReps||null,
        targetReps:target,
        weight:newConfig[key]?.weight ?? DEFAULT_WEIGHTS[ex.name] ?? settings.dumbbellWeight,
      };
    });
    setExConfig(newConfig);
    setAssessmentDone(true);
    setBenchmarkEditorOpen?.(false);
  };

  // Show assessment if not done yet and no history
  if (!settings.onboardingDone && history.length === 0) {
    return <FirstRunSetup settings={settings} setSettings={setSettings} accent={accent}/>;
  }

  if (benchmarkEditorOpen) {
    return (
      <AssessmentFlow
        onComplete={completeAssessment}
        onCancel={()=>setBenchmarkEditorOpen?.(false)}
        accent={accent}
        theme={theme}
        initialResults={getAssessmentResults()}
        exercises={assessmentExercises}
        userProfile={userProfile}
        editing
      />
    );
  }

  // Assessment is now optional — users can dismiss and do it later via Settings → Edit Benchmark

  if (logbookMode) {
    return (
      <LogbookPanel
        accent={accent}
        onClose={() => setLogbookMode(false)}
        onSave={({ exercises, duration }) => {
          setHistory(p => [{
            day: activeTab,
            workout: "LOGBOOK",
            date: dateStr(scheduledDate(activeTab)),
            timestamp: Date.now(),
            duration,
            exercises,
            note: "Free log session",
          }, ...p].slice(0, 120));
          setLogbookMode(false);
        }}
      />
    );
  }

  return (
    <div>
      {xpVisible&&<XpFloat amount={xpAmount} onDone={()=>setXpVisible(false)}/>}

      {/* HEADER */}
      <div style={{padding:"20px 16px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:".06em",lineHeight:1}}>
              <span style={{color:text.primary}}>GYM </span>
              <span style={{color:accent}}> FORGED</span>
            </div>
            <div style={{fontSize:11,color:text.tertiary,letterSpacing:".08em",display:"flex",alignItems:"center",gap:4}}><Icon name={level.badge} size={12} color={text.tertiary} />{level.name} · LV.{level.idx+1}</div>
          </div>
          <div style={{textAlign:"right"}}>
            {sessionRunning?(<>
              <Disp size={22} color={accent} style={{display:"block",filter:`drop-shadow(0 0 6px ${accent}8a)`}}>{fmtDuration(sessionElapsed)}</Disp>
              <div style={{fontSize:10,color:text.tertiary}}>~{fmtDuration(estimatedRemaining)} left</div>
            </>):streak>0?(
              <Disp size={22} color="#fb923c" style={{display:"block",filter:"drop-shadow(0 0 6px #fb923c88)"}}>{streak} 🔥</Disp>
            ):null}
          </div>
        </div>
        {/* Slim XP bar — no labels */}
        <div style={{marginTop:8}}>
          <Bar value={level.pct} max={1} color={level.color} height={3} />
        </div>
      </div>

      {/* BENCHMARK SUGGESTION — dismissable, shown until assessment done */}
      {!assessmentDone && !benchmarkDismissed && history.length < 3 && (
        <div style={{margin:"0 16px 8px",padding:"13px 14px",background:surface.bg0,border:`1px solid ${accent}44`,borderRadius:11,display:"flex",alignItems:"flex-start",gap:12}}>
          <span style={{fontSize:20,flexShrink:0}}>🧠</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,color:accent,fontWeight:800,marginBottom:3}}>Help the coach learn your baseline</div>
            <div style={{fontSize:12,color:text.tertiary,lineHeight:1.45}}>A quick 3-exercise test (plank, push-ups, squats) lets the coach calibrate your starting reps and targets. Optional — skip anytime.</div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={()=>setBenchmarkEditorOpen?.(true)} style={{padding:"8px 14px",background:accent,border:"none",borderRadius:8,color:"#050505",fontSize:12,fontWeight:800,cursor:"pointer",letterSpacing:".06em"}}>TAKE TEST</button>
              <button onClick={()=>setBenchmarkDismissed(true)} style={{padding:"8px 10px",background:"transparent",border:"none",color:text.faint,fontSize:12,cursor:"pointer"}}>Skip for now</button>
            </div>
          </div>
        </div>
      )}

      {/* DAY TABS */}
      <div style={{display:"flex",borderTop:`1px solid rgba(255,140,50,.08)`,borderBottom:`1px solid rgba(255,140,50,.08)`,background:surface.bg0}}>
        {DAYS.map(day=>{
          const isActive=activeTab===day; const dc=WORKOUTS[SCHEDULE[day]].color;
          return(
            <button key={day} onClick={()=>{setActiveTab(day);setExpanded(null);}}
              style={{flex:1,padding:"16px 4px",background:"transparent",border:"none",color:isActive?dc:text.muted,fontSize:14,letterSpacing:".1em",fontWeight:600,borderBottom:`2.5px solid ${isActive?dc:"transparent"}`,transition:"all .2s",textTransform:"uppercase"}}>
              {day.slice(0,3)}
              {completed[completionKey(day)]&&<div style={{fontSize:10,color:dc,marginTop:2}}>✓</div>}
            </button>
          );
        })}
      </div>

      {/* RECOVERY BANNER */}
      {pendingRecovery && (
        <div style={{margin:"8px 16px",padding:"13px 14px",background:`${accent}14`,border:`1px solid ${accent}55`,borderRadius:11,display:"flex",alignItems:"flex-start",gap:12}}>
          <span style={{fontSize:18,flexShrink:0}}>↺</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,color:accent,fontWeight:800,marginBottom:2}}>Recovered your in-progress {pendingRecovery.day} workout</div>
            <div style={{fontSize:12,color:text.tertiary,lineHeight:1.4}}>{Object.keys(pendingRecovery.sessionLogs||{}).length} set{Object.keys(pendingRecovery.sessionLogs||{}).length!==1?"s":""} logged · saved {new Date(pendingRecovery.updatedAt||0).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={continueRecovery} style={{padding:"8px 14px",background:accent,border:"none",borderRadius:8,color:"#050505",fontSize:12,fontWeight:800,cursor:"pointer",letterSpacing:".06em"}}>CONTINUE</button>
              <button onClick={discardRecovery} style={{padding:"8px 10px",background:"transparent",border:"none",color:text.faint,fontSize:12,cursor:"pointer"}}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* WORKOUT META */}
      <div style={{padding:"22px 16px 18px",borderBottom:`1px solid rgba(255,140,50,.07)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:accent,letterSpacing:".06em",filter:`drop-shadow(0 0 10px ${accent}5c)`}}>{forgeName}</span>
            {sessionIntent&&(
              <div style={{marginTop:2}}>
                <span style={{
                  fontSize:12,fontWeight:600,
                  color: sessionIntent.tone==="boost"?accent : sessionIntent.tone==="caution"?status.warn : sessionIntent.tone==="deload"?status.info : text.muted
                }}>{sessionIntent.label}</span>
              </div>
            )}
          </div>
          <button onClick={()=>{if(!confirm("Reset today's sets?"))return;const n={...sets};workoutPlan.exercises.forEach((ex,i)=>Array.from({length:getSetCount(ex)},(_,j)=>{delete n[setKey(i,j)];}));setSets(n);setCompleted(p=>{const n2={...p};delete n2[sessionKey];return n2;});setExpanded(null);setRestState(null);setLoggerState(null);setSessionLogs({});setXpAwards({});setActiveSession(null);setFocusMode(false);setWorkoutSummary(null);setUndoSet(null);}}
            style={{background:"none",border:"none",color:text.ghost,fontSize:12,padding:"8px 10px"}}>Reset</button>
        </div>
        <div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <Caps>Progress</Caps>
            <span style={{fontSize:12,color:doneSets>0?accent:text.muted}}>{doneSets}/{totalSets} sets · ~{fmtDuration(estimatedRemaining)} left</span>
          </div>
          <Bar value={doneSets} max={totalSets} color={accent} height={7} />
          {doneSets===0&&!isCompleted&&sessionIntent?.note&&(
            <div style={{marginTop:12,fontSize:13,color:text.muted,lineHeight:1.55}}>
              {sessionIntent.note}
            </div>
          )}
          {doneSets===0&&!isCompleted&&muscleReadiness.some(m=>m.state!=="ready")&&(
            <div style={{marginTop:20}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
                <div style={{fontSize:12,color:text.faint,fontWeight:600}}>Muscle readiness</div>
                <div style={{fontSize:11,color:text.ghost}}>Adapts around recovery.</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {muscleReadiness.map(({muscle,state})=>{
                  const col = state==="sore"?status.caution:state==="recovering"?status.warn:status.good;
                  return (
                    <span key={muscle} style={{fontSize:11,color:col,borderRadius:999,padding:"3px 10px",background:`${col}18`,fontWeight:500}}>
                      {MUSCLE_LABELS[muscle]||muscle}{state==="ready"?" ✓":state==="recovering"?" ~":" ✗"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {!isCompleted&&(
            <NoteField value={workoutNote} onChange={setWorkoutNote} />
          )}
          {!isCompleted&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,marginTop:12}}>
              <button onClick={()=>setFocusMode(true)}
                style={{padding:"18px",background:accent,border:"none",borderRadius:13,color:"#050505",fontFamily:"'Bebas Neue',sans-serif",fontSize:25,letterSpacing:".12em",boxShadow:`0 0 36px ${accent}4d`}}>
                START WORKOUT
              </button>
              <button onClick={() => setLogbookMode(true)}
                style={{padding:"14px 16px",background:surface.bg3,border:`1px solid rgba(255,140,50,.25)`,borderRadius:13,color:text.secondary,fontSize:11,fontWeight:600,lineHeight:1.3,textAlign:"center"}}>
                📓{"\n"}Free{"\n"}log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EXERCISES */}
      <div>
        {dbLoading && (
          <div style={{padding:"32px 0",textAlign:"center",color:text.muted,fontSize:13,letterSpacing:".06em"}}>Loading exercises…</div>
        )}
        {workoutPlan.exercises.map((ex,i)=>{
          const open=expanded===i;
          const exKey=exerciseKey(ex);
          const reps=getTargetReps(ex);
          const done=exDone(i);
          const curW=getWeight(ex); const nextW=getNextW(ex);
          const hasNxtW=nextW&&nextW>curW;
          const maxTest=getMaxTest(ex);
          const science=getScience(ex);
          const exColor=WORKOUTS.A.exercises.some(e=>e.name===ex.name)?WORKOUTS.A.color:WORKOUTS.B.color;
          const histData=getExerciseHistory(exKey,history);
          const guide=EXERCISE_GUIDES[exKey] || EXERCISE_GUIDES[ex.name];
          const fixes=plateauFixes({history,exercise:{...ex,name:exKey},targetReps:reps});
          const why=explainExerciseDecision({
            exercise:ex,
            history,
            exConfig,
            targetReps:reps,
            science,
            progressionRec:getConfig(ex),
            settings,
            checkIns,
          });

          return(
            <div key={i} style={{padding:"18px 16px",borderBottom:`1px solid rgba(255,140,50,.08)`,background:done?`${accent}08`:"transparent",transition:"background .3s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div onClick={()=>setExpanded(open?null:i)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {done&&<span style={{color:accent,fontSize:17}}>✓</span>}
                    <span style={{fontSize:18,fontWeight:500,color:text.primary,opacity:done?.5:1,textDecoration:done?"line-through":"none",textDecorationColor:accent,textDecorationThickness:"1.5px"}}>{ex.name}</span>
                    {ex.substitutedFor&&<span style={{fontSize:11,color:accent,fontWeight:600}}>swap</span>}
                    <span style={{fontSize:14,color:open?accent:text.muted,transform:open?"rotate(180deg)":"none",transition:"all .2s",display:"inline-block"}}>⌄</span>
                  </div>
                  <div style={{fontSize:14,color:text.secondary,marginTop:5,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span>{getSetCount(ex)} × {reps}{ex.repSuffix||""}</span>
                    <span style={{color:text.faint}}>{curW > 0 ? `@ ${curW}lbs` : "bodyweight"}</span>
                    {hasNxtW&&<span style={{color:accent,fontSize:12,fontWeight:500}}>→ {nextW}lbs</span>}
                    {maxTest&&<span style={{color:text.tertiary,fontSize:11}}>max: {maxTest}</span>}
                  </div>
                  {!isCompleted&&doneSets===0&&(
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      <button onClick={(e)=>{e.stopPropagation();setExerciseOrder(order=>moveExerciseOrder(order, workoutPlan.exercises, i, -1, exerciseKey));}} style={{background:"none",border:"none",color:text.ghost,padding:"4px 6px",fontSize:13}}>↑</button>
                      <button onClick={(e)=>{e.stopPropagation();setExerciseOrder(order=>moveExerciseOrder(order, workoutPlan.exercises, i, 1, exerciseKey));}} style={{background:"none",border:"none",color:text.ghost,padding:"4px 6px",fontSize:13}}>↓</button>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  {Array.from({length:getSetCount(ex)},(_,j)=>{
                    const isDone=setDone(i,j); const bk=logKey(i,j); const logged=sessionLogs[logKey(i,j)];
                    return(
                      <button key={j} onClick={()=>toggleSet(i,j)}
                        style={{width:48,height:48,borderRadius:11,border:`1.5px solid ${isDone?accent:"rgba(255,140,50,.18)"}`,background:isDone?`${accent}22`:surface.bg3,color:isDone?accent:text.muted,fontSize:isDone&&logged?11:14,fontWeight:500,transition:bounceSets[bk]?"none":"all .18s",boxShadow:isDone?`0 0 14px ${accent}5c, inset 0 0 10px ${accent}1e`:"none",animation:bounceSets[bk]?"setBounce .4s ease-out":"none",lineHeight:1.1}}>
                        {isDone?(logged?`${logged.reps}r`:"✓"):j+1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* per-exercise progress */}
              <div style={{marginTop:8}}>
                <Bar value={Array.from({length:getSetCount(ex)},(_,j)=>setDone(i,j)).filter(Boolean).length} max={getSetCount(ex)} color={done?accent:exColor} height={2}/>
              </div>

              {open&&(
                <div style={{marginTop:18,padding:18,background:surface.bg1,borderRadius:18,animation:"slideDown .25s ease-out"}}>
                  {/* REPS / LOAD / SETS tile grid */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,background:"rgba(255,255,255,.06)",borderRadius:10,overflow:"hidden",marginBottom:16}}>
                    {[
                      {lbl:"REPS",val:`${reps}${ex.repSuffix||""}`,sub:"target"},
                      {lbl:"LOAD",val:curW>0?`${curW}`:"BW",sub:curW>0?"lbs":"body"},
                      {lbl:"SETS",val:`${getSetCount(ex)}`,sub:`${effectiveRest}s rest`},
                    ].map((m,mi)=>(
                      <div key={mi} style={{background:surface.bg2,padding:"10px 8px",textAlign:"center"}}>
                        <Caps color={text.muted} size={9}>{m.lbl}</Caps>
                        <Disp size={32} color={text.primary} style={{display:"block",marginTop:4}}>{m.val}</Disp>
                        <div style={{marginTop:2,color:text.tertiary,fontSize:10}}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  <SLabel>Animation</SLabel>
                  <ExerciseAnimation folder={exerciseFolder(ex)} video={ex.video} accent={accent}/>

                  {/* Progress graph */}
                  <Card level={2} style={{marginTop:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <SLabel small>Your Progress</SLabel>
                      {histData.length>=2&&(
                        <span style={{fontSize:12,color:exColor}}>{histData[histData.length-1].totalReps} reps last session</span>
                      )}
                    </div>
                    {histData.length>=2
                      ? <Sparkline fluid data={histData.map(d=>d.totalReps)} w={300} h={60} color={exColor} areaColor={`${exColor}18`} thick area/>
                      : <div style={{fontSize:12,color:text.muted,paddingTop:8}}>Log 2+ sessions to see trend.</div>
                    }
                  </Card>

                  <div style={{marginTop:20}}>
                    <SLabel small>Form cue</SLabel>
                    <div style={{fontSize:15,color:text.secondary,lineHeight:1.6}}>{ex.tip}</div>
                    {ex.substitutedFor&&<div style={{fontSize:12,color:text.faint,marginTop:6}}>Original: {ex.substitutedFor}</div>}
                  </div>

                  <ExerciseGuide guide={guide} accent={accent}/>
                  {!simpleMode&&<CoachWhyPanel lines={why} accent={accent}/>}
                  {!simpleMode&&<PlateauFixPanel fixes={fixes} accent={accent}/>}
                  <SwapLibrary
                    exerciseName={exKey}
                    activeName={substitutions[exKey]?.name}
                    accent={accent}
                    onApply={useSubstitution}
                    onRemove={removeSubstitution}
                  />

                  {!simpleMode&&science.enabled&&(
                    <div style={{marginTop:20}}>
                      <SLabel small>Science coach</SLabel>
                      <div style={{fontSize:14,color:text.secondary,lineHeight:1.6}}>{science.note}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
                        {science.targetRepReason&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>target {science.targetReps} reps</span>}
                        {science.tempo&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>tempo {science.tempo.code}</span>}
                        {science.est1RM&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>est. 1RM {science.est1RM}lbs</span>}
                        {science.percent&&<span style={{fontSize:12,color:status.science,background:"#a78bfa18",borderRadius:999,padding:"4px 10px"}}>{Math.round(science.percent*100)}% target</span>}
                      </div>
                      {science.tempo&&<div style={{fontSize:13,color:text.muted,lineHeight:1.45,marginTop:10}}>{science.tempo.note}</div>}
                      {science.variation&&<div style={{fontSize:13,color:text.muted,lineHeight:1.45,marginTop:8}}>Variation: <span style={{color:status.scienceSoft}}>{science.variation.name}</span>. {science.variation.note}</div>}
                    </div>
                  )}

                  <div style={{marginTop:20}}>
                    <SLabel>Muscles</SLabel>
                    <MuscleDiagram primary={ex.primary} secondary={ex.secondary} accent={accent}/>
                    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:12}}>
                      {ex.primary.map(m=><span key={m} style={{fontSize:13,color:accent,fontWeight:600}}>{MUSCLE_LABELS[m]}</span>)}
                      {ex.secondary.map(m=><span key={m} style={{fontSize:13,color:text.faint}}>{MUSCLE_LABELS[m]}</span>)}
                    </div>
                  </div>

                  {/* Weight config */}
                  <div style={{marginTop:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <SLabel small>Working weight</SLabel>
                      {hasNxtW&&<span style={{fontSize:12,color:accent,fontWeight:500}}>→ Try {nextW}lbs</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",background:surface.bg3,borderRadius:12,overflow:"hidden"}}>
                      <button onClick={()=>setExConfig(p=>({...p,[configKey(ex)]:{...p[configKey(ex)],weight:stepWeight(p[configKey(ex)]?.weight||curW,-1)}}))} style={{width:52,height:52,background:"transparent",border:"none",color:text.secondary,fontSize:24}}>−</button>
                      <input value={curW} onChange={e=>setExConfig(p=>({...p,[configKey(ex)]:{...p[configKey(ex)],weight:Math.max(Number(e.target.value)||0,0)}}))} type="number" inputMode="decimal" min="0" step="any" aria-label={`${ex.name} working weight`}
                        style={{flex:1,minWidth:0,textAlign:"center",fontSize:20,fontWeight:500,color:text.primary,background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono, monospace"}}/>
                      <button onClick={()=>setExConfig(p=>({...p,[configKey(ex)]:{...p[configKey(ex)],weight:stepWeight(p[configKey(ex)]?.weight||curW,1)}}))} style={{width:52,height:52,background:"transparent",border:"none",color:text.secondary,fontSize:24}}>+</button>
                    </div>
                    <div style={{fontSize:11,color:text.muted,lineHeight:1.45,marginTop:8}}>{ownedWeights.length ? `Snapping to your dumbbells: ${ownedWeights.join(", ")} lbs. Type any number to override.` : "Type any number, including 5, 7.5, 12, or 15. The +/- buttons use your progression increment."}</div>
                  </div>

                  {/* Logged sets today */}
                  {Array.from({length:getSetCount(ex)},(_,j)=>sessionLogs[logKey(i,j)]).some(Boolean)&&(
                    <div style={{marginTop:16}}>
                      <SLabel small>Today's strikes</SLabel>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                        {Array.from({length:getSetCount(ex)},(_,j)=>{const lg=sessionLogs[logKey(i,j)];return lg?(
                          <span key={j} style={{fontSize:13,color:accent,fontWeight:500}}>S{j+1} {lg.weight > 0 ? `${lg.weight}lbs` : "bw"} × {lg.reps}</span>
                        ):null;})}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FINISH */}
      <div style={{margin:"28px 16px 0"}}>
        {isCompleted?(
          <div style={{textAlign:"center",padding:"24px 20px",background:`${accent}12`,borderRadius:15,border:`1.5px solid ${accent}55`,boxShadow:`0 0 44px ${accent}1e`,animation:"completePulse 1s ease-out","--glow":`${accent}4d`}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:accent,letterSpacing:".1em"}}>✓ DONE · {completed[sessionKey]}</div>
            <div style={{fontSize:14,color:text.secondary,marginTop:7,lineHeight:1.5}}>Solid work. Rest, eat, sleep. Come back strong.</div>
            {completedSession?.duration&&<div style={{fontSize:13,color:text.tertiary,marginTop:4}}>{fmtDuration(completedSession.duration)}</div>}
          </div>
        ):(
          <button onClick={finishWorkout} disabled={!allDone}
            style={{width:"100%",padding:22,borderRadius:15,fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".12em",border:allDone?"none":`1px solid rgba(255,140,50,.12)`,background:allDone?accent:surface.bg2,color:allDone?"#050505":text.muted,boxShadow:allDone?`0 0 56px ${accent}7a`:"none",transition:"all .2s"}}>
            {allDone?"LEAVE THE FORGE":`${totalSets-doneSets} STRIKES REMAINING`}
          </button>
        )}
      </div>

      {isCompleted && debrief && (
        <div style={{margin:"16px 16px 0",padding:"18px",background:surface.bg2,borderRadius:16}}>
          <div style={{fontSize:12,color:text.faint,fontWeight:600,marginBottom:14}}>Session debrief</div>
          {debrief.map((b,i)=>{
            const col = b.icon==="↑"?accent : b.icon==="↓"?status.warn : b.icon==="~"?status.caution : status.good;
            return (
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<debrief.length-1?10:0}}>
                <span style={{fontSize:12,color:col,fontWeight:700,minWidth:14,lineHeight:1.55}}>{b.icon}</span>
                <span style={{fontSize:13,color:text.secondary,lineHeight:1.55}}>{b.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <ThisWeek completed={completed} setActiveTab={setActiveTab}/>
      <WeeklyMusclePlan completed={completed} accent={accent}/>

      {history.length>0&&(
        <div style={{padding:"0 16px"}}>
          <div style={{fontSize:13,color:text.tertiary,fontWeight:600,marginBottom:12}}>Recent</div>
          {history.slice(0,4).map((h,i)=>(
            <div key={i} style={{padding:"13px 0",borderBottom:"1px solid rgba(255,140,50,.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:12,padding:"4px 10px",borderRadius:6,background:forgeWorkoutColor(h.day,effectiveSchedule)+"22",color:forgeWorkoutColor(h.day,effectiveSchedule),letterSpacing:".06em",fontWeight:500}}>{forgeWorkoutName(h.day, effectiveSchedule)}</span>
                  <span style={{fontSize:15,color:text.primary}}>{h.day}</span>
                  {h.duration&&<span style={{fontSize:12,color:text.tertiary}}>{fmtDuration(h.duration)}</span>}
                </div>
                <span style={{fontSize:13,color:text.secondary}}>{h.date}</span>
              </div>
              {h.note&&<div style={{fontSize:12,color:text.muted,lineHeight:1.4,marginTop:6}}>Note: {h.note}</div>}
            </div>
          ))}
          {history.length>4&&<button onClick={()=>setActiveView("calendar")} style={{background:"none",border:`1px solid rgba(255,140,50,.15)`,borderRadius:9,color:text.secondary,padding:"12px 18px",fontSize:13,letterSpacing:".04em",marginTop:14}}>View all → Calendar</button>}
        </div>
      )}
      <div style={{height:32}}/>

      {/* OVERLAYS */}
      {loggerState&&<SetLogger exerciseName={workoutPlan.exercises[loggerState.exIdx].name} setNum={loggerState.setIdx+1} defaultWeight={loggerState.weight} defaultReps={loggerState.reps} accent={accent} editing={loggerState.editing} increment={settings.weightIncrement || 1} onSave={saveLog} onSkip={skipLog}/>}
      {undoSet&&(
        <div style={{position:"fixed",left:16,right:16,bottom:restState&&!restState.done&&!loggerState&&!focusMode?"calc(166px + env(safe-area-inset-bottom))":"calc(82px + env(safe-area-inset-bottom))",zIndex:260,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:surface.bg1,border:`1.5px solid ${accent}66`,borderRadius:12,padding:"13px 14px",boxShadow:`0 0 28px ${accent}2e`,pointerEvents:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:accent,fontWeight:600}}>Set Logged</div>
                <div style={{fontSize:13,color:text.secondary,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{undoSet.label}</div>
              </div>
              <button onClick={undoLastSet} style={{background:"transparent",border:`1px solid ${accent}77`,color:accent,borderRadius:8,padding:"9px 12px",fontSize:12,letterSpacing:".1em"}}>UNDO</button>
              <button onClick={()=>setUndoSet(null)} style={{background:"transparent",border:"none",color:text.muted,fontSize:18,padding:"4px 2px"}}>×</button>
            </div>
            <SetFeelingButtons onPick={saveSetFeedback}/>
          </div>
        </div>
      )}
      {focusMode&&(
        <FocusWorkoutMode
          workout={workoutPlan} accent={accent} activeTab={activeTab}
          doneSets={doneSets} totalSets={totalSets} setDone={setDone}
          sessionLogs={sessionLogs} logKey={logKey}
          getTargetReps={getTargetReps} getSetCount={getSetCount} getWeight={getWeight}
          getScience={getScience}
          toggleSet={toggleSet} onExit={()=>setFocusMode(false)}
          onFinish={finishWorkout} allDone={allDone} isCompleted={isCompleted}
          substitutions={coachPlan.substitutions || []}
          onApplySubstitution={useSubstitution}
          onRemoveSubstitution={removeSubstitution}
          getPreviousPerformance={getPreviousPerformance}
          beginnerFormMode={settings.beginnerFormMode === true}
          estimatedRemaining={estimatedRemaining}
          playSound={playSound}
        />
      )}
      {workoutSummary&&<WorkoutSummary summary={workoutSummary} accent={accent} onClose={()=>{setWorkoutSummary(null);setShowFeedback(true);}}/>}
      {restState?.done&&focusMode&&<RestReady label={restState.label} accent={restState.accent} onNext={()=>setRestState(null)}/>}
      {restState&&!restState.done&&!loggerState&&<RestTimer fullscreen={focusMode&&settings.fullscreenRest!==false} seconds={effectiveRest} label={restState.label} accent={restState.accent}
        onSkip={()=>{
          logCoachEvent({kind:"rest",action:"skip",restId:restState.restId,plannedSeconds:restState.plannedSeconds||effectiveRest,elapsedSeconds:Math.round((Date.now()-(restState.startedAt||Date.now()))/1000)});
          setRestState(null);
        }}
        onComplete={()=>{
          logCoachEvent({kind:"rest",action:"complete",restId:restState.restId,plannedSeconds:restState.plannedSeconds||effectiveRest,elapsedSeconds:restState.plannedSeconds||effectiveRest});
          playSound("restEnd");vibrate([200,60,200]);focusMode?setRestState(p=>p?{...p,done:true}:null):setRestState(null);
        }}/>}
      {showFeedback&&<PostWorkoutFeedback exercises={workoutPlan.exercises} sessionLogs={sessionLogs} getLogKey={logKey} exConfig={exConfig} history={history} onComplete={handleFeedback} accent={accent}/>}
      {!simpleMode&&coachAlerts.length > 0 && (
        <div style={{position:"fixed",bottom:"calc(88px + env(safe-area-inset-bottom))",left:16,right:16,zIndex:270,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:surface.bg1,border:`1px solid ${accent}55`,borderRadius:12,padding:"11px 14px",boxShadow:`0 0 24px ${accent}1e`,animation:"slideDown .2s ease-out"}}>
            <div style={{fontSize:10,color:accent,fontWeight:600,marginBottom:4}}>Smith</div>
            <div style={{fontSize:13,color:text.secondary,lineHeight:1.45}}>{coachAlerts[coachAlerts.length-1].msg}</div>
          </div>
        </div>
      )}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <Confetti active={confetti} accent={accent} onDone={()=>setConfetti(false)}/>
      {!simpleMode&&<CoachFab onClick={()=>setCoachOpen(true)} accent={accent}/>}
      {!simpleMode&&<CoachDrawer open={coachOpen} onClose={()=>setCoachOpen(false)} memory={coachMemory} plan={coachPlan} accent={accent}
        exercises={workout.exercises} history={history} checkIns={checkIns} exConfig={exConfig}
        userProfile={userProfile} goals={goals} bodyMetrics={bodyMetrics}/>}
    </div>
  );
}


function moveExerciseOrder(order, exercises, index, delta, keyFn) {
  const keys = order.length ? [...order] : exercises.map(keyFn);
  const target = index + delta;
  if (target < 0 || target >= exercises.length) return keys;
  const currentKey = keyFn(exercises[index]);
  const targetKey = keyFn(exercises[target]);
  const currentIdx = keys.indexOf(currentKey);
  const targetIdx = keys.indexOf(targetKey);
  if (currentIdx < 0 || targetIdx < 0) return exercises.map(keyFn);
  [keys[currentIdx], keys[targetIdx]] = [keys[targetIdx], keys[currentIdx]];
  return keys;
}

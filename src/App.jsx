import { useState, useEffect, lazy, Suspense, startTransition } from "react";
import { WORKOUTS, SCHEDULE, DEFAULT_SETTINGS, DEFAULT_WEIGHTS, ACHIEVEMENTS, computeStats, todayName, DAYS, getLevel, DEFAULT_CUSTOM_ROUTINE, DEFAULT_GOALS, IMG_BASE, normalizeCustomRoutine, customRoutineWorkout, DEFAULT_USER_PROFILE, normalizeUserProfile, assessmentTargetForProfile } from "./data.js";
import { useLocalStorage } from "./hooks.js";
import { makePlay, vibrate as vib } from "./audio.js";
import { BottomNav, Toast } from "./components/shared.jsx";
// View chunks load on demand so the startup shell stays small.
const loadWorkout = () => import("./views/WorkoutView.jsx");
const loadStats    = () => import("./views/StatsView.jsx");
const loadMuscles  = () => import("./views/MuscleMapView.jsx");
const loadCalendar = () => import("./views/CalendarView.jsx");
const loadSettings = () => import("./views/SettingsView.jsx");
const loadRoutine  = () => import("./views/RoutineView.jsx");
const loadGoals    = () => import("./views/GoalsView.jsx");
const loadProfile  = () => import("./views/ProfileView.jsx");
const WorkoutView  = lazy(loadWorkout);
const StatsView    = lazy(loadStats);
const MuscleMapView = lazy(loadMuscles);
const CalendarView = lazy(loadCalendar);
const SettingsView = lazy(loadSettings);
const RoutineView  = lazy(loadRoutine);
const GoalsView    = lazy(loadGoals);
const ProfileView  = lazy(loadProfile);
import { normalizeLiftLogData } from "./session.js";
import OnboardingView from "./views/OnboardingView.jsx";
import { nukeAndReload } from "./nuke.js";

export default function App() {
  const [activeView,      setActiveView]      = useState("workout");
  const [settingsSection, setSettingsSection] = useState(null);
  // Navigate via transition so lazy view chunks suspend without crashing on sync input
  const navigate = (v) => startTransition(() => setActiveView(v));

  // Core workout state
  const [sets,        setSets]        = useLocalStorage("wt_sets",        {});
  const [history,     setHistory]     = useLocalStorage("wt_history",     []);
  const [completed,   setCompleted]   = useLocalStorage("wt_completed",   {});
  const [progression, setProgression] = useLocalStorage("wt_progression", {});
  const [settings,    setSettings]    = useLocalStorage("wt_settings",    DEFAULT_SETTINGS);
  const [achievements,setAchievements]= useLocalStorage("wt_achievements",[]);

  // New: per-exercise weight config  { "Goblet Squat": { weight: 15 } }
  const [exConfig,    setExConfig]    = useLocalStorage("wt_ex_config",   {});
  // New: XP and check-ins
  const [xp,          setXp]          = useLocalStorage("wt_xp",          0);
  const [checkIns,    setCheckIns]    = useLocalStorage("wt_checkins",    []);
  const [bodyMetrics, setBodyMetrics] = useLocalStorage("wt_body_metrics", []);
  const [customRoutine, setCustomRoutine] = useLocalStorage("wt_custom_routine", DEFAULT_CUSTOM_ROUTINE);
  const [userProfile, setUserProfile] = useLocalStorage("wt_user_profile", DEFAULT_USER_PROFILE);
  const [goals,       setGoals]       = useLocalStorage("wt_goals",        DEFAULT_GOALS);

  const [achievementToast, setAchievementToast] = useState(null);
  const [assessmentDone, setAssessmentDone] = useLocalStorage("wt_assessment_done", false);
  const [updateReady, setUpdateReady] = useState(null);
  const [storageWarning, setStorageWarning] = useState(null);
  const [benchmarkEditorOpen, setBenchmarkEditorOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = useLocalStorage("wt_install_dismissed", false);

  const normalized = normalizeLiftLogData({ sets, history, completed, progression, settings, achievements, exConfig, xp, checkIns, bodyMetrics, assessmentDone, customRoutine, userProfile });
  const safeSettings = { ...DEFAULT_SETTINGS, ...normalized.settings };
  const safeCustomRoutine = normalizeCustomRoutine(normalized.customRoutine || customRoutine);
  const safeUserProfile = normalizeUserProfile(normalized.userProfile || userProfile);

  const playSound = makePlay(safeSettings);
  const vibrate   = (p) => vib(safeSettings, p);

  // Migrate settings — merge in any missing defaults on first mount.
  useEffect(() => {
    const merged = { ...DEFAULT_SETTINGS, ...normalized.settings };
    const keys = new Set([...Object.keys(merged), ...Object.keys(settings || {})]);
    for (const k of keys) {
      if (merged[k] !== (settings || {})[k]) { setSettings(merged); break; }
    }
  }, []); // eslint-disable-line

  // Normalize older or malformed localStorage data.
  useEffect(() => {
    const data = normalized;
    if (data.sets !== sets) setSets(data.sets);
    if (data.history !== history) setHistory(data.history);
    if (data.completed !== completed) setCompleted(data.completed);
    if (data.progression !== progression) setProgression(data.progression);
    if (data.settings !== settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    if (data.achievements !== achievements) setAchievements(data.achievements);
    if (data.exConfig !== exConfig) setExConfig(data.exConfig);
    if (data.xp !== xp) setXp(data.xp);
    if (data.checkIns !== checkIns) setCheckIns(data.checkIns);
    if (data.bodyMetrics !== bodyMetrics) setBodyMetrics(data.bodyMetrics);
    if (data.assessmentDone !== assessmentDone) setAssessmentDone(data.assessmentDone);
    if (data.customRoutine && data.customRoutine !== customRoutine) setCustomRoutine(normalizeCustomRoutine(data.customRoutine));
    if (data.userProfile && data.userProfile !== userProfile) setUserProfile(normalizeUserProfile(data.userProfile));
  }, []); // eslint-disable-line

  // Seed exercise weights if not set. Uses core library only — extended-only
  // custom exercises are not in scope here and will get default weights on
  // first use (exConfig falls back to safeSettings.dumbbellWeight for unknown keys).
  useEffect(() => {
    const seed = {};
    let changed = false;
    const allEx = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises, ...customRoutineWorkout(safeCustomRoutine).exercises];
    allEx.forEach(ex => {
      if (!normalized.exConfig[ex.name]) { seed[ex.name] = { weight: DEFAULT_WEIGHTS[ex.name] ?? safeSettings.dumbbellWeight }; changed = true; }
    });
    if (changed) setExConfig(p => ({ ...p, ...seed }));
  }, []); // eslint-disable-line

  // Achievement check
  useEffect(() => {
    const stats = computeStats({ history: normalized.history, progression: normalized.progression, settings: safeSettings });
    const fresh = ACHIEVEMENTS.filter(a => !normalized.achievements.includes(a.id) && a.check(stats));
    if (!fresh.length) return;
    setAchievements(p => [...p, ...fresh.map(a => a.id)]);
    const first = fresh[0];
    setTimeout(() => {
      playSound("achievement");
      vibrate([60,40,60,40,120]);
      setAchievementToast({ icon:first.icon, title:"ACHIEVEMENT UNLOCKED", msg:`${first.name} — ${first.desc}`, accent:"#fbbf24" });
    }, 1600);
  }, [history, progression]); // eslint-disable-line

  useEffect(() => {
    const onUpdate = (event) => setUpdateReady(event.detail?.registration || null);
    window.addEventListener("lift-log-update", onUpdate);
    return () => window.removeEventListener("lift-log-update", onUpdate);
  }, []);

  useEffect(() => {
    const onStorageError = (event) => {
      const key = event.detail?.key ? ` (${event.detail.key})` : "";
      setStorageWarning({ icon:"alert", title:"SAVE WARNING", msg:`This device could not save local data${key}. Export a backup before closing.`, accent:"#fbbf24" });
    };
    window.addEventListener("lift-log-storage-error", onStorageError);
    return () => window.removeEventListener("lift-log-storage-error", onStorageError);
  }, []);

  // Warm likely next tabs later, after startup settles.
  useEffect(() => {
    if (!safeSettings.onboardingDone) return undefined;
    const warm = () => { loadRoutine(); loadStats(); loadSettings(); };
    const ric = window.requestIdleCallback;
    if (ric) { const id = ric(warm, { timeout: 5000 }); return () => window.cancelIdleCallback?.(id); }
    const t = setTimeout(warm, 3500);
    return () => clearTimeout(t);
  }, [safeSettings.onboardingDone]);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setInstallDismissed(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []); // eslint-disable-line

  const addXp = (amount) => setXp(p => Math.max(0, p + amount));

  const currentData = () => ({
    sets: normalized.sets,
    history: normalized.history,
    completed: normalized.completed,
    progression: normalized.progression,
    settings: safeSettings,
    achievements: normalized.achievements,
    exConfig: normalized.exConfig,
    xp: normalized.xp,
    checkIns: normalized.checkIns,
    bodyMetrics: normalized.bodyMetrics,
    assessmentDone: normalized.assessmentDone,
    customRoutine: safeCustomRoutine,
    userProfile: safeUserProfile,
  });

  const createBackupSnapshot = (reason = "manual") => {
    try {
      const backup = {
        ...currentData(),
        backupReason: reason,
        backedUpAt: new Date().toISOString(),
      };
      localStorage.setItem("wt_last_backup", JSON.stringify(backup));
      return true;
    } catch (err) {
      console.warn("createBackupSnapshot failed", err);
      return false;
    }
  };

  const resetAllData = () => {
    // Full nuke: localStorage, sessionStorage, IndexedDB, Cache API, service workers.
    createBackupSnapshot("before_full_reset");
    nukeAndReload({ preserveLocalStorageKeys:["wt_last_backup"] });
  };

  const repairSavedData = () => {
    createBackupSnapshot("before_repair_saved_data");
    const data = normalizeLiftLogData({ sets, history, completed, progression, settings, achievements, exConfig, xp, checkIns, bodyMetrics, assessmentDone, customRoutine:safeCustomRoutine, userProfile:safeUserProfile });
    setSets(data.sets);
    setHistory(data.history);
    setCompleted(data.completed);
    setProgression(data.progression);
    setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    setAchievements(data.achievements);
    setExConfig(data.exConfig);
    setXp(data.xp);
    setCheckIns(data.checkIns);
    setBodyMetrics(data.bodyMetrics);
    setAssessmentDone(data.assessmentDone);
    if (data.customRoutine) setCustomRoutine(normalizeCustomRoutine(data.customRoutine));
    if (data.userProfile) setUserProfile(normalizeUserProfile(data.userProfile));
    return true;
  };

  const clearWorkoutState = () => {
    createBackupSnapshot("before_clear_workout_state");
    setSets({});
    setCompleted({});
  };

  const editBenchmarkTest = () => {
    createBackupSnapshot("before_benchmark_edit");
    setBenchmarkEditorOpen(true);
    setActiveView("workout");
  };

  const refreshAppCache = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.update()));
      }
      window.location.reload();
      return true;
    } catch (err) {
      console.warn("refreshAppCache failed", err);
      return false;
    }
  };

  const exportData = () => {
    const data = { ...currentData(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `forged-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = async (file) => {
    try {
      const raw = await file.text();
      const data = normalizeLiftLogData(JSON.parse(raw));
      createBackupSnapshot("before_import");
      setSets(data.sets);
      setHistory(data.history);
      setCompleted(data.completed);
      setProgression(data.progression);
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
      setAchievements(data.achievements);
      setExConfig(data.exConfig);
      setXp(data.xp);
      setCheckIns(data.checkIns);
      setBodyMetrics(data.bodyMetrics);
      setAssessmentDone(data.assessmentDone);
      if (data.customRoutine) setCustomRoutine(normalizeCustomRoutine(data.customRoutine));
      if (data.userProfile) setUserProfile(normalizeUserProfile(data.userProfile));
      return true;
    } catch (err) {
      console.warn("importData failed", err);
      return false;
    }
  };

  const exportLastBackup = () => {
    try {
      const raw = localStorage.getItem("wt_last_backup");
      if (!raw) return false;
      const backup = JSON.parse(raw);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type:"application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = backup.backedUpAt?.slice(0,10) || new Date().toISOString().slice(0,10);
      a.href = url; a.download = `forged-backup-${date}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.warn("exportLastBackup failed", err);
      return false;
    }
  };

  const applyUpdate = () => {
    const waiting = updateReady?.waiting;
    if (waiting) waiting.postMessage({ type:"SKIP_WAITING" });
    else window.location.reload();
  };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch {}
    setInstallPrompt(null);
    setInstallDismissed(true);
  };

  const day  = todayName();
  const scheduledDay = DAYS.includes(day) ? day : null;
  const scheduledKey = scheduledDay ? SCHEDULE[scheduledDay] : "A";
  const accent = WORKOUTS[scheduledKey].color;
  const level  = getLevel(normalized.xp);
  const visualTheme = safeSettings.visualTheme || "dark";
  const lightMode = visualTheme === "pop_light";
  const appBackground = lightMode
    ? `radial-gradient(circle at 18% 0%, ${accent}30 0%, transparent 28%), linear-gradient(180deg,#f8fffb 0%,#eef7ff 52%,#ffffff 100%)`
    : `radial-gradient(ellipse 110% 55% at 50% -5%, ${accent}28 0%, transparent 65%), radial-gradient(ellipse 60% 20% at 50% 105%, rgba(221,101,24,.08) 0%, transparent 70%), linear-gradient(180deg, #100d09 0%, #030201 100%)`;
  // Image preload uses core-only lookup; extended-only exercises skip this early
  // preload and load normally once WorkoutView resolves the full DB.
  const preloadWorkout = safeCustomRoutine.enabled ? customRoutineWorkout(safeCustomRoutine, scheduledDay) : WORKOUTS[scheduledKey];
  const preloadFolders = [...new Set((preloadWorkout?.exercises || []).map(ex => ex.folder).filter(Boolean))].slice(0, 2).join("|");

  useEffect(() => {
    if (!safeSettings.onboardingDone || !preloadFolders || typeof Image === "undefined") return;
    const images = [];
    preloadFolders.split("|").forEach(folder => {
      [0, 1].forEach(frame => {
        const img = new Image();
        img.decoding = "async";
        img.src = `${IMG_BASE}/${folder}/${frame}.jpg`;
        images.push(img);
      });
    });
    return () => images.forEach(img => { img.onload = null; img.onerror = null; });
  }, [safeSettings.onboardingDone, preloadFolders]);

  // Onboarding gate
  if (!safeSettings.onboardingDone) {
    return (
      <OnboardingView
        accent={accent}
        onComplete={({ profile, workoutDays, selfTest, settingsOverrides }) => {
          const safeProfile = { ...safeUserProfile, ...profile };
          const allBaseExercises = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];
          const startingConfig = {};
          allBaseExercises.forEach(ex => {
            const muscles = [...(ex.primary || []), ...(ex.secondary || [])];
            const mappedMax = muscles.some(m => ["chest", "triceps", "frontDelts"].includes(m))
              ? selfTest?.pushups
              : muscles.some(m => ["quads", "glutes", "hamstrings", "calves"].includes(m))
                ? selfTest?.squats
                : muscles.includes("core")
                  ? Math.max(3, Math.round((selfTest?.plank || 30) / 5))
                  : null;
            const target = mappedMax ? assessmentTargetForProfile(mappedMax, safeProfile) : ex.baseReps;
            startingConfig[ex.name] = {
              ...(exConfig[ex.name] || {}),
              maxRepsTest:mappedMax || null,
              targetReps:target,
              weight:exConfig[ex.name]?.weight ?? DEFAULT_WEIGHTS[ex.name] ?? safeSettings.dumbbellWeight,
            };
          });
          setUserProfile(prev => ({ ...prev, ...profile }));
          setExConfig(prev => ({ ...prev, ...startingConfig }));
          setAssessmentDone(true);
          setSettings(prev => ({ ...prev, ...(settingsOverrides || {}), onboardingDone: true, workoutDays: workoutDays || prev.workoutDays }));
        }}
      />
    );
  }

  return (
    <>
    <div className={`theme-root theme-${visualTheme}`} style={{
      minHeight:"100vh",
      background:appBackground,
      color:lightMode ? "#172033" : "#f0f0f0",
      paddingBottom:"calc(82px + env(safe-area-inset-bottom))",
    }}>
      <div className="app-shell">
        <Suspense fallback={<div style={{padding:"60px 20px",textAlign:"center",color:"#928574",fontSize:13}}>Loading...</div>}>
          {activeView === "workout" && (
            <WorkoutView
              sets={normalized.sets} setSets={setSets}
              history={normalized.history} setHistory={setHistory}
              completed={normalized.completed} setCompleted={setCompleted}
              progression={normalized.progression} setProgression={setProgression}
              settings={safeSettings}
              setSettings={setSettings}
              exConfig={normalized.exConfig} setExConfig={setExConfig}
              xp={normalized.xp} addXp={addXp} level={level}
              checkIns={normalized.checkIns} setCheckIns={setCheckIns}
              assessmentDone={normalized.assessmentDone} setAssessmentDone={setAssessmentDone}
              benchmarkEditorOpen={benchmarkEditorOpen} setBenchmarkEditorOpen={setBenchmarkEditorOpen}
              customRoutine={safeCustomRoutine}
              userProfile={safeUserProfile}
              goals={Array.isArray(goals) ? goals : DEFAULT_GOALS}
              bodyMetrics={normalized.bodyMetrics}
              playSound={playSound} vibrate={vibrate}
              setActiveView={navigate}
              theme={visualTheme}
            />
          )}
          {activeView !== "workout" && (
            <>
            {activeView === "routine" && (
              <RoutineView customRoutine={safeCustomRoutine} setCustomRoutine={setCustomRoutine} userProfile={safeUserProfile} setUserProfile={setUserProfile} history={normalized.history} accent={accent} setActiveView={navigate} checkIns={normalized.checkIns} settings={safeSettings} goals={Array.isArray(goals) ? goals : DEFAULT_GOALS} exConfig={normalized.exConfig} />
            )}
            {activeView === "stats" && (
              <StatsView history={normalized.history} progression={normalized.progression} settings={safeSettings}
                achievements={normalized.achievements} accent={accent} xp={normalized.xp} level={level}
                exConfig={normalized.exConfig} checkIns={normalized.checkIns}
                bodyMetrics={normalized.bodyMetrics} setBodyMetrics={setBodyMetrics} customRoutine={safeCustomRoutine}
                userProfile={safeUserProfile} goals={Array.isArray(goals) ? goals : DEFAULT_GOALS} />
            )}
            {activeView === "muscles" && (
              <MuscleMapView history={normalized.history} accent={accent} checkIns={normalized.checkIns} setCheckIns={setCheckIns} customRoutine={safeCustomRoutine} />
            )}
            {activeView === "calendar" && (
              <CalendarView history={normalized.history} progression={normalized.progression} settings={safeSettings} accent={accent} theme={visualTheme} />
            )}
            {activeView === "goals" && (
              <GoalsView
                goals={Array.isArray(goals) ? goals : DEFAULT_GOALS}
                setGoals={setGoals}
                history={normalized.history}
                exConfig={normalized.exConfig}
                checkIns={normalized.checkIns}
                accent={accent}
                totalSessions={normalized.history?.length || 0}
              />
            )}
            {activeView === "profile" && (
              <ProfileView
                userProfile={safeUserProfile}
                settings={safeSettings}
                history={normalized.history}
                achievements={normalized.achievements}
                goals={Array.isArray(goals) ? goals : DEFAULT_GOALS}
                setGoals={setGoals}
                exConfig={normalized.exConfig}
                accent={accent}
                theme={visualTheme}
                level={level}
                onSettings={(section) => { setSettingsSection(section || null); navigate("settings"); }}
              />
            )}
            {activeView === "settings" && (
              <SettingsView settings={safeSettings} setSettings={setSettings}
                userProfile={safeUserProfile} setUserProfile={setUserProfile}
                resetAllData={resetAllData} exportData={exportData} importData={importData}
                repairSavedData={repairSavedData} clearWorkoutState={clearWorkoutState}
                refreshAppCache={refreshAppCache} exportLastBackup={exportLastBackup}
                createBackupSnapshot={createBackupSnapshot} editBenchmarkTest={editBenchmarkTest}
                accent={accent} theme={visualTheme} initialSection={settingsSection} />
            )}
            </>
          )}
        </Suspense>
      </div>

      <BottomNav active={activeView} onSelect={navigate} accent={accent} level={level} theme={visualTheme} />

      {achievementToast && (
        <Toast icon={achievementToast.icon} title={achievementToast.title}
          msg={achievementToast.msg} accent={achievementToast.accent}
          onClose={() => setAchievementToast(null)} duration={5000} />
      )}

      {storageWarning && (
        <Toast icon={storageWarning.icon} title={storageWarning.title}
          msg={storageWarning.msg} accent={storageWarning.accent}
          onClose={() => setStorageWarning(null)} duration={7000} />
      )}

      {installPrompt && !installDismissed && (
        <div style={{position:"fixed",left:16,right:16,bottom:"calc(92px + env(safe-area-inset-bottom))",zIndex:255,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:lightMode?"#ffffff":"#101010",border:`1.5px solid ${accent}55`,borderRadius:13,padding:"14px 15px",boxShadow:`0 16px 38px ${accent}20`,pointerEvents:"auto",display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:700}}>Install Gym Forged</div>
              <div style={{fontSize:13,color:lightMode?"#435166":"#ddd",marginTop:3,lineHeight:1.35}}>Add it to your phone for fullscreen, app-like workouts.</div>
            </div>
            <button onClick={installApp} style={{background:accent,border:"none",borderRadius:9,color:"#050505",padding:"10px 12px",fontSize:12,letterSpacing:".08em",fontWeight:700}}>INSTALL</button>
            <button onClick={()=>setInstallDismissed(true)} style={{background:"transparent",border:"none",color:lightMode?"#8a97a8":"#666",fontSize:18,padding:"4px"}}>×</button>
          </div>
        </div>
      )}

      {updateReady && (
        <div style={{position:"fixed",left:16,right:16,bottom:"calc(92px + env(safe-area-inset-bottom))",zIndex:260,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:"#101010",border:`1.5px solid ${accent}66`,borderRadius:13,padding:"14px 15px",boxShadow:`0 0 30px ${accent}2e`,pointerEvents:"auto",display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:500}}>Update Ready</div>
              <div style={{fontSize:13,color:"#ddd",marginTop:3,lineHeight:1.35}}>Refresh to load the newest Gym Forged build.</div>
            </div>
            <button onClick={applyUpdate} style={{background:accent,border:"none",borderRadius:9,color:"#050505",padding:"10px 12px",fontSize:12,letterSpacing:".08em",fontWeight:700}}>REFRESH</button>
            <button onClick={()=>setUpdateReady(null)} style={{background:"transparent",border:"none",color:"#666",fontSize:18,padding:"4px"}}>×</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}


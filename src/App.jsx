import { useState, useEffect } from "react";
import { WORKOUTS, SCHEDULE, DEFAULT_SETTINGS, DEFAULT_WEIGHTS, ACHIEVEMENTS, computeStats, todayName, DAYS, getLevel, XP_VALUES } from "./data.js";
import { useLocalStorage } from "./hooks.js";
import { makePlay, vibrate as vib } from "./audio.js";
import { BottomNav, Toast } from "./components/shared.jsx";
import WorkoutView  from "./views/WorkoutView.jsx";
import StatsView    from "./views/StatsView.jsx";
import MuscleMapView from "./views/MuscleMapView.jsx";
import CalendarView from "./views/CalendarView.jsx";
import SettingsView from "./views/SettingsView.jsx";
import { normalizeLiftLogData } from "./session.js";

export default function App() {
  const [activeView, setActiveView] = useState("workout");

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

  const [achievementToast, setAchievementToast] = useState(null);
  const [assessmentDone, setAssessmentDone] = useLocalStorage("wt_assessment_done", false);
  const [updateReady, setUpdateReady] = useState(null);
  const [benchmarkEditorOpen, setBenchmarkEditorOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = useLocalStorage("wt_install_dismissed", false);

  const normalized = normalizeLiftLogData({ sets, history, completed, progression, settings, achievements, exConfig, xp, checkIns, bodyMetrics, assessmentDone });
  const safeSettings = { ...DEFAULT_SETTINGS, ...normalized.settings };

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
  }, []); // eslint-disable-line

  // Seed exercise weights if not set
  useEffect(() => {
    const seed = {};
    let changed = false;
    const allEx = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];
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
    createBackupSnapshot("before_reset");
    setSets({}); setHistory([]); setCompleted({}); setProgression({});
    setAchievements([]); setXp(0); setCheckIns([]); setBodyMetrics([]); setExConfig({}); setAssessmentDone(false);
  };

  const repairSavedData = () => {
    const data = normalizeLiftLogData({ sets, history, completed, progression, settings, achievements, exConfig, xp, checkIns, bodyMetrics, assessmentDone });
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
    a.href = url; a.download = `lift-log-${new Date().toISOString().slice(0,10)}.json`;
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
      a.href = url; a.download = `lift-log-backup-${date}.json`;
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
  const accent = WORKOUTS[DAYS.includes(day) ? SCHEDULE[day] : "A"].color;
  const level  = getLevel(normalized.xp);
  const visualTheme = safeSettings.visualTheme || "pop_light";
  const lightMode = visualTheme === "pop_light";
  const appBackground = lightMode
    ? `radial-gradient(circle at 18% 0%, ${accent}30 0%, transparent 28%), linear-gradient(180deg,#f8fffb 0%,#eef7ff 52%,#ffffff 100%)`
    : `radial-gradient(ellipse at top, ${accent}0d 0%, #050505 55%, #000 100%)`;

  return (
    <div className={`theme-root theme-${visualTheme}`} style={{
      minHeight:"100vh",
      background:appBackground,
      color:lightMode ? "#172033" : "#f0f0f0",
      paddingBottom:"calc(82px + env(safe-area-inset-bottom))",
    }}>
      <div className="app-shell">
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
            playSound={playSound} vibrate={vibrate}
            setActiveView={setActiveView}
            theme={visualTheme}
          />
        )}
        {activeView === "stats" && (
          <StatsView history={normalized.history} progression={normalized.progression} settings={safeSettings}
            achievements={normalized.achievements} accent={accent} xp={normalized.xp} level={level}
            exConfig={normalized.exConfig} checkIns={normalized.checkIns}
            bodyMetrics={normalized.bodyMetrics} setBodyMetrics={setBodyMetrics} />
        )}
        {activeView === "muscles" && (
          <MuscleMapView history={normalized.history} accent={accent} checkIns={normalized.checkIns} setCheckIns={setCheckIns} />
        )}
        {activeView === "calendar" && (
          <CalendarView history={normalized.history} progression={normalized.progression} settings={safeSettings} accent={accent} theme={visualTheme} />
        )}
        {activeView === "settings" && (
          <SettingsView settings={safeSettings} setSettings={setSettings}
            resetAllData={resetAllData} exportData={exportData} importData={importData}
            repairSavedData={repairSavedData} clearWorkoutState={clearWorkoutState}
            refreshAppCache={refreshAppCache} exportLastBackup={exportLastBackup}
            createBackupSnapshot={createBackupSnapshot} editBenchmarkTest={editBenchmarkTest}
            accent={accent} theme={visualTheme} />
        )}
      </div>

      <BottomNav active={activeView} onSelect={setActiveView} accent={accent} level={level} theme={visualTheme} />

      {achievementToast && (
        <Toast icon={achievementToast.icon} title={achievementToast.title}
          msg={achievementToast.msg} accent={achievementToast.accent}
          onClose={() => setAchievementToast(null)} duration={5000} />
      )}

      {installPrompt && !installDismissed && (
        <div style={{position:"fixed",left:16,right:16,bottom:"calc(92px + env(safe-area-inset-bottom))",zIndex:255,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:lightMode?"#ffffff":"#101010",border:`1.5px solid ${accent}55`,borderRadius:13,padding:"14px 15px",boxShadow:`0 16px 38px ${accent}24`,pointerEvents:"auto",display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:700}}>Install Lift Log</div>
              <div style={{fontSize:13,color:lightMode?"#435166":"#ddd",marginTop:3,lineHeight:1.35}}>Add it to your phone for fullscreen, app-like workouts.</div>
            </div>
            <button onClick={installApp} style={{background:accent,border:"none",borderRadius:9,color:"#050505",padding:"10px 12px",fontSize:12,letterSpacing:".08em",fontWeight:700}}>INSTALL</button>
            <button onClick={()=>setInstallDismissed(true)} style={{background:"transparent",border:"none",color:lightMode?"#8a97a8":"#666",fontSize:18,padding:"4px"}}>×</button>
          </div>
        </div>
      )}

      {updateReady && (
        <div style={{position:"fixed",left:16,right:16,bottom:"calc(92px + env(safe-area-inset-bottom))",zIndex:260,pointerEvents:"none"}}>
          <div className="mobile-shell" style={{background:"#101010",border:`1.5px solid ${accent}66`,borderRadius:13,padding:"14px 15px",boxShadow:`0 0 30px ${accent}33`,pointerEvents:"auto",display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:accent,letterSpacing:".14em",textTransform:"uppercase",fontWeight:500}}>Update Ready</div>
              <div style={{fontSize:13,color:"#ddd",marginTop:3,lineHeight:1.35}}>Refresh to load the newest Lift Log build.</div>
            </div>
            <button onClick={applyUpdate} style={{background:accent,border:"none",borderRadius:9,color:"#050505",padding:"10px 12px",fontSize:12,letterSpacing:".08em",fontWeight:700}}>REFRESH</button>
            <button onClick={()=>setUpdateReady(null)} style={{background:"transparent",border:"none",color:"#666",fontSize:18,padding:"4px"}}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

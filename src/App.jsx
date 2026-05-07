import { useState, useEffect } from "react";
import { WORKOUTS, SCHEDULE, DEFAULT_SETTINGS, DEFAULT_WEIGHTS, ACHIEVEMENTS, computeStats, todayName, DAYS, getLevel, XP_VALUES } from "./data.js";
import { useLocalStorage } from "./hooks.js";
import { makePlay, vibrate as vib } from "./audio.js";
import { BottomNav, Toast } from "./components/shared.jsx";
import WorkoutView  from "./views/WorkoutView.jsx";
import StatsView    from "./views/StatsView.jsx";
import CalendarView from "./views/CalendarView.jsx";
import SettingsView from "./views/SettingsView.jsx";

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

  const [assessmentDone, setAssessmentDone] = useLocalStorage("wt_assessment_done", false);

  const playSound = makePlay(settings);
  const vibrate   = (p) => vib(settings, p);

  // Migrate settings
  useEffect(() => {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    if (Object.keys(merged).length !== Object.keys(settings).length) setSettings(merged);
  }, []); // eslint-disable-line

  // Seed exercise weights if not set
  useEffect(() => {
    const seed = {};
    let changed = false;
    const allEx = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];
    allEx.forEach(ex => {
      if (!exConfig[ex.name]) { seed[ex.name] = { weight: DEFAULT_WEIGHTS[ex.name] || settings.dumbbellWeight }; changed = true; }
    });
    if (changed) setExConfig(p => ({ ...p, ...seed }));
  }, []); // eslint-disable-line

  // Achievement check
  useEffect(() => {
    const stats = computeStats({ history, progression, settings });
    const fresh = ACHIEVEMENTS.filter(a => !achievements.includes(a.id) && a.check(stats));
    if (!fresh.length) return;
    setAchievements(p => [...p, ...fresh.map(a => a.id)]);
    const first = fresh[0];
    setTimeout(() => {
      playSound("achievement");
      vibrate([60,40,60,40,120]);
      setAchievementToast({ icon:first.icon, title:"ACHIEVEMENT UNLOCKED", msg:`${first.name} — ${first.desc}`, accent:"#fbbf24" });
    }, 1600);
  }, [history, progression]); // eslint-disable-line

  const addXp = (amount) => setXp(p => p + amount);

  const resetAllData = () => {
    setSets({}); setHistory([]); setCompleted({}); setProgression({});
    setAchievements([]); setXp(0); setCheckIns({}); setExConfig({});
  };

  const exportData = () => {
    const data = { sets, history, completed, progression, settings, achievements, exConfig, xp, checkIns, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `lift-log-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const day  = todayName();
  const accent = WORKOUTS[DAYS.includes(day) ? SCHEDULE[day] : "A"].color;
  const level  = getLevel(xp);

  return (
    <div style={{
      minHeight:"100vh",
      background:`radial-gradient(ellipse at top, ${accent}0d 0%, #050505 55%, #000 100%)`,
      paddingBottom:"calc(82px + env(safe-area-inset-bottom))",
    }}>
      <div style={{ maxWidth:520, margin:"0 auto" }}>
        {activeView === "workout" && (
          <WorkoutView
            sets={sets} setSets={setSets}
            history={history} setHistory={setHistory}
            completed={completed} setCompleted={setCompleted}
            progression={progression} setProgression={setProgression}
            settings={settings}
            exConfig={exConfig} setExConfig={setExConfig}
            xp={xp} addXp={addXp} level={level}
            checkIns={checkIns} setCheckIns={setCheckIns}
            assessmentDone={assessmentDone} setAssessmentDone={setAssessmentDone}
            setActiveView={setActiveView}
          />
        )}
        {activeView === "stats" && (
          <StatsView history={history} progression={progression} settings={settings}
            achievements={achievements} accent={accent} xp={xp} level={level}
            exConfig={exConfig} checkIns={checkIns} />
        )}
        {activeView === "calendar" && (
          <CalendarView history={history} progression={progression} settings={settings} accent={accent} />
        )}
        {activeView === "settings" && (
          <SettingsView settings={settings} setSettings={setSettings}
            resetAllData={resetAllData} exportData={exportData} accent={accent} />
        )}
      </div>

      <BottomNav active={activeView} onSelect={setActiveView} accent={accent} level={level} />

      {achievementToast && (
        <Toast icon={achievementToast.icon} title={achievementToast.title}
          msg={achievementToast.msg} accent={achievementToast.accent}
          onClose={() => setAchievementToast(null)} duration={5000} />
      )}
    </div>
  );
}

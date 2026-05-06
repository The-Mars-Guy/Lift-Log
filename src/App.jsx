import { useState, useEffect } from "react";
import { WORKOUTS, SCHEDULE, DEFAULT_SETTINGS, ACHIEVEMENTS, computeStats, todayName, DAYS } from "./data.js";
import { useLocalStorage } from "./hooks.js";
import { makePlay, vibrate as vib } from "./audio.js";
import { BottomNav, Toast } from "./components/shared.jsx";
import WorkoutView from "./views/WorkoutView.jsx";
import StatsView from "./views/StatsView.jsx";
import CalendarView from "./views/CalendarView.jsx";
import SettingsView from "./views/SettingsView.jsx";

export default function App() {
  const [activeView, setActiveView] = useState("workout");
  const [sets, setSets] = useLocalStorage("wt_sets", {});
  const [history, setHistory] = useLocalStorage("wt_history", []);
  const [completed, setCompleted] = useLocalStorage("wt_completed", {});
  const [progression, setProgression] = useLocalStorage("wt_progression", {});
  const [settings, setSettings] = useLocalStorage("wt_settings", DEFAULT_SETTINGS);
  const [achievements, setAchievements] = useLocalStorage("wt_achievements", []);
  const [achievementToast, setAchievementToast] = useState(null);

  const playSound = makePlay(settings);
  const vibrate = (pattern) => vib(settings, pattern);

  // Migrate settings if any new keys appear
  useEffect(() => {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    if (Object.keys(merged).length !== Object.keys(settings).length) {
      setSettings(merged);
    }
  }, []); // eslint-disable-line

  // Check for newly unlocked achievements after history/progression changes
  useEffect(() => {
    const stats = computeStats({ history, progression, settings });
    const newlyUnlocked = ACHIEVEMENTS.filter(a => !achievements.includes(a.id) && a.check(stats));

    if (newlyUnlocked.length > 0) {
      setAchievements(prev => [...prev, ...newlyUnlocked.map(a => a.id)]);
      // Show toast for the first one (queue if multiple)
      const first = newlyUnlocked[0];
      setTimeout(() => {
        playSound("achievement");
        vibrate([60, 40, 60, 40, 120]);
        setAchievementToast({
          icon: first.icon,
          title: "ACHIEVEMENT UNLOCKED",
          msg: `${first.name} — ${first.desc}`,
          accent: "#fbbf24",
        });
      }, 1500);
    }
  }, [history, progression]); // eslint-disable-line

  const resetAllData = () => {
    setSets({});
    setHistory([]);
    setCompleted({});
    setProgression({});
    setAchievements([]);
  };

  const exportData = () => {
    const data = { sets, history, completed, progression, settings, achievements, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lift-log-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Determine current accent based on view + day
  const currentDay = todayName();
  const todayKey = DAYS.includes(currentDay) ? SCHEDULE[currentDay] : "A";
  const accent = WORKOUTS[todayKey].color;

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at top, ${accent}0a 0%, #050505 50%, #000 100%)`,
      paddingBottom: "calc(76px + env(safe-area-inset-bottom))",
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {activeView === "workout" && (
          <WorkoutView
            sets={sets} setSets={setSets}
            history={history} setHistory={setHistory}
            completed={completed} setCompleted={setCompleted}
            progression={progression} setProgression={setProgression}
            settings={settings}
            playSound={playSound} vibrate={vibrate}
            setActiveView={setActiveView}
          />
        )}
        {activeView === "stats" && (
          <StatsView
            history={history} progression={progression}
            settings={settings} achievements={achievements}
            accent={accent}
          />
        )}
        {activeView === "calendar" && (
          <CalendarView
            history={history} progression={progression}
            settings={settings} accent={accent}
          />
        )}
        {activeView === "settings" && (
          <SettingsView
            settings={settings} setSettings={setSettings}
            resetAllData={resetAllData}
            exportData={exportData}
            accent={accent}
          />
        )}
      </div>

      <BottomNav active={activeView} onSelect={setActiveView} accent={accent} />

      {achievementToast && (
        <Toast
          icon={achievementToast.icon}
          title={achievementToast.title}
          msg={achievementToast.msg}
          accent={achievementToast.accent}
          onClose={() => setAchievementToast(null)}
          duration={5000}
        />
      )}
    </div>
  );
}

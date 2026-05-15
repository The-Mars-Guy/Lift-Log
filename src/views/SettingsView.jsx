import { useRef, useState } from "react";
import { DEFAULT_SETTINGS } from "../data.js";
import { EQUIPMENT_PROFILES, JOINT_AREAS, TRAINING_GOALS } from "../coach.js";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SettingsView({
  settings,
  setSettings,
  userProfile,
  setUserProfile,
  resetAllData,
  exportData,
  importData,
  repairSavedData,
  clearWorkoutState,
  refreshAppCache,
  exportLastBackup,
  createBackupSnapshot,
  editBenchmarkTest,
  accent,
  theme,
}) {
  const [confirming,     setConfirming]     = useState(false);
  const [importStatus,   setImportStatus]   = useState(null);
  const [recoveryStatus, setRecoveryStatus] = useState(null);
  const [advancedCoach,  setAdvancedCoach]  = useState(false);
  const [backupOpen,     setBackupOpen]     = useState(false);
  const fileInput = useRef(null);
  const ui = makeSettingsTheme(theme, accent);

  const update        = (key, val) => setSettings(s => ({ ...s, [key]: val }));
  const updateProfile = (key, val) => setUserProfile?.(p => ({ ...p, [key]: val }));
  const profile       = userProfile || {};
  const workoutDays   = settings.workoutDays || ["Mon", "Wed", "Fri"];
  const toggleDay     = (d) => update("workoutDays",
    workoutDays.includes(d) ? workoutDays.filter(x => x !== d) : [...workoutDays, d]);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await importData(file);
    setImportStatus(ok ? "Import complete." : "Import failed. Choose a Lift Log JSON export.");
    e.target.value = "";
  };

  return (
    <div style={{ color: ui.text }}>
      <div style={{ padding: "32px 20px 18px" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: "0.06em", lineHeight: 0.9, color: ui.title }}>
          SETTINGS
        </div>
      </div>

      {/* ── PROFILE ─────────────────────────────────────────────────── */}
      <Accordion title="Profile" ui={ui}>
        <div style={{ background: ui.card, borderRadius: 10, border: `1px solid ${ui.border}`, padding: "14px 16px", display: "grid", gap: 12, boxShadow: ui.shadow }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <ProfileField label="Age"       value={profile.age || ""}      onChange={v => updateProfile("age", v)}      placeholder="34" ui={ui} />
            <ProfileField label="Height ft" value={profile.heightIn ? String(Math.floor(Number(profile.heightIn) / 12)) : ""} onChange={v => updateProfile("heightIn", String((Number(v) || 0) * 12 + (Number(profile.heightIn) % 12 || 0)))} placeholder="5" ui={ui} />
            <ProfileField label="Height in" value={profile.heightIn ? String(Number(profile.heightIn) % 12) : ""} onChange={v => updateProfile("heightIn", String(Math.floor((Number(profile.heightIn) || 0) / 12) * 12 + (Number(v) || 0)))} placeholder="8" ui={ui} />
          </div>
          <ProfileField label="Weight (lb)" value={profile.weightLb || ""} onChange={v => updateProfile("weightLb", v)} placeholder="185" ui={ui} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[["male","Male"],["female","Female"],["","Other"]].map(([k,l]) => (
              <button key={l} onClick={() => updateProfile("sex", k)}
                style={{ padding: "10px 6px", borderRadius: 8, border: `1px solid ${profile.sex === k ? accent : ui.border}`, background: profile.sex === k ? `${accent}22` : ui.control, color: profile.sex === k ? accent : ui.soft, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: ui.card, borderRadius: 10, border: `1px solid ${ui.border}`, padding: "14px 16px", boxShadow: ui.shadow }}>
          <div style={{ fontSize: 13, color: ui.muted, marginBottom: 12 }}>Workout days</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {ALL_DAYS.map(d => {
              const active = workoutDays.includes(d);
              return (
                <button key={d} onClick={() => toggleDay(d)}
                  style={{ padding: "12px 4px", borderRadius: 9, border: `1.5px solid ${active ? accent : ui.border}`, background: active ? `${accent}22` : ui.control, color: active ? accent : ui.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
                  {d}
                </button>
              );
            })}
          </div>
          {workoutDays.length === 0 && <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 8 }}>Pick at least one day.</div>}
        </div>
      </Accordion>

      {/* ── WORKOUT ─────────────────────────────────────────────────── */}
      <Accordion title="Workout" ui={ui}>
        <Row label="Rest Timer" desc="Seconds between sets" ui={ui}>
          <SegControl options={[{v:45,l:"45s"},{v:60,l:"60s"},{v:90,l:"90s"},{v:120,l:"2m"}]}
            value={settings.restSeconds} onChange={v => update("restSeconds", v)} accent={accent} ui={ui} />
        </Row>
        <Row label="Dumbbell Weight" desc="Default weight for new exercises" ui={ui}>
          <NumberInput value={settings.dumbbellWeight} onChange={v => update("dumbbellWeight", v)} suffix="lb" ui={ui} />
        </Row>
        <Row label="Progression Increment" desc="How much +/- buttons change weight"
          help="Use 1 for full freedom, 2.5 for adjustable dumbbells, or 5 for bigger jumps. You can still type any exact weight while logging sets." ui={ui}>
          <NumberInput value={settings.weightIncrement || 1} onChange={v => update("weightIncrement", Math.max(v, 0.1))} suffix="lb" ui={ui} />
        </Row>
        <Row label="Sessions Per Progression" desc="Sessions before reps auto-bump" ui={ui}>
          <SegControl options={[{v:4,l:"4"},{v:6,l:"6"},{v:8,l:"8"},{v:10,l:"10"}]}
            value={settings.sessionsPerProgression} onChange={v => update("sessionsPerProgression", v)} accent={accent} ui={ui} />
        </Row>
      </Accordion>

      {/* ── DATA ────────────────────────────────────────────────────── */}
      <Accordion title="Data" ui={ui}>
        <Action label="Export Data" desc="Download history, progression, and settings as JSON" onClick={exportData} ui={ui} />
        <button onClick={() => setBackupOpen(v => !v)}
          style={{ width:"100%", padding:"12px 16px", background:ui.card, border:`1px solid ${ui.border}`, borderRadius:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"DM Mono, monospace", boxShadow:ui.shadow }}>
          <span style={{ fontSize:15, color:ui.soft }}>Backup & Recovery</span>
          <span style={{ fontSize:13, color:ui.muted }}>{backupOpen ? "▲" : "▼"}</span>
        </button>
        {backupOpen && <>
          <Action label="Create Backup Snapshot" desc="Save a local safety copy before risky changes" onClick={() => setRecoveryStatus(createBackupSnapshot?.("manual") ? "Backup snapshot saved on this device." : "Backup failed. Export data instead.")} ui={ui} />
          <Action label="Download Last Backup" desc="Download the latest automatic safety snapshot" onClick={() => setRecoveryStatus(exportLastBackup?.() ? "Backup downloaded." : "No backup snapshot found yet.")} ui={ui} />
          <Action label="Import Data" desc="Restore from a Lift Log JSON export" onClick={() => fileInput.current?.click()} ui={ui} />
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImport} style={{ display:"none" }} />
          {importStatus && <div style={{ fontSize:13, color:importStatus.startsWith("Import complete") ? accent : "#ff8888", padding:"4px 2px 8px" }}>{importStatus}</div>}
          <Action label="Repair Saved Data" desc="Normalize older or broken local data shapes" onClick={() => { repairSavedData?.(); setRecoveryStatus("Saved data repaired."); }} ui={ui} />
          <Action label="Refresh App Cache" desc="Clear cached app files and reload" onClick={async () => setRecoveryStatus(await refreshAppCache?.() ? "Cache refreshed." : "Cache refresh failed.")} ui={ui} />
          <Action label="Clear Workout State" desc="Clear checked sets and completion flags only" onClick={() => { if (!confirm("Clear checked sets and completed workout flags? History stays saved.")) return; clearWorkoutState?.(); setRecoveryStatus("Workout state cleared."); }} ui={ui} />
          <Action label="Reset to Defaults" desc="Restore default settings (keeps workout history)" onClick={() => setSettings(DEFAULT_SETTINGS)} ui={ui} />
          {recoveryStatus && <div style={{ fontSize:13, color:recoveryStatus.includes("failed") ? "#ff8888" : accent, padding:"4px 2px 8px" }}>{recoveryStatus}</div>}
        </>}
        {confirming ? (
          <div style={{ padding:16, background:"#1a0a0a", border:"1px solid #ff444466", borderRadius:10 }}>
            <div style={{ fontSize:14, color:"#ff8888", marginBottom:12 }}>This deletes all sessions, progression, and achievements. A local backup snapshot will be created first.</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { resetAllData(); setConfirming(false); }} style={{ flex:1, padding:"10px 14px", background:"#ff4444", color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontFamily:"DM Mono, monospace", fontSize:15, letterSpacing:"0.1em" }}>YES, DELETE ALL</button>
              <button onClick={() => setConfirming(false)} style={{ flex:1, padding:"10px 14px", background:"transparent", color:"#aaa", border:"1px solid #333", borderRadius:7, cursor:"pointer", fontFamily:"DM Mono, monospace", fontSize:15, letterSpacing:"0.1em" }}>CANCEL</button>
            </div>
          </div>
        ) : (
          <Action label="Erase All Data" desc="Delete every session and progression record" onClick={() => setConfirming(true)} danger ui={ui} />
        )}
      </Accordion>

      {/* ── APPEARANCE ──────────────────────────────────────────────── */}
      <Accordion title="Appearance" ui={ui}>
        <Row label="Visual Style" desc="Bright phone mode or classic dark mode" ui={ui}>
          <SegControl options={[{v:"dark",l:"Dark"},{v:"pop_light",l:"Pop"}]}
            value={settings.visualTheme || "dark"}
            onChange={v => update("visualTheme", v)} accent={accent} ui={ui} />
        </Row>
      </Accordion>

      {/* ── DEVICE FEEDBACK ─────────────────────────────────────────── */}
      <Accordion title="Device Feedback" ui={ui}>
        <Toggle label="Sound Effects" desc="Beeps and chimes during workouts" value={settings.soundEnabled} onChange={v => update("soundEnabled", v)} accent={accent} ui={ui} />
        <Toggle label="Vibration" desc="Haptic feedback on phone" value={settings.vibrationEnabled} onChange={v => update("vibrationEnabled", v)} accent={accent} ui={ui} />
      </Accordion>

      {/* ── COACH ───────────────────────────────────────────────────── */}
      <Accordion title="Coach" ui={ui}>
        <Toggle label="Science Coach" desc="Use estimated 1RM, goal, and equipment rules"
          help="When enabled, the coach uses your logged reps, weights, recent set feedback, readiness, and equipment access to tune reps, sets, and sometimes suggested load."
          value={settings.scienceCoach === true} onChange={v => update("scienceCoach", v)} accent={accent} ui={ui} />
        <Row label="Training Goal" desc="Changes rep ranges and progression bias" help={TRAINING_GOALS[settings.trainingGoal || "general"]?.desc} ui={ui}>
          <SegControl
            options={[{v:"general",l:"General",tip:TRAINING_GOALS.general.desc},{v:"strength",l:"Strength",tip:TRAINING_GOALS.strength.desc},{v:"hypertrophy",l:"Muscle",tip:TRAINING_GOALS.hypertrophy.desc},{v:"fatigue_friendly",l:"Easy",tip:TRAINING_GOALS.fatigue_friendly.desc}]}
            value={settings.trainingGoal || "general"} onChange={v => update("trainingGoal", v)} accent={accent} ui={ui} />
        </Row>
        <Row label="Equipment" desc="Tells the coach whether load jumps are available" help={EQUIPMENT_PROFILES[settings.equipmentProfile || "fixed_dumbbells"]?.desc} ui={ui}>
          <SegControl
            options={[{v:"fixed_dumbbells",l:"Fixed",tip:EQUIPMENT_PROFILES.fixed_dumbbells.desc},{v:"adjustable_dumbbells",l:"Adjustable",tip:EQUIPMENT_PROFILES.adjustable_dumbbells.desc},{v:"gym_access",l:"Gym",tip:EQUIPMENT_PROFILES.gym_access.desc}]}
            value={settings.equipmentProfile || "fixed_dumbbells"} onChange={v => update("equipmentProfile", v)} accent={accent} ui={ui} />
        </Row>
        <button onClick={() => setAdvancedCoach(v => !v)}
          style={{ width:"100%", padding:"12px 16px", background:ui.card, border:`1px solid ${ui.border}`, borderRadius:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"DM Mono, monospace", boxShadow:ui.shadow }}>
          <span style={{ fontSize:15, color:ui.soft }}>More Coach Options</span>
          <span style={{ fontSize:13, color:ui.muted }}>{advancedCoach ? "▲" : "▼"}</span>
        </button>
        {advancedCoach && <>
          <Row label="Progression Style" desc="How quickly the coach recommends heavier work"
            help="Safe waits for 3 clean sessions, Balanced waits for 2, and Push can progress after 1 clean session." ui={ui}>
            <SegControl
              options={[{v:"conservative",l:"Safe",tip:"3 clean sessions before increasing."},{v:"balanced",l:"Balanced",tip:"2 clean sessions before increasing."},{v:"aggressive",l:"Push",tip:"1 clean session before increasing."}]}
              value={settings.coachStyle || "balanced"} onChange={v => update("coachStyle", v)} accent={accent} ui={ui} />
          </Row>
          <Toggle label="Auto Deload" desc="Reduce load after repeated big misses"
            help="If the same exercise misses badly twice, the coach lowers the next load and rebuilds clean reps."
            value={settings.autoDeload !== false} onChange={v => update("autoDeload", v)} accent={accent} ui={ui} />
          <Toggle label="Readiness Check-In" desc="Ask energy, soreness, and time before workouts"
            help="The coach uses this to trim sets on rough days, push when fresh, and suggest swaps when soreness is high."
            value={settings.showReadiness !== false} onChange={v => update("showReadiness", v)} accent={accent} ui={ui} />
          <Toggle label="Fullscreen Rest Timer" desc="Use the focused rest screen between sets"
            value={settings.fullscreenRest !== false} onChange={v => update("fullscreenRest", v)} accent={accent} ui={ui} />
          <Toggle label="Beginner Form Mode" desc="Larger cues and less noise during focus mode"
            help="Best when you want one clear instruction at a time instead of more advanced coaching detail."
            value={settings.beginnerFormMode === true} onChange={v => update("beginnerFormMode", v)} accent={accent} ui={ui} />
          <Action label="Edit Benchmark Test" desc="Update the initial max-rep numbers the coach uses for targets" onClick={editBenchmarkTest} ui={ui} />
          <Row label="Joint Caution" desc="Coach biases swaps around selected joints"
            help="Use this for recurring caution areas. During workouts, pain feedback still matters most." ui={ui}>
            <MultiSelect
              options={Object.entries(JOINT_AREAS).map(([v, item]) => ({ v, l: item.label }))}
              value={settings.cautiousJoints || []} onChange={v => update("cautiousJoints", v)} accent={accent} ui={ui} />
          </Row>
        </>}
      </Accordion>

      <div style={{ height: 32 }} />
    </div>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function makeSettingsTheme(theme, accent) {
  const light = theme === "pop_light";
  return {
    light,
    title:   light ? "#123047" : "#fafafa",
    section: light ? "#25536f" : "#bbb",
    text:    light ? "#172033" : "#f0f0f0",
    soft:    light ? "#435166" : "#aaa",
    muted:   light ? "#6b788c" : "#888",
    card:    light ? "rgba(255,255,255,.86)" : "#0d0d0d",
    control: light ? "#eef5fb" : "#080808",
    border:  light ? "rgba(112,132,160,.28)" : "#1c1c1c",
    shadow:  light ? `0 12px 26px ${accent}10` : "none",
  };
}

// ─── Accordion section ────────────────────────────────────────────────────────

function Accordion({ title, children, ui }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "0 20px 4px" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          padding: "16px 18px",
          background: ui.card,
          border: `1px solid ${ui.border}`,
          borderRadius: open ? "10px 10px 0 0" : 10,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "DM Mono, monospace",
          marginBottom: open ? 0 : 8,
          boxShadow: ui.shadow,
        }}
      >
        <span style={{ fontSize: 14, color: ui.section, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 13, color: ui.muted }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          padding: "12px 0 12px",
          background: ui.light ? "rgba(255,255,255,.4)" : "#070707",
          border: `1px solid ${ui.border}`,
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          paddingLeft: 12,
          paddingRight: 12,
          marginBottom: 8,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoButton({ text, ui }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button type="button" aria-label="More info" title={text}
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{ width:24, height:24, borderRadius:12, border:`1px solid ${ui.border}`, background:ui.light ? "#eef7ff" : "#151515", color:ui.muted, fontSize:13, fontWeight:700, lineHeight:1, cursor:"pointer" }}>
        ?
      </button>
      {open && (
        <div style={{ position:"absolute", right:0, top:30, zIndex:20, width:250, padding:"11px 12px", background:ui.light ? "#ffffff" : "#101010", color:ui.soft, border:`1px solid ${ui.border}`, borderRadius:10, boxShadow:ui.light ? "0 16px 40px rgba(25,45,80,.18)" : "0 16px 40px rgba(0,0,0,.55)", fontSize:12, lineHeight:1.45 }}>
          {text}
        </div>
      )}
    </div>
  );
}

function Row({ label, desc, children, ui, help }) {
  return (
    <div style={{ padding:"14px 16px", background:ui.card, borderRadius:10, border:`1px solid ${ui.border}`, boxShadow:ui.shadow }}>
      <div style={{ marginBottom:10, display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, color:ui.text }}>{label}</div>
          {desc && <div style={{ fontSize:14, color:ui.muted, marginTop:2, lineHeight:1.4 }}>{desc}</div>}
        </div>
        <InfoButton text={help} ui={ui} />
      </div>
      {children}
    </div>
  );
}

function SegControl({ options, value, onChange, accent, ui }) {
  return (
    <div style={{ display:"flex", gap:4, padding:3, background:ui.control, borderRadius:7, border:`1px solid ${ui.border}` }}>
      {options.map(opt => {
        const active = opt.v === value;
        return (
          <button key={opt.v} onClick={() => onChange(opt.v)} title={opt.tip}
            style={{ flex:1, padding:"8px 4px", background:active ? accent : "transparent", color:active ? "#050505" : ui.soft, border:"none", borderRadius:5, cursor:"pointer", fontSize:15, letterSpacing:"0.06em", fontWeight:active ? 500 : 400, fontFamily:"DM Mono, monospace", transition:"all 0.18s", boxShadow:active ? `0 0 12px ${accent}77` : "none" }}>
            {opt.l}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelect({ options, value, onChange, accent, ui }) {
  const selected = value || [];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:6 }}>
      {options.map(opt => {
        const active = selected.includes(opt.v);
        return (
          <button key={opt.v} onClick={() => onChange(active ? selected.filter(v => v !== opt.v) : [...selected, opt.v])}
            style={{ padding:"10px 8px", borderRadius:8, border:`1px solid ${active ? accent : ui.border}`, background:active ? `${accent}22` : ui.control, color:active ? accent : ui.soft, fontSize:13, fontWeight:active ? 700 : 400, cursor:"pointer" }}>
            {opt.l}
          </button>
        );
      })}
    </div>
  );
}

function NumberInput({ value, onChange, suffix, ui }) {
  return (
    <div style={{ display:"flex", alignItems:"center", background:ui.control, border:`1px solid ${ui.border}`, borderRadius:9, overflow:"hidden" }}>
      <input value={value} onChange={e => onChange(Number(e.target.value) || 0)}
        type="number" inputMode="decimal" min="0" step="any"
        style={{ flex:1, minWidth:0, padding:"12px 12px", background:"transparent", border:"none", outline:"none", color:ui.text, fontFamily:"DM Mono, monospace", fontSize:16 }} />
      <span style={{ fontSize:12, color:ui.muted, paddingRight:12 }}>{suffix}</span>
    </div>
  );
}

function Toggle({ label, desc, value, onChange, accent, ui, help }) {
  return (
    <div style={{ padding:"14px 16px", background:ui.card, borderRadius:10, border:`1px solid ${ui.border}`, display:"flex", alignItems:"center", gap:14, boxShadow:ui.shadow }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:15, color:ui.text }}>{label}</div>
          <InfoButton text={help} ui={ui} />
        </div>
        {desc && <div style={{ fontSize:14, color:ui.muted, marginTop:2, lineHeight:1.4 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ width:46, height:26, borderRadius:13, background:value ? accent : (ui.light ? "#cfd9e6" : "#222"), border:"none", cursor:"pointer", position:"relative", transition:"all 0.2s", boxShadow:value ? `0 0 12px ${accent}66` : "none", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left:value ? 23 : 3, width:20, height:20, borderRadius:10, background:"#fafafa", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.5)" }} />
      </button>
    </div>
  );
}

function ProfileField({ label, value, onChange, placeholder, ui }) {
  return (
    <label style={{ display:"grid", gap:5 }}>
      <span style={{ fontSize:10, color:ui.muted, letterSpacing:".1em", textTransform:"uppercase", fontWeight:800 }}>{label}</span>
      <input type="number" inputMode="numeric" min="0" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", boxSizing:"border-box", background:ui.control, border:`1px solid ${ui.border}`, borderRadius:8, color:ui.text, padding:"10px 8px", fontSize:15, fontWeight:700, outline:"none" }} />
    </label>
  );
}

function Action({ label, desc, onClick, danger, ui }) {
  return (
    <button onClick={onClick}
      style={{ padding:"14px 16px", background:ui.card, borderRadius:10, border:`1px solid ${danger ? "#ff444433" : ui.border}`, cursor:"pointer", textAlign:"left", width:"100%", fontFamily:"DM Mono, monospace", transition:"all 0.15s", boxShadow:ui.shadow }}
      onMouseEnter={e => e.currentTarget.style.borderColor = danger ? "#ff444499" : (ui.light ? "#8fb0ce" : "#3a3a3a")}
      onMouseLeave={e => e.currentTarget.style.borderColor = danger ? "#ff444433" : ui.border}>
      <div style={{ fontSize:15, color:danger ? "#ff5555" : ui.text }}>{label} →</div>
      {desc && <div style={{ fontSize:14, color:ui.muted, marginTop:3, lineHeight:1.4 }}>{desc}</div>}
    </button>
  );
}

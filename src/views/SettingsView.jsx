import { useRef, useState } from "react";
import { DEFAULT_SETTINGS, LIMITATION_OPTIONS, ageTier, normalizeUserProfile, profileFitnessEstimate, profileRisk, cleanAvailableWeights } from "../data.js";
import { EQUIPMENT_PROFILES, JOINT_AREAS, TRAINING_GOALS } from "../coach.js";
import { status } from "../theme.js";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SettingsView({
  settings,
  setSettings,
  userProfile,
  setUserProfile,
  resetAllData,
  exportData,
  previewImport,
  applyImport,
  repairSavedData,
  clearWorkoutState,
  refreshAppCache,
  exportLastBackup,
  createBackupSnapshot,
  editBenchmarkTest,
  accent,
  theme,
  initialSection,
}) {
  const [confirming,     setConfirming]     = useState(false);
  const [importStatus,   setImportStatus]   = useState(null); // { ok, msg } | null
  const [importPreview,  setImportPreview]  = useState(null); // snapshot from previewImport | null
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
    e.target.value = "";
    const snapshot = await previewImport(file);
    if (!snapshot) {
      setImportStatus({ ok: false, msg: "Could not read file. Choose a Gym Forged JSON export." });
      return;
    }
    setImportPreview(snapshot);
  };

  const confirmImport = () => {
    const ok = applyImport(importPreview);
    setImportPreview(null);
    setImportStatus(ok
      ? { ok: true,  msg: "Import complete. Your data has been restored." }
      : { ok: false, msg: "Import failed while applying data. Your previous data is unchanged." }
    );
  };

  const cancelImport = () => setImportPreview(null);

  return (
    <div style={{ color: ui.text }}>
      <div style={{ padding: "32px 20px 18px" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: "0.06em", lineHeight: 0.9, color: ui.title }}>
          SETTINGS
        </div>
      </div>

      {/* ── PROFILE ─────────────────────────────────────────────────── */}
      <Accordion title="Profile" ui={ui} defaultOpen={initialSection === "Profile"}>
        {/* Basic stats */}
        <div style={{ background: ui.card, borderRadius: 10, border: `1px solid ${ui.border}`, padding: "14px 16px", display: "grid", gap: 12, boxShadow: ui.shadow }}>
          <div style={{ fontSize: 11, color: ui.muted, fontWeight: 700 }}>Basic Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <ProfileField label="Age"       value={profile.age || ""}      onChange={v => updateProfile("age", v)}      placeholder="34" ui={ui} />
            <ProfileField label="Height ft" value={profile.heightIn ? String(Math.floor(Number(profile.heightIn) / 12)) : ""} onChange={v => updateProfile("heightIn", String((Number(v) || 0) * 12 + (Number(profile.heightIn) % 12 || 0)))} placeholder="5" ui={ui} />
            <ProfileField label="Height in" value={profile.heightIn ? String(Number(profile.heightIn) % 12) : ""} onChange={v => updateProfile("heightIn", String(Math.floor((Number(profile.heightIn) || 0) / 12) * 12 + (Number(v) || 0)))} placeholder="8" ui={ui} />
          </div>
          <ProfileField label="Weight (lb)" value={profile.weightLb || ""} onChange={v => updateProfile("weightLb", v)} placeholder="185" ui={ui} />
          <div>
            <div style={{ fontSize: 11, color: ui.muted, fontWeight: 600, marginBottom: 8 }}>Sex</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[["male","Male"],["female","Female"],["","Other"]].map(([k,l]) => (
                <button key={l} onClick={() => updateProfile("sex", k)}
                  style={{ padding: "10px 4px", borderRadius: 8, border: `1px solid ${profile.sex === k ? accent : ui.border}`, background: profile.sex === k ? `${accent}22` : ui.control, color: profile.sex === k ? accent : ui.soft, fontSize: 13, fontWeight: 800, cursor: "pointer", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Training background */}
        <div style={{ background: ui.card, borderRadius: 10, border: `1px solid ${ui.border}`, padding: "14px 16px", display: "grid", gap: 14, boxShadow: ui.shadow }}>
          <div style={{ fontSize: 11, color: ui.muted, fontWeight: 700 }}>Training Background</div>
          <div>
            <div style={{ fontSize: 11, color: ui.muted, marginBottom: 8 }}>Experience level</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[["new","New to lifting"],["returning","Returning"],["trained","Trained (1+ yr)"]].map(([k,l]) => (
                <button key={k} onClick={() => updateProfile("trainingExperience", k)}
                  style={{ padding: "10px 6px", borderRadius: 8, border: `1px solid ${profile.trainingExperience === k ? accent : ui.border}`, background: profile.trainingExperience === k ? `${accent}22` : ui.control, color: profile.trainingExperience === k ? accent : ui.soft, fontSize: 11, fontWeight: 800, cursor: "pointer", lineHeight: 1.3 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: ui.muted, marginBottom: 8 }}>Mobility</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["normal","Normal — full range"],["limited","Limited — joint restrictions"]].map(([k,l]) => (
                <button key={k} onClick={() => updateProfile("mobility", k)}
                  style={{ padding: "10px 8px", borderRadius: 8, border: `1px solid ${profile.mobility === k ? accent : ui.border}`, background: profile.mobility === k ? `${accent}22` : ui.control, color: profile.mobility === k ? accent : ui.soft, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: ui.muted, marginBottom: 8 }}>Joint concerns (select all that apply)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LIMITATION_OPTIONS.map(([k, l]) => {
                const active = (profile.limitations || []).includes(k);
                return (
                  <button key={k} onClick={() => {
                    const cur = profile.limitations || [];
                    updateProfile("limitations", active ? cur.filter(x => x !== k) : [...cur, k]);
                  }} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${active ? status.caution : ui.border}`, background: active ? "#fb718522" : ui.control, color: active ? status.caution : ui.soft, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* How the system sees you */}
        {(() => {
          const safe = normalizeUserProfile(profile);
          const est  = profileFitnessEstimate(safe);
          const risk = profileRisk(safe);
          const tier = ageTier(safe);
          const hasData = safe.age && safe.weightLb && safe.heightIn;
          const RISK_COLOR = { standard: status.good, steady: status.warn, protect: status.caution };
          const RISK_LABEL = { standard: "Standard", steady: "Steady", protect: "Cautious" };
          const EXP_LABEL  = { new: "New lifter", returning: "Returning", trained: "Trained" };
          return (
            <div style={{ background: ui.card, borderRadius: 10, border: `1px solid ${accent}44`, padding: "14px 16px", boxShadow: ui.shadow }}>
              <div style={{ fontSize: 11, color: accent, fontWeight: 700, marginBottom: 12 }}>How the system sees you</div>
              {!hasData ? (
                <div style={{ fontSize: 13, color: ui.muted }}>Fill in age, height, and weight above to see your profile estimates.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Lean Mass Est.", value: est.leanMassLb ? `${est.leanMassLb} lb` : "—", note: "Boer formula + experience adj." },
                    { label: "BMR", value: est.bmr ? `${est.bmr.toLocaleString()} kcal` : "—", note: "Resting daily energy" },
                    { label: "Risk Profile", value: RISK_LABEL[risk.level] || risk.level, color: RISK_COLOR[risk.level], note: `Score ${risk.score}/5 — affects exercise selection` },
                    { label: "Age Tier", value: tier.label || tier.coachFocus, note: `Coach focus: ${tier.coachFocus?.replace("_"," ")}` },
                    { label: "Experience", value: EXP_LABEL[safe.trainingExperience] || safe.trainingExperience, note: "Affects lean mass & progression speed" },
                    { label: "Joint Concerns", value: (safe.limitations || []).length ? safe.limitations.join(", ") : "None", note: "Filters risky exercises from picker" },
                  ].map(({ label, value, color, note }) => (
                    <div key={label} style={{ background: ui.control, borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: ui.muted, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: color || ui.text }}>{value}</div>
                      <div style={{ fontSize: 10, color: ui.muted, marginTop: 3, lineHeight: 1.35 }}>{note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Workout days */}
        <div style={{ background: ui.card, borderRadius: 10, border: `1px solid ${ui.border}`, padding: "14px 16px", boxShadow: ui.shadow }}>
          <div style={{ fontSize: 11, color: ui.muted, fontWeight: 700, marginBottom: 12 }}>Forge Days</div>
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
          {workoutDays.length === 0 && <div style={{ fontSize: 12, color: status.warn, marginTop: 8 }}>Pick at least one day.</div>}
        </div>
      </Accordion>

      {/* ── WORKOUT ─────────────────────────────────────────────────── */}
      <Accordion title="Workout" ui={ui} defaultOpen={initialSection === "Workout"}>
        <Row label="Cool-Down Timer" desc="Seconds between strikes" ui={ui}>
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
        {(settings.equipmentProfile || "fixed_dumbbells") === "fixed_dumbbells" && (
          <AvailableWeights
            value={settings.availableWeights || []}
            onChange={v => update("availableWeights", v)}
            accent={accent} ui={ui} />
        )}
        <Row label="Sessions Per Progression" desc="Sessions before reps auto-bump" ui={ui}>
          <SegControl options={[{v:4,l:"4"},{v:6,l:"6"},{v:8,l:"8"},{v:10,l:"10"}]}
            value={settings.sessionsPerProgression} onChange={v => update("sessionsPerProgression", v)} accent={accent} ui={ui} />
        </Row>
      </Accordion>

      {/* ── DATA ────────────────────────────────────────────────────── */}
      <Accordion title="Data" ui={ui} defaultOpen={initialSection === "Data"}>
        <Action label="Export Data" desc="Download history, progression, and settings as JSON" onClick={exportData} ui={ui} />
        <button onClick={() => setBackupOpen(v => !v)}
          style={{ width:"100%", padding:"12px 16px", background:ui.card, border:`1px solid ${ui.border}`, borderRadius:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:ui.shadow }}>
          <span style={{ fontSize:15, color:ui.soft }}>Backup & Recovery</span>
          <span style={{ fontSize:13, color:ui.muted }}>{backupOpen ? "▲" : "▼"}</span>
        </button>
        {backupOpen && <>
          <Action label="Create Backup Snapshot" desc="Save a local safety copy before risky changes" onClick={() => setRecoveryStatus(createBackupSnapshot?.("manual") ? "Backup snapshot saved on this device." : "Backup failed. Export data instead.")} ui={ui} />
          <Action label="Download Last Backup" desc="Download the latest automatic safety snapshot" onClick={() => setRecoveryStatus(exportLastBackup?.() ? "Backup downloaded." : "No backup snapshot found yet.")} ui={ui} />
          <Action label="Import Data" desc="Restore from a Gym Forged JSON export" onClick={() => fileInput.current?.click()} ui={ui} />
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImport} style={{ display:"none" }} />
          {importStatus && <div style={{ fontSize:13, color:importStatus.ok ? accent : "#ff8888", padding:"4px 2px 8px" }}>{importStatus.msg}</div>}
          {importPreview && (
            <div style={{ padding:14, background:"#0d0a06", border:`1px solid ${accent}55`, borderRadius:10, marginTop:6 }}>
              <div style={{ fontSize:12, color:accent, fontWeight:700, marginBottom:8 }}>CONFIRM IMPORT</div>
              <div style={{ display:"grid", gap:4, marginBottom:10 }}>
                <InfoRow label="Version" value={importPreview.version > 0 ? `v${importPreview.version}` : "legacy"} accent={accent} />
                {importPreview.createdAt && <InfoRow label="Created" value={new Date(importPreview.createdAt).toLocaleDateString()} accent={accent} />}
                <InfoRow label="Sessions" value={importPreview.sessionCount} accent={accent} />
                <InfoRow label="Goals" value={importPreview.goalsCount} accent={accent} />
                <InfoRow label="Profile" value={importPreview.hasProfile ? "yes" : "none"} accent={accent} />
                <InfoRow label="Settings" value={importPreview.hasSettings ? "yes" : "defaults"} accent={accent} />
              </div>
              {importPreview.warnings.length > 0 && (
                <div style={{ marginBottom:10 }}>
                  {importPreview.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize:12, color:"#fb923c", lineHeight:1.4, padding:"5px 8px", background:"#fb923c12", borderRadius:6, marginBottom:4 }}>⚠ {w}</div>
                  ))}
                </div>
              )}
              {importPreview.isEmpty && (
                <div style={{ fontSize:12, color:"#ff8888", marginBottom:10 }}>This file contains no workout data. Importing will overwrite current data.</div>
              )}
              <div style={{ fontSize:11, color:"#888", marginBottom:10 }}>A local backup will be created automatically before import.</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={confirmImport} style={{ padding:"9px 16px", background:accent, border:"none", borderRadius:8, color:"#050505", fontSize:12, fontWeight:800, cursor:"pointer" }}>IMPORT</button>
                <button onClick={cancelImport} style={{ padding:"9px 12px", background:"transparent", border:"none", color:"#888", fontSize:12, cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          )}
          <Action label="Repair Saved Data" desc="Normalize older or broken local data shapes" onClick={() => { repairSavedData?.(); setRecoveryStatus("Saved data repaired."); }} ui={ui} />
          <Action label="Refresh App Cache" desc="Clear cached app files and reload" onClick={async () => setRecoveryStatus(await refreshAppCache?.() ? "Cache refreshed." : "Cache refresh failed.")} ui={ui} />
          <Action label="Clear Workout State" desc="Clear checked sets and completion flags only" onClick={() => { if (!confirm("Clear checked sets and completed workout flags? History stays saved.")) return; clearWorkoutState?.(); setRecoveryStatus("Workout state cleared."); }} ui={ui} />
          <Action label="Reset to Defaults" desc="Restore default settings (keeps workout history)" onClick={() => setSettings(DEFAULT_SETTINGS)} ui={ui} />
          {recoveryStatus && <div style={{ fontSize:13, color:recoveryStatus.includes("failed") ? "#ff8888" : accent, padding:"4px 2px 8px" }}>{recoveryStatus}</div>}
        </>}
        {confirming ? (
          <div style={{ padding:16, background:"#1a0a0a", border:"1px solid #ff444466", borderRadius:10 }}>
            <div style={{ fontSize:14, color:"#ff8888", marginBottom:12 }}>This wipes ALL data — sessions, history, settings, and profile. App restarts fresh. A backup snapshot is saved first so you can recover.</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { resetAllData(); setConfirming(false); }} style={{ flex:1, padding:"10px 14px", background:"#ff4444", color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontSize:15, letterSpacing:"0.1em" }}>YES, DELETE ALL</button>
              <button onClick={() => setConfirming(false)} style={{ flex:1, padding:"10px 14px", background:"transparent", color:"#aaa", border:"1px solid #333", borderRadius:7, cursor:"pointer", fontSize:15, letterSpacing:"0.1em" }}>CANCEL</button>
            </div>
          </div>
        ) : (
          <Action label="Erase All Data" desc="Delete every session and progression record" onClick={() => setConfirming(true)} danger ui={ui} />
        )}
      </Accordion>

      {/* ── APPEARANCE ──────────────────────────────────────────────── */}
      <Accordion title="Appearance" ui={ui} defaultOpen={initialSection === "Appearance"}>
        <Row label="Visual Style" desc="Bright phone mode or classic dark mode" ui={ui}>
          <SegControl options={[{v:"dark",l:"Dark"},{v:"pop_light",l:"Pop"}]}
            value={settings.visualTheme || "dark"}
            onChange={v => update("visualTheme", v)} accent={accent} ui={ui} />
        </Row>
      </Accordion>

      {/* ── DEVICE FEEDBACK ─────────────────────────────────────────── */}
      <Accordion title="Device Feedback" ui={ui} defaultOpen={initialSection === "Device Feedback"}>
        <Toggle label="Sound Effects" desc="Beeps and chimes during workouts" value={settings.soundEnabled} onChange={v => update("soundEnabled", v)} accent={accent} ui={ui} />
        <Toggle label="Vibration" desc="Haptic feedback on phone" value={settings.vibrationEnabled} onChange={v => update("vibrationEnabled", v)} accent={accent} ui={ui} />
      </Accordion>

      {/* ── COACH ───────────────────────────────────────────────────── */}
      <Accordion title="Smith" ui={ui} defaultOpen={initialSection === "Smith"}>
        <Toggle label="Smith" desc="Use estimated 1RM, goal, and equipment rules"
          help="When enabled, Smith uses your logged reps, weights, recent set feedback, readiness, and equipment access to tune reps, sets, and sometimes suggested load."
          value={settings.scienceCoach === true} onChange={v => update("scienceCoach", v)} accent={accent} ui={ui} />
        <Row label="Forge Goal" desc="Changes rep ranges and progression bias" help={TRAINING_GOALS[settings.trainingGoal || "general"]?.desc} ui={ui}>
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
          style={{ width:"100%", padding:"12px 16px", background:ui.card, border:`1px solid ${ui.border}`, borderRadius:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:ui.shadow }}>
          <span style={{ fontSize:15, color:ui.soft }}>More Smith Options</span>
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
            help="If the same exercise misses badly twice, Smith lowers the next load and rebuilds clean reps."
            value={settings.autoDeload !== false} onChange={v => update("autoDeload", v)} accent={accent} ui={ui} />
          <Toggle label="Readiness Check-In" desc="Ask energy, soreness, and time before workouts"
            help="Smith uses this to trim sets on rough days, push when fresh, and suggest swaps when soreness is high."
            value={settings.showReadiness !== false} onChange={v => update("showReadiness", v)} accent={accent} ui={ui} />
          <Toggle label="Fullscreen Cool-Down" desc="Use the focused cool-down screen between strikes"
            value={settings.fullscreenRest !== false} onChange={v => update("fullscreenRest", v)} accent={accent} ui={ui} />
          <Toggle label="Beginner Form Mode" desc="Larger cues and less noise during focus mode"
            help="Best when you want one clear instruction at a time instead of more advanced coaching detail."
            value={settings.beginnerFormMode === true} onChange={v => update("beginnerFormMode", v)} accent={accent} ui={ui} />
          <Action label="Edit Benchmark Test" desc="Update the initial max-rep numbers the coach uses for targets" onClick={editBenchmarkTest} ui={ui} />
          <Row label="Joint Caution" desc="Smith biases swaps around selected joints"
            help="Use this for recurring caution areas. During workouts, pain feedback still matters most." ui={ui}>
            <MultiSelect
              options={Object.entries(JOINT_AREAS).map(([v, item]) => ({ v, l: item.label }))}
              value={settings.cautiousJoints || []} onChange={v => update("cautiousJoints", v)} accent={accent} ui={ui} />
          </Row>
        </>}
      </Accordion>

      {/* ── SIMPLE MODE ─────────────────────────────────────────────── */}
      <Accordion title="Simple Mode" ui={ui} defaultOpen={initialSection === "Simple Mode"}>
        <Toggle label="Simple Mode"
          desc="Hides advanced coach panels and analysis. Just your exercises, sets, and reps."
          help="Ideal for days when you want zero friction — tap sets, finish, done. Coach, science notes, and plateau analysis are hidden. Disable anytime."
          value={settings.simpleMode === true} onChange={v => update("simpleMode", v)} accent={accent} ui={ui} />
        {settings.simpleMode && (
          <div style={{ padding:"12px 14px", background:`${accent}10`, border:`1px solid ${accent}33`, borderRadius:10, fontSize:13, color:ui.soft, lineHeight:1.55 }}>
            Simple Mode is on. The workout screen shows only exercises and set tracking. Smith coach, science notes, and plateau analysis are hidden.
          </div>
        )}
      </Accordion>

      {/* ── ABOUT ──────────────────────────────────────────────────── */}
      <div style={{ margin:"0 16px 8px", padding:"16px", background:ui.card, borderRadius:12, border:`1px solid ${ui.border}`, boxShadow:ui.shadow }}>
        <div style={{ fontSize:11, color:ui.muted, fontWeight:700, letterSpacing:".07em", marginBottom:10 }}>ABOUT</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:13, color:ui.soft }}>Gym Forged</span>
          <span style={{ fontSize:12, color:accent, fontFamily:"DM Mono, monospace", fontWeight:600 }}>v{__APP_VERSION__}</span>
        </div>
        <div style={{ fontSize:12, color:ui.muted, lineHeight:1.55 }}>
          🔒 All data stays on this device. Nothing is uploaded, synced, or shared. Use Export to back up or move your data.
        </div>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function InfoRow({ label, value, accent }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
      <span style={{ color:"#888" }}>{label}</span>
      <span style={{ color: accent, fontWeight:600 }}>{String(value)}</span>
    </div>
  );
}

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

function Accordion({ title, children, ui, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
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
          marginBottom: open ? 0 : 8,
          boxShadow: ui.shadow,
        }}
      >
        <span style={{ fontSize: 14, color: ui.section, fontWeight: 700 }}>{title}</span>
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
            style={{ flex:1, padding:"8px 4px", background:active ? accent : "transparent", color:active ? "#050505" : ui.soft, border:"none", borderRadius:5, cursor:"pointer", fontSize:15, letterSpacing:"0.06em", fontWeight:active ? 500 : 400, transition:"all 0.18s", boxShadow:active ? `0 0 12px ${accent}77` : "none" }}>
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
        style={{ flex:1, minWidth:0, padding:"12px 12px", background:"transparent", border:"none", outline:"none", color:ui.text, fontSize:16 }} />
      <span style={{ fontSize:12, color:ui.muted, paddingRight:12 }}>{suffix}</span>
    </div>
  );
}

function AvailableWeights({ value, onChange, accent, ui }) {
  const [draft, setDraft] = useState("");
  const weights = cleanAvailableWeights(value);
  const add = () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || n < 0) { setDraft(""); return; }
    onChange(cleanAvailableWeights([...weights, n]));
    setDraft("");
  };
  const remove = (w) => onChange(weights.filter(x => x !== w));
  return (
    <div style={{ padding:"14px 16px", background:ui.card, borderRadius:10, border:`1px solid ${ui.border}`, boxShadow:ui.shadow }}>
      <div style={{ fontSize:15, color:ui.text }}>My Dumbbells</div>
      <div style={{ fontSize:14, color:ui.muted, marginTop:2, lineHeight:1.4 }}>
        Add each fixed dumbbell you own (lbs per hand). The +/- buttons snap to these.
      </div>
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <div style={{ display:"flex", flex:1, alignItems:"center", background:ui.control, border:`1px solid ${ui.border}`, borderRadius:9, overflow:"hidden" }}>
          <input value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") add(); }}
            type="number" inputMode="decimal" min="0" step="any" placeholder="e.g. 25"
            style={{ flex:1, minWidth:0, padding:"12px 12px", background:"transparent", border:"none", outline:"none", color:ui.text, fontSize:16 }} />
          <span style={{ fontSize:12, color:ui.muted, paddingRight:12 }}>lb</span>
        </div>
        <button onClick={add}
          style={{ padding:"0 18px", background:accent, border:"none", borderRadius:9, color:"#050505", fontSize:13, fontWeight:800, letterSpacing:".06em", cursor:"pointer" }}>ADD</button>
      </div>
      {weights.length > 0 ? (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
          {weights.map(w => (
            <button key={w} onClick={() => remove(w)} title="Tap to remove"
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 10px", background:`${accent}1e`, border:`1px solid ${accent}55`, borderRadius:999, color:accent, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {w} lb <span style={{ fontSize:15, lineHeight:1, opacity:.8 }}>×</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ fontSize:13, color:ui.muted, marginTop:12 }}>No dumbbells added — +/- buttons use the increment instead.</div>
      )}
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
      <span style={{ fontSize:10, color:ui.muted, fontWeight:800 }}>{label}</span>
      <input type="number" inputMode="numeric" min="0" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", boxSizing:"border-box", background:ui.control, border:`1px solid ${ui.border}`, borderRadius:8, color:ui.text, padding:"10px 8px", fontSize:15, fontWeight:700, outline:"none" }} />
    </label>
  );
}

function Action({ label, desc, onClick, danger, ui }) {
  return (
    <button onClick={onClick}
      style={{ padding:"14px 16px", background:ui.card, borderRadius:10, border:`1px solid ${danger ? "#ff444433" : ui.border}`, cursor:"pointer", textAlign:"left", width:"100%", transition:"all 0.15s", boxShadow:ui.shadow }}
      onMouseEnter={e => e.currentTarget.style.borderColor = danger ? "#ff444499" : (ui.light ? "#8fb0ce" : "#3a3a3a")}
      onMouseLeave={e => e.currentTarget.style.borderColor = danger ? "#ff444433" : ui.border}>
      <div style={{ fontSize:15, color:danger ? "#ff5555" : ui.text }}>{label} →</div>
      {desc && <div style={{ fontSize:14, color:ui.muted, marginTop:3, lineHeight:1.4 }}>{desc}</div>}
    </button>
  );
}

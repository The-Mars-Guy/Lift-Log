import { useState } from "react";
import { DEFAULT_SETTINGS } from "../data.js";

export default function SettingsView({ settings, setSettings, resetAllData, exportData, accent }) {
  const [confirming, setConfirming] = useState(false);

  const update = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <div>
      <div style={{ padding: "32px 20px 18px" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: "0.06em", lineHeight: 0.9, color: "#fafafa" }}>
          SETTINGS
        </div>
        <div style={{ fontSize: 15, color: "#999", marginTop: 6, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          customize your experience
        </div>
      </div>

      <Section title="Workout">
        <Row label="Rest Timer" desc="Seconds between sets">
          <SegControl
            options={[{ v: 45, l: "45s" }, { v: 60, l: "60s" }, { v: 90, l: "90s" }, { v: 120, l: "2m" }]}
            value={settings.restSeconds}
            onChange={v => update("restSeconds", v)}
            accent={accent}
          />
        </Row>
        <Row label="Dumbbell Weight" desc="Used for volume calculations">
          <SegControl
            options={[{ v: 10, l: "10" }, { v: 15, l: "15" }, { v: 20, l: "20" }, { v: 25, l: "25" }]}
            value={settings.dumbbellWeight}
            onChange={v => update("dumbbellWeight", v)}
            accent={accent}
          />
        </Row>
        <Row label="Sessions Per Progression" desc="How many sessions before reps auto-bump">
          <SegControl
            options={[{ v: 4, l: "4" }, { v: 6, l: "6" }, { v: 8, l: "8" }, { v: 10, l: "10" }]}
            value={settings.sessionsPerProgression}
            onChange={v => update("sessionsPerProgression", v)}
            accent={accent}
          />
        </Row>
      </Section>

      <Section title="Feedback">
        <Toggle label="Sound Effects" desc="Beeps and chimes during workouts" value={settings.soundEnabled} onChange={v => update("soundEnabled", v)} accent={accent} />
        <Toggle label="Vibration" desc="Haptic feedback on phone" value={settings.vibrationEnabled} onChange={v => update("vibrationEnabled", v)} accent={accent} />
      </Section>

      <Section title="Data">
        <Action label="Export Data" desc="Download history, progression, and settings as JSON" onClick={exportData} />
        <Action label="Reset to Defaults" desc="Restore default settings (keeps workout history)" onClick={() => setSettings(DEFAULT_SETTINGS)} />
        {confirming ? (
          <div style={{ padding: 16, background: "#1a0a0a", border: "1px solid #ff444466", borderRadius: 10, marginTop: 8 }}>
            <div style={{ fontSize: 14, color: "#ff8888", marginBottom: 12 }}>This permanently deletes all sessions, progression, and achievements. Continue?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { resetAllData(); setConfirming(false); }} style={{
                flex: 1, padding: "10px 14px", background: "#ff4444", color: "#fff",
                border: "none", borderRadius: 7, cursor: "pointer",
                fontFamily: "DM Mono, monospace", fontSize: 15, letterSpacing: "0.1em",
              }}>YES, DELETE ALL</button>
              <button onClick={() => setConfirming(false)} style={{
                flex: 1, padding: "10px 14px", background: "transparent", color: "#aaa",
                border: "1px solid #333", borderRadius: 7, cursor: "pointer",
                fontFamily: "DM Mono, monospace", fontSize: 15, letterSpacing: "0.1em",
              }}>CANCEL</button>
            </div>
          </div>
        ) : (
          <Action label="Erase All Data" desc="Delete every session and progression record" onClick={() => setConfirming(true)} danger />
        )}
      </Section>

      <Section title="About">
        <div style={{ padding: 16, background: "#0d0d0d", borderRadius: 10, border: "1px solid #1c1c1c" }}>
          <div style={{ fontSize: 15, color: "#e0e0e0", marginBottom: 6 }}>Lift Log <span style={{ color: "#888", fontSize: 11 }}>v2.0</span></div>
          <div style={{ fontSize: 15, color: "#aaa", lineHeight: 1.6 }}>
            Built for the user with two 15lb dumbbells and limited time. Auto-progression, exercise demos from the public-domain Free Exercise DB, and zero accounts.
          </div>
          <div style={{ fontSize: 14, color: "#666", marginTop: 12, letterSpacing: "0.06em" }}>
            All data stored locally in your browser. No tracking, no servers.
          </div>
        </div>
      </Section>

      <div style={{ padding: 20, textAlign: "center", fontSize: 15, color: "#444", letterSpacing: "0.14em" }}>
        — STAY CONSISTENT —
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{
        fontSize: 15, color: "#ddd", letterSpacing: "0.16em", textTransform: "uppercase",
        fontWeight: 500, marginBottom: 12,
      }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div style={{ padding: "14px 16px", background: "#0d0d0d", borderRadius: 10, border: "1px solid #1c1c1c" }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 15, color: "#f0f0f0" }}>{label}</div>
        {desc && <div style={{ fontSize: 14, color: "#888", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SegControl({ options, value, onChange, accent }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 3, background: "#080808", borderRadius: 7, border: "1px solid #1c1c1c" }}>
      {options.map(opt => {
        const active = opt.v === value;
        return (
          <button key={opt.v} onClick={() => onChange(opt.v)}
            style={{
              flex: 1, padding: "8px 4px",
              background: active ? accent : "transparent",
              color: active ? "#050505" : "#bbb",
              border: "none", borderRadius: 5, cursor: "pointer",
              fontSize: 15, letterSpacing: "0.06em", fontWeight: active ? 500 : 400,
              fontFamily: "DM Mono, monospace",
              transition: "all 0.18s",
              boxShadow: active ? `0 0 12px ${accent}77` : "none",
            }}>
            {opt.l}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ label, desc, value, onChange, accent }) {
  return (
    <div style={{ padding: "14px 16px", background: "#0d0d0d", borderRadius: 10, border: "1px solid #1c1c1c", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: "#f0f0f0" }}>{label}</div>
        {desc && <div style={{ fontSize: 14, color: "#888", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{
          width: 46, height: 26, borderRadius: 13,
          background: value ? accent : "#222",
          border: "none", cursor: "pointer",
          position: "relative", transition: "all 0.2s",
          boxShadow: value ? `0 0 12px ${accent}66` : "none",
          flexShrink: 0,
        }}>
        <div style={{
          position: "absolute", top: 3,
          left: value ? 23 : 3,
          width: 20, height: 20, borderRadius: 10,
          background: "#fafafa",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }} />
      </button>
    </div>
  );
}

function Action({ label, desc, onClick, danger }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "14px 16px", background: "#0d0d0d",
        borderRadius: 10, border: `1px solid ${danger ? "#ff444433" : "#1c1c1c"}`,
        cursor: "pointer", textAlign: "left", width: "100%",
        fontFamily: "DM Mono, monospace",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = danger ? "#ff444499" : "#3a3a3a"}
      onMouseLeave={e => e.currentTarget.style.borderColor = danger ? "#ff444433" : "#1c1c1c"}
    >
      <div style={{ fontSize: 15, color: danger ? "#ff8888" : "#f0f0f0" }}>{label} →</div>
      {desc && <div style={{ fontSize: 14, color: "#888", marginTop: 3, lineHeight: 1.4 }}>{desc}</div>}
    </button>
  );
}

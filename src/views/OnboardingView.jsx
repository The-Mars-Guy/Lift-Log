import { useState } from "react";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_DAYS = ["Mon", "Wed", "Fri"];

export default function OnboardingView({ onComplete, accent = "#4ade80" }) {
  const [step, setStep] = useState(0); // 0 = basics, 1 = schedule
  const [age,    setAge]    = useState("");
  const [feet,   setFeet]   = useState("");
  const [inches, setInches] = useState("");
  const [weight, setWeight] = useState("");
  const [sex,    setSex]    = useState("");
  const [days,   setDays]   = useState(DEFAULT_DAYS);

  const heightIn = feet || inches
    ? (Number(feet) || 0) * 12 + (Number(inches) || 0)
    : "";

  const step0Valid = age && heightIn && weight && sex;
  const step1Valid = days.length > 0;

  const toggleDay = (d) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const finish = () => {
    onComplete({
      profile: { age, heightIn: String(heightIn), weightLb: weight, sex },
      workoutDays: days,
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "32px 24px",
      background: "#050505",
      color: "#f0f0f0",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 56,
          letterSpacing: ".06em",
          lineHeight: .88,
          color: "#fafafa",
        }}>LIFT LOG</div>
        <div style={{ fontSize: 14, color: "#999", marginTop: 10, lineHeight: 1.5 }}>
          {step === 0
            ? "Tell us a few basics so we can personalize your workouts."
            : "Pick the days you plan to train each week."}
        </div>
      </div>

      {step === 0 && (
        <div style={{ display: "grid", gap: 18 }}>
          {/* Age */}
          <Field label="Age">
            <input
              type="number" inputMode="numeric" min="10" max="99"
              value={age} onChange={e => setAge(e.target.value)}
              placeholder="e.g. 34"
              style={inputStyle}
            />
          </Field>

          {/* Height */}
          <Field label="Height">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <input
                  type="number" inputMode="numeric" min="4" max="7"
                  value={feet} onChange={e => setFeet(e.target.value)}
                  placeholder="5"
                  style={inputStyle}
                />
                <span style={unitStyle}>ft</span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="number" inputMode="numeric" min="0" max="11"
                  value={inches} onChange={e => setInches(e.target.value)}
                  placeholder="8"
                  style={inputStyle}
                />
                <span style={unitStyle}>in</span>
              </div>
            </div>
          </Field>

          {/* Weight */}
          <Field label="Body Weight">
            <div style={{ position: "relative" }}>
              <input
                type="number" inputMode="decimal" min="50" max="600"
                value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 185"
                style={inputStyle}
              />
              <span style={unitStyle}>lb</span>
            </div>
          </Field>

          {/* Sex */}
          <Field label="Sex">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[["male", "Male"], ["female", "Female"], ["", "Prefer not to say"]].map(([key, label]) => (
                <button
                  key={label}
                  onClick={() => setSex(key)}
                  style={{
                    padding: "12px 6px",
                    borderRadius: 10,
                    border: `1.5px solid ${sex === key ? accent : "#2a2a2a"}`,
                    background: sex === key ? `${accent}22` : "#101010",
                    color: sex === key ? accent : "#aaa",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={() => setStep(1)}
            disabled={!step0Valid}
            style={{
              marginTop: 8,
              padding: "16px",
              borderRadius: 12,
              border: "none",
              background: step0Valid ? accent : "#1e1e1e",
              color: step0Valid ? "#050505" : "#555",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 22,
              letterSpacing: ".08em",
              cursor: step0Valid ? "pointer" : "default",
            }}
          >
            NEXT →
          </button>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
          }}>
            {ALL_DAYS.map(d => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  style={{
                    padding: "14px 4px",
                    borderRadius: 10,
                    border: `1.5px solid ${active ? accent : "#2a2a2a"}`,
                    background: active ? `${accent}22` : "#101010",
                    color: active ? accent : "#555",
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
            {days.length === 0
              ? "Pick at least one day."
              : `${days.length} day${days.length > 1 ? "s" : ""} selected`}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 8 }}>
            <button
              onClick={() => setStep(0)}
              style={{
                padding: "16px",
                borderRadius: 12,
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#888",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ← BACK
            </button>
            <button
              onClick={finish}
              disabled={!step1Valid}
              style={{
                padding: "16px",
                borderRadius: 12,
                border: "none",
                background: step1Valid ? accent : "#1e1e1e",
                color: step1Valid ? "#050505" : "#555",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 22,
                letterSpacing: ".08em",
                cursor: step1Valid ? "pointer" : "default",
              }}
            >
              GET STARTED
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        color: "#888",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        fontWeight: 800,
        marginBottom: 8,
      }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#101010",
  border: "1px solid #2a2a2a",
  borderRadius: 10,
  color: "#f0f0f0",
  padding: "14px 14px",
  fontSize: 18,
  fontWeight: 700,
  outline: "none",
};

const unitStyle = {
  position: "absolute",
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: 12,
  color: "#666",
  pointerEvents: "none",
};

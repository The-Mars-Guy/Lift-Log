// src/views/OnboardingView.jsx
// Redesigned onboarding wizard — 7 steps matching app's UX direction

import { useMemo, useState } from "react";
import {
  DayPill,
  MultiSelectCard,
  OnboardingScreen,
  onboardingTokens,
} from "./onboarding/OnboardingPrimitives.jsx";

const ALL_DAYS    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_DAYS = ["Mon", "Wed", "Fri"];

const STEPS = ["location", "goal", "results", "experience", "profile", "mode", "days"];

// ─── Data ──────────────────────────────────────────────────────────────────────

const LOCATION_OPTIONS = [
  { k: "gym",  label: "Gym",  icon: "🏋️", desc: "Full equipment, barbells, and machines" },
  { k: "home", label: "Home", icon: "🏠", desc: "Dumbbells, bands, and bodyweight" },
  { k: "both", label: "Both", icon: "⚡", desc: "Switch between gym and home" },
];

const GOAL_OPTIONS = [
  { k: "hypertrophy",      icon: "💪", label: "Build Muscle & Size",      desc: "Volume-focused training with compound and isolation exercises." },
  { k: "strength",         icon: "🏆", label: "Increase Strength",        desc: "Low reps, heavy weight, maximizing strength on big lifts." },
  { k: "fatigue_friendly", icon: "🔥", label: "Lose Weight & Tone",       desc: "Resistance training and metabolic work to burn fat while building muscle." },
  { k: "general",          icon: "💚", label: "Get Fitter & Feel Healthy", desc: "Balance mobility, cardiovascular health, and functional strength." },
];

const RESULTS_OPTIONS = [
  "Relieve Stress",
  "Improve Sleep Quality",
  "Increase Energy",
  "Active Aging / Longevity",
  "Increase Confidence",
  "Aesthetics",
  "Improve Balance",
  "Improve Posture",
  "Increase Agility",
];

const EXPERIENCE_OPTIONS = [
  { k: "new",       label: "New to lifting",   desc: "Just starting — I want guidance on form and basics." },
  { k: "returning", label: "Coming back",      desc: "I've trained before but took time off." },
  { k: "trained",   label: "Trained 1+ year", desc: "Consistent training, know the fundamentals." },
];

const MODE_OPTIONS = [
  { k: "guided", icon: "🤖", label: "Plan everything for me",      desc: "Coach auto-plans workouts and applies suggestions. Just show up." },
  { k: "hybrid", icon: "⚙️", label: "Plan the workouts I don't",  desc: "Coach fills gaps in your plan and gives recommendations." },
  { k: "manual", icon: "🎮", label: "I'll plan all my workouts",   desc: "Full access: routine builder, all coach settings, manual control." },
];

const GOAL_MAP = {
  hypertrophy:      "hypertrophy",
  strength:         "strength",
  fatigue_friendly: "fatigue_friendly",
  general:          "general",
};

const EQUIP_MAP = {
  gym:  "gym_access",
  home: "fixed_dumbbells",
  both: "adjustable_dumbbells",
};

const MODE_SETTINGS_MAP = {
  guided: { scienceCoach: true, beginnerFormMode: true,  coachStyle: "balanced"   },
  hybrid: { scienceCoach: true, beginnerFormMode: false, coachStyle: "balanced"   },
  manual: { scienceCoach: true, beginnerFormMode: false, coachStyle: "aggressive" },
};

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function OnboardingView({ onComplete }) {
  const [step, setStep] = useState(0);

  // Step states
  const [location,   setLocation]   = useState("");
  const [goal,       setGoal]       = useState("");
  const [results,    setResults]    = useState([]);
  const [experience, setExperience] = useState("");
  const [age,        setAge]        = useState("");
  const [feet,       setFeet]       = useState("");
  const [inches,     setInches]     = useState("");
  const [weight,     setWeight]     = useState("");
  const [sex,        setSex]        = useState("");
  const [mode,       setMode]       = useState("");
  const [days,       setDays]       = useState(DEFAULT_DAYS);

  const heightIn = useMemo(() => (
    feet || inches ? (Number(feet) || 0) * 12 + (Number(inches) || 0) : ""
  ), [feet, inches]);

  const total  = STEPS.length;
  const key    = STEPS[step];

  const canContinue = (() => {
    if (key === "location")   return !!location;
    if (key === "goal")       return !!goal;
    if (key === "results")    return results.length > 0;
    if (key === "experience") return !!experience;
    if (key === "profile")    return !!(age && heightIn && weight);
    if (key === "mode")       return !!mode;
    if (key === "days")       return days.length > 0;
    return true;
  })();

  const next = () => {
    if (step < total - 1) setStep(s => s + 1);
    else finish();
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  // Auto-advance after selection on single-choice steps
  const chooseThenNext = (fn) => {
    fn();
    window.setTimeout(() => setStep(s => Math.min(total - 1, s + 1)), 160);
  };

  const finish = () => {
    onComplete({
      profile: {
        age,
        heightIn: String(heightIn || ""),
        weightLb: weight,
        sex,
        trainingExperience: experience,
        mobility: "normal",
        limitations: [],
        focusAreas: results,
      },
      workoutDays: days,
      selfTest: null,
      settingsOverrides: {
        trainingGoal:     GOAL_MAP[goal]  || "general",
        equipmentProfile: EQUIP_MAP[location] || "fixed_dumbbells",
        ...(MODE_SETTINGS_MAP[mode] || {}),
      },
    });
  };

  const ctaLabel = key === "days" ? "Start training" : "Continue";

  const common = {
    step,
    total,
    onBack: back,
    canBack: step > 0,
    cta: ["location", "goal", "experience", "mode"].includes(key) ? null : ctaLabel,
    ctaDisabled: !canContinue,
    onCta: next,
  };

  // ── Location ──────────────────────────────────────────────────────────────
  if (key === "location") {
    return (
      <OnboardingScreen {...common} title="Where do you exercise?">
        <div style={{ display: "grid", gap: 14 }}>
          {LOCATION_OPTIONS.map(opt => (
            <LocationCard
              key={opt.k}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
              selected={location === opt.k}
              onClick={() => chooseThenNext(() => setLocation(opt.k))}
            />
          ))}
        </div>
      </OnboardingScreen>
    );
  }

  // ── Goal ──────────────────────────────────────────────────────────────────
  if (key === "goal") {
    return (
      <OnboardingScreen {...common} title="What is your primary goal?">
        <div style={{ display: "grid", gap: 14 }}>
          {GOAL_OPTIONS.map(opt => (
            <GoalCard
              key={opt.k}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
              selected={goal === opt.k}
              onClick={() => chooseThenNext(() => setGoal(opt.k))}
            />
          ))}
        </div>
      </OnboardingScreen>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (key === "results") {
    return (
      <OnboardingScreen {...common} title="What results do you want to achieve?" subtitle="Select any that are important to you">
        <div style={{ display: "grid", gap: 12 }}>
          {RESULTS_OPTIONS.map(label => (
            <MultiSelectCard
              key={label}
              label={label}
              selected={results.includes(label)}
              onClick={() => setResults(prev =>
                prev.includes(label) ? prev.filter(r => r !== label) : [...prev, label]
              )}
            />
          ))}
        </div>
      </OnboardingScreen>
    );
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (key === "experience") {
    return (
      <OnboardingScreen {...common} title="What's your training experience?">
        <div style={{ display: "grid", gap: 14 }}>
          {EXPERIENCE_OPTIONS.map(opt => (
            <GoalCard
              key={opt.k}
              label={opt.label}
              desc={opt.desc}
              selected={experience === opt.k}
              onClick={() => chooseThenNext(() => setExperience(opt.k))}
            />
          ))}
        </div>
      </OnboardingScreen>
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  if (key === "profile") {
    return (
      <OnboardingScreen {...common} title="Tell us a bit about yourself">
        <div style={{ background: "#fff", borderRadius: 24, boxShadow: onboardingTokens.shadow, overflow: "hidden" }}>
          <ProfileRow label="Height">
            <NumberInput value={feet}   onChange={setFeet}   placeholder="5"   suffix="ft" />
            <NumberInput value={inches} onChange={setInches} placeholder="10"  suffix="in" />
          </ProfileRow>
          <ProfileRow label="Age">
            <NumberInput value={age} onChange={setAge} placeholder="28" />
          </ProfileRow>
          <ProfileRow label="Weight (lbs)">
            <NumberInput value={weight} onChange={setWeight} placeholder="140" />
          </ProfileRow>
          <ProfileRow label="Sex" last>
            {[["male","Male"],["female","Female"],["","Skip"]].map(([val, lbl]) => (
              <button key={lbl} onClick={() => setSex(val)} style={{
                padding: "12px 14px",
                borderRadius: 999,
                border: `2px solid ${sex === val ? onboardingTokens.accent : "#dedee0"}`,
                background: sex === val ? onboardingTokens.accent : "#fff",
                color: sex === val ? "#fff" : onboardingTokens.text,
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
              }}>{lbl}</button>
            ))}
          </ProfileRow>
        </div>
        <HelperText>
          Age, height, and weight help calibrate starting targets. You can edit this later.
        </HelperText>
      </OnboardingScreen>
    );
  }

  // ── Mode ──────────────────────────────────────────────────────────────────
  if (key === "mode") {
    return (
      <OnboardingScreen {...common} title="How do you want your workouts planned?">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 8 }}>
          {MODE_OPTIONS.map(opt => (
            <ModeCircle
              key={opt.k}
              icon={opt.icon}
              label={opt.label}
              selected={mode === opt.k}
              onClick={() => chooseThenNext(() => setMode(opt.k))}
            />
          ))}
        </div>
        <HelperText>You can change this anytime in Settings.</HelperText>
      </OnboardingScreen>
    );
  }

  // ── Days ──────────────────────────────────────────────────────────────────
  return (
    <OnboardingScreen {...common} title="When can you exercise?">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingBottom: 20 }}>
        {ALL_DAYS.map(day => (
          <DayPill
            key={day}
            active={days.includes(day)}
            onClick={() => setDays(prev =>
              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
            )}
          >{day}</DayPill>
        ))}
      </div>
      <HelperText>
        Pick any days that work. We'll use this to shape your weekly plan.
      </HelperText>
    </OnboardingScreen>
  );
}

// ─── Local components ─────────────────────────────────────────────────────────

function LocationCard({ icon, label, desc, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%",
      padding: "20px 22px",
      borderRadius: 22,
      border: `3px solid ${selected ? onboardingTokens.accent : "transparent"}`,
      background: onboardingTokens.surface,
      boxShadow: selected ? "none" : onboardingTokens.shadow,
      display: "flex",
      alignItems: "center",
      gap: 18,
      textAlign: "left",
      cursor: "pointer",
    }}>
      <span style={{
        width: 58, height: 58,
        borderRadius: "50%",
        background: selected ? onboardingTokens.accent : "#e8f0fe",
        display: "grid",
        placeItems: "center",
        fontSize: 26,
        flexShrink: 0,
      }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: onboardingTokens.text, lineHeight: 1.15 }}>{label}</div>
        <div style={{ fontSize: 16, color: onboardingTokens.muted, marginTop: 4, lineHeight: 1.35 }}>{desc}</div>
      </div>
    </button>
  );
}

function GoalCard({ icon, label, desc, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%",
      padding: "16px 20px",
      borderRadius: 22,
      border: `3px solid ${selected ? onboardingTokens.accent : "transparent"}`,
      background: onboardingTokens.surface,
      boxShadow: selected ? "none" : onboardingTokens.shadow,
      display: "flex",
      alignItems: "center",
      gap: 16,
      textAlign: "left",
      cursor: "pointer",
    }}>
      {icon && (
        <span style={{
          width: 52, height: 52,
          borderRadius: "50%",
          background: selected ? onboardingTokens.accent : "#e8f0fe",
          display: "grid",
          placeItems: "center",
          fontSize: 24,
          flexShrink: 0,
        }}>{icon}</span>
      )}
      <div style={{ flex: 1, borderLeft: `4px solid ${selected ? onboardingTokens.accent : "#e0e0e2"}`, paddingLeft: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: onboardingTokens.text, lineHeight: 1.2 }}>{label}</div>
        {desc && <div style={{ fontSize: 14, color: onboardingTokens.muted, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>}
      </div>
    </button>
  );
}

function ModeCircle({ icon, label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: "none",
      background: "transparent",
      display: "grid",
      justifyItems: "center",
      gap: 14,
      textAlign: "center",
      cursor: "pointer",
    }}>
      <span style={{
        width: "min(28vw, 110px)",
        height: "min(28vw, 110px)",
        borderRadius: "50%",
        background: selected ? onboardingTokens.accent : "#00558e",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: "min(8vw, 34px)",
        boxShadow: selected ? `0 12px 28px ${onboardingTokens.accent}55` : "0 8px 18px rgba(0,0,0,.12)",
        transition: "all 0.2s",
      }}>{icon}</span>
      <span style={{
        fontSize: 15, lineHeight: 1.2,
        fontWeight: 900,
        color: selected ? onboardingTokens.accent : onboardingTokens.text,
      }}>{label}</span>
    </button>
  );
}

function ProfileRow({ label, children, last = false }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(128px, 1fr) 1.3fr",
      gap: 12,
      alignItems: "center",
      minHeight: 82,
      padding: "0 16px",
      borderBottom: last ? "none" : "1px solid #e3e3e5",
    }}>
      <div style={{ fontSize: 24, fontWeight: 950, color: onboardingTokens.text }}>{label}</div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, suffix }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type="number"
        inputMode="numeric"
        style={{
          width: suffix ? 54 : 96,
          border: "none",
          outline: "none",
          background: "transparent",
          color: onboardingTokens.text,
          fontSize: 25,
          fontWeight: 950,
          textAlign: "right",
        }}
      />
      {suffix && <span style={{ fontSize: 21, color: onboardingTokens.text }}>{suffix}</span>}
    </label>
  );
}

function HelperText({ children }) {
  return (
    <div style={{
      marginTop: 34,
      paddingLeft: 18,
      borderLeft: "4px solid #dedee0",
      color: onboardingTokens.muted,
      fontSize: 20,
      lineHeight: 1.4,
    }}>{children}</div>
  );
}

// src/views/OnboardingView.jsx
// Gym Forged onboarding — original questions, forge theme

import { useEffect, useMemo, useState } from "react";
import {
  DayPill,
  MultiSelectCard,
  OnboardingScreen,
  onboardingTokens,
} from "./onboarding/OnboardingPrimitives.jsx";

const ALL_DAYS     = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_DAYS = ["Mon", "Wed", "Fri"];

const STEPS = ["forge", "ambition", "drives", "iron", "profile", "intensity", "plan", "days", "ready"];

// ─── Data ──────────────────────────────────────────────────────────────────────

const FORGE_OPTIONS = [
  { k: "gym",  label: "Full Gym",     icon: "🏋️", desc: "Barbells, machines, cables — the full iron room" },
  { k: "home", label: "Home Setup",   icon: "🔨", desc: "Dumbbells, bands, and bodyweight essentials" },
  { k: "both", label: "Both",         icon: "⚡", desc: "Flexible — train wherever the session lands" },
];

const AMBITION_OPTIONS = [
  { k: "hypertrophy",      icon: "🔥", label: "Forge Mass",       desc: "Volume-driven training to build size and density." },
  { k: "strength",         icon: "⚒️", label: "Raw Power",        desc: "Heavy iron, low reps, maximum strength on the big lifts." },
  { k: "fatigue_friendly", icon: "🗡️", label: "Lean & Sharp",     desc: "Cut fat and build definition through resistance and metabolic work." },
  { k: "general",          icon: "🛡️", label: "Stay in the Game", desc: "Long-term health, mobility, and functional strength." },
];

const DRIVES_OPTIONS = [
  "Burn off stress",
  "Sleep deeper",
  "More energy through the day",
  "Long-term health & longevity",
  "Build self-confidence",
  "Transform my physique",
  "Move better, stay injury-free",
  "Improve my posture",
  "Gain a competitive edge",
];

const IRON_OPTIONS = [
  { k: "new",       label: "Just starting out", desc: "New to the weight room — I want to learn movement first." },
  { k: "returning", label: "Getting back in",   desc: "I've trained before but stepped away for a while." },
  { k: "trained",   label: "Battle-tested",     desc: "Consistent training for a year or more — I know my way around." },
];

const INTENSITY_OPTIONS = [
  { k: "easy",   icon: "🌡️", label: "Build the habit", desc: "Consistency first, intensity second." },
  { k: "steady", icon: "⚙️", label: "Steady grind",    desc: "Progressive challenge — push when ready, recover when needed." },
  { k: "hard",   icon: "🔥", label: "No mercy",        desc: "High output every session. Max effort, max adaptation." },
];

const PLAN_OPTIONS = [
  { k: "guided", icon: "🤖", label: "Forge it for me",    desc: "Coach builds and adjusts everything automatically. Just show up and lift." },
  { k: "hybrid", icon: "⚙️", label: "Fill my gaps",       desc: "You plan what you know, coach handles the rest." },
  { k: "manual", icon: "🎮", label: "I run my forge",     desc: "Full manual control. Routine builder and all settings unlocked." },
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

const INTENSITY_MAP = {
  easy:   "balanced",
  steady: "balanced",
  hard:   "aggressive",
};

const MODE_SETTINGS_MAP = {
  guided: { scienceCoach: true, beginnerFormMode: true  },
  hybrid: { scienceCoach: true, beginnerFormMode: false },
  manual: { scienceCoach: true, beginnerFormMode: false },
};

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function OnboardingView({ onComplete }) {
  const [step, setStep] = useState(0);

  // Step states
  const [location,   setLocation]   = useState("");
  const [goal,       setGoal]       = useState("");
  const [drives,     setDrives]     = useState([]);
  const [experience, setExperience] = useState("");
  const [age,        setAge]        = useState("");
  const [feet,       setFeet]       = useState("");
  const [inches,     setInches]     = useState("");
  const [weight,     setWeight]     = useState("");
  const [sex,        setSex]        = useState("");
  const [intensity,  setIntensity]  = useState("");
  const [mode,       setMode]       = useState("");
  const [days,       setDays]       = useState(DEFAULT_DAYS);
  const [readyCard,  setReadyCard]  = useState(0);

  const heightIn = useMemo(() => (
    feet || inches ? (Number(feet) || 0) * 12 + (Number(inches) || 0) : ""
  ), [feet, inches]);

  const total = STEPS.length;
  const key   = STEPS[step];
  useEffect(() => { if (key === "ready") setReadyCard(0); }, [key]);

  const canContinue = (() => {
    if (key === "forge")     return !!location;
    if (key === "ambition")  return !!goal;
    if (key === "drives")    return drives.length > 0;
    if (key === "iron")      return !!experience;
    if (key === "profile")   return !!(age && heightIn && weight);
    if (key === "intensity") return !!intensity;
    if (key === "plan")      return !!mode;
    if (key === "days")      return days.length > 0;
    if (key === "ready")     return true;
    return true;
  })();

  const next = () => {
    if (step < total - 1) setStep(s => s + 1);
    else finish();
  };
  const back = () => setStep(s => Math.max(0, s - 1));

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
        focusAreas: drives,
      },
      workoutDays: days,
      selfTest: null,
      settingsOverrides: {
        trainingGoal:     GOAL_MAP[goal]          || "general",
        equipmentProfile: EQUIP_MAP[location]     || "fixed_dumbbells",
        coachStyle:       INTENSITY_MAP[intensity] || "balanced",
        ...(MODE_SETTINGS_MAP[mode] || {}),
      },
    });
  };

  const ctaLabel = key === "ready" && readyCard === 2 ? "Enter the forge" : "Continue";

  const common = {
    step,
    total,
    onBack: back,
    canBack: step > 0,
    cta: ["forge", "ambition", "iron", "intensity", "plan"].includes(key) ? null : ctaLabel,
    ctaDisabled: !canContinue,
    onCta: next,
  };

  // ── Forge (location) ──────────────────────────────────────────────────────
  if (key === "forge") {
    return (
      <OnboardingScreen {...common} title="Where do you train?">
        <div style={{ display: "grid", gap: 14 }}>
          {FORGE_OPTIONS.map(opt => (
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

  // ── Ambition (goal) ───────────────────────────────────────────────────────
  if (key === "ambition") {
    return (
      <OnboardingScreen {...common} title="What are you forging?">
        <div style={{ display: "grid", gap: 14 }}>
          {AMBITION_OPTIONS.map(opt => (
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

  // ── Drives (focusAreas) ───────────────────────────────────────────────────
  if (key === "drives") {
    return (
      <OnboardingScreen {...common} title="What drives you to train?" subtitle="Pick as many as apply">
        <div style={{ display: "grid", gap: 12 }}>
          {DRIVES_OPTIONS.map(label => (
            <MultiSelectCard
              key={label}
              label={label}
              selected={drives.includes(label)}
              onClick={() => setDrives(prev =>
                prev.includes(label) ? prev.filter(r => r !== label) : [...prev, label]
              )}
            />
          ))}
        </div>
      </OnboardingScreen>
    );
  }

  // ── Iron (experience) ─────────────────────────────────────────────────────
  if (key === "iron") {
    return (
      <OnboardingScreen {...common} title="How long under the iron?">
        <div style={{ display: "grid", gap: 14 }}>
          {IRON_OPTIONS.map(opt => (
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
      <OnboardingScreen {...common} title="Set your baseline">
        <div style={{ background: onboardingTokens.surface, border: `1px solid ${onboardingTokens.border}`, borderRadius: 24, boxShadow: onboardingTokens.shadow, overflow: "hidden" }}>
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
          <div style={{padding:"14px 16px"}}>
            <div style={{fontSize:18,fontWeight:900,color:onboardingTokens.text,marginBottom:10}}>Sex</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[["male","Male"],["female","Female"],["","Skip"]].map(([val, lbl]) => (
                <button key={lbl} onClick={() => setSex(val)} style={{
                  padding: "12px 6px",
                  borderRadius: 999,
                  border: `2px solid ${sex === val ? onboardingTokens.accent : onboardingTokens.border}`,
                  background: sex === val ? onboardingTokens.accent : onboardingTokens.surfaceHi,
                  color: sex === val ? onboardingTokens.accentFg : onboardingTokens.text,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  minWidth: 0,
                }}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>
        <HelperText>
          Used to calibrate starting load targets. You can edit this anytime.
        </HelperText>
      </OnboardingScreen>
    );
  }

  // ── Intensity ─────────────────────────────────────────────────────────────
  if (key === "intensity") {
    return (
      <OnboardingScreen {...common} title="How hard do you want to push?">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 8 }}>
          {INTENSITY_OPTIONS.map(opt => (
            <ModeCircle
              key={opt.k}
              icon={opt.icon}
              label={opt.label}
              selected={intensity === opt.k}
              onClick={() => chooseThenNext(() => setIntensity(opt.k))}
            />
          ))}
        </div>
        <HelperText>Sets how aggressively the coach pushes load and volume. Adjustable later.</HelperText>
      </OnboardingScreen>
    );
  }

  // ── Plan (mode) ───────────────────────────────────────────────────────────
  if (key === "plan") {
    return (
      <OnboardingScreen {...common} title="How hands-on do you want to be?">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 8 }}>
          {PLAN_OPTIONS.map(opt => (
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

  // ── Ready (feature carousel) ──────────────────────────────────────────────
  if (key === "ready") {
    const READY_CARDS = [
      {
        title: "The iron bends to your recovery.",
        preview: (
          <DarkPreview>
            <PreviewLabel>Today's Session</PreviewLabel>
            <div style={{fontSize:13,color:onboardingTokens.accent,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Recovery Session</div>
            <div style={{fontSize:12,color:onboardingTokens.muted,marginBottom:14}}>Energy is low — volume adjusted automatically.</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[{m:"Quads",s:"✗",c:"#fb7185"},{m:"Chest",s:"~",c:"#dd6518"},{m:"Back",s:"✓",c:"#4ade80"}].map(({m,s,c})=>(
                <span key={m} style={{fontSize:11,color:c,border:`1px solid ${c}44`,borderRadius:20,padding:"3px 9px",background:`${c}10`,letterSpacing:".08em",textTransform:"uppercase"}}>{m} {s}</span>
              ))}
            </div>
          </DarkPreview>
        ),
        helper: "Rep targets, set counts, and load shift automatically based on your recovery — no manual config needed.",
      },
      {
        title: "Every target has a reason behind it.",
        preview: (
          <DarkPreview>
            <PreviewLabel>Set 1 of 3</PreviewLabel>
            <div style={{fontSize:15,color:onboardingTokens.text,fontWeight:600,marginBottom:2}}>Bench Press</div>
            <div style={{fontSize:12,color:onboardingTokens.muted,marginBottom:10}}>Target · 10 reps</div>
            <div style={{fontSize:12,color:"#b4cae8",lineHeight:1.45}}>Reduced — recent sets were logged as hard effort.</div>
          </DarkPreview>
        ),
        helper: "Every rep recommendation includes a one-line explanation. You always know why, not just what.",
      },
      {
        title: "After each session, the forge reports back.",
        preview: (
          <DarkPreview>
            <PreviewLabel>Session Debrief</PreviewLabel>
            {[
              { icon:"↑", col:"#b4cae8", text:"Strength trending up on Bench Press." },
              { icon:"↓", col:"#dd6518", text:"Fatigue built fast on Squat — watch volume." },
              { icon:"✓", col:"#4ade80", text:"Session stayed within recovery targets." },
            ].map((b,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<2?8:0}}>
                <span style={{fontSize:12,color:b.col,fontWeight:700,minWidth:14,lineHeight:1.55}}>{b.icon}</span>
                <span style={{fontSize:13,color:onboardingTokens.muted,lineHeight:1.55}}>{b.text}</span>
              </div>
            ))}
          </DarkPreview>
        ),
        helper: "Strength gains, fatigue signals, and recovery patterns — summarized automatically after every workout.",
      },
    ];

    const card      = READY_CARDS[readyCard];
    const readyCta  = () => { if (readyCard < 2) setReadyCard(c => c + 1); else next(); };
    const readyBack = () => { if (readyCard > 0) setReadyCard(c => c - 1); else back(); };

    return (
      <OnboardingScreen {...common} title={card.title} onBack={readyBack} cta={ctaLabel} onCta={readyCta}>
        {card.preview}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:4}}>
          {READY_CARDS.map((_,i) => (
            <div key={i} style={{
              width: i === readyCard ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: i === readyCard ? onboardingTokens.accent : onboardingTokens.faint,
              transition: "all .2s",
            }} />
          ))}
        </div>
        <HelperText>{card.helper}</HelperText>
      </OnboardingScreen>
    );
  }

  // ── Days ──────────────────────────────────────────────────────────────────
  return (
    <OnboardingScreen {...common} title="Which days do you train?">
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
        Pick any days that work — your weekly plan shapes around them.
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
        background: selected ? onboardingTokens.accent : onboardingTokens.surfaceHi,
        display: "grid",
        placeItems: "center",
        fontSize: 24,
        flexShrink: 0,
      }}>{icon}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: onboardingTokens.text, lineHeight: 1.18 }}>{label}</div>
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
          background: selected ? onboardingTokens.accent : onboardingTokens.surfaceHi,
          display: "grid",
          placeItems: "center",
          fontSize: 24,
          flexShrink: 0,
        }}>{icon}</span>
      )}
      <div style={{ flex: 1, borderLeft: `4px solid ${selected ? onboardingTokens.accent : onboardingTokens.border}`, paddingLeft: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: onboardingTokens.text, lineHeight: 1.2 }}>{label}</div>
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
        background: selected ? onboardingTokens.accent : onboardingTokens.surfaceHi,
        color: selected ? onboardingTokens.accentFg : onboardingTokens.text,
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

function ProfileRow({ label, children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(128px, 1fr) 1.3fr",
      gap: 12,
      alignItems: "center",
      minHeight: 72,
      padding: "0 16px",
      borderBottom: `1px solid ${onboardingTokens.border}`,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: onboardingTokens.text }}>{label}</div>
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
          fontSize: 22,
          fontWeight: 700,
          textAlign: "right",
        }}
      />
      {suffix && <span style={{ fontSize: 18, color: onboardingTokens.muted }}>{suffix}</span>}
    </label>
  );
}

function DarkPreview({ children }) {
  return (
    <div style={{
      background: onboardingTokens.surfaceHi,
      borderRadius: 16,
      padding: "16px 18px",
      marginBottom: 28,
      border: `1px solid ${onboardingTokens.border}`,
    }}>
      {children}
    </div>
  );
}

function PreviewLabel({ children }) {
  return (
    <div style={{fontSize:11,color:onboardingTokens.muted,fontWeight:600,marginBottom:8}}>
      {children}
    </div>
  );
}

function HelperText({ children }) {
  return (
    <div style={{
      marginTop: 34,
      paddingLeft: 18,
      borderLeft: `4px solid ${onboardingTokens.accent}`,
      color: onboardingTokens.muted,
      fontSize: 16,
      lineHeight: 1.45,
    }}>{children}</div>
  );
}

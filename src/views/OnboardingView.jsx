import { useMemo, useState } from "react";
import {
  AnswerGrid,
  DayPill,
  ExerciseImageCard,
  ImageOptionCard,
  MultiSelectCard,
  OnboardingScreen,
  OptionCard,
  QuoteCard,
  onboardingTokens,
} from "./onboarding/OnboardingPrimitives.jsx";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_DAYS = ["Mon", "Wed", "Fri"];

const FOCUS_OPTIONS = [
  "Visible Abs",
  "Defined Chest",
  "Big Arms",
  "Broad Shoulders",
  "Wide Back",
  "Strong Legs",
];

const TESTS = {
  plank: {
    title:"How long can you hold a plank?",
    emphasis:"plank",
    subtitle:"Choose your maximum time without resting.",
    folder:"Crunches",
    options:[
      { value:"low", label:"Less than 30 s", score:20 },
      { value:"mid", label:"30-60 s", score:45 },
      { value:"high", label:"More than 1 min", score:75 },
      { value:"unknown", label:"I don't know", score:25 },
    ],
  },
  pushups: {
    title:"How many push-ups can you do?",
    emphasis:"push-ups",
    subtitle:"How many can you do without a break?",
    folder:"Pushups",
    options:[
      { value:"low", label:"Less than 10", score:6 },
      { value:"mid", label:"10-20", score:15 },
      { value:"high", label:"More than 20", score:25 },
      { value:"unknown", label:"I don't know", score:8 },
    ],
  },
  squats: {
    title:"How many squats can you do?",
    emphasis:"squats",
    subtitle:"How many can you do without a break?",
    folder:"Goblet_Squat",
    options:[
      { value:"low", label:"Less than 15", score:10 },
      { value:"mid", label:"15-30", score:22 },
      { value:"high", label:"More than 30", score:35 },
      { value:"unknown", label:"I don't know", score:12 },
    ],
  },
};

export default function OnboardingView({ onComplete }) {
  const [step, setStep] = useState(0);
  const [statement, setStatement] = useState("");
  const [tests, setTests] = useState({ plank:"unknown", pushups:"unknown", squats:"unknown" });
  const [focus, setFocus] = useState([]);
  const [dreamBody, setDreamBody] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [age, setAge] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState("");
  const [weeklyMinutes, setWeeklyMinutes] = useState(150);
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [scheduleMode, setScheduleMode] = useState("");

  const heightIn = useMemo(() => (
    feet || inches ? (Number(feet) || 0) * 12 + (Number(inches) || 0) : ""
  ), [feet, inches]);

  const screens = [
    "statement",
    "plank",
    "pushups",
    "squats",
    "focus",
    "dreamBody",
    "bodyType",
    "profile",
    "schedule",
    "scheduleMode",
  ];
  const total = screens.length;
  const key = screens[step];

  const canContinue = (() => {
    if (key === "statement") return !!statement;
    if (["plank", "pushups", "squats"].includes(key)) return !!tests[key];
    if (key === "focus") return focus.length > 0;
    if (key === "dreamBody") return !!dreamBody;
    if (key === "bodyType") return !!bodyType;
    if (key === "profile") return !!(age && heightIn && weight);
    if (key === "schedule") return days.length > 0;
    if (key === "scheduleMode") return !!scheduleMode;
    return true;
  })();

  const next = () => {
    if (step < total - 1) setStep(s => s + 1);
    else finish();
  };
  const back = () => setStep(s => Math.max(0, s - 1));
  const chooseThenNext = (fn) => {
    fn();
    window.setTimeout(() => setStep(s => Math.min(total - 1, s + 1)), 140);
  };

  const finish = () => {
    const scoreFor = (name) => TESTS[name].options.find(opt => opt.value === tests[name])?.score || null;
    onComplete({
      profile:{
        age,
        heightIn:String(heightIn || ""),
        weightLb:weight,
        sex,
        trainingExperience:statement === "yes" ? "new" : "returning",
        goal:focus.includes("Visible Abs") ? "strength" : "general",
        bodyType,
        dreamBody,
        focusAreas:focus,
        weeklyMinutes,
        scheduleMode,
      },
      workoutDays:days,
      selfTest:{
        plank:scoreFor("plank"),
        pushups:scoreFor("pushups"),
        squats:scoreFor("squats"),
      },
    });
  };

  const common = {
    step,
    total,
    onBack:back,
    canBack:step > 0,
    cta:["statement", "plank", "pushups", "squats", "dreamBody", "bodyType"].includes(key)
      ? null
      : key === "scheduleMode" ? "Start training" : "Continue",
    ctaDisabled:!canContinue,
    onCta:next,
  };

  if (key === "statement") {
    return (
      <OnboardingScreen {...common} title="Do you relate to the following statement?">
        <QuoteCard>I have no idea which workouts are right for me.</QuoteCard>
        <div style={{display:"grid",gap:16}}>
          <OptionCard selected={statement === "yes"} onClick={() => chooseThenNext(() => setStatement("yes"))}>Yes</OptionCard>
          <OptionCard selected={statement === "no"} onClick={() => chooseThenNext(() => setStatement("no"))}>No</OptionCard>
        </div>
      </OnboardingScreen>
    );
  }

  if (["plank", "pushups", "squats"].includes(key)) {
    const test = TESTS[key];
    return (
      <OnboardingScreen {...common} title={test.title} emphasis={test.emphasis} subtitle={test.subtitle}>
        <ExerciseImageCard folder={test.folder} />
        <AnswerGrid options={test.options} value={tests[key]} onChange={value => chooseThenNext(() => setTests(prev => ({ ...prev, [key]:value })))} />
      </OnboardingScreen>
    );
  }

  if (key === "focus") {
    return (
      <OnboardingScreen {...common} title="What do you want to focus on?" subtitle="Choose all that apply">
        <div style={{display:"grid",gap:14}}>
          {FOCUS_OPTIONS.map(label => (
            <MultiSelectCard key={label} label={label} selected={focus.includes(label)} onClick={() => {
              setFocus(prev => prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]);
            }} />
          ))}
        </div>
      </OnboardingScreen>
    );
  }

  if (key === "dreamBody") {
    return (
      <OnboardingScreen {...common} title="What's your dream body shape?">
        <div style={{display:"grid",gap:16}}>
          <ImageOptionCard title="Athletic" tone="athletic" selected={dreamBody === "athletic"} onClick={() => chooseThenNext(() => setDreamBody("athletic"))} />
          <ImageOptionCard title="Balanced" tone="balanced" selected={dreamBody === "balanced"} onClick={() => chooseThenNext(() => setDreamBody("balanced"))} />
          <ImageOptionCard title="Strong" tone="strong" selected={dreamBody === "strong"} onClick={() => chooseThenNext(() => setDreamBody("strong"))} />
        </div>
      </OnboardingScreen>
    );
  }

  if (key === "bodyType") {
    return (
      <OnboardingScreen {...common} title="What's your body type?">
        <div style={{display:"grid",gap:16}}>
          <ImageOptionCard title="Ectomorph" tone="ectomorph" selected={bodyType === "ectomorph"} onClick={() => chooseThenNext(() => setBodyType("ectomorph"))} />
          <ImageOptionCard title="Mesomorph" tone="mesomorph" selected={bodyType === "mesomorph"} onClick={() => chooseThenNext(() => setBodyType("mesomorph"))} />
          <ImageOptionCard title="Endomorph" tone="endomorph" selected={bodyType === "endomorph"} onClick={() => chooseThenNext(() => setBodyType("endomorph"))} />
        </div>
      </OnboardingScreen>
    );
  }

  if (key === "profile") {
    return (
      <OnboardingScreen {...common} title="Tell us a bit about yourself">
        <div style={{background:"#fff",borderRadius:24,boxShadow:onboardingTokens.shadow,overflow:"hidden"}}>
          <ProfileRow label="Height">
            <NumberInput value={feet} onChange={setFeet} placeholder="5" suffix="ft" />
            <NumberInput value={inches} onChange={setInches} placeholder="10" suffix="in" />
          </ProfileRow>
          <ProfileRow label="Age"><NumberInput value={age} onChange={setAge} placeholder="28" /></ProfileRow>
          <ProfileRow label="Weight (lbs)"><NumberInput value={weight} onChange={setWeight} placeholder="140" /></ProfileRow>
          <ProfileRow label="Sex" last>
            {["male", "female", ""].map(value => (
              <button key={value || "any"} onClick={() => setSex(value)} style={{
                padding:"12px 10px",
                borderRadius:999,
                border:`2px solid ${sex === value ? onboardingTokens.accent : "#dedee0"}`,
                background:sex === value ? onboardingTokens.accent : "#fff",
                color:sex === value ? "#fff" : onboardingTokens.text,
                fontWeight:900,
                fontSize:14,
              }}>{value ? value[0].toUpperCase() + value.slice(1) : "Skip"}</button>
            ))}
          </ProfileRow>
        </div>
        <HelperText>Age, height, and weight help estimate safe starting targets. You can edit this later.</HelperText>
      </OnboardingScreen>
    );
  }

  if (key === "schedule") {
    return (
      <OnboardingScreen {...common} title="How long can you exercise each week?">
        <div style={{marginBottom:54}}>
          <div style={{fontSize:27,fontWeight:950,color:"#31d843",marginBottom:22}}>Time per week: {weeklyMinutes} min</div>
          <input
            type="range"
            min="45"
            max="300"
            step="15"
            value={weeklyMinutes}
            onChange={e => setWeeklyMinutes(Number(e.target.value))}
            style={{width:"100%",accentColor:"#31d843"}}
          />
          <div style={{display:"flex",justifyContent:"space-between",fontSize:19,color:onboardingTokens.muted,marginTop:12}}>
            <span>low<br/>effectiveness</span><span>high<br/>efficiency</span><span>low<br/>efficiency</span>
          </div>
        </div>
        <h2 style={{fontSize:34,fontWeight:950,textAlign:"center",margin:"0 0 28px"}}>When can you exercise?</h2>
        <div style={{display:"flex",gap:10,overflowX:"auto",padding:"0 0 20px"}}>
          {ALL_DAYS.map(day => (
            <DayPill key={day} active={days.includes(day)} onClick={() => {
              setDays(prev => prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day]);
            }}>{day}</DayPill>
          ))}
        </div>
        <HelperText>Pick any days that work. We'll use this to shape your weekly plan.</HelperText>
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen {...common} title="How do you want to manage your schedule?">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22,marginTop:10}}>
        <CircleChoice selected={scheduleMode === "auto"} icon="calendar" title="Plan it all for me" onClick={() => setScheduleMode("auto")} />
        <CircleChoice selected={scheduleMode === "manual"} icon="sliders" title="I'll manage my days & time" onClick={() => setScheduleMode("manual")} />
      </div>
      <HelperText>Choose auto for a quick plan, or manage days yourself if your week needs exact control.</HelperText>
    </OnboardingScreen>
  );
}

function ProfileRow({ label, children, last = false }) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"minmax(128px, 1fr) 1.3fr",
      gap:12,
      alignItems:"center",
      minHeight:82,
      padding:"0 16px",
      borderBottom:last ? "none" : "1px solid #e3e3e5",
    }}>
      <div style={{fontSize:24,fontWeight:950,color:onboardingTokens.text}}>{label}</div>
      <div style={{display:"flex",gap:12,justifyContent:"flex-end",alignItems:"center"}}>{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, suffix }) {
  return (
    <label style={{display:"flex",alignItems:"center",gap:7}}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type="number"
        inputMode="numeric"
        style={{
          width:suffix ? 54 : 96,
          border:"none",
          outline:"none",
          background:"transparent",
          color:onboardingTokens.text,
          fontSize:25,
          fontWeight:950,
          textAlign:"right",
        }}
      />
      {suffix && <span style={{fontSize:21,color:onboardingTokens.text}}>{suffix}</span>}
    </label>
  );
}

function HelperText({ children }) {
  return (
    <div style={{
      marginTop:34,
      paddingLeft:18,
      borderLeft:"4px solid #dedee0",
      color:onboardingTokens.muted,
      fontSize:22,
      lineHeight:1.38,
    }}>{children}</div>
  );
}

function CircleChoice({ selected, title, icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      border:"none",
      background:"transparent",
      color:selected ? onboardingTokens.accent : "#00558e",
      display:"grid",
      justifyItems:"center",
      gap:18,
      textAlign:"center",
    }}>
      <span style={{
        width:"min(40vw, 168px)",
        height:"min(40vw, 168px)",
        borderRadius:"50%",
        background:selected ? onboardingTokens.accent : "#00558e",
        color:"#fff",
        display:"grid",
        placeItems:"center",
        boxShadow:"0 12px 24px rgba(0,0,0,.14)",
      }}>
        {icon === "calendar" ? <CalendarIcon /> : <SlidersIcon />}
      </span>
      <span style={{fontSize:25,lineHeight:1.12,fontWeight:950}}>{title}</span>
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg width="66" height="66" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="12" y="14" width="40" height="38" stroke="currentColor" strokeWidth="4"/>
      <path d="M20 8v14M44 8v14M12 26h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="32" cy="39" r="8" stroke="currentColor" strokeWidth="4"/>
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M12 18h40M12 32h40M12 46h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="26" cy="18" r="5" fill="currentColor"/>
      <circle cx="38" cy="32" r="5" fill="currentColor"/>
      <circle cx="30" cy="46" r="5" fill="currentColor"/>
    </svg>
  );
}

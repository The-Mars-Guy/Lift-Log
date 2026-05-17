import { ExerciseAnimation } from "../../components/shared.jsx";

export const onboardingTokens = {
  bg:"#f5f5f5",
  surface:"#ffffff",
  text:"#1f2024",
  muted:"#8a8a8d",
  faint:"#ededee",
  border:"#e7e7ea",
  accent:"#0b84ff",
  disabled:"#d9d9dc",
  radius:24,
  shadow:"0 12px 28px rgba(17,24,39,.06)",
  font:"Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export function OnboardingScreen({
  children,
  step,
  total,
  title,
  subtitle,
  emphasis,
  onBack,
  canBack = true,
  cta,
  ctaDisabled = false,
  onCta,
}) {
  return (
    <div style={{
      minHeight:"100dvh",
      background:onboardingTokens.bg,
      color:onboardingTokens.text,
      fontFamily:onboardingTokens.font,
      display:"flex",
      justifyContent:"center",
      overflowX:"hidden",
    }}>
      <div style={{
        width:"100vw",
        maxWidth:390,
        minHeight:"100dvh",
        position:"relative",
        padding:"34px 20px 132px",
        overflowX:"hidden",
      }}>
        <div style={{height:64,marginBottom:62}}>
          <div style={{position:"fixed",top:34,left:20,zIndex:30,pointerEvents:"auto"}}>
            <BackButton onClick={onBack} disabled={!canBack} />
          </div>
          <div style={{position:"fixed",top:34,left:"calc(min(100vw, 390px) - 78px)",zIndex:30,pointerEvents:"auto"}}>
            <ProgressRing value={(step + 1) / total} />
          </div>
        </div>
        <h1 style={{
          fontSize:"clamp(34px, 9.8vw, 56px)",
          lineHeight:1.08,
          letterSpacing:"0",
          fontWeight:950,
          margin:"0 0 26px",
          color:onboardingTokens.text,
          maxWidth:"100%",
          overflowWrap:"break-word",
          textWrap:"balance",
        }}>
          {renderTitle(title, emphasis)}
        </h1>
        {subtitle && (
          <div style={{fontSize:22,lineHeight:1.35,color:onboardingTokens.muted,margin:"0 0 40px"}}>
            {subtitle}
          </div>
        )}
        {children}
        {cta && (
          <div style={{
            position:"fixed",
            left:0,
            right:0,
            bottom:0,
            padding:"16px 20px calc(18px + env(safe-area-inset-bottom))",
            background:"linear-gradient(180deg,rgba(245,245,245,0),#f5f5f5 28%)",
            display:"flex",
            justifyContent:"center",
            zIndex:20,
          }}>
            <div style={{width:"100%",maxWidth:390}}>
              <PrimaryCTA disabled={ctaDisabled} onClick={onCta}>{cta}</PrimaryCTA>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderTitle(title, emphasis) {
  if (!emphasis || !title.includes(emphasis)) return title;
  const [before, after] = title.split(emphasis);
  return <>{before}<span style={{color:onboardingTokens.accent}}>{emphasis}</span>{after}</>;
}

export function BackButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Back"
      style={{
        width:64,
        height:64,
        borderRadius:"50%",
        border:"none",
        background:disabled ? "transparent" : "#ededee",
        color:onboardingTokens.text,
        display:"grid",
        placeItems:"center",
        opacity:disabled ? 0 : 1,
        pointerEvents:disabled ? "none" : "auto",
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

export function ProgressRing({ value }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div style={{width:58,height:58,display:"grid",placeItems:"center",borderRadius:"50%",background:"#f0f0f0"}}>
      <svg width="58" height="58" viewBox="0 0 58 58" style={{transform:"rotate(-90deg)"}} aria-hidden="true">
        <circle cx="29" cy="29" r={r} fill="none" stroke="#ececee" strokeWidth="7"/>
        <circle cx="29" cy="29" r={r} fill="none" stroke={onboardingTokens.accent} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} />
      </svg>
    </div>
  );
}

export function OptionCard({ selected, children, onClick, compact = false }) {
  return (
    <button onClick={onClick} style={{
      width:"100%",
      maxWidth:"100%",
      minHeight:compact ? 92 : 128,
      padding:"22px 24px",
      borderRadius:onboardingTokens.radius,
      border:`3px solid ${selected ? onboardingTokens.accent : "transparent"}`,
      background:onboardingTokens.surface,
      boxShadow:selected ? "none" : onboardingTokens.shadow,
      color:onboardingTokens.text,
      fontSize:26,
      fontWeight:900,
      textAlign:"left",
      lineHeight:1.18,
    }}>
      {children}
    </button>
  );
}

export function MultiSelectCard({ selected, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:"100%",
      maxWidth:"100%",
      minHeight:104,
      padding:"24px 28px",
      border:"none",
      borderRadius:onboardingTokens.radius,
      background:onboardingTokens.surface,
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      boxShadow:onboardingTokens.shadow,
      color:onboardingTokens.text,
      fontSize:27,
      fontWeight:950,
      textAlign:"left",
    }}>
      <span>{label}</span>
      <span style={{
        width:34,
        height:34,
        borderRadius:"50%",
        border:`4px solid ${selected ? onboardingTokens.accent : "#bebec1"}`,
        background:selected ? onboardingTokens.accent : "transparent",
        display:"grid",
        placeItems:"center",
        color:"#fff",
      }}>
        {selected && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
    </button>
  );
}

export function ImageOptionCard({ selected, title, tone = "athletic", onClick }) {
  return (
    <button onClick={onClick} style={{
      width:"100%",
      maxWidth:"100%",
      height:128,
      borderRadius:22,
      border:`3px solid ${selected ? onboardingTokens.accent : "transparent"}`,
      background:onboardingTokens.surface,
      overflow:"hidden",
      display:"grid",
      gridTemplateColumns:"1fr 42%",
      alignItems:"center",
      boxShadow:selected ? "none" : onboardingTokens.shadow,
      color:onboardingTokens.text,
      textAlign:"left",
    }}>
      <div style={{padding:"0 26px",fontSize:28,fontWeight:950}}>{title}</div>
      <BodyPlaceholder tone={tone} />
    </button>
  );
}

export function AnswerGrid({ options, value, onChange }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {options.map(opt => (
        <OptionCard key={opt.value} selected={value === opt.value} compact onClick={() => onChange(opt.value)}>
          <span style={{display:"block",textAlign:"center",fontSize:24}}>{opt.label}</span>
        </OptionCard>
      ))}
    </div>
  );
}

export function PrimaryCTA({ children, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      width:"100%",
      maxWidth:"100%",
      height:76,
      border:"none",
      borderRadius:38,
      background:disabled ? onboardingTokens.disabled : onboardingTokens.accent,
      color:disabled ? "#a8a8aa" : "#fff",
      fontSize:25,
      fontWeight:950,
      letterSpacing:"0",
      boxShadow:disabled ? "none" : "0 16px 26px rgba(11,132,255,.22)",
    }}>
      {children}
    </button>
  );
}

export function QuoteCard({ children }) {
  return (
    <div style={{
      borderRadius:onboardingTokens.radius,
      background:onboardingTokens.surface,
      padding:"30px 28px",
      boxShadow:onboardingTokens.shadow,
      fontSize:30,
      lineHeight:1.2,
      fontWeight:950,
      color:onboardingTokens.text,
      marginBottom:24,
    }}>
      "{children}"
    </div>
  );
}

export function ExerciseImageCard({ folder, accent }) {
  return (
    <div style={{
      height:"min(42vh, 430px)",
      minHeight:290,
      borderRadius:24,
      background:onboardingTokens.surface,
      boxShadow:onboardingTokens.shadow,
      display:"grid",
      placeItems:"center",
      overflow:"hidden",
      margin:"0 0 18px",
    }}>
      <ExerciseAnimation folder={folder} accent={accent || onboardingTokens.accent} bare compact />
    </div>
  );
}

export function DayPill({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:58,
      height:58,
      borderRadius:"50%",
      border:`2px solid ${active ? "#ffbd73" : "#dedee0"}`,
      background:active ? "#ffbd73" : "#fff",
      color:active ? "#fff" : onboardingTokens.text,
      fontSize:19,
      fontWeight:900,
      flex:"0 0 auto",
    }}>
      {children}
    </button>
  );
}

export function BodyPlaceholder({ tone = "athletic" }) {
  const width = tone === "strong" || tone === "endomorph" ? 76 : tone === "balanced" || tone === "mesomorph" ? 62 : 50;
  const shoulder = tone === "strong" ? 108 : tone === "endomorph" ? 92 : tone === "balanced" || tone === "mesomorph" ? 88 : 70;
  return (
    <div style={{height:"100%",position:"relative",display:"grid",placeItems:"center",background:"linear-gradient(90deg,#fff, #f6f6f7)"}}>
      <div style={{
        width:shoulder,
        height:102,
        borderRadius:"48% 48% 38% 38%",
        background:"linear-gradient(180deg,#f0b489,#d88b63)",
        position:"relative",
        boxShadow:"inset 0 -10px 18px rgba(80,35,20,.12)",
        clipPath:`polygon(${50 - width / 2}% 0, ${50 + width / 2}% 0, 72% 100%, 28% 100%)`,
      }} />
    </div>
  );
}

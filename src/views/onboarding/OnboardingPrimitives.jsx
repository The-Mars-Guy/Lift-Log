export const onboardingTokens = {
  bg:"radial-gradient(ellipse 110% 55% at 50% -5%, rgba(221,101,24,.16) 0%, transparent 65%), radial-gradient(ellipse 60% 20% at 50% 105%, rgba(221,101,24,.08) 0%, transparent 70%), linear-gradient(180deg, #100d09 0%, #030201 100%)",
  bgSolid:"#100d09",
  surface:"#18120d",
  surfaceHi:"#211810",
  text:"#f4efe6",
  muted:"#928574",
  faint:"#2a2016",
  border:"rgba(255,140,50,.12)",
  accent:"#dd6518",
  accentFg:"#0a0604",
  disabled:"#2a2016",
  radius:24,
  shadow:"0 12px 28px rgba(0,0,0,.45)",
  font:"'Barlow', Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
          fontSize:"clamp(24px, 6.6vw, 36px)",
          lineHeight:1.12,
          letterSpacing:"0",
          fontWeight:800,
          margin:"0 0 24px",
          color:onboardingTokens.text,
          maxWidth:"100%",
          overflowWrap:"break-word",
          textWrap:"balance",
        }}>
          {renderTitle(title, emphasis)}
        </h1>
        {subtitle && (
          <div style={{fontSize:17,lineHeight:1.4,color:onboardingTokens.muted,margin:"0 0 36px"}}>
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
            background:"linear-gradient(180deg,rgba(16,13,9,0),#100d09 28%)",
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
        background:disabled ? "transparent" : onboardingTokens.faint,
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
    <div style={{width:58,height:58,display:"grid",placeItems:"center",borderRadius:"50%",background:onboardingTokens.surface}}>
      <svg width="58" height="58" viewBox="0 0 58 58" style={{transform:"rotate(-90deg)"}} aria-hidden="true">
        <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7"/>
        <circle cx="29" cy="29" r={r} fill="none" stroke={onboardingTokens.accent} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} />
      </svg>
    </div>
  );
}

export function MultiSelectCard({ selected, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:"100%",
      maxWidth:"100%",
      minHeight:96,
      padding:"22px 26px",
      borderRadius:onboardingTokens.radius,
      background:onboardingTokens.surface,
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      boxShadow:onboardingTokens.shadow,
      border:`1px solid ${selected ? onboardingTokens.accent : onboardingTokens.border}`,
      color:onboardingTokens.text,
      fontSize:20,
      fontWeight:700,
      textAlign:"left",
    }}>
      <span>{label}</span>
      <span style={{
        width:34,
        height:34,
        borderRadius:"50%",
        border:`4px solid ${selected ? onboardingTokens.accent : onboardingTokens.muted}`,
        background:selected ? onboardingTokens.accent : "transparent",
        display:"grid",
        placeItems:"center",
        color:onboardingTokens.accentFg,
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

export function PrimaryCTA({ children, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      width:"100%",
      maxWidth:"100%",
      height:70,
      border:"none",
      borderRadius:38,
      background:disabled ? onboardingTokens.disabled : onboardingTokens.accent,
      color:disabled ? onboardingTokens.muted : onboardingTokens.accentFg,
      fontSize:22,
      fontWeight:800,
      letterSpacing:".02em",
      boxShadow:disabled ? "none" : "0 14px 26px rgba(221,101,24,.28)",
    }}>
      {children}
    </button>
  );
}

export function DayPill({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:58,
      height:58,
      borderRadius:"50%",
      border:`2px solid ${active ? onboardingTokens.accent : onboardingTokens.border}`,
      background:active ? onboardingTokens.accent : onboardingTokens.surface,
      color:active ? onboardingTokens.accentFg : onboardingTokens.text,
      fontSize:19,
      fontWeight:800,
      flex:"0 0 auto",
    }}>
      {children}
    </button>
  );
}

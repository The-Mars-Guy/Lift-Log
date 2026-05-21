// Centralized SVG icon library — stroke-based, 24×24 viewBox.
// Use <Icon name="hammer" size={20} color="#fff" /> anywhere in the app.

const S = ({ size = 20, color = "currentColor", children, style, ...p }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "inline-block", flexShrink: 0, ...style }}
    {...p}
  >{children}</svg>
);

export const IconHammer      = (p) => <S {...p}><path d="m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3l8.5-8.5"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 5.6a5 5 0 0 0-5.06-1.06L14 8l-1 4 4-1 3.06 3.06c.78.78.78 2.05 0 2.83z"/></S>;
export const IconCrossHammer = (p) => <S {...p}><path d="m9 12-6.5 6.5a2.12 2.12 0 0 0 3 3L12 15"/><path d="m15 12 6.5-6.5a2.12 2.12 0 0 0-3-3L12 9"/><path d="m12 9 3-3m-6 6 3 3"/></S>;
export const IconFlame       = (p) => <S {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></S>;
export const IconBolt        = (p) => <S {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></S>;
export const IconSwords      = (p) => <S {...p}><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="14.5" y1="4" x2="20" y2="9.5"/><line x1="3.5" y1="20.5" x2="16" y2="8"/></S>;
export const IconCrown       = (p) => <S {...p}><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 5l-2 10H5L3 5l4.094 4.164a1 1 0 0 0 1.516-.294z"/><path d="M5 19h14"/></S>;
export const IconTarget      = (p) => <S {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></S>;
export const IconTrendUp     = (p) => <S {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></S>;
export const IconMuscle      = (p) => <S {...p}><path d="M6.5 6.5c1-1 2.5-1.5 4-1.5s3 .5 4 1.5M6.5 6.5c-1 1-1.5 2.5-1.5 4v3a4.5 4.5 0 0 0 9 0v-3c0-1.5-.5-3-1.5-4"/><path d="M12 9v4"/><circle cx="12" cy="5" r="2"/></S>;
export const IconTrophy      = (p) => <S {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></S>;
export const IconSparkle     = (p) => <S {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4m2-2h-4"/></S>;
export const IconMoon        = (p) => <S {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></S>;
export const IconThumbsUp    = (p) => <S {...p}><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></S>;
export const IconAlertStop   = (p) => <S {...p}><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></S>;
export const IconBarbell     = (p) => <S {...p}><path d="M6 5v14M18 5v14"/><path d="M3 8v8M21 8v8"/><path d="M6 12h12"/></S>;
export const IconSword       = (p) => <S {...p}><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/></S>;
export const IconShield      = (p) => <S {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>;
export const IconThermometer = (p) => <S {...p}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></S>;
export const IconGamepad     = (p) => <S {...p}><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></S>;
export const IconRobot       = (p) => <S {...p}><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="2.5"/><line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="2.5"/><path d="M6 11V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></S>;
export const IconCompass     = (p) => <S {...p}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></S>;
export const IconFlask       = (p) => <S {...p}><path d="M14 2v6l3.19 5.5A2 2 0 0 1 15.4 16.5H8.6a2 2 0 0 1-1.79-2.89L10 8V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></S>;
export const IconClock       = (p) => <S {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></S>;
export const IconRefresh     = (p) => <S {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></S>;
export const IconEye         = (p) => <S {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></S>;
export const IconHeart       = (p) => <S {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></S>;
export const IconChart       = (p) => <S {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></S>;
export const IconScale       = (p) => <S {...p}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 21V7"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></S>;
export const IconClipboard   = (p) => <S {...p}><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/></S>;
export const IconSave        = (p) => <S {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></S>;
export const IconLoading     = (p) => <S {...p}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></S>;
export const IconMedal       = (p) => <S {...p}><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></S>;
export const IconCalendar    = (p) => <S {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></S>;
export const IconGear        = (p) => <S {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></S>;
export const IconNote        = (p) => <S {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></S>;
export const IconArrowDown   = (p) => <S {...p}><path d="M12 5v14M5 12l7 7 7-7"/></S>;
export const IconArrowUp     = (p) => <S {...p}><path d="M12 19V5M5 12l7-7 7 7"/></S>;
export const IconCheck       = (p) => <S {...p}><polyline points="20 6 9 17 4 12"/></S>;
export const IconX           = (p) => <S {...p}><path d="M18 6 6 18M6 6l12 12"/></S>;

// ─── Name dispatcher ─────────────────────────────────────────────────────────
const MAP = {
  hammer:         IconHammer,
  "cross-hammer": IconCrossHammer,
  flame:          IconFlame,
  bolt:           IconBolt,
  lightning:      IconBolt,
  swords:         IconSwords,
  crown:          IconCrown,
  target:         IconTarget,
  "trend-up":     IconTrendUp,
  muscle:         IconMuscle,
  trophy:         IconTrophy,
  sparkle:        IconSparkle,
  moon:           IconMoon,
  "thumbs-up":    IconThumbsUp,
  alert:          IconAlertStop,
  barbell:        IconBarbell,
  sword:          IconSword,
  shield:         IconShield,
  thermometer:    IconThermometer,
  gamepad:        IconGamepad,
  robot:          IconRobot,
  compass:        IconCompass,
  flask:          IconFlask,
  clock:          IconClock,
  refresh:        IconRefresh,
  eye:            IconEye,
  heart:          IconHeart,
  chart:          IconChart,
  scale:          IconScale,
  clipboard:      IconClipboard,
  save:           IconSave,
  loading:        IconLoading,
  medal:          IconMedal,
  calendar:       IconCalendar,
  gear:           IconGear,
  note:           IconNote,
  "arrow-down":   IconArrowDown,
  "arrow-up":     IconArrowUp,
  check:          IconCheck,
  x:              IconX,
};

export function Icon({ name, size = 20, color = "currentColor", style, ...p }) {
  const Cmp = MAP[name];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} style={style} {...p} />;
}

// Design tokens for Forged. See DESIGN_PRINCIPLES.md for rules.
// Use these instead of inline hex values for surfaces, radii, spacing, and motion.

// ── SURFACES — warm coal / forge ──────────────────────────────────────────
export const surface = {
  bg0:    "#100d09", // forge floor — warm coal, amber tint
  bgSolid:"#0b0806", // nav fade-to — near-black warm
  bg1:    "#18120d", // cards, panels — cast iron
  bg2:    "#211810", // lifted cards — dark bronze
  bg3:    "#2a2016", // widgets, steppers — iron
  bg4:    "#33271b", // hover — lighter iron
};

// ── TEXT — parchment hierarchy ────────────────────────────────────────────
export const text = {
  primary:   "#f4efe6", // warm off-white (parchment)
  secondary: "#bdb1a1", // warm mid-gray
  tertiary:  "#928574", // supporting
  muted:     "#6c6153", // captions, labels
  faint:     "#564c3e", // helpers, deemphasis
  ghost:     "#443a2e", // inactive
  disabled:  "#322a20", // disabled
};

// ── STATUS COLORS ─────────────────────────────────────────────────────────
export const status = {
  warn:      "#fbbf24", // attention, deload, recovery
  caution:   "#fb7185", // pain, sore, recovery-needed
  good:      "#4ade80", // ready, complete, positive
  info:      "#60a5fa", // deload, neutral notice
  science:   "#a78bfa", // science coach, prescription
  scienceSoft: "#d8b4fe", // softer science variant
};

// ── RADIUS ────────────────────────────────────────────────────────────────
export const radius = {
  pill:   999,
  input:  10,
  button: 12,
  card:   16,
  panel:  18,
  modal:  24,
};

// ── SPACING SCALE ─────────────────────────────────────────────────────────
// Use these tiers. Avoid intermediate values (5, 7, 9, 11, 13).
export const space = {
  xxs: 4,   // tightly related items
  xs:  6,   // label-to-content
  sm:  8,   // bullet spacing, small gaps
  md:  10,  // related groups
  lg:  16,  // card internals, between widgets
  xl:  20,  // between sections inside panels
  xxl: 28,  // between major page blocks
  xxxl: 32, // section breaks
};

// ── MOTION ────────────────────────────────────────────────────────────────
export const motion = {
  // Easing
  spring: "cubic-bezier(0.2, 0.9, 0.3, 1.2)",
  ease:   "cubic-bezier(0.4, 0, 0.2, 1)",
  // Durations
  fast:    "150ms",
  base:    "220ms",
  panel:   "280ms",
  long:    "400ms",
  // Named transitions
  expand:  "all 280ms cubic-bezier(0.2, 0.9, 0.3, 1.2)",
  fade:    "opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
  progress: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
};

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────
export const font = {
  display: "'Bebas Neue', sans-serif", // ALL CAPS CTAs, large numbers
  body:    "'Barlow', 'Inter', ui-sans-serif, system-ui, sans-serif",
  mono:    "'DM Mono', 'Courier New', monospace", // number inputs only
};

// ── HELPER: alpha overlay ─────────────────────────────────────────────────
// Append hex alpha (e.g. "33" = 20%, "66" = 40%, "88" = 53%)
export const alpha = {
  faint: "10",   // 6%
  soft:  "18",   // 9%
  light: "22",   // 13%
  mid:   "33",   // 20%
  strong:"55",   // 33%
  bold:  "77",   // 47%
};

// ── PRIMITIVE THEME OBJECT ────────────────────────────────────────────────
// Flat `t` object consumed by Primitives.jsx.
// Mirrors the prototype shape so components can be compared 1:1.
// Usage: buildT()                  → default (amber accent, dark)
//        buildT(accent, accentFg)  → custom accent
export function buildT(accentRaw = "#dd6518", accentFg = "#0a0604") {
  return {
    light:       false,
    accentRaw,
    accentFg,
    bg:          `radial-gradient(ellipse 110% 55% at 50% -5%, ${accentRaw}28 0%, transparent 65%), radial-gradient(ellipse 60% 20% at 50% 105%, rgba(221,101,24,.08) 0%, transparent 70%), linear-gradient(180deg, ${surface.bg0} 0%, #030201 100%)`,
    bgSolid:     surface.bgSolid,
    bg1:         surface.bg1,
    bg2:         surface.bg2,
    bg3:         surface.bg3,
    bg4:         surface.bg4,
    line:        "rgba(230,140,60,.09)",
    lineStrong:  "rgba(230,140,60,.18)",
    text:        text.primary,
    textSec:     text.secondary,
    textTer:     text.tertiary,
    textMuted:   text.muted,
    textGhost:   text.ghost,
    shadow:      "0 1px 0 rgba(255,140,40,.06)",
    shadowHi:    "0 20px 70px rgba(0,0,0,.7), 0 0 40px rgba(200,80,10,.07)",
    display:     "'Oswald', 'Bebas Neue', system-ui, sans-serif",
    body:        "'Barlow', 'Inter', ui-sans-serif, system-ui, sans-serif",
    mono:        "'Geist Mono', 'DM Mono', monospace",
    radius:      14,
    radiusS:     10,
    radiusXs:    6,
    radiusXl:    22,
    capsTrack:   "0.14em",
    good:        status.good,
    warn:        status.warn,
    bad:         status.caution,
    info:        status.info,
  };
}

// Default singleton — dark, amber accent. Import `T` for zero-config usage.
export const T = buildT();

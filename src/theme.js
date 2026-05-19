// Design tokens for Lift Log. See DESIGN_PRINCIPLES.md for rules.
// Use these instead of inline hex values for surfaces, radii, spacing, and motion.

// ── SURFACES ──────────────────────────────────────────────────────────────
// Tonal depth, not borders, separates surfaces.
export const surface = {
  bg0: "#0d0d0d", // app background
  bg1: "#111",    // cards, panels, expansion surfaces
  bg2: "#141414", // lifted cards (debrief, stat cards)
  bg3: "#161616", // interactive widgets (steppers, swap options)
  bg4: "#1a1a1a", // hover states, slight emphasis
};

// ── TEXT ──────────────────────────────────────────────────────────────────
export const text = {
  primary:   "#e8e8e8", // body
  secondary: "#bbb",    // subtitles, secondary content
  tertiary:  "#888",    // supporting text
  muted:     "#666",    // captions, labels
  faint:     "#555",    // helpers, deemphasis
  ghost:     "#444",    // inactive, very low priority
  disabled:  "#3a3a3a", // disabled / faded
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
  body:    "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif",
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

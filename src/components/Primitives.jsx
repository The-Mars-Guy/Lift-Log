/**
 * Primitives.jsx
 * Shared design primitives ported from the "Quiet Clinical" prototype.
 *
 * Each component accepts an optional `t` prop (flat theme object from buildT()).
 * Falls back to the default T singleton (dark, amber) when omitted.
 *
 * Components: Card · Disp · Caps · Bar · Sparkline · Pill · TabRow · Dot
 *
 * Usage:
 *   import { Card, Disp, Caps, Bar, Sparkline, Pill, TabRow, Dot } from "../components/Primitives.jsx";
 *   import { buildT } from "../theme.js";
 *
 *   const t = buildT(accent);   // pass accent from your view
 *   <Card t={t}>...</Card>
 *   <Disp t={t} size={48}>142</Disp>
 */

import { T } from "../theme.js";

// ── Card ─────────────────────────────────────────────────────────────────────
// Tonal surface container. level 1 = bg1 (default), 2 = bg2, 3 = bg3.
// accent=true draws a faint accent glow border.
export function Card({ children, style, padded = true, level = 1, accent = false, t = T }) {
  const bg = level === 3 ? t.bg3 : level === 2 ? t.bg2 : t.bg1;
  return (
    <div style={{
      background: bg,
      borderRadius: t.radius,
      padding: padded ? 16 : 0,
      border: `1px solid ${t.line}`,
      boxShadow: accent ? `0 0 0 1px ${t.accentRaw}55, ${t.shadowHi}` : "none",
      position: "relative",
      ...style,
    }}>{children}</div>
  );
}

// ── Disp ─────────────────────────────────────────────────────────────────────
// Display number or headline — Geist, negative tracking, tight line-height.
// Use for stats, counts, big hero numbers.
export function Disp({ children, size = 64, color, style, italic = false, t = T }) {
  return (
    <span style={{
      fontFamily: t.display,
      fontSize: size,
      lineHeight: 0.96,
      letterSpacing: "-0.03em",
      fontWeight: 500,
      color: color || t.text,
      fontStyle: italic ? "italic" : "normal",
      ...style,
    }}>{children}</span>
  );
}

// ── Caps ─────────────────────────────────────────────────────────────────────
// Uppercase tracked label. Section headers, column labels, data callouts.
export function Caps({ children, size = 10, color, weight = 600, style, t = T }) {
  return (
    <span style={{
      fontSize: size,
      letterSpacing: t.capsTrack,
      textTransform: "uppercase",
      fontWeight: weight,
      color: color || t.textTer,
      ...style,
    }}>{children}</span>
  );
}

// ── Bar ──────────────────────────────────────────────────────────────────────
// Horizontal progress bar. value/max → 0-1 fill.
export function Bar({ value, max = 1, color, height = 6, bg, t = T }) {
  const pct = Math.max(0, Math.min(value / (max || 1), 1)) * 100;
  return (
    <div style={{
      width: "100%", height,
      background: bg || t.bg3,
      borderRadius: 999, overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: color || t.accentRaw,
        borderRadius: 999,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
// Minimal SVG line chart. data = number[]. Needs at least 2 points.
// areaColor defaults to a faint tint of color when omitted but area=true.
export function Sparkline({ data, w = 100, h = 28, color, areaColor, area = false, thick = false, t = T }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  const lineColor = color || t.accentRaw;
  const fillColor = areaColor || `${lineColor}18`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      {(area || areaColor) && <path d={areaD} fill={fillColor} />}
      <path d={pathD} fill="none" stroke={lineColor}
        strokeWidth={thick ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Pill ─────────────────────────────────────────────────────────────────────
// Inline badge / status tag.
export function Pill({ children, color, bg, style, t = T }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      background: bg || "rgba(255,255,255,.08)",
      color: color || t.textSec,
      fontSize: 10.5,
      letterSpacing: t.capsTrack,
      textTransform: "uppercase",
      fontWeight: 600,
      whiteSpace: "nowrap",
      lineHeight: 1.2,
      ...style,
    }}>{children}</span>
  );
}

// ── TabRow ───────────────────────────────────────────────────────────────────
// Pill-style segmented tab bar. items = [{ id, label }].
export function TabRow({ items, active, onChange, t = T }) {
  return (
    <div style={{
      display: "flex", padding: 4,
      background: t.bg2, borderRadius: 999, gap: 2,
      border: `1px solid ${t.line}`,
    }}>
      {items.map(item => {
        const sel = item.id === active;
        return (
          <button key={item.id} onClick={() => onChange(item.id)} style={{
            flex: 1, height: 30, borderRadius: 999,
            color: sel ? t.text : t.textTer,
            background: sel ? t.bg1 : "transparent",
            fontSize: 11, fontWeight: 600,
            letterSpacing: t.capsTrack,
            textTransform: "uppercase",
            border: "none", cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}>{item.label}</button>
        );
      })}
    </div>
  );
}

// ── Dot ──────────────────────────────────────────────────────────────────────
// Status indicator dot.
export function Dot({ color, size = 6, style }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      borderRadius: 99,
      background: color,
      flexShrink: 0,
      ...style,
    }} />
  );
}

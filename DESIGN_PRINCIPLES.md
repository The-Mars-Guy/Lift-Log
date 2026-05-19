# Design Principles — Lift Log

Product identity: **calm adaptive coaching**. Not a dashboard. Not a logger. A system that notices things and speaks when it matters.

---

## Typography

| Role | Font | Size | Weight | Case | Tracking |
|---|---|---|---|---|---|
| Display / CTA | Bebas Neue | 24–54px | — | ALL CAPS | .06–.12em |
| Section header | Plus Jakarta Sans | 16–18px | 600 | Sentence | none |
| Body / coach copy | Plus Jakarta Sans | 13–15px | 400 | Sentence | none |
| Caption / label | Plus Jakarta Sans | 11–12px | 600 | Sentence | .02em max |
| Numeric input | DM Mono | 16–20px | 500 | — | — |
| Chart axis | DM Mono | SVG 4–5px | — | — | — |

**Rules:**
- ALL CAPS only for Bebas Neue display moments (workout name, CTA, timer). Never on coach copy or section labels.
- Monospace only for number inputs and chart data. Never on buttons, labels, or body text.
- `letterSpacing` > `.06em` only on Bebas Neue. Tight tracking (.02em) on captions only.

---

## Surfaces

```
bg0  #0d0d0d   app background
bg1  #111      cards, panels, expansion surfaces
bg2  #141414   lifted cards (debrief, stat cards)
bg3  #161616   interactive widgets (steppers, swap options)
```

**Rules:**
- Use tonal depth, not borders, to separate surfaces.
- A border signals interactivity or state. Not decoration.
- Nested content inside a panel flows inline — no inner card boxes for text content.
- Exception: visual objects (charts, diagrams) and interactive controls (steppers, toggles) deserve containment.

---

## Radius

| Element | Radius |
|---|---|
| Pills / tags | 999px |
| Inputs / small buttons | 8–10px |
| Cards | 14–18px |
| Panels / expansion | 18px |
| Modals / overlays | 24–28px |
| Finish / CTA button | 14–15px |

Variation is intentional. Uniform radius everywhere reads as template-generated.

---

## Spacing

| Context | Value |
|---|---|
| Label → content gap | 6px |
| Related items | 8–10px |
| Card internals | 16px padding |
| Between sections | 20px |
| Between major blocks | 28–32px |

No spacing values between 5–14 unless semantically distinct. The scale is: 4, 6, 8, 10, 16, 20, 28, 32.

---

## Color

Accent is per-user. All other colors are fixed:

| Use | Value |
|---|---|
| Body text | #e8e8e8 |
| Secondary text | #aaa–#bbb |
| Muted / captions | #555–#666 |
| Inactive / faint | #3a3a3a–#444 |
| Warning | #fbbf24 |
| Caution / pain | #fb7185 |
| Recovery | #fb7185 |
| Progress | #fbbf24 |
| Ready / good | #4ade80 |
| Science / coach | #a78bfa |

**Rules:**
- Max 2 accent colors visible simultaneously. Accent + one status color.
- Glow (`box-shadow: 0 0 Xpx colorN`) only on primary CTAs and set completion state. Not on cards or labels.
- Pure white (#ffffff) never used. Soft white (#e8e8e8) for primary text.

---

## Buttons

| Tier | Style | Use |
|---|---|---|
| Primary | Full accent fill, Bebas Neue, glow | One per screen. The main action. |
| Secondary | `bg3` fill, no border, accent or muted text | Contextual choices with weight |
| Tertiary | No fill, no border, #444–#666 text | Utility, escape hatches, rarely-used |
| Interactive state | Bordered (accent or #3a3a3a), tonal bg | Set checkboxes, toggles, day tabs |

**Rules:**
- One primary CTA per context. If two actions need equal weight, reconsider the design.
- Ghost buttons (transparent + border) allowed only for interactive state elements, not for actions.
- Tertiary actions (Reset, Pause, Skip, Original) are text-only. No borders.

---

## Coach Communication

The product voice is: **calm, confident, observational**. Not metric-forward. Not system-announcing.

**Register rules:**
- Speak in observations, not telemetry: "Recovery has been better lately" not "+12% volume trend"
- Never expose model internals: "Reduced target — recent sets were marked hard" not "label=Protect, sc=-1"
- Subject is always the user, not the system: "You've been recovering well" not "Recovery score is elevated"
- One sentence when possible. Two at most.
- Silence is correct most of the time.

**Frequency rules:**
- Session intent: once, pre-workout, low visual weight
- Set-level rationale: always visible but small (11px, #a78bfa, subordinate to the exercise name)
- Live alerts: 0–3 per session. Fires only on meaningful behavioral signal.
- Debrief: 1–4 bullets. Only from signals that actually fired.
- Continuity moments: rare. Once per several sessions when the pattern is genuinely notable.

**What coach copy is NOT:**
- Not a chat interface
- Not a notification system
- Not a dashboard widget
- Not a motivational bot

---

## Motion (principles, not implementations)

- Motion communicates state change. Not decoration.
- Spring easing > linear. Expand/collapse should feel physical.
- Duration: 200–300ms for micro (button feedback, set completion). 250–400ms for panels. Never over 500ms.
- Entrance: `slideDown` for panels, `fadeIn` for coach alerts. Exit: fade, not slide.
- Progress bars: `transition: width .4s ease`. Never instant.
- Set completion: bounce scale (exists). Keep. It earns its animation budget.

---

## What to Remove Before What to Add

When in doubt, remove first.

Checklist before adding any new UI element:
- [ ] Does it communicate something the user doesn't already have?
- [ ] Will the user notice it at the right moment?
- [ ] Does it require a label, border, or pill to make sense? (If yes, reconsider.)
- [ ] Does it make the UI louder or calmer?

The product is now strong enough to survive reduction. A surface that needs explaining isn't ready.

---

## Entropy Checklist

When reviewing a PR or editing inline styles, check:

- [ ] No `borderRadius` outside the approved scale
- [ ] No `letterSpacing` > .02em except Bebas Neue
- [ ] No `textTransform: uppercase` except Bebas Neue display
- [ ] No `fontFamily: DM Mono` on buttons, labels, or body text
- [ ] No `border: 1px solid` on purely informational cards
- [ ] No new pills/chips without removing an existing one
- [ ] No coach copy that sounds like telemetry
- [ ] No new coaching surface without justification against frequency rules

These rules don't forbid deviation. They make deviation conscious.

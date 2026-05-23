# Manual QA Checklist — Gym Forged

Run before every release. Check all items on a real mobile device (iOS Safari + Android Chrome) and desktop Chrome.

---

## 1. Mobile Install (PWA)

- [ ] Open app in Safari (iOS) → Share → "Add to Home Screen" → app icon appears
- [ ] Open app in Chrome (Android) → install prompt appears or use browser menu → installs
- [ ] Installed app launches full-screen with no browser chrome
- [ ] Splash / theme-color matches app accent (#ff8c32)

---

## 2. Offline Launch

- [ ] Load app once while online
- [ ] Toggle airplane mode or DevTools → Network: Offline
- [ ] Close and reopen app (or hard-refresh) — app loads from service worker cache
- [ ] Workout view, Stats, Calendar all render without network
- [ ] No console errors about failed fetches (exercise-db is lazy — no preload)

---

## 3. Resume After Reload

- [ ] Start a workout session, log 2–3 sets
- [ ] Force-close the app (or reload the tab)
- [ ] Reopen → session restores automatically (same day, same sets logged)
- [ ] Previously logged sets show correct weight/reps
- [ ] Active timer state is reasonable (may reset; rest timer is ephemeral — OK)

---

## 4. Import / Export Round-Trip

- [ ] Settings → Export → file downloads (JSON, named `gym-forged-backup-*.json`)
- [ ] Open exported file, verify it contains `history`, `settings`, `progression`, `exConfig`
- [ ] Settings → Import → select that same file → success toast appears
- [ ] After import, history count matches, settings match, progression matches
- [ ] Import a *slightly modified* file (change one history entry) → data reflects change

---

## 5. Calendar Edit / Delete

- [ ] Navigate to Calendar view
- [ ] Tap a past session entry → detail panel opens
- [ ] Edit a field (e.g. workout note) → save → change persists after reload
- [ ] Delete the session → entry removed from calendar and Stats (session count decreases by 1)
- [ ] Undo or re-import confirms delete is permanent

---

## 6. Reduced Motion

- [ ] Open DevTools → Rendering → "Emulate prefers-reduced-motion: reduce"
- [ ] Confetti animation: absent or instant (no flying particles)
- [ ] Rest timer countdown: no bounce/pulse animation
- [ ] Slide-in transitions: instant, no slide animation
- [ ] Coach drawer open/close: instant

---

## 7. Light / Dark Theme

- [ ] Settings → Appearance → Light → entire app switches to light palette
- [ ] Settings → Appearance → Dark → entire app switches to dark palette
- [ ] Confirm: cards, text, icons, buttons all readable in both themes
- [ ] Theme persists after reload

---

## 8. Simple Mode

- [ ] Settings → Simple Mode → enable
- [ ] Navigate to Workout → coach panels hidden (Smith coach, science notes, plateau analysis)
- [ ] CoachFab (orange orb) hidden in Simple Mode
- [ ] Set logging, rest timer, exercise guide, weight controls all still work normally
- [ ] Disable Simple Mode → coach panels reappear

---

## 9. Accessibility

- [ ] Tab through workout screen — focus ring visible on all interactive elements
- [ ] Screen reader (VoiceOver / TalkBack): bottom nav buttons announce label + current page
- [ ] Rest timer fullscreen: screen reader announces countdown ("60 seconds", "59 seconds")
- [ ] Modal dialogs (SetLogger, FocusMode, CoachDrawer) trap focus or at least aria-modal
- [ ] Toast notifications read out by screen reader

---

## 10. Bundle Size

Run after every build:

```sh
npm run build
```

- [ ] `dist/assets/index-*.js` gzip < 100 KB
- [ ] `dist/assets/exercise-db-*.js` is NOT referenced in `dist/index.html` (must stay lazy)
- [ ] No new chunks > 50 KB gzip appear without justification

---

## Sign-off

| Date | Tester | Platform | Pass? | Notes |
|------|--------|----------|-------|-------|
|      |        |          |       |       |

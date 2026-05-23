# Changelog

All notable changes to Gym Forged are documented here.

---

## [2.0.0] — 2026-05-22

### New Features

- **Simple Mode** — toggle in Settings → Simple Mode. Hides Smith coach, science notes, and plateau analysis. Only exercises, sets, and reps. Disable anytime to restore full coach experience.
- **App version display** — Settings → About card shows current version (e.g. `v2.0.0`) and privacy notice.
- **Privacy notice** — explicit in-app statement that all data stays on device; nothing uploaded, synced, or shared.
- **Mesocycle periodization** — automatic accumulation / intensification / realization / deload cycle based on session count.
- **Dynamic deload detection** — recommends deload if recent check-ins report hard sessions or pain.
- **Available weights / fixed dumbbell snapping** — enter your dumbbell set once; weight selectors snap to nearest owned weight.
- **Exercise substitutions** — swap any exercise mid-session with a reason (e.g. shoulder pain); substitution logged with original.
- **Readiness / check-in flow** — pre-session energy, soreness, sleep check-in feeds coach prescriptions.
- **Muscle map view** — visual diagram of muscles worked per session.
- **XP and level system** — earn XP for sets, sessions, PRs, and streaks. 12 smithing-themed levels (Ore → Eternal).
- **Achievements** — 12 unlockable milestones tracked automatically.
- **Body metrics tracking** — optional weight, body fat, and notes log.
- **Goals** — set training goal (hypertrophy / strength / endurance / fat loss); coach adapts prescriptions.
- **Coach profiles** — balanced, aggressive, or conservative progression style.
- **Science coach** — per-exercise tempo, 1RM estimate, percentage target, and variation notes.
- **Plateau detection** — automatic analysis of stalling exercises with suggested fixes.
- **Focus workout mode** — full-screen single-exercise view for zero-distraction training.
- **Workout note** — free-text session note saved with each history entry.
- **Sparkline progress charts** — per-exercise volume trend over last sessions.
- **Confetti on PR** — celebratory animation when a personal record is set.

### Architecture

- `useWorkoutProgression` hook extracts all session computation from `WorkoutView` into a pure, memoized hook.
- ESLint flat config (`eslint.config.js`) with `react-hooks` plugin; 0 errors, 0 warnings across all `src/`.
- Node.js built-in test runner; 103 tests covering session identity, progression logic, volume calculation, and data integrity.
- `__APP_VERSION__` injected at build time via Vite `define` from `package.json`.
- Full accessibility pass: `aria-modal`, `aria-live`, `aria-current`, `role="alert"`, `role="dialog"`, focus-visible ring, `prefers-reduced-motion` media query.
- Bundle: main JS 86.7 KB gzip (limit 100 KB). `exercise-db` stays lazy (not preloaded).

### Settings Added

- `simpleMode` — hide advanced coach panels
- `equipmentProfile` — fixed_dumbbells | adjustable | barbell | bodyweight
- `availableWeights` — list of owned dumbbell weights for snapping
- `trainingGoal` — hypertrophy | strength | endurance | fat_loss
- `cautiousJoints` — list of joints to flag for substitution suggestions
- `beginnerFormMode` — emphasize form cues over load
- `workoutDays` — customize which days are training days

### Fixes

- Restored `WorkoutView` imports after `useWorkoutProgression` extraction (no missing-import regressions).
- `exerciseVolume` correctly doubles weight for bilateral movements (2 dumbbells).
- Session corruption guard: malformed `sessionLogs`, `substitutions`, or `exerciseOrder` coerced to safe defaults on load.
- `computeStats` streak logic uses 4.5-day window (tolerates missed day without breaking streak).

---

## [1.0.0] — Initial release

- Basic A/B workout tracking with dumbbell exercises.
- localStorage persistence for history and progression.
- PWA manifest and service worker for offline use.

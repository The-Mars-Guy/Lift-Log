// Web Audio synthesized sound effects — no asset files needed
let ctx = null;
const VOLUME_MULTIPLIER = 3;

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      console.warn("AudioContext unavailable", err);
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq, duration = 0.15, type = "sine", gain = 0.15, attack = 0.005, release = 0.1 }) {
  const c = getCtx(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  const boostedGain = Math.min(gain * VOLUME_MULTIPLIER, 0.9);
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(boostedGain, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g); g.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration + 0.05);
}

function sequence(notes, gap = 0.08) {
  notes.forEach((n, i) => setTimeout(() => tone(n), i * gap * 1000));
}

export const sounds = {
  tempoBeat: () => tone({ freq: 520, duration: 0.045, type: "square", gain: 0.045, attack: 0.001, release: 0.035 }),
  tempoAccent: () => tone({ freq: 780, duration: 0.06, type: "square", gain: 0.065, attack: 0.001, release: 0.045 }),
  setComplete: () => tone({ freq: 880, duration: 0.08, type: "sine", gain: 0.1, attack: 0.002, release: 0.05 }),
  restEnd: () => sequence([
    { freq: 660, duration: 0.12, type: "sine", gain: 0.15 },
    { freq: 880, duration: 0.18, type: "sine", gain: 0.18 },
  ], 0.12),
  workoutDone: () => sequence([
    { freq: 523, duration: 0.12, type: "triangle", gain: 0.15 },
    { freq: 659, duration: 0.12, type: "triangle", gain: 0.15 },
    { freq: 784, duration: 0.18, type: "triangle", gain: 0.17 },
    { freq: 1047, duration: 0.30, type: "triangle", gain: 0.20 },
  ], 0.10),
  progression: () => sequence([
    { freq: 523, duration: 0.10, type: "sine", gain: 0.18 },
    { freq: 784, duration: 0.10, type: "sine", gain: 0.18 },
    { freq: 1047, duration: 0.25, type: "sine", gain: 0.22 },
  ], 0.08),
  achievement: () => sequence([
    { freq: 659, duration: 0.10, type: "triangle", gain: 0.18 },
    { freq: 880, duration: 0.10, type: "triangle", gain: 0.18 },
    { freq: 1175, duration: 0.10, type: "triangle", gain: 0.18 },
    { freq: 1568, duration: 0.35, type: "triangle", gain: 0.22 },
  ], 0.07),
  uncheck: () => tone({ freq: 220, duration: 0.06, type: "sine", gain: 0.06 }),
};

// Wrapper that respects user setting
export function makePlay(settings) {
  return (name) => {
    if (!settings.soundEnabled) return;
    if (sounds[name]) sounds[name]();
  };
}

export function vibrate(settings, pattern) {
  if (!settings.vibrationEnabled) return;
  try { navigator.vibrate?.(pattern); }
  catch (err) { console.warn("vibrate failed", err); }
}

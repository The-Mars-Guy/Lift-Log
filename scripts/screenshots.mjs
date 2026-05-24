/**
 * screenshots.mjs — Capture Play Store screenshots via Puppeteer
 * Usage: node scripts/screenshots.mjs
 * Requires: dev server running on port 5173 (npm run dev)
 */

import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173';

// localStorage seed — bypasses onboarding, seeds realistic history
const SEED_LS = `
(function() {
  const s = { onboardingDone:true, visualTheme:"dark", simpleMode:false,
    restSeconds:60, soundEnabled:true, vibrationEnabled:true,
    sessionsPerProgression:6, maxRepBonus:5, weightIncrement:1,
    coachStyle:"balanced", autoDeload:true, showReadiness:true,
    fullscreenRest:true, scienceCoach:true, equipmentProfile:"fixed_dumbbells",
    availableWeights:[], trainingGoal:"hypertrophy", cautiousJoints:[],
    beginnerFormMode:false, workoutDays:["Mon","Wed","Fri"] };
  localStorage.setItem("wt_settings", JSON.stringify(s));
  localStorage.setItem("wt_install_dismissed", "true");

  // Seed 12 history sessions over past 4 weeks
  const now = Date.now();
  const day = 86400000;
  const exercises = ["Goblet Squat","Floor Press","Bent Over Row","Arnold Press","Hammer Curl","Romanian Deadlift"];
  const history = Array.from({length:12}, (_,i) => ({
    timestamp: now - (i * 2.5 * day),
    day: ["Monday","Wednesday","Friday"][i%3],
    workout: i%2===0 ? "A" : "B",
    duration: 2100 + Math.random()*600|0,
    exercises: exercises.map(name => ({
      name, sets:3, reps:10+i,
      setLog: [{weight:20+i,reps:12},{weight:20+i,reps:11},{weight:20+i,reps:10}]
    }))
  }));
  localStorage.setItem("wt_history", JSON.stringify(history));

  const prog = {};
  exercises.forEach(n => { prog[n] = { repBonus: Math.floor(Math.random()*3), cleanSessions: 4 }; });
  localStorage.setItem("wt_progression", JSON.stringify(prog));
  localStorage.setItem("wt_xp", JSON.stringify(480));
  // Pre-mark all achievements that 12-session history would unlock, so no toast appears
  localStorage.setItem("wt_achievements", JSON.stringify([
    "first_lift","week_one","ten_sessions","streak_3","streak_10","first_prog","five_progs","perfect_week"
  ]));
  // Seed muscle recovery data
  const muscleData = {};
  ["chest","back","shoulders","biceps","triceps","quads","hamstrings","glutes","calves","core"].forEach(m => {
    muscleData[m] = { lastTrained: now - (1.5 * day), sets: 9 };
  });
  localStorage.setItem("wt_muscle_data", JSON.stringify(muscleData));
})();
`;

const VIEWPORTS = [
  // Phone: 360 CSS px × DPR 3 = 1080×1920 physical pixels
  { name: "phone", width: 360, height: 640, deviceScaleFactor: 3 },
  // 7-inch tablet: 600 CSS px × DPR 2 = 1200×1920
  { name: "tablet_7", width: 600, height: 960, deviceScaleFactor: 2 },
  // 10-inch tablet: 800 CSS px × DPR 2 = 1600×2560 — use landscape for 10"
  { name: "tablet_10", width: 960, height: 1280, deviceScaleFactor: 2 },
];

// Screens: [label, hash/action]
const SCREENS = [
  { name: "01_workout",  action: null },
  { name: "02_stats",    action: async p => { await p.click('[aria-label="Stats"]'); await wait(p, 800); } },
  { name: "03_routine",  action: async p => { await p.click('[aria-label="Routine"]'); await wait(p, 800); } },
  { name: "04_muscles",  action: async p => { await p.click('[aria-label="Muscles"]'); await wait(p, 800); } },
  { name: "05_profile",  action: async p => { await p.click('[aria-label="Profile"]'); await wait(p, 800); } },
];

function wait(page, ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function seedAndLoad(page) {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.evaluate(SEED_LS);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(page, 1200); // splash fade
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const vp of VIEWPORTS) {
    console.log(`\n── ${vp.name} (${vp.width}×${vp.height})`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor });

    await seedAndLoad(page);

    for (const screen of SCREENS) {
      if (screen.action) {
        try { await screen.action(page); } catch (e) { console.warn(`  skip ${screen.name}: ${e.message}`); continue; }
      }
      const file = join(OUT, `${vp.name}_${screen.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`  ✓ ${vp.name}_${screen.name}.png`);
    }

    await page.close();
  }

  await browser.close();
  console.log(`\nDone → screenshots/`);
}

run().catch(err => { console.error(err); process.exit(1); });

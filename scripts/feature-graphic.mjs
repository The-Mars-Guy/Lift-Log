/**
 * feature-graphic.mjs — Generate 1024×500 Play Store feature graphic
 * Usage: node scripts/feature-graphic.mjs
 */

import puppeteer from 'puppeteer';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT  = join(ROOT, 'screenshots');
mkdirSync(OUT, { recursive: true });

// Embed icon SVG inline
const iconSvg = readFileSync(join(ROOT, 'public', 'icons', 'icon.svg'), 'utf8');
const iconB64 = Buffer.from(iconSvg).toString('base64');

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Barlow:wght@400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width: 1024px; height: 500px; overflow: hidden;
    background:
      radial-gradient(ellipse 70% 80% at 15% 50%, rgba(249,115,22,.18) 0%, transparent 65%),
      radial-gradient(ellipse 40% 60% at 80% 80%, rgba(255,122,26,.08) 0%, transparent 60%),
      linear-gradient(135deg, #0e0a06 0%, #030201 100%);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 72px;
    font-family: 'Barlow', sans-serif;
  }
  .left { display:flex; flex-direction:column; gap:18px; }
  .logo-row { display:flex; align-items:center; gap:18px; }
  .icon { width:72px; height:72px; }
  .brand { font-family:'Oswald',sans-serif; font-size:52px; font-weight:700; letter-spacing:.06em; line-height:1; }
  .brand .gym  { color:#ede8de; }
  .brand .forged { color:#ff7a1a; }
  .tagline { font-size:18px; color:rgba(237,232,222,.55); letter-spacing:.18em; text-transform:uppercase; font-weight:500; }
  .pills { display:flex; gap:10px; flex-wrap:wrap; margin-top:4px; }
  .pill {
    font-size:13px; font-weight:500; color:#ff8c32;
    background:rgba(255,122,26,.12); border:1px solid rgba(255,122,26,.25);
    border-radius:999px; padding:6px 16px; letter-spacing:.04em;
  }
  .right { position:relative; width:240px; height:380px; flex-shrink:0; }
  .phone {
    width:220px; height:380px;
    background:linear-gradient(160deg,#1a1208 0%,#0a0704 100%);
    border-radius:32px;
    border:2px solid rgba(255,122,26,.2);
    box-shadow: 0 0 60px rgba(255,122,26,.15), 0 24px 64px rgba(0,0,0,.7);
    overflow:hidden; display:flex; flex-direction:column;
    padding:20px 16px 14px;
  }
  .phone-header { font-family:'Oswald',sans-serif; font-size:11px; color:#ff7a1a; letter-spacing:.18em; margin-bottom:10px; }
  .phone-title { font-family:'Oswald',sans-serif; font-size:26px; font-weight:700; color:#ff7a1a; letter-spacing:.08em; margin-bottom:4px; }
  .phone-sub { font-size:10px; color:rgba(237,232,222,.4); margin-bottom:14px; }
  .phone-bar { height:3px; background:rgba(255,122,26,.15); border-radius:2px; margin-bottom:14px; }
  .phone-bar-fill { height:100%; width:35%; background:#ff7a1a; border-radius:2px; }
  .phone-btn {
    background:#ff7a1a; color:#0a0704; font-family:'Oswald',sans-serif;
    font-size:13px; font-weight:700; letter-spacing:.1em;
    border-radius:10px; padding:10px; text-align:center; margin-bottom:14px;
  }
  .phone-ex { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .phone-ex-name { font-size:11px; color:#ede8de; font-weight:500; }
  .phone-ex-sets { display:flex; gap:5px; }
  .phone-ex-set {
    width:22px; height:22px; border-radius:6px;
    background:rgba(255,122,26,.15); border:1px solid rgba(255,122,26,.25);
    display:flex; align-items:center; justify-content:center;
    font-size:9px; color:rgba(237,232,222,.6);
  }
  .phone-ex-set.done { background:rgba(255,122,26,.3); border-color:#ff7a1a; color:#ff8c32; }
  .phone-nav { display:flex; justify-content:space-around; margin-top:auto; padding-top:10px; border-top:1px solid rgba(255,122,26,.1); }
  .phone-nav-item { font-size:8px; color:rgba(237,232,222,.3); text-align:center; }
  .phone-nav-item.active { color:#ff7a1a; }
</style>
</head>
<body>
  <div class="left">
    <div class="logo-row">
      <img class="icon" src="data:image/svg+xml;base64,${iconB64}" />
      <div class="brand"><span class="gym">GYM </span><span class="forged">FORGED</span></div>
    </div>
    <div class="tagline">Shape your strength</div>
    <div class="pills">
      <div class="pill">Auto-Progression</div>
      <div class="pill">Gym · Home · Both</div>
      <div class="pill">100% Offline</div>
      <div class="pill">No Account Needed</div>
    </div>
  </div>

  <div class="right">
    <div class="phone">
      <div class="phone-header">FORGE · MON</div>
      <div class="phone-title">STRIKE</div>
      <div class="phone-sub">Balanced Session · 0/20 sets</div>
      <div class="phone-bar"><div class="phone-bar-fill"></div></div>
      <div class="phone-btn">START WORKOUT</div>
      <div class="phone-ex">
        <div class="phone-ex-name">Goblet Squat<br/><span style="color:rgba(237,232,222,.4);font-size:9px">4×12 @ 20lbs</span></div>
        <div class="phone-ex-sets">
          <div class="phone-ex-set done">✓</div>
          <div class="phone-ex-set done">✓</div>
          <div class="phone-ex-set">3</div>
          <div class="phone-ex-set">4</div>
        </div>
      </div>
      <div class="phone-ex">
        <div class="phone-ex-name">Floor Press<br/><span style="color:rgba(237,232,222,.4);font-size:9px">3×10 @ 25lbs</span></div>
        <div class="phone-ex-sets">
          <div class="phone-ex-set">1</div>
          <div class="phone-ex-set">2</div>
          <div class="phone-ex-set">3</div>
        </div>
      </div>
      <div class="phone-ex">
        <div class="phone-ex-name">Bent Over Row<br/><span style="color:rgba(237,232,222,.4);font-size:9px">3×12 @ 22lbs</span></div>
        <div class="phone-ex-sets">
          <div class="phone-ex-set">1</div>
          <div class="phone-ex-set">2</div>
          <div class="phone-ex-set">3</div>
        </div>
      </div>
      <div class="phone-nav">
        <div class="phone-nav-item active">⚒<br/>FORGE</div>
        <div class="phone-nav-item">📊<br/>STATS</div>
        <div class="phone-nav-item">📋<br/>ROUTINE</div>
        <div class="phone-nav-item">💪<br/>MUSCLES</div>
        <div class="phone-nav-item">👤<br/>PROFILE</div>
      </div>
    </div>
  </div>
</body>
</html>`;

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  await page.setContent(HTML, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  const file = join(OUT, 'feature-graphic.png');
  await page.screenshot({ path: file, clip: { x:0, y:0, width:1024, height:500 } });
  await browser.close();
  console.log(`✓ ${file}`);
}

run().catch(err => { console.error(err); process.exit(1); });

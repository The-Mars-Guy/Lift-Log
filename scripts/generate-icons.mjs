/**
 * generate-icons.mjs
 * Rasterizes the SVG master icon into all PNG sizes needed for:
 *   - PWA manifest icons
 *   - Capacitor Android mipmap resources (via @capacitor/assets)
 *   - Apple touch icon
 *
 * Usage: node scripts/generate-icons.mjs
 * Requires: sharp (devDependency)
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ICON_SVG = join(ROOT, 'public', 'icons', 'icon.svg');
const svg = readFileSync(ICON_SVG);

// Output dirs
const PUBLIC_ICONS = join(ROOT, 'public', 'icons');
const ASSETS_DIR   = join(ROOT, 'assets');   // Capacitor @capacitor/assets source dir

mkdirSync(PUBLIC_ICONS, { recursive: true });
mkdirSync(ASSETS_DIR,   { recursive: true });

const SIZES = [48, 72, 96, 144, 192, 512];

async function generate() {
  // PWA manifest icons
  for (const size of SIZES) {
    const out = join(PUBLIC_ICONS, `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`  ✓ icon-${size}.png`);
  }

  // Apple touch icon (180px)
  const appleOut = join(PUBLIC_ICONS, 'apple-touch-icon.png');
  await sharp(svg).resize(180, 180).png().toFile(appleOut);
  console.log('  ✓ apple-touch-icon.png');

  // Capacitor @capacitor/assets source: needs icon.png (1024×1024) + splash.png
  const capIcon = join(ASSETS_DIR, 'icon.png');
  await sharp(svg).resize(1024, 1024).png().toFile(capIcon);
  console.log('  ✓ assets/icon.png (Capacitor source)');

  // Splash: 2732×2732 dark bg with centered icon
  const iconBuf = await sharp(svg).resize(512, 512).png().toBuffer();
  const splashOut = join(ASSETS_DIR, 'splash.png');
  await sharp({
    create: { width: 2732, height: 2732, channels: 4, background: { r: 5, g: 5, b: 5, alpha: 1 } },
  })
    .composite([{ input: iconBuf, gravity: 'center' }])
    .png()
    .toFile(splashOut);
  console.log('  ✓ assets/splash.png (Capacitor source)');

  // Adaptive icon: foreground (icon on transparent bg)
  const fgOut = join(ASSETS_DIR, 'icon-foreground.png');
  await sharp(svg).resize(1024, 1024).png().toFile(fgOut);
  console.log('  ✓ assets/icon-foreground.png');

  // Adaptive icon: background (solid dark)
  const bgOut = join(ASSETS_DIR, 'icon-background.png');
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 5, g: 5, b: 5, alpha: 1 } },
  }).png().toFile(bgOut);
  console.log('  ✓ assets/icon-background.png');

  console.log('\nDone. Next: npx @capacitor/assets generate --android');
}

generate().catch(err => { console.error(err); process.exit(1); });

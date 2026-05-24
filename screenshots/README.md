# Screenshots

This directory contains Play Store and README assets for Gym Forged.

## Files

- `feature-graphic.png` — 1024 x 500 Play Store feature graphic.
- `phone_*.png` — phone screenshots used in the root README and Play Store listing.
- `tablet_7_*.png` — 7-inch tablet screenshots.
- `tablet_10_*.png` — 10-inch tablet screenshots.

## Regenerating

Start the Vite dev server:

```sh
npm run dev
```

Capture phone and tablet screenshots:

```sh
node scripts/screenshots.mjs
```

Generate the feature graphic:

```sh
node scripts/feature-graphic.mjs
```

The screenshot script seeds local demo data in the browser session before capture, so generated images show a populated app without changing committed app state.

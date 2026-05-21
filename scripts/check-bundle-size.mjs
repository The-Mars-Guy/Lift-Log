import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ASSET_DIR = "dist/assets";
const MAIN_GZIP_LIMIT = 100 * 1024;
const INITIAL_JS_GZIP_LIMIT = 130 * 1024;
const strict = process.env.BUNDLE_STRICT === "1";

const assets = readdirSync(ASSET_DIR)
  .filter(name => name.endsWith(".js") || name.endsWith(".css"))
  .map(name => {
    const bytes = readFileSync(join(ASSET_DIR, name));
    return { name, raw:bytes.length, gzip:gzipSync(bytes).length };
  })
  .sort((a, b) => b.gzip - a.gzip);

const main = assets.find(asset => /^index-.*\.js$/.test(asset.name));
const initialJs = assets
  .filter(asset => /^index-.*\.js$/.test(asset.name))
  .reduce((sum, asset) => sum + asset.gzip, 0);

console.log("Bundle size report");
for (const asset of assets) {
  console.log(`${asset.name.padEnd(32)} raw ${(asset.raw / 1024).toFixed(1)} KB  gzip ${(asset.gzip / 1024).toFixed(1)} KB`);
}
console.log(`${"initial JS total".padEnd(32)} gzip ${(initialJs / 1024).toFixed(1)} KB  (limit ${(INITIAL_JS_GZIP_LIMIT / 1024).toFixed(0)} KB)`);
if (main) console.log(`${"main JS".padEnd(32)} gzip ${(main.gzip / 1024).toFixed(1)} KB  (limit ${(MAIN_GZIP_LIMIT / 1024).toFixed(0)} KB)`);

const failures = [];
if (main && main.gzip > MAIN_GZIP_LIMIT) failures.push(`main JS gzip ${(main.gzip / 1024).toFixed(1)} KB > ${(MAIN_GZIP_LIMIT / 1024).toFixed(0)} KB`);
if (initialJs > INITIAL_JS_GZIP_LIMIT) failures.push(`initial JS gzip ${(initialJs / 1024).toFixed(1)} KB > ${(INITIAL_JS_GZIP_LIMIT / 1024).toFixed(0)} KB`);

if (failures.length) {
  const message = `Bundle budget ${strict ? "failed" : "warning"}: ${failures.join("; ")}`;
  if (strict) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
}

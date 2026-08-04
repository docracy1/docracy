/**
 * Records the landing-page “How it works” demo to public/videos/how-it-works.webm
 * Run from repo root: node apps/web/scripts/record-how-it-works.mjs
 * Requires playwright (uses marketing/linkedin’s install if present).
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const demoPath = path.join(__dirname, "demos/how-it-works.html");
const outDir = path.join(root, "apps/web/public/videos");
const outPath = path.join(outDir, "how-it-works.webm");
const VIEWPORT = { width: 1280, height: 720 };
/** Keep in sync with total sleep() chain in demos/how-it-works.html (~63s + buffer) */
const DURATION_MS = 68000;

async function loadPlaywright() {
  const candidates = [
    path.join(root, "marketing/linkedin/node_modules/playwright/index.js"),
    path.join(root, "node_modules/playwright/index.js"),
  ];
  for (const entry of candidates) {
    if (!fs.existsSync(entry)) continue;
    const req = createRequire(entry);
    return req("playwright");
  }
  throw new Error("playwright not found — run: cd marketing/linkedin && npm install");
}

const { chromium } = await loadPlaywright();
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: outDir, size: VIEWPORT },
});
const page = await context.newPage();
await page.goto(pathToFileURL(demoPath).href);
await page.waitForTimeout(DURATION_MS);

const video = page.video();
await context.close();
await browser.close();

if (!video) throw new Error("No video recorded");
const tempPath = await video.path();
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
fs.renameSync(tempPath, outPath);
console.log(`✓ ${outPath}`);

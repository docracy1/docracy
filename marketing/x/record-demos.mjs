/**
 * Records X demo videos. Run from marketing/x: npm install && npm run record
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demosDir = path.join(__dirname, "demos");
const linkedinDemos = path.join(__dirname, "..", "linkedin", "demos");
const videosDir = path.join(__dirname, "videos");

const DEMOS = [
  { file: "auto-detect.html", dir: linkedinDemos, name: "x-01-auto-detect", durationMs: 6500 },
  { file: "sms-invites.html", dir: linkedinDemos, name: "x-02-sms", durationMs: 5500 },
  { file: "signer-attachments.html", dir: linkedinDemos, name: "x-03-attachments", durationMs: 6000 },
  { file: "anchor-tags.html", dir: demosDir, name: "x-04-anchor-tags", durationMs: 6500 },
];

const VIEWPORT = { width: 1280, height: 720 };

async function recordDemo({ file, dir, name, durationMs }) {
  fs.mkdirSync(videosDir, { recursive: true });
  const outPath = path.join(videosDir, `${name}.webm`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: videosDir, size: VIEWPORT },
  });
  const page = await context.newPage();
  await page.goto(`file://${path.join(dir, file)}`);
  await page.waitForTimeout(durationMs);

  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const tempPath = await video.path();
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    fs.renameSync(tempPath, outPath);
    console.log(`✓ ${outPath}`);
  }
}

for (const demo of DEMOS) {
  await recordDemo(demo);
}

console.log("\nDone.");

/**
 * Records LinkedIn demo videos from the HTML mockups in demos/.
 * Output: videos/post-01-auto-detect.webm (etc.)
 *
 * Run: npm install && npm run record
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demosDir = path.join(__dirname, "demos");
const videosDir = path.join(__dirname, "videos");

const DEMOS = [
  { file: "auto-detect.html", name: "post-01-auto-detect", durationMs: 6500 },
  { file: "sms-invites.html", name: "post-03-sms-invites", durationMs: 5500 },
  { file: "signer-attachments.html", name: "post-04-signer-attachments", durationMs: 6000 },
];

const VIEWPORT = { width: 1280, height: 720 };

async function recordDemo({ file, name, durationMs }) {
  fs.mkdirSync(videosDir, { recursive: true });
  const outPath = path.join(videosDir, `${name}.webm`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: videosDir, size: VIEWPORT },
  });
  const page = await context.newPage();
  const demoUrl = `file://${path.join(demosDir, file)}`;

  await page.goto(demoUrl);
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

console.log("\nDone. Attach .webm files to LinkedIn posts 1, 3, and 4.");

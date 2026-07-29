/**
 * Records a vertical mobile demo (1080×1920) for LinkedIn / Reels / Shorts / TikTok.
 * Output: videos/mobile-sign.webm
 *
 * Run from marketing/linkedin: npm run record:mobile
 */
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demosDir = path.join(__dirname, "demos");
const videosDir = path.join(__dirname, "videos");
const VIEWPORT = { width: 1080, height: 1920 };
const DURATION_MS = 12000;

async function recordMobileDemo() {
  fs.mkdirSync(videosDir, { recursive: true });
  const outPath = path.join(videosDir, "mobile-sign.webm");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: videosDir, size: VIEWPORT },
  });
  const page = await context.newPage();
  await page.goto(`file://${path.join(demosDir, "mobile-sign.html")}`);
  await page.waitForTimeout(DURATION_MS);

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

async function recordLiveMobile() {
  const outPath = path.join(videosDir, "mobile-live-landing.webm");
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices["iPhone 14"];
  const context = await browser.newContext({
    ...iPhone,
    recordVideo: { dir: videosDir, size: { width: iPhone.viewport.width, height: iPhone.viewport.height } },
  });
  const page = await context.newPage();
  await page.goto("https://docracy.io/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo({ top: 120, behavior: "smooth" }));
  await page.waitForTimeout(1500);
  const sample = page.getByRole("link", { name: /sample|nda|try|free/i }).first();
  if (await sample.count()) {
    await sample.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(3500);
  } else {
    await page.waitForTimeout(2500);
  }
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

await recordMobileDemo();
await recordLiveMobile();
console.log("\nDone. Prefer mobile-sign.webm for posts (clean phone UI).");

/**
 * Capture Docracy product screenshots for the W-9 blog post.
 * Run: cd marketing/linkedin && node capture-w9-blog.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../../apps/web/public/blog/w9");
const w9Pdf = path.join(outDir, "fw9.pdf");
const BASE = process.env.DOCRACY_URL || "https://docracy.io";

fs.mkdirSync(outDir, { recursive: true });

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, type: "png" });
  console.log("✓", file);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await shot(page, "01-landing-upload");

await page.goto(`${BASE}/prepare?freeTemplate=independent-contractor-agreement`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(3000);
await shot(page, "02-prepare-fields");

await page.goto(`${BASE}/prepare`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const fileInput = page.locator('input[type="file"]').first();
if ((await fileInput.count()) > 0 && fs.existsSync(w9Pdf)) {
  await fileInput.setInputFiles(w9Pdf);
  await page.waitForTimeout(4000);
  await shot(page, "03-w9-uploaded");

  const nameInput = page.locator('input').filter({ hasText: "" }).nth(0);
  // Prefer labeled signer fields
  const signerName = page.getByPlaceholder(/name/i).first();
  const signerEmail = page.getByPlaceholder(/email/i).first();
  if (await signerName.count()) await signerName.fill("Alex Contractor");
  if (await signerEmail.count()) await signerEmail.fill("alex@example.com");
  await page.waitForTimeout(400);
  await shot(page, "04-add-signer");
} else {
  console.warn("No file input or missing fw9.pdf — skipping W-9 upload shots");
}

await browser.close();
console.log("Done.");

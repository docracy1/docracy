// Actively pings the IndexNow API (https://www.indexnow.org/documentation) after a real
// production deploy — the passive half (the key file itself) is written by prerender.mjs on
// every build. IndexNow is honored by Bing, Yandex, Seznam.cz, Naver, and a few others; Google
// does not participate in the protocol, so this speeds up indexing on those engines only — it's
// not a substitute for the sitemap Google itself crawls.
//
// Deliberately run as its own script invoked from deploy:pages (not from prerender.mjs, which
// also runs on local/dev builds) so a `npm run build` while iterating never pings a real API.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INDEXNOW_KEY } from "./indexNowKey.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const HOST = "docracy.io";
const SITE = `https://${HOST}`;

function sitemapPath() {
  // Prefer the sitemap we just prerendered into dist/ (deploy:pages / CI). public/
  // can lag if only a band-aid script patched it.
  const distPath = path.join(root, "dist", "sitemap.xml");
  if (fs.existsSync(distPath)) return distPath;
  return path.join(root, "public", "sitemap.xml");
}

function readSitemapUrls() {
  const file = sitemapPath();
  const xml = fs.readFileSync(file, "utf-8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) throw new Error(`No <loc> entries found in ${file}`);
  return urls;
}

async function submit(urlList) {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });
  // IndexNow returns 200/202 on success; 200 if the key was already seen recently.
  if (res.status !== 200 && res.status !== 202) {
    const body = await res.text().catch(() => "");
    throw new Error(`IndexNow submission failed: ${res.status} ${res.statusText} ${body}`);
  }
  return res.status;
}

const urls = readSitemapUrls();
console.log(`Submitting ${urls.length} URLs to IndexNow...`);
const status = await submit(urls);
console.log(`IndexNow accepted the submission (HTTP ${status}).`);

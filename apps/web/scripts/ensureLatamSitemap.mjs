/**
 * Insert crawlable LATAM EN/ES URLs into public/sitemap.xml and Allow: lines into
 * public/robots.txt when a full prerender has not run yet. Idempotent.
 * `Allow: /es/` already covers Spanish; EN job doors need an exact Allow because of Disallow: /.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLatamDiscovery } from "./writeSeoDiscovery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");

const { sitemapAdded, robotsAdded } = ensureLatamDiscovery(publicDir);
if (sitemapAdded === 0 && robotsAdded === 0) {
  console.log("ensureLatamSitemap: already complete");
} else {
  console.log(`ensureLatamSitemap: added ${sitemapAdded} sitemap urls, ${robotsAdded} robots Allows`);
}

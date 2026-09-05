/**
 * Insert crawlable LATAM job-door URLs into public/sitemap.xml when a full
 * prerender has not run yet. Idempotent. x-default is Spanish (immigrant chrome).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.join(__dirname, "../public/sitemap.xml");

const PAIRS = [
  { en: "/acta", es: "/es/acta" },
  { en: "/consular-appointment", es: "/es/cita-consular" },
  { en: "/ead-tps", es: "/es/ead-tps" },
  { en: "/phone-and-bank", es: "/es/chip-y-banco" },
  { en: "/latam-search", es: "/es/buscar" },
  { en: "/who-files-where", es: "/es/quien-sube-donde" },
  { en: "/packets/latam-to-us", es: "/es/kit-llegar-eeuu" },
  { en: "/trust", es: "/trust" },
];

function entry(urlPath, pair) {
  const loc = `https://docracy.io${urlPath}`;
  const en = `https://docracy.io${pair.en}`;
  const es = `https://docracy.io${pair.es}`;
  const same = pair.en === pair.es;
  const lines = [
    "  <url>",
    `    <loc>${loc}</loc>`,
    "    <changefreq>monthly</changefreq>",
    "    <priority>0.8</priority>",
  ];
  if (!same) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${en}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="es" href="${es}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${es}" />`);
  }
  lines.push("  </url>");
  return lines.join("\n");
}

let xml = fs.readFileSync(sitemapPath, "utf8");
const missing = [];
for (const pair of PAIRS) {
  for (const p of new Set([pair.en, pair.es])) {
    if (!xml.includes(`<loc>https://docracy.io${p}</loc>`)) {
      missing.push(entry(p, pair));
    }
  }
}
if (missing.length === 0) {
  console.log("ensureLatamSitemap: already complete");
  process.exit(0);
}
if (!xml.includes("</urlset>")) throw new Error("sitemap.xml missing </urlset>");
xml = xml.replace("</urlset>", `${missing.join("\n")}\n</urlset>\n`);
fs.writeFileSync(sitemapPath, xml);
console.log(`ensureLatamSitemap: added ${missing.length} urls`);

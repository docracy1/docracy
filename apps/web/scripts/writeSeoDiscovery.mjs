/**
 * Writes sitemap.xml + robots.txt from the prerender route list so discovery
 * can't drift from the pages we actually ship. Called at the end of prerender.mjs.
 */
import fs from "node:fs";
import path from "node:path";

const SITE = "https://docracy.io";

const HOW_IT_WORKS_VIDEO = {
  thumbnail: `${SITE}/videos/how-it-works-poster.jpg`,
  content: `${SITE}/videos/how-it-works.webm`,
  duration: 63,
  publicationDate: "2026-08-04T00:00:00+00:00",
};

const ROBOTS_PREFIX_ALLOWS = [
  "Allow: /$",
  "Allow: /es$",
  "Allow: /es/",
  "Allow: /free-templates",
  "Allow: /blog",
  "Allow: /import-from-",
  "Allow: /industry/",
  "Allow: /for/",
  "Allow: /videos/",
  "Allow: /llms.txt$",
  "Allow: /llms-full.txt$",
  "Allow: /auth.md$",
  "Allow: /.well-known/mcp/server-card.json$",
  "Allow: /favicon.ico$",
  "Allow: /favicon.svg$",
  "Allow: /favicon.png$",
  "Allow: /favicon-32.png$",
  "Allow: /apple-touch-icon.png$",
  "Allow: /og-image.png$",
  "Allow: /docracy-seal-icon.png$",
];

const ROBOTS_DISALLOW = `
# --- Token / API / short-links (explicit; longer than CF Allow: /) ---
# /prepare /login /dashboard /roadmap /es/preparar stay crawlable so www + ?ref=
# 301s do not land on a robots-blocked URL (GSC Redirect error). Those shells
# stay noindex via meta + X-Robots-Tag.
Disallow: /api/
Disallow: /bulk-send
Disallow: /auth/
Disallow: /admin/
Disallow: /embed/
Disallow: /sign/
Disallow: /status/
Disallow: /income-proof/
Disallow: /es/constancia/
Disallow: /1099-season/
Disallow: /es/temporada-1099/
Disallow: /team/
Disallow: /go/
Disallow: /outreach/
Disallow: /try$
Disallow: /nda$
Disallow: /price$
Disallow: /submit$
Disallow: /marketplace$
Disallow: /prepare/sent

# Catch-all for crawlers that don't get Cloudflare's managed Allow: /
Disallow: /

Sitemap: https://docracy.io/sitemap.xml
Sitemap: https://api.docracy.io/api/blog-posts/sitemap.xml
Sitemap: https://api.docracy.io/api/marketplace/sitemap.xml
`.trim();

/** EN/ES pairs Bing/Yandex must see. `Allow: /es/` already covers Spanish; EN needs an exact Allow
 *  because of the catch-all `Disallow: /`. Used by writeSeoDiscovery fallback + ensureLatamSitemap. */
export const LATAM_SITEMAP_PAIRS = [
  { en: "/acta", es: "/es/acta" },
  { en: "/consular-appointment", es: "/es/cita-consular" },
  { en: "/ead-tps", es: "/es/ead-tps" },
  { en: "/phone-and-bank", es: "/es/chip-y-banco" },
  { en: "/latam-search", es: "/es/buscar" },
  { en: "/who-files-where", es: "/es/quien-sube-donde" },
  { en: "/packets/latam-to-us", es: "/es/kit-llegar-eeuu" },
  { en: "/itin", es: "/es/itin" },
  { en: "/after-arrival", es: "/es/despues-de-llegar" },
  { en: "/i-9", es: "/es/formulario-i-9" },
  { en: "/visa-supporting-documents", es: "/es/documentos-para-visa" },
  { en: "/immigrant-housing", es: "/es/arrendamiento-inmigrante" },
  { en: "/immigrant-documents", es: "/es/documentos-para-inmigrantes" },
  { en: "/move-to-us", es: "/es/llegar-a-estados-unidos" },
  { en: "/mexico-to-us", es: "/es/mexico-a-eeuu" },
  { en: "/colombia-to-us", es: "/es/colombia-a-eeuu" },
  { en: "/peru-to-us", es: "/es/peru-a-eeuu" },
  { en: "/argentina-to-us", es: "/es/argentina-a-eeuu" },
  { en: "/chile-to-us", es: "/es/chile-a-eeuu" },
  { en: "/panama-to-us", es: "/es/panama-a-eeuu" },
  { en: "/venezuela-to-us", es: "/es/venezuela-a-eeuu" },
  { en: "/ecuador-to-us", es: "/es/ecuador-a-eeuu" },
  { en: "/guatemala-to-us", es: "/es/guatemala-a-eeuu" },
  { en: "/honduras-to-us", es: "/es/honduras-a-eeuu" },
  { en: "/el-salvador-to-us", es: "/es/el-salvador-a-eeuu" },
  { en: "/dominican-republic-to-us", es: "/es/republica-dominicana-a-eeuu" },
  { en: "/bolivia-to-us", es: "/es/bolivia-a-eeuu" },
  { en: "/costa-rica-to-us", es: "/es/costa-rica-a-eeuu" },
  { en: "/nicaragua-to-us", es: "/es/nicaragua-a-eeuu" },
  { en: "/uruguay-to-us", es: "/es/uruguay-a-eeuu" },
  { en: "/paraguay-to-us", es: "/es/paraguay-a-eeuu" },
  { en: "/cuba-to-us", es: "/es/cuba-a-eeuu" },
  { en: "/boundless-alternative", es: "/es/alternativa-a-boundless" },
  { en: "/citizenpath-alternative", es: "/es/alternativa-a-citizenpath" },
  { en: "/visa-service-alternative", es: "/es/alternativa-a-gestoria-de-visa" },
  { en: "/boundless-vs-citizenpath", es: "/es/boundless-vs-citizenpath" },
];

export const LATAM_EN_ALLOW_PATHS = [...new Set(LATAM_SITEMAP_PAIRS.map((p) => p.en))];

function latamSitemapEntry(urlPath, pair) {
  const loc = `${SITE}${urlPath}`;
  const en = `${SITE}${pair.en}`;
  const es = `${SITE}${pair.es}`;
  const lines = [
    "  <url>",
    `    <loc>${loc}</loc>`,
    "    <changefreq>monthly</changefreq>",
    "    <priority>0.8</priority>",
  ];
  if (pair.en !== pair.es) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${en}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="es" href="${es}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${es}" />`);
  }
  lines.push("  </url>");
  return lines.join("\n");
}

/** Patch committed public/sitemap.xml + robots.txt when a full prerender has not run yet. */
export function ensureLatamDiscovery(publicDir) {
  const sitemapPath = path.join(publicDir, "sitemap.xml");
  const robotsPath = path.join(publicDir, "robots.txt");
  let xml = fs.readFileSync(sitemapPath, "utf8");
  const missing = [];
  for (const pair of LATAM_SITEMAP_PAIRS) {
    for (const p of new Set([pair.en, pair.es])) {
      if (!xml.includes(`<loc>${SITE}${p}</loc>`)) {
        missing.push(latamSitemapEntry(p, pair));
      }
    }
  }
  if (missing.length) {
    if (!xml.includes("</urlset>")) throw new Error("sitemap.xml missing </urlset>");
    xml = xml.replace("</urlset>", `${missing.join("\n")}\n</urlset>\n`);
    fs.writeFileSync(sitemapPath, xml);
  }

  let robots = fs.readFileSync(robotsPath, "utf8");
  const missingAllow = LATAM_EN_ALLOW_PATHS.filter((p) => !robots.includes(`Allow: ${p}$`));
  if (missingAllow.length) {
    const marker = "# --- Token / API / short-links";
    if (!robots.includes(marker)) throw new Error("robots.txt missing Token/API marker");
    const block = `${missingAllow
      .sort()
      .map((p) => `Allow: ${p}$`)
      .join("\n")}\n\n`;
    robots = robots.replace(marker, `${block}${marker}`);
    fs.writeFileSync(robotsPath, robots);
  }

  return { sitemapAdded: missing.length, robotsAdded: missingAllow.length };
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function abs(urlPath) {
  return urlPath === "/" ? `${SITE}/` : `${SITE}${urlPath}`;
}

function priorityFor(urlPath) {
  if (urlPath === "/" || urlPath === "/es") return "1.0";
  if (urlPath === "/free-templates" || urlPath === "/pricing" || urlPath === "/blog") return "0.8";
  if (
    urlPath === "/1099-season" ||
    urlPath === "/es/temporada-1099" ||
    urlPath === "/cobro" ||
    urlPath === "/es/cobro" ||
    urlPath === "/packets/latam-contractor" ||
    urlPath === "/es/kit-contratista-latam" ||
    urlPath === "/packets/us-contractor" ||
    urlPath === "/es/kit-contratista" ||
    urlPath === "/packets/trades" ||
    urlPath === "/es/kit-oficios" ||
    urlPath === "/packets/latam-trade" ||
    urlPath === "/es/kit-comercio" ||
    urlPath === "/packets/collect" ||
    urlPath === "/es/pide-documentos" ||
    urlPath === "/income-proof" ||
    urlPath === "/es/constancia" ||
    urlPath === "/proof-of-income" ||
    urlPath === "/es/prueba-de-ingresos" ||
    urlPath === "/signed-work-order" ||
    urlPath === "/es/orden-de-trabajo-firmada" ||
    urlPath === "/contractor-payment-proof" ||
    urlPath === "/es/comprobante-pago-contratistas" ||
    urlPath === "/latam-export-documents" ||
    urlPath === "/es/documentos-exportacion" ||
    urlPath === "/request-w9" ||
    urlPath === "/es/pedir-w9" ||
    urlPath === "/acta" ||
    urlPath === "/es/acta" ||
    urlPath === "/consular-appointment" ||
    urlPath === "/es/cita-consular" ||
    urlPath === "/ead-tps" ||
    urlPath === "/es/ead-tps" ||
    urlPath === "/phone-and-bank" ||
    urlPath === "/es/chip-y-banco" ||
    urlPath === "/latam-search" ||
    urlPath === "/es/buscar" ||
    urlPath === "/who-files-where" ||
    urlPath === "/es/quien-sube-donde" ||
    urlPath === "/packets/latam-to-us" ||
    urlPath === "/es/kit-llegar-eeuu" ||
    urlPath === "/itin" ||
    urlPath === "/es/itin" ||
    urlPath === "/after-arrival" ||
    urlPath === "/es/despues-de-llegar" ||
    urlPath === "/i-9" ||
    urlPath === "/es/formulario-i-9" ||
    urlPath === "/mexico-to-us" ||
    urlPath === "/es/mexico-a-eeuu" ||
    urlPath === "/colombia-to-us" ||
    urlPath === "/es/colombia-a-eeuu"
  ) {
    return "0.8";
  }
  if (urlPath.startsWith("/free-templates/") || urlPath.startsWith("/blog/")) return "0.7";
  if (urlPath.includes("-alternative") || urlPath.includes("-vs-")) return "0.7";
  return "0.6";
}

function changefreqFor(urlPath) {
  if (urlPath === "/" || urlPath === "/es") return "weekly";
  return "monthly";
}

function videoBlock(locale) {
  const title =
    locale === "es"
      ? "Cómo funciona Docracy — firma documentos en menos de un minuto"
      : "How Docracy works — sign documents in under a minute";
  const description =
    locale === "es"
      ? "Un recorrido breve de Docracy: sube un PDF, coloca campos de firma, envía enlaces por correo y descarga el documento firmado — gratis hasta dos firmantes, sin cuenta."
      : "A short walkthrough of Docracy: upload a PDF, place signature fields, email signing links, and download the signed document — free for up to two signers, no account needed.";
  return `    <video:video>
      <video:thumbnail_loc>${HOW_IT_WORKS_VIDEO.thumbnail}</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(description)}</video:description>
      <video:content_loc>${HOW_IT_WORKS_VIDEO.content}</video:content_loc>
      <video:duration>${HOW_IT_WORKS_VIDEO.duration}</video:duration>
      <video:publication_date>${HOW_IT_WORKS_VIDEO.publicationDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`;
}

function urlEntry(route) {
  const loc = abs(route.urlPath);
  const lines = [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <changefreq>${changefreqFor(route.urlPath)}</changefreq>`,
    `    <priority>${priorityFor(route.urlPath)}</priority>`,
  ];
  if (route.alternates?.en && route.alternates?.es) {
    const enHref = abs(route.alternates.en);
    const esHref = abs(route.alternates.es);
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enHref)}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(esHref)}" />`);
    const defaultHref = route.xDefault === "es" ? esHref : enHref;
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(defaultHref)}" />`);
  }
  if (route.urlPath === "/how-it-works" || route.urlPath === "/es/como-funciona") {
    lines.push(videoBlock(route.locale === "es" ? "es" : "en"));
  }
  lines.push("  </url>");
  return lines.join("\n");
}

function robotsAllowForRoutes(routes) {
  const exact = new Set();
  for (const r of routes) {
    const p = r.urlPath;
    if (p === "/") continue;
    if (p.startsWith("/es/")) continue; // covered by Allow: /es/
    if (p.startsWith("/free-templates")) continue;
    if (p.startsWith("/blog")) continue;
    if (p.startsWith("/import-from-")) continue;
    if (p.startsWith("/industry/")) continue;
    if (p.startsWith("/for/")) continue;
    if (p.startsWith("/videos/")) continue;
    exact.add(p);
  }
  // Always allow these top-level marketing pages even if somehow omitted from routes.
  for (const p of [
    "/privacy",
    "/terms",
    "/mcp",
    "/ai",
    "/developers",
    "/about",
    "/pricing",
    "/docs",
    "/imprint",
    "/trust",
    "/dpa",
    "/uptime",
    "/verify",
    "/es/verificar",
    "/packets/us-contractor",
    "/es/kit-contratista",
    "/packets/latam-contractor",
    "/es/kit-contratista-latam",
    "/packets/trades",
    "/es/kit-oficios",
    "/packets/latam-trade",
    "/es/kit-comercio",
    "/packets/collect",
    "/es/pide-documentos",
    "/1099-season",
    "/es/temporada-1099",
    "/cobro",
    "/es/cobro",
    "/1099-contractor-records",
    "/hire-contractor-abroad",
    "/income-proof",
    "/proof-of-income",
    "/signed-work-order",
    "/contractor-payment-proof",
    "/latam-export-documents",
    "/request-w9",
    "/templates",
    ...LATAM_EN_ALLOW_PATHS,
  ]) {
    exact.add(p);
  }
  return [...exact]
    .sort()
    .map((p) => `Allow: ${p}$`)
    .join("\n");
}

/**
 * @param {{ urlPath: string, locale?: string, alternates?: { en: string, es: string } }[]} routes
 * @param {{ distDir: string, publicDir: string }} dirs
 */
export function writeSeoDiscovery(routes, { distDir, publicDir }) {
  const seen = new Set();
  const unique = [];
  for (const r of routes) {
    if (seen.has(r.urlPath)) continue;
    seen.add(r.urlPath);
    unique.push(r);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${unique.map(urlEntry).join("\n")}
</urlset>
`;

  const robots = `# robots.txt for https://docracy.io
#
# NOTE: Cloudflare’s dashboard “AI Crawl Control” / Content-Signal managed block is
# prepended live (User-agent: * + Content-Signal + Allow: /). Google merges both
# User-agent: * groups and, at equal path length, prefers Allow over Disallow — so
# the site-level \`Disallow: /\` alone does NOT hide token/API paths from
# Googlebot. Those routes use longer explicit Disallow paths so they still win.
#
# Allow rules below are GENERATED from scripts/prerender.mjs (writeSeoDiscovery) —
# do not hand-edit the Allow list; re-run the web build instead.

User-agent: *

# --- Public marketing / SEO (generated from prerender routes) ---
${ROBOTS_PREFIX_ALLOWS.join("\n")}
${robotsAllowForRoutes(unique)}

${ROBOTS_DISALLOW}
`;

  for (const dir of [distDir, publicDir]) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap);
    fs.writeFileSync(path.join(dir, "robots.txt"), robots);
  }
  console.log(`seo-discovery: wrote sitemap.xml (${unique.length} urls) + robots.txt → dist/ and public/`);
}

/**
 * Writes sitemap.xml + robots.txt from the prerender route list so discovery
 * can't drift from the pages we actually ship. Called at the end of prerender.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PUBLIC_APP_URL,
  PUBLIC_CONNECTOR_URL,
  PUBLIC_WORKER_URL,
  rewriteLegacyPublicUrls,
} from "../site.config.mjs";

const SITE = PUBLIC_APP_URL;

const HOW_IT_WORKS_VIDEO = {
  thumbnail: `${SITE}/videos/how-it-works-poster.jpg`,
  content: `${SITE}/videos/how-it-works.webm`,
  duration: 63,
  publicationDate: "2026-08-04",
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
# --- App / private / attribution short-links (explicit; longer than CF Allow: /) ---
Disallow: /login
Disallow: /dashboard
Disallow: /prepare
Disallow: /es/preparar
Disallow: /bulk-send
Disallow: /roadmap
Disallow: /auth/
Disallow: /admin/
Disallow: /embed/
Disallow: /sign/
Disallow: /status/
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

Sitemap: ${PUBLIC_APP_URL}/sitemap.xml
Sitemap: ${PUBLIC_WORKER_URL}/api/blog-posts/sitemap.xml
Sitemap: ${PUBLIC_WORKER_URL}/api/marketplace/sitemap.xml
`.trim();

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function abs(urlPath) {
  return urlPath === "/" ? `${SITE}/` : `${SITE}${urlPath}`;
}

function priorityFor(urlPath) {
  if (urlPath === "/" || urlPath === "/es") return "1.0";
  if (urlPath === "/free-templates" || urlPath === "/pricing" || urlPath === "/blog") return "0.8";
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
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enHref)}" />`);
  }
  if (route.urlPath === "/" || route.urlPath === "/es") {
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
    "/templates",
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

  const robots = `# robots.txt for ${PUBLIC_APP_URL}
#
# NOTE: Cloudflare’s dashboard “AI Crawl Control” / Content-Signal managed block is
# prepended live (User-agent: * + Content-Signal + Allow: /). Google merges both
# User-agent: * groups and, at equal path length, prefers Allow over Disallow — so
# the site-level \`Disallow: /\` alone does NOT hide /login, /dashboard, etc. from
# Googlebot. App routes below use longer explicit Disallow paths so they still win.
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

  writePublicUrlAssets({ distDir, publicDir });

  console.log(`seo-discovery: wrote sitemap.xml (${unique.length} urls) + robots.txt → dist/ and public/`);
}

/** Copy llms / MCP discovery files with current PUBLIC_* URLs (source files keep doocracy.io literals). */
function writePublicUrlAssets({ distDir, publicDir }) {
  const publicSrc = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
  const textFiles = ["llms.txt", "llms-full.txt", "auth.md"];
  for (const name of textFiles) {
    const src = path.join(publicSrc, name);
    if (!fs.existsSync(src)) continue;
    const body = rewriteLegacyPublicUrls(fs.readFileSync(src, "utf-8"));
    for (const dir of [distDir, publicDir]) {
      fs.writeFileSync(path.join(dir, name), body);
    }
  }

  const serverCard = {
    serverInfo: {
      name: "docracy",
      version: "0.1.0",
      websiteUrl: PUBLIC_APP_URL,
    },
    transport: {
      type: "streamable-http",
      url: `${PUBLIC_CONNECTOR_URL}/mcp`,
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
    authentication: {
      required: false,
      note: "No authentication needed for free template tools and check_status. A Bearer API key (or ?token= query param), issued from the Docracy Dashboard, unlocks find_documents.",
      schemes: ["none", "bearer"],
    },
    tools: [
      { name: "list_templates", tier: "free", description: "Browse free-library and Marketplace templates by keyword." },
      { name: "get_template", tier: "free", description: "Metadata, drafting hints, and prepare URL for one template slug." },
      { name: "draft_from_template", tier: "free", description: "Return a drafting brief and prepare link; never auto-sends." },
      { name: "check_status", tier: "free", description: "Look up the status of a Docracy signing chain from a sign or status link." },
      { name: "find_documents", tier: "paid", description: "Search your own Docracy documents by title or a signer's name/email/company." },
    ],
    documentationUrl: `${PUBLIC_APP_URL}/mcp`,
  };

  for (const dir of [distDir, publicDir]) {
    const wellKnownDir = path.join(dir, ".well-known", "mcp");
    fs.mkdirSync(wellKnownDir, { recursive: true });
    fs.writeFileSync(path.join(wellKnownDir, "server-card.json"), `${JSON.stringify(serverCard, null, 2)}\n`);
  }
}

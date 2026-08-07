import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { htmlToMarkdown } from "./htmlToMarkdown.mjs";
import { INDEXNOW_KEY } from "./indexNowKey.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const SITE = "https://docracy.io";
const require = createRequire(import.meta.url);

// react-router-dom's <Link> uses useLayoutEffect internally, which React logs a (harmless, for
// our purposes — we only need the static markup, not hydration) warning about on every static
// render. Filtered here so real errors from renderPath() don't get lost in the noise.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
  originalConsoleError(...args);
};

// --- 1. Bundle the render entry (real React components) to a self-contained CJS file ---
const bundleOutFile = path.join(__dirname, "_render-entry.bundle.cjs");
await build({
  entryPoints: [path.join(__dirname, "_render-entry.tsx")],
  outfile: bundleOutFile,
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  logLevel: "warning",
  // Vite normally supplies import.meta.env.* at build time; a raw esbuild→CJS bundle doesn't, so
  // this stands in for it — matches the real production build's behavior (VITE_API_URL unset).
  // Landing now mounts TurnstileWidget; leave the site key empty so prerender skips the widget.
  define: {
    "import.meta.env.VITE_API_URL": '""',
    "import.meta.env.VITE_TURNSTILE_SITE_KEY": '""',
  },
  // TemplateThumbnail dynamically imports lib/pdfjs.ts (only from a useEffect, which never fires
  // during this static render) purely so pdfjs-dist's `?url` worker asset — a Vite-only import
  // form plain esbuild can't resolve — never has to be bundled here. Externalizing leaves the
  // dynamic import() call unresolved in the output, which is fine since it's never invoked.
  external: ["pdfjs-dist"],
});
require(bundleOutFile); // populates globalThis.__renderPath
const renderPath = globalThis.__renderPath;
fs.unlinkSync(bundleOutFile);

// --- 2. Load the same free-template data the app itself uses (single source of truth) ---
const dataBundleFile = path.join(__dirname, "_freeTemplates.bundle.cjs");
await build({
  entryPoints: [path.join(root, "src/lib/freeTemplates.ts")],
  outfile: dataBundleFile,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "warning",
});
const { FREE_TEMPLATES } = require(dataBundleFile);
fs.unlinkSync(dataBundleFile);

const blogBundleFile = path.join(__dirname, "_blog.bundle.cjs");
await build({
  entryPoints: [path.join(root, "src/lib/blog.ts")],
  outfile: blogBundleFile,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "warning",
});
const { BLOG_POSTS } = require(blogBundleFile);
fs.unlinkSync(blogBundleFile);

const articlesBundleFile = path.join(__dirname, "_articles.bundle.cjs");
await build({
  entryPoints: [path.join(root, "src/lib/articles.ts")],
  outfile: articlesBundleFile,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "warning",
});
const { ARTICLES } = require(articlesBundleFile);
fs.unlinkSync(articlesBundleFile);

const marketingBundleFile = path.join(__dirname, "_marketingPages.bundle.cjs");
await build({
  entryPoints: [path.join(root, "src/lib/marketingPages.ts")],
  outfile: marketingBundleFile,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "warning",
});
const { FEATURE_PAGES, ALTERNATIVE_PAGES, EXPLAINER_PAGES, INDUSTRY_PAGES, getFeaturePageContent } = require(marketingBundleFile);
fs.unlinkSync(marketingBundleFile);

const seoPagesBundleFile = path.join(__dirname, "_seoPages.bundle.cjs");
await build({
  entryPoints: [path.join(root, "src/lib/seoPages.ts")],
  outfile: seoPagesBundleFile,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "warning",
});
const { SEO_LANDING_PAGES } = require(seoPagesBundleFile);
fs.unlinkSync(seoPagesBundleFile);

/** Phase 3 — top templates with Spanish detail pages (keep in sync with paths.ts SEO_TEMPLATE_SLUGS). */
const SEO_TEMPLATE_SLUGS = new Set([
  "mutual-nda",
  "independent-contractor-agreement",
  "offer-letter",
  "freelance-service-agreement",
  "remote-work-policy",
]);
const ES_TEMPLATE_META = {
  "mutual-nda": {
    title: "Plantilla gratis de NDA mutuo — Completa, firma y envía en línea",
    description:
      "Un acuerdo de confidencialidad mutuo (NDA) estándar — también llamado acuerdo de no divulgación — para dos partes que exploran una relación comercial.",
  },
  "independent-contractor-agreement": {
    title: "Plantilla gratis de acuerdo de contratista independiente (1099)",
    description:
      "Define alcance, pago y propiedad intelectual cuando una empresa contrata a un contratista independiente (1099) — no un empleado.",
  },
  "offer-letter": {
    title: "Plantilla gratis de carta de oferta de empleo",
    description:
      "Una carta de oferta de empleo directa que cubre puesto, salario, fecha de inicio y términos de empleo a voluntad.",
  },
  "freelance-service-agreement": {
    title: "Plantilla gratis de contrato freelance (acuerdo de servicios)",
    description:
      "Un contrato freelance que cubre alcance, honorarios, revisiones y propiedad cuando un cliente contrata a un freelancer por proyecto.",
  },
  "remote-work-policy": {
    title: "Plantilla gratis de política de trabajo remoto / desde casa",
    description:
      "Una política breve de trabajo desde casa que cubre horarios, seguridad y expectativas del espacio de trabajo para que firmen los empleados remotos.",
  },
};

// --- 3. Build the list of routes to prerender. Per-template title/description come straight
//     from FREE_TEMPLATES (the same data FreeTemplateDetail.tsx's usePageMeta call reads) — true
//     single-sourcing. The two fixed pages' strings are copied verbatim from their own
//     usePageMeta() call in FreeTemplates.tsx / Mcp.tsx; usePageMeta runs in a useEffect, which
//     never fires during static rendering, so there's no way to capture it live — if either
//     page's usePageMeta() call changes, update the matching entry here too. ---
const routes = [
  {
    // Overwrites the vite-built dist/index.html in place with the same shell plus real rendered
    // body markup — the homepage was previously the one route search engines saw as an empty
    // `<div id="root"></div>` shell, unlike every other page here. Title/description are the same
    // defaults index.html already ships (this route exists to inject body markup + canonical, not
    // to change copy), so withMeta() below is a no-op on those two fields for this route alone.
    urlPath: "/",
    outFile: "index.html",
    title: "Docracy.io – Simple and secure e-signatures for businesses",
    description:
      "Create, send, and sign documents in minutes — free for up to two signers, no account required. Watch how Docracy works, then start from a template or your own PDF.",
    locale: "en",
    alternates: { en: "/", es: "/es" },
  },
  {
    urlPath: "/free-templates",
    // Flat filename, not free-templates/index.html — Cloudflare Pages resolves /free-templates
    // straight to free-templates.html with no redirect; dir/index.html style instead 308-redirects
    // the extensionless path to add a trailing slash first, an extra hop simpler bots may not follow.
    outFile: "free-templates.html",
    title: "Free Business Document Templates — NDA, Contractor Agreement, Offer Letter | Docracy",
    description:
      "Free, ready-to-sign templates for the most common business documents — mutual NDA, independent contractor " +
      "agreement, offer letter, remote work policy, and freelance service agreement. Fill in your details and send " +
      "for signature in minutes.",
    locale: "en",
    alternates: { en: "/free-templates", es: "/es/plantillas-gratis" },
  },
  {
    urlPath: "/mcp",
    outFile: "mcp.html",
    title: "Connect Docracy to Your AI Assistant — MCP Connector | Docracy",
    description:
      "Connect Docracy to Claude, ChatGPT, Grok, or Perplexity as an MCP connector on a paid account — check signing " +
      "status and search your documents from chat. Also automates with Zapier.",
    locale: "en",
    alternates: { en: "/mcp", es: "/es/mcp" },
  },
  {
    urlPath: "/ai",
    outFile: "ai.html",
    title: "AI Auto-Detect for E-Signatures — Place Fields Instantly | Docracy",
    description:
      "Docracy AI auto-detects signature and date fields, explains contracts in plain English, flags risky clauses, " +
      "and generates signable PDFs. Plus an MCP connector for Claude and ChatGPT.",
    locale: "en",
    alternates: { en: "/ai", es: "/es/ia" },
  },
  {
    urlPath: "/esign-ueta",
    outFile: "esign-ueta.html",
    title: "ESIGN Act & UETA E-Signatures — Designed for US Law | Docracy",
    description:
      "Docracy SES electronic signatures are designed to support the U.S. ESIGN Act and UETA: consent, intent to sign, " +
      "audit trail, and a certificate of completion. No AES/QES or identity verification.",
    locale: "en",
    alternates: { en: "/esign-ueta", es: "/es/esign-ueta" },
  },
  {
    urlPath: "/import-from-docusign",
    outFile: "import-from-docusign.html",
    title: "Import Your DocuSign Documents to Docracy — Step-by-Step Guide",
    description:
      "Bring your existing DocuSign documents and templates over to Docracy. No account-linking, no password sharing — just the export steps DocuSign already gives you for free.",
  },
  {
    urlPath: "/import-from-eversign",
    outFile: "import-from-eversign.html",
    title: "Import Your eversign Documents to Docracy — Step-by-Step Guide",
    description:
      "Bring your existing eversign documents over to Docracy. No account-linking required — just the free per-document export eversign already offers.",
  },
  {
    urlPath: "/import-from-hellosign",
    outFile: "import-from-hellosign.html",
    title: "Import Your HelloSign / Dropbox Sign Documents to Docracy",
    description:
      "Bring your existing HelloSign (Dropbox Sign) documents over to Docracy. No account-linking — just the free per-document export already built into Dropbox Sign.",
  },
  {
    urlPath: "/import-from-pandadoc",
    outFile: "import-from-pandadoc.html",
    title: "Import Your PandaDoc Documents to Docracy — Step-by-Step Guide",
    description:
      "Bring your existing PandaDoc documents and templates over to Docracy. No account-linking required — PandaDoc's own DocX export makes this the easiest of the five to migrate from.",
  },
  {
    urlPath: "/import-from-adobe-sign",
    outFile: "import-from-adobe-sign.html",
    title: "Import Your Adobe Acrobat Sign Documents to Docracy",
    description:
      "Bring your existing Adobe Acrobat Sign agreements over to Docracy. No account-linking — just the manual per-document download Adobe already provides.",
  },
  ...INDUSTRY_PAGES.map((p) => ({
    urlPath: `/industry/${p.slug}`,
    outFile: `industry-${p.slug}.html`,
    title: p.seoTitle,
    description: p.seoDescription,
  })),
  {
    urlPath: "/about",
    outFile: "about.html",
    title: "About Docracy",
    description: "Why Docracy exists: free, no-signup e-signatures for quick, low-stakes agreements — built by RELACON GmbH.",
  },
  {
    urlPath: "/pricing",
    outFile: "pricing.html",
    title: "Pricing — Docracy",
    description:
      "Free for signing chains of up to 2 signers, no account required. Paid is $10/month and adds AI tools, an " +
      "MCP connector, unlimited signers, templates, webhooks, and team accounts.",
    locale: "en",
    alternates: { en: "/pricing", es: "/es/precios" },
  },
  {
    urlPath: "/es",
    outFile: "es.html",
    title: "Docracy.io – Firmas electrónicas simples y seguras para negocios",
    description:
      "Crea, envía y firma documentos en minutos — gratis hasta dos firmantes, sin necesidad de cuenta. Mira cómo funciona Docracy y empieza con una plantilla o tu propio PDF.",
    locale: "es",
    alternates: { en: "/", es: "/es" },
  },
  {
    urlPath: "/es/precios",
    outFile: "es/precios.html",
    title: "Precios — Docracy",
    description:
      "Gratis para cadenas de hasta 2 firmantes. El plan de pago es $10/mes fijo por espacio de trabajo — firmantes ilimitados, plantillas, herramientas de IA, conectores y cuentas de equipo.",
    locale: "es",
    alternates: { en: "/pricing", es: "/es/precios" },
  },
  {
    urlPath: "/es/plantillas-gratis",
    outFile: "es/plantillas-gratis.html",
    title:
      "Plantillas gratis de documentos de negocio — NDA, contrato de contratista, carta de oferta | Docracy",
    description:
      "Plantillas gratis listas para firmar para los documentos de negocio más comunes — NDA mutuo, acuerdo de contratista independiente, carta de oferta, política de trabajo remoto y acuerdo de servicios freelance. Completa tus datos y envía a firma en minutos.",
    locale: "es",
    alternates: { en: "/free-templates", es: "/es/plantillas-gratis" },
  },
  {
    urlPath: "/es/alternativa-a-docusign",
    outFile: "es/alternativa-a-docusign.html",
    title: "Alternativa a DocuSign — Firma simple | Docracy",
    description:
      "Una alternativa simple a DocuSign para acuerdos rápidos. Rápida, limpia, sin cuenta. Gratis para hasta 2 firmantes.",
    locale: "es",
    alternates: { en: "/docusign-alternative", es: "/es/alternativa-a-docusign" },
  },
  {
    urlPath: "/es/alternativa-a-hellosign",
    outFile: "es/alternativa-a-hellosign.html",
    title: "Alternativa a HelloSign / Dropbox Sign — Gratis y simple | Docracy",
    description:
      "¿Buscas una alternativa a HelloSign o Dropbox Sign para NDAs y contratos? Gratis hasta 2 firmantes, sin cuenta. Plan de pago $10/mes fijo.",
    locale: "es",
    alternates: { en: "/hellosign-alternative", es: "/es/alternativa-a-hellosign" },
  },
  {
    urlPath: "/es/alternativa-a-adobe-sign",
    outFile: "es/alternativa-a-adobe-sign.html",
    title: "Alternativa a Adobe Sign — Firma electrónica ligera | Docracy",
    description:
      "Alternativa a Adobe Acrobat Sign para freelancers y equipos pequeños. Gratis hasta 2 firmantes, sin cuenta. Plan de pago $10/mes fijo.",
    locale: "es",
    alternates: { en: "/adobe-sign-alternative", es: "/es/alternativa-a-adobe-sign" },
  },
  {
    urlPath: "/es/alternativa-a-eversign",
    outFile: "es/alternativa-a-eversign.html",
    title: "Alternativa a Eversign — Simple y rápida | Docracy",
    description: "Una alternativa ligera a Eversign para acuerdos rápidos. Sin suscripciones, sin complejidad.",
    locale: "es",
    alternates: { en: "/eversign-alternative", es: "/es/alternativa-a-eversign" },
  },
  {
    urlPath: "/es/alternativa-a-pandadoc",
    outFile: "es/alternativa-a-pandadoc.html",
    title: "Alternativa a PandaDoc para acuerdos simples | Docracy",
    description:
      "¿Necesitas firmas sin la suite de propuestas de PandaDoc? Docracy es gratis hasta 2 firmantes — hecho para NDAs y contratos con clientes, no para propuestas de venta.",
    locale: "es",
    alternates: { en: "/pandadoc-alternative", es: "/es/alternativa-a-pandadoc" },
  },
  {
    urlPath: "/es/firma-de-nda",
    outFile: "es/firma-de-nda.html",
    title: getFeaturePageContent("nda-signing", "es").seoTitle,
    description: getFeaturePageContent("nda-signing", "es").seoDescription,
    locale: "es",
    alternates: { en: "/nda-signing", es: "/es/firma-de-nda" },
  },
  {
    urlPath: "/es/contratos-con-clientes",
    outFile: "es/contratos-con-clientes.html",
    title: getFeaturePageContent("client-contracts", "es").seoTitle,
    description: getFeaturePageContent("client-contracts", "es").seoDescription,
    locale: "es",
    alternates: { en: "/client-contracts", es: "/es/contratos-con-clientes" },
  },
  {
    urlPath: "/docs",
    outFile: "docs.html",
    title: "Documentation — Docracy",
    description:
      "How Docracy's free signing flow, paid features (bulk send, embed, contacts, attachments, SMS gateways, Dropbox/OneDrive/Box/Google Drive, AI), Enterprise options, templates, webhooks, and MCP/Zapier automation work.",
    locale: "en",
    alternates: { en: "/docs", es: "/es/documentacion" },
  },
  {
    urlPath: "/es/mcp",
    outFile: "es/mcp.html",
    title: "Conecta Docracy a tu asistente de IA — Conector MCP | Docracy",
    description:
      "Conecta Docracy a Claude, ChatGPT, Grok o Perplexity como conector MCP en una cuenta de pago — consulta el estado de firma y busca documentos desde el chat. También automatiza con Zapier.",
    locale: "es",
    alternates: { en: "/mcp", es: "/es/mcp" },
  },
  {
    urlPath: "/es/ia",
    outFile: "es/ia.html",
    title: "Detección IA para firmas electrónicas — Campos al instante | Docracy",
    description:
      "La IA de Docracy detecta campos de firma y fecha, resume contratos en lenguaje claro, marca cláusulas de riesgo y genera PDFs listos para firmar. Incluye conector MCP para Claude y ChatGPT.",
    locale: "es",
    alternates: { en: "/ai", es: "/es/ia" },
  },
  {
    urlPath: "/es/esign-ueta",
    outFile: "es/esign-ueta.html",
    title: "Firmas electrónicas ESIGN Act y UETA — Diseñadas para la ley de EE. UU. | Docracy",
    description:
      "Las firmas SES de Docracy están diseñadas para respaldar la ESIGN Act y UETA de EE. UU.: consentimiento, " +
      "intención de firmar, registro de auditoría y certificado de finalización. Sin AES/QES ni verificación de identidad.",
    locale: "es",
    alternates: { en: "/esign-ueta", es: "/es/esign-ueta" },
  },
  {
    urlPath: "/es/documentacion",
    outFile: "es/documentacion.html",
    title: "Documentación — Docracy",
    description:
      "Cómo funcionan el flujo gratis de firma, las funciones de pago (envío masivo, integración, contactos, adjuntos, SMS, Dropbox/OneDrive/Box/Google Drive, IA), opciones Enterprise, plantillas, webhooks y automatización MCP/Zapier.",
    locale: "es",
    alternates: { en: "/docs", es: "/es/documentacion" },
  },
  {
    urlPath: "/imprint",
    outFile: "imprint.html",
    title: "Imprint — Docracy",
    description: "Legal entity behind Docracy.",
  },
  {
    urlPath: "/trust",
    outFile: "trust.html",
    title: "Trust & security — Docracy",
    description:
      "How Docracy protects documents: encryption, retention, audit trails, ESIGN Act and UETA alignment for SES e-signatures, eIDAS SES, subprocessors, and Cloudflare infrastructure certifications.",
  },
  {
    urlPath: "/dpa",
    outFile: "dpa.html",
    title: "Data Processing Agreement — Docracy",
    description:
      "GDPR Art. 28 data processing terms between RELACON GmbH (Docracy) and customers who use paid or account features.",
  },
  {
    urlPath: "/blog",
    outFile: "blog.html",
    title: "Blog — Docracy",
    description:
      "How Docracy compares to eversign, DocuSign, PandaDoc, and Adobe Acrobat Sign — honest, sourced comparisons on price and features.",
  },
  ...BLOG_POSTS.map((p) => ({
    urlPath: `/blog/${p.slug}`,
    outFile: `blog/${p.slug}.html`,
    title: `${p.title} | Docracy`,
    description: p.description,
  })),
  ...ARTICLES.map((a) => ({
    urlPath: `/blog/${a.slug}`,
    outFile: `blog/${a.slug}.html`,
    title: `${a.title} | Docracy`,
    description: a.description,
  })),
  ...FREE_TEMPLATES.map((t) => {
    const bilingual = SEO_TEMPLATE_SLUGS.has(t.slug);
    return {
      urlPath: `/free-templates/${t.slug}`,
      outFile: `free-templates/${t.slug}.html`,
      title: `${t.seoTitle} | Docracy`,
      description: t.description,
      ...(bilingual
        ? {
            locale: "en",
            alternates: { en: `/free-templates/${t.slug}`, es: `/es/plantillas-gratis/${t.slug}` },
          }
        : {}),
    };
  }),
  ...[...SEO_TEMPLATE_SLUGS].map((slug) => {
    const meta = ES_TEMPLATE_META[slug];
    return {
      urlPath: `/es/plantillas-gratis/${slug}`,
      outFile: `es/plantillas-gratis/${slug}.html`,
      title: `${meta.title} | Docracy`,
      description: meta.description,
      locale: "es",
      alternates: { en: `/free-templates/${slug}`, es: `/es/plantillas-gratis/${slug}` },
    };
  }),
  ...[...FEATURE_PAGES, ...ALTERNATIVE_PAGES, ...EXPLAINER_PAGES].map((p) => {
    const bilingual = {
      "nda-signing": { en: "/nda-signing", es: "/es/firma-de-nda" },
      "client-contracts": { en: "/client-contracts", es: "/es/contratos-con-clientes" },
      "docusign-alternative": { en: "/docusign-alternative", es: "/es/alternativa-a-docusign" },
      "hellosign-alternative": { en: "/hellosign-alternative", es: "/es/alternativa-a-hellosign" },
      "adobe-sign-alternative": { en: "/adobe-sign-alternative", es: "/es/alternativa-a-adobe-sign" },
      "eversign-alternative": { en: "/eversign-alternative", es: "/es/alternativa-a-eversign" },
      "pandadoc-alternative": { en: "/pandadoc-alternative", es: "/es/alternativa-a-pandadoc" },
    }[p.slug];
    return {
      urlPath: `/${p.slug}`,
      outFile: `${p.slug}.html`,
      title: p.seoTitle,
      description: p.seoDescription,
      ...(bilingual ? { locale: "en", alternates: bilingual } : {}),
    };
  }),
  ...SEO_LANDING_PAGES.map((p) => ({
    urlPath: `/${p.slug}`,
    outFile: `${p.slug}.html`,
    title: p.seoTitle,
    description: p.seoDescription,
  })),
];

// --- 4. Render each route and splice it into the built index.html shell ---
const shell = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function writeBlogFeed() {
  const items = [...BLOG_POSTS, ...ARTICLES]
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
    .map((post) => {
      const url = `${SITE}/blog/${post.slug}`;
      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${new Date(`${post.publishedDate}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${escapeXml(post.description)}</description>
  </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Docracy Blog</title>
    <link>${SITE}/blog</link>
    <description>Product updates, competitor comparisons, and practical guides for simple agreements and online signatures.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  fs.writeFileSync(path.join(distDir, "blog", "feed.xml"), feed);
}

function writeIndexNowKey() {
  fs.writeFileSync(path.join(distDir, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
}

function withMeta(html, { title, description, urlPath, locale = "en", alternates }) {
  const canonical = `${SITE}${urlPath === "/" ? "/" : urlPath}`;
  // Use function replacers — string replacements treat `$10` in copy as a capture-group token.
  let out = html
    .replace(/<html lang="[^"]*"/, `<html lang="${locale}"`)
    .replace(/<title>.*?<\/title>/, () => `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, (_, a, b) => `${a}${description}${b}`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => `${a}${title}${b}`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, (_, a, b) => `${a}${description}${b}`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, (_, a, b) => `${a}${canonical}${b}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, (_, a, b) => `${a}${title}${b}`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, (_, a, b) => `${a}${description}${b}`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => `${a}${canonical}${b}`);

  if (alternates) {
    const enHref = `${SITE}${alternates.en === "/" ? "/" : alternates.en}`;
    const esHref = `${SITE}${alternates.es}`;
    const hreflang = [
      `<link rel="alternate" hreflang="en" href="${enHref}" />`,
      `<link rel="alternate" hreflang="es" href="${esHref}" />`,
      `<link rel="alternate" hreflang="x-default" href="${enHref}" />`,
    ].join("\n    ");
    // Drop any previous hreflang tags then inject before </head>.
    out = out.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>/g, "");
    out = out.replace("</head>", `    ${hreflang}\n  </head>`);
  }

  return out;
}

for (const route of routes) {
  const bodyMarkup = renderPath(route.urlPath, route.locale ?? "en");
  const html = withMeta(shell, route).replace('<div id="root"></div>', `<div id="root">${bodyMarkup}</div>`);
  const outPath = path.join(distDir, route.outFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);

  // A Markdown sibling of the same content, served instead of the .html file when a request's
  // Accept header prefers text/markdown (see functions/_middleware.ts) — built from the identical
  // renderPath() output, not a separately-maintained copy, so the two can't drift out of sync.
  const mdOutPath = outPath.replace(/\.html$/, ".md");
  fs.writeFileSync(mdOutPath, htmlToMarkdown(bodyMarkup));

  console.log(`prerendered ${route.urlPath} -> dist/${route.outFile} (+ .md)`);
}

fs.mkdirSync(path.join(distDir, "blog"), { recursive: true });
writeBlogFeed();
writeIndexNowKey();

console.log(`Done — ${routes.length} routes prerendered.`);

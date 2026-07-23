import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

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
  define: { "import.meta.env.VITE_API_URL": '""' },
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

// --- 3. Build the list of routes to prerender. Per-template title/description come straight
//     from FREE_TEMPLATES (the same data FreeTemplateDetail.tsx's usePageMeta call reads) — true
//     single-sourcing. The two fixed pages' strings are copied verbatim from their own
//     usePageMeta() call in FreeTemplates.tsx / Mcp.tsx; usePageMeta runs in a useEffect, which
//     never fires during static rendering, so there's no way to capture it live — if either
//     page's usePageMeta() call changes, update the matching entry here too. ---
const routes = [
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
  },
  {
    urlPath: "/mcp",
    outFile: "mcp.html",
    title: "Connect Docracy to Your AI Assistant — MCP Connector | Docracy",
    description:
      "Connect Docracy to Claude, ChatGPT, Grok, or Perplexity as an MCP connector — free to try with no signup, " +
      "or upgrade for document search and the full AI toolset. Also automates with Zapier.",
  },
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
      "Free for signing chains of up to 2 signers, no account required. Paid is $7/month and adds AI tools, an " +
      "MCP connector, unlimited signers, templates, webhooks, and team accounts.",
  },
  {
    urlPath: "/docs",
    outFile: "docs.html",
    title: "Documentation — Docracy",
    description: "How Docracy's free signing flow, paid AI tools, templates, webhooks, and MCP/Zapier automation actually work.",
  },
  {
    urlPath: "/imprint",
    outFile: "imprint.html",
    title: "Imprint — Docracy",
    description: "Legal entity behind Docracy.",
  },
  ...FREE_TEMPLATES.map((t) => ({
    urlPath: `/free-templates/${t.slug}`,
    outFile: `free-templates/${t.slug}.html`,
    title: `${t.seoTitle} | Docracy`,
    description: t.description,
  })),
];

// --- 4. Render each route and splice it into the built index.html shell ---
const shell = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

function withMeta(html, { title, description, urlPath }) {
  const canonical = `${SITE}${urlPath}`;
  return html
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`);
}

for (const route of routes) {
  const bodyMarkup = renderPath(route.urlPath);
  const html = withMeta(shell, route).replace('<div id="root"></div>', `<div id="root">${bodyMarkup}</div>`);
  const outPath = path.join(distDir, route.outFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`prerendered ${route.urlPath} -> dist/${route.outFile}`);
}

console.log(`Done — ${routes.length} routes prerendered.`);

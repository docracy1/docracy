import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { htmlToMarkdown } from "./htmlToMarkdown.mjs";

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
const { FEATURE_PAGES, ALTERNATIVE_PAGES, EXPLAINER_PAGES } = require(marketingBundleFile);
fs.unlinkSync(marketingBundleFile);

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
      "Create, send, and sign documents in minutes. Docracy.io offers fast e-signatures, simple workflows, and secure, compliant document storage.",
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
      "Free for signing chains of up to 2 signers, no account required. Paid is $10/month and adds AI tools, an " +
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
  {
    urlPath: "/trust",
    outFile: "trust.html",
    title: "Trust & security — Docracy",
    description:
      "How Docracy protects documents: encryption, retention, audit trails, ESIGN/eIDAS SES alignment, subprocessors, and Cloudflare infrastructure certifications.",
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
  ...FREE_TEMPLATES.map((t) => ({
    urlPath: `/free-templates/${t.slug}`,
    outFile: `free-templates/${t.slug}.html`,
    title: `${t.seoTitle} | Docracy`,
    description: t.description,
  })),
  ...[...FEATURE_PAGES, ...ALTERNATIVE_PAGES, ...EXPLAINER_PAGES].map((p) => ({
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
  const key = "docracy-indexnow-20260728";
  fs.writeFileSync(path.join(distDir, `${key}.txt`), key);
}

function withMeta(html, { title, description, urlPath }) {
  const canonical = `${SITE}${urlPath}`;
  return html
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`)
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

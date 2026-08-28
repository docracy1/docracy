import { fetchIndexShell, sanitizeForNoIndex } from "../_spaShell";
import { resolveSiteEnv, type SiteBindings } from "../_site";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * SSR for D1 Marketplace / weekly templates at /free-templates/:slug.
 * Static prerendered FREE_TEMPLATES/*.html still win when present; D1-only weekly
 * slugs fall through here so crawlers get real HTML instead of a soft-404 SPA shell.
 */
export const onRequest: PagesFunction<SiteBindings> = async (context) => {
  const { appUrl, workerUrl } = resolveSiteEnv(context.env);
  const url = new URL(context.request.url);
  const slug = url.pathname.replace(/^\/free-templates\//, "").replace(/\/+$/, "");
  if (!slug || slug.includes("/") || slug.includes(".")) {
    return context.next();
  }

  let tpl: {
    title: string;
    description?: string;
    seoTitle?: string | null;
    useCase?: string | null;
    definition?: string | null;
    origin?: string;
  } | null = null;
  try {
    const res = await fetch(`${workerUrl}/api/marketplace/${encodeURIComponent(slug)}`);
    if (res.ok) {
      tpl = (await res.json()) as NonNullable<typeof tpl>;
    }
  } catch {
    tpl = null;
  }

  if (!tpl) {
    const shell = await fetchIndexShell(context.env, context.request, url);
    const html = sanitizeForNoIndex(shell, "Template not found — Docracy");
    return new Response(html, {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
  }

  const title = `${tpl.seoTitle || tpl.title} | Docracy`;
  const description = (tpl.description || tpl.useCase || tpl.definition || tpl.title).slice(0, 300);
  const canonical = `${appUrl}/free-templates/${encodeURIComponent(slug)}`;
  const preload = JSON.stringify({ template: tpl }).replace(/</g, "\\u003c");

  let shell = '<!doctype html><html><head></head><body><div id="root"></div></body></html>';
  try {
    const indexRes = await context.env.ASSETS!.fetch(new Request(new URL("/index.html", url), context.request));
    if (indexRes.ok) shell = await indexRes.text();
  } catch {
    // use minimal shell
  }

  const metaBlock = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <script type="application/json" id="__PRELOADED_MARKETPLACE_TEMPLATE__">${preload}</script>
  `;

  const bodyHtml = `
    <div class="container" style="max-width:720px;margin:0 auto;padding:24px" data-ssr-template="1">
      <p style="font-size:13px"><a href="/free-templates">← Free templates</a></p>
      <h1>${escapeHtml(tpl.title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="/prepare?freeTemplate=${encodeURIComponent(slug)}">Use this template</a></p>
    </div>
  `;

  let html = shell;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`
  );
  if (!html.includes('id="__PRELOADED_MARKETPLACE_TEMPLATE__"')) {
    html = html.replace(/<\/head>/i, `${metaBlock}</head>`);
  }
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};

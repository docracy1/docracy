/**
 * Helpers for SPA fallback responses on Cloudflare Pages.
 *
 * Prerender writes the homepage into dist/index.html. The `_redirects` rule
 * `/* /index.html 200` then serves that homepage HTML (title, canonical `/`,
 * hero h1) for every client-only route and every unknown URL — a soft-404 /
 * duplicate-of-homepage signal in Google Search Console.
 *
 * These helpers empty `#root`, strip homepage canonical/JSON-LD, and add
 * noindex so app routes and true 404s are not indexed as the homepage.
 */

/** Client-only app routes that need the React shell but must not be indexed. */
export function isSpaAppPath(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/prepare" ||
    pathname === "/es/preparar" ||
    pathname === "/prepare/sent" ||
    pathname === "/dashboard" ||
    pathname === "/bulk-send" ||
    pathname === "/roadmap"
  ) {
    return true;
  }
  return (
    pathname.startsWith("/sign/") ||
    pathname.startsWith("/status/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/team/") ||
    pathname.startsWith("/go/") ||
    pathname.startsWith("/outreach/") ||
    pathname.startsWith("/income-proof/") ||
    pathname.startsWith("/es/constancia/") ||
    pathname.startsWith("/1099-season/") ||
    pathname.startsWith("/es/temporada-1099/")
  );
}

/** True when the path looks like a static file (has an extension). */
export function hasFileExtension(pathname: string): boolean {
  return /\.[a-z0-9]+$/i.test(pathname);
}

/** Probe ASSETS for a prerendered HTML file matching an extensionless URL.
 *  Important: Cloudflare may SPA-fallback missing paths to index.html with 200 —
 *  so "ok" alone is not enough; we require a body that is not the homepage shell. */
export async function staticHtmlExists(env: { ASSETS: Fetcher }, origin: string, pathname: string): Promise<boolean> {
  if (pathname === "/" || pathname === "") return true;
  const candidates = [`${pathname}.html`];
  if (pathname.endsWith("/")) candidates.push(`${pathname}index.html`);
  else candidates.push(`${pathname}/index.html`);

  let indexBody: string | null = null;
  const getIndexBody = async () => {
    if (indexBody != null) return indexBody;
    try {
      const idx = await env.ASSETS.fetch(new Request(new URL("/index.html", origin)));
      indexBody = idx.ok ? await idx.text() : "";
    } catch {
      indexBody = "";
    }
    return indexBody;
  };

  for (const p of candidates) {
    try {
      const res = await env.ASSETS.fetch(new Request(new URL(p, origin)));
      if (!res.ok) continue;
      const body = await res.text();
      // Missing files that fall through `/* /index.html 200` look identical to the homepage.
      if (!body || body === (await getIndexBody())) continue;
      // Extra guard: homepage hero h1 must not appear on a real prerendered leaf page.
      if (body.includes("Then the packet they asked for")) continue;
      return true;
    } catch {
      // try next candidate
    }
  }
  return false;
}

/** Replace `<div id="root">…</div>` (nested divs allowed) with an empty root. */
export function emptyRoot(html: string): string {
  const startMark = '<div id="root">';
  const start = html.indexOf(startMark);
  if (start === -1) {
    // Already empty or missing
    if (html.includes('<div id="root"></div>')) return html;
    return html;
  }
  let i = start + startMark.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return `${html.slice(0, start)}<div id="root"></div>${html.slice(nextClose + 6)}`;
      }
      i = nextClose + 6;
    }
  }
  return html;
}

/** Strip og:video / twitter:player tags leaked from the homepage shell. */
export function stripVideoMetaTags(html: string): string {
  return html.replace(
    /\s*<meta\s+(?:property="og:video[^"]*"|name="twitter:player[^"]*")\s+content="[^"]*"\s*\/?>/g,
    ""
  );
}

/** Strip homepage SEO signals and mark the document noindex. */
export function sanitizeForNoIndex(html: string, title: string): string {
  let out = emptyRoot(html);
  out = stripVideoMetaTags(out);
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="" />`
  );
  // Drop canonical pointing at `/` (or any prior value) — noindex pages shouldn't claim a home URL.
  out = out.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>\s*/gi, "");
  out = out.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>\s*/gi, "");
  // Homepage SoftwareApplication / VideoObject JSON-LD must not ride along on /login etc.
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
  if (!/name="robots"/i.test(out)) {
    out = out.replace(/<\/head>/i, `  <meta name="robots" content="noindex, nofollow" />\n  </head>`);
  } else {
    out = out.replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="noindex, nofollow" />`
    );
  }
  return out;
}

/** True when HTML includes the Vite SPA entry (`<script type="module" src="/assets/….js">`). */
export function hasViteModuleScript(html: string): boolean {
  return /<script[^>]*\btype=["']module["'][^>]*\bsrc=["'][^"']*\.js[^"']*["']/i.test(html)
    || /<script[^>]*\bsrc=["'][^"']*\.js[^"']*["'][^>]*\btype=["']module["']/i.test(html);
}

/**
 * Load the built index.html shell (with `/assets/*.js` module tag) from ASSETS.
 * Never clone the inbound request into this fetch — Accept / cookies / bot headers from
 * `/login` have been observed to make ASSETS miss the real index and fall through to the
 * empty hardcoded fallback (no module script → Sign in / Start free never hydrate).
 */
export async function fetchIndexShell(env: { ASSETS: Fetcher }, _request: Request, url: URL): Promise<string> {
  const candidates = ["/index.html", "/"];
  for (const path of candidates) {
    try {
      const indexRes = await env.ASSETS.fetch(
        new Request(new URL(path, url.origin), {
          method: "GET",
          headers: { Accept: "text/html" },
        })
      );
      if (!indexRes.ok) continue;
      const html = await indexRes.text();
      if (html && hasViteModuleScript(html)) return html;
    } catch {
      // try next candidate
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Docracy</title></head><body><div id="root"></div></body></html>`;
}

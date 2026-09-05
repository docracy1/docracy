// Logs a page_view funnel event for every request to a public marketing route, BEFORE the static
// asset is served — deliberately server-side, not a client-side JS beacon, since most AI crawlers
// this is meant to measure (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) never execute
// JavaScript and would otherwise never be counted at all. Fire-and-forget via ctx.waitUntil so a
// slow/failing analytics call never delays the actual page response.
import { FEATURE_PAGES, ALTERNATIVE_PAGES } from "../src/lib/marketingPages";
import {
  fetchIndexShell,
  hasFileExtension,
  hasViteModuleScript,
  isSpaAppPath,
  sanitizeForNoIndex,
  staticHtmlExists,
} from "./_spaShell";
import { legacyTemplateRedirectTarget } from "../src/lib/templateLegacyRedirects";
import { canonicalPublicLocation, firstTouchSetCookieHeader } from "./_trackingParams";

const WORKER_URL = "https://api.docracy.io";

// Fixed top-level routes with no shared prefix to pattern-match on, plus the handful of bilingual
// (/es/...) aliases for pages that have a translated slug — those can't be derived from
// marketingPages.ts since it only stores the canonical English slug per entry.
const TRACKED_ROUTES = new Set([
  "/",
  "/es",
  "/free-templates",
  "/es/plantillas-gratis",
  "/mcp",
  "/es/mcp",
  "/ai",
  "/es/ia",
  "/developers",
  "/es/desarrolladores",
  "/solutions/ai-contract-drafting",
  "/es/soluciones/redaccion-contratos-ia",
  "/enterprise",
  "/es/empresas",
  "/integrations/ai-assistants",
  "/es/integraciones/asistentes-ia",
  "/esign-ueta",
  "/es/esign-ueta",
  "/about",
  "/pricing",
  "/es/precios",
  "/prepare",
  "/es/preparar",
  "/docs",
  "/es/documentacion",
  "/trust",
  "/dpa",
  "/verify",
  "/what-is-an-nda",
  "/are-electronic-signatures-legal",
  "/ueta-electronic-signature",
  "/docracy-ueta-compliance",
  "/es/firma-de-nda",
  "/es/contratos-con-clientes",
  "/es/factura-whatsapp",
  "/es/registros-1099",
  "/es/contratar-en-el-extranjero",
  "/es/prueba-de-ingresos",
  "/es/orden-de-trabajo-firmada",
  "/es/comprobante-pago-contratistas",
  "/es/documentos-exportacion",
  "/es/pedir-w9",
  "/es/alternativa-a-eversign",
  "/es/alternativa-a-docusign",
  "/es/alternativa-a-hellosign",
  "/es/alternativa-a-pandadoc",
  "/es/alternativa-a-adobe-sign",
  "/how-it-works",
  "/es/como-funciona",
  "/1099-season",
  "/es/temporada-1099",
  "/cobro",
  "/es/cobro",
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
  "/income-proof",
  "/es/constancia",
  // Every FeaturePage/AlternativePage slug is a bare "/<slug>" route (see main.tsx) — derived
  // here so a new marketingPages.ts entry is tracked automatically, with no second file to edit.
  ...FEATURE_PAGES.map((p) => `/${p.slug}`),
  ...ALTERNATIVE_PAGES.map((p) => `/${p.slug}`),
]);

// Blog posts are published via the self-serve CMS (no deploy needed), so their slugs can't be
// enumerated in a fixed set the way the routes above are — matched by prefix instead, like
// PartnerPage (/for/*), IndustryPage (/industry/*), and ImportGuidePage (/import-from-*), whose
// routes are also generated from a slug list at render time rather than listed individually.
// Free templates used to be a hardcoded per-slug list, which quietly fell out of sync with the
// actual template library (round 2's 6 templates were never added to it) — prefix-matched now
// for the same reason. The worker's own isTrackedRoute (routes/analytics.ts) is a second gate on
// the same public endpoint; it can't import from this app, so its literal TRACKED_ROUTES list
// must be kept in sync by hand whenever a route here is added outside these prefix patterns.
function isTrackedRoute(pathname: string): boolean {
  // Static files served from these same path prefixes (e.g. /free-templates/mutual-nda.pdf,
  // fetched client-side by TemplateThumbnail to render a preview) must never count as a page
  // view — only the actual page route (no file extension on the last segment) should.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;
  return (
    TRACKED_ROUTES.has(pathname) ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/free-templates/") ||
    pathname.startsWith("/es/plantillas-gratis/") ||
    pathname.startsWith("/for/") ||
    pathname.startsWith("/industry/") ||
    pathname.startsWith("/import-from-")
  );
}

export const onRequest: PagesFunction<{ ASSETS: Fetcher }> = async (context) => {
  const url = new URL(context.request.url);

  // One hop: www → apex, drop trailing slash, strip tracking params (ref / utm_* / gclid…).
  // Keeps freeTemplate, next, send, packet. GSC "alternate + proper canonical" on this site
  // is almost entirely `?ref=` / www variants of pages that already self-canonicalize.
  if (context.request.method === "GET" || context.request.method === "HEAD") {
    const canonical = canonicalPublicLocation(url);
    if (canonical) {
      const headers = new Headers({ Location: canonical.location });
      const ft = firstTouchSetCookieHeader(canonical.stripped);
      if (ft) headers.set("Set-Cookie", ft);
      return new Response(null, { status: 301, headers });
    }
  }

  // Legacy docracy.com document slugs → canonical free template (no duplicate landing pages).
  const legacyTarget = legacyTemplateRedirectTarget(url.pathname);
  if (legacyTarget) {
    const target = new URL(legacyTarget + url.search + url.hash, url.origin);
    return Response.redirect(target.toString(), 301);
  }

  // Never serve HTML for hashed bundles — SPA fallback / Bot Fight interstitials as text/html
  // 200 break `type=module` loads ("Failed to fetch dynamically imported module") and leave
  // /login + /prepare stuck on the prerendered landing shell.
  if (url.pathname.startsWith("/assets/")) {
    const assetResponse = await context.next();
    const ct = assetResponse.headers.get("content-type") ?? "";
    if (ct.includes("text/html")) {
      return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    return assetResponse;
  }

  if (isTrackedRoute(url.pathname)) {
    context.waitUntil(
      fetch(`${WORKER_URL}/api/analytics/pageview`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": context.request.headers.get("user-agent") ?? "",
          // Forwarded so the worker can see the notrack opt-out cookie (see lib/analytics.ts) —
          // without this, a browser that's opted out would still get counted here.
          cookie: context.request.headers.get("cookie") ?? "",
          // The visitor's previous page (if any) — used for referral_source_detected and the
          // Traffic funnel. Sent as a custom header rather than relying on this fetch's own Referer
          // (which would describe this Pages Function calling the worker, not the original visitor).
          "x-referrer": context.request.headers.get("referer") ?? "",
        },
        // Query string so the worker can credit utm_source/utm_campaign on crawler-visible views.
        body: JSON.stringify({ route: url.pathname, query: url.search }),
      }).catch(() => {})
    );
  }

  // "Markdown for agents": a request that prefers text/markdown gets the .md sibling of a
  // prerendered page (see scripts/prerender.mjs / htmlToMarkdown.mjs) instead of the HTML. Only
  // prerendered routes have a real .md file — everything else (/, /prepare, /dashboard, etc., which
  // are fully client-rendered with no static content to convert) has none, and _redirects' SPA
  // catch-all means fetching a nonexistent "<path>.md" doesn't 404 — it silently returns the
  // index.html shell as a 200. The only reliable way to tell a *real* .md response (which Cloudflare
  // serves as content-type text/markdown) apart from that fallback (text/html) is to check the
  // content-type it actually came back with, not just `.ok`.
  const acceptsMarkdown = context.request.headers.get("accept")?.includes("text/markdown");
  if (acceptsMarkdown && context.request.method === "GET" && url.pathname !== "/") {
    try {
      const mdUrl = new URL(`${url.pathname}.md`, url);
      const mdResponse = await context.env.ASSETS.fetch(new Request(mdUrl, context.request));
      if (mdResponse.ok && mdResponse.headers.get("content-type")?.includes("text/markdown")) {
        const body = await mdResponse.text();
        return new Response(body, {
          status: 200,
          headers: { "content-type": "text/markdown; charset=utf-8", "x-markdown-tokens": String(Math.ceil(body.length / 4)) },
        });
      }
    } catch {
      // Falls through to context.next() below — an agent that asked for markdown and can't get it
      // should still get the normal page, not an error.
    }
  }

  // --- Soft-404 / homepage-duplicate guard ---------------------------------
  // Prerender overwrites index.html with the homepage body. The SPA fallback
  // `/* /index.html 200` then serves that homepage (canonical `/`, hero h1) for
  // /login, /dashboard, /prepare, unknown URLs, etc. Googlebot sees duplicates
  // of the homepage — a common GSC Coverage failure.
  //
  // Blog SSR (`functions/blog/[slug].ts`) handles /blog/:slug before this runs
  // via context.next(); missing posts return 404 there. Here we only fix paths
  // that would otherwise hit the catch-all SPA rewrite.
  if (
    context.request.method === "GET" &&
    !hasFileExtension(url.pathname) &&
    url.pathname !== "/" &&
    // API proxy + blog SSR have their own Functions — never rewrite those to a marketing 404.
    !url.pathname.startsWith("/api/") &&
    // Let the more-specific blog / free-templates Functions handle dynamic D1 slugs
    // (including missing → real 404 inside those Functions).
    !url.pathname.startsWith("/blog/") &&
    !url.pathname.startsWith("/free-templates/")
  ) {
    const hasPage = await staticHtmlExists(context.env, url.origin, url.pathname);
    if (!hasPage) {
      const shell = await fetchIndexShell(context.env, context.request, url);
      if (isSpaAppPath(url.pathname)) {
        // Never ship a dead empty shell (no Vite module) — fall through to the SPA rewrite so
        // Sign in / Start free still hydrate, even if that means a soft homepage body until the
        // next edge passes a good index fetch.
        if (!hasViteModuleScript(shell)) {
          return context.next();
        }
        const html = sanitizeForNoIndex(shell, "Docracy");
        if (!hasViteModuleScript(html)) {
          return context.next();
        }
        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "private, no-store",
            "x-robots-tag": "noindex, nofollow",
          },
        });
      }
      // Unknown URL — real 404 (not homepage HTML as 200).
      const html = sanitizeForNoIndex(shell, "Page not found — Docracy");
      return new Response(html, {
        status: 404,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=60",
          "x-robots-tag": "noindex, nofollow",
        },
      });
    }
  }

  return context.next();
};

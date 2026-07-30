// Logs a page_view funnel event for every request to a public marketing route, BEFORE the static
// asset is served — deliberately server-side, not a client-side JS beacon, since most AI crawlers
// this is meant to measure (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) never execute
// JavaScript and would otherwise never be counted at all. Fire-and-forget via ctx.waitUntil so a
// slow/failing analytics call never delays the actual page response.
const WORKER_URL = "https://api.docracy.io";

const TRACKED_ROUTES = new Set([
  "/",
  "/es",
  "/free-templates",
  "/es/plantillas-gratis",
  "/mcp",
  "/about",
  "/pricing",
  "/es/precios",
  "/prepare",
  "/es/preparar",
  "/docs",
  "/trust",
  "/dpa",
  "/simple-agreements",
  "/nda-signing",
  "/client-contracts",
  "/onboarding-documents",
  "/vendor-agreements",
  "/compliance-documentation",
  "/eversign-alternative",
  "/docusign-alternative",
  "/es/alternativa-a-docusign",
  "/hellosign-alternative",
  "/es/alternativa-a-hellosign",
  "/pandadoc-alternative",
  "/adobe-sign-alternative",
  "/es/alternativa-a-adobe-sign",
  "/what-is-an-nda",
  "/are-electronic-signatures-legal",
]);

// Blog posts are published via the self-serve CMS (no deploy needed), so their slugs can't be
// enumerated in a fixed set the way the routes above are — matched by prefix instead. Free
// templates are matched by prefix too: this used to be a hardcoded per-slug list, which quietly
// fell out of sync with the actual template library (round 2's 6 templates were never added to
// it). The worker's own isTrackedRoute (routes/analytics.ts) applies the identical rule as a
// second gate.
function isTrackedRoute(pathname: string): boolean {
  return (
    TRACKED_ROUTES.has(pathname) ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/free-templates/")
  );
}

export const onRequest: PagesFunction<{ ASSETS: Fetcher }> = async (context) => {
  const url = new URL(context.request.url);
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

  return context.next();
};

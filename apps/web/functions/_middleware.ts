// Logs a page_view funnel event for every request to a public marketing route, BEFORE the static
// asset is served — deliberately server-side, not a client-side JS beacon, since most AI crawlers
// this is meant to measure (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) never execute
// JavaScript and would otherwise never be counted at all. Fire-and-forget via ctx.waitUntil so a
// slow/failing analytics call never delays the actual page response.
const WORKER_URL = "https://api.docracy.io";

const STATIC_TEMPLATE_SLUGS = [
  "mutual-nda",
  "independent-contractor-agreement",
  "offer-letter",
  "remote-work-policy",
  "freelance-service-agreement",
  "unilateral-nda",
  "simple-commercial-lease-agreement",
  "non-compete-non-solicitation-agreement",
  "consulting-agreement",
  "vendor-agreement",
  "separation-agreement",
  "equipment-rental-agreement",
  "partnership-agreement",
  "sales-agreement",
  "referral-agreement",
];

const TRACKED_ROUTES = new Set([
  "/",
  "/free-templates",
  "/mcp",
  "/about",
  "/pricing",
  "/docs",
  ...STATIC_TEMPLATE_SLUGS.map((slug) => `/free-templates/${slug}`),
]);

export const onRequest: PagesFunction<{ ASSETS: Fetcher }> = async (context) => {
  const url = new URL(context.request.url);
  if (TRACKED_ROUTES.has(url.pathname)) {
    context.waitUntil(
      fetch(`${WORKER_URL}/api/analytics/pageview`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": context.request.headers.get("user-agent") ?? "",
          // Forwarded so the worker can see the notrack opt-out cookie (see lib/analytics.ts) —
          // without this, a browser that's opted out would still get counted here.
          cookie: context.request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ route: url.pathname }),
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

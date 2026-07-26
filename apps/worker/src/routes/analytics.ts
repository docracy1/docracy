import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { trackEvent, NOTRACK_COOKIE_NAME } from "../lib/analytics";
import type { Env } from "@docracy/shared";

// Only the routes this funnel actually cares about (public marketing pages) — an allow-list, not
// a denylist, so a junk/typo'd route from a stray client never becomes a phantom row in the data.
const TRACKED_ROUTES = new Set([
  "/",
  "/free-templates",
  "/mcp",
  "/about",
  "/pricing",
  "/docs",
  "/free-templates/mutual-nda",
  "/free-templates/independent-contractor-agreement",
  "/free-templates/offer-letter",
  "/free-templates/remote-work-policy",
  "/free-templates/freelance-service-agreement",
  "/free-templates/unilateral-nda",
  "/free-templates/simple-commercial-lease-agreement",
  "/free-templates/non-compete-non-solicitation-agreement",
  "/free-templates/consulting-agreement",
  "/free-templates/vendor-agreement",
  "/free-templates/separation-agreement",
  "/free-templates/equipment-rental-agreement",
  "/free-templates/partnership-agreement",
  "/free-templates/sales-agreement",
  "/free-templates/referral-agreement",
]);

// Blog posts are published via the self-serve CMS (no deploy needed — see routes/blogPosts.ts), so
// their slugs can't be enumerated in a fixed set the way the routes above are; matched by prefix
// instead. `/blog` itself (the index) is tracked as a page view but isn't an "article", so it's
// deliberately excluded from blog_article_loaded below.
function isTrackedRoute(route: string): boolean {
  return TRACKED_ROUTES.has(route) || route === "/blog" || route.startsWith("/blog/");
}

const analytics = new Hono<{ Bindings: Env }>();

// Called by apps/web/functions/_middleware.ts on every request to a tracked route, server-side —
// deliberately not a client-side JS beacon, since most AI crawlers this is meant to measure never
// execute JavaScript and would otherwise never be counted at all.
analytics.post("/pageview", async (c) => {
  let body: { route?: string };
  try {
    body = await c.req.json<{ route?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const route = body.route ?? "";
  if (!isTrackedRoute(route)) return c.json({ error: "Unknown route" }, 400);

  // Opt-out for whoever's own browser has the cookie set (e.g. the site owner doing QA) — see
  // POST /api/admin/analytics/notrack. Still returns 200 either way so the caller (the Pages
  // Function middleware) never sees this as an error.
  if (getCookie(c, NOTRACK_COOKIE_NAME) === "1") return c.json({ ok: true, skipped: true });

  const userAgent = c.req.header("user-agent");
  const country = c.req.header("CF-IPCountry");
  // Forwarded by _middleware.ts from the original navigation's Referer header — the visitor's
  // previous page, if any (same-origin in-app navigation included; distinguished from an external
  // referral below by comparing hostnames).
  const referrer = c.req.header("x-referrer") || "";

  trackEvent(c.env, { event: "page_view", route, userAgent, country });

  if (route === "/") {
    trackEvent(c.env, { event: "landingpage_loaded", route, userAgent, country, referrer });
  }
  if (route.startsWith("/blog/")) {
    trackEvent(c.env, { event: "blog_article_loaded", route, userAgent, country, referrer });
  }

  if (referrer) {
    try {
      const referrerHost = new URL(referrer).hostname;
      const requestHost = new URL(c.req.url).hostname;
      if (referrerHost && referrerHost !== requestHost) {
        trackEvent(c.env, { event: "referral_source_detected", route, userAgent, country, source: referrerHost, referrer });
      }
    } catch {
      // Malformed/unparseable Referer header — not worth logging over.
    }
  }

  return c.json({ ok: true });
});

export default analytics;

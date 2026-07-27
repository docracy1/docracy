import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { trackEvent, NOTRACK_COOKIE_NAME, isExcludedAgent } from "../lib/analytics";
import { checkTrackEventRateLimit } from "../lib/ratelimit";
import { isAdminEmail, resolveAccount, SESSION_COOKIE_NAME } from "../lib/auth";
import type { FunnelEvent } from "../lib/analytics";
import type { Env } from "@docracy/shared";
import type { Context } from "hono";

// Only the routes this funnel actually cares about (public marketing pages) — an allow-list, not
// a denylist, so a junk/typo'd route from a stray client never becomes a phantom row in the data.
// /free-templates/* used to be enumerated slug-by-slug here, which quietly fell out of sync with
// the actual template library twice (round 2's 6 templates were never added) — matched by prefix
// instead now, same fix as the /blog/* prefix match below.
const TRACKED_ROUTES = new Set(["/", "/free-templates", "/mcp", "/about", "/pricing", "/docs"]);

// Blog posts are published via the self-serve CMS (no deploy needed — see routes/blogPosts.ts), so
// their slugs can't be enumerated in a fixed set the way the routes above are; matched by prefix
// instead. `/blog` itself (the index) is tracked as a page view but isn't an "article", so it's
// deliberately excluded from blog_article_loaded below.
function isTrackedRoute(route: string): boolean {
  return TRACKED_ROUTES.has(route) || route === "/blog" || route.startsWith("/blog/") || route.startsWith("/free-templates/");
}

/** Skip founder QA (notrack cookie or ADMIN_EMAILS session) and Claude/Cursor agent browsers. */
async function shouldSkipAnalytics(c: Context<{ Bindings: Env }>): Promise<boolean> {
  if (getCookie(c, NOTRACK_COOKIE_NAME) === "1") return true;
  if (isExcludedAgent(c.req.header("user-agent"))) return true;
  const account = await resolveAccount(c.env, getCookie(c, SESSION_COOKIE_NAME));
  return !!account && isAdminEmail(c.env, account.email);
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

  // Opt-out for the site owner (notrack / admin session) and Claude/Cursor agents — see
  // lib/analytics.ts. Still returns 200 either way so the Pages Function middleware never treats
  // this as an error.
  if (await shouldSkipAnalytics(c)) return c.json({ ok: true, skipped: true });

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

// Events a browser is allowed to fire directly, as opposed to the much larger FunnelEvent set —
// an allow-list (not a denylist) so a compromised/malicious client can't write arbitrary event
// names (or spoof a server-only event like document_signed) into Analytics Engine. Every event
// here is genuinely only observable client-side (a click, a field placement, a page unmount) —
// anything derivable from the request itself already gets logged server-side instead.
const CLIENT_TRACKABLE_EVENTS = new Set<FunnelEvent>([
  "document_upload_started",
  "document_uploaded",
  "fields_added",
  "template_opened",
  "template_used",
  "template_category_viewed",
  "template_preview_opened",
  "template_started",
  "template_abandoned",
  "dashboard_loaded",
  "landingpage_cta_clicked",
  "blog_cta_clicked",
  "upload_failed",
  "field_error",
]);

interface TrackBody {
  event?: string;
  route?: string;
  documentId?: string;
  templateId?: string;
  source?: string;
  templateCategory?: string;
  errorCode?: string;
  sessionId?: string;
}

// A real (if generous) rate limit, unlike /pageview above — that route only ever fires once per
// navigation from trusted server-side middleware, while this one is reachable directly from any
// browser and could otherwise be hammered.
analytics.post("/track", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkTrackEventRateLimit(c.env, ip))) {
    return c.json({ error: "Too many events. Please try again shortly." }, 429);
  }

  let body: TrackBody;
  try {
    body = await c.req.json<TrackBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.event || !CLIENT_TRACKABLE_EVENTS.has(body.event as FunnelEvent)) {
    return c.json({ error: "Unknown or unsupported event" }, 400);
  }

  if (await shouldSkipAnalytics(c)) return c.json({ ok: true, skipped: true });

  trackEvent(c.env, {
    event: body.event as FunnelEvent,
    route: body.route,
    userAgent: c.req.header("user-agent"),
    country: c.req.header("CF-IPCountry"),
    documentId: body.documentId,
    templateId: body.templateId,
    source: body.source,
    templateCategory: body.templateCategory,
    errorCode: body.errorCode,
    sessionId: body.sessionId,
  });

  return c.json({ ok: true });
});

export default analytics;

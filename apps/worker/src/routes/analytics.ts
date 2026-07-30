import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { trackEvent, NOTRACK_COOKIE_NAME, isExcludedAgent, sanitizeAttribution } from "../lib/analytics";
import { checkTrackEventRateLimit } from "../lib/ratelimit";
import { isAdminEmail, resolveAccount, SESSION_COOKIE_NAME } from "../lib/auth";
import type { FunnelEvent } from "../lib/analytics";
import type { Env } from "@docracy/shared";
import type { Context } from "hono";

// Core marketing + prerendered SEO landings (lib/marketingPages.ts). SEO pages were previously
// omitted, so search/social traffic to /nda-signing or /docusign-alternative produced no page_view.
const TRACKED_ROUTES = new Set([
  "/",
  "/free-templates",
  "/mcp",
  "/about",
  "/pricing",
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
  "/hellosign-alternative",
  "/pandadoc-alternative",
  "/adobe-sign-alternative",
  "/what-is-an-nda",
  "/are-electronic-signatures-legal",
]);

function isTrackedRoute(route: string): boolean {
  return TRACKED_ROUTES.has(route) || route === "/blog" || route.startsWith("/blog/") || route.startsWith("/free-templates/");
}

async function shouldSkipAnalytics(c: Context<{ Bindings: Env }>): Promise<boolean> {
  if (getCookie(c, NOTRACK_COOKIE_NAME) === "1") return true;
  if (isExcludedAgent(c.req.header("user-agent"))) return true;
  const account = await resolveAccount(c.env, getCookie(c, SESSION_COOKIE_NAME));
  return !!account && isAdminEmail(c.env, account.email);
}

/** Landing URL campaign tags → same `source/campaign` shape the client stores for first-touch. */
function attributionFromQuery(query: string | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  const source = params.get("utm_source") || params.get("ref") || "";
  if (!source) return "";
  const campaign = params.get("utm_campaign") || params.get("utm_content") || "";
  return sanitizeAttribution(campaign ? `${source}/${campaign}` : source);
}

const analytics = new Hono<{ Bindings: Env }>();

analytics.post("/pageview", async (c) => {
  let body: { route?: string; query?: string };
  try {
    body = await c.req.json<{ route?: string; query?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const route = body.route ?? "";
  if (!isTrackedRoute(route)) return c.json({ error: "Unknown route" }, 400);

  if (await shouldSkipAnalytics(c)) return c.json({ ok: true, skipped: true });

  const userAgent = c.req.header("user-agent");
  const country = c.req.header("CF-IPCountry");
  const referrer = c.req.header("x-referrer") || "";
  const attribution = attributionFromQuery(body.query);

  trackEvent(c.env, { event: "page_view", route, userAgent, country, attribution });

  if (route === "/") {
    trackEvent(c.env, { event: "landingpage_loaded", route, userAgent, country, referrer, attribution });
  }
  if (route.startsWith("/blog/")) {
    trackEvent(c.env, { event: "blog_article_loaded", route, userAgent, country, referrer, attribution });
  }

  if (referrer) {
    try {
      const referrerHost = new URL(referrer).hostname;
      const requestHost = new URL(c.req.url).hostname;
      if (referrerHost && referrerHost !== requestHost) {
        trackEvent(c.env, {
          event: "referral_source_detected",
          route,
          userAgent,
          country,
          source: referrerHost,
          referrer,
          attribution,
        });
      }
    } catch {
      // Malformed Referer — ignore.
    }
  }

  return c.json({ ok: true });
});

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
  // Client-only: upgrade_clicked fires before /billing/checkout; viral_cta_clicked has no session.
  "upgrade_clicked",
  "viral_cta_clicked",
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
  attribution?: string;
}

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
    attribution: sanitizeAttribution(body.attribution),
  });

  return c.json({ ok: true });
});

export default analytics;

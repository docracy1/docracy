import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { trackEvent, NOTRACK_COOKIE_NAME, isExcludedAgent, sanitizeAttribution, isBlockedAttributionSource, isBlockedReferrerHost } from "../lib/analytics";
import { checkTrackEventRateLimit } from "../lib/ratelimit";
import { isAdminEmail, resolveAccount, SESSION_COOKIE_NAME } from "../lib/auth";
import type { FunnelEvent } from "../lib/analytics";
import {
  cleanPath,
  countryCode,
  deviceOf,
  isUntracked,
  isVisitorBot,
  netKind,
  pageKindOf,
  sourceOf,
  tooMany,
  visitorHash,
} from "../lib/visitorCount";
import { insertPageview, recordSeconds } from "../lib/visitorCountDb";
import type { Env } from "@docracy/shared";
import type { Context } from "hono";

// Core marketing + prerendered SEO landings (lib/marketingPages.ts, apps/web/src). This worker
// can't import that file (separate app), so this list is a hand-maintained mirror of
// apps/web/functions/_middleware.ts's TRACKED_ROUTES — which derives its own FeaturePage/
// AlternativePage entries from marketingPages.ts directly. Whenever a new FeaturePage or
// AlternativePage slug is added there, add it here too, or its page_view will 400 at this second
// gate even though the client-side gate already let it through. Routes generated from a slug list
// at render time (PartnerPage /for/*, IndustryPage /industry/*, ImportGuidePage /import-from-*)
// are prefix-matched below instead, same as blog/free-templates — no per-slug entry needed.
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
  "/es/alternativa-a-kita",
  "/es/alternativa-a-alegra",
  "/es/alternativa-a-siigo",
  "/es/alternativa-a-boundless",
  "/es/alternativa-a-citizenpath",
  "/es/alternativa-a-gestoria-de-visa",
  "/kita-vs-alegra",
  "/kita-vs-siigo",
  "/alegra-vs-siigo",
  "/es/kita-vs-alegra",
  "/es/kita-vs-siigo",
  "/es/alegra-vs-siigo",
  "/boundless-vs-citizenpath",
  "/es/boundless-vs-citizenpath",
  // FeaturePage slugs
  "/simple-agreements",
  "/nda-signing",
  "/client-contracts",
  "/onboarding-documents",
  "/vendor-agreements",
  "/compliance-documentation",
  "/whatsapp-signing",
  "/advanced-electronic-signature",
  "/artist-contracts",
  "/creative-licensing",
  "/music-collaboration-contracts",
  "/freelancer-contracts",
  "/web-design-contract",
  "/developer-contracts",
  "/llc-legal-templates",
  "/startup-legal-templates",
  "/founder-agreement",
  "/seo-agency-contract",
  "/marketing-service-agreement",
  "/education-forms",
  "/student-agreements",
  "/import-google-doc",
  "/anonymous-signing",
  "/quick-sign",
  "/upload-and-sign",
  "/simple-signing",
  "/document-verification",
  "/blockchain-timestamp",
  "/1099-contractor-records",
  "/hire-contractor-abroad",
  "/proof-of-income",
  "/signed-work-order",
  "/contractor-payment-proof",
  "/latam-export-documents",
  "/request-w9",
  "/immigrant-documents",
  "/move-to-us",
  "/proof-of-income-us-rental",
  "/i-9",
  "/visa-supporting-documents",
  "/es/documentos-para-inmigrantes",
  "/es/llegar-a-estados-unidos",
  "/es/constancia-para-rentar",
  "/es/formulario-i-9",
  "/es/documentos-para-visa",
  "/mexico-to-us",
  "/es/mexico-a-eeuu",
  "/colombia-to-us",
  "/es/colombia-a-eeuu",
  "/immigrant-housing",
  "/es/arrendamiento-inmigrante",
  "/after-arrival",
  "/es/despues-de-llegar",
  "/itin",
  "/es/itin",
  "/peru-to-us",
  "/es/peru-a-eeuu",
  "/argentina-to-us",
  "/es/argentina-a-eeuu",
  "/chile-to-us",
  "/es/chile-a-eeuu",
  "/panama-to-us",
  "/es/panama-a-eeuu",
  "/venezuela-to-us",
  "/es/venezuela-a-eeuu",
  "/ecuador-to-us",
  "/es/ecuador-a-eeuu",
  "/guatemala-to-us",
  "/es/guatemala-a-eeuu",
  "/honduras-to-us",
  "/es/honduras-a-eeuu",
  "/el-salvador-to-us",
  "/es/el-salvador-a-eeuu",
  "/dominican-republic-to-us",
  "/es/republica-dominicana-a-eeuu",
  "/bolivia-to-us",
  "/es/bolivia-a-eeuu",
  "/costa-rica-to-us",
  "/es/costa-rica-a-eeuu",
  "/nicaragua-to-us",
  "/es/nicaragua-a-eeuu",
  "/uruguay-to-us",
  "/es/uruguay-a-eeuu",
  "/paraguay-to-us",
  "/es/paraguay-a-eeuu",
  "/cuba-to-us",
  "/es/cuba-a-eeuu",
  "/packets/latam-to-us",
  "/es/kit-llegar-eeuu",
  "/latam",
  "/es/latam",
  "/1099-season",
  "/es/temporada-1099",
  "/cobro",
  "/es/cobro",
  "/income-proof",
  "/es/constancia",
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
  // AlternativePage slugs
  "/eversign-alternative",
  "/onlinesignature-alternative",
  "/docusign-alternative",
  "/hellosign-alternative",
  "/pandadoc-alternative",
  "/adobe-sign-alternative",
  "/contractbook-alternative",
  "/kita-alternative",
  "/alegra-alternative",
  "/siigo-alternative",
  "/boundless-alternative",
  "/citizenpath-alternative",
  "/visa-service-alternative",
]);

function isTrackedRoute(route: string): boolean {
  // Static files served from these same path prefixes (e.g. /free-templates/mutual-nda.pdf,
  // fetched client-side by TemplateThumbnail to render a preview) must never count as a page
  // view — only the actual page route (no file extension on the last segment) should.
  if (/\.[a-z0-9]+$/i.test(route)) return false;
  return (
    TRACKED_ROUTES.has(route) ||
    route === "/blog" ||
    route.startsWith("/blog/") ||
    route.startsWith("/free-templates/") ||
    route.startsWith("/es/plantillas-gratis/") ||
    route.startsWith("/for/") ||
    route.startsWith("/industry/") ||
    route.startsWith("/import-from-")
  );
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
  if (!source || isBlockedAttributionSource(source)) return "";
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
      if (referrerHost && referrerHost !== requestHost && !isBlockedReferrerHost(referrerHost)) {
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
  "page_view_js",
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
  "send_money_cta_clicked",
  "verify_checked",
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

// ---------------------------------------------------------------------------------------------------------------
// Cookieless visitor count (lib/visitorCount.ts, migration 0037): one row per public page view in D1, so visitors,
// time on page, bounces and second pages can be counted per kind of page. Bodies come as text/plain (a CORS-simple
// request, no preflight, works from sendBeacon) and are parsed here. Counting must never disturb a page: every
// failure, a missing table included, ends in an empty 204.

const MAX_VISIT_BODY = 2000;

/** Only our own pages may send views; another site posting here is ignored. */
function fromOwnSite(c: Context<{ Bindings: Env }>): boolean {
  const origin = c.req.header("origin");
  if (!origin) return false;
  try {
    const app = new URL(c.env.PUBLIC_APP_URL);
    const from = new URL(origin);
    return from.protocol === app.protocol && (from.host === app.host || from.host === `www.${app.host}`);
  } catch {
    return false;
  }
}

async function visitBody(c: Context<{ Bindings: Env }>): Promise<Record<string, unknown> | null> {
  try {
    const raw = await c.req.text();
    if (!raw || raw.length > MAX_VISIT_BODY) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The cheap reasons not to count, before anything is looked up: consent signals, bots, other sites, no salt. */
function visitSkipped(c: Context<{ Bindings: Env }>): boolean {
  if (c.req.header("dnt") === "1" || c.req.header("sec-gpc") === "1") return true;
  if (getCookie(c, NOTRACK_COOKIE_NAME) === "1") return true;
  if (isVisitorBot(c.req.header("user-agent") ?? "")) return true;
  return !fromOwnSite(c) || !c.env.DOCRACY_DB || !c.env.VISITOR_HASH_SALT;
}

function cfOf(c: Context<{ Bindings: Env }>): { country?: unknown; asn?: unknown; asOrganization?: unknown } {
  return ((c.req.raw as Request & { cf?: Record<string, unknown> }).cf ?? {}) as { country?: unknown; asn?: unknown; asOrganization?: unknown };
}

function visitorOf(c: Context<{ Bindings: Env }>, day: string): Promise<string> {
  return visitorHash(day, c.env.VISITOR_HASH_SALT!, c.req.header("CF-Connecting-IP") ?? "local", c.req.header("user-agent") ?? "");
}

/** POST /api/analytics/visit — one page view. 200 {id} when counted (the browser keeps the id in memory only, to
 *  report the visible time on leaving), else 204. */
analytics.post("/visit", async (c) => {
  if (visitSkipped(c)) return c.body(null, 204);
  const body = await visitBody(c);
  const path = cleanPath(body?.path);
  if (!body || !path || isUntracked(path)) return c.body(null, 204);
  // Our own admins are not counted, also on public pages; the session is only looked up when there is one.
  const session = getCookie(c, SESSION_COOKIE_NAME);
  if (session) {
    const account = await resolveAccount(c.env, session).catch(() => null);
    if (account && isAdminEmail(c.env, account.email)) return c.body(null, 204);
  }
  const now = new Date();
  if (tooMany(c.req.header("CF-Connecting-IP") ?? "local", now.getTime())) return c.body(null, 204);

  const day = now.toISOString().slice(0, 10);
  const userAgent = c.req.header("user-agent") ?? "";
  const cf = cfOf(c);
  try {
    const id = await insertPageview(c.env.DOCRACY_DB!, {
      day,
      ts: Math.floor(now.getTime() / 1000),
      path,
      kind: pageKindOf(path),
      source: sourceOf(body.utmSource, body.referrer),
      device: deviceOf(userAgent, body.width),
      country: countryCode(cf.country ?? c.req.header("CF-IPCountry")),
      net: netKind(cf.asn, cf.asOrganization),
      visitor: await visitorOf(c, day),
    });
    return id === null ? c.body(null, 204) : c.json({ id });
  } catch (e) {
    console.error("[visit]", e instanceof Error ? e.message : e);
    return c.body(null, 204);
  }
});

/** POST /api/analytics/visit/end — visible seconds of a page view counted above; always 204. */
analytics.post("/visit/end", async (c) => {
  if (visitSkipped(c)) return c.body(null, 204);
  const body = await visitBody(c);
  const id = Number(body?.id);
  const seconds = Number(body?.seconds);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(seconds) || seconds < 0) return c.body(null, 204);
  const day = new Date().toISOString().slice(0, 10);
  try {
    await recordSeconds(c.env.DOCRACY_DB!, id, await visitorOf(c, day), day, seconds);
  } catch (e) {
    console.error("[visit/end]", e instanceof Error ? e.message : e);
  }
  return c.body(null, 204);
});

export default analytics;

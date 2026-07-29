import type { Env } from "@docracy/shared";

export type FunnelEvent =
  // Activation
  | "signup_started"
  | "signup_completed"
  | "dashboard_loaded"
  | "document_upload_started"
  | "document_uploaded"
  | "template_opened"
  | "template_used"
  | "fields_added"
  | "document_sent"
  // Revenue
  | "upgrade_clicked"
  | "checkout_started"
  | "checkout_completed"
  // Completion
  | "document_viewed"
  | "document_not_opened_after_2h"
  | "document_not_signed_after_4h"
  | "document_signed"
  | "document_downloaded"
  // Template
  | "template_category_viewed"
  | "template_preview_opened"
  | "template_started"
  | "template_abandoned"
  | "template_completed"
  // Traffic
  | "page_view"
  | "landingpage_loaded"
  | "landingpage_cta_clicked"
  | "referral_source_detected"
  | "blog_article_loaded"
  | "blog_cta_clicked"
  | "viral_cta_clicked"
  // Email
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_bounced"
  // Error
  | "upload_failed"
  | "field_error"
  | "send_failed"
  | "signature_error"
  | "pdf_generation_failed";

/** Not HttpOnly (unlike the session cookie) — it's a plain boolean opt-out with no sensitive
 *  content, and the admin analytics page reads it directly via document.cookie to show current
 *  toggle state without a round-trip. */
export const NOTRACK_COOKIE_NAME = "docracy_notrack";
export const NOTRACK_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** Cookie options for the founder notrack opt-out — readable by the admin UI (not HttpOnly). */
export function noTrackCookieOptions(env: Env) {
  const isHttps = env.PUBLIC_APP_URL.startsWith("https");
  return {
    httpOnly: false,
    secure: isHttps,
    sameSite: (isHttps ? "None" : "Lax") as "None" | "Lax",
    path: "/",
    maxAge: NOTRACK_COOKIE_MAX_AGE_SECONDS,
  };
}

/** Documented User-Agent substrings for crawlers, link-preview fetchers, SEO tools, and uptime
 *  monitors — not a security control (trivially spoofable), just good-enough classification so the
 *  admin "human" counts aren't inflated by every scraper that forgets to spoof Chrome. Ordered
 *  roughly by how often we expect to see them. A missing/empty UA stays "human" on purpose:
 *  cron sweeps and Resend webhooks call trackEvent with no UA and must survive humansOnly. */
const BOT_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // AI crawlers / assistants
  { name: "GPTBot", pattern: /GPTBot/i },
  { name: "ChatGPT-User", pattern: /ChatGPT-User/i },
  { name: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { name: "ClaudeBot", pattern: /ClaudeBot/i },
  { name: "Claude-User", pattern: /Claude-User/i },
  { name: "anthropic-ai", pattern: /anthropic-ai/i },
  { name: "Cursor", pattern: /Cursor/i },
  { name: "PerplexityBot", pattern: /PerplexityBot/i },
  { name: "Perplexity-User", pattern: /Perplexity-User/i },
  { name: "CCBot", pattern: /CCBot/i },
  { name: "Google-Extended", pattern: /Google-Extended/i },
  // Search engines
  { name: "Googlebot", pattern: /Googlebot/i },
  { name: "bingbot", pattern: /bingbot/i },
  { name: "Applebot", pattern: /Applebot/i },
  { name: "Amazonbot", pattern: /Amazonbot/i },
  { name: "YandexBot", pattern: /Yandex(Bot|Images|Accessibility|Render)/i },
  { name: "DuckDuckBot", pattern: /DuckDuckBot/i },
  { name: "Baiduspider", pattern: /Baiduspider/i },
  { name: "SeznamBot", pattern: /SeznamBot/i },
  { name: "PetalBot", pattern: /PetalBot/i },
  // Social / chat link previews (hit every shared URL)
  { name: "facebookexternalhit", pattern: /facebookexternalhit|Facebot/i },
  { name: "Twitterbot", pattern: /Twitterbot/i },
  { name: "LinkedInBot", pattern: /LinkedInBot/i },
  { name: "Slackbot", pattern: /Slackbot|Slack-ImgProxy/i },
  { name: "Discordbot", pattern: /Discordbot/i },
  { name: "WhatsApp", pattern: /WhatsApp/i },
  { name: "TelegramBot", pattern: /TelegramBot/i },
  { name: "Pinterest", pattern: /Pinterestbot|Pinterest\//i },
  { name: "Redditbot", pattern: /Redditbot/i },
  { name: "Embedly", pattern: /Embedly/i },
  { name: "Quora", pattern: /Quora-Bot|Quora Link Preview/i },
  // SEO / site auditors
  { name: "AhrefsBot", pattern: /AhrefsBot/i },
  { name: "SemrushBot", pattern: /SemrushBot|SemrushBot-BA/i },
  { name: "DotBot", pattern: /DotBot/i },
  { name: "MJ12bot", pattern: /MJ12bot/i },
  { name: "BLEXBot", pattern: /BLEXBot/i },
  { name: "DataForSeoBot", pattern: /DataForSeoBot/i },
  { name: "Screaming Frog", pattern: /Screaming Frog/i },
  { name: "Bytespider", pattern: /Bytespider/i },
  { name: "meta-externalagent", pattern: /meta-externalagent/i },
  // Uptime / health / archives / headless
  { name: "UptimeRobot", pattern: /UptimeRobot/i },
  { name: "Pingdom", pattern: /Pingdom/i },
  { name: "StatusCake", pattern: /StatusCake/i },
  { name: "Better Stack", pattern: /BetterUptimeBot|Better Stack/i },
  { name: "archive.org", pattern: /archive\.org_bot|IA_archiver/i },
  { name: "HeadlessChrome", pattern: /HeadlessChrome/i },
  // Raw HTTP clients (scripts, monitors, our own probes if they forget a browser UA)
  { name: "curl", pattern: /\bcurl\//i },
  { name: "wget", pattern: /\bwget\//i },
  { name: "python-requests", pattern: /python-requests|Python-urllib|aiohttp/i },
  { name: "Go-http-client", pattern: /Go-http-client/i },
  { name: "axios", pattern: /\baxios\//i },
  { name: "node-fetch", pattern: /node-fetch|undici/i },
];

/** Founder tooling traffic that should never inflate funnel numbers — Claude Code / Claude bots
 *  and Cursor agent browsers. Classified as bots above, and skipped entirely on write (and filtered
 *  out of admin SQL reads) so they don't show up as "traffic". */
const EXCLUDED_FROM_ANALYTICS = new Set(["ClaudeBot", "Claude-User", "anthropic-ai", "Cursor"]);

export function classifyBot(userAgent: string | null | undefined): { isBot: boolean; botName: string } {
  if (!userAgent) return { isBot: false, botName: "" };
  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) return { isBot: true, botName: name };
  }
  return { isBot: false, botName: "" };
}

/** True for Claude / Cursor agent user agents — always omitted from Analytics Engine writes. */
export function isExcludedAgent(userAgent: string | null | undefined): boolean {
  const { botName } = classifyBot(userAgent);
  return EXCLUDED_FROM_ANALYTICS.has(botName);
}

/** SQL fragment that drops excluded agent rows from admin reads (blob4 = botName). */
export const EXCLUDED_AGENTS_SQL_FILTER = `blob4 NOT IN ('ClaudeBot', 'Claude-User', 'anthropic-ai', 'Cursor')`;

export interface TrackEventParams {
  event: FunnelEvent;
  route?: string | null;
  userAgent?: string | null;
  country?: string | null;
  /** account id, when the actor is a logged-in account — null for anonymous activity (the
   *  majority of traffic). */
  userId?: string | null;
  documentId?: string | null;
  templateId?: string | null;
  /** Free-form origin label for the event (e.g. a UTM source, "resend_webhook", "free_templates") —
   *  distinct from `referrer`, which is the raw Referer/document.referrer URL. */
  source?: string | null;
  referrer?: string | null;
  sessionId?: string | null;
  durationMs?: number | null;
  errorCode?: string | null;
  emailType?: string | null;
  templateCategory?: string | null;
  /** First-touch marketing channel as `source` or `source/campaign` (e.g. "linkedin/post-01-auto").
   *  Unlike `referrer` (current navigation only), this survives across sessions so signup/checkout
   *  can still be credited to the post that found the customer. */
  attribution?: string | null;
}

/** Clamps a client-supplied attribution label — /track accepts this straight from the browser. */
export function sanitizeAttribution(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._/-]/g, "-")
    .slice(0, 72);
}

/**
 * Writes one funnel data point. Silently no-ops if the binding is absent (local dev without
 * `wrangler dev --remote`, or before the dataset's first deploy) — this is analytics, never
 * something a request should fail over.
 *
 * Blob layout (Analytics Engine supports up to 20 blobs / 20 doubles / 1 index per point — this
 * uses 15 of the 20 available blob slots, leaving headroom for future parameters without another
 * binding-shape change):
 *   blob1  event            blob8  templateId       blob15 attribution
 *   blob2  route            blob9  source
 *   blob3  traffic_type     blob10 referrer
 *   blob4  botName          blob11 sessionId
 *   blob5  country          blob12 errorCode
 *   blob6  userId           blob13 emailType
 *   blob7  documentId       blob14 templateCategory
 *   doubles: [1, durationMs ?? 0]   (the leading 1 is a plain per-event counter, matching the
 *     original single-double shape so existing SUM(double1) queries keep counting events)
 *   indexes: [event]        (Analytics Engine's single sampling/filter key)
 *
 * A data point's write time is recorded automatically by Analytics Engine (queryable as
 * `timestamp` via the SQL API) — there's no need to stamp one of the blobs/doubles with it.
 */
export function trackEvent(env: Env, params: TrackEventParams): void {
  if (!env.ANALYTICS) return;
  // Claude / Cursor agent traffic is never written — keeps funnel charts about real visitors.
  if (isExcludedAgent(params.userAgent)) return;
  const { isBot, botName } = classifyBot(params.userAgent);
  try {
    env.ANALYTICS.writeDataPoint({
      blobs: [
        params.event,
        params.route ?? "",
        isBot ? "bot" : "human",
        botName,
        params.country || "",
        params.userId ?? "",
        params.documentId ?? "",
        params.templateId ?? "",
        params.source ?? "",
        params.referrer ?? "",
        params.sessionId ?? "",
        params.errorCode ?? "",
        params.emailType ?? "",
        params.templateCategory ?? "",
        params.attribution ?? "",
      ],
      doubles: [1, params.durationMs ?? 0],
      indexes: [params.event],
    });
  } catch {
    // Analytics Engine write failures should never break the request they're attached to.
  }
}

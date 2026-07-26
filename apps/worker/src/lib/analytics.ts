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

/** Documented User-Agent substrings for AI crawlers/assistants likely to hit these pages — not a
 *  security control (trivially spoofable), just good-enough classification for traffic analytics.
 *  Ordered roughly by how often we expect to see them. */
const BOT_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "GPTBot", pattern: /GPTBot/i },
  { name: "ChatGPT-User", pattern: /ChatGPT-User/i },
  { name: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { name: "ClaudeBot", pattern: /ClaudeBot/i },
  { name: "Claude-User", pattern: /Claude-User/i },
  { name: "anthropic-ai", pattern: /anthropic-ai/i },
  { name: "PerplexityBot", pattern: /PerplexityBot/i },
  { name: "Perplexity-User", pattern: /Perplexity-User/i },
  { name: "CCBot", pattern: /CCBot/i },
  { name: "Google-Extended", pattern: /Google-Extended/i },
  { name: "Googlebot", pattern: /Googlebot/i },
  { name: "bingbot", pattern: /bingbot/i },
  { name: "Applebot", pattern: /Applebot/i },
  { name: "Amazonbot", pattern: /Amazonbot/i },
  { name: "Bytespider", pattern: /Bytespider/i },
  { name: "meta-externalagent", pattern: /meta-externalagent/i },
];

export function classifyBot(userAgent: string | null | undefined): { isBot: boolean; botName: string } {
  if (!userAgent) return { isBot: false, botName: "" };
  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) return { isBot: true, botName: name };
  }
  return { isBot: false, botName: "" };
}

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
}

/**
 * Writes one funnel data point. Silently no-ops if the binding is absent (local dev without
 * `wrangler dev --remote`, or before the dataset's first deploy) — this is analytics, never
 * something a request should fail over.
 *
 * Blob layout (Analytics Engine supports up to 20 blobs / 20 doubles / 1 index per point — this
 * uses 14 of the 20 available blob slots, leaving headroom for future parameters without another
 * binding-shape change):
 *   blob1  event            blob8  templateId
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
      ],
      doubles: [1, params.durationMs ?? 0],
      indexes: [params.event],
    });
  } catch {
    // Analytics Engine write failures should never break the request they're attached to.
  }
}

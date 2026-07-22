import type { Env } from "@docracy/shared";

export type FunnelEvent = "page_view" | "document_created" | "document_completed";

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

/** Writes one funnel data point. Silently no-ops if the binding is absent (local dev without
 *  `wrangler dev --remote`, or before the dataset's first deploy) — this is traffic analytics,
 *  never something a request should fail over. `country` is the two-letter CF-IPCountry code
 *  (e.g. "AT"), or "" when unknown. */
export function logFunnelEvent(
  env: Env,
  event: FunnelEvent,
  route: string,
  userAgent: string | null | undefined,
  country: string | null | undefined = ""
): void {
  if (!env.ANALYTICS) return;
  const { isBot, botName } = classifyBot(userAgent);
  try {
    env.ANALYTICS.writeDataPoint({
      blobs: [event, route, isBot ? "bot" : "human", botName, country || ""],
      doubles: [1],
      indexes: [event],
    });
  } catch {
    // Analytics Engine write failures should never break the request they're attached to.
  }
}

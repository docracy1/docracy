import type { Env } from "@docracy/shared";

export type FunnelEvent = "page_view" | "document_created" | "document_completed";

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
 *  never something a request should fail over. */
export function logFunnelEvent(env: Env, event: FunnelEvent, route: string, userAgent: string | null | undefined): void {
  if (!env.ANALYTICS) return;
  const { isBot, botName } = classifyBot(userAgent);
  try {
    env.ANALYTICS.writeDataPoint({
      blobs: [event, route, isBot ? "bot" : "human", botName],
      doubles: [1],
      indexes: [event],
    });
  } catch {
    // Analytics Engine write failures should never break the request they're attached to.
  }
}

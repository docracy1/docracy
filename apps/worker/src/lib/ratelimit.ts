import type { Env } from "@docracy/shared";

const WINDOW_SECONDS = 60 * 60; // 1 hour
const MAX_PER_WINDOW = 10;

/**
 * Soft per-IP limit on document creation. Not a hard security boundary (KV reads/writes here
 * aren't atomic, so a burst of concurrent requests could slip a couple over) — it just keeps a
 * single script from running the free tier's storage costs up, since there's no signup to gate it.
 */
export async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const current = await env.DOCRACY_KV.get(key);
  const count = current ? Number(current) : 0;
  if (count >= MAX_PER_WINDOW) return false;
  await env.DOCRACY_KV.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}

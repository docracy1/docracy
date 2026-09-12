import type { Env } from "@docracy/shared";

/**
 * Hard daily cap on how many topics the admin drain-template-queue route (routes/admin.ts) may
 * process, account-wide, regardless of how many times it's called or by whom. A one-time bulk
 * backfill run through this route is real, legitimate D1 work — hundreds of AI drafts, PDF
 * renders, and writes — and doing enough of it in a single day is exactly what pushed the account
 * over Cloudflare D1's free-tier daily row-read quota and broke production logins. This budget
 * makes that structurally impossible to repeat: a big backlog now has to be drained across several
 * days instead of one, no matter how it's driven (browser loop, curl, anything).
 *
 * Deliberately tracked in KV, not D1 — a safety valve for D1 overuse must never itself add to a D1
 * read/write count, and KV usage doesn't share that quota at all.
 */
export const DAILY_DRAIN_BUDGET = 100;

function budgetKey(now: Date): string {
  return `admin-drain-budget:${now.toISOString().slice(0, 10)}`; // UTC calendar day, e.g. "2026-09-13"
}

/** Topics already processed through this route today (UTC). */
export async function getDrainBudgetUsed(env: Env, now: Date = new Date()): Promise<number> {
  const raw = await env.DOCRACY_KV.get(budgetKey(now));
  return raw ? Number(raw) || 0 : 0;
}

/** How many more topics this route may process today (UTC), floored at 0. */
export async function getDrainBudgetRemaining(env: Env, now: Date = new Date()): Promise<number> {
  const used = await getDrainBudgetUsed(env, now);
  return Math.max(0, DAILY_DRAIN_BUDGET - used);
}

/** Records that `count` more topics were attempted today — call after each drain call completes,
 *  not before, so a request that errors out before doing any work doesn't consume budget. Expires
 *  after 3 days so old keys don't accumulate forever; the UTC-day key itself makes each day's
 *  counter independent regardless of TTL timing. */
export async function recordDrainBudgetUsage(env: Env, count: number, now: Date = new Date()): Promise<void> {
  if (count <= 0) return;
  const used = await getDrainBudgetUsed(env, now);
  await env.DOCRACY_KV.put(budgetKey(now), String(used + count), { expirationTtl: 3 * 24 * 60 * 60 });
}

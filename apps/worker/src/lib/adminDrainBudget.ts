import type { Env } from "@docracy/shared";

/**
 * Hard daily cap, account-wide, on how many topics may be drained from template_topic_queue
 * through EITHER path that draws from it: the admin drain-template-queue route (routes/admin.ts,
 * on-demand/manual) and the hourly automatic catch-up (templateWeekly.ts's
 * runHourlyLegacyBatchDrain, unattended). Both read and write this same counter, so total volume
 * for the day — however it's driven — can never exceed this number.
 *
 * A one-time bulk backfill run through the admin route used to be real, legitimate but *uncapped*
 * D1 work, and doing enough of it in a single day (on top of an unrelated redundant full-table scan
 * in that same route, since removed, and an hourly-cron bug that re-ran a heavy DDL/seed batch 24x/
 * day, also since fixed) is what actually pushed the account over Cloudflare D1's free-tier daily
 * row-read quota and broke production logins once. This budget makes that structurally impossible
 * to repeat regardless of what else goes wrong: a big backlog gets drained across however many days
 * it takes, never all at once, no matter how it's driven (browser loop, curl, cron, anything).
 *
 * The actual per-topic D1 cost turns out to be tiny — a slug-collision SELECT, one INSERT into
 * marketplace_templates, one UPDATE on the topic row, roughly 2-3 row operations per topic — so
 * 400/day (comfortably covering the ~330-topic legacy-batch-2 backlog in a single day, with room
 * left for the regular weekly cadence) is still a firm, finite ceiling, nowhere close to the 5M/day
 * account limit, while no longer forcing multi-day waits for real, cheap work.
 *
 * Deliberately tracked in KV, not D1 — a safety valve for D1 overuse must never itself add to a D1
 * read/write count, and KV usage doesn't share that quota at all.
 */
export const DAILY_DRAIN_BUDGET = 400;

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

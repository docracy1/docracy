import type { Env } from "@docracy/shared";

/** Signed-up, non-paid accounts get this many WhatsApp-invited signers per calendar month. */
export const FREE_MONTHLY_LIMIT = 2;
/** Paid accounts get a higher — but still real — monthly cap, not unlimited: bounds per-account
 *  abuse risk and keeps typical usage well inside Meta's own free WhatsApp conversation tier. */
export const PAID_MONTHLY_LIMIT = 10;

function monthlyLimitFor(isPaid: boolean): number {
  return isPaid ? PAID_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

async function readQuotaRow(env: Env, accountId: string): Promise<{ month: string | null; used: number } | null> {
  if (!env.DOCRACY_DB) return null;
  const row = await env.DOCRACY_DB.prepare(`SELECT whatsapp_quota_month, whatsapp_quota_used FROM accounts WHERE id = ?`)
    .bind(accountId)
    .first<{ whatsapp_quota_month: string | null; whatsapp_quota_used: number }>();
  if (!row) return null;
  return { month: row.whatsapp_quota_month, used: row.whatsapp_quota_used };
}

/** Read-only — never writes, never resets the stored month even if stale. Used by GET /api/auth/me
 *  to show "X of N left" without side effects. Degrades to "full quota" when D1 isn't bound or the
 *  account row can't be found, same graceful-degradation posture as the rest of billing.ts. */
export async function peekWhatsappQuotaRemaining(env: Env, accountId: string, isPaid: boolean): Promise<number> {
  const limit = monthlyLimitFor(isPaid);
  const row = await readQuotaRow(env, accountId);
  if (!row || row.month !== currentMonthKey()) return limit;
  return Math.max(0, limit - row.used);
}

/**
 * Attempts to consume `count` units of the account's monthly WhatsApp-signer quota (2/month free,
 * 10/month paid — see FREE_MONTHLY_LIMIT/PAID_MONTHLY_LIMIT), resetting the counter the first time
 * a request lands in a new month. Returns false (consumes nothing) if that would exceed the limit.
 *
 * Soft/non-atomic under concurrent requests — same accepted tradeoff as lib/ratelimit.ts's
 * counters: this is a monthly cap, not a security boundary, so a rare race slipping a request over
 * by one isn't worth a transactional read-modify-write.
 */
export async function consumeWhatsappQuota(env: Env, accountId: string, isPaid: boolean, count: number): Promise<boolean> {
  if (!env.DOCRACY_DB) return true;
  const limit = monthlyLimitFor(isPaid);
  const month = currentMonthKey();
  const row = await readQuotaRow(env, accountId);
  const used = row?.month === month ? row.used : 0;
  if (used + count > limit) return false;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET whatsapp_quota_month = ?, whatsapp_quota_used = ? WHERE id = ?`)
    .bind(month, used + count, accountId)
    .run();
  return true;
}

/**
 * Paid-only, overage-billing variant of consumeWhatsappQuota: always succeeds (no hard cap) and
 * reports back how many of `count` units fall beyond PAID_MONTHLY_LIMIT this month, so the caller
 * (routes/documents.ts) can bill exactly that many units via lib/whatsappOverage.ts. A signer that
 * lands partly inside and partly outside the included allowance only bills the outside portion —
 * e.g. 8 used, 5 more requested → 3 billed (8→10 free, 10→13 billed), not all 5.
 */
export async function consumeWhatsappQuotaWithOverage(env: Env, accountId: string, count: number): Promise<number> {
  if (!env.DOCRACY_DB) return 0;
  const month = currentMonthKey();
  const row = await readQuotaRow(env, accountId);
  const used = row?.month === month ? row.used : 0;
  const newUsed = used + count;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET whatsapp_quota_month = ?, whatsapp_quota_used = ? WHERE id = ?`)
    .bind(month, newUsed, accountId)
    .run();
  return Math.max(0, newUsed - PAID_MONTHLY_LIMIT) - Math.max(0, used - PAID_MONTHLY_LIMIT);
}

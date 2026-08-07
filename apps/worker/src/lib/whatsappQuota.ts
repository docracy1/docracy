import type { Env } from "@docracy/shared";

/** Free (signed-up, non-paid) accounts get this many WhatsApp-invited signers per calendar month.
 *  Paid accounts never consult this — WhatsApp is unlimited/bundled for them (see routes/documents.ts). */
const FREE_MONTHLY_LIMIT = 2;

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
 *  to show "X of 2 left" without side effects. Degrades to "full quota" when D1 isn't bound or the
 *  account row can't be found, same graceful-degradation posture as the rest of billing.ts. */
export async function peekWhatsappQuotaRemaining(env: Env, accountId: string): Promise<number> {
  const row = await readQuotaRow(env, accountId);
  if (!row || row.month !== currentMonthKey()) return FREE_MONTHLY_LIMIT;
  return Math.max(0, FREE_MONTHLY_LIMIT - row.used);
}

/**
 * Attempts to consume `count` units of the free tier's monthly WhatsApp-signer quota, resetting
 * the counter the first time a request lands in a new month. Returns false (consumes nothing) if
 * that would exceed FREE_MONTHLY_LIMIT.
 *
 * Soft/non-atomic under concurrent requests — same accepted tradeoff as lib/ratelimit.ts's
 * counters: this is a low-stakes monthly cap, not a security boundary, so a rare race slipping a
 * request over by one isn't worth a transactional read-modify-write.
 */
export async function consumeWhatsappQuota(env: Env, accountId: string, count: number): Promise<boolean> {
  if (!env.DOCRACY_DB) return true;
  const month = currentMonthKey();
  const row = await readQuotaRow(env, accountId);
  const used = row?.month === month ? row.used : 0;
  if (used + count > FREE_MONTHLY_LIMIT) return false;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET whatsapp_quota_month = ?, whatsapp_quota_used = ? WHERE id = ?`)
    .bind(month, used + count, accountId)
    .run();
  return true;
}

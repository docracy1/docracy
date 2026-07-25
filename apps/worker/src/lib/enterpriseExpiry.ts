import { markAccountPaid } from "./billing";
import type { Env } from "@docracy/shared";

/**
 * Enterprise deals are a one-time Stripe charge (see billing.ts's markAccountEnterprise), not a
 * recurring subscription, so there's no Stripe webhook that ever fires "this lapsed" — the
 * one-year term stamped at grant time has to be enforced here instead. Runs daily alongside the
 * reminder/cleanup sweeps (see index.ts). Revoking through markAccountPaid(false) reuses the exact
 * same effects a real subscription cancellation would have: is_paid and is_enterprise both clear,
 * and the account's API token is revoked immediately.
 */
export async function runEnterpriseExpirySweep(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const nowIso = new Date().toISOString();
  const { results } = await env.DOCRACY_DB.prepare(
    `SELECT id FROM accounts WHERE is_enterprise = 1 AND enterprise_expires_at IS NOT NULL AND enterprise_expires_at < ?`
  )
    .bind(nowIso)
    .all<{ id: string }>();

  for (const row of results) {
    await markAccountPaid(env, row.id, false);
  }
}

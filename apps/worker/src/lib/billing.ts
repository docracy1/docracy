import type { Env } from "@docracy/shared";

/**
 * Provider-agnostic core — a provider's webhook route (see billingProviders/stripe.ts) verifies
 * its own signature first, then calls this. Silent no-op when DOCRACY_DB isn't bound, same
 * pattern as everywhere else accounts touch D1: there's nothing useful to do without it, and
 * throwing would just turn a not-yet-configured deployment into a 500 instead of a clean skip.
 */
export async function markAccountPaid(env: Env, accountId: string, paid: boolean): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET is_paid = ?, paid_at = ? WHERE id = ?`)
    .bind(paid ? 1 : 0, paid ? new Date().toISOString() : null, accountId)
    .run();
}

import type { Env } from "@docracy/shared";
import { revokeApiToken } from "./apiTokens";

/**
 * Provider-agnostic core — a provider's webhook route (see billingProviders/stripe.ts) verifies
 * its own signature first, then calls this. Silent no-op when DOCRACY_DB isn't bound, same
 * pattern as everywhere else accounts touch D1: there's nothing useful to do without it, and
 * throwing would just turn a not-yet-configured deployment into a 500 instead of a clean skip.
 *
 * Revokes the account's API token outright the moment paid status is lost — a cancelled/refunded
 * account's MCP connector URL stops working immediately, rather than staying valid until the
 * connector next happens to re-check billing status (see connector/src/tokenAuth.ts).
 */
export async function markAccountPaid(env: Env, accountId: string, paid: boolean): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET is_paid = ?, paid_at = ? WHERE id = ?`)
    .bind(paid ? 1 : 0, paid ? new Date().toISOString() : null, accountId)
    .run();
  if (!paid) {
    await revokeApiToken(env, accountId);
  }
}

/** Set once, on an account's first completed checkout — lets a later webhook keyed by Stripe
 *  customer ID (e.g. subscription cancelled) resolve back to the right account. */
export async function setStripeCustomerId(env: Env, accountId: string, customerId: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET stripe_customer_id = ? WHERE id = ? AND stripe_customer_id IS NULL`)
    .bind(customerId, accountId)
    .run();
}

export async function findAccountIdByStripeCustomerId(env: Env, customerId: string): Promise<string | null> {
  if (!env.DOCRACY_DB) return null;
  const row = await env.DOCRACY_DB.prepare(`SELECT id FROM accounts WHERE stripe_customer_id = ?`)
    .bind(customerId)
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function getStripeCustomerId(env: Env, accountId: string): Promise<string | null> {
  if (!env.DOCRACY_DB) return null;
  const row = await env.DOCRACY_DB.prepare(`SELECT stripe_customer_id FROM accounts WHERE id = ?`)
    .bind(accountId)
    .first<{ stripe_customer_id: string | null }>();
  return row?.stripe_customer_id ?? null;
}

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
  // Losing paid status always takes enterprise status with it — enterprise is a superset of paid,
  // never true on its own, so a lapsed/cancelled subscription (customer.subscription.deleted,
  // below) must clear both in one statement rather than leaving is_enterprise stuck at 1 forever.
  await env.DOCRACY_DB.prepare(
    `UPDATE accounts SET is_paid = ?, paid_at = ?, is_enterprise = CASE WHEN ? THEN is_enterprise ELSE 0 END, enterprise_expires_at = CASE WHEN ? THEN enterprise_expires_at ELSE NULL END WHERE id = ?`
  )
    .bind(paid ? 1 : 0, paid ? new Date().toISOString() : null, paid ? 1 : 0, paid ? 1 : 0, accountId)
    .run();
  if (!paid) {
    await revokeApiToken(env, accountId);
  }
}

const ENTERPRISE_TERM_DAYS = 365;

/** Enterprise deals are paid as a one-time Stripe charge, not a recurring subscription — Stripe
 *  never sends a follow-up "this lapsed" event for those, so a fixed one-year term is stamped
 *  here at grant time and enforced by the daily sweep in lib/enterpriseExpiry.ts instead. Renewing
 *  a contract just means running this again, which pushes the expiry another year out. */
export async function markAccountEnterprise(env: Env, accountId: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const expiresAt = new Date(Date.now() + ENTERPRISE_TERM_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET is_enterprise = 1, enterprise_expires_at = ? WHERE id = ?`)
    .bind(expiresAt, accountId)
    .run();
}

/** Display-only lookup for the Dashboard's Subscription panel — not part of the cached session
 *  (see auth.ts), since it's just informational and doesn't gate anything. */
export async function getEnterpriseExpiresAt(env: Env, workspaceId: string): Promise<string | null> {
  if (!env.DOCRACY_DB) return null;
  const row = await env.DOCRACY_DB.prepare(`SELECT enterprise_expires_at FROM accounts WHERE id = ?`)
    .bind(workspaceId)
    .first<{ enterprise_expires_at: string | null }>();
  return row?.enterprise_expires_at ?? null;
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

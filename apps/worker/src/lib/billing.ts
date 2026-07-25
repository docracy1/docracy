import type { Env } from "@docracy/shared";
import { revokeApiToken } from "./apiTokens";
import { deleteConnectionsForAccount } from "./cloudConnectors";

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
    // A lapsed account keeps no standing OAuth grant to its cloud storage connectors — same
    // posture as revoking the API token above, and the only place this needs to happen now that
    // Enterprise revocation flows through this same function instead of a separate cron sweep.
    await deleteConnectionsForAccount(env, accountId);
  }
}

/** Enterprise is now a real recurring annual Stripe subscription (like the standard paid plan) —
 *  Stripe's own billing cycle handles renewal, and customer.subscription.deleted (markAccountPaid
 *  above) is what revokes it, exactly mirroring the standard plan. No expiry to track here.
 *  Also used directly by the admin-only manual grant route (routes/admin.ts) for customers who
 *  pay by bank transfer and never touch Stripe Checkout at all. */
export async function markAccountEnterprise(env: Env, accountId: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET is_enterprise = 1 WHERE id = ?`).bind(accountId).run();
}

/** Set once, on an account's first completed checkout — lets a later webhook keyed by Stripe
 *  customer ID (e.g. subscription cancelled) resolve back to the right account. */
export async function setStripeCustomerId(env: Env, accountId: string, customerId: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET stripe_customer_id = ? WHERE id = ? AND stripe_customer_id IS NULL`)
    .bind(customerId, accountId)
    .run();
}

/** Used only by the admin-only manual Enterprise grant route (routes/admin.ts), for customers who
 *  pay by bank transfer and never generate a Stripe customer/checkout session to look up by. */
export async function findAccountIdByEmail(env: Env, email: string): Promise<string | null> {
  if (!env.DOCRACY_DB) return null;
  const row = await env.DOCRACY_DB.prepare(`SELECT id FROM accounts WHERE email = ?`)
    .bind(email.trim().toLowerCase())
    .first<{ id: string }>();
  return row?.id ?? null;
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

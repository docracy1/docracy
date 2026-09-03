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
  // payment_failed_at is cleared unconditionally: a fresh paid=true resolves it (payment
  // succeeded), and a paid=false freeze/downgrade makes the flag moot either way.
  await env.DOCRACY_DB.prepare(
    `UPDATE accounts SET is_paid = ?, paid_at = ?, is_enterprise = CASE WHEN ? THEN is_enterprise ELSE 0 END, enterprise_expires_at = CASE WHEN ? THEN enterprise_expires_at ELSE NULL END, payment_failed_at = NULL WHERE id = ?`
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

/** Stamped the moment Stripe reports a failed renewal charge (invoice.payment_failed) — lets the
 *  Dashboard show an immediate "please settle your unpaid invoice" banner. Only set-if-null: a
 *  subscription in dunning fires this webhook on every retry, and the 7-day freeze grace period
 *  (see findAccountsPastPaymentFailureGrace below) counts from the *first* failure, not the most
 *  recent retry. */
export async function markPaymentFailed(env: Env, accountId: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET payment_failed_at = ? WHERE id = ? AND payment_failed_at IS NULL`)
    .bind(new Date().toISOString(), accountId)
    .run();
}

/** Stamped when Stripe reports the retried charge succeeded (invoice.payment_succeeded) — clears
 *  the banner without waiting for the 5-minute session cache refresh to matter, since there's
 *  nothing else to downgrade here (unlike markAccountPaid, is_paid was never touched). */
export async function clearPaymentFailed(env: Env, accountId: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`UPDATE accounts SET payment_failed_at = NULL WHERE id = ?`).bind(accountId).run();
}

const PAYMENT_FAILURE_GRACE_DAYS = 7;

/** Accounts whose first payment failure is more than 7 days old and still unresolved — what the
 *  daily cron sweep (lib/paymentFreeze.ts) freezes via markAccountPaid(env, id, false), same as a
 *  manual downgrade. is_paid = 1 filters out accounts already frozen (markAccountPaid clears
 *  payment_failed_at, so they'd never match anyway, but this keeps the intent explicit). */
export async function findAccountsPastPaymentFailureGrace(env: Env): Promise<string[]> {
  if (!env.DOCRACY_DB) return [];
  const cutoff = new Date(Date.now() - PAYMENT_FAILURE_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const rows = await env.DOCRACY_DB.prepare(
    `SELECT id FROM accounts WHERE is_paid = 1 AND payment_failed_at IS NOT NULL AND payment_failed_at <= ?`
  )
    .bind(cutoff)
    .all<{ id: string }>();
  return rows.results.map((r) => r.id);
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

function isDuplicateColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /duplicate column/i.test(msg);
}

/** CI often cannot apply D1 migrations (token lacks D1:Edit). Checkout persist/reconcile add the
 *  columns themselves so a missed webhook can still be healed without waiting on wrangler. */
export async function ensureCheckoutSessionColumns(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  for (const sql of [
    "ALTER TABLE accounts ADD COLUMN stripe_checkout_session_id TEXT",
    "ALTER TABLE accounts ADD COLUMN stripe_checkout_created_at TEXT",
  ]) {
    try {
      await env.DOCRACY_DB.prepare(sql).run();
    } catch (err) {
      if (isDuplicateColumnError(err)) continue;
      console.log(`Billing: alter skipped (${err instanceof Error ? err.message : err})`);
    }
  }
}

export async function persistCheckoutSession(env: Env, accountId: string, sessionId: string): Promise<void> {
  if (!env.DOCRACY_DB || !sessionId) return;
  await ensureCheckoutSessionColumns(env);
  await env.DOCRACY_DB.prepare(
    `UPDATE accounts SET stripe_checkout_session_id = ?, stripe_checkout_created_at = ? WHERE id = ?`
  )
    .bind(sessionId, new Date().toISOString(), accountId)
    .run();
}

export async function getCheckoutSessionId(env: Env, accountId: string): Promise<string | null> {
  if (!env.DOCRACY_DB) return null;
  try {
    const row = await env.DOCRACY_DB.prepare(`SELECT stripe_checkout_session_id FROM accounts WHERE id = ?`)
      .bind(accountId)
      .first<{ stripe_checkout_session_id: string | null }>();
    return row?.stripe_checkout_session_id ?? null;
  } catch (err) {
    console.log(`Billing: getCheckoutSessionId skipped (${err instanceof Error ? err.message : err})`);
    return null;
  }
}

export async function isAccountPaid(env: Env, accountId: string): Promise<boolean> {
  if (!env.DOCRACY_DB) return false;
  const row = await env.DOCRACY_DB.prepare(`SELECT is_paid FROM accounts WHERE id = ?`)
    .bind(accountId)
    .first<{ is_paid: number }>();
  return !!row?.is_paid;
}

/** Shared by the Stripe webhook and the reconcile path — one place that flips paid + customer id. */
export async function applyPaidCheckout(
  env: Env,
  input: { accountId: string; customerId?: string | null; isEnterprise?: boolean }
): Promise<boolean> {
  await markAccountPaid(env, input.accountId, true);
  if (input.customerId) await setStripeCustomerId(env, input.accountId, input.customerId);
  if (input.isEnterprise) await markAccountEnterprise(env, input.accountId);
  return isAccountPaid(env, input.accountId);
}

export interface PendingCheckoutRow {
  id: string;
  email: string;
  stripe_checkout_session_id: string;
  stripe_customer_id: string | null;
}

/** Unpaid accounts that started Checkout at least `minAgeMs` ago — hourly heal for missed webhooks. */
export async function listStaleUnpaidCheckouts(env: Env, minAgeMs = 60_000, limit = 25): Promise<PendingCheckoutRow[]> {
  if (!env.DOCRACY_DB) return [];
  await ensureCheckoutSessionColumns(env);
  const cutoff = new Date(Date.now() - minAgeMs).toISOString();
  try {
    const { results } = await env.DOCRACY_DB.prepare(
      `SELECT id, email, stripe_checkout_session_id, stripe_customer_id FROM accounts
       WHERE is_paid = 0 AND stripe_checkout_session_id IS NOT NULL AND stripe_checkout_created_at IS NOT NULL
         AND stripe_checkout_created_at <= ?
       ORDER BY stripe_checkout_created_at ASC LIMIT ?`
    )
      .bind(cutoff, limit)
      .all<PendingCheckoutRow>();
    return results;
  } catch (err) {
    console.log(`Billing: listStaleUnpaidCheckouts skipped (${err instanceof Error ? err.message : err})`);
    return [];
  }
}

import type { Env } from "@docracy/shared";
import {
  applyPaidCheckout,
  getCheckoutSessionId,
  getStripeCustomerId,
  isAccountPaid,
  listStaleUnpaidCheckouts,
} from "./billing";
import { sendBillingMismatchAlert } from "./email";

const LIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "paused"]);

export interface StripeCheckoutSession {
  id?: string;
  status?: string;
  payment_status?: string;
  client_reference_id?: string | null;
  customer?: string | { id?: string } | null;
  metadata?: Record<string, unknown> | null;
}

interface StripeSubscriptionList {
  data?: Array<{ status?: string }>;
}

export function isCheckoutSessionPaid(session: StripeCheckoutSession): boolean {
  if (session.status !== "complete") return false;
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

export function stripeCustomerIdFromSession(session: StripeCheckoutSession): string | null {
  const customer = session.customer;
  if (typeof customer === "string" && customer) return customer;
  if (customer && typeof customer === "object" && typeof customer.id === "string") return customer.id;
  return null;
}

async function stripeGet<T>(env: Env, path: string): Promise<T | null> {
  if (!env.STRIPE_SECRET_KEY) return null;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    console.error(`Stripe GET ${path} failed (${res.status}): ${await res.text()}`);
    return null;
  }
  return (await res.json()) as T;
}

export async function fetchCheckoutSession(env: Env, sessionId: string): Promise<StripeCheckoutSession | null> {
  if (!sessionId.startsWith("cs_")) return null;
  return stripeGet<StripeCheckoutSession>(env, `checkout/sessions/${encodeURIComponent(sessionId)}`);
}

export async function stripeCustomerHasLiveSubscription(env: Env, customerId: string): Promise<boolean> {
  const list = await stripeGet<StripeSubscriptionList>(
    env,
    `subscriptions?customer=${encodeURIComponent(customerId)}&limit=10`
  );
  return (list?.data ?? []).some((sub) => LIVE_SUB_STATUSES.has(sub.status ?? ""));
}

function isEnterpriseSession(session: StripeCheckoutSession): boolean {
  return session.metadata?.plan === "enterprise";
}

export async function applySessionIfPaid(
  env: Env,
  accountId: string,
  session: StripeCheckoutSession
): Promise<boolean> {
  if (!isCheckoutSessionPaid(session)) return false;
  if (session.client_reference_id && session.client_reference_id !== accountId) return false;
  return applyPaidCheckout(env, {
    accountId,
    customerId: stripeCustomerIdFromSession(session),
    isEnterprise: isEnterpriseSession(session),
  });
}

/** Browser return from Stripe — look up the Checkout Session and upgrade if payment already landed. */
export async function reconcileCheckoutForAccount(
  env: Env,
  accountId: string,
  sessionIdFromClient?: string | null
): Promise<{ paid: boolean; reconciled: boolean }> {
  if (await isAccountPaid(env, accountId)) return { paid: true, reconciled: false };

  const sessionId = sessionIdFromClient?.trim() || (await getCheckoutSessionId(env, accountId));
  if (!sessionId) {
    const customerId = await getStripeCustomerId(env, accountId);
    if (customerId && (await stripeCustomerHasLiveSubscription(env, customerId))) {
      const upgraded = await applyPaidCheckout(env, { accountId, customerId });
      return { paid: upgraded, reconciled: upgraded };
    }
    return { paid: false, reconciled: false };
  }

  const session = await fetchCheckoutSession(env, sessionId);
  if (!session) return { paid: false, reconciled: false };
  if (session.client_reference_id && session.client_reference_id !== accountId) {
    return { paid: false, reconciled: false };
  }
  const upgraded = await applySessionIfPaid(env, accountId, session);
  return { paid: upgraded, reconciled: upgraded };
}

/**
 * Hourly: any unpaid account whose Checkout Session is older than 1 minute and already paid in
 * Stripe gets upgraded, and founder@ is emailed so a missed webhook is visible.
 */
export async function reconcileStaleCheckouts(env: Env): Promise<number> {
  if (!env.STRIPE_SECRET_KEY) return 0;
  const rows = await listStaleUnpaidCheckouts(env);
  let healed = 0;
  for (const row of rows) {
    const session = await fetchCheckoutSession(env, row.stripe_checkout_session_id);
    if (!session || !isCheckoutSessionPaid(session)) continue;
    if (session.client_reference_id && session.client_reference_id !== row.id) continue;
    const upgraded = await applySessionIfPaid(env, row.id, session);
    if (!upgraded) continue;
    healed += 1;
    await sendBillingMismatchAlert(env, {
      kind: "healed",
      email: row.email,
      accountId: row.id,
      sessionId: row.stripe_checkout_session_id,
    }).catch((err) => console.error("Billing mismatch alert failed:", err));
  }
  if (healed > 0) {
    console.log(`Billing: healed ${healed} missed checkout webhook(s)`);
  }
  return healed;
}

export async function alertIfCheckoutDidNotUpgrade(
  env: Env,
  accountId: string,
  extras: { customerId?: string | null; sessionId?: string | null }
): Promise<void> {
  if (await isAccountPaid(env, accountId)) return;
  let email = `(no account row for ${accountId})`;
  if (env.DOCRACY_DB) {
    const row = await env.DOCRACY_DB.prepare(`SELECT email FROM accounts WHERE id = ?`)
      .bind(accountId)
      .first<{ email: string }>();
    if (row?.email) email = row.email;
  }
  await sendBillingMismatchAlert(env, {
    kind: "webhook_miss",
    email,
    accountId,
    sessionId: extras.sessionId ?? extras.customerId ?? "",
  });
}

import { hmacKey } from "@docracy/shared";
import type { Env } from "@docracy/shared";

export type StripeWebhookResult =
  | {
      type: "checkout_completed";
      accountId: string;
      customerId: string | null;
      isEnterprise: boolean;
      /** First-touch channel round-tripped via session metadata — "" when unknown. */
      attribution: string;
      sessionId: string | null;
    }
  | { type: "subscription_deleted"; customerId: string }
  | { type: "invoice_payment_failed"; customerId: string }
  | { type: "invoice_payment_succeeded"; customerId: string };

const REPLAY_TOLERANCE_SECONDS = 300; // same window Stripe's own libraries default to

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Stripe's Stripe-Signature header looks like "t=1614556800,v1=<hex>,v1=<hex-for-rotated-secret>". */
function parseSignatureHeader(header: string): { timestamp: string; signatures: string[] } | null {
  const parts = new Map<string, string[]>();
  for (const entry of header.split(",")) {
    const [key, value] = entry.split("=");
    if (!key || !value) continue;
    parts.set(key, [...(parts.get(key) ?? []), value]);
  }
  const timestamp = parts.get("t")?.[0];
  const signatures = parts.get("v1");
  if (!timestamp || !signatures?.length) return null;
  return { timestamp, signatures };
}

/**
 * Verifies a Stripe webhook's signature (crypto.subtle.verify does the HMAC + constant-time
 * comparison in one call, same as packages/shared/src/token.ts's verifyToken) and extracts the
 * event. Returns null for: no webhook secret configured, a missing/malformed/invalid signature, a
 * stale (replayed) event, or an event type we don't act on — the webhook route itself always
 * responds 200 regardless, since Stripe only needs to know we received it, not which of these
 * applies.
 *
 * Two event types are handled: "checkout.session.completed" unlocks the paid tier and records the
 * Stripe customer ID; "customer.subscription.deleted" (cancellation, or Stripe giving up after
 * failed-payment retries) is the one signal that a subscription actually ended, so it's what
 * revokes paid status — the caller resolves customerId back to an account via
 * billing.ts's findAccountIdByStripeCustomerId, since the subscription payload has no
 * client_reference_id of its own.
 */
export async function verifyAndExtract(
  rawBody: string,
  signatureHeader: string | null,
  env: Env
): Promise<StripeWebhookResult | null> {
  if (!env.STRIPE_WEBHOOK_SECRET || !signatureHeader) return null;

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return null;

  const eventAgeSeconds = Math.abs(Date.now() / 1000 - Number(parsed.timestamp));
  if (eventAgeSeconds > REPLAY_TOLERANCE_SECONDS) return null;

  const key = await hmacKey(env.STRIPE_WEBHOOK_SECRET);
  const signedPayload = new TextEncoder().encode(`${parsed.timestamp}.${rawBody}`);
  const anyValid = await Promise.all(
    parsed.signatures.map((sig) => crypto.subtle.verify("HMAC", key, hexToBytes(sig), signedPayload).catch(() => false))
  );
  if (!anyValid.some(Boolean)) return null;

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return null;
  }

  if (event.type === "checkout.session.completed") {
    const accountId = event.data?.object?.client_reference_id;
    if (typeof accountId !== "string" || !accountId) return null;
    const customer = event.data?.object?.customer;
    // Enterprise deals go through a Payment Link created directly in the Stripe Dashboard (not
    // the self-serve session in routes/billing.ts's POST /checkout) — that link carries
    // metadata.plan="enterprise", set once when the link is created, rather than a distinct price
    // this worker would need to know about.
    const metadata = event.data?.object?.metadata;
    const metadataRecord = typeof metadata === "object" && metadata !== null ? (metadata as Record<string, unknown>) : {};
    const isEnterprise = metadataRecord.plan === "enterprise";
    const attribution = metadataRecord.attribution;
    const sessionId = event.data?.object?.id;
    return {
      type: "checkout_completed",
      accountId,
      customerId: typeof customer === "string" ? customer : null,
      isEnterprise,
      attribution: typeof attribution === "string" ? attribution : "",
      sessionId: typeof sessionId === "string" ? sessionId : null,
    };
  }

  if (event.type === "customer.subscription.deleted") {
    const customerId = event.data?.object?.customer;
    if (typeof customerId !== "string" || !customerId) return null;
    return { type: "subscription_deleted", customerId };
  }

  // Fires on every failed renewal charge, well before Stripe gives up and fires
  // customer.subscription.deleted — this is what lets the Dashboard show an immediate
  // "please settle your unpaid invoice" banner (see lib/billing.ts's markPaymentFailed) instead
  // of waiting out Stripe's own multi-week dunning/retry schedule.
  if (event.type === "invoice.payment_failed") {
    const customerId = event.data?.object?.customer;
    if (typeof customerId !== "string" || !customerId) return null;
    return { type: "invoice_payment_failed", customerId };
  }

  // A later retry (or the customer updating their card) succeeding — clears the banner without
  // waiting for the subscription to either recover on its own or eventually get cancelled.
  if (event.type === "invoice.payment_succeeded") {
    const customerId = event.data?.object?.customer;
    if (typeof customerId !== "string" || !customerId) return null;
    return { type: "invoice_payment_succeeded", customerId };
  }

  return null;
}

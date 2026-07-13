import { hmacKey } from "@docracy/shared";
import type { Env } from "@docracy/shared";

export interface StripeWebhookResult {
  accountId: string;
  paid: boolean;
}

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
 * paid transition it represents. Returns null for: no webhook secret configured, a missing/
 * malformed/invalid signature, a stale (replayed) event, or an event type we don't act on yet —
 * the webhook route itself always responds 200 regardless, since Stripe only needs to know we
 * received it, not which of these applies.
 *
 * Only "checkout.session.completed" is handled today — that's what actually unlocks the paid
 * tier. Subscription cancellation (customer.subscription.deleted) is a deliberate follow-up: it
 * needs a stored Stripe customer ID to map back to an account, which isn't worth adding until
 * there's a real Stripe account to test the full lifecycle against.
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
    return { accountId, paid: true };
  }

  return null;
}

import type { Env } from "@docracy/shared";

const API_BASE = "https://api.nowpayments.io/v1";

/** How long one successful crypto invoice payment covers — no card-style auto-debit exists here,
 *  so this is a manual "pay again next month" model, not a real recurring subscription. */
export const CRYPTO_PLAN_DAYS = 30;

export interface CreateInvoiceParams {
  env: Env;
  accountId: string;
  priceUsd: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
  ipnCallbackUrl: string;
}

/** POST /v1/invoice — returns a hosted checkout page URL; the payer picks which cryptocurrency to
 *  pay with there. order_id carries our account id, exactly like Stripe's client_reference_id, so
 *  the IPN webhook below can resolve payment back to the right account with no separate lookup. */
export async function createInvoice(params: CreateInvoiceParams): Promise<{ invoiceUrl: string } | { error: string }> {
  const { env, accountId, priceUsd, description, successUrl, cancelUrl, ipnCallbackUrl } = params;
  if (!env.NOWPAYMENTS_API_KEY) return { error: "not_configured" };

  const res = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": env.NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: priceUsd,
      price_currency: "usd",
      order_id: accountId,
      order_description: description,
      success_url: successUrl,
      cancel_url: cancelUrl,
      ipn_callback_url: ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    console.error(`NOWPayments invoice creation failed (${res.status}): ${await res.text()}`);
    return { error: "request_failed" };
  }
  const data = (await res.json()) as { invoice_url?: string };
  if (!data.invoice_url) return { error: "request_failed" };
  return { invoiceUrl: data.invoice_url };
}

/** Deep, recursive key sort — NOWPayments signs the IPN body as HMAC-SHA512 over the JSON
 *  serialization of the payload with every object's keys sorted alphabetically at every nesting
 *  level (not just the top level), so this has to recurse into nested objects/arrays to match. */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Verifies the `x-nowpayments-sig` header: HMAC-SHA512, keyed with the IPN secret, over the
 *  deep-key-sorted JSON body — returns the parsed body only once the signature checks out. */
export async function verifyIpn(rawBody: string, signatureHeader: string | null, env: Env): Promise<Record<string, unknown> | null> {
  if (!env.NOWPAYMENTS_IPN_SECRET || !signatureHeader) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }
  const sortedJson = JSON.stringify(sortKeysDeep(parsed));
  const expected = await hmacSha512Hex(env.NOWPAYMENTS_IPN_SECRET, sortedJson);
  if (expected !== signatureHeader) return null;
  return parsed as Record<string, unknown>;
}

/** "finished"/"confirmed" are NOWPayments' terminal-success payment_status values — anything else
 *  (waiting, confirming, failed, expired, refunded) is not a completed payment. */
export function isSuccessfulPaymentStatus(status: unknown): boolean {
  return status === "finished" || status === "confirmed";
}

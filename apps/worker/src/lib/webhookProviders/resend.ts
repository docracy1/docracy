import type { Env } from "@docracy/shared";

const REPLAY_TOLERANCE_SECONDS = 300; // same window used for Stripe's webhook (see lib/billingProviders/stripe.ts)

export interface ResendWebhookResult {
  event: "email_opened" | "email_clicked" | "email_bounced";
  /** The email_type tag set at send time (see lib/email.ts's send()), or null if the message
   *  somehow has none — old messages sent before tagging existed, for instance. */
  emailType: string | null;
}

function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Resend signs webhooks in the Svix format: raw key is the base64 payload after the "whsec_"
 *  prefix (NOT the string itself encoded as UTF-8 — that's the key difference from
 *  packages/shared/src/token.ts's hmacKey, which is for our own opaque hex secrets). */
async function svixHmacKey(secret: string): Promise<CryptoKey> {
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  return crypto.subtle.importKey("raw", base64Decode(raw), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** "svix-signature: v1,<base64> v1,<base64-for-a-rotated-secret>" — space-separated, any one
 *  matching is enough. */
function parseSvixSignatures(header: string): string[] {
  return header
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter((v): v is string => !!v);
}

/**
 * Verifies a Resend webhook's Svix signature and extracts the one event this app acts on.
 * Returns null for: no webhook secret configured, missing/malformed/invalid signature headers, a
 * stale (replayed) event, or an event type this app doesn't track (email.sent/delivered/
 * delivery_delayed/complained — "sent" is already logged more reliably at actual send time, see
 * lib/email.ts). The route itself always responds 200 regardless, since Resend only needs to know
 * we received it, not which of these applies.
 */
export async function verifyAndExtract(
  rawBody: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  env: Env
): Promise<ResendWebhookResult | null> {
  if (!env.RESEND_WEBHOOK_SECRET || !svixId || !svixTimestamp || !svixSignature) return null;

  const eventAgeSeconds = Math.abs(Date.now() / 1000 - Number(svixTimestamp));
  if (!Number.isFinite(eventAgeSeconds) || eventAgeSeconds > REPLAY_TOLERANCE_SECONDS) return null;

  const signatures = parseSvixSignatures(svixSignature);
  if (signatures.length === 0) return null;

  const key = await svixHmacKey(env.RESEND_WEBHOOK_SECRET);
  const signedPayload = new TextEncoder().encode(`${svixId}.${svixTimestamp}.${rawBody}`);
  const anyValid = await Promise.all(
    signatures.map(async (sig) => {
      // A malformed (non-base64) signature value must fail verification, not throw — atob() throws
      // synchronously, which would otherwise 500 the whole webhook instead of just rejecting it.
      let sigBytes: Uint8Array;
      try {
        sigBytes = base64Decode(sig);
      } catch {
        return false;
      }
      return crypto.subtle.verify("HMAC", key, sigBytes, signedPayload).catch(() => false);
    })
  );
  if (!anyValid.some(Boolean)) return null;

  let payload: { type?: string; data?: { tags?: Array<{ name: string; value: string }> } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const eventMap: Record<string, ResendWebhookResult["event"]> = {
    "email.opened": "email_opened",
    "email.clicked": "email_clicked",
    "email.bounced": "email_bounced",
  };
  const mapped = payload.type ? eventMap[payload.type] : undefined;
  if (!mapped) return null;

  const emailType = payload.data?.tags?.find((t) => t.name === "email_type")?.value ?? null;
  return { event: mapped, emailType };
}

import type { Env } from "@docracy/shared";

// A stalled connection to Stripe must still give up in bounded time — same reasoning as
// email.ts's RESEND_TIMEOUT_MS.
const METER_TIMEOUT_MS = 8000;

/**
 * Reports `units` of WhatsApp-signer overage to Stripe's Billing Meter Events API, so it bills at
 * whatever per-unit rate STRIPE_WHATSAPP_OVERAGE_PRICE_ID is configured for ($0.50/unit) against
 * that customer's metered subscription item. Best-effort and non-throwing — a billing side-effect
 * must never block document creation, same posture as every other fire-and-forget call in
 * documentCreation.ts. No-ops if STRIPE_SECRET_KEY or STRIPE_WHATSAPP_METER_NAME isn't configured.
 */
export async function reportWhatsappOverageUsage(env: Env, stripeCustomerId: string, units: number): Promise<void> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WHATSAPP_METER_NAME || units <= 0) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), METER_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.stripe.com/v1/billing/meter_events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        event_name: env.STRIPE_WHATSAPP_METER_NAME,
        "payload[stripe_customer_id]": stripeCustomerId,
        "payload[value]": String(units),
      }).toString(),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Stripe WhatsApp overage meter event failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("Stripe WhatsApp overage meter event request failed:", err);
  } finally {
    clearTimeout(timeout);
  }
}

/** Whether this deployment is set up to bill WhatsApp overage at all — used to decide whether a
 *  paid account past its included monthly allowance should be let through (and billed) or
 *  hard-stopped like a free account (see routes/documents.ts). */
export function whatsappOverageConfigured(env: Env): boolean {
  return !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WHATSAPP_METER_NAME;
}

import { Hono } from "hono";
import { requireAccount, requirePaidAccount, type AccountContext } from "../lib/auth";
import {
  clearPaymentFailed,
  findAccountIdByStripeCustomerId,
  getStripeCustomerId,
  markAccountEnterprise,
  markAccountPaid,
  markPaymentFailed,
  setStripeCustomerId,
} from "../lib/billing";
import { verifyAndExtract } from "../lib/billingProviders/stripe";
import { sanitizeAttribution, trackEvent } from "../lib/analytics";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const billing = new Hono<{ Bindings: Env; Variables: Variables }>();

interface CheckoutBody {
  plan?: "paid" | "enterprise";
  /** First-touch channel from the browser — carried into Stripe metadata for checkout_completed. */
  attribution?: string;
}

billing.post("/checkout", requireAccount, async (c) => {
  let body: CheckoutBody = {};
  try {
    body = await c.req.json<CheckoutBody>();
  } catch {
    // No body (or invalid JSON) just means "the standard plan" — the existing frontend call
    // predates this param and never sends one.
  }
  const isEnterprise = body.plan === "enterprise";
  const priceId = isEnterprise ? c.env.STRIPE_ENTERPRISE_PRICE_ID : c.env.STRIPE_PRICE_ID;

  if (!c.env.STRIPE_SECRET_KEY || !priceId) {
    return c.json({ error: "Billing isn't set up on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  // A team member's paid status is inherited from the workspace owner's subscription — starting
  // their own would just create an unrelated, unused second subscription.
  if (account.id !== account.workspaceId) {
    return c.json({ error: "Ask your workspace owner to manage the subscription." }, 403);
  }

  const attribution = sanitizeAttribution(body.attribution);
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${c.env.PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${c.env.PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
    client_reference_id: account.id,
    customer_email: account.email,
  });
  // The webhook (lib/billingProviders/stripe.ts) reads this off the completed session to decide
  // whether to also call markAccountEnterprise — same metadata shape as the old manually-created
  // Payment Link used, so no webhook-side changes were needed for this to work.
  if (isEnterprise) {
    params.set("metadata[plan]", "enterprise");
  }
  if (attribution) {
    params.set("metadata[attribution]", attribution);
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error(`Stripe checkout session creation failed (${res.status}): ${await res.text()}`);
    return c.json({ error: "Could not start checkout. Please try again." }, 502);
  }

  const session = (await res.json()) as { url: string | null };
  if (!session.url) {
    return c.json({ error: "Could not start checkout. Please try again." }, 502);
  }
  // Gap vs checkout_completed = Stripe drop-off; gap vs upgrade_clicked = price bounce.
  trackEvent(c.env, {
    event: "checkout_started",
    route: "billing",
    userId: account.id,
    source: isEnterprise ? "enterprise" : "paid",
    attribution,
  });
  return c.json({ url: session.url });
});

// Not behind requireAccount/CORS-credentials — Stripe calls this server-to-server with no
// cookies or Origin header, and the signature check below is the actual authentication.
billing.post("/webhook", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("Stripe-Signature") ?? null;
  const result = await verifyAndExtract(rawBody, signature, c.env);
  if (result?.type === "checkout_completed") {
    await markAccountPaid(c.env, result.accountId, true);
    if (result.customerId) await setStripeCustomerId(c.env, result.accountId, result.customerId);
    if (result.isEnterprise) await markAccountEnterprise(c.env, result.accountId);
    trackEvent(c.env, {
      event: "checkout_completed",
      route: "billing",
      userId: result.accountId,
      source: result.isEnterprise ? "enterprise" : "paid",
      attribution: result.attribution,
    });
  } else if (result?.type === "subscription_deleted") {
    const accountId = await findAccountIdByStripeCustomerId(c.env, result.customerId);
    if (accountId) await markAccountPaid(c.env, accountId, false);
  } else if (result?.type === "invoice_payment_failed") {
    const accountId = await findAccountIdByStripeCustomerId(c.env, result.customerId);
    if (accountId) await markPaymentFailed(c.env, accountId);
  } else if (result?.type === "invoice_payment_succeeded") {
    const accountId = await findAccountIdByStripeCustomerId(c.env, result.customerId);
    if (accountId) await clearPaymentFailed(c.env, accountId);
  }
  // Always 200: Stripe retries (and eventually disables the endpoint) on non-2xx responses, and
  // "signature didn't verify" / "not an event type we act on" aren't retry-worthy conditions.
  return c.json({ ok: true });
});

// Redirects a paid account to Stripe's hosted Customer Portal, where they can cancel or manage
// their own subscription — no bespoke cancel-subscription UI to build or keep in sync with
// Stripe's own dunning/proration rules.
billing.post("/portal", requirePaidAccount, async (c) => {
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: "Billing isn't set up on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  if (account.id !== account.workspaceId) {
    return c.json({ error: "Ask your workspace owner to manage the subscription." }, 403);
  }
  const customerId = await getStripeCustomerId(c.env, account.id);
  if (!customerId) {
    return c.json({ error: "No billing account on file yet." }, 404);
  }

  const params = new URLSearchParams({
    customer: customerId,
    return_url: `${c.env.PUBLIC_APP_URL}/dashboard`,
  });

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error(`Stripe portal session creation failed (${res.status}): ${await res.text()}`);
    return c.json({ error: "Could not open the billing portal. Please try again." }, 502);
  }

  const session = (await res.json()) as { url: string | null };
  if (!session.url) {
    return c.json({ error: "Could not open the billing portal. Please try again." }, 502);
  }
  return c.json({ url: session.url });
});

export default billing;

import { Hono } from "hono";
import { requireAccount, type AccountContext } from "../lib/auth";
import { markAccountPaid } from "../lib/billing";
import { verifyAndExtract } from "../lib/billingProviders/stripe";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const billing = new Hono<{ Bindings: Env; Variables: Variables }>();

billing.post("/checkout", requireAccount, async (c) => {
  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_PRICE_ID) {
    return c.json({ error: "Billing isn't set up on this deployment yet." }, 501);
  }
  const account = c.get("account")!;

  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": c.env.STRIPE_PRICE_ID,
    "line_items[0][quantity]": "1",
    success_url: `${c.env.PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${c.env.PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
    client_reference_id: account.id,
    customer_email: account.email,
  });

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
  return c.json({ url: session.url });
});

// Not behind requireAccount/CORS-credentials — Stripe calls this server-to-server with no
// cookies or Origin header, and the signature check below is the actual authentication.
billing.post("/webhook", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("Stripe-Signature") ?? null;
  const result = await verifyAndExtract(rawBody, signature, c.env);
  if (result) {
    await markAccountPaid(c.env, result.accountId, result.paid);
  }
  // Always 200: Stripe retries (and eventually disables the endpoint) on non-2xx responses, and
  // "signature didn't verify" / "not an event type we act on" aren't retry-worthy conditions.
  return c.json({ ok: true });
});

export default billing;

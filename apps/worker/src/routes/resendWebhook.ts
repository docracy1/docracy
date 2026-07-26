import { Hono } from "hono";
import { verifyAndExtract } from "../lib/webhookProviders/resend";
import { trackEvent } from "../lib/analytics";
import type { Env } from "@docracy/shared";

const resendWebhook = new Hono<{ Bindings: Env }>();

// Registered as this route's URL in the Resend dashboard's webhook config, with open/click
// tracking enabled on the sending domain — see lib/webhookProviders/resend.ts's doc comment for
// which event types are handled and why "sent" isn't one of them.
resendWebhook.post("/", async (c) => {
  const rawBody = await c.req.text();
  const result = await verifyAndExtract(
    rawBody,
    c.req.header("svix-id") ?? null,
    c.req.header("svix-timestamp") ?? null,
    c.req.header("svix-signature") ?? null,
    c.env
  );
  if (result) {
    trackEvent(c.env, { event: result.event, route: "email", emailType: result.emailType });
  }
  // Always 200: an unverifiable signature or an event type we don't act on isn't retry-worthy, and
  // Resend (like Stripe) will eventually disable a webhook endpoint that keeps returning non-2xx.
  return c.json({ ok: true });
});

export default resendWebhook;

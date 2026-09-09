import { Hono } from "hono";
import { sendRemitWaitlistNotice } from "../lib/email";
import { checkRemitWaitlistRateLimit } from "../lib/ratelimit";
import type { Env } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_COUNTRY_LENGTH = 60;

// Waitlist for the not-yet-built LatAm send-money/convert feature (see /send-money,
// /es/enviar-dinero) — collects interest ahead of an actual Bitso Business partnership. No
// product exists behind this yet; it only emails FEEDBACK_EMAIL like the general feedback form.
const remitWaitlist = new Hono<{ Bindings: Env }>();

remitWaitlist.post("/", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkRemitWaitlistRateLimit(c.env, ip))) {
    return c.json({ error: "Too many signups from this connection recently. Please try again later." }, 429);
  }

  let body: { email?: string; country?: string };
  try {
    body = await c.req.json<{ email?: string; country?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const email = body.email?.trim() ?? "";
  const country = body.country?.trim() ?? "";

  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }
  if (!country) {
    return c.json({ error: "Please select a country" }, 400);
  }
  if (country.length > MAX_COUNTRY_LENGTH) {
    return c.json({ error: `Country must be under ${MAX_COUNTRY_LENGTH} characters` }, 400);
  }

  await sendRemitWaitlistNotice(c.env, email, country);

  return c.json({ ok: true });
});

export default remitWaitlist;

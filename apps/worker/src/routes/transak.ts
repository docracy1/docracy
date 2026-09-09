import { Hono } from "hono";
import { optionalAccount, type AccountContext } from "../lib/auth";
import { createWidgetSessionUrl } from "../lib/transak";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const transak = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SessionBody {
  fiatCurrency?: string;
}

// Public — no-signup convert widget on /send-money, same philosophy as everything else on that
// page. A logged-in account's email (if any) is passed along only to prefill the widget.
transak.post("/session", optionalAccount, async (c) => {
  let body: SessionBody = {};
  try {
    body = await c.req.json<SessionBody>();
  } catch {
    // No body is fine — fiatCurrency is optional.
  }
  const account = c.get("account");
  const userIp = c.req.header("CF-Connecting-IP");
  if (!userIp) return c.json({ error: "Could not determine your IP address. Please try again." }, 400);
  const result = await createWidgetSessionUrl(c.env, {
    fiatCurrency: body.fiatCurrency,
    email: account?.email,
    userIp,
  });
  if ("error" in result) {
    return c.json({ error: "Convert isn't set up on this deployment yet." }, 501);
  }
  return c.json({ widgetUrl: result.widgetUrl });
});

export default transak;

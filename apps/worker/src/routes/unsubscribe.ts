import { Hono } from "hono";
import { verifyUnsubscribeToken } from "../lib/marketingUnsubscribe";
import type { Env } from "@docracy/shared";

const unsubscribe = new Hono<{ Bindings: Env }>();

/** Plain worker-rendered HTML — no React needed for a one-shot confirmation page reached by
 *  clicking a link in an email, not by navigating the SPA. */
function page(heading: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${heading} — Docracy</title>
<style>
  body { margin: 0; padding: 48px 16px; background: #eef1f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif; color: #1a2b3c; }
  .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; text-align: center; }
  h1 { font-size: 20px; margin: 0 0 12px 0; color: #2f7ed8; }
  p { font-size: 15px; line-height: 1.55; margin: 0; }
</style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

const INVALID_LINK_PAGE = page(
  "This link is no longer valid.",
  "Please make sure you copied the full link from the email, or contact founder@docracy.io if you keep having trouble."
);

// Public, unauthenticated — clicked straight from an email, no session/cookie involved. GDPR/
// CAN-SPAM require this to work in one click with no login.
unsubscribe.get("/", async (c) => {
  const token = c.req.query("token");
  if (!token || !c.env.DOCRACY_DB) {
    return c.html(INVALID_LINK_PAGE, 400);
  }

  const payload = await verifyUnsubscribeToken(token, c.env.TOKEN_SECRET);
  if (!payload) {
    return c.html(INVALID_LINK_PAGE, 400);
  }

  if (payload.kind === "account") {
    await c.env.DOCRACY_DB.prepare(`UPDATE accounts SET marketing_opt_in = 0 WHERE id = ?`).bind(payload.id).run();
  } else {
    await c.env.DOCRACY_DB.prepare(`UPDATE onboarding_leads SET marketing_unsubscribed = 1 WHERE email = ?`)
      .bind(payload.id)
      .run();
  }

  return c.html(
    page(
      "You've been unsubscribed",
      "You've been unsubscribed from Docracy product updates. You'll still receive emails related to documents you send or sign."
    )
  );
});

export default unsubscribe;

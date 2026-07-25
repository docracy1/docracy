import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { queryFunnelSummary } from "../lib/analyticsQuery";
import { NOTRACK_COOKIE_NAME, NOTRACK_COOKIE_MAX_AGE_SECONDS } from "../lib/analytics";
import { requireAdminAccount, type AccountContext } from "../lib/auth";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

// Where you (the site admin) can actually see enterprise accounts and their expiry dates — a
// customer only ever sees their own, in their own Dashboard's Subscription panel.
admin.get("/enterprise-accounts", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ accounts: [] });
  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT email, is_paid, enterprise_expires_at FROM accounts WHERE is_enterprise = 1 ORDER BY enterprise_expires_at ASC`
  ).all<{ email: string; is_paid: number; enterprise_expires_at: string | null }>();
  return c.json({
    accounts: results.map((r) => ({ email: r.email, isPaid: !!r.is_paid, enterpriseExpiresAt: r.enterprise_expires_at })),
  });
});

admin.get("/analytics", requireAdminAccount, async (c) => {
  const days = Math.min(90, Math.max(1, Number(c.req.query("days")) || 30));
  const rows = await queryFunnelSummary(c.env, days);
  if (rows === null) {
    return c.json(
      {
        error:
          "Analytics Engine's read API isn't configured yet — set CF_ANALYTICS_API_TOKEN " +
          "(a Cloudflare API token scoped to Account Analytics:Read) via `wrangler secret put`.",
      },
      501
    );
  }
  return c.json({ days, rows });
});

// Toggles a cookie (see lib/analytics.ts) that opts the caller's own browser out of funnel
// tracking entirely — page views, document_created, document_completed. Gated by
// requireAdminAccount not because reading it is sensitive, but so a random visitor can't quietly
// exempt themselves from being counted.
admin.post("/analytics/notrack", requireAdminAccount, async (c) => {
  let body: { enabled?: boolean };
  try {
    body = await c.req.json<{ enabled?: boolean }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (body.enabled) {
    const isHttps = c.env.PUBLIC_APP_URL.startsWith("https");
    setCookie(c, NOTRACK_COOKIE_NAME, "1", {
      httpOnly: false,
      secure: isHttps,
      sameSite: isHttps ? "None" : "Lax",
      path: "/",
      maxAge: NOTRACK_COOKIE_MAX_AGE_SECONDS,
    });
  } else {
    deleteCookie(c, NOTRACK_COOKIE_NAME, { path: "/" });
  }
  return c.json({ ok: true, enabled: !!body.enabled });
});

export default admin;

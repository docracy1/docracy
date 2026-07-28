import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { queryFunnelSummary, queryFunnelStepCounts, formatAnalyticsFailure } from "../lib/analyticsQuery";
import { NOTRACK_COOKIE_NAME, noTrackCookieOptions } from "../lib/analytics";
import { requireAdminAccount, type AccountContext } from "../lib/auth";
import { findAccountIdByEmail, markAccountEnterprise, markAccountPaid } from "../lib/billing";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

// Where you (the site admin) can actually see enterprise accounts — a customer only ever sees
// their own, in their own Dashboard's Subscription panel. Sorted by email since Enterprise is now
// a real recurring subscription with no separate expiry of our own to track.
admin.get("/enterprise-accounts", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ accounts: [] });
  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT email, is_paid FROM accounts WHERE is_enterprise = 1 ORDER BY email ASC`
  ).all<{ email: string; is_paid: number }>();
  return c.json({ accounts: results.map((r) => ({ email: r.email, isPaid: !!r.is_paid })) });
});

// Every signup, paid or not — email is the only identity Docracy ever collects (magic-link auth
// has no separate name field), so that's all there is to show alongside the signup date and
// current plan. Most recent first, since this is meant to be read as a signup feed.
admin.get("/accounts", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ accounts: [] });
  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT email, created_at, is_paid, is_enterprise FROM accounts ORDER BY created_at DESC`
  ).all<{ email: string; created_at: string; is_paid: number; is_enterprise: number }>();
  return c.json({
    accounts: results.map((r) => ({
      email: r.email,
      createdAt: r.created_at,
      isPaid: !!r.is_paid,
      isEnterprise: !!r.is_enterprise,
    })),
  });
});

interface GrantEnterpriseBody {
  email?: string;
}

// For customers who pay by bank transfer (or any other route that never touches Stripe Checkout)
// — you manually confirm the payment arrived, then grant Enterprise here by email. Self-serve
// customers never need this; they go through POST /api/billing/checkout {plan: "enterprise"}.
admin.post("/grant-enterprise", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  let body: GrantEnterpriseBody;
  try {
    body = await c.req.json<GrantEnterpriseBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.email || !body.email.trim()) {
    return c.json({ error: "Email is required" }, 400);
  }

  const accountId = await findAccountIdByEmail(c.env, body.email);
  if (!accountId) {
    return c.json({ error: "No account found with that email" }, 404);
  }

  await markAccountPaid(c.env, accountId, true);
  await markAccountEnterprise(c.env, accountId);
  return c.json({ ok: true });
});

admin.get("/analytics", requireAdminAccount, async (c) => {
  const days = Math.min(90, Math.max(1, Number(c.req.query("days")) || 30));
  // Only the step counts take this filter — queryFunnelSummary already returns traffic_type per
  // row, so the UI splits bot/human from that one itself.
  const humansOnly = c.req.query("humansOnly") === "1";
  const [summary, steps] = await Promise.all([queryFunnelSummary(c.env, days), queryFunnelStepCounts(c.env, days, humansOnly)]);
  if (!summary.ok) return c.json({ error: formatAnalyticsFailure(summary.failure) }, 501);
  if (!steps.ok) return c.json({ error: formatAnalyticsFailure(steps.failure) }, 501);
  return c.json({ days, humansOnly, rows: summary.data, funnelSteps: steps.data });
});

// Always-on for admins: founders (ADMIN_EMAILS), Claude, and Cursor are excluded from funnel
  // writes. This endpoint only refreshes the founder notrack cookie — turning it off is not
  // supported (QA traffic must never re-enter the charts).
  admin.post("/analytics/notrack", requireAdminAccount, async (c) => {
  setCookie(c, NOTRACK_COOKIE_NAME, "1", noTrackCookieOptions(c.env));
  return c.json({ ok: true, enabled: true });
});

export default admin;

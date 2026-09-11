import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import {
  queryFunnelSummary,
  queryFunnelStepCounts,
  queryAttributionBreakdown,
  queryTrafficSources,
  formatAnalyticsFailure,
} from "../lib/analyticsQuery";
import { NOTRACK_COOKIE_NAME, noTrackCookieOptions } from "../lib/analytics";
import { requireAdminAccount, type AccountContext } from "../lib/auth";
import { deleteAccountByEmail, findAccountIdByEmail, markAccountEnterprise, markAccountPaid } from "../lib/billing";
import { getMarketingRecipientsCount, sendMarketingBroadcast } from "../lib/marketingEmail";
import { translateTemplateSummary } from "../lib/templateTranslate";
import { runWeeklyTemplatePublish } from "../lib/templateWeekly";
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

// Permanent delete — for clearing out spam/test signups from the "All signups" list. Email is
// URL-encoded in the path since it's the only identity these accounts have (see /accounts above).
admin.delete("/accounts/:email", requireAdminAccount, async (c) => {
  const email = decodeURIComponent(c.req.param("email"));
  const result = await deleteAccountByEmail(c.env, email);
  if (!result.ok) return c.json({ error: result.error }, 404);
  return c.json({ ok: true });
});

/** Account-linked documents for admin drill-down from the Analytics tiles. Anonymous free-tier
 *  sends never touch D1, so this list can be smaller than the Analytics Engine document_sent /
 *  document_signed counts. `kind=sent` filters on created_at; `kind=signed` on completed_at. */
admin.get("/documents", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ documents: [], kind: "sent", days: 30 });
  const days = Math.min(90, Math.max(1, Number(c.req.query("days")) || 30));
  const kind = c.req.query("kind") === "signed" ? "signed" : "sent";
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { results: docs } = await c.env.DOCRACY_DB.prepare(
    kind === "signed"
      ? `SELECT d.doc_id, d.title, d.status, d.created_at, d.completed_at, a.email AS account_email
         FROM documents d
         JOIN accounts a ON a.id = d.account_id
         WHERE d.completed_at IS NOT NULL AND d.completed_at >= ?
         ORDER BY d.completed_at DESC`
      : `SELECT d.doc_id, d.title, d.status, d.created_at, d.completed_at, a.email AS account_email
         FROM documents d
         JOIN accounts a ON a.id = d.account_id
         WHERE d.created_at >= ?
         ORDER BY d.created_at DESC`
  )
    .bind(since)
    .all<{
      doc_id: string;
      title: string;
      status: string;
      created_at: string;
      completed_at: string | null;
      account_email: string;
    }>();

  const documents = [];
  for (const doc of docs) {
    const { results: signers } = await c.env.DOCRACY_DB.prepare(
      `SELECT name, email, status, signed_at FROM signers WHERE doc_id = ? ORDER BY "order" ASC`
    )
      .bind(doc.doc_id)
      .all<{ name: string; email: string; status: string; signed_at: string | null }>();
    documents.push({
      docId: doc.doc_id,
      title: doc.title,
      status: doc.status,
      createdAt: doc.created_at,
      completedAt: doc.completed_at,
      accountEmail: doc.account_email,
      signers: signers.map((s) => ({
        name: s.name,
        email: s.email,
        status: s.status,
        signedAt: s.signed_at,
      })),
    });
  }

  return c.json({ kind, days, documents });
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
  const [summary, steps, attribution, trafficSources] = await Promise.all([
    queryFunnelSummary(c.env, days),
    queryFunnelStepCounts(c.env, days, humansOnly),
    queryAttributionBreakdown(c.env, days, humansOnly),
    queryTrafficSources(c.env, days, humansOnly),
  ]);
  if (!summary.ok) return c.json({ error: formatAnalyticsFailure(summary.failure) }, 501);
  if (!steps.ok) return c.json({ error: formatAnalyticsFailure(steps.failure) }, 501);
  if (!attribution.ok) return c.json({ error: formatAnalyticsFailure(attribution.failure) }, 501);
  if (!trafficSources.ok) return c.json({ error: formatAnalyticsFailure(trafficSources.failure) }, 501);
  return c.json({
    days,
    humansOnly,
    rows: summary.data,
    funnelSteps: steps.data,
    attribution: attribution.data,
    trafficSources: trafficSources.data,
  });
});

// Always-on for admins: founders (ADMIN_EMAILS), Claude, and Cursor are excluded from funnel
  // writes. This endpoint only refreshes the founder notrack cookie — turning it off is not
  // supported (QA traffic must never re-enter the charts).
  admin.post("/analytics/notrack", requireAdminAccount, async (c) => {
  setCookie(c, NOTRACK_COOKIE_NAME, "1", noTrackCookieOptions(c.env));
  return c.json({ ok: true, enabled: true });
});

// Live count backing the admin "Marketing Email" tool's "Recipients: N" — accounts.marketing_opt_in
// plus non-unsubscribed onboarding_leads, deduplicated by email (see lib/marketingEmail.ts).
admin.get("/marketing-email/recipients-count", requireAdminAccount, async (c) => {
  const count = await getMarketingRecipientsCount(c.env);
  return c.json({ count });
});

interface SendMarketingEmailBody {
  subject?: string;
  body?: string;
}

// Irreversible (real emails to real opted-in people) — the Dashboard UI gates this behind its own
// two-step confirmation, but this route itself has no extra confirmation step of its own; anyone
// who can reach an admin session can trigger a real send.
admin.post("/marketing-email/send", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  let body: SendMarketingEmailBody;
  try {
    body = await c.req.json<SendMarketingEmailBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const subject = body.subject?.trim();
  const html = body.body?.trim();
  if (!subject) return c.json({ error: "Subject is required" }, 400);
  if (!html) return c.json({ error: "Body is required" }, 400);

  const result = await sendMarketingBroadcast(c.env, subject, html);
  return c.json(result);
});

interface TranslateTemplateSummaryBody {
  title?: string;
  legalSummary?: string;
  keyClauses?: string[];
}

// One-off backfill tool for the curated SEO_TEMPLATE_SLUGS colloquial-Spanish summaries (see
// apps/web/src/lib/freeTemplates.ts's legalSummaryEs/keyClausesEs) — called by hand per slug, not
// wired into any cron. Output is reviewed and pasted into freeTemplates.ts, not auto-applied.
admin.post("/translate-template-summary", requireAdminAccount, async (c) => {
  let body: TranslateTemplateSummaryBody;
  try {
    body = await c.req.json<TranslateTemplateSummaryBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const title = body.title?.trim();
  const legalSummary = body.legalSummary?.trim();
  const keyClauses = Array.isArray(body.keyClauses) ? body.keyClauses.filter((s) => typeof s === "string" && s.trim()) : [];
  if (!title || !legalSummary || keyClauses.length === 0) {
    return c.json({ error: "title, legalSummary, and keyClauses are required" }, 400);
  }

  const result = await translateTemplateSummary(c.env, { title, legalSummary, keyClauses });
  if (!result) return c.json({ error: "Translation failed or didn't validate — try again" }, 502);
  return c.json(result);
});

interface DrainTemplateQueueBody {
  batches?: number;
}

const MAX_DRAIN_BATCHES = 20;

async function queueStatusCounts(env: Env): Promise<Record<string, number>> {
  if (!env.DOCRACY_DB) return {};
  const { results } = await env.DOCRACY_DB.prepare(`SELECT status, COUNT(*) as n FROM template_topic_queue GROUP BY status`).all<{
    status: string;
    n: number;
  }>();
  return Object.fromEntries(results.map((r) => [r.status, r.n]));
}

// Manual catch-up trigger for the Monday template cron (lib/templateWeekly.ts) — same
// runWeeklyTemplatePublish the cron itself calls, just invoked repeatedly on demand instead of
// waiting a batch (WEEKLY_TEMPLATE_BATCH = 10) per Monday. Used to drain a large one-time backlog
// (e.g. requeued legacy-batch titles) over a focused session rather than months of cron cycles.
admin.post("/drain-template-queue", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  if (!c.env.AI) return c.json({ error: "Workers AI isn't bound on this deployment." }, 501);

  let body: DrainTemplateQueueBody = {};
  try {
    body = await c.req.json<DrainTemplateQueueBody>();
  } catch {
    // Empty body is fine — batches defaults below.
  }
  const batches = Math.min(Math.max(1, Math.floor(body.batches ?? 1)), MAX_DRAIN_BATCHES);

  const before = await queueStatusCounts(c.env);
  for (let i = 0; i < batches; i++) {
    const remainingBefore = await queueStatusCounts(c.env);
    if (!remainingBefore.queued) break; // nothing left to drain — stop early rather than no-op calls
    await runWeeklyTemplatePublish(c.env);
  }
  const after = await queueStatusCounts(c.env);

  return c.json({
    batchesRun: batches,
    before,
    after,
    published: (after.published ?? 0) - (before.published ?? 0),
    skipped: (after.skipped ?? 0) - (before.skipped ?? 0),
  });
});

export default admin;

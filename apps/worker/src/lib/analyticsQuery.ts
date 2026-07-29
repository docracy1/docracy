import type { Env } from "@docracy/shared";
import { EXCLUDED_AGENTS_SQL_FILTER } from "./analytics";

export type AnalyticsQueryFailure =
  | { kind: "not_configured" }
  | { kind: "api_error"; status: number; detail: string };

export type AnalyticsQueryResult<T> = { ok: true; data: T } | { ok: false; failure: AnalyticsQueryFailure };

/** Accept either secret name — CF_API_TOKEN was used on some deployments before CF_ANALYTICS_API_TOKEN. */
export function analyticsReadToken(env: Env): string | undefined {
  return env.CF_ANALYTICS_API_TOKEN ?? env.CF_API_TOKEN;
}

function missingConfig(env: Env): AnalyticsQueryFailure | null {
  if (!analyticsReadToken(env) || !env.CF_ACCOUNT_ID) return { kind: "not_configured" };
  return null;
}

async function runAnalyticsSql<T>(env: Env, sql: string): Promise<AnalyticsQueryResult<T>> {
  const config = missingConfig(env);
  if (config) return { ok: false, failure: config };

  const token = analyticsReadToken(env)!;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    body: sql,
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    console.error(`Analytics Engine SQL API failed: ${response.status} ${detail}`);
    return { ok: false, failure: { kind: "api_error", status: response.status, detail } };
  }

  const payload = (await response.json()) as { data?: T };
  return { ok: true, data: payload.data ?? ([] as T) };
}

/** Analytics Engine's binding is write-only from inside the Worker — reading aggregates back
 *  requires this separate HTTP API with a scoped API token (Account Analytics:Read), which isn't
 *  something this code can provision for itself. Returns a structured failure (not a thrown error)
 *  when the token/account id aren't configured yet or the SQL API rejects the query. */
export async function queryFunnelSummary(env: Env, days: number): Promise<AnalyticsQueryResult<unknown[]>> {
  const sql = `
    SELECT
      blob1 AS event,
      blob2 AS route,
      blob3 AS traffic_type,
      blob4 AS bot_name,
      blob5 AS country,
      toDate(timestamp) AS day,
      SUM(double1) AS count
    FROM docracy_funnel
    WHERE timestamp > now() - INTERVAL '${days}' DAY
      AND ${EXCLUDED_AGENTS_SQL_FILTER}
    GROUP BY event, route, traffic_type, bot_name, country, day
    ORDER BY day DESC, event, count DESC
  `.trim();

  return runAnalyticsSql<unknown[]>(env, sql);
}

export interface FunnelStepRow {
  event: string;
  totalCount: number;
  distinctDocuments: number;
  distinctTemplates: number;
}

/** Per-event totals for the 3 named funnels (Activation/Completion/Template), not broken down by
 *  route/day/country like queryFunnelSummary above. `distinctDocuments`/`distinctTemplates` exist
 *  because `document_signed` fires once per signer, not once per completed document — a raw
 *  SUM(double1) on that event overcounts any multi-signer chain. COUNT(DISTINCT blob7/blob8) with
 *  empty rows filtered in WHERE (Analytics Engine rejects CASE inside COUNT DISTINCT) gives the
 *  correct per-document/per-template step counts for funnels that need them; callers that don't
 *  (Activation, Template) just use totalCount instead.
 *
 *  `humansOnly` (blob3, set on write by classifyBot) exists because server-side events and
 *  client-side events have structurally different denominators: `landingpage_loaded` is written
 *  from the Pages middleware for every request to `/`, crawlers included, while its paired
 *  `landingpage_cta_clicked` can only ever come from a browser running JS. Comparing the two
 *  unfiltered divides bot+human loads by human-only clicks, which understates the CTA rate by
 *  however much crawler traffic the site gets. Events written without a user agent at all (cron
 *  sweeps, Resend webhooks) classify as "human" and so survive this filter. */
export async function queryFunnelStepCounts(
  env: Env,
  days: number,
  humansOnly = false
): Promise<AnalyticsQueryResult<FunnelStepRow[]>> {
  const humanFilter = humansOnly ? ` AND blob3 = 'human'` : "";
  const window = `timestamp > now() - INTERVAL '${days}' DAY AND ${EXCLUDED_AGENTS_SQL_FILTER}${humanFilter}`;

  const totalsSql = `
    SELECT blob1 AS event, SUM(double1) AS totalCount
    FROM docracy_funnel
    WHERE ${window}
    GROUP BY event
    ORDER BY event
  `.trim();

  const documentsSql = `
    SELECT blob1 AS event, COUNT(DISTINCT blob7) AS distinctDocuments
    FROM docracy_funnel
    WHERE ${window} AND blob7 != ''
    GROUP BY event
  `.trim();

  const templatesSql = `
    SELECT blob1 AS event, COUNT(DISTINCT blob8) AS distinctTemplates
    FROM docracy_funnel
    WHERE ${window} AND blob8 != ''
    GROUP BY event
  `.trim();

  const [totals, documents, templates] = await Promise.all([
    runAnalyticsSql<Array<{ event: string; totalCount: number }>>(env, totalsSql),
    runAnalyticsSql<Array<{ event: string; distinctDocuments: number }>>(env, documentsSql),
    runAnalyticsSql<Array<{ event: string; distinctTemplates: number }>>(env, templatesSql),
  ]);

  if (!totals.ok) return totals;
  if (!documents.ok) return documents;
  if (!templates.ok) return templates;

  const docByEvent = new Map(documents.data.map((row) => [row.event, row.distinctDocuments]));
  const tplByEvent = new Map(templates.data.map((row) => [row.event, row.distinctTemplates]));

  const data: FunnelStepRow[] = totals.data.map((row) => ({
    event: row.event,
    totalCount: row.totalCount,
    distinctDocuments: docByEvent.get(row.event) ?? 0,
    distinctTemplates: tplByEvent.get(row.event) ?? 0,
  }));

  return { ok: true, data };
}

export interface AttributionRow {
  event: string;
  attribution: string;
  count: number;
}

/** Breaks down growth events by first-touch marketing channel (blob15). Empty attribution is
 *  reported as "direct" so every signup/checkout is accounted for. */
export async function queryAttributionBreakdown(
  env: Env,
  days: number,
  humansOnly = false
): Promise<AnalyticsQueryResult<AttributionRow[]>> {
  const humanFilter = humansOnly ? ` AND blob3 = 'human'` : "";
  const sql = `
    SELECT
      blob1 AS event,
      blob15 AS attribution,
      SUM(double1) AS count
    FROM docracy_funnel
    WHERE timestamp > now() - INTERVAL '${days}' DAY
      AND ${EXCLUDED_AGENTS_SQL_FILTER}${humanFilter}
      AND blob1 IN (
        'signup_started',
        'signup_completed',
        'upgrade_clicked',
        'checkout_started',
        'checkout_completed',
        'viral_cta_clicked'
      )
    GROUP BY event, attribution
    ORDER BY event, count DESC
  `.trim();

  const result = await runAnalyticsSql<Array<{ event: string; attribution: string; count: number }>>(env, sql);
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.map((row) => ({
      event: row.event,
      attribution: row.attribution || "direct",
      count: row.count,
    })),
  };
}

export function formatAnalyticsFailure(failure: AnalyticsQueryFailure): string {
  if (failure.kind === "not_configured") {
    return (
      "Analytics Engine's read API isn't configured yet — set CF_ANALYTICS_API_TOKEN " +
      "(or CF_API_TOKEN) via `wrangler secret put`, using a Cloudflare API token scoped to " +
      "Account Analytics:Read. CF_ACCOUNT_ID is already in wrangler.toml."
    );
  }
  return (
    `Analytics Engine SQL API failed (${failure.status}). ` +
    "Check that the token has Account Analytics:Read on this account and that CF_ACCOUNT_ID matches the dashboard. " +
    `Cloudflare said: ${failure.detail}`
  );
}

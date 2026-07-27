import type { Env } from "@docracy/shared";

export type AnalyticsQueryFailure =
  | { kind: "not_configured"; missing: Array<"CF_ANALYTICS_API_TOKEN" | "CF_ACCOUNT_ID"> }
  | { kind: "api_error"; status: number; detail: string };

export type AnalyticsQueryResult<T> = { ok: true; data: T } | { ok: false; failure: AnalyticsQueryFailure };

function missingConfig(env: Env): AnalyticsQueryFailure | null {
  const missing: Array<"CF_ANALYTICS_API_TOKEN" | "CF_ACCOUNT_ID"> = [];
  if (!env.CF_ANALYTICS_API_TOKEN) missing.push("CF_ANALYTICS_API_TOKEN");
  if (!env.CF_ACCOUNT_ID) missing.push("CF_ACCOUNT_ID");
  return missing.length ? { kind: "not_configured", missing } : null;
}

async function runAnalyticsSql<T>(env: Env, sql: string): Promise<AnalyticsQueryResult<T>> {
  const config = missingConfig(env);
  if (config) return { ok: false, failure: config };

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_API_TOKEN}`, "Content-Type": "text/plain" },
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
 *  the empty-string guard (rows that never carry a documentId/templateId, e.g. signup_started)
 *  gives the correct per-document/per-template step counts for funnels that need them; callers
 *  that don't (Activation, Template) just use totalCount instead. */
export async function queryFunnelStepCounts(env: Env, days: number): Promise<AnalyticsQueryResult<FunnelStepRow[]>> {
  const sql = `
    SELECT
      blob1 AS event,
      SUM(double1) AS totalCount,
      COUNT(DISTINCT CASE WHEN blob7 != '' THEN blob7 END) AS distinctDocuments,
      COUNT(DISTINCT CASE WHEN blob8 != '' THEN blob8 END) AS distinctTemplates
    FROM docracy_funnel
    WHERE timestamp > now() - INTERVAL '${days}' DAY
    GROUP BY event
    ORDER BY event
  `.trim();

  return runAnalyticsSql<FunnelStepRow[]>(env, sql);
}

export function formatAnalyticsFailure(failure: AnalyticsQueryFailure): string {
  if (failure.kind === "not_configured") {
    return (
      "Analytics Engine's read API isn't configured yet — set " +
      failure.missing.join(" and ") +
      " (token via `wrangler secret put CF_ANALYTICS_API_TOKEN` with Account Analytics:Read; " +
      "account id is already in wrangler.toml as CF_ACCOUNT_ID)."
    );
  }
  return (
    `Analytics Engine SQL API failed (${failure.status}). ` +
    "Check that the token has Account Analytics:Read on this account and that CF_ACCOUNT_ID matches the dashboard. " +
    `Cloudflare said: ${failure.detail}`
  );
}

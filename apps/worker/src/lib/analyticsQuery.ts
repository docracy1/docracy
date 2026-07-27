import type { Env } from "@docracy/shared";

/** Analytics Engine's binding is write-only from inside the Worker — reading aggregates back
 *  requires this separate HTTP API with a scoped API token (Account Analytics:Read), which isn't
 *  something this code can provision for itself. Returns null (not a thrown error) when the
 *  token/account id aren't configured yet, so the admin route can degrade to a clear message
 *  instead of a crash — same pattern as the Stripe billing routes elsewhere in this app. */
export async function queryFunnelSummary(env: Env, days: number): Promise<unknown[] | null> {
  if (!env.CF_ANALYTICS_API_TOKEN || !env.CF_ACCOUNT_ID) return null;

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

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_API_TOKEN}`, "Content-Type": "text/plain" },
    body: sql,
  });

  if (!response.ok) {
    console.error(`Analytics Engine SQL API failed: ${response.status} ${await response.text()}`);
    return null;
  }
  const data = (await response.json()) as { data?: unknown[] };
  return data.data ?? [];
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
export async function queryFunnelStepCounts(env: Env, days: number): Promise<FunnelStepRow[] | null> {
  if (!env.CF_ANALYTICS_API_TOKEN || !env.CF_ACCOUNT_ID) return null;

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

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_API_TOKEN}`, "Content-Type": "text/plain" },
    body: sql,
  });

  if (!response.ok) {
    console.error(`Analytics Engine SQL API failed: ${response.status} ${await response.text()}`);
    return null;
  }
  const data = (await response.json()) as { data?: FunnelStepRow[] };
  return data.data ?? [];
}

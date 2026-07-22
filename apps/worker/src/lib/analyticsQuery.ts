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
      toDate(timestamp) AS day,
      SUM(double1) AS count
    FROM docracy_funnel
    WHERE timestamp > now() - INTERVAL '${days}' DAY
    GROUP BY event, route, traffic_type, bot_name, day
    ORDER BY day DESC, event, count DESC
  `.trim();

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_API_TOKEN}`, "Content-Type": "text/plain" },
    body: sql,
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { data?: unknown[] };
  return data.data ?? [];
}

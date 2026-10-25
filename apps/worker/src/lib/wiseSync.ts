import type { Env } from "@docracy/shared";

/** Every 6 hours (00, 06, 12, 18 UTC), from the hourly cron. */
export function isWiseSyncHour(scheduledTime: number): boolean {
  return new Date(scheduledTime).getUTCHours() % 6 === 0;
}

/**
 * Runs the sync of the owner's Wise cash-flow dashboard through the WISE service binding (no public request).
 * The dashboard is a separate worker; it lost its own cron to the account's free-plan trigger limit.
 */
export async function runWiseSync(env: Env): Promise<void> {
  if (!env.WISE || !env.WISE_DASHBOARD_AUTH) {
    console.log("Wise sync skipped: WISE binding or WISE_DASHBOARD_AUTH missing");
    return;
  }
  // "user:password" of the dashboard's Basic auth; a trailing newline from `echo … | wrangler secret put` would
  // make every call a 401 (2026-10-25: all cron calls ended after 0.15 s without a request to Wise).
  const auth = env.WISE_DASHBOARD_AUTH.trim();
  if (!auth.includes(":")) {
    console.error("Wise sync skipped: WISE_DASHBOARD_AUTH must be \"user:password\" of the dashboard login");
    return;
  }
  const response = await env.WISE.fetch("https://wise-cashflow-dashboard/api/sync", {
    method: "POST",
    headers: { authorization: `Basic ${btoa(auth)}` },
  });
  // Read the body either way, so the dashboard does not see the call as cancelled.
  const body = (await response.text()).slice(0, 300);
  console.log(`Wise sync responded ${response.status}: ${response.ok ? body : response.status === 401 ? "login rejected (check WISE_DASHBOARD_AUTH)" : body}`);
  if (!response.ok) throw new Error(`Wise sync failed: ${response.status}`);
}

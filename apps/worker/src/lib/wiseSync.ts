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
  const response = await env.WISE.fetch("https://wise-cashflow-dashboard/api/sync", {
    method: "POST",
    headers: { authorization: `Basic ${btoa(env.WISE_DASHBOARD_AUTH)}` },
  });
  console.log(`Wise sync responded ${response.status}`);
  if (!response.ok) throw new Error(`Wise sync failed: ${response.status}`);
}

import type { Env } from "@docracy/shared";
import { findAccountsPastPaymentFailureGrace, markAccountPaid } from "./billing";

/**
 * Runs daily alongside the other cron sweeps (see index.ts) — freezes (downgrades, same as a
 * manual cancellation) any account whose Stripe payment has been failing for more than 7 days.
 * The immediate "please settle your invoice" banner (Dashboard, driven by payment_failed_at) is
 * shown well before this ever fires; this is only the backstop for accounts that never resolve it.
 */
export async function runPaymentFreezeSweep(env: Env): Promise<void> {
  const accountIds = await findAccountsPastPaymentFailureGrace(env);
  for (const accountId of accountIds) {
    await markAccountPaid(env, accountId, false);
  }
}

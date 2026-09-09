import type { Env } from "@docracy/shared";
import type { Locale } from "@docracy/shared";
import {
  CRYPTO_REMINDER_DAYS,
  findAccountsInCryptoGraceWindow,
  findAccountsPastCryptoExpiry,
  findAccountsPastPaymentFailureGrace,
  markAccountPaid,
  markCryptoReminderSent,
} from "./billing";
import { sendCryptoAccountLocked, sendCryptoPaymentReminder } from "./email";

/**
 * Runs daily alongside the other cron sweeps (see index.ts) — freezes (downgrades, same as a
 * manual cancellation) any account whose Stripe payment has been failing for more than 7 days.
 * The immediate "please settle your invoice" banner (Dashboard, driven by payment_failed_at) is
 * shown well before this ever fires; this is only the backstop for accounts that never resolve it.
 *
 * Also freezes crypto-paid accounts whose paid-until date has lapsed — NOWPayments has no
 * card-style auto-debit, so unlike Stripe (whose own subscription lifecycle fires
 * customer.subscription.deleted), nothing else ever flips these accounts back to unpaid. Unlike
 * Stripe, there's no card-network dunning happening behind the scenes either, so
 * runCryptoReminderSweep below emails the account directly during the grace window instead of
 * just quietly waiting it out.
 */
export async function runPaymentFreezeSweep(env: Env): Promise<void> {
  const accountIds = await findAccountsPastPaymentFailureGrace(env);
  for (const accountId of accountIds) {
    await markAccountPaid(env, accountId, false);
  }
  const cryptoExpired = await findAccountsPastCryptoExpiry(env);
  for (const account of cryptoExpired) {
    await markAccountPaid(env, account.id, false);
    await sendCryptoAccountLocked(env, account.email, (account.locale as Locale) ?? "en");
  }
}

/** Runs daily alongside runPaymentFreezeSweep — emails every crypto-paid account currently inside
 *  its CRYPTO_GRACE_DAYS window the next reminder stage it's due (day2, then day4) that hasn't
 *  already fired this lapsed period. Stages are checked in order and at most one fires per account
 *  per run: an account that's gone straight from "just paid" to "4 days overdue" without the sweep
 *  running in between still only gets one email, not both at once. */
export async function runCryptoReminderSweep(env: Env): Promise<void> {
  const accounts = await findAccountsInCryptoGraceWindow(env);
  for (const account of accounts) {
    const daysPastDue = (Date.now() - new Date(account.cryptoPaidUntil).getTime()) / (24 * 60 * 60 * 1000);
    for (const { stage, afterDays } of CRYPTO_REMINDER_DAYS) {
      if (daysPastDue >= afterDays && !account.remindersSent.includes(stage)) {
        await sendCryptoPaymentReminder(env, account.email, stage as "day2" | "day4", (account.locale as Locale) ?? "en");
        await markCryptoReminderSent(env, account.id, stage);
        break;
      }
    }
  }
}

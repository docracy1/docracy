import type { Env, Locale } from "@docracy/shared";
import {
  sendOnboardingStep1,
  sendOnboardingStep3,
  sendOnboardingStep4,
  sendPreparerLeadStep1,
  sendPreparerLeadStep3,
  sendPreparerLeadStep4,
} from "./email";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

interface Step {
  column: "step1_sent_at" | "step3_sent_at" | "step4_sent_at";
  delayMs: number;
  send: (env: Env, email: string, locale?: Locale) => Promise<void>;
}

// Ordered latest-first so a single sweep only ever sends the most-escalated step still due for a
// given account (see runOnboardingEmailSweep) — the only way an earlier step could still be
// pending when a later one is *also* due is if the cron didn't run for a while, in which case the
// later, more urgent email is the more useful one to actually land.
//
// step2_sent_at still exists as a dormant column in the onboarding_emails table (see migration
// 0013) but is deliberately unused now — the 4-hour "you haven't sent anything yet" nudge it used
// to drive was retired in favor of the per-document preparer-notification family in email.ts,
// which reacts to what actually happened (recipient hasn't opened/signed) instead of a blind timer.
const STEPS: Step[] = [
  { column: "step4_sent_at", delayMs: 3 * DAY, send: sendOnboardingStep4 },
  { column: "step3_sent_at", delayMs: 24 * HOUR, send: sendOnboardingStep3 },
  { column: "step1_sent_at", delayMs: 3 * MINUTE, send: sendOnboardingStep1 },
];

/** Same cadence as account onboarding, but content assumes the recipient already sent a document. */
const LEAD_STEPS: Step[] = [
  { column: "step4_sent_at", delayMs: 3 * DAY, send: sendPreparerLeadStep4 },
  { column: "step3_sent_at", delayMs: 24 * HOUR, send: sendPreparerLeadStep3 },
  { column: "step1_sent_at", delayMs: 3 * MINUTE, send: sendPreparerLeadStep1 },
];

/** Called once, right after a brand-new account row is inserted (see auth.ts) — everything here
 *  is non-fatal to the caller, which is expected to wrap this in ctx.waitUntil(...).catch(...).
 *  Also clears any preparer-opt-in lead for the same email so the two drips never run in parallel. */
export async function scheduleOnboardingEmails(env: Env, accountId: string, email: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const normalized = email.trim().toLowerCase();
  await env.DOCRACY_DB.batch([
    env.DOCRACY_DB.prepare(`DELETE FROM onboarding_leads WHERE email = ?`).bind(normalized),
    env.DOCRACY_DB.prepare(`INSERT INTO onboarding_emails (account_id, email, account_created_at) VALUES (?, ?, ?)`).bind(
      accountId,
      normalized,
      new Date().toISOString()
    ),
  ]);
}

/**
 * Called when an anonymous preparer opts in to tips at send time. Never starts a drip for an
 * address that already has an account (those get the account sequence on signup) or that already
 * opted in earlier (re-sending does not restart the sequence).
 */
export async function schedulePreparerLeadEmails(
  env: Env,
  email: string,
  source = "preparer_optin",
  locale?: Locale
): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const existingAccount = await env.DOCRACY_DB.prepare(`SELECT 1 FROM accounts WHERE email = ? LIMIT 1`)
    .bind(normalized)
    .first();
  if (existingAccount) return;

  const existingLead = await env.DOCRACY_DB.prepare(`SELECT 1 FROM onboarding_leads WHERE email = ? LIMIT 1`)
    .bind(normalized)
    .first();
  if (existingLead) return;

  await env.DOCRACY_DB.prepare(`INSERT INTO onboarding_leads (email, source, opted_in_at, locale) VALUES (?, ?, ?, ?)`)
    .bind(normalized, source, new Date().toISOString(), locale ?? null)
    .run();
}

interface PendingRow {
  account_id: string;
  email: string;
  locale: Locale | null;
}

interface LeadRow {
  email: string;
  locale: Locale | null;
}

async function hasSentAnyDocument(env: Env, accountId: string): Promise<boolean> {
  const row = await env.DOCRACY_DB!.prepare(`SELECT 1 FROM documents WHERE account_id = ? LIMIT 1`).bind(accountId).first();
  return !!row;
}

/**
 * Runs hourly (see index.ts's scheduled handler, branching on the hourly cron entry in
 * wrangler.toml) — sends whichever onboarding step is newly due for each account, skipping any
 * step once the account has actually sent a document. Processes steps latest-first and stops at
 * the first one it sends for a given account in this pass, so a long cron gap sends at most one
 * (the most relevant) email per account rather than bursting all of them at once. Step 1's
 * nominal 3-minute delay may land up to ~1 hour after signup on free-tier cron spacing.
 *
 * Also sweeps preparer-opt-in leads (same cadence, different content — those people already sent).
 */
export async function runOnboardingEmailSweep(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const now = Date.now();
  // Populated as accounts get an email sent in this pass — checked before every later (earlier-
  // step) query below so a long cron gap can't burst 2+ onboarding emails to the same account in
  // one sweep, only the single most-escalated one that's due.
  const handledThisSweep = new Set<string>();

  for (const step of STEPS) {
    const cutoff = new Date(now - step.delayMs).toISOString();
    const rows = await env.DOCRACY_DB.prepare(
      `SELECT oe.account_id AS account_id, oe.email AS email, a.locale AS locale
       FROM onboarding_emails oe
       LEFT JOIN accounts a ON a.id = oe.account_id
       WHERE oe.${step.column} IS NULL AND oe.account_created_at <= ?`
    )
      .bind(cutoff)
      .all<PendingRow>();

    for (const row of rows.results) {
      if (handledThisSweep.has(row.account_id)) continue;
      if (await hasSentAnyDocument(env, row.account_id)) continue;
      try {
        await step.send(env, row.email, row.locale ?? undefined);
        await env.DOCRACY_DB.prepare(`UPDATE onboarding_emails SET ${step.column} = ? WHERE account_id = ?`)
          .bind(new Date().toISOString(), row.account_id)
          .run();
        handledThisSweep.add(row.account_id);
      } catch (err) {
        console.error(`Onboarding email (${step.column}) failed for account ${row.account_id}:`, err);
      }
    }
  }

  const handledLeads = new Set<string>();
  for (const step of LEAD_STEPS) {
    const cutoff = new Date(now - step.delayMs).toISOString();
    const rows = await env.DOCRACY_DB.prepare(
      `SELECT email, locale FROM onboarding_leads WHERE ${step.column} IS NULL AND opted_in_at <= ?`
    )
      .bind(cutoff)
      .all<LeadRow>();

    for (const row of rows.results) {
      if (handledLeads.has(row.email)) continue;
      // If they created an account since opting in, drop the lead — account drip owns them now.
      const account = await env.DOCRACY_DB.prepare(`SELECT 1 FROM accounts WHERE email = ? LIMIT 1`).bind(row.email).first();
      if (account) {
        await env.DOCRACY_DB.prepare(`DELETE FROM onboarding_leads WHERE email = ?`).bind(row.email).run();
        handledLeads.add(row.email);
        continue;
      }
      try {
        await step.send(env, row.email, row.locale ?? undefined);
        await env.DOCRACY_DB.prepare(`UPDATE onboarding_leads SET ${step.column} = ? WHERE email = ?`)
          .bind(new Date().toISOString(), row.email)
          .run();
        handledLeads.add(row.email);
      } catch (err) {
        console.error(`Preparer lead email (${step.column}) failed for ${row.email}:`, err);
      }
    }
  }
}

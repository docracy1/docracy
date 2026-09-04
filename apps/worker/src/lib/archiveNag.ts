import { getDoc, listActiveDocIds, putDoc } from "./kv";
import { sendArchiveNag } from "./email";
import { daysBetween } from "./reminders";
import type { DocState, Env } from "@docracy/shared";

export const ARCHIVE_NAG_DAYS_BEFORE_EXPIRY = 2;

/** Pure: completed, unpaid (or anonymous), has a preparer to email, not yet nagged, within the
 *  2-day window before the signed PDF is deleted. */
export function archiveNagDue(doc: DocState, nowMs: number, isPaid: boolean): boolean {
  if (isPaid) return false;
  if (doc.status !== "completed") return false;
  if (doc.archiveNagSentAt) return false;
  if (!doc.preparerEmail?.trim()) return false;
  const daysLeft = daysBetween(new Date(nowMs).toISOString(), new Date(doc.expiresAt).getTime());
  return daysLeft >= 0 && daysLeft <= ARCHIVE_NAG_DAYS_BEFORE_EXPIRY;
}

async function workspaceIsPaid(env: Env, accountId: string | null): Promise<boolean> {
  if (!accountId || !env.DOCRACY_DB) return false;
  const row = await env.DOCRACY_DB.prepare(`SELECT is_paid FROM accounts WHERE id = ?`)
    .bind(accountId)
    .first<{ is_paid: number }>();
  return !!row?.is_paid;
}

const SWEEP_CONCURRENCY = 10;

async function processArchiveCandidate(env: Env, docId: string): Promise<void> {
  const doc = await getDoc(env, docId);
  if (!doc) return;
  const isPaid = await workspaceIsPaid(env, doc.accountId);
  if (!archiveNagDue(doc, Date.now(), isPaid)) return;
  await sendArchiveNag(env, doc);
  doc.archiveNagSentAt = new Date().toISOString();
  await putDoc(env, doc);
}

/**
 * Daily sweep: email the preparer that a *signed* PDF is about to be deleted, with the document
 * name, counterparties, the delete date, and a one-click upgrade. Paid workspaces skip — they
 * already chose longer retention. Uses existing Resend; no new vendor.
 */
export async function runArchiveNagSweep(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (let i = 0; i < docIds.length; i += SWEEP_CONCURRENCY) {
    const batch = docIds.slice(i, i + SWEEP_CONCURRENCY);
    await Promise.all(
      batch.map((docId) =>
        processArchiveCandidate(env, docId).catch((err) =>
          console.error(`Archive nag failed for doc ${docId} (non-fatal):`, err)
        )
      )
    );
  }
}

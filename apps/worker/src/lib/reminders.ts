import { getDoc, listActiveDocIds, currentTurnOrder, putDoc } from "./kv";
import { sendReminder } from "./email";
import { indexReminderSent } from "./index-d1";
import { signToken } from "@docracy/shared";
import type { DocState, Env, Signer } from "@docracy/shared";

export const THRESHOLDS_DAYS = [2, 4, 6];

// A distinct marker pushed into remindersSent (alongside the day-N thresholds above) once the
// "this expires soon" warning has been sent, so it only fires once per signer.
export const URGENT_SENTINEL = -1;
const URGENT_DAYS_BEFORE_EXPIRY = 2;

/** Pure logic, split out so it's testable without mocking KV/time. */
export function dueThreshold(daysWaiting: number, remindersSent: number[]): number | undefined {
  return THRESHOLDS_DAYS.find((t) => daysWaiting >= t && !remindersSent.includes(t));
}

export function daysBetween(fromIso: string, toMs: number): number {
  return Math.floor((toMs - new Date(fromIso).getTime()) / (24 * 60 * 60 * 1000));
}

/** Sends a reminder for one signer if a threshold is due, mutating `signer.remindersSent` in
 *  place — the caller is responsible for persisting the doc afterward. Shared by both the
 *  sequential (one current signer) and parallel (every still-pending signer) sweep paths below,
 *  so the day-2/4/6 + urgent-expiry logic exists in exactly one place regardless of mode. */
async function maybeSendReminder(env: Env, doc: DocState, signer: Signer): Promise<void> {
  if (!signer.linkSentAt) return;

  const daysWaiting = daysBetween(signer.linkSentAt, Date.now());
  // The gentle day-2/4/6 nudges above are anchored to this signer's own wait time, which
  // resets whenever their turn starts — in a multi-signer chain where an earlier signer takes
  // a while, that clock can land after the document's fixed, absolute expiresAt has already
  // passed, so the signer would get no warning at all before it silently disappears. The
  // urgent warning is anchored to the document's actual deadline instead, so it can't be missed.
  const daysUntilExpiry = daysBetween(new Date().toISOString(), new Date(doc.expiresAt).getTime());
  const urgentDue = daysUntilExpiry <= URGENT_DAYS_BEFORE_EXPIRY && !signer.remindersSent.includes(URGENT_SENTINEL);
  const normalDue = dueThreshold(daysWaiting, signer.remindersSent);
  if (!urgentDue && normalDue === undefined) return;

  const token = await signToken(doc.docId, signer.order, env.TOKEN_SECRET);
  await sendReminder(env, doc, signer.order, token, urgentDue);

  if (urgentDue) {
    // Supersedes any not-yet-sent gentle thresholds — mark them sent too so a later sweep
    // doesn't follow the urgent warning with a confusingly softer-toned reminder.
    const stillDue = THRESHOLDS_DAYS.filter((t) => daysWaiting >= t && !signer.remindersSent.includes(t));
    signer.remindersSent.push(URGENT_SENTINEL, ...stillDue);
  } else {
    signer.remindersSent.push(normalDue!);
  }

  const due = urgentDue ? URGENT_SENTINEL : normalDue!;
  if (doc.accountId) {
    try {
      await indexReminderSent(env, doc, signer.order, due);
    } catch (err) {
      console.error(`D1 indexing (reminder_sent) failed for doc ${doc.docId} (non-fatal):`, err);
    }
  }
}

export async function runReminderSweep(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (const docId of docIds) {
    const doc = await getDoc(env, docId);
    if (!doc || doc.status !== "pending") continue;

    // Sequential mode has exactly one signer who could possibly be due (the current turn);
    // parallel mode invited everyone at once, so any still-pending signer could independently be
    // due for their own reminder.
    let candidates: Signer[];
    if ((doc.signingMode ?? "sequential") === "parallel") {
      candidates = doc.signers.filter((s) => s.status === "pending");
    } else {
      const order = currentTurnOrder(doc);
      const signer = order === null ? undefined : doc.signers.find((s) => s.order === order);
      candidates = signer ? [signer] : [];
    }

    let anyReminderSent = false;
    for (const signer of candidates) {
      const before = signer.remindersSent.length;
      await maybeSendReminder(env, doc, signer);
      if (signer.remindersSent.length !== before) anyReminderSent = true;
    }
    if (anyReminderSent) await putDoc(env, doc);
  }
}

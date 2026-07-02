import { getDoc, listActiveDocIds, currentTurnOrder, putDoc } from "./kv";
import { sendReminder } from "./email";
import { indexReminderSent } from "./index-d1";
import { signToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

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

export async function runReminderSweep(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (const docId of docIds) {
    const doc = await getDoc(env, docId);
    if (!doc || doc.status !== "pending") continue;

    const order = currentTurnOrder(doc);
    if (order === null) continue;
    const signer = doc.signers.find((s) => s.order === order);
    if (!signer || !signer.linkSentAt) continue;

    const daysWaiting = daysBetween(signer.linkSentAt, Date.now());
    // The gentle day-2/4/6 nudges above are anchored to this signer's own wait time, which
    // resets whenever their turn starts — in a multi-signer chain where an earlier signer takes
    // a while, that clock can land after the document's fixed, absolute expiresAt has already
    // passed, so the signer would get no warning at all before it silently disappears. The
    // urgent warning is anchored to the document's actual deadline instead, so it can't be missed.
    const daysUntilExpiry = daysBetween(new Date().toISOString(), new Date(doc.expiresAt).getTime());
    const urgentDue = daysUntilExpiry <= URGENT_DAYS_BEFORE_EXPIRY && !signer.remindersSent.includes(URGENT_SENTINEL);
    const normalDue = dueThreshold(daysWaiting, signer.remindersSent);
    if (!urgentDue && normalDue === undefined) continue;

    const token = await signToken(doc.docId, order, env.TOKEN_SECRET);
    await sendReminder(env, doc, order, token, urgentDue);

    if (urgentDue) {
      // Supersedes any not-yet-sent gentle thresholds — mark them sent too so a later sweep
      // doesn't follow the urgent warning with a confusingly softer-toned reminder.
      const stillDue = THRESHOLDS_DAYS.filter((t) => daysWaiting >= t && !signer.remindersSent.includes(t));
      signer.remindersSent.push(URGENT_SENTINEL, ...stillDue);
    } else {
      signer.remindersSent.push(normalDue!);
    }
    await putDoc(env, doc);

    const due = urgentDue ? URGENT_SENTINEL : normalDue!;
    if (doc.accountId) {
      try {
        await indexReminderSent(env, doc, order, due);
      } catch (err) {
        console.error(`D1 indexing (reminder_sent) failed for doc ${doc.docId} (non-fatal):`, err);
      }
    }
  }
}

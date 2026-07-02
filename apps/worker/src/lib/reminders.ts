import { getDoc, listActiveDocIds, currentTurnOrder, putDoc } from "./kv";
import { sendReminder } from "./email";
import { indexReminderSent } from "./index-d1";
import { signToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

export const THRESHOLDS_DAYS = [2, 4, 6];

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
    const due = dueThreshold(daysWaiting, signer.remindersSent);
    if (due === undefined) continue;

    const token = await signToken(doc.docId, order, env.TOKEN_SECRET);
    await sendReminder(env, doc, order, token, due);
    signer.remindersSent.push(due);
    await putDoc(env, doc);

    if (doc.accountId) {
      try {
        await indexReminderSent(env, doc, order, due);
      } catch (err) {
        console.error(`D1 indexing (reminder_sent) failed for doc ${doc.docId} (non-fatal):`, err);
      }
    }
  }
}

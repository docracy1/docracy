import { getDoc, listActiveDocIds, currentTurnOrder, putDoc } from "./kv";
import { sendCompletionEmailNotOpened, sendCompletionEmailViewedNotSigned } from "./email";
import { signToken } from "@docracy/shared";
import type { DocState, Env, Signer } from "@docracy/shared";

const HOUR = 60 * 60 * 1000;

// "Not opened" fires once the link has sat unopened this long; "viewed but not signed" fires this
// long after the signer's *first view* (not the original send) — someone who opens on day 3 still
// gets a fair 24h window before the nudge, rather than being nudged (or not) based on how long ago
// the link merely went out.
const NOT_OPENED_HOURS = 4;
const VIEWED_NOT_SIGNED_HOURS = 24;

export function hoursBetween(fromIso: string, toMs: number): number {
  return (toMs - new Date(fromIso).getTime()) / HOUR;
}

/** Sends at most one preparer-facing nudge for this signer if due, mutating `signer.completionNudgesSent`
 *  in place — caller persists afterward. The "signed" nudge isn't handled here at all: it's sent
 *  synchronously from routes/sign.ts the moment a signer actually signs, since that's a one-time
 *  event rather than something a periodic sweep needs to detect. */
async function maybeSendCompletionNudge(env: Env, doc: DocState, signer: Signer): Promise<void> {
  if (!doc.preparerEmail || !signer.linkSentAt || signer.status === "signed") return;
  const sent = signer.completionNudgesSent ?? [];
  const now = Date.now();
  const statusToken = await signToken(doc.docId, 0, env.TOKEN_SECRET);

  if (!signer.viewedAt) {
    if (sent.includes("not_opened")) return;
    if (hoursBetween(signer.linkSentAt, now) < NOT_OPENED_HOURS) return;
    await sendCompletionEmailNotOpened(env, doc.preparerEmail, doc, signer.name, statusToken);
    signer.completionNudgesSent = [...sent, "not_opened"];
    return;
  }

  if (sent.includes("viewed_not_signed")) return;
  if (hoursBetween(signer.viewedAt, now) < VIEWED_NOT_SIGNED_HOURS) return;
  await sendCompletionEmailViewedNotSigned(env, doc.preparerEmail, doc, signer.name, statusToken);
  signer.completionNudgesSent = [...sent, "viewed_not_signed"];
}

/**
 * Runs on the frequent cron (see index.ts's scheduled handler, same 5-minute entry the onboarding
 * drip uses — hour-scale thresholds need finer granularity than the once-daily sweeps). Mirrors
 * runReminderSweep's sequential/parallel candidate selection, but nudges the *preparer* about a
 * specific signer's inaction instead of nudging the signer themselves.
 */
export async function runCompletionEmailSweep(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (const docId of docIds) {
    const doc = await getDoc(env, docId);
    if (!doc || doc.status !== "pending" || !doc.preparerEmail) continue;

    let candidates: Signer[];
    if ((doc.signingMode ?? "sequential") === "parallel") {
      candidates = doc.signers.filter((s) => s.status === "pending");
    } else {
      const order = currentTurnOrder(doc);
      const signer = order === null ? undefined : doc.signers.find((s) => s.order === order);
      candidates = signer ? [signer] : [];
    }

    let anyNudgeSent = false;
    for (const signer of candidates) {
      const before = signer.completionNudgesSent?.length ?? 0;
      try {
        await maybeSendCompletionNudge(env, doc, signer);
      } catch (err) {
        console.error(`Completion-email nudge failed for doc ${docId} signer ${signer.order} (non-fatal):`, err);
      }
      if ((signer.completionNudgesSent?.length ?? 0) !== before) anyNudgeSent = true;
    }
    if (anyNudgeSent) await putDoc(env, doc);
  }
}

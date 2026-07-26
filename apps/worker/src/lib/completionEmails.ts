import { getDoc, listActiveDocIds, currentTurnOrder, putDoc } from "./kv";
import { sendCompletionEmailNotOpened, sendCompletionEmailViewedNotSigned } from "./email";
import { trackEvent } from "./analytics";
import { signToken } from "@docracy/shared";
import type { DocState, Env, Signer } from "@docracy/shared";

const HOUR = 60 * 60 * 1000;

// "Not opened" fires once the link has sat unopened this long; "viewed but not signed" fires this
// long after the signer's *first view* (not the original send) — someone who opens on day 3 still
// gets a fair 24h window before the nudge, rather than being nudged (or not) based on how long ago
// the link merely went out. These are the ACTUAL PREPARER EMAIL thresholds — deliberately different
// (and slower) than the pure-analytics checkpoints below, which log a funnel event for every
// document regardless of whether a preparer email exists to nudge.
const NOT_OPENED_HOURS = 4;
const VIEWED_NOT_SIGNED_HOURS = 24;

// document_not_opened_after_2h / document_not_signed_after_4h — Completion-funnel analytics
// checkpoints, anchored to when the link was sent (not to viewedAt), independent of the
// preparer-email thresholds above and of whether this document even has a preparerEmail at all.
const ANALYTICS_NOT_OPENED_HOURS = 2;
const ANALYTICS_NOT_SIGNED_HOURS = 4;

export function hoursBetween(fromIso: string, toMs: number): number {
  return (toMs - new Date(fromIso).getTime()) / HOUR;
}

/** Logs the Completion funnel's timing checkpoints for this signer if due, mutating
 *  `signer.completionNudgesSent` in place — caller persists afterward. Runs for every pending
 *  document's candidate signer(s), regardless of preparerEmail; see maybeSendCompletionNudge for
 *  the (preparerEmail-gated, different-threshold) actual email nudges. */
function maybeTrackAnalyticsCheckpoints(env: Env, doc: DocState, signer: Signer): void {
  if (!signer.linkSentAt || signer.status === "signed") return;
  const sent = signer.completionNudgesSent ?? [];
  const now = Date.now();
  const hoursSinceSent = hoursBetween(signer.linkSentAt, now);

  if (!signer.viewedAt && !sent.includes("analytics_not_opened_2h") && hoursSinceSent >= ANALYTICS_NOT_OPENED_HOURS) {
    trackEvent(env, { event: "document_not_opened_after_2h", route: "sign", userId: doc.accountId, documentId: doc.docId });
    signer.completionNudgesSent = [...(signer.completionNudgesSent ?? sent), "analytics_not_opened_2h"];
  }

  const sentAfterFirst = signer.completionNudgesSent ?? sent;
  if (!sentAfterFirst.includes("analytics_not_signed_4h") && hoursSinceSent >= ANALYTICS_NOT_SIGNED_HOURS) {
    trackEvent(env, { event: "document_not_signed_after_4h", route: "sign", userId: doc.accountId, documentId: doc.docId });
    signer.completionNudgesSent = [...sentAfterFirst, "analytics_not_signed_4h"];
  }
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
    signer.completionNudgesSent = [...(signer.completionNudgesSent ?? sent), "not_opened"];
    return;
  }

  if (sent.includes("viewed_not_signed")) return;
  if (hoursBetween(signer.viewedAt, now) < VIEWED_NOT_SIGNED_HOURS) return;
  await sendCompletionEmailViewedNotSigned(env, doc.preparerEmail, doc, signer.name, statusToken);
  signer.completionNudgesSent = [...(signer.completionNudgesSent ?? sent), "viewed_not_signed"];
}

/**
 * Runs on the frequent cron (see index.ts's scheduled handler, same 5-minute entry the onboarding
 * drip uses — hour-scale thresholds need finer granularity than the once-daily sweeps). Mirrors
 * runReminderSweep's sequential/parallel candidate selection, but nudges the *preparer* about a
 * specific signer's inaction instead of nudging the signer themselves — and, independent of that,
 * logs the Completion funnel's own timing checkpoints for every pending document.
 */
export async function runCompletionEmailSweep(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (const docId of docIds) {
    const doc = await getDoc(env, docId);
    if (!doc || doc.status !== "pending") continue;

    let candidates: Signer[];
    if ((doc.signingMode ?? "sequential") === "parallel") {
      candidates = doc.signers.filter((s) => s.status === "pending");
    } else {
      const order = currentTurnOrder(doc);
      const signer = order === null ? undefined : doc.signers.find((s) => s.order === order);
      candidates = signer ? [signer] : [];
    }

    let anyChange = false;
    for (const signer of candidates) {
      const before = signer.completionNudgesSent?.length ?? 0;

      maybeTrackAnalyticsCheckpoints(env, doc, signer);

      if (doc.preparerEmail) {
        try {
          await maybeSendCompletionNudge(env, doc, signer);
        } catch (err) {
          console.error(`Completion-email nudge failed for doc ${docId} signer ${signer.order} (non-fatal):`, err);
        }
      }

      if ((signer.completionNudgesSent?.length ?? 0) !== before) anyChange = true;
    }
    if (anyChange) await putDoc(env, doc);
  }
}

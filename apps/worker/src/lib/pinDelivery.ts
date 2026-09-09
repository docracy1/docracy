import { getDoc, putDoc, listActiveDocIds } from "./kv";
import { sendPinEmail } from "./email";
import { sendPinSms } from "./sms";
import { sendWhatsAppPin } from "./whatsapp";
import { decryptPin } from "@docracy/shared";
import type { AuditEvent, DocState, Env, Signer } from "@docracy/shared";

/** Gap before the fast-path attempt below — a distinct message on a delay, not the PIN riding
 *  along with the link, is what makes it a real second factor for the WhatsApp AES-track claim
 *  rather than security theater. Short on purpose (see the comment on scheduleDelayedPinDelivery
 *  below) — the hourly sweep, not this delay, is what actually guarantees delivery. */
const FAST_PATH_DELAY_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sends `signer`'s PIN over their configured channel. Doesn't touch pinSentAt/pinPendingEncrypted/
 *  events — callers decide when it's safe to mark that (see markPinSent), since the fast path below
 *  sends against one fetch of the doc but writes back against a fresher one. */
async function sendViaChannel(env: Env, doc: DocState, signer: Signer, pin: string): Promise<void> {
  if (signer.pinDeliveryChannel === "email") {
    await sendPinEmail(env, doc, signer.order, pin);
  } else if (signer.pinDeliveryChannel === "sms") {
    await sendPinSms(env, doc, signer.order, pin);
  } else if (signer.pinDeliveryChannel === "whatsapp") {
    await sendWhatsAppPin(env, doc, signer.order, pin);
  }
}

/** Marks a PIN as delivered on the (caller-supplied, ideally freshly-fetched) doc/signer — clears
 *  pinPendingEncrypted so it's never held any longer than necessary, and appends the audit event.
 *  Caller still owns the putDoc. */
function markPinSent(doc: DocState, signer: Signer): void {
  signer.pinSentAt = new Date().toISOString();
  signer.pinPendingEncrypted = undefined;
  const event: AuditEvent = {
    type: "pin_sent",
    signerOrder: signer.order,
    ip: null,
    userAgent: null,
    timestamp: signer.pinSentAt,
    pdfSha256: null,
  };
  doc.events = [...(doc.events ?? []), event];
}

/**
 * Best-effort fast path — waits FAST_PATH_DELAY_MS, then tries to send the PIN right away.
 *
 * This alone used to be the *only* delivery path, waiting a full 30 seconds inside
 * ctx.waitUntil(). In production that consistently got cut off before finishing: Workers'
 * waitUntil() has a real wall-clock budget after the response is sent, and the original comment's
 * assumption that only CPU time was limited was wrong — every send silently vanished with no
 * exception, just a "waitUntil() tasks did not complete" warning nobody was watching for. The
 * actual delivery guarantee now comes from runDuePinDeliverySweep below, which runs in its own
 * hourly invocation and isn't bound by that budget at all; this fast path just makes the common
 * case feel instant instead of making every signer wait up to an hour.
 *
 * Called from documentCreation.ts via ctx.waitUntil, with the raw pin still in hand from the
 * original request — if it gets cut off, the sweep still has signer.pinPendingEncrypted to work
 * with (decrypting it back to the same raw value), so nothing is lost.
 */
export async function scheduleDelayedPinDelivery(env: Env, docId: string, signerOrder: number, pin: string): Promise<void> {
  await sleep(FAST_PATH_DELAY_MS);

  const doc = await getDoc(env, docId);
  if (!doc || doc.status === "voided") return;
  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer?.pinDeliveryChannel || signer.pinSentAt) return;

  await sendViaChannel(env, doc, signer, pin);

  // Re-fetch immediately before writing back — the doc may have changed again during the send
  // itself (network round-trip to Resend/Meta), and this write must only touch this signer's
  // pinSentAt/pinPendingEncrypted/the new audit event, not clobber whatever else changed on doc in
  // that window.
  const latest = await getDoc(env, docId);
  if (!latest) return;
  const latestSigner = latest.signers.find((s) => s.order === signerOrder);
  if (!latestSigner || latestSigner.pinSentAt) return;

  markPinSent(latest, latestSigner);
  await putDoc(env, latest);
}

/** Hourly safety net (see index.ts's HOURLY_CRON) — catches every PIN the fast path above didn't
 *  get to, regardless of why (waitUntil cut short, a cold start, anything). Scans every active
 *  document for a signer with a pinPendingEncrypted still sitting there and no pinSentAt yet,
 *  decrypts it, sends it, and clears pinPendingEncrypted so it's never held any longer than
 *  necessary. */
export async function runDuePinDeliverySweep(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (const docId of docIds) {
    const doc = await getDoc(env, docId);
    if (!doc || doc.status === "voided") continue;

    let anySent = false;
    for (const signer of doc.signers) {
      if (!signer.pinPendingEncrypted || signer.pinSentAt) continue;
      try {
        const pin = await decryptPin(signer.pinPendingEncrypted, env.TOKEN_SECRET);
        if (pin === null) {
          console.error(`PIN delivery sweep: could not decrypt pending PIN for doc ${docId} signer ${signer.order}`);
          continue;
        }
        await sendViaChannel(env, doc, signer, pin);
        markPinSent(doc, signer);
        anySent = true;
      } catch (err) {
        console.error(`PIN delivery sweep failed for doc ${docId} signer ${signer.order} (non-fatal):`, err);
      }
    }
    if (anySent) await putDoc(env, doc);
  }
}

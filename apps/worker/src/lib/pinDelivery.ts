import { getDoc, putDoc } from "./kv";
import { sendPinEmail } from "./email";
import { sendPinSms } from "./sms";
import { sendWhatsAppPin } from "./whatsapp";
import type { AuditEvent, Env } from "@docracy/shared";

/** Gap between the signing-link send and the PIN send — a distinct message on a delay, not the PIN
 *  riding along with the link, is what makes it a real second factor for the WhatsApp AES-track
 *  claim rather than security theater. See Signer.pinDeliveryChannel's doc comment. */
const PIN_DELIVERY_DELAY_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits PIN_DELIVERY_DELAY_MS, then sends a signer's PIN over their chosen channel — called from
 * documentCreation.ts via ctx.waitUntil (Workers' wall-clock time on waitUntil isn't limited, only
 * CPU time is, and a bare setTimeout-based sleep burns negligible CPU).
 *
 * Re-reads the doc fresh after the delay rather than trusting the doc/signer captured at send time,
 * since the signing chain may have advanced, the document may have been voided, or a reassignment
 * may have changed the channel in that window. No-ops if the signer no longer has a
 * pinDeliveryChannel, if it already fired once (pinSentAt set — guards a reassignment or resend
 * from double-sending), or if the document was voided in the meantime.
 */
export async function scheduleDelayedPinDelivery(env: Env, docId: string, signerOrder: number, pin: string): Promise<void> {
  await sleep(PIN_DELIVERY_DELAY_MS);

  const doc = await getDoc(env, docId);
  if (!doc || doc.status === "voided") return;
  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer?.pinDeliveryChannel || signer.pinSentAt) return;

  if (signer.pinDeliveryChannel === "email") {
    await sendPinEmail(env, doc, signerOrder, pin);
  } else if (signer.pinDeliveryChannel === "sms") {
    await sendPinSms(env, doc, signerOrder, pin);
  } else if (signer.pinDeliveryChannel === "whatsapp") {
    await sendWhatsAppPin(env, doc, signerOrder, pin);
  }

  // Re-fetch immediately before writing back — the doc may have changed again during the send
  // itself (network round-trip to Resend/Meta), and this write must only touch this signer's
  // pinSentAt/the new audit event, not clobber whatever else changed on doc in that window.
  const latest = await getDoc(env, docId);
  if (!latest) return;
  const latestSigner = latest.signers.find((s) => s.order === signerOrder);
  if (!latestSigner || latestSigner.pinSentAt) return;

  latestSigner.pinSentAt = new Date().toISOString();
  const event: AuditEvent = {
    type: "pin_sent",
    signerOrder,
    ip: null,
    userAgent: null,
    timestamp: latestSigner.pinSentAt,
    pdfSha256: null,
  };
  latest.events = [...(latest.events ?? []), event];
  await putDoc(env, latest);
}

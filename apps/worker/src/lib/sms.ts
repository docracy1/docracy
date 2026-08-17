import { sendPlainText } from "./email";
import type { DocState, Env } from "@docracy/shared";

/** US carrier MMS/SMS email gateways — delivered through Resend (no separate SMS vendor). */
export const SMS_CARRIER_GATEWAYS = {
  att: "txt.att.net",
  tmobile: "tmomail.net",
  verizon: "vtext.com",
  sprint: "messaging.sprintpcs.com",
  uscc: "email.uscc.net",
} as const;

export type SmsCarrier = keyof typeof SMS_CARRIER_GATEWAYS;

const SMS_CARRIER_SET = new Set<string>(Object.keys(SMS_CARRIER_GATEWAYS));

export function isSmsCarrier(value: string): value is SmsCarrier {
  return SMS_CARRIER_SET.has(value);
}

/** Normalizes a US mobile number to 10 digits, or null if invalid. */
export function normalizeUsPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return null;
}

export function smsGatewayAddress(phone: string, carrier: SmsCarrier): string | null {
  const digits = normalizeUsPhone(phone);
  if (!digits) return null;
  return `${digits}@${SMS_CARRIER_GATEWAYS[carrier]}`;
}

/**
 * US-only SMS signing invites via carrier email-to-SMS gateways (Resend).
 * Not available for international numbers — those signers rely on email invites only.
 */
export async function sendSigningSmsLink(
  env: Env,
  doc: DocState,
  signerOrder: number,
  signUrl: string
): Promise<void> {
  if (!doc.smsInvites) return;

  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer?.phone || !signer.smsCarrier || !isSmsCarrier(signer.smsCarrier)) return;

  const gatewayTo = smsGatewayAddress(signer.phone, signer.smsCarrier);
  if (!gatewayTo) return;

  const docLabel = doc.title ? `"${doc.title}"` : "a document";
  const text = `Docracy: You've been invited to sign ${docLabel}. Sign here: ${signUrl}`;

  await sendPlainText(env, gatewayTo, text, "signing_invite_sms");
}

/**
 * Sends a signer's PIN via the same US carrier email-to-SMS gateway as sendSigningSmsLink — a
 * separate text, ~30 seconds later (see lib/pinDelivery.ts), so it's a distinct message rather than
 * the PIN riding along with the link. No-ops if the signer has no phone+carrier on file.
 */
export async function sendPinSms(env: Env, doc: DocState, signerOrder: number, pin: string): Promise<void> {
  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer?.phone || !signer.smsCarrier || !isSmsCarrier(signer.smsCarrier)) return;

  const gatewayTo = smsGatewayAddress(signer.phone, signer.smsCarrier);
  if (!gatewayTo) return;

  const text = `Docracy: Your PIN to sign the document is ${pin}. Enter it on the signing page to continue.`;
  await sendPlainText(env, gatewayTo, text, "signing_pin_sms");
}

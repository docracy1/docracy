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
 * Texts a signing link via the signer's carrier email-to-SMS gateway using Resend.
 * Free — no Twilio or other SMS API; uses the same Resend quota as regular emails.
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

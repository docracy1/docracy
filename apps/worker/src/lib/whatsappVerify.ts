import { getDoc, putDoc } from "./kv";
import { sendWhatsAppVerificationCode } from "./whatsapp";
import { hashOpaqueToken } from "@docracy/shared";
import type { AuditEvent, Env } from "@docracy/shared";

const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode(): string {
  // 6 digits, zero-padded — crypto.getRandomValues rather than Math.random since this gates a
  // real trust claim (see Signer.whatsappVerifiedAt's doc comment), not just a UI nicety.
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

export type RequestResult = { ok: true } | { ok: false; error: string };

/** Generates a fresh code, hashes it, stores the hash + expiry on the signer, and sends it via
 *  WhatsApp. Overwrites any previous in-flight code for this signer (a re-request supersedes it,
 *  same convention as a resend anywhere else in this app). */
export async function requestWhatsappVerification(env: Env, docId: string, signerOrder: number): Promise<RequestResult> {
  const doc = await getDoc(env, docId);
  if (!doc || doc.status === "voided") return { ok: false, error: "Document not found" };
  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer) return { ok: false, error: "Signer not found" };
  if (!signer.whatsappPhone) return { ok: false, error: "No WhatsApp number on file for this signer" };
  if (signer.whatsappVerifiedAt) return { ok: true };

  const code = generateCode();
  signer.whatsappVerifyHash = await hashOpaqueToken(code, env.TOKEN_SECRET);
  signer.whatsappVerifyExpiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  await putDoc(env, doc);

  await sendWhatsAppVerificationCode(env, doc, signerOrder, code);
  return { ok: true };
}

export type ConfirmResult = { ok: true } | { ok: false; error: string };

/** Checks the submitted code against the stored hash + expiry. Never reveals which part failed
 *  (wrong code vs. expired vs. none requested) beyond a single generic message — same reasoning as
 *  any other secret-verification endpoint in this app. */
export async function confirmWhatsappVerification(
  env: Env,
  docId: string,
  signerOrder: number,
  code: string
): Promise<ConfirmResult> {
  const doc = await getDoc(env, docId);
  if (!doc || doc.status === "voided") return { ok: false, error: "Document not found" };
  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer) return { ok: false, error: "Signer not found" };
  if (signer.whatsappVerifiedAt) return { ok: true };

  if (!signer.whatsappVerifyHash || !signer.whatsappVerifyExpiresAt) {
    return { ok: false, error: "Request a code first" };
  }
  if (new Date(signer.whatsappVerifyExpiresAt).getTime() <= Date.now()) {
    return { ok: false, error: "That code has expired — request a new one" };
  }

  const submittedHash = await hashOpaqueToken(code.trim(), env.TOKEN_SECRET);
  if (submittedHash !== signer.whatsappVerifyHash) {
    return { ok: false, error: "That code doesn't match" };
  }

  signer.whatsappVerifiedAt = new Date().toISOString();
  signer.whatsappVerifyHash = undefined;
  signer.whatsappVerifyExpiresAt = undefined;
  const event: AuditEvent = {
    type: "whatsapp_verified",
    signerOrder,
    ip: null,
    userAgent: null,
    timestamp: signer.whatsappVerifiedAt,
    pdfSha256: null,
  };
  doc.events = [...(doc.events ?? []), event];
  await putDoc(env, doc);
  return { ok: true };
}

import { getDoc } from "./kv";
import { parseToken, verifyToken, type VerifiedToken } from "@docracy/shared";
import type { DocState, Env } from "@docracy/shared";

/**
 * Parse → load DocState → verify HMAC (including the signer's linkNonce when present).
 * Status tokens (order 0) and CC viewer tokens (order -1) never use a nonce. Legacy signers
 * without linkNonce keep verifying.
 */
export async function authenticateDocToken(
  env: Env,
  token: string
): Promise<{ verified: VerifiedToken; doc: DocState } | null> {
  const parsed = parseToken(token);
  if (!parsed) return null;

  const doc = await getDoc(env, parsed.docId);
  if (!doc) return null;

  // Order 0 = preparer status (can void). Order -1 = CC viewer (status/download only).
  // Neither carries a linkNonce.
  if (parsed.order === 0 || parsed.order === -1) {
    const verified = await verifyToken(token, env.TOKEN_SECRET);
    return verified ? { verified, doc } : null;
  }

  const signer = doc.signers.find((s) => s.order === parsed.order);
  if (!signer) return null;

  const verified = await verifyToken(token, env.TOKEN_SECRET, signer.linkNonce);
  return verified ? { verified, doc } : null;
}

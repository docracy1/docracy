import { generateOpaqueToken, hashOpaqueToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

const UNLOCK_TTL_SECONDS = 30 * 60; // 30 minutes — long enough for a signer to unlock, read the
// document, and complete signing in one sitting, short enough that a leaked unlock token isn't a
// standing credential.

interface UnlockRecord {
  docId: string;
  order: number;
}

/** Constant-time-by-construction: both sides are hex HMAC digests of equal length compared via
 *  the same hashOpaqueToken path already used for magic-link/session tokens, never a raw string
 *  comparison against the PIN itself. */
export async function verifyPin(env: Env, pin: string, pinHash: string): Promise<boolean> {
  const candidate = await hashOpaqueToken(pin, env.TOKEN_SECRET);
  return candidate === pinHash;
}

/** Mints a short-lived unlock token for one signer on one document, stored hashed in KV — the
 *  raw token is only ever returned to the client that just proved it knows the PIN. */
export async function issueUnlockToken(env: Env, docId: string, order: number): Promise<string> {
  const token = generateOpaqueToken();
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const record: UnlockRecord = { docId, order };
  await env.DOCRACY_KV.put(`signunlock:${hash}`, JSON.stringify(record), { expirationTtl: UNLOCK_TTL_SECONDS });
  return token;
}

/** True only if `token` is a currently-valid unlock token minted for exactly this docId/order —
 *  an unlock token for a different signer or a different document never satisfies this. */
export async function verifyUnlockToken(env: Env, token: string | undefined, docId: string, order: number): Promise<boolean> {
  if (!token) return false;
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const record = await env.DOCRACY_KV.get<UnlockRecord>(`signunlock:${hash}`, "json");
  return !!record && record.docId === docId && record.order === order;
}

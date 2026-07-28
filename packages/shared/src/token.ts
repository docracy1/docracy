export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function tokenMessage(docId: string, order: number, linkNonce?: string | null): string {
  // linkNonce is included in the HMAC (not the token string) so reassignment can invalidate old
  // links by rotating it. Absent/null keeps the legacy `${docId}:${order}` message so in-flight
  // documents created before this field existed keep verifying.
  return linkNonce ? `${docId}:${order}:${linkNonce}` : `${docId}:${order}`;
}

/** Signs a docId+order pair so a signer's link can't be edited to jump the queue. Optional
 *  linkNonce binds the signature to a specific assignee — rotate it on reassignment. */
export async function signToken(
  docId: string,
  order: number,
  secret: string,
  linkNonce?: string | null
): Promise<string> {
  const key = await hmacKey(secret);
  const message = tokenMessage(docId, order, linkNonce);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return `${docId}.${order}.${base64UrlEncode(new Uint8Array(sig))}`;
}

export interface VerifiedToken {
  docId: string;
  order: number;
}

/** Structural parse only — does not verify the HMAC. Use before loading DocState so the caller's
 *  verifyToken can include the signer's linkNonce from KV. */
export function parseToken(token: string): VerifiedToken | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [docId, orderStr] = parts;
  const order = Number(orderStr);
  if (!docId || !Number.isInteger(order)) return null;
  return { docId, order };
}

/**
 * Returns the decoded {docId, order} only if the signature verifies; null otherwise. Shared
 * (not duplicated) between apps/worker and apps/connector deliberately — this is the one
 * function where copy-paste drift would be a real security risk, not just a maintenance nuisance.
 *
 * Pass linkNonce when verifying a signer link that was minted with one; omit (or pass null/
 * undefined) for status tokens (order 0) and for legacy signer links created before nonces.
 */
export async function verifyToken(
  token: string,
  secret: string,
  linkNonce?: string | null
): Promise<VerifiedToken | null> {
  const parsed = parseToken(token);
  if (!parsed) return null;
  const [, , sigPart] = token.split(".");

  const key = await hmacKey(secret);
  const message = tokenMessage(parsed.docId, parsed.order, linkNonce);
  let sigBytes: Uint8Array;
  try {
    sigBytes = base64UrlDecode(sigPart);
  } catch {
    return null;
  }
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(message));
  return valid ? parsed : null;
}

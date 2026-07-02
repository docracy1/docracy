function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Signs a docId+order pair so a signer's link can't be edited to jump the queue. */
export async function signToken(docId: string, order: number, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const message = `${docId}:${order}`;
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return `${docId}.${order}.${base64UrlEncode(new Uint8Array(sig))}`;
}

export interface VerifiedToken {
  docId: string;
  order: number;
}

/**
 * Returns the decoded {docId, order} only if the signature verifies; null otherwise. Shared
 * (not duplicated) between apps/worker and apps/connector deliberately — this is the one
 * function where copy-paste drift would be a real security risk, not just a maintenance nuisance.
 */
export async function verifyToken(token: string, secret: string): Promise<VerifiedToken | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [docId, orderStr, sigPart] = parts;
  const order = Number(orderStr);
  if (!docId || !Number.isInteger(order)) return null;

  const key = await hmacKey(secret);
  const message = `${docId}:${order}`;
  let sigBytes: Uint8Array;
  try {
    sigBytes = base64UrlDecode(sigPart);
  } catch {
    return null;
  }
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(message));
  return valid ? { docId, order } : null;
}

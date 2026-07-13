import { base64UrlEncode, hmacKey } from "./token";

/**
 * A random opaque token (32 bytes of entropy) — used for magic-link and session tokens, which
 * unlike signToken's docId+order tokens carry no payload, just identity via a server-side lookup.
 */
export function generateOpaqueToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(bytes);
}

/**
 * Hex-encoded HMAC-SHA256 of an opaque token. Magic-links/sessions/API tokens are looked up by
 * this hash, not the raw token — mirrors why signed PDFs are hashed in the audit trail: the raw
 * token should never need to be stored anywhere a KV/D1 read could leak it.
 */
export async function hashOpaqueToken(token: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

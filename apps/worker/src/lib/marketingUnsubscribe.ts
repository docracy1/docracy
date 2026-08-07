// One-click unsubscribe tokens for the marketing-email system (see lib/marketingEmail.ts and
// routes/unsubscribe.ts). Deliberately NOT built on packages/shared/src/token.ts — that helper is
// scoped narrowly to signing docId+order pairs for the signer-link flow, and per this repo's YAGNI
// convention (see CLAUDE.md: "duplicate code intentionally except token verification in
// packages/shared"), a differently-shaped payload gets its own small local implementation rather
// than bending the shared one. The underlying crypto (HMAC-SHA256 via crypto.subtle, base64url
// encoding) mirrors that file's pattern.

export type UnsubscribeKind = "account" | "lead";

export interface UnsubscribeTokenPayload {
  kind: UnsubscribeKind;
  /** accounts.id for kind "account"; the lead's email address for kind "lead". */
  id: string;
}

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

/** Signs a {kind, id} payload as `<base64url(json)>.<base64url(hmac)>` — the payload travels in
 *  the token itself (not looked up server-side), same tradeoff as the docId+order signer tokens:
 *  a single unauthenticated GET must be able to fully resolve the target with only TOKEN_SECRET. */
export async function signUnsubscribeToken(payload: UnsubscribeTokenPayload, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(sig))}`;
}

/** Returns the decoded payload only if the signature verifies and it structurally matches
 *  UnsubscribeTokenPayload; null for anything malformed, tampered, or signed with a different
 *  secret — callers should treat null as "this link is no longer valid," not a hard error. */
export async function verifyUnsubscribeToken(
  token: string,
  secret: string
): Promise<UnsubscribeTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  let sigBytes: Uint8Array;
  try {
    sigBytes = base64UrlDecode(encodedSig);
  } catch {
    return null;
  }

  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(encodedPayload));
  if (!valid) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));
    if (
      parsed &&
      (parsed.kind === "account" || parsed.kind === "lead") &&
      typeof parsed.id === "string" &&
      parsed.id.length > 0
    ) {
      return { kind: parsed.kind, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

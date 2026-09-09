import { base64UrlEncode, base64UrlDecode } from "./token";

/** Signer PINs are never persisted raw anywhere (see documentCreation.test.ts's
 *  "never stores it raw" guard) — only an HMAC hash for verification (Signer.pinHash) and, when a
 *  delivery is still outstanding, this AES-GCM-encrypted form (Signer.pinPendingEncrypted) so the
 *  hourly delivery sweep can recover the plaintext to actually send it without ever writing that
 *  plaintext to KV. Same TOKEN_SECRET as every other HMAC/signing use in this app; compromising it
 *  already breaks link forgery, so this doesn't lower the bar. */
async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypts `pin` for temporary at-rest storage. Returns a single base64url string (12-byte random
 *  IV + ciphertext, packed together) — nothing else needs to be stored alongside it. */
export async function encryptPin(pin: string, secret: string): Promise<string> {
  const key = await deriveAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(pin))
  );
  const packed = new Uint8Array(iv.length + ciphertext.length);
  packed.set(iv, 0);
  packed.set(ciphertext, iv.length);
  return base64UrlEncode(packed);
}

/** Reverses encryptPin. Returns null instead of throwing on any malformed/tampered input, since a
 *  bad value here should never take down a delivery sweep. */
export async function decryptPin(packed: string, secret: string): Promise<string | null> {
  try {
    const bytes = base64UrlDecode(packed);
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const key = await deriveAesKey(secret);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

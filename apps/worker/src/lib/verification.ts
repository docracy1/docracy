import type { Env } from "@docracy/shared";

/** Public verification records live in KV, not D1 — "Anonymous docs never touch D1" (see
 *  CLAUDE.md) still applies, and KV is already the source of truth for every document
 *  regardless of tier. A record is a plain hash → {signerCount, completedAt} lookup with no
 *  document content, title, signer names, or emails, so it stays safe to keep indefinitely even
 *  after the source document itself is deleted at the end of its (much shorter) retention TTL —
 *  that's the entire point: prove a document was really completed via Docracy well past the
 *  point the document itself stops existing. No expirationTtl is set on this key on purpose. */
const KV_PREFIX = "verify:";
// Separate key from the record above — the OTS proof arrives slightly later (it's a background
// step, see lib/opentimestamps.ts) and is optional, so a document that completes before its
// calendar submissions land still has a working plain verification record in the meantime.
const OTS_KV_PREFIX = "verify-ots:";

export interface VerificationRecord {
  signerCount: number;
  completedAt: string;
}

export function isValidSha256Hex(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

export async function recordVerification(env: Env, hash: string, record: VerificationRecord): Promise<void> {
  await env.DOCRACY_KV.put(`${KV_PREFIX}${hash.toLowerCase()}`, JSON.stringify(record));
}

export async function lookupVerification(env: Env, hash: string): Promise<VerificationRecord | null> {
  if (!isValidSha256Hex(hash)) return null;
  return env.DOCRACY_KV.get<VerificationRecord>(`${KV_PREFIX}${hash.toLowerCase()}`, "json");
}

export async function recordOtsProof(env: Env, hash: string, proofBytes: Uint8Array): Promise<void> {
  await env.DOCRACY_KV.put(`${OTS_KV_PREFIX}${hash.toLowerCase()}`, proofBytes);
}

export async function lookupOtsProof(env: Env, hash: string): Promise<Uint8Array | null> {
  if (!isValidSha256Hex(hash)) return null;
  const buf = await env.DOCRACY_KV.get(`${OTS_KV_PREFIX}${hash.toLowerCase()}`, "arrayBuffer");
  return buf ? new Uint8Array(buf) : null;
}

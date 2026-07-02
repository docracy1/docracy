import { verifyToken } from "@docracy/shared";
import type { ConnectorEnv as Env } from "./types";

/**
 * Deliberately duplicated from apps/worker/src/lib/kv.ts's getDoc + sign.ts's statusPayload
 * (not shared) — these are ~10 lines each and this project's existing convention (set during
 * the original build) is no shared runtime code beyond what's small and security-critical.
 * verifyToken itself IS shared (see @docracy/shared) since HMAC verification drifting between
 * two copies would be a real security bug, not just a maintenance nuisance.
 */
// apps/worker's KV entries deliberately outlive their expiresAt (worker's kv.ts putDoc keeps a
// grace period so its cleanup sweep can delete R2 blobs before KV drops the key) — so this must
// re-check expiresAt itself rather than trusting a non-null KV read, or an expired doc would
// keep reporting as "pending" here during that grace window.
async function getDoc(env: Env, docId: string) {
  const doc = (await env.DOCRACY_KV.get(`doc:${docId}`, "json")) as {
    docId: string;
    expiresAt: string;
    status: "pending" | "completed";
    signers: Array<{ order: number; name: string; status: "pending" | "signed"; signedAt: string | null }>;
  } | null;
  if (doc && new Date(doc.expiresAt).getTime() <= Date.now()) return null;
  return doc;
}

export interface StatusResult {
  found: boolean;
  docId?: string;
  status?: "pending" | "completed";
  signers?: Array<{ order: number; name: string; status: "pending" | "signed"; signedAt: string | null }>;
  error?: string;
}

/** Accepts either a bare token or a full sign/status URL containing one. */
function extractToken(linkOrToken: string): string {
  const match = linkOrToken.match(/\/(?:sign|status)\/([^/?#\s]+)/);
  return match ? match[1] : linkOrToken.trim();
}

export async function checkStatus(env: Env, linkOrToken: string): Promise<StatusResult> {
  const token = extractToken(linkOrToken);
  const verified = await verifyToken(token, env.TOKEN_SECRET);
  if (!verified) {
    return { found: false, error: "That doesn't look like a valid Docracy link." };
  }

  const doc = await getDoc(env, verified.docId);
  if (!doc) {
    return { found: false, error: "This document has expired or no longer exists." };
  }

  return {
    found: true,
    docId: doc.docId,
    status: doc.status,
    signers: [...doc.signers].sort((a, b) => a.order - b.order),
  };
}

import { verifyToken } from "@docracy/shared";
import type { ConnectorEnv as Env } from "./types";

/**
 * Deliberately duplicated from apps/worker/src/lib/kv.ts's getDoc + sign.ts's statusPayload
 * (not shared) — these are ~10 lines each and this project's existing convention (set during
 * the original build) is no shared runtime code beyond what's small and security-critical.
 * verifyToken itself IS shared (see @docracy/shared) since HMAC verification drifting between
 * two copies would be a real security bug, not just a maintenance nuisance.
 */
async function getDoc(env: Env, docId: string) {
  return env.DOCRACY_KV.get(`doc:${docId}`, "json") as Promise<
    | {
        docId: string;
        status: "pending" | "completed";
        signers: Array<{ order: number; name: string; status: "pending" | "signed"; signedAt: string | null }>;
      }
    | null
  >;
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

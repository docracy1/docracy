import { parseToken, verifyToken } from "@docracy/shared";
import type { ConnectorEnv as Env } from "./types";

/**
 * Deliberately duplicated from apps/worker's getDoc + statusPayload (not shared) — these are
 * ~10 lines each and this project's existing convention is no shared runtime code beyond what's
 * small and security-critical. verifyToken itself IS shared (see @docracy/shared).
 */
async function getDoc(env: Env, docId: string) {
  const doc = (await env.DOCRACY_KV.get(`doc:${docId}`, "json")) as {
    docId: string;
    expiresAt: string;
    status: "pending" | "completed" | "voided";
    signers: Array<{
      order: number;
      name: string;
      status: "pending" | "signed" | "declined";
      signedAt: string | null;
      linkNonce?: string;
    }>;
  } | null;
  if (doc && new Date(doc.expiresAt).getTime() <= Date.now()) return null;
  return doc;
}

export interface StatusResult {
  found: boolean;
  docId?: string;
  status?: "pending" | "completed" | "voided";
  signers?: Array<{ order: number; name: string; status: "pending" | "signed" | "declined"; signedAt: string | null }>;
  error?: string;
}

/** Accepts either a bare token or a full sign/status URL containing one. */
function extractToken(linkOrToken: string): string {
  const match = linkOrToken.match(/\/(?:sign|status)\/([^/?#\s]+)/);
  return match ? match[1] : linkOrToken.trim();
}

export async function checkStatus(env: Env, linkOrToken: string): Promise<StatusResult> {
  const token = extractToken(linkOrToken);
  const parsed = parseToken(token);
  if (!parsed) {
    return { found: false, error: "That doesn't look like a valid Docracy link." };
  }

  const doc = await getDoc(env, parsed.docId);
  if (!doc) {
    return { found: false, error: "This document has expired or no longer exists." };
  }

  const linkNonce =
    parsed.order === 0 ? undefined : doc.signers.find((s) => s.order === parsed.order)?.linkNonce;
  if (parsed.order !== 0 && !doc.signers.some((s) => s.order === parsed.order)) {
    return { found: false, error: "That doesn't look like a valid Docracy link." };
  }

  const verified = await verifyToken(token, env.TOKEN_SECRET, linkNonce);
  if (!verified) {
    return { found: false, error: "That doesn't look like a valid Docracy link." };
  }

  return {
    found: true,
    docId: doc.docId,
    status: doc.status,
    signers: [...doc.signers].sort((a, b) => a.order - b.order),
  };
}

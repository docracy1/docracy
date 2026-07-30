import { generateOpaqueToken, hashOpaqueToken, signToken } from "@docracy/shared";
import { getDoc } from "./kv";
import type { Env } from "@docracy/shared";

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour
const MAX_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export interface EmbedSessionRecord {
  docId: string;
  order: number;
  accountId: string;
  allowedOrigins: string[];
  returnUrl?: string;
  createdAt: string;
}

export interface IssueEmbedSessionParams {
  env: Env;
  accountId: string;
  docId: string;
  signerOrder: number;
  allowedOrigins: string[];
  returnUrl?: string;
  ttlSeconds?: number;
}

function isHttpsOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    const okProto = u.protocol === "https:" || (u.protocol === "http:" && u.hostname === "localhost");
    if (!okProto) return false;
    if (u.pathname !== "/" && u.pathname !== "") return false;
    if (u.search || u.hash) return false;
    return true;
  } catch {
    return false;
  }
}

/** Origins must be scheme+host[+port] with no path, e.g. https://app.example.com */
export function normalizeAllowedOrigins(origins: string[]): string[] | { error: string } {
  if (!origins.length) return { error: "At least one allowedOrigins entry is required" };
  if (origins.length > 10) return { error: "At most 10 allowedOrigins entries" };
  const out: string[] = [];
  for (const raw of origins) {
    const trimmed = raw.trim().replace(/\/$/, "");
    if (!isHttpsOrigin(trimmed)) {
      return { error: `"${raw}" is not a valid origin (use https://host with no path)` };
    }
    out.push(trimmed);
  }
  return out;
}

export async function issueEmbedSession(
  params: IssueEmbedSessionParams
): Promise<{ embedToken: string; embedUrl: string; expiresAt: string } | { error: string; status: 400 | 403 | 404 }> {
  const { env, accountId, docId, signerOrder } = params;
  const origins = normalizeAllowedOrigins(params.allowedOrigins);
  if ("error" in origins) return { error: origins.error, status: 400 };

  if (params.returnUrl) {
    try {
      const u = new URL(params.returnUrl);
      if (u.protocol !== "https:" && u.hostname !== "localhost") {
        return { error: "returnUrl must be https", status: 400 };
      }
    } catch {
      return { error: "returnUrl is not a valid URL", status: 400 };
    }
  }

  const ttl =
    params.ttlSeconds === undefined
      ? DEFAULT_TTL_SECONDS
      : Math.min(Math.max(Math.floor(params.ttlSeconds), 60), MAX_TTL_SECONDS);

  const doc = await getDoc(env, docId);
  if (!doc || doc.accountId !== accountId) {
    return { error: "Document not found", status: 404 };
  }
  if (doc.status !== "pending") {
    return { error: "Document is no longer pending", status: 400 };
  }
  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer || signer.status !== "pending") {
    return { error: "Signer not found or already finished", status: 400 };
  }

  const embedToken = generateOpaqueToken();
  const hash = await hashOpaqueToken(embedToken, env.TOKEN_SECRET);
  const record: EmbedSessionRecord = {
    docId,
    order: signerOrder,
    accountId,
    allowedOrigins: origins,
    returnUrl: params.returnUrl,
    createdAt: new Date().toISOString(),
  };
  await env.DOCRACY_KV.put(`embedsession:${hash}`, JSON.stringify(record), { expirationTtl: ttl });

  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  return {
    embedToken,
    embedUrl: `${env.PUBLIC_APP_URL}/embed/sign/${embedToken}`,
    expiresAt,
  };
}

/**
 * Resolve an embed session and issue a signing token only when `parentOrigin` is on the
 * session allowlist. Client must send the embedding page's origin (e.g. via
 * `X-Embed-Parent-Origin`) — top-level opens with a missing/mismatched origin are rejected.
 */
export async function resolveEmbedSession(
  env: Env,
  embedToken: string,
  parentOrigin: string | null
): Promise<
  | {
      signToken: string;
      docId: string;
      order: number;
      allowedOrigins: string[];
      returnUrl?: string;
    }
  | null
  | { error: "origin"; status: 403 }
> {
  const hash = await hashOpaqueToken(embedToken, env.TOKEN_SECRET);
  const record = await env.DOCRACY_KV.get<EmbedSessionRecord>(`embedsession:${hash}`, "json");
  if (!record) return null;

  const normalizedParent = parentOrigin?.trim().replace(/\/$/, "") || null;
  if (!normalizedParent || !record.allowedOrigins.includes(normalizedParent)) {
    return { error: "origin", status: 403 };
  }

  const doc = await getDoc(env, record.docId);
  if (!doc || doc.accountId !== record.accountId || doc.status !== "pending") return null;
  const signer = doc.signers.find((s) => s.order === record.order);
  if (!signer || signer.status !== "pending") return null;

  const token = await signToken(doc.docId, record.order, env.TOKEN_SECRET, signer.linkNonce);
  return {
    signToken: token,
    docId: doc.docId,
    order: record.order,
    allowedOrigins: record.allowedOrigins,
    returnUrl: record.returnUrl,
  };
}

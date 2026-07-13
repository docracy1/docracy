import { hashOpaqueToken } from "@docracy/shared";
import type { ConnectorEnv as Env } from "./types";

/** Bearer header (standard) or `?token=` query param — Claude's "add custom connector" UI only
 *  takes a URL with no separate auth-header field, so the dashboard's copy-paste URL embeds the
 *  token as a query param. Support both rather than force one integration path. */
export function extractApiToken(request: Request): string | null {
  const bearer = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (bearer) return bearer;
  return new URL(request.url).searchParams.get("token");
}

/**
 * Absent or unrecognized token → null, which just means "free tier," never an error — so
 * check_status stays reachable by anyone regardless of what ends up in the token slot.
 */
export async function resolvePaidAccountId(request: Request, env: Env): Promise<string | null> {
  const token = extractApiToken(request);
  if (!token) return null;
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const record = await env.DOCRACY_KV.get<{ accountId: string }>(`apitoken:${hash}`, "json");
  return record?.accountId ?? null;
}

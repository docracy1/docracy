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
 *
 * The token existing in KV is normally enough on its own — the worker deletes it outright the
 * moment an account stops being paid (see lib/billing.ts's markAccountPaid). This D1 is_paid
 * check is a second, independent line of defense: if a token somehow survived a cancellation or
 * refund it shouldn't have, this still refuses paid tools rather than trusting the token alone.
 */
export async function resolvePaidAccountId(request: Request, env: Env): Promise<string | null> {
  const token = extractApiToken(request);
  if (!token) return null;
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const record = await env.DOCRACY_KV.get<{ accountId: string }>(`apitoken:${hash}`, "json");
  if (!record) return null;

  if (env.DOCRACY_DB) {
    const row = await env.DOCRACY_DB.prepare(`SELECT is_paid FROM accounts WHERE id = ?`)
      .bind(record.accountId)
      .first<{ is_paid: number }>();
    if (!row?.is_paid) return null;
  }

  return record.accountId;
}

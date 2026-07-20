import type { MiddlewareHandler } from "hono";
import { hashOpaqueToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

export interface ApiTokenAccount {
  /** Same id used everywhere else for workspace-scoped data — issueApiToken (account.ts) only
   *  ever issues a token against account.workspaceId, so this is already the workspace root, not
   *  necessarily whichever team member happened to regenerate it. */
  workspaceId: string;
  email: string;
}

/** Bearer header (standard) or `?token=` query param — same dual support as the MCP connector's
 *  tokenAuth.ts, since Zapier's auth step is just another Bearer-token API client. */
export function extractApiToken(request: Request): string | null {
  const bearer = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (bearer) return bearer;
  return new URL(request.url).searchParams.get("token");
}

/**
 * Resolves the same `dk_...` token issued for the MCP connector (Dashboard's "Generate"/
 * "Regenerate") to a workspace + email — this is deliberately the *same* token/issuance system,
 * not a parallel one, so a Zapier connection and an AI assistant connection share one "Active" /
 * "Regenerate invalidates both" story instead of two separate credentials to manage.
 */
export async function resolveAccountByApiToken(env: Env, request: Request): Promise<ApiTokenAccount | null> {
  const token = extractApiToken(request);
  if (!token) return null;
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const record = await env.DOCRACY_KV.get<{ accountId: string }>(`apitoken:${hash}`, "json");
  if (!record) return null;
  if (!env.DOCRACY_DB) return null;

  const row = await env.DOCRACY_DB.prepare(`SELECT email, is_paid FROM accounts WHERE id = ?`)
    .bind(record.accountId)
    .first<{ email: string; is_paid: number }>();
  // Same defense-in-depth as the connector: the token is deleted the moment an account stops
  // being paid, but this is a second, independent check in case one somehow survived that.
  if (!row?.is_paid) return null;

  return { workspaceId: record.accountId, email: row.email };
}

type ApiTokenVariables = { apiAccount: ApiTokenAccount };
type ApiTokenEnv = { Bindings: Env; Variables: ApiTokenVariables };

export const requireApiTokenAccount: MiddlewareHandler<ApiTokenEnv> = async (c, next) => {
  const account = await resolveAccountByApiToken(c.env, c.req.raw);
  if (!account) return c.json({ error: "Invalid or missing API token" }, 401);
  c.set("apiAccount", account);
  await next();
};

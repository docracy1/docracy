import { generateOpaqueToken, hashOpaqueToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

const TOKEN_PREFIX = "dk_";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Issues a fresh long-lived API token for a paid account's MCP connector access, invalidating
 * any previous one first — `UNIQUE(account_id)` on `api_tokens` makes "one active token per
 * account" a DB invariant, and this delete-then-insert is what enforces it. Returns the raw
 * token exactly once; only its hash is ever stored (same convention as magic_links/sessions).
 * No KV TTL — unlike sessions/magic-links, this token is meant to be long-lived.
 */
export async function issueApiToken(env: Env, accountId: string): Promise<string> {
  const db = env.DOCRACY_DB!;
  const token = `${TOKEN_PREFIX}${generateOpaqueToken()}`;
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);

  const existing = await db
    .prepare(`SELECT token_hash FROM api_tokens WHERE account_id = ?`)
    .bind(accountId)
    .first<{ token_hash: string }>();
  if (existing) {
    await env.DOCRACY_KV.delete(`apitoken:${existing.token_hash}`);
    await db.prepare(`DELETE FROM api_tokens WHERE account_id = ?`).bind(accountId).run();
  }

  await db
    .prepare(`INSERT INTO api_tokens (token_hash, account_id, created_at) VALUES (?, ?, ?)`)
    .bind(hash, accountId, nowIso())
    .run();
  await env.DOCRACY_KV.put(`apitoken:${hash}`, JSON.stringify({ accountId }));

  return token;
}

/** Whether this account currently has an active API token — lets the dashboard show a masked
 *  status ("Active" / "None yet") without ever re-exposing the raw token after issuance. */
export async function hasApiToken(env: Env, accountId: string): Promise<boolean> {
  if (!env.DOCRACY_DB) return false;
  const row = await env.DOCRACY_DB.prepare(`SELECT 1 FROM api_tokens WHERE account_id = ?`).bind(accountId).first();
  return !!row;
}

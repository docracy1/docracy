import type { Env } from "@docracy/shared";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_LOGO_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function logoR2Key(workspaceId: string): string {
  return `branding/${workspaceId}/logo`;
}

/** The path (not a full URL) to a workspace's public logo route — the caller decides how to make
 *  it absolute: the web app prepends its own API base (same convention as every other endpoint in
 *  apps/web/src/lib/api.ts), while outbound emails need a real absolute URL (see email.ts). */
export function logoPath(workspaceId: string): string {
  return `/api/branding/${workspaceId}/logo`;
}

/** Branding only ever belongs to a paid workspace — every caller has already gone through
 *  requirePaidAccount, so a missing D1 binding here means the deployment simply hasn't been
 *  configured for it yet, not a real runtime state to recover from. */
function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

export async function uploadLogo(env: Env, workspaceId: string, bytes: Uint8Array, contentType: string): Promise<void> {
  const db = requireDb(env);
  const key = logoR2Key(workspaceId);
  await env.DOCRACY_DOCS.put(key, bytes, { httpMetadata: { contentType } });
  await db.prepare(`UPDATE accounts SET logo_r2_key = ? WHERE id = ?`).bind(key, workspaceId).run();
}

export async function deleteLogo(env: Env, workspaceId: string): Promise<void> {
  const db = requireDb(env);
  await env.DOCRACY_DOCS.delete(logoR2Key(workspaceId));
  await db.prepare(`UPDATE accounts SET logo_r2_key = NULL WHERE id = ?`).bind(workspaceId).run();
}

export async function hasCustomLogo(env: Env, workspaceId: string): Promise<boolean> {
  if (!env.DOCRACY_DB) return false;
  const row = await env.DOCRACY_DB.prepare(`SELECT logo_r2_key FROM accounts WHERE id = ?`)
    .bind(workspaceId)
    .first<{ logo_r2_key: string | null }>();
  return !!row?.logo_r2_key;
}

/** Fetches the raw logo bytes for the public-serving route — keyed deterministically off
 *  workspaceId rather than trusting the stored logo_r2_key column, so a stale/cleared column
 *  can't serve the wrong object and a freshly-uploaded one is always found. */
export async function getLogoObject(env: Env, workspaceId: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const obj = await env.DOCRACY_DOCS.get(logoR2Key(workspaceId));
  if (!obj) return null;
  const bytes = new Uint8Array(await obj.arrayBuffer());
  return { bytes, contentType: obj.httpMetadata?.contentType ?? "application/octet-stream" };
}

/** Absolute URL to embed a workspace's custom logo in an outbound email, or null if it has none
 *  (or the document is anonymous — accountId null). Emails need a real absolute URL reachable
 *  from any mail client, unlike the web app's own use of logoPath (which it makes absolute
 *  against whichever environment's API base it's already configured with). */
export async function resolveEmailLogoUrl(env: Env, accountId: string | null): Promise<string | null> {
  if (!accountId || !env.PUBLIC_WORKER_URL) return null;
  const has = await hasCustomLogo(env, accountId);
  return has ? `${env.PUBLIC_WORKER_URL}${logoPath(accountId)}` : null;
}

import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { generateOpaqueToken, hashOpaqueToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";
import { sendMagicLink } from "./email";
import { checkMagicLinkRateLimit } from "./ratelimit";

const MAGIC_LINK_TTL_SECONDS = 15 * 60; // 15 minutes
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const PAID_STATUS_REFRESH_SECONDS = 5 * 60; // 5 minutes — bounds D1 read volume; the only
// observable effect of D1 replication lag after a billing webhook fires is "still shows unpaid
// for up to 5 more minutes," never a false-positive paid state.

export const SESSION_COOKIE_NAME = "docracy_session";

interface MagicLinkRecord {
  email: string;
  createdAt: string;
}

interface SessionRecord {
  accountId: string;
  email: string;
  isPaid: boolean;
  /** The account whose documents/templates/webhooks this session sees — its own id, unless it's a
   *  team member, in which case this is the workspace owner's account id. Optional so sessions
   *  created before team accounts existed are treated as stale and get backfilled on next resolve
   *  (see resolveAccount below), with zero changes needed to createSession's own signature/tests. */
  workspaceId?: string;
  isPaidCachedAt: string;
}

export interface AccountContext {
  id: string;
  email: string;
  isPaid: boolean;
  /** Own id unless a team member, in which case the workspace owner's account id — every
   *  account-scoped D1 query (documents, templates, webhooks) should key off this, not `id`. */
  workspaceId: string;
}

type Ctx = { waitUntil(promise: Promise<unknown>): void };

function nowIso(): string {
  return new Date().toISOString();
}

/** Session cookie is the only auth surface this app has — same attributes belong on every
 *  Set-Cookie / delete-cookie call, so route handlers pull this instead of repeating literals. */
export function sessionCookieOptions(env: Env) {
  const isHttps = env.PUBLIC_APP_URL.startsWith("https");
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? "None" : "Lax") as "None" | "Lax",
    path: "/",
  };
}

/**
 * Rate-limited (per-email), sends a single-use 15-minute link. Requires DOCRACY_DB — accounts
 * are the one place D1 genuinely is the source of truth (unlike documents), so there's nothing
 * useful to do without it.
 */
export async function requestMagicLink(
  env: Env,
  ctx: Ctx,
  email: string,
  ip: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!env.DOCRACY_DB) {
    return { ok: false, error: "Accounts aren't set up on this deployment yet." };
  }
  const normalizedEmail = email.toLowerCase();
  if (!(await checkMagicLinkRateLimit(env, normalizedEmail))) {
    return { ok: false, error: "Too many sign-in requests for this email. Please try again later." };
  }

  const token = generateOpaqueToken();
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_SECONDS * 1000).toISOString();

  const record: MagicLinkRecord = { email: normalizedEmail, createdAt: now };
  await env.DOCRACY_KV.put(`magiclink:${hash}`, JSON.stringify(record), { expirationTtl: MAGIC_LINK_TTL_SECONDS });

  ctx.waitUntil(
    env.DOCRACY_DB.prepare(
      `INSERT INTO magic_links (token_hash, email, created_at, expires_at, requested_ip) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(hash, normalizedEmail, now, expiresAt, ip)
      .run()
      .catch((err) => console.error("Auth D1 audit (magic_link requested) failed (non-fatal):", err))
  );

  const link = `${env.PUBLIC_APP_URL}/auth/verify?token=${token}`;
  await sendMagicLink(env, normalizedEmail, link);

  return { ok: true };
}

async function findOrCreateAccount(env: Env, ctx: Ctx, email: string): Promise<{ id: string; isPaid: boolean }> {
  const db = env.DOCRACY_DB!;
  const existing = await db
    .prepare(`SELECT id, is_paid FROM accounts WHERE email = ?`)
    .bind(email)
    .first<{ id: string; is_paid: number }>();

  if (existing) {
    ctx.waitUntil(
      db
        .prepare(`UPDATE accounts SET last_login_at = ? WHERE id = ?`)
        .bind(nowIso(), existing.id)
        .run()
        .catch((err) => console.error("Auth D1 audit (last_login_at) failed (non-fatal):", err))
    );
    return { id: existing.id, isPaid: !!existing.is_paid };
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  await db
    .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, last_login_at) VALUES (?, ?, ?, 0, ?)`)
    .bind(id, email, now, now)
    .run();
  return { id, isPaid: false };
}

/**
 * Single-use, single-attempt: the KV get+delete isn't atomic (same soft race already accepted in
 * ratelimit.ts), but a double-redemption race only grants what one valid click already would —
 * no privilege escalation, just an unlikely extra session.
 */
export async function consumeMagicLink(
  env: Env,
  ctx: Ctx,
  token: string,
  ip: string | null,
  userAgent: string | null
): Promise<{ ok: true; sessionToken: string } | { ok: false; error: string }> {
  if (!env.DOCRACY_DB) {
    return { ok: false, error: "Accounts aren't set up on this deployment yet." };
  }

  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const record = await env.DOCRACY_KV.get<MagicLinkRecord>(`magiclink:${hash}`, "json");
  if (!record) {
    return { ok: false, error: "This sign-in link is invalid or has expired." };
  }
  await env.DOCRACY_KV.delete(`magiclink:${hash}`);

  ctx.waitUntil(
    env.DOCRACY_DB.prepare(`UPDATE magic_links SET consumed_at = ? WHERE token_hash = ?`)
      .bind(nowIso(), hash)
      .run()
      .catch((err) => console.error("Auth D1 audit (magic_link consumed) failed (non-fatal):", err))
  );

  const account = await findOrCreateAccount(env, ctx, record.email);
  const sessionToken = await createSession(env, ctx, account.id, record.email, account.isPaid, ip, userAgent);
  return { ok: true, sessionToken };
}

export async function createSession(
  env: Env,
  ctx: Ctx,
  accountId: string,
  email: string,
  isPaid: boolean,
  ip: string | null,
  userAgent: string | null
): Promise<string> {
  const token = generateOpaqueToken();
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const now = nowIso();
  // workspaceId is deliberately left unset here — resolveAccount treats a missing workspaceId as
  // stale and resolves/caches it (and the workspace-derived isPaid) on the very next call, so
  // login flows never need to know about team membership themselves.
  const record: SessionRecord = { accountId, email, isPaid, isPaidCachedAt: now };
  await env.DOCRACY_KV.put(`session:${hash}`, JSON.stringify(record), { expirationTtl: SESSION_TTL_SECONDS });

  if (env.DOCRACY_DB) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
    ctx.waitUntil(
      env.DOCRACY_DB.prepare(
        `INSERT INTO sessions (token_hash, account_id, created_at, expires_at, last_seen_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(hash, accountId, now, expiresAt, now, userAgent, ip)
        .run()
        .catch((err) => console.error("Auth D1 audit (session created) failed (non-fatal):", err))
    );
  }

  return token;
}

/** owner_account_id if this account is a team member, else the account's own id — and the
 *  resulting workspace's own is_paid, which is what a member's session should reflect (a member's
 *  own accounts.is_paid row stays 0 forever; paid status lives on the workspace owner). Returns
 *  null (refresh a no-op) if the workspace account row doesn't exist, mirroring the original
 *  isPaid-refresh's own "only overwrite if the row was found" guard. */
async function resolveWorkspace(env: Env, accountId: string): Promise<{ workspaceId: string; isPaid: boolean } | null> {
  const db = env.DOCRACY_DB!;
  const membership = await db
    .prepare(`SELECT owner_account_id FROM team_members WHERE member_account_id = ?`)
    .bind(accountId)
    .first<{ owner_account_id: string }>();
  const workspaceId = membership?.owner_account_id ?? accountId;
  const row = await db.prepare(`SELECT is_paid FROM accounts WHERE id = ?`).bind(workspaceId).first<{ is_paid: number }>();
  if (!row) return null;
  return { workspaceId, isPaid: !!row.is_paid };
}

/**
 * Resolves a session cookie to an account, refreshing the cached `isPaid`/`workspaceId` from D1
 * (the actual source of truth for both) once stale — or, for a session created before team
 * accounts existed, immediately (a missing workspaceId always counts as stale). KV is read on
 * every call and is the only thing that can 401 a request — D1 is never read on this hot path
 * except for this bounded refresh.
 */
export async function resolveAccount(env: Env, sessionToken: string | undefined): Promise<AccountContext | null> {
  if (!sessionToken) return null;
  const hash = await hashOpaqueToken(sessionToken, env.TOKEN_SECRET);
  const record = await env.DOCRACY_KV.get<SessionRecord>(`session:${hash}`, "json");
  if (!record) return null;

  let isPaid = record.isPaid;
  let workspaceId = record.workspaceId ?? record.accountId;
  const cacheAgeMs = Date.now() - new Date(record.isPaidCachedAt).getTime();
  if (env.DOCRACY_DB && (!record.workspaceId || cacheAgeMs > PAID_STATUS_REFRESH_SECONDS * 1000)) {
    const resolved = await resolveWorkspace(env, record.accountId);
    if (resolved) {
      isPaid = resolved.isPaid;
      workspaceId = resolved.workspaceId;
      const refreshed: SessionRecord = { ...record, isPaid, workspaceId, isPaidCachedAt: nowIso() };
      await env.DOCRACY_KV.put(`session:${hash}`, JSON.stringify(refreshed), { expirationTtl: SESSION_TTL_SECONDS });
    }
  }

  return { id: record.accountId, email: record.email, isPaid, workspaceId };
}

type AuthVariables = { account: AccountContext | null };
type AuthEnv = { Bindings: Env; Variables: AuthVariables };

/** Never blocks the request — always calls next(), just makes `c.get("account")` available
 *  (null when signed out). This is what routes/documents.ts uses so the anonymous flow is
 *  completely unaffected by whether a session cookie happens to be present. */
export const optionalAccount: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const account = await resolveAccount(c.env, getCookie(c, SESSION_COOKIE_NAME));
  c.set("account", account);
  await next();
};

export const requireAccount: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const account = await resolveAccount(c.env, getCookie(c, SESSION_COOKIE_NAME));
  if (!account) return c.json({ error: "Sign in required" }, 401);
  c.set("account", account);
  await next();
};

export const requirePaidAccount: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const account = await resolveAccount(c.env, getCookie(c, SESSION_COOKIE_NAME));
  if (!account) return c.json({ error: "Sign in required" }, 401);
  if (!account.isPaid) return c.json({ error: "This requires a paid account" }, 402);
  c.set("account", account);
  await next();
};

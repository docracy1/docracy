import { generateOpaqueToken, hashOpaqueToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";
import { createSession } from "./auth";
import { sendTeamInvite } from "./email";

const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface TeamMemberSummary {
  accountId: string;
  email: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface PendingInviteSummary {
  id: string;
  email: string;
  expiresAt: string;
}

interface TeamInviteRow {
  id: string;
  owner_account_id: string;
  email: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

type Ctx = { waitUntil(promise: Promise<unknown>): void };

/** Team accounts only ever belong to a paid workspace — every caller has already gone through
 *  requirePaidAccount, so a missing D1 binding here means the deployment simply hasn't been
 *  configured for it yet, not a real runtime state to recover from. */
function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

export async function inviteTeamMember(
  env: Env,
  ownerAccountId: string,
  ownerEmail: string,
  inviteeEmail: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = requireDb(env);
  const normalizedEmail = inviteeEmail.trim().toLowerCase();

  if (normalizedEmail === ownerEmail.toLowerCase()) {
    return { ok: false, error: "You can't invite yourself." };
  }

  const existingAccount = await db
    .prepare(`SELECT id FROM accounts WHERE email = ?`)
    .bind(normalizedEmail)
    .first<{ id: string }>();
  if (existingAccount) {
    // Single-level workspaces only: block anyone who's already a member of any workspace
    // (including this one) or who already owns members of their own — nesting or re-parenting a
    // workspace would make "whose documents does this account see" ambiguous.
    const alreadyMember = await db
      .prepare(`SELECT 1 FROM team_members WHERE member_account_id = ?`)
      .bind(existingAccount.id)
      .first();
    if (alreadyMember) return { ok: false, error: "That person already belongs to a workspace." };
    const ownsMembers = await db
      .prepare(`SELECT 1 FROM team_members WHERE owner_account_id = ?`)
      .bind(existingAccount.id)
      .first();
    if (ownsMembers) return { ok: false, error: "That person already owns their own workspace." };
  }

  const token = generateOpaqueToken();
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + INVITE_TTL_SECONDS * 1000).toISOString();

  await db
    .prepare(
      `INSERT INTO team_invites (id, owner_account_id, email, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), ownerAccountId, normalizedEmail, hash, now, expiresAt)
    .run();

  const link = `${env.PUBLIC_APP_URL}/team/accept?token=${token}`;
  await sendTeamInvite(env, normalizedEmail, ownerEmail, link);
  return { ok: true };
}

export async function listTeamMembers(env: Env, workspaceId: string): Promise<TeamMemberSummary[]> {
  const db = requireDb(env);
  const owner = await db
    .prepare(`SELECT id, email, created_at FROM accounts WHERE id = ?`)
    .bind(workspaceId)
    .first<{ id: string; email: string; created_at: string }>();
  const membersResult = await db
    .prepare(
      `SELECT a.id, a.email, tm.joined_at FROM team_members tm JOIN accounts a ON a.id = tm.member_account_id
       WHERE tm.owner_account_id = ? ORDER BY tm.joined_at ASC`
    )
    .bind(workspaceId)
    .all<{ id: string; email: string; joined_at: string }>();

  const members: TeamMemberSummary[] = [];
  if (owner) members.push({ accountId: owner.id, email: owner.email, role: "owner", joinedAt: owner.created_at });
  members.push(
    ...membersResult.results.map((r) => ({ accountId: r.id, email: r.email, role: "member" as const, joinedAt: r.joined_at }))
  );
  return members;
}

export async function listPendingInvites(env: Env, ownerAccountId: string): Promise<PendingInviteSummary[]> {
  const db = requireDb(env);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `SELECT id, email, expires_at FROM team_invites WHERE owner_account_id = ? AND accepted_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC`
    )
    .bind(ownerAccountId, now)
    .all<{ id: string; email: string; expires_at: string }>();
  return result.results.map((r) => ({ id: r.id, email: r.email, expiresAt: r.expires_at }));
}

export async function cancelTeamInvite(env: Env, ownerAccountId: string, inviteId: string): Promise<boolean> {
  const db = requireDb(env);
  const row = await db.prepare(`SELECT id FROM team_invites WHERE id = ? AND owner_account_id = ?`).bind(inviteId, ownerAccountId).first();
  if (!row) return false;
  await db.prepare(`DELETE FROM team_invites WHERE id = ?`).bind(inviteId).run();
  return true;
}

export async function removeTeamMember(env: Env, ownerAccountId: string, memberAccountId: string): Promise<boolean> {
  const db = requireDb(env);
  const row = await db
    .prepare(`SELECT id FROM team_members WHERE owner_account_id = ? AND member_account_id = ?`)
    .bind(ownerAccountId, memberAccountId)
    .first();
  if (!row) return false;
  await db.prepare(`DELETE FROM team_members WHERE owner_account_id = ? AND member_account_id = ?`).bind(ownerAccountId, memberAccountId).run();
  return true;
}

/**
 * Single-use, single-attempt (same posture as consumeMagicLink) — finds or creates an account for
 * the invited email, links it into the owner's workspace, and logs it straight in. isPaid is
 * passed as false here regardless of the owner's plan: resolveAccount's own refresh (a session
 * with no cached workspaceId always counts as stale) picks up the owner's real paid status on the
 * very next request, so this function doesn't need to know or care about billing at all.
 */
export async function acceptTeamInvite(
  env: Env,
  ctx: Ctx,
  token: string,
  ip: string | null,
  userAgent: string | null
): Promise<{ ok: true; sessionToken: string } | { ok: false; error: string }> {
  const db = requireDb(env);
  const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
  const invite = await db.prepare(`SELECT * FROM team_invites WHERE token_hash = ?`).bind(hash).first<TeamInviteRow>();
  if (!invite) {
    return { ok: false, error: "This invite is invalid or has expired." };
  }
  if (invite.accepted_at) {
    return { ok: false, error: "This invite has already been used." };
  }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This invite has expired." };
  }

  let account = await db.prepare(`SELECT id FROM accounts WHERE email = ?`).bind(invite.email).first<{ id: string }>();
  let accountId: string;
  const now = new Date().toISOString();
  if (account) {
    accountId = account.id;
  } else {
    accountId = crypto.randomUUID();
    await db
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, last_login_at) VALUES (?, ?, ?, 0, ?)`)
      .bind(accountId, invite.email, now, now)
      .run();
  }

  // Re-check at accept time in case workspace membership changed since the invite was sent.
  const alreadyMember = await db.prepare(`SELECT 1 FROM team_members WHERE member_account_id = ?`).bind(accountId).first();
  if (!alreadyMember) {
    await db
      .prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), invite.owner_account_id, accountId, now)
      .run();
  }

  await db.prepare(`UPDATE team_invites SET accepted_at = ? WHERE id = ?`).bind(now, invite.id).run();

  const sessionToken = await createSession(env, ctx, accountId, invite.email, false, ip, userAgent);
  return { ok: true, sessionToken };
}

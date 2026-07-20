import { describe, it, expect, vi } from "vitest";
import {
  acceptTeamInvite,
  cancelTeamInvite,
  inviteTeamMember,
  listPendingInvites,
  listTeamMembers,
  removeTeamMember,
} from "./team";
import { makeMockEnv } from "../test/mockEnv";

function makeCtx() {
  const promises: Promise<unknown>[] = [];
  return {
    waitUntil: (p: Promise<unknown>) => {
      promises.push(p);
    },
    flush: () => Promise.all(promises),
  };
}

async function seedAccount(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], id: string, email: string, isPaid = true) {
  await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, ?)`)
    .bind(id, email, new Date().toISOString(), isPaid ? 1 : 0)
    .run();
}

/** Sends a team invite and scrapes the raw token out of the dev-mode console log (no
 *  RESEND_API_KEY in the mock env) — same technique as auth.test.ts's captureMagicLinkToken,
 *  since inviteTeamMember only emails the token, never returns it. */
async function inviteAndCaptureToken(
  env: Awaited<ReturnType<typeof makeMockEnv>>["env"],
  ownerAccountId: string,
  ownerEmail: string,
  inviteeEmail: string
): Promise<string> {
  let capturedToken = "";
  const spy = vi.spyOn(console, "log").mockImplementation((msg: string) => {
    const match = msg.match(/token=([^\s&"]+)/);
    if (match) capturedToken = match[1];
  });
  const result = await inviteTeamMember(env, ownerAccountId, ownerEmail, inviteeEmail);
  spy.mockRestore();
  if (!result.ok) throw new Error(`inviteTeamMember failed: ${result.error}`);
  if (!capturedToken) throw new Error("failed to capture team invite token from dev email log");
  return capturedToken;
}

describe("inviteTeamMember", () => {
  it("creates an invite for a brand-new email", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");

    const result = await inviteTeamMember(env, "owner-1", "owner@example.com", "new@example.com");
    expect(result).toEqual({ ok: true });

    const row = await d1.prepare(`SELECT * FROM team_invites WHERE owner_account_id = ?`).bind("owner-1").first();
    expect(row).toMatchObject({ email: "new@example.com", accepted_at: null });
  });

  it("rejects inviting yourself", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");
    const result = await inviteTeamMember(env, "owner-1", "owner@example.com", "OWNER@example.com");
    expect(result).toEqual({ ok: false, error: "You can't invite yourself." });
  });

  it("rejects inviting someone who already belongs to a workspace", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");
    await seedAccount(env, "owner-2", "owner2@example.com");
    await seedAccount(env, "existing-member", "member@example.com");
    await d1
      .prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
      .bind("tm-1", "owner-2", "existing-member", new Date().toISOString())
      .run();

    const result = await inviteTeamMember(env, "owner-1", "owner@example.com", "member@example.com");
    expect(result).toEqual({ ok: false, error: "That person already belongs to a workspace." });
  });

  it("rejects inviting someone who already owns their own workspace", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");
    await seedAccount(env, "other-owner", "otherowner@example.com");
    await seedAccount(env, "their-member", "theirmember@example.com");
    await d1
      .prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
      .bind("tm-1", "other-owner", "their-member", new Date().toISOString())
      .run();

    const result = await inviteTeamMember(env, "owner-1", "owner@example.com", "otherowner@example.com");
    expect(result).toEqual({ ok: false, error: "That person already owns their own workspace." });
  });
});

describe("listTeamMembers / listPendingInvites / cancelTeamInvite", () => {
  it("lists the owner first, then members in join order", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");
    await seedAccount(env, "member-1", "member1@example.com", false);
    await seedAccount(env, "member-2", "member2@example.com", false);
    await d1
      .prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
      .bind("tm-1", "owner-1", "member-1", "2026-01-01T00:00:00.000Z")
      .run();
    await d1
      .prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
      .bind("tm-2", "owner-1", "member-2", "2026-01-02T00:00:00.000Z")
      .run();

    const members = await listTeamMembers(env, "owner-1");
    expect(members.map((m) => ({ accountId: m.accountId, role: m.role }))).toEqual([
      { accountId: "owner-1", role: "owner" },
      { accountId: "member-1", role: "member" },
      { accountId: "member-2", role: "member" },
    ]);
  });

  it("lists pending (unaccepted) invites and lets the owner cancel one", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");
    await inviteTeamMember(env, "owner-1", "owner@example.com", "invitee@example.com");

    const pending = await listPendingInvites(env, "owner-1");
    expect(pending).toHaveLength(1);
    expect(pending[0].email).toBe("invitee@example.com");

    expect(await cancelTeamInvite(env, "owner-1", pending[0].id)).toBe(true);
    expect(await listPendingInvites(env, "owner-1")).toEqual([]);
  });

  it("does not let another account cancel someone else's invite", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");
    await inviteTeamMember(env, "owner-1", "owner@example.com", "invitee@example.com");
    const [pending] = await listPendingInvites(env, "owner-1");

    expect(await cancelTeamInvite(env, "someone-else", pending.id)).toBe(false);
  });
});

describe("removeTeamMember", () => {
  it("removes a member and reports false for a nonexistent one", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(env, "owner-1", "owner@example.com");
    await seedAccount(env, "member-1", "member1@example.com", false);
    await d1
      .prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
      .bind("tm-1", "owner-1", "member-1", new Date().toISOString())
      .run();

    expect(await removeTeamMember(env, "owner-1", "member-1")).toBe(true);
    expect(await listTeamMembers(env, "owner-1")).toHaveLength(1); // just the owner now
    expect(await removeTeamMember(env, "owner-1", "member-1")).toBe(false);
  });
});

describe("acceptTeamInvite", () => {
  it("creates a new account for the invited email, links it into the workspace, and issues a session", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    await seedAccount(env, "owner-1", "owner@example.com");
    const token = await inviteAndCaptureToken(env, "owner-1", "owner@example.com", "invitee@example.com");

    const result = await acceptTeamInvite(env, ctx, token, "9.9.9.9", "test-agent");
    expect(result.ok).toBe(true);

    const account = (await d1.prepare(`SELECT id FROM accounts WHERE email = ?`).bind("invitee@example.com").first()) as {
      id: string;
    } | null;
    expect(account).toBeTruthy();
    const membership = (await d1
      .prepare(`SELECT owner_account_id FROM team_members WHERE member_account_id = ?`)
      .bind(account!.id)
      .first()) as { owner_account_id: string } | null;
    expect(membership?.owner_account_id).toBe("owner-1");

    const invite = (await d1.prepare(`SELECT accepted_at FROM team_invites WHERE owner_account_id = ?`).bind("owner-1").first()) as {
      accepted_at: string | null;
    } | null;
    expect(invite?.accepted_at).toBeTruthy();
  });

  it("links into the workspace an existing account created after the invite was sent", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    await seedAccount(env, "owner-1", "owner@example.com");
    const token = await inviteAndCaptureToken(env, "owner-1", "owner@example.com", "existing@example.com");
    // The invitee already has an account by the time they click accept (e.g. they'd used the free
    // tier under that email before).
    await seedAccount(env, "existing-acct", "existing@example.com", false);

    const result = await acceptTeamInvite(env, ctx, token, null, null);
    expect(result.ok).toBe(true);

    const membership = (await d1
      .prepare(`SELECT owner_account_id FROM team_members WHERE member_account_id = ?`)
      .bind("existing-acct")
      .first()) as { owner_account_id: string } | null;
    expect(membership?.owner_account_id).toBe("owner-1");
  });

  it("rejects an unknown token", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const result = await acceptTeamInvite(env, ctx, "not-a-real-token", null, null);
    expect(result).toEqual({ ok: false, error: "This invite is invalid or has expired." });
  });

  it("rejects an already-accepted invite", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    await seedAccount(env, "owner-1", "owner@example.com");
    const token = await inviteAndCaptureToken(env, "owner-1", "owner@example.com", "invitee@example.com");
    await acceptTeamInvite(env, ctx, token, null, null);

    const second = await acceptTeamInvite(env, ctx, token, null, null);
    expect(second).toEqual({ ok: false, error: "This invite has already been used." });
  });

  it("rejects an expired invite", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    await seedAccount(env, "owner-1", "owner@example.com");
    const token = await inviteAndCaptureToken(env, "owner-1", "owner@example.com", "invitee@example.com");
    await d1
      .prepare(`UPDATE team_invites SET expires_at = ? WHERE owner_account_id = ?`)
      .bind(new Date(Date.now() - 1000).toISOString(), "owner-1")
      .run();

    const result = await acceptTeamInvite(env, ctx, token, null, null);
    expect(result).toEqual({ ok: false, error: "This invite has expired." });
  });
});

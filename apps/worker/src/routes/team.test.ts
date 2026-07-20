import { describe, it, expect, vi } from "vitest";
import team from "./team";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function makeCtx() {
  const promises: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => {
      promises.push(p);
    },
    passThroughOnException: () => {},
    flush: () => Promise.all(promises),
  };
  return ctx as unknown as ExecutionContext & { flush: () => Promise<unknown[]> };
}

async function seedAccount(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], id: string, email: string, isPaid: boolean) {
  await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, ?)`)
    .bind(id, email, new Date().toISOString(), isPaid ? 1 : 0)
    .run();
}

async function ownerSession(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], ctx: ReturnType<typeof makeCtx>) {
  await seedAccount(env, "owner-1", "owner@example.com", true);
  return createSession(env, ctx, "owner-1", "owner@example.com", true, null, null);
}

async function memberSession(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], ctx: ReturnType<typeof makeCtx>) {
  await seedAccount(env, "owner-1", "owner@example.com", true);
  await seedAccount(env, "member-1", "member@example.com", false);
  await env
    .DOCRACY_DB!.prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
    .bind("tm-1", "owner-1", "member-1", new Date().toISOString())
    .run();
  return createSession(env, ctx, "member-1", "member@example.com", false, null, null);
}

describe("POST /api/account/team/invite", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await team.request(
      "/invite",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "x@example.com" }) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    await seedAccount(env, "acct-1", "unpaid@example.com", false);
    const token = await createSession(env, ctx, "acct-1", "unpaid@example.com", false, null, null);
    const res = await team.request(
      "/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ email: "x@example.com" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("creates an invite for a paid owner", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await ownerSession(env, ctx);
    const res = await team.request(
      "/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ email: "invitee@example.com" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);
  });

  it("403s a team member trying to invite further", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await memberSession(env, ctx);
    const res = await team.request(
      "/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ email: "x@example.com" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(403);
  });

  it("rejects an invalid email", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await ownerSession(env, ctx);
    const res = await team.request(
      "/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ email: "not-an-email" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/account/team", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await team.request("/", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("returns the owner as a member, and shows a pending invite", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await ownerSession(env, ctx);
    await team.request(
      "/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ email: "invitee@example.com" }),
      },
      env,
      ctx
    );

    const res = await team.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    const body: { members: Array<{ role: string }>; pendingInvites: Array<{ email: string }> } = await res.json();
    expect(body.members).toEqual([expect.objectContaining({ role: "owner" })]);
    expect(body.pendingInvites.map((i) => i.email)).toEqual(["invitee@example.com"]);
  });

  it("shows a member the same workspace, and hides pending invites from them", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await memberSession(env, ctx);

    const res = await team.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    const body: { members: Array<{ accountId: string; role: string }>; pendingInvites: unknown[] } = await res.json();
    expect(body.members.map((m) => m.accountId).sort()).toEqual(["member-1", "owner-1"]);
    expect(body.pendingInvites).toEqual([]);
  });
});

describe("DELETE /api/account/team/invites/:id", () => {
  it("lets the owner cancel their own pending invite", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await ownerSession(env, ctx);
    await team.request(
      "/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ email: "invitee@example.com" }),
      },
      env,
      ctx
    );
    const listRes = await team.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    const { pendingInvites }: { pendingInvites: Array<{ id: string }> } = await listRes.json();

    const deleteRes = await team.request(
      `/invites/${pendingInvites[0].id}`,
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(deleteRes.status).toBe(200);
  });

  it("403s a team member trying to cancel an invite", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await memberSession(env, ctx);
    const res = await team.request(
      "/invites/some-id",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/account/team/:memberAccountId", () => {
  it("lets the owner remove a member", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await memberSession(env, ctx); // seeds owner-1 + member-1 + the team_members row
    const ownerToken = await createSession(env, ctx, "owner-1", "owner@example.com", true, null, null);
    void token;

    const res = await team.request(
      "/member-1",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${ownerToken}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
  });

  it("blocks the owner from removing themselves", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await ownerSession(env, ctx);
    const res = await team.request(
      "/owner-1",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("403s a team member trying to remove someone", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await memberSession(env, ctx);
    const res = await team.request(
      "/owner-1",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(403);
  });

  it("404s for a nonexistent member", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await ownerSession(env, ctx);
    const res = await team.request(
      "/no-such-member",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/account/team/accept", () => {
  it("sets a session cookie for a valid invite token", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const ownerToken = await ownerSession(env, ctx);

    let capturedToken = "";
    const spy = vi.spyOn(console, "log").mockImplementation((msg: string) => {
      const match = msg.match(/token=([^\s&"]+)/);
      if (match) capturedToken = match[1];
    });
    await team.request(
      "/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${ownerToken}` },
        body: JSON.stringify({ email: "invitee@example.com" }),
      },
      env,
      ctx
    );
    spy.mockRestore();
    expect(capturedToken).toBeTruthy();

    const res = await team.request(
      "/accept",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: capturedToken }) },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Set-Cookie")).toContain(SESSION_COOKIE_NAME);
  });

  it("rejects a missing token", async () => {
    const { env } = makeMockEnv();
    const res = await team.request(
      "/accept",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid token", async () => {
    const { env } = makeMockEnv();
    const res = await team.request(
      "/accept",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: "bogus" }) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { Hono } from "hono";
import {
  requestMagicLink,
  consumeMagicLink,
  resolveAccount,
  createSession,
  optionalAccount,
  requireAccount,
  requirePaidAccount,
  SESSION_COOKIE_NAME,
  type AccountContext,
} from "./auth";
import { makeMockEnv } from "../test/mockEnv";
import type { Env } from "@docracy/shared";

function makeCtx() {
  const promises: Promise<unknown>[] = [];
  return {
    waitUntil: (p: Promise<unknown>) => {
      promises.push(p);
    },
    flush: () => Promise.all(promises),
  };
}

function captureDevEmailLog() {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});
  return {
    logged: () => spy.mock.calls.map((call) => call.join(" ")).join("\n"),
    restore: () => spy.mockRestore(),
  };
}

describe("requestMagicLink", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends a magic-link email and records it in D1", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const capture = captureDevEmailLog();

    const result = await requestMagicLink(env, ctx, "Anna@Example.com", "1.2.3.4");
    await ctx.flush();

    expect(result.ok).toBe(true);
    expect(capture.logged()).toContain("to=anna@example.com");
    expect(capture.logged()).toContain("/auth/verify?token=");

    const row = (await d1.prepare("SELECT email, requested_ip FROM magic_links").first()) as {
      email: string;
      requested_ip: string;
    } | null;
    expect(row?.email).toBe("anna@example.com");
    expect(row?.requested_ip).toBe("1.2.3.4");
  });

  it("fails gracefully when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    const ctx = makeCtx();
    const result = await requestMagicLink(env, ctx, "anna@example.com", null);
    expect(result.ok).toBe(false);
  });

  it("rate-limits repeated requests for the same email", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    vi.spyOn(console, "log").mockImplementation(() => {});
    for (let i = 0; i < 5; i++) {
      expect((await requestMagicLink(env, ctx, "anna@example.com", null)).ok).toBe(true);
    }
    expect((await requestMagicLink(env, ctx, "anna@example.com", null)).ok).toBe(false);
  });
});

describe("consumeMagicLink", () => {
  afterEach(() => vi.restoreAllMocks());

  it("creates a new account on first login and returns a session token", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();

    const token = await captureMagicLinkToken(env, ctx, "anna@example.com");
    const result = await consumeMagicLink(env, ctx, token, "9.9.9.9", "test-agent");
    await ctx.flush();

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.sessionToken).toBeTruthy();

    const account = (await d1.prepare("SELECT email, is_paid FROM accounts").first()) as {
      email: string;
      is_paid: number;
    } | null;
    expect(account?.email).toBe("anna@example.com");
    expect(account?.is_paid).toBe(0);
  });

  it("reuses an existing account on a second login", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    vi.spyOn(console, "log").mockImplementation(() => {});

    const link1 = await captureMagicLinkToken(env, ctx, "anna@example.com");
    await consumeMagicLink(env, ctx, link1, null, null);
    await ctx.flush();

    const link2 = await captureMagicLinkToken(env, ctx, "anna@example.com");
    await consumeMagicLink(env, ctx, link2, null, null);
    await ctx.flush();

    const rows = (await d1.prepare("SELECT id FROM accounts").all()).results;
    expect(rows).toHaveLength(1);
  });

  it("rejects an invalid or already-consumed token", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await consumeMagicLink(env, ctx, "garbage-token", null, null);
    expect(result.ok).toBe(false);

    const token = await captureMagicLinkToken(env, ctx, "anna@example.com");
    const first = await consumeMagicLink(env, ctx, token, null, null);
    expect(first.ok).toBe(true);
    const second = await consumeMagicLink(env, ctx, token, null, null);
    expect(second.ok).toBe(false);
  });
});

describe("resolveAccount", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns null for a missing or invalid session token", async () => {
    const { env } = makeMockEnv();
    expect(await resolveAccount(env, undefined)).toBeNull();
    expect(await resolveAccount(env, "not-a-real-session")).toBeNull();
  });

  it("resolves a valid session to its account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    await ctx.flush();

    const account = await resolveAccount(env, token);
    expect(account).toEqual({ id: "acct-1", email: "anna@example.com", isPaid: false, workspaceId: "acct-1" });
  });

  it("refreshes a stale isPaid flag from D1", async () => {
    const { env, d1, kv } = makeMockEnv();
    const ctx = makeCtx();

    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    await ctx.flush();

    // Force the cached isPaid to look stale by rewriting the KV record directly.
    const hash = [...kv._store.keys()].find((k) => k.startsWith("session:"))!;
    const record = JSON.parse(kv._store.get(hash)!);
    record.isPaidCachedAt = new Date(0).toISOString();
    kv._store.set(hash, JSON.stringify(record));

    const account = await resolveAccount(env, token);
    expect(account?.isPaid).toBe(true);
  });

  it("resolves a team member's workspaceId to the owner's account, and inherits the owner's isPaid", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const now = new Date().toISOString();

    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("owner-1", "owner@example.com", now)
      .run();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("member-1", "member@example.com", now)
      .run();
    await d1
      .prepare(`INSERT INTO team_members (id, owner_account_id, member_account_id, joined_at) VALUES (?, ?, ?, ?)`)
      .bind("tm-1", "owner-1", "member-1", now)
      .run();

    // isPaid is deliberately false here — the member's own account row is unpaid; resolveAccount
    // should still surface isPaid: true because a missing workspaceId always forces a fresh
    // lookup, and that lookup follows team_members to the owner's paid status.
    const token = await createSession(env, ctx, "member-1", "member@example.com", false, null, null);
    await ctx.flush();

    const account = await resolveAccount(env, token);
    expect(account).toMatchObject({ id: "member-1", workspaceId: "owner-1", isPaid: true });
  });

  it("does not treat a workspace owner as their own team member", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("owner-2", "owner2@example.com", new Date().toISOString())
      .run();
    const token = await createSession(env, ctx, "owner-2", "owner2@example.com", true, null, null);
    await ctx.flush();

    const account = await resolveAccount(env, token);
    expect(account).toMatchObject({ id: "owner-2", workspaceId: "owner-2", isPaid: true });
  });
});

describe("auth middlewares", () => {
  function testApp() {
    const app = new Hono<{ Bindings: Env; Variables: { account: AccountContext | null } }>();
    app.get("/optional", optionalAccount, (c) => c.json({ account: c.get("account") }));
    app.get("/required", requireAccount, (c) => c.json({ account: c.get("account") }));
    app.get("/paid", requirePaidAccount, (c) => c.json({ account: c.get("account") }));
    return app;
  }

  it("optionalAccount never blocks the request", async () => {
    const { env } = makeMockEnv();
    const app = testApp();
    const res = await app.request("/optional", {}, env);
    expect(res.status).toBe(200);
    expect((await res.json()) as { account: unknown }).toEqual({ account: null });
  });

  it("requireAccount 401s without a session cookie", async () => {
    const { env } = makeMockEnv();
    const app = testApp();
    const res = await app.request("/required", {}, env);
    expect(res.status).toBe(401);
  });

  it("requireAccount succeeds with a valid session cookie", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const app = testApp();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);

    const res = await app.request("/required", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env);
    expect(res.status).toBe(200);
  });

  it("requirePaidAccount 402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const app = testApp();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);

    const res = await app.request("/paid", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env);
    expect(res.status).toBe(402);
  });

  it("requirePaidAccount succeeds for a paid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const app = testApp();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);

    const res = await app.request("/paid", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env);
    expect(res.status).toBe(200);
  });
});

/** Requests a magic link and scrapes the token out of the dev-mode console log (same technique
 *  as the "creates a new account" test above), without leaving a log spy active afterward. */
async function captureMagicLinkToken(
  env: ReturnType<typeof makeMockEnv>["env"],
  ctx: ReturnType<typeof makeCtx>,
  email: string
): Promise<string> {
  let capturedToken = "";
  const spy = vi.spyOn(console, "log").mockImplementation((msg: string) => {
    const match = msg.match(/token=([^\s&"]+)/);
    if (match) capturedToken = match[1];
  });
  await requestMagicLink(env, ctx, email, null);
  await ctx.flush();
  spy.mockRestore();
  if (!capturedToken) throw new Error("failed to capture magic link token from dev email log");
  return capturedToken;
}

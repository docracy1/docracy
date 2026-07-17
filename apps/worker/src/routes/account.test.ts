import { describe, it, expect } from "vitest";
import account from "./account";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { verifyToken } from "@docracy/shared";
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

describe("GET /api/account/documents", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await account.request("/documents", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("returns an empty list for an account with no documents", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);

    const res = await account.request("/documents", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    const body: { documents: unknown[] } = await res.json();
    expect(body.documents).toEqual([]);
  });

  it("lists only the requesting account's own documents, newest first, with a working status token", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);

    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind("doc-old", "acct-1", "Old Lease", "completed", "2026-01-01T00:00:00Z", "2026-01-10T00:00:00Z")
      .run();
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind("doc-new", "acct-1", "New Contract", "pending", "2026-02-01T00:00:00Z", "2026-02-10T00:00:00Z")
      .run();
    // A different account's document should never show up here.
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind("doc-other", "acct-2", "Not Mine", "pending", "2026-01-15T00:00:00Z", "2026-01-20T00:00:00Z")
      .run();

    const res = await account.request("/documents", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    const body: {
      documents: Array<{ docId: string; title: string; status: string; statusToken: string; awaitingYou: boolean }>;
    } = await res.json();

    expect(body.documents.map((d) => d.docId)).toEqual(["doc-new", "doc-old"]);
    expect(body.documents[0].title).toBe("New Contract");
    expect(body.documents[0].awaitingYou).toBe(false);

    const verified = await verifyToken(body.documents[0].statusToken, env.TOKEN_SECRET);
    expect(verified).toEqual({ docId: "doc-new", order: 0 });
  });

  it("flags awaitingYou only when the preparer signs and it's currently their turn", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);

    // Waiting on you: preparer signs, and their own (order 1) turn is still pending.
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, 'pending', 1, ?, ?)`
      )
      .bind("doc-you", "acct-1", "Waiting On You", "2026-02-01T00:00:00Z", "2026-02-10T00:00:00Z")
      .run();
    await d1
      .prepare(`INSERT INTO signers (id, doc_id, "order", name, email, status) VALUES (?, ?, 1, ?, ?, 'pending')`)
      .bind("s-you", "doc-you", "Anna", "anna@example.com")
      .run();

    // Waiting on someone else: preparer signs, but has already signed (order 1 no longer pending).
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, 'pending', 1, ?, ?)`
      )
      .bind("doc-others", "acct-1", "Waiting On Others", "2026-02-02T00:00:00Z", "2026-02-10T00:00:00Z")
      .run();
    await d1
      .prepare(`INSERT INTO signers (id, doc_id, "order", name, email, status) VALUES (?, ?, 1, ?, ?, 'signed')`)
      .bind("s-others", "doc-others", "Anna", "anna@example.com")
      .run();

    // Preparer never signs at all.
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, 'pending', 0, ?, ?)`
      )
      .bind("doc-not-signer", "acct-1", "Not A Signer", "2026-02-03T00:00:00Z", "2026-02-10T00:00:00Z")
      .run();

    const res = await account.request("/documents", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    const body: {
      documents: Array<{ docId: string; awaitingYou: boolean; signToken: string | null }>;
    } = await res.json();

    const byId = Object.fromEntries(body.documents.map((d) => [d.docId, d]));
    expect(byId["doc-you"].awaitingYou).toBe(true);
    expect(byId["doc-you"].signToken).not.toBeNull();
    expect(byId["doc-others"].awaitingYou).toBe(false);
    expect(byId["doc-others"].signToken).toBeNull();
    expect(byId["doc-not-signer"].awaitingYou).toBe(false);
    expect(byId["doc-not-signer"].signToken).toBeNull();

    const verifiedSignToken = await verifyToken(byId["doc-you"].signToken!, env.TOKEN_SECRET);
    expect(verifiedSignToken).toEqual({ docId: "doc-you", order: 1 });
  });
});

describe("GET /api/account/token", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await account.request("/token", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    const res = await account.request("/token", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(402);
  });

  it("reports hasToken: false before any token is issued", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);
    const res = await account.request("/token", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    expect((await res.json()) as { hasToken: boolean }).toEqual({ hasToken: false });
  });
});

describe("POST /api/account/token/regenerate", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await account.request("/token/regenerate", { method: "POST" }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    const res = await account.request(
      "/token/regenerate",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("issues a token and a matching connector URL, then reports it as active", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const sessionToken = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);

    const res = await account.request(
      "/token/regenerate",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { token: string; connectorUrl: string } = await res.json();
    expect(body.token.startsWith("dk_")).toBe(true);
    expect(body.connectorUrl).toBe(`${env.PUBLIC_CONNECTOR_URL}/mcp?token=${body.token}`);

    const statusRes = await account.request(
      "/token",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` } },
      env,
      ctx
    );
    expect((await statusRes.json()) as { hasToken: boolean }).toEqual({ hasToken: true });
  });
});

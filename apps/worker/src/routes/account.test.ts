import { describe, it, expect } from "vitest";
import account from "./account";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { verifyToken } from "@docracy/shared";
import { putDoc } from "../lib/kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

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
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);

    const res = await account.request("/documents", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    const body: { documents: unknown[] } = await res.json();
    expect(body.documents).toEqual([]);
  });

  it("lists only the requesting account's own documents, newest first, with a working status token", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);

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
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);

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

  it("hydrates cobro kind and cobroPaidAt from KV", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);
    const now = "2026-03-01T00:00:00Z";
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at) VALUES (?, ?, ?, 'completed', 0, ?, ?, ?)`
      )
      .bind("cobro-1", "acct-1", "March invoice", now, now, "2027-04-15T00:00:00Z")
      .run();
    const cobro: DocState = {
      docId: "cobro-1",
      accountId: "acct-1",
      title: "March invoice",
      createdAt: now,
      expiresAt: "2027-04-15T00:00:00Z",
      preparerSigns: false,
      status: "completed",
      completedAt: now,
      signers: [],
      fields: [],
      kind: "cobro",
      cobroPaidAt: "2026-03-02T00:00:00Z",
      paymentRequest: { amount: "150", currency: "MXN", url: "https://paypal.me/x/150" },
    };
    await putDoc(env, cobro);

    const res = await account.request("/documents", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    const body: {
      documents: Array<{ docId: string; kind?: string; cobroPaidAt?: string | null }>;
    } = await res.json();
    expect(body.documents[0].kind).toBe("cobro");
    expect(body.documents[0].cobroPaidAt).toBe("2026-03-02T00:00:00Z");
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
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, false, null, null);
    const res = await account.request("/token", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(402);
  });

  it("reports hasToken: false before any token is issued", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);
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
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, false, null, null);
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
    const sessionToken = await createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);

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

describe("POST /api/account/documents/claim", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await account.request(
      "/documents/claim",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claimToken: "x" }) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("attaches an anonymous document to the signed-in account and indexes D1", async () => {
    const { env, kv, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const { createDocumentCore, documentClaimKvKey } = await import("../lib/documentCreation");
    const { hashOpaqueToken } = await import("@docracy/shared");
    const { makeValidPdfBytes } = await import("../test/mockEnv");
    const pdfBytes = await makeValidPdfBytes();

    const { docId, claimToken } = await createDocumentCore({
      env,
      ctx,
      pdfBytes,
      accountId: null,
      filename: "nda.pdf",
      preparerSigns: false,
      signers: [{ name: "Anna", email: "anna@example.com" }],
      fields: [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }],
    });
    await ctx.flush();
    expect(claimToken).toBeTruthy();

    const sessionToken = await createSession(env, ctx, "acct-1", "owner@example.com", false, false, null, null);
    const res = await account.request(
      "/documents/claim",
      {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimToken }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { ok: true; docId: string; title: string } = await res.json();
    expect(body.docId).toBe(docId);
    expect(body.title).toBe("nda.pdf");
    await ctx.flush();

    const stored = JSON.parse(kv._store.get(`doc:${docId}`)!) as { accountId: string; title: string };
    expect(stored.accountId).toBe("acct-1");
    expect(stored.title).toBe("nda.pdf");

    const claimHash = await hashOpaqueToken(claimToken!, env.TOKEN_SECRET);
    expect(kv._store.has(documentClaimKvKey(claimHash))).toBe(false);

    const row = (await d1.prepare("SELECT account_id, title FROM documents WHERE doc_id = ?").bind(docId).first()) as {
      account_id: string;
      title: string;
    };
    expect(row.account_id).toBe("acct-1");
    expect(row.title).toBe("nda.pdf");
  });

  it("404s for an unknown or already-consumed claim token", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const sessionToken = await createSession(env, ctx, "acct-1", "owner@example.com", false, false, null, null);
    const res = await account.request(
      "/documents/claim",
      {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimToken: "not-a-real-token" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/account/marketing-opt-in", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await account.request(
      "/marketing-opt-in",
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optIn: true }) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("400s when optIn is missing or not a boolean", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, false, null, null);
    const res = await account.request(
      "/marketing-opt-in",
      {
        method: "PATCH",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: "yes" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("works for a free account (not gated on isPaid) and persists the flag", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, false, null, null);
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at) VALUES (?, ?, ?)`)
      .bind("acct-1", "anna@example.com", "2026-01-01T00:00:00Z")
      .run();

    const res = await account.request(
      "/marketing-opt-in",
      {
        method: "PATCH",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: true }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { ok: true; marketingOptIn: boolean } = await res.json();
    expect(body.marketingOptIn).toBe(true);

    const row = (await d1.prepare("SELECT marketing_opt_in FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      marketing_opt_in: number;
    };
    expect(row.marketing_opt_in).toBe(1);
  });

  it("can toggle back off", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", "2026-01-01T00:00:00Z")
      .run();

    await account.request(
      "/marketing-opt-in",
      {
        method: "PATCH",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: true }),
      },
      env,
      ctx
    );
    const res = await account.request(
      "/marketing-opt-in",
      {
        method: "PATCH",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: false }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const row = (await d1.prepare("SELECT marketing_opt_in FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      marketing_opt_in: number;
    };
    expect(row.marketing_opt_in).toBe(0);
  });
});

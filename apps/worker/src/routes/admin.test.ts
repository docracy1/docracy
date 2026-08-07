import { describe, it, expect } from "vitest";
import admin from "./admin";
import { makeMockEnv } from "../test/mockEnv";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import type { Env } from "@docracy/shared";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

async function sessionCookie(env: Env, email: string) {
  const token = await createSession(env, MOCK_CTX, "acct-1", email, false, false, null, null);
  return { Cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

describe("GET /api/admin/analytics", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request("/analytics", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("rejects a signed-in account that isn't on the admin allow-list", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "notadmin@example.com");
    const res = await admin.request("/analytics", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("returns a 501 with a clear message when the Analytics Engine read token isn't configured", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request("/analytics", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(501);
    const body: { error: string } = await res.json();
    expect(body.error).toContain("CF_ANALYTICS_API_TOKEN");
  });

  it("allow-list matching is case-insensitive", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "Admin@Example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request("/analytics", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(501); // not 401 — passed the admin check, just no token configured
  });
});

describe("GET /api/admin/accounts", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request("/accounts", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("lists every signup, paid or not, most recent first", async () => {
    const { env, d1 } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const older = new Date(Date.now() - 60_000).toISOString();
    const newer = new Date().toISOString();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-free", "free@example.com", older)
      .run();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, is_enterprise) VALUES (?, ?, ?, 1, 1)`)
      .bind("acct-enterprise", "enterprise@example.com", newer)
      .run();

    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request("/accounts", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: {
      accounts: Array<{ email: string; createdAt: string; isPaid: boolean; isEnterprise: boolean }>;
    } = await res.json();
    expect(body.accounts.map((a) => a.email)).toEqual(["enterprise@example.com", "free@example.com"]);
    expect(body.accounts[0]).toMatchObject({ isPaid: true, isEnterprise: true });
    expect(body.accounts[1]).toMatchObject({ isPaid: false, isEnterprise: false });
  });
});

describe("GET /api/admin/enterprise-accounts", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request("/enterprise-accounts", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("lists enterprise accounts alphabetically by email, and skips non-enterprise accounts", async () => {
    const { env, d1 } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, is_enterprise) VALUES (?, ?, ?, 1, 1)`)
      .bind("acct-b", "b-enterprise@example.com", new Date().toISOString())
      .run();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, is_enterprise) VALUES (?, ?, ?, 1, 1)`)
      .bind("acct-a", "a-enterprise@example.com", new Date().toISOString())
      .run();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-plain-paid", "plain@example.com", new Date().toISOString())
      .run();

    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request("/enterprise-accounts", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { accounts: Array<{ email: string; isPaid: boolean }> } = await res.json();
    expect(body.accounts.map((a) => a.email)).toEqual(["a-enterprise@example.com", "b-enterprise@example.com"]);
    expect(body.accounts[0].isPaid).toBe(true);
  });
});

function postJson(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

describe("GET /api/admin/documents", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request("/documents", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("lists sent account-linked docs with sender and signer emails", async () => {
    const { env, d1 } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const now = new Date().toISOString();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "sender@example.com", now)
      .run();
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind("doc-sent", "acct-1", "NDA", "pending", now, now)
      .run();
    await d1
      .prepare(`INSERT INTO signers (id, doc_id, "order", name, email, status) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind("sig-1", "doc-sent", 0, "Alice", "alice@example.com", "pending")
      .run();

    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request("/documents?days=30&kind=sent", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: {
      kind: string;
      documents: Array<{
        docId: string;
        accountEmail: string;
        signers: Array<{ email: string; name: string }>;
      }>;
    } = await res.json();
    expect(body.kind).toBe("sent");
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0]).toMatchObject({
      docId: "doc-sent",
      accountEmail: "sender@example.com",
    });
    expect(body.documents[0].signers).toEqual([
      expect.objectContaining({ email: "alice@example.com", name: "Alice" }),
    ]);
  });

  it("lists only completed docs for kind=signed", async () => {
    const { env, d1 } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const now = new Date().toISOString();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "sender@example.com", now)
      .run();
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind("doc-open", "acct-1", "Open", "pending", now, now)
      .run();
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
      )
      .bind("doc-done", "acct-1", "Done", "completed", now, now, now)
      .run();
    await d1
      .prepare(
        `INSERT INTO signers (id, doc_id, "order", name, email, status, signed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind("sig-2", "doc-done", 0, "Bob", "bob@example.com", "signed", now)
      .run();

    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request("/documents?days=30&kind=signed", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: {
      kind: string;
      documents: Array<{ docId: string; accountEmail: string; signers: Array<{ email: string }> }>;
    } = await res.json();
    expect(body.kind).toBe("signed");
    expect(body.documents.map((d) => d.docId)).toEqual(["doc-done"]);
    expect(body.documents[0].signers[0].email).toBe("bob@example.com");
  });
});

describe("POST /api/admin/grant-enterprise", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request("/grant-enterprise", postJson({ email: "customer@example.com" }), env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("404s when no account exists with that email", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request(
      "/grant-enterprise",
      postJson({ email: "nobody@example.com" }, headers),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(404);
  });

  it("grants paid + enterprise status to the account with that email — for bank transfers or custom deals", async () => {
    const { env, d1 } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-customer", "customer@example.com", new Date().toISOString())
      .run();
    const headers = await sessionCookie(env, "admin@example.com");

    const res = await admin.request(
      "/grant-enterprise",
      postJson({ email: "customer@example.com" }, headers),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const row = (await d1
      .prepare("SELECT is_paid, is_enterprise FROM accounts WHERE id = ?")
      .bind("acct-customer")
      .first()) as { is_paid: number; is_enterprise: number } | null;
    expect(row?.is_paid).toBe(1);
    expect(row?.is_enterprise).toBe(1);
  });
});

describe("POST /api/admin/analytics/notrack", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request("/analytics/notrack", postJson({ enabled: true }), env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("always sets the notrack cookie (founder traffic stays out of analytics)", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request(
      "/analytics/notrack",
      postJson({ enabled: true }, headers),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const body: { ok: boolean; enabled: boolean } = await res.json();
    expect(body.enabled).toBe(true);
    expect(res.headers.get("set-cookie")).toContain("docracy_notrack=1");
  });

  it("keeps notrack enabled even when the client asks to disable it", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request(
      "/analytics/notrack",
      postJson({ enabled: false }, headers),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("docracy_notrack=1");
  });
});

describe("GET /api/admin/marketing-email/recipients-count", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request("/marketing-email/recipients-count", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("counts opted-in accounts plus non-unsubscribed leads, deduplicated by email", async () => {
    const { env, d1 } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");

    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, marketing_opt_in) VALUES (?, ?, ?, 1)`)
      .bind("acct-optin", "optedin@example.com", "2026-01-01T00:00:00Z")
      .run();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, marketing_opt_in) VALUES (?, ?, ?, 0)`)
      .bind("acct-optout", "optedout@example.com", "2026-01-01T00:00:00Z")
      .run();
    await d1
      .prepare(
        `INSERT INTO onboarding_leads (email, source, opted_in_at, marketing_unsubscribed) VALUES (?, ?, ?, 0)`
      )
      .bind("lead@example.com", "test", "2026-01-01T00:00:00Z")
      .run();
    await d1
      .prepare(
        `INSERT INTO onboarding_leads (email, source, opted_in_at, marketing_unsubscribed) VALUES (?, ?, ?, 1)`
      )
      .bind("unsubscribed@example.com", "test", "2026-01-01T00:00:00Z")
      .run();

    const res = await admin.request("/marketing-email/recipients-count", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { count: number } = await res.json();
    expect(body.count).toBe(2);
  });
});

describe("POST /api/admin/marketing-email/send", () => {
  it("rejects an unauthenticated request", async () => {
    const { env } = makeMockEnv();
    const res = await admin.request(
      "/marketing-email/send",
      postJson({ subject: "Hi", body: "<p>Hi</p>" }),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("400s when subject or body is missing", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request("/marketing-email/send", postJson({ body: "<p>Hi</p>" }, headers), env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("sends to every opted-in recipient and reports the result", async () => {
    const { env, d1 } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, marketing_opt_in) VALUES (?, ?, ?, 1)`)
      .bind("acct-optin", "optedin@example.com", "2026-01-01T00:00:00Z")
      .run();

    const res = await admin.request(
      "/marketing-email/send",
      postJson({ subject: "News", body: "<p>Hello</p>" }, headers),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const body: { sent: number; failed: number } = await res.json();
    expect(body.sent).toBe(1);
    expect(body.failed).toBe(0);
  });
});

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

  it("sets the notrack cookie when enabling", async () => {
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

  it("clears the notrack cookie when disabling", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await sessionCookie(env, "admin@example.com");
    const res = await admin.request(
      "/analytics/notrack",
      postJson({ enabled: false }, headers),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("docracy_notrack=;");
  });
});

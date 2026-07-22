import { describe, it, expect } from "vitest";
import admin from "./admin";
import { makeMockEnv } from "../test/mockEnv";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import type { Env } from "@docracy/shared";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

async function sessionCookie(env: Env, email: string) {
  const token = await createSession(env, MOCK_CTX, "acct-1", email, false, null, null);
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

function postJson(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

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

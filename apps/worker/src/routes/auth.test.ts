import { describe, it, expect } from "vitest";
import auth from "./auth";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

describe("GET /api/auth/me", () => {
  it("returns a null account when signed out", async () => {
    const { env } = makeMockEnv();
    const res = await auth.request("/me", {}, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { account: unknown; isAdmin: boolean };
    expect(body.account).toBeNull();
    expect(body.isAdmin).toBe(false);
  });

  it("returns isAdmin: false for a signed-in non-admin account", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const token = await createSession(env, MOCK_CTX, "acct-1", "anna@example.com", false, false, null, null);
    const res = await auth.request("/me", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, MOCK_CTX);
    const body = (await res.json()) as { isAdmin: boolean };
    expect(body.isAdmin).toBe(false);
  });

  it("returns isAdmin: true for a signed-in admin account", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const token = await createSession(env, MOCK_CTX, "acct-1", "admin@example.com", false, false, null, null);
    const res = await auth.request("/me", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, MOCK_CTX);
    const body = (await res.json()) as { isAdmin: boolean };
    expect(body.isAdmin).toBe(true);
  });
});

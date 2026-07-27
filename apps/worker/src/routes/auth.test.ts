import { describe, it, expect, vi, afterEach } from "vitest";
import auth from "./auth";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function postJson(body: unknown) {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

describe("POST /api/auth/request-link", () => {
  afterEach(() => vi.restoreAllMocks());

  it("succeeds without a turnstileToken when Turnstile isn't configured", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await auth.request("/request-link", postJson({ email: "anna@example.com" }), env, MOCK_CTX);
    expect(res.status).toBe(200);
  });

  it("rejects a missing turnstileToken once TURNSTILE_SECRET_KEY is configured", async () => {
    const { env } = makeMockEnv({ TURNSTILE_SECRET_KEY: "test-secret" });
    const res = await auth.request("/request-link", postJson({ email: "anna@example.com" }), env, MOCK_CTX);
    expect(res.status).toBe(400);
    const body: { error: string } = await res.json();
    expect(body.error).toContain("verification challenge");
  });

  it("accepts a turnstileToken the siteverify API confirms", async () => {
    const { env } = makeMockEnv({ TURNSTILE_SECRET_KEY: "test-secret" });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    const res = await auth.request(
      "/request-link",
      postJson({ email: "anna@example.com", turnstileToken: "good-token" }),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
  });
});

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

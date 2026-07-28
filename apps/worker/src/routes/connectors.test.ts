import { describe, it, expect, vi, afterEach } from "vitest";
import connectors from "./connectors";
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

async function enterpriseSession(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], ctx: ReturnType<typeof makeCtx>) {
  return createSession(env, ctx, "acct-1", "anna@example.com", true, true, null, null);
}

async function paidNonEnterpriseSession(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], ctx: ReturnType<typeof makeCtx>) {
  return createSession(env, ctx, "acct-1", "anna@example.com", true, false, null, null);
}

const DROPBOX_ENV = { DROPBOX_CLIENT_ID: "dbx-id", DROPBOX_CLIENT_SECRET: "dbx-secret" };

describe("GET /api/account/connectors", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await connectors.request("/", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("402s for a free (unpaid) account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, false, null, null);
    const res = await connectors.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(402);
  });

  it("returns an empty list for a paid account with nothing connected", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidNonEnterpriseSession(env, ctx);
    const res = await connectors.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    const body: { connections: unknown[] } = await res.json();
    expect(body.connections).toEqual([]);
  });
});

describe("GET /api/account/connectors/:provider/authorize", () => {
  it("501s when the provider isn't configured on this deployment", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await enterpriseSession(env, ctx);
    const res = await connectors.request(
      "/dropbox/authorize",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(501);
  });

  it("returns an authorize URL once the provider is configured", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    const ctx = makeCtx();
    const token = await enterpriseSession(env, ctx);
    const res = await connectors.request(
      "/dropbox/authorize",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { url: string } = await res.json();
    expect(body.url).toContain("dropbox.com");
  });

  it("404s for an unknown provider name", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await enterpriseSession(env, ctx);
    const res = await connectors.request(
      "/not-a-provider/authorize",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/account/connectors/:provider/callback", () => {
  afterEach(() => vi.restoreAllMocks());

  it("redirects to an error state for an invalid state token", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    const res = await connectors.request("/dropbox/callback?code=abc&state=bogus", {}, env, MOCK_CTX);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("connector=error");
  });

  it("redirects to a success state on a valid authorize->callback round trip", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    const ctx = makeCtx();
    const token = await enterpriseSession(env, ctx);
    const authorizeRes = await connectors.request(
      "/dropbox/authorize",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    const { url } = (await authorizeRes.json()) as { url: string };
    const state = new URL(url).searchParams.get("state")!;

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const u = String(input);
      if (u.includes("oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "at-1", refresh_token: "rt-1", expires_in: 3600 }), {
          status: 200,
        });
      }
      if (u.includes("get_current_account")) {
        return new Response(JSON.stringify({ email: "user@example.com" }), { status: 200 });
      }
      throw new Error(`Unexpected fetch to ${u}`);
    });

    const res = await connectors.request(`/dropbox/callback?code=auth-code&state=${state}`, {}, env, MOCK_CTX);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("connector=connected");
  });
});

describe("DELETE /api/account/connectors/:provider", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await connectors.request("/dropbox", { method: "DELETE" }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("404s when nothing is connected for that provider", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await enterpriseSession(env, ctx);
    const res = await connectors.request(
      "/dropbox",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(404);
  });
});

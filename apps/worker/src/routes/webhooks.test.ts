import { describe, it, expect } from "vitest";
import webhooks from "./webhooks";
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

async function paidSession(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], ctx: ReturnType<typeof makeCtx>) {
  return createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);
}

const validBody = { url: "https://example.com/hook", events: ["document.created"] };

describe("POST /api/account/webhooks", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await webhooks.request(
      "/",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validBody) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    const res = await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify(validBody),
      },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("creates a webhook for a paid account and returns the secret once", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    const res = await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify(validBody),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { webhookId: string; secret: string } = await res.json();
    expect(body.webhookId).toBeTruthy();
    expect(body.secret).toMatch(/^whsec_/);
  });

  it("rejects a non-https URL", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    const res = await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ url: "http://example.com/hook", events: ["document.created"] }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects an unrecognized event type", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    const res = await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ url: "https://example.com/hook", events: ["document.deleted"] }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects an empty events list", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    const res = await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ url: "https://example.com/hook", events: [] }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/account/webhooks", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await webhooks.request("/", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("lists only the requesting account's own webhooks, without exposing the secret", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify(validBody),
      },
      env,
      ctx
    );
    const otherToken = await createSession(env, ctx, "acct-2", "max@example.com", true, null, null);
    await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${otherToken}` },
        body: JSON.stringify({ url: "https://example.com/not-mine", events: ["document.completed"] }),
      },
      env,
      ctx
    );

    const res = await webhooks.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    const body: { webhooks: Array<{ url: string; secret?: string }> } = await res.json();
    expect(body.webhooks.map((w) => w.url)).toEqual(["https://example.com/hook"]);
    expect(body.webhooks[0].secret).toBeUndefined();
  });
});

describe("DELETE /api/account/webhooks/:id", () => {
  it("deletes a webhook owned by the requesting account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    const createRes = await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify(validBody),
      },
      env,
      ctx
    );
    const { webhookId } = (await createRes.json()) as { webhookId: string };

    const deleteRes = await webhooks.request(
      `/${webhookId}`,
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(deleteRes.status).toBe(200);

    const list = await webhooks.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    const body: { webhooks: unknown[] } = await list.json();
    expect(body.webhooks).toHaveLength(0);
  });

  it("404s when another account tries to delete a webhook it doesn't own", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    const createRes = await webhooks.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify(validBody),
      },
      env,
      ctx
    );
    const { webhookId } = (await createRes.json()) as { webhookId: string };

    const otherToken = await createSession(env, ctx, "acct-2", "max@example.com", true, null, null);
    const deleteRes = await webhooks.request(
      `/${webhookId}`,
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${otherToken}` } },
      env,
      ctx
    );
    expect(deleteRes.status).toBe(404);
  });

  it("404s for a nonexistent webhook", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);

    const res = await webhooks.request(
      "/no-such-webhook",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(404);
  });
});

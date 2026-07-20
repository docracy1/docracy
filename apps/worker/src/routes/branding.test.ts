import { describe, it, expect } from "vitest";
import branding from "./branding";
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
  await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
    .bind("acct-1", "anna@example.com", new Date().toISOString())
    .run();
  return createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);
}

const TINY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function pngFile(name = "logo.png") {
  const bytes = Uint8Array.from(atob(TINY_PNG_BASE64), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: "image/png" });
}

describe("GET /api/account/branding/logo", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await branding.request("/logo", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("reports no logo initially", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const res = await branding.request("/logo", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect(res.status).toBe(200);
    const body: { hasLogo: boolean; logoPath: string | null } = await res.json();
    expect(body).toEqual({ hasLogo: false, logoPath: null });
  });
});

describe("POST /api/account/branding/logo", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const form = new FormData();
    form.set("logo", pngFile());
    const res = await branding.request("/logo", { method: "POST", body: form }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-2", "unpaid@example.com", new Date().toISOString())
      .run();
    const token = await createSession(env, ctx, "acct-2", "unpaid@example.com", false, null, null);
    const form = new FormData();
    form.set("logo", pngFile());
    const res = await branding.request(
      "/logo",
      { method: "POST", body: form, headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("uploads a valid PNG logo", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const form = new FormData();
    form.set("logo", pngFile());
    const res = await branding.request(
      "/logo",
      { method: "POST", body: form, headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { ok: true; logoPath: string } = await res.json();
    expect(body.logoPath).toBe("/api/branding/acct-1/logo");

    const getRes = await branding.request("/logo", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect((await getRes.json()) as { hasLogo: boolean }).toMatchObject({ hasLogo: true });
  });

  it("rejects a non-image content type", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const form = new FormData();
    form.set("logo", new File([new Uint8Array([1, 2, 3])], "logo.txt", { type: "text/plain" }));
    const res = await branding.request(
      "/logo",
      { method: "POST", body: form, headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects an oversized logo", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const big = new Uint8Array(3 * 1024 * 1024);
    const form = new FormData();
    form.set("logo", new File([big], "logo.png", { type: "image/png" }));
    const res = await branding.request(
      "/logo",
      { method: "POST", body: form, headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects a request missing the file", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const form = new FormData();
    const res = await branding.request(
      "/logo",
      { method: "POST", body: form, headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/account/branding/logo", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await branding.request("/logo", { method: "DELETE" }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("removes an uploaded logo", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const form = new FormData();
    form.set("logo", pngFile());
    await branding.request(
      "/logo",
      { method: "POST", body: form, headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );

    const deleteRes = await branding.request(
      "/logo",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(deleteRes.status).toBe(200);

    const getRes = await branding.request("/logo", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    expect((await getRes.json()) as { hasLogo: boolean }).toMatchObject({ hasLogo: false });
  });

  it("succeeds even when there was no logo to begin with", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const res = await branding.request(
      "/logo",
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
  });
});

import { describe, it, expect } from "vitest";
import brandingPublic from "./brandingPublic";
import { uploadLogo } from "../lib/branding";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
const TINY_PNG_BYTES = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="),
  (c) => c.charCodeAt(0)
);

describe("GET /api/branding/:accountId/logo", () => {
  it("404s for an account with no logo", async () => {
    const { env } = makeMockEnv();
    const res = await brandingPublic.request("/acct-1/logo", {}, env, MOCK_CTX);
    expect(res.status).toBe(404);
  });

  it("serves the uploaded logo's bytes with its content type", async () => {
    const { env } = makeMockEnv();
    await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();
    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");

    const res = await brandingPublic.request("/acct-1/logo", {}, env, MOCK_CTX);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes).toEqual(TINY_PNG_BYTES);
  });

  it("does not serve one account's logo under another account's id", async () => {
    const { env } = makeMockEnv();
    await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();
    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");

    const res = await brandingPublic.request("/acct-2/logo", {}, env, MOCK_CTX);
    expect(res.status).toBe(404);
  });
});

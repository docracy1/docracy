import { describe, it, expect } from "vitest";
import { extractApiToken, resolveAccountByApiToken } from "./apiTokenAuth";
import { issueApiToken } from "./apiTokens";
import { makeMockEnv } from "../test/mockEnv";

describe("extractApiToken", () => {
  it("reads a Bearer token from the Authorization header", () => {
    const req = new Request("https://example.com/api/zapier/auth-test", { headers: { Authorization: "Bearer dk_abc123" } });
    expect(extractApiToken(req)).toBe("dk_abc123");
  });

  it("reads a token from the ?token= query param", () => {
    const req = new Request("https://example.com/api/zapier/auth-test?token=dk_abc123");
    expect(extractApiToken(req)).toBe("dk_abc123");
  });

  it("prefers the Authorization header over the query param", () => {
    const req = new Request("https://example.com/api/zapier/auth-test?token=from-query", {
      headers: { Authorization: "Bearer from-header" },
    });
    expect(extractApiToken(req)).toBe("from-header");
  });

  it("returns null when neither is present", () => {
    expect(extractApiToken(new Request("https://example.com/api/zapier/auth-test"))).toBeNull();
  });
});

describe("resolveAccountByApiToken", () => {
  it("resolves a valid token issued for a paid workspace", async () => {
    const { env } = makeMockEnv();
    await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "owner@example.com", new Date().toISOString())
      .run();
    const token = await issueApiToken(env, "acct-1");

    const req = new Request("https://example.com/api/zapier/auth-test", { headers: { Authorization: `Bearer ${token}` } });
    expect(await resolveAccountByApiToken(env, req)).toEqual({ workspaceId: "acct-1", email: "owner@example.com" });
  });

  it("returns null for an unrecognized token", async () => {
    const { env } = makeMockEnv();
    const req = new Request("https://example.com/api/zapier/auth-test", { headers: { Authorization: "Bearer dk_bogus" } });
    expect(await resolveAccountByApiToken(env, req)).toBeNull();
  });

  it("returns null when no token is present", async () => {
    const { env } = makeMockEnv();
    expect(await resolveAccountByApiToken(env, new Request("https://example.com/api/zapier/auth-test"))).toBeNull();
  });

  it("refuses a token whose account is no longer paid", async () => {
    const { env } = makeMockEnv();
    await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "owner@example.com", new Date().toISOString())
      .run();
    const token = await issueApiToken(env, "acct-1");
    await env.DOCRACY_DB!.prepare(`UPDATE accounts SET is_paid = 0 WHERE id = ?`).bind("acct-1").run();

    const req = new Request("https://example.com/api/zapier/auth-test", { headers: { Authorization: `Bearer ${token}` } });
    expect(await resolveAccountByApiToken(env, req)).toBeNull();
  });
});

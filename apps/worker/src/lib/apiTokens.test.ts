import { describe, it, expect } from "vitest";
import { issueApiToken, hasApiToken, revokeApiToken } from "./apiTokens";
import { hashOpaqueToken } from "@docracy/shared";
import { makeMockEnv } from "../test/mockEnv";

describe("issueApiToken", () => {
  it("issues a token prefixed with dk_ and reports it as active", async () => {
    const { env } = makeMockEnv();
    const token = await issueApiToken(env, "acct-1");
    expect(token.startsWith("dk_")).toBe(true);
    expect(await hasApiToken(env, "acct-1")).toBe(true);
  });

  it("stores only a hash in D1 and KV, never the raw token", async () => {
    const { env, d1, kv } = makeMockEnv();
    const token = await issueApiToken(env, "acct-1");

    const row = (await d1.prepare("SELECT token_hash FROM api_tokens WHERE account_id = ?").bind("acct-1").first()) as {
      token_hash: string;
    } | null;
    expect(row?.token_hash).toBeTruthy();
    expect(row?.token_hash).not.toBe(token);

    const expectedHash = await hashOpaqueToken(token, env.TOKEN_SECRET);
    expect(row?.token_hash).toBe(expectedHash);
    expect(kv._store.has(`apitoken:${expectedHash}`)).toBe(true);
    expect(kv._store.get(`apitoken:${expectedHash}`)).toBe(JSON.stringify({ accountId: "acct-1" }));
  });

  it("invalidates the previous token when a new one is issued", async () => {
    const { env, d1, kv } = makeMockEnv();
    const first = await issueApiToken(env, "acct-1");
    const firstHash = await hashOpaqueToken(first, env.TOKEN_SECRET);

    const second = await issueApiToken(env, "acct-1");
    const secondHash = await hashOpaqueToken(second, env.TOKEN_SECRET);

    expect(first).not.toBe(second);
    expect(kv._store.has(`apitoken:${firstHash}`)).toBe(false);
    expect(kv._store.has(`apitoken:${secondHash}`)).toBe(true);

    const rows = (await d1.prepare("SELECT token_hash FROM api_tokens WHERE account_id = ?").bind("acct-1").all())
      .results;
    expect(rows).toHaveLength(1);
  });

  it("keeps tokens for different accounts independent", async () => {
    const { env } = makeMockEnv();
    await issueApiToken(env, "acct-1");
    expect(await hasApiToken(env, "acct-1")).toBe(true);
    expect(await hasApiToken(env, "acct-2")).toBe(false);
  });
});

describe("hasApiToken", () => {
  it("returns false when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    expect(await hasApiToken(env, "acct-1")).toBe(false);
  });
});

describe("revokeApiToken", () => {
  it("deletes the token from both D1 and KV", async () => {
    const { env, d1, kv } = makeMockEnv();
    const token = await issueApiToken(env, "acct-1");
    const hash = await hashOpaqueToken(token, env.TOKEN_SECRET);
    expect(kv._store.has(`apitoken:${hash}`)).toBe(true);

    await revokeApiToken(env, "acct-1");

    expect(kv._store.has(`apitoken:${hash}`)).toBe(false);
    expect(await hasApiToken(env, "acct-1")).toBe(false);
    const rows = (await d1.prepare("SELECT * FROM api_tokens WHERE account_id = ?").bind("acct-1").all()).results;
    expect(rows).toHaveLength(0);
  });

  it("does nothing (doesn't throw) when the account has no token", async () => {
    const { env } = makeMockEnv();
    await expect(revokeApiToken(env, "acct-with-no-token")).resolves.toBeUndefined();
  });

  it("does nothing (doesn't throw) when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    await expect(revokeApiToken(env, "acct-1")).resolves.toBeUndefined();
  });

  it("only revokes the target account's token, leaving others untouched", async () => {
    const { env } = makeMockEnv();
    await issueApiToken(env, "acct-1");
    await issueApiToken(env, "acct-2");

    await revokeApiToken(env, "acct-1");

    expect(await hasApiToken(env, "acct-1")).toBe(false);
    expect(await hasApiToken(env, "acct-2")).toBe(true);
  });
});

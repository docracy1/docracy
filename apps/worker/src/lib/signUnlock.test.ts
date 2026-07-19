import { describe, it, expect } from "vitest";
import { verifyPin, issueUnlockToken, verifyUnlockToken } from "./signUnlock";
import { hashOpaqueToken } from "@docracy/shared";
import { makeMockEnv } from "../test/mockEnv";

describe("verifyPin", () => {
  it("accepts the correct PIN", async () => {
    const { env } = makeMockEnv();
    const pinHash = await hashOpaqueToken("1234", env.TOKEN_SECRET);
    expect(await verifyPin(env, "1234", pinHash)).toBe(true);
  });

  it("rejects an incorrect PIN", async () => {
    const { env } = makeMockEnv();
    const pinHash = await hashOpaqueToken("1234", env.TOKEN_SECRET);
    expect(await verifyPin(env, "9999", pinHash)).toBe(false);
  });
});

describe("issueUnlockToken / verifyUnlockToken", () => {
  it("verifies a freshly issued token for the exact doc/order it was minted for", async () => {
    const { env } = makeMockEnv();
    const token = await issueUnlockToken(env, "doc-1", 1);
    expect(await verifyUnlockToken(env, token, "doc-1", 1)).toBe(true);
  });

  it("rejects the token for a different signer order", async () => {
    const { env } = makeMockEnv();
    const token = await issueUnlockToken(env, "doc-1", 1);
    expect(await verifyUnlockToken(env, token, "doc-1", 2)).toBe(false);
  });

  it("rejects the token for a different document", async () => {
    const { env } = makeMockEnv();
    const token = await issueUnlockToken(env, "doc-1", 1);
    expect(await verifyUnlockToken(env, token, "doc-2", 1)).toBe(false);
  });

  it("rejects a missing token", async () => {
    const { env } = makeMockEnv();
    expect(await verifyUnlockToken(env, undefined, "doc-1", 1)).toBe(false);
  });

  it("rejects a garbage token", async () => {
    const { env } = makeMockEnv();
    expect(await verifyUnlockToken(env, "not-a-real-token", "doc-1", 1)).toBe(false);
  });
});

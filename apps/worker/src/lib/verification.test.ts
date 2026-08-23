import { describe, it, expect } from "vitest";
import { isValidSha256Hex, recordVerification, lookupVerification, recordOtsProof, lookupOtsProof } from "./verification";
import { makeMockEnv } from "../test/mockEnv";

describe("isValidSha256Hex", () => {
  it("accepts a 64-char hex string, case-insensitively", () => {
    expect(isValidSha256Hex("a".repeat(64))).toBe(true);
    expect(isValidSha256Hex("A".repeat(64))).toBe(true);
  });

  it("rejects anything that isn't exactly 64 hex characters", () => {
    expect(isValidSha256Hex("a".repeat(63))).toBe(false);
    expect(isValidSha256Hex("a".repeat(65))).toBe(false);
    expect(isValidSha256Hex("g".repeat(64))).toBe(false);
    expect(isValidSha256Hex("")).toBe(false);
    expect(isValidSha256Hex("../../etc/passwd")).toBe(false);
  });
});

describe("recordVerification / lookupVerification", () => {
  it("round-trips a record written for a hash", async () => {
    const { env } = makeMockEnv();
    const hash = "b".repeat(64);

    await recordVerification(env, hash, { signerCount: 2, completedAt: "2026-08-22T10:00:00Z" });
    const found = await lookupVerification(env, hash);

    expect(found).toEqual({ signerCount: 2, completedAt: "2026-08-22T10:00:00Z" });
  });

  it("is case-insensitive on the hash", async () => {
    const { env } = makeMockEnv();
    const hash = "C".repeat(64);

    await recordVerification(env, hash, { signerCount: 1, completedAt: "2026-08-22T10:00:00Z" });
    const found = await lookupVerification(env, hash.toLowerCase());

    expect(found?.signerCount).toBe(1);
  });

  it("returns null for a hash with no record", async () => {
    const { env } = makeMockEnv();
    expect(await lookupVerification(env, "d".repeat(64))).toBeNull();
  });

  it("returns null for a malformed hash without touching KV", async () => {
    const { env } = makeMockEnv();
    expect(await lookupVerification(env, "not-a-hash")).toBeNull();
  });
});

describe("recordOtsProof / lookupOtsProof", () => {
  it("round-trips proof bytes written for a hash", async () => {
    const { env } = makeMockEnv();
    const hash = "e".repeat(64);
    const proof = new Uint8Array([0, 79, 112, 101, 110, 84, 105, 109, 101]);

    await recordOtsProof(env, hash, proof);
    const found = await lookupOtsProof(env, hash);

    expect(found).toEqual(proof);
  });

  it("returns null when no proof has been stored for a hash", async () => {
    const { env } = makeMockEnv();
    expect(await lookupOtsProof(env, "f".repeat(64))).toBeNull();
  });

  it("returns null for a malformed hash without touching KV", async () => {
    const { env } = makeMockEnv();
    expect(await lookupOtsProof(env, "not-a-hash")).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { generateOpaqueToken, hashOpaqueToken } from "./authToken";

const SECRET = "test-secret";

describe("generateOpaqueToken", () => {
  it("produces a URL-safe token with no padding characters", () => {
    const token = generateOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces distinct tokens on each call", () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
  });
});

describe("hashOpaqueToken", () => {
  it("is deterministic for the same token and secret", async () => {
    const token = generateOpaqueToken();
    const a = await hashOpaqueToken(token, SECRET);
    const b = await hashOpaqueToken(token, SECRET);
    expect(a).toBe(b);
  });

  it("produces a 64-character hex string (SHA-256)", async () => {
    const hash = await hashOpaqueToken(generateOpaqueToken(), SECRET);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a different hash for a different secret", async () => {
    const token = generateOpaqueToken();
    const a = await hashOpaqueToken(token, SECRET);
    const b = await hashOpaqueToken(token, "different-secret");
    expect(a).not.toBe(b);
  });

  it("produces a different hash for a different token", async () => {
    const a = await hashOpaqueToken(generateOpaqueToken(), SECRET);
    const b = await hashOpaqueToken(generateOpaqueToken(), SECRET);
    expect(a).not.toBe(b);
  });
});

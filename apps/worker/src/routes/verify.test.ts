import { describe, it, expect } from "vitest";
import { verifyPublic } from "./verify";
import { recordVerification } from "../lib/verification";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

describe("GET /:hash", () => {
  it("returns found:true with the record for a known hash", async () => {
    const { env } = makeMockEnv();
    const hash = "e".repeat(64);
    await recordVerification(env, hash, { signerCount: 2, completedAt: "2026-08-22T10:00:00Z" });

    const res = await verifyPublic.request(`/${hash}`, {}, env, MOCK_CTX);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ found: true, signerCount: 2, completedAt: "2026-08-22T10:00:00Z" });
  });

  it("returns found:false for a well-formed hash with no record", async () => {
    const { env } = makeMockEnv();

    const res = await verifyPublic.request(`/${"f".repeat(64)}`, {}, env, MOCK_CTX);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ found: false });
  });

  it("rejects a malformed hash with 400 rather than querying KV", async () => {
    const { env } = makeMockEnv();

    const res = await verifyPublic.request("/not-a-real-hash", {}, env, MOCK_CTX);

    expect(res.status).toBe(400);
  });
});

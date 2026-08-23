import { describe, it, expect } from "vitest";
import { verifyPublic } from "./verify";
import { recordVerification, recordOtsProof } from "../lib/verification";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

describe("GET /:hash", () => {
  it("returns found:true with the record for a known hash", async () => {
    const { env } = makeMockEnv();
    const hash = "e".repeat(64);
    await recordVerification(env, hash, { signerCount: 2, completedAt: "2026-08-22T10:00:00Z" });

    const res = await verifyPublic.request(`/${hash}`, {}, env, MOCK_CTX);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      found: true,
      signerCount: 2,
      completedAt: "2026-08-22T10:00:00Z",
      hasOtsProof: false,
    });
  });

  it("reports hasOtsProof:true once a blockchain proof has been stored", async () => {
    const { env } = makeMockEnv();
    const hash = "1".repeat(64);
    await recordVerification(env, hash, { signerCount: 1, completedAt: "2026-08-22T10:00:00Z" });
    await recordOtsProof(env, hash, new Uint8Array([1, 2, 3]));

    const res = await verifyPublic.request(`/${hash}`, {}, env, MOCK_CTX);

    expect((await res.json()) as { hasOtsProof: boolean }).toMatchObject({ hasOtsProof: true });
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

describe("GET /:hash/ots", () => {
  it("returns the raw proof bytes with a download content-disposition", async () => {
    const { env } = makeMockEnv();
    const hash = "2".repeat(64);
    const proof = new Uint8Array([0, 79, 112, 101, 110]);
    await recordOtsProof(env, hash, proof);

    const res = await verifyPublic.request(`/${hash}/ots`, {}, env, MOCK_CTX);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("content-disposition")).toContain(`${hash}.ots`);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(proof);
  });

  it("returns 404 when no proof has been stored yet", async () => {
    const { env } = makeMockEnv();

    const res = await verifyPublic.request(`/${"3".repeat(64)}/ots`, {}, env, MOCK_CTX);

    expect(res.status).toBe(404);
  });

  it("rejects a malformed hash with 400", async () => {
    const { env } = makeMockEnv();

    const res = await verifyPublic.request("/not-a-real-hash/ots", {}, env, MOCK_CTX);

    expect(res.status).toBe(400);
  });
});

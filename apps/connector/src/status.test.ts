import { describe, it, expect } from "vitest";
import { checkStatus } from "./status";
import { signToken } from "@docracy/shared";
import type { ConnectorEnv } from "./types";

const TOKEN_SECRET = "test-secret";

function makeEnv(doc: unknown) {
  const store = new Map<string, string>();
  if (doc) store.set("doc:doc-1", JSON.stringify(doc));
  const kv = {
    get: async (key: string, type?: "json") => {
      const raw = store.get(key);
      if (raw === undefined) return null;
      return type === "json" ? JSON.parse(raw) : raw;
    },
  };
  return { DOCRACY_KV: kv as unknown as ConnectorEnv["DOCRACY_KV"], TOKEN_SECRET } as ConnectorEnv;
}

const sampleDoc = {
  docId: "doc-1",
  expiresAt: new Date(Date.now() + 99999999).toISOString(),
  status: "pending",
  signers: [
    { order: 2, name: "Max", status: "pending", signedAt: null },
    { order: 1, name: "Anna", status: "signed", signedAt: "2026-07-01T00:00:00.000Z" },
  ],
};

describe("checkStatus", () => {
  it("returns status for a bare token", async () => {
    const env = makeEnv(sampleDoc);
    const token = await signToken("doc-1", 1, TOKEN_SECRET);

    const result = await checkStatus(env, token);

    expect(result.found).toBe(true);
    expect(result.status).toBe("pending");
    expect(result.signers?.map((s) => s.order)).toEqual([1, 2]); // sorted
  });

  it("extracts the token from a full sign link", async () => {
    const env = makeEnv(sampleDoc);
    const token = await signToken("doc-1", 1, TOKEN_SECRET);

    const result = await checkStatus(env, `https://docracy.pages.dev/sign/${token}`);

    expect(result.found).toBe(true);
  });

  it("extracts the token from a full status link", async () => {
    const env = makeEnv(sampleDoc);
    const token = await signToken("doc-1", 0, TOKEN_SECRET);

    const result = await checkStatus(env, `https://docracy.pages.dev/status/${token}`);

    expect(result.found).toBe(true);
  });

  it("rejects a tampered or garbage link without leaking anything", async () => {
    const env = makeEnv(sampleDoc);

    const result = await checkStatus(env, "not-a-real-token");

    expect(result.found).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects a token signed with a different secret", async () => {
    const env = makeEnv(sampleDoc);
    const token = await signToken("doc-1", 1, "wrong-secret");

    const result = await checkStatus(env, token);

    expect(result.found).toBe(false);
  });

  it("reports not-found for an expired/deleted document even with a validly-signed token", async () => {
    const env = makeEnv(null); // KV has nothing — document already expired out of KV
    const token = await signToken("doc-1", 1, TOKEN_SECRET);

    const result = await checkStatus(env, token);

    expect(result.found).toBe(false);
    expect(result.error).toMatch(/expired|no longer exists/i);
  });

  it("reports not-found once expiresAt has passed, even though the worker's KV entry is kept a while longer for cleanup", async () => {
    const expiredDoc = { ...sampleDoc, expiresAt: new Date(Date.now() - 1000).toISOString() };
    const env = makeEnv(expiredDoc);
    const token = await signToken("doc-1", 1, TOKEN_SECRET);

    const result = await checkStatus(env, token);

    expect(result.found).toBe(false);
  });
});

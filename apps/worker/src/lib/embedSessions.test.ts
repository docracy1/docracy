import { describe, it, expect } from "vitest";
import { issueEmbedSession, resolveEmbedSession, normalizeAllowedOrigins } from "./embedSessions";
import { putDoc } from "./kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

function makeDoc(accountId: string): DocState {
  return {
    docId: "doc-embed-1",
    accountId,
    title: "Test",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 9 * 86400000).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers: [
      {
        order: 1,
        name: "Ada",
        email: "ada@example.com",
        status: "pending",
        signedAt: null,
        linkSentAt: new Date().toISOString(),
        remindersSent: [],
        linkNonce: "nonce-1",
      },
    ],
    fields: [],
  };
}

describe("normalizeAllowedOrigins", () => {
  it("accepts https origins without paths", () => {
    expect(normalizeAllowedOrigins(["https://app.example.com"])).toEqual(["https://app.example.com"]);
  });

  it("rejects paths and empty lists", () => {
    expect(normalizeAllowedOrigins([])).toEqual({ error: "At least one allowedOrigins entry is required" });
    expect(normalizeAllowedOrigins(["https://app.example.com/path"])).toMatchObject({ error: expect.stringContaining("valid origin") });
  });
});

describe("embed sessions", () => {
  it("issues and resolves a session to a signing token", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc("acct-1"));

    const issued = await issueEmbedSession({
      env,
      accountId: "acct-1",
      docId: "doc-embed-1",
      signerOrder: 1,
      allowedOrigins: ["https://partner.example"],
    });
    expect("embedToken" in issued).toBe(true);
    if (!("embedToken" in issued)) return;

    const resolved = await resolveEmbedSession(env, issued.embedToken);
    expect(resolved).not.toBeNull();
    expect(resolved!.docId).toBe("doc-embed-1");
    expect(resolved!.order).toBe(1);
    expect(resolved!.allowedOrigins).toEqual(["https://partner.example"]);
    expect(resolved!.signToken.split(".")).toHaveLength(3);
  });

  it("rejects sessions for another workspace's document", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc("acct-1"));
    const issued = await issueEmbedSession({
      env,
      accountId: "acct-other",
      docId: "doc-embed-1",
      signerOrder: 1,
      allowedOrigins: ["https://partner.example"],
    });
    expect(issued).toMatchObject({ status: 404 });
  });
});

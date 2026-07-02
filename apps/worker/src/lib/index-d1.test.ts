import { describe, it, expect } from "vitest";
import { reconcileD1Index } from "./index-d1";
import { putDoc } from "./kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

function makeDoc(overrides: Partial<DocState> = {}): DocState {
  return {
    docId: "doc-1",
    accountId: "acct-1",
    title: "Lease Agreement",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 99999999).toISOString(),
    completedAt: null,
    preparerSigns: false,
    status: "pending",
    signers: [
      { order: 1, name: "Anna", email: "anna@example.com", status: "signed", signedAt: new Date().toISOString(), linkSentAt: new Date().toISOString(), remindersSent: [] },
      { order: 2, name: "Max", email: "max@example.com", status: "pending", signedAt: null, linkSentAt: new Date().toISOString(), remindersSent: [] },
    ],
    fields: [],
    ...overrides,
  };
}

describe("reconcileD1Index", () => {
  it("backfills a document that was never indexed (e.g. a failed initial waitUntil write)", async () => {
    const { env, d1 } = makeMockEnv();
    await putDoc(env, makeDoc());

    await reconcileD1Index(env);

    const doc = await d1.prepare("SELECT * FROM documents WHERE doc_id = ?").bind("doc-1").first();
    expect(doc).toBeTruthy();
    const signers = (await d1.prepare('SELECT * FROM signers WHERE doc_id = ? ORDER BY "order"').bind("doc-1").all())
      .results as Array<{ status: string }>;
    expect(signers.map((s) => s.status)).toEqual(["signed", "pending"]);
  });

  it("skips anonymous (accountId: null) documents entirely", async () => {
    const { env, d1 } = makeMockEnv();
    await putDoc(env, makeDoc({ docId: "doc-anon", accountId: null, title: null }));

    await reconcileD1Index(env);

    const doc = await d1.prepare("SELECT * FROM documents WHERE doc_id = ?").bind("doc-anon").first();
    expect(doc).toBeNull();
  });

  it("corrects drift: updates a stale status already in D1 to match current KV state", async () => {
    const { env, d1 } = makeMockEnv();
    await putDoc(env, makeDoc({ status: "pending" }));
    await reconcileD1Index(env); // first pass: indexes as "pending"

    // Document completes in KV, but imagine the completion's D1 write failed (drift).
    const completed = makeDoc({
      status: "completed",
      completedAt: new Date().toISOString(),
      signers: [
        { order: 1, name: "Anna", email: "anna@example.com", status: "signed", signedAt: new Date().toISOString(), linkSentAt: new Date().toISOString(), remindersSent: [] },
        { order: 2, name: "Max", email: "max@example.com", status: "signed", signedAt: new Date().toISOString(), linkSentAt: new Date().toISOString(), remindersSent: [] },
      ],
    });
    await putDoc(env, completed);

    await reconcileD1Index(env); // second pass should correct the drift

    const doc = (await d1.prepare("SELECT status FROM documents WHERE doc_id = ?").bind("doc-1").first()) as {
      status: string;
    };
    expect(doc.status).toBe("completed");
    const signers = (await d1.prepare('SELECT status FROM signers WHERE doc_id = ? ORDER BY "order"').bind("doc-1").all())
      .results as Array<{ status: string }>;
    expect(signers.every((s) => s.status === "signed")).toBe(true);
  });

  it("does not throw when a single document's reconciliation fails", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc());
    (env as { DOCRACY_DB: unknown }).DOCRACY_DB = {
      prepare: () => {
        throw new Error("simulated D1 outage");
      },
      batch: async () => {
        throw new Error("simulated D1 outage");
      },
    };

    await expect(reconcileD1Index(env)).resolves.toBeUndefined();
  });
});

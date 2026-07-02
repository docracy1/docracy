import { describe, it, expect } from "vitest";
import { currentTurnOrder, isSignerOnTurn, getDoc } from "./kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState, Signer } from "@docracy/shared";

function makeSigner(order: number, status: Signer["status"]): Signer {
  return { order, name: `Signer ${order}`, email: "x@example.com", status, signedAt: null, linkSentAt: null, remindersSent: [] };
}

function makeDoc(signers: Signer[]): DocState {
  return {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers,
    fields: [],
  };
}

describe("currentTurnOrder", () => {
  it("is the first signer when nobody has signed", () => {
    const doc = makeDoc([makeSigner(1, "pending"), makeSigner(2, "pending")]);
    expect(currentTurnOrder(doc)).toBe(1);
  });

  it("advances to the next pending signer once the previous one signs", () => {
    const doc = makeDoc([makeSigner(1, "signed"), makeSigner(2, "pending"), makeSigner(3, "pending")]);
    expect(currentTurnOrder(doc)).toBe(2);
  });

  it("is null once everyone has signed", () => {
    const doc = makeDoc([makeSigner(1, "signed"), makeSigner(2, "signed")]);
    expect(currentTurnOrder(doc)).toBeNull();
  });

  it("does not skip ahead even if a later signer is somehow marked signed out of order", () => {
    // Defense in depth: order 2 shouldn't be treated as "done" while order 1 is still pending.
    const doc = makeDoc([makeSigner(1, "pending"), makeSigner(2, "signed")]);
    expect(currentTurnOrder(doc)).toBe(1);
  });
});

describe("isSignerOnTurn", () => {
  it("is true only for the current turn's order", () => {
    const doc = makeDoc([makeSigner(1, "signed"), makeSigner(2, "pending"), makeSigner(3, "pending")]);
    expect(isSignerOnTurn(doc, 1)).toBe(false);
    expect(isSignerOnTurn(doc, 2)).toBe(true);
    expect(isSignerOnTurn(doc, 3)).toBe(false);
  });
});

describe("getDoc", () => {
  it("returns null once expiresAt has passed, even though the KV entry itself is kept around longer for cleanup", async () => {
    // putDoc deliberately sets the raw KV TTL past expiresAt (see its CLEANUP_GRACE_SECONDS
    // comment) so the daily sweep has time to delete R2 blobs before KV purges the key. getDoc
    // must not let that grace period leak into "is this document still usable?".
    const { env, kv } = makeMockEnv();
    const doc = makeDoc([makeSigner(1, "pending")]);
    doc.expiresAt = new Date(Date.now() - 1000).toISOString();
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));
    expect(await getDoc(env, doc.docId)).toBeNull();
  });

  it("returns the document while expiresAt is still in the future", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc([makeSigner(1, "pending")]);
    doc.expiresAt = new Date(Date.now() + 99999999).toISOString();
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));
    expect(await getDoc(env, doc.docId)).not.toBeNull();
  });
});

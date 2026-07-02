import { describe, it, expect } from "vitest";
import { currentTurnOrder, isSignerOnTurn } from "./kv";
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

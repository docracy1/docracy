import { describe, it, expect } from "vitest";
import { cobroRemindDue, nextCobroRemindAt, isCobroDoc, DEFAULT_COBRO_REMIND_DAYS } from "./cobro";
import type { DocState } from "@docracy/shared";

function makeCobro(overrides: Partial<DocState> = {}): DocState {
  const now = Date.now();
  return {
    docId: "cobro-1",
    accountId: "acct-1",
    title: "Invoice 12",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 400 * 86400000).toISOString(),
    preparerSigns: false,
    status: "completed",
    completedAt: new Date(now).toISOString(),
    signers: [],
    fields: [],
    kind: "cobro",
    cobroRecipient: { name: "Ana", email: "ana@example.com" },
    cobroRemindEveryDays: DEFAULT_COBRO_REMIND_DAYS,
    cobroNextRemindAt: new Date(now - 1000).toISOString(),
    paymentRequest: { amount: "150", currency: "MXN", url: "https://paypal.me/studio/150" },
    ...overrides,
  };
}

describe("cobroRemindDue", () => {
  it("is due when next remind is in the past and the file is still in the vault", () => {
    expect(cobroRemindDue(makeCobro(), Date.now())).toBe(true);
  });

  it("is not due for signing documents", () => {
    expect(cobroRemindDue(makeCobro({ kind: undefined, signers: [{ order: 1, name: "A", email: "a@x.com", status: "signed", signedAt: null, linkSentAt: null, remindersSent: [] }] }), Date.now())).toBe(false);
  });

  it("is not due before cobroNextRemindAt", () => {
    const later = new Date(Date.now() + 86400000).toISOString();
    expect(cobroRemindDue(makeCobro({ cobroNextRemindAt: later }), Date.now())).toBe(false);
  });

  it("is not due after the sender marks it paid", () => {
    expect(cobroRemindDue(makeCobro({ cobroPaidAt: new Date().toISOString() }), Date.now())).toBe(false);
  });
});

describe("isCobroDoc", () => {
  it("treats kind=cobro or empty signers as pay-only", () => {
    expect(isCobroDoc(makeCobro())).toBe(true);
    expect(isCobroDoc({ kind: undefined, signers: [] })).toBe(true);
    expect(isCobroDoc({ kind: undefined, signers: [{ order: 1, name: "A", email: "a@x.com", status: "pending", signedAt: null, linkSentAt: null, remindersSent: [] }] })).toBe(false);
  });
});

describe("nextCobroRemindAt", () => {
  it("adds whole days", () => {
    const from = Date.UTC(2026, 0, 1);
    expect(nextCobroRemindAt(from, 30)).toBe(new Date(Date.UTC(2026, 0, 31)).toISOString());
  });
});

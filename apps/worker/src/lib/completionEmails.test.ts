import { describe, it, expect } from "vitest";
import { runCompletionEmailSweep, hoursBetween } from "./completionEmails";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState, Signer } from "@docracy/shared";

const HOUR = 60 * 60 * 1000;

function makeSigner(order: number, overrides: Partial<Signer> = {}): Signer {
  return {
    order,
    name: `Signer ${order}`,
    email: `signer${order}@example.com`,
    status: "pending",
    signedAt: null,
    linkSentAt: new Date().toISOString(),
    remindersSent: [],
    ...overrides,
  };
}

function makeDoc(docId: string, signers: Signer[], overrides: Partial<DocState> = {}): DocState {
  return {
    docId,
    accountId: null,
    title: "Test doc",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 99999999).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers,
    fields: [],
    preparerEmail: "preparer@example.com",
    ...overrides,
  };
}

describe("hoursBetween", () => {
  it("measures elapsed hours", () => {
    const from = new Date(Date.now() - 5 * HOUR).toISOString();
    expect(hoursBetween(from, Date.now())).toBeCloseTo(5, 1);
  });
});

describe("runCompletionEmailSweep", () => {
  it("sends the not-opened nudge once the link has sat unopened for 4+ hours", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-1", [makeSigner(1, { linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString() })]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent).toEqual(["not_opened"]);
  });

  it("does not send the not-opened nudge before 4 hours have passed", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-2", [makeSigner(1, { linkSentAt: new Date(Date.now() - 1 * HOUR).toISOString() })]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent ?? []).toEqual([]);
  });

  it("does not re-send the not-opened nudge on a later sweep", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-3", [
      makeSigner(1, { linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString(), completionNudgesSent: ["not_opened"] }),
    ]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent).toEqual(["not_opened"]);
  });

  it("sends the viewed-not-signed nudge 24+ hours after the signer's first view", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-4", [
      makeSigner(1, {
        linkSentAt: new Date(Date.now() - 30 * HOUR).toISOString(),
        viewedAt: new Date(Date.now() - 25 * HOUR).toISOString(),
      }),
    ]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent).toEqual(["viewed_not_signed"]);
  });

  it("does not send the viewed-not-signed nudge before 24 hours since viewing", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-5", [
      makeSigner(1, {
        linkSentAt: new Date(Date.now() - 10 * HOUR).toISOString(),
        viewedAt: new Date(Date.now() - 5 * HOUR).toISOString(),
      }),
    ]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent ?? []).toEqual([]);
  });

  it("sends no nudge at all once the signer has signed", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-6", [
      makeSigner(1, {
        status: "signed",
        signedAt: new Date().toISOString(),
        linkSentAt: new Date(Date.now() - 30 * HOUR).toISOString(),
        viewedAt: new Date(Date.now() - 29 * HOUR).toISOString(),
      }),
    ]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent ?? []).toEqual([]);
  });

  it("skips documents with no preparerEmail set", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc(
      "doc-7",
      [makeSigner(1, { linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString() })],
      { preparerEmail: undefined }
    );
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent ?? []).toEqual([]);
  });

  it("in parallel mode, nudges every still-pending signer independently", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc(
      "doc-8",
      [
        makeSigner(1, { linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString() }),
        makeSigner(2, { linkSentAt: new Date(Date.now() - 1 * HOUR).toISOString() }),
      ],
      { signingMode: "parallel" }
    );
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    const stored = JSON.parse(kv._store.get(`doc:${doc.docId}`)!) as DocState;
    expect(stored.signers[0].completionNudgesSent).toEqual(["not_opened"]);
    expect(stored.signers[1].completionNudgesSent ?? []).toEqual([]);
  });
});

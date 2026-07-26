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

async function nudgesFor(docId: string, kv: ReturnType<typeof makeMockEnv>["kv"], order = 1) {
  const stored = JSON.parse(kv._store.get(`doc:${docId}`)!) as DocState;
  return stored.signers.find((s) => s.order === order)!.completionNudgesSent ?? [];
}

describe("hoursBetween", () => {
  it("measures elapsed hours", () => {
    const from = new Date(Date.now() - 5 * HOUR).toISOString();
    expect(hoursBetween(from, Date.now())).toBeCloseTo(5, 1);
  });
});

describe("runCompletionEmailSweep — preparer email nudges", () => {
  it("sends the not-opened nudge once the link has sat unopened for 4+ hours", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-1", [makeSigner(1, { linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString() })]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    // 5h also clears both analytics checkpoints (2h/4h thresholds) alongside the email nudge.
    expect(await nudgesFor("doc-1", kv)).toEqual(["analytics_not_opened_2h", "analytics_not_signed_4h", "not_opened"]);
  });

  it("does not send the not-opened nudge before 4 hours have passed", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-2", [makeSigner(1, { linkSentAt: new Date(Date.now() - 1 * HOUR).toISOString() })]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    expect(await nudgesFor("doc-2", kv)).toEqual([]);
  });

  it("does not re-send the not-opened nudge on a later sweep", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-3", [
      makeSigner(1, { linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString(), completionNudgesSent: ["not_opened"] }),
    ]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    // The email nudge itself doesn't re-fire, but the (separate) analytics checkpoints still do —
    // they hadn't been logged yet for this signer.
    expect(await nudgesFor("doc-3", kv)).toEqual(["not_opened", "analytics_not_opened_2h", "analytics_not_signed_4h"]);
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

    // Already viewed, so only the not-signed analytics checkpoint applies (not not-opened).
    expect(await nudgesFor("doc-4", kv)).toEqual(["analytics_not_signed_4h", "viewed_not_signed"]);
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

    // Too soon for the 24h email nudge, but the 4h not-signed analytics checkpoint already applies.
    expect(await nudgesFor("doc-5", kv)).toEqual(["analytics_not_signed_4h"]);
  });

  it("sends no nudge and logs no checkpoint once the signer has signed", async () => {
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

    expect(await nudgesFor("doc-6", kv)).toEqual([]);
  });

  it("skips the preparer email nudge for documents with no preparerEmail set, but still logs analytics checkpoints", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc(
      "doc-7",
      [makeSigner(1, { linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString() })],
      { preparerEmail: undefined }
    );
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    expect(await nudgesFor("doc-7", kv)).toEqual(["analytics_not_opened_2h", "analytics_not_signed_4h"]);
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

    expect(await nudgesFor("doc-8", kv, 1)).toEqual(["analytics_not_opened_2h", "analytics_not_signed_4h", "not_opened"]);
    expect(await nudgesFor("doc-8", kv, 2)).toEqual([]);
  });
});

describe("runCompletionEmailSweep — analytics-only checkpoints", () => {
  it("does not log document_not_opened_after_2h before 2 hours have passed", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-9", [makeSigner(1, { linkSentAt: new Date(Date.now() - 1 * HOUR).toISOString() })]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    expect(await nudgesFor("doc-9", kv)).toEqual([]);
  });

  it("does not re-log a checkpoint already marked on a previous sweep", async () => {
    const { env, kv } = makeMockEnv();
    const doc = makeDoc("doc-10", [
      makeSigner(1, {
        linkSentAt: new Date(Date.now() - 5 * HOUR).toISOString(),
        completionNudgesSent: ["analytics_not_opened_2h", "analytics_not_signed_4h", "not_opened"],
      }),
    ]);
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));

    await runCompletionEmailSweep(env);

    expect(await nudgesFor("doc-10", kv)).toEqual(["analytics_not_opened_2h", "analytics_not_signed_4h", "not_opened"]);
  });
});

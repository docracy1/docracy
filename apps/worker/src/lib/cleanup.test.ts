import { describe, it, expect } from "vitest";
import { runExpiredDocCleanup } from "./cleanup";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import type { DocState, Signer } from "@docracy/shared";

function makeSigner(order: number): Signer {
  return { order, name: `Signer ${order}`, email: "x@example.com", status: "pending", signedAt: null, linkSentAt: null, remindersSent: [] };
}

function makeDoc(docId: string, expiresAt: string): DocState {
  return {
    docId,
    accountId: null,
    title: null,
    createdAt: new Date().toISOString(),
    expiresAt,
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers: [makeSigner(1)],
    fields: [],
  };
}

describe("runExpiredDocCleanup", () => {
  it("deletes R2 blobs and the KV entry for a doc past its expiresAt", async () => {
    const { env, kv, r2 } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const doc = makeDoc("expired-doc", new Date(Date.now() - 1000).toISOString());
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));
    await r2._store.set(`docs/${doc.docId}/original.pdf`, pdf);
    await r2._store.set(`docs/${doc.docId}/working.pdf`, pdf);

    await runExpiredDocCleanup(env);

    expect(kv._store.has(`doc:${doc.docId}`)).toBe(false);
    expect(r2._store.has(`docs/${doc.docId}/original.pdf`)).toBe(false);
    expect(r2._store.has(`docs/${doc.docId}/working.pdf`)).toBe(false);
  });

  it("leaves a doc that hasn't expired yet untouched", async () => {
    const { env, kv, r2 } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const doc = makeDoc("active-doc", new Date(Date.now() + 99999999).toISOString());
    await kv._store.set(`doc:${doc.docId}`, JSON.stringify(doc));
    await r2._store.set(`docs/${doc.docId}/original.pdf`, pdf);

    await runExpiredDocCleanup(env);

    expect(kv._store.has(`doc:${doc.docId}`)).toBe(true);
    expect(r2._store.has(`docs/${doc.docId}/original.pdf`)).toBe(true);
  });

  it("doesn't touch other docs' blobs when cleaning up one expired doc", async () => {
    const { env, kv, r2 } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const expired = makeDoc("expired-doc", new Date(Date.now() - 1000).toISOString());
    const active = makeDoc("active-doc", new Date(Date.now() + 99999999).toISOString());
    await kv._store.set(`doc:${expired.docId}`, JSON.stringify(expired));
    await kv._store.set(`doc:${active.docId}`, JSON.stringify(active));
    await r2._store.set(`docs/${expired.docId}/original.pdf`, pdf);
    await r2._store.set(`docs/${active.docId}/original.pdf`, pdf);

    await runExpiredDocCleanup(env);

    expect(r2._store.has(`docs/${expired.docId}/original.pdf`)).toBe(false);
    expect(r2._store.has(`docs/${active.docId}/original.pdf`)).toBe(true);
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { createDocumentCore } from "./documentCreation";
import { sha256Hex } from "./hash";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

function makeCtx() {
  const promises: Promise<unknown>[] = [];
  return {
    waitUntil: (p: Promise<unknown>) => {
      promises.push(p);
    },
    flush: () => Promise.all(promises),
  };
}

const baseParams = {
  filename: "contract.pdf",
  preparerSigns: false,
  signers: [
    { name: "Anna", email: "anna@example.com" },
    { name: "Max", email: "max@example.com" },
  ],
  fields: [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }],
};

describe("createDocumentCore — anonymous path (accountId: null)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes KV/R2 exactly as before and touches no D1 tables", async () => {
    const { env, kv, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    const { docId, statusToken } = await createDocumentCore({
      env,
      ctx,
      pdfBytes,
      accountId: null,
      ...baseParams,
    });
    await ctx.flush();

    expect(docId).toBeTruthy();
    expect(statusToken).toBeTruthy();
    expect([...kv._store.keys()].filter((k) => k.startsWith("doc:"))).toHaveLength(1);

    const docsRow = await d1.prepare("SELECT COUNT(*) as n FROM documents").first();
    const signersRow = await d1.prepare("SELECT COUNT(*) as n FROM signers").first();
    const auditRow = await d1.prepare("SELECT COUNT(*) as n FROM audit_events").first();
    expect((docsRow as { n: number }).n).toBe(0);
    expect((signersRow as { n: number }).n).toBe(0);
    expect((auditRow as { n: number }).n).toBe(0);
  });

  it("resolves without waiting for a stalled signing-invite email (fire-and-forget via ctx.waitUntil)", async () => {
    const { env } = makeMockEnv({ RESEND_API_KEY: "test-key" });
    let resolveFetch: (() => void) | undefined;
    const hangingFetch = new Promise<Response>((resolve) => {
      resolveFetch = () => resolve(new Response("{}", { status: 200 }));
    });
    vi.spyOn(global, "fetch").mockReturnValue(hangingFetch);
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    const result = await Promise.race([
      createDocumentCore({ env, ctx, pdfBytes, accountId: null, ...baseParams }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("createDocumentCore did not resolve promptly — it's blocking on the email send")), 200)
      ),
    ]);

    expect(result.docId).toBeTruthy();
    resolveFetch?.();
    await ctx.flush();
  });

  it("records a KV-resident 'created' + 'invite_sent' event even with no account/D1 involved", async () => {
    const { env, kv } = makeMockEnv();
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();
    const expectedHash = await sha256Hex(pdfBytes);

    const { docId } = await createDocumentCore({
      env,
      ctx,
      pdfBytes,
      accountId: null,
      creatorIp: "9.9.9.9",
      ...baseParams,
    });
    await ctx.flush();

    const stored = JSON.parse(kv._store.get(`doc:${docId}`)!) as DocState;
    expect(stored.events).toHaveLength(2);
    expect(stored.events![0]).toMatchObject({ type: "created", ip: "9.9.9.9", pdfSha256: expectedHash });
    expect(stored.events![1]).toMatchObject({ type: "invite_sent", signerOrder: 1 });
  });
});

describe("createDocumentCore — parallel signing mode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("invites every signer at once, rather than just the first", async () => {
    const { env, kv } = makeMockEnv();
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    const { docId } = await createDocumentCore({
      env,
      ctx,
      pdfBytes,
      accountId: null,
      signingMode: "parallel",
      ...baseParams,
    });
    await ctx.flush();

    const stored = JSON.parse(kv._store.get(`doc:${docId}`)!) as DocState;
    expect(stored.signingMode).toBe("parallel");
    expect(stored.signers.every((s) => s.linkSentAt !== null)).toBe(true);

    const inviteEvents = stored.events!.filter((e) => e.type === "invite_sent");
    expect(inviteEvents.map((e) => e.signerOrder).sort()).toEqual([1, 2]);
  });

  it("sends a signing-invite email to every signer, not just the first", async () => {
    const { env } = makeMockEnv({ RESEND_API_KEY: "test-key" });
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    await createDocumentCore({
      env,
      ctx,
      pdfBytes,
      accountId: null,
      signingMode: "parallel",
      ...baseParams,
    });
    await ctx.flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("defaults to sequential (only the first signer invited) when signingMode is omitted", async () => {
    const { env, kv } = makeMockEnv();
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    const { docId } = await createDocumentCore({
      env,
      ctx,
      pdfBytes,
      accountId: null,
      ...baseParams,
    });
    await ctx.flush();

    const stored = JSON.parse(kv._store.get(`doc:${docId}`)!) as DocState;
    expect(stored.signingMode).toBe("sequential");
    expect(stored.signers[0].linkSentAt).not.toBeNull();
    expect(stored.signers[1].linkSentAt).toBeNull();
  });
});

describe("createDocumentCore — account-linked path", () => {
  it("indexes the document, signers, initial version, and audit events in D1", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    const { docId } = await createDocumentCore({
      env,
      ctx,
      pdfBytes,
      accountId: "acct-1",
      title: "My Lease",
      ...baseParams,
    });
    await ctx.flush();

    const doc = (await d1.prepare("SELECT * FROM documents WHERE doc_id = ?").bind(docId).first()) as {
      account_id: string;
      title: string;
      status: string;
    };
    expect(doc.account_id).toBe("acct-1");
    expect(doc.title).toBe("My Lease");
    expect(doc.status).toBe("pending");

    const signers = (await d1.prepare("SELECT * FROM signers WHERE doc_id = ? ORDER BY \"order\"").bind(docId).all())
      .results as Array<{ name: string; order: number }>;
    expect(signers.map((s) => s.name)).toEqual(["Anna", "Max"]);

    const versions = (await d1.prepare("SELECT * FROM document_versions WHERE doc_id = ?").bind(docId).all()).results;
    expect(versions).toHaveLength(1);

    const events = (await d1.prepare("SELECT event_type FROM audit_events WHERE doc_id = ?").bind(docId).all())
      .results as Array<{ event_type: string }>;
    expect(events.map((e) => e.event_type).sort()).toEqual(["created", "invite_sent"]);
  });

  it("defaults the title to the filename when none is given", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    const { docId } = await createDocumentCore({ env, ctx, pdfBytes, accountId: "acct-1", ...baseParams });
    await ctx.flush();

    const doc = (await d1.prepare("SELECT title FROM documents WHERE doc_id = ?").bind(docId).first()) as {
      title: string;
    };
    expect(doc.title).toBe("contract.pdf");
  });

  it("a D1 failure does not prevent document creation from succeeding", async () => {
    const { env } = makeMockEnv();
    // Simulate an outage: DOCRACY_DB throws on every call.
    (env as { DOCRACY_DB: unknown }).DOCRACY_DB = {
      prepare: () => {
        throw new Error("simulated D1 outage");
      },
      batch: async () => {
        throw new Error("simulated D1 outage");
      },
    };
    const ctx = makeCtx();
    const pdfBytes = await makeValidPdfBytes();

    const { docId } = await createDocumentCore({ env, ctx, pdfBytes, accountId: "acct-1", ...baseParams });
    await ctx.flush(); // should resolve (the error is caught internally), not throw

    expect(docId).toBeTruthy();
  });
});

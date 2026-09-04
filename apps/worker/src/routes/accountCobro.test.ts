import { describe, it, expect, vi, afterEach } from "vitest";
import account from "./account";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import { putDoc } from "../lib/kv";
import type { DocState } from "@docracy/shared";

function makeCtx() {
  const promises: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => {
      promises.push(p);
    },
    passThroughOnException: () => {},
    flush: () => Promise.all(promises),
  };
  return ctx as unknown as ExecutionContext & { flush: () => Promise<unknown[]> };
}

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function buildForm(pdfBytes: Uint8Array, meta: object) {
  const form = new FormData();
  form.set("pdf", new File([pdfBytes], "invoice.pdf", { type: "application/pdf" }));
  form.set("meta", JSON.stringify(meta));
  return form;
}

const validCobroMeta = {
  title: "March invoice",
  recipientName: "Ana Ruiz",
  recipientEmail: "ana@estudio.mx",
  paymentRequest: { amount: "150.00", currency: "MXN", url: "https://paypal.me/studio/150" },
  locale: "es" as const,
};

describe("GET /api/account/tax-year", () => {
  it("402s for a free account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-free", "free@example.com", false, false, null, null);
    const res = await account.request(
      "/tax-year?year=2026",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("lists completed docs in that calendar year and hydrates pay fields from KV", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "paid@example.com", true, false, null, null);

    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at)
         VALUES (?, ?, ?, 'completed', 0, ?, ?, ?)`
      )
      .bind("doc-in", "acct-1", "W-9 Ana", "2026-02-01T00:00:00Z", "2026-03-15T12:00:00Z", "2027-04-15T00:00:00Z")
      .run();
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at)
         VALUES (?, ?, ?, 'completed', 0, ?, ?, ?)`
      )
      .bind("doc-out", "acct-1", "Old year", "2025-12-01T00:00:00Z", "2025-12-20T00:00:00Z", "2026-04-15T00:00:00Z")
      .run();
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at)
         VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)`
      )
      .bind("doc-pending", "acct-1", "Not done", "2026-04-01T00:00:00Z", null, "2027-04-15T00:00:00Z")
      .run();

    const kvDoc: DocState = {
      docId: "doc-in",
      accountId: "acct-1",
      title: "W-9 Ana",
      createdAt: "2026-02-01T00:00:00Z",
      expiresAt: "2027-04-15T00:00:00Z",
      preparerSigns: false,
      status: "completed",
      completedAt: "2026-03-15T12:00:00Z",
      signers: [{ order: 1, name: "Ana Ruiz", email: "ana@estudio.mx", status: "signed", signedAt: "2026-03-15T12:00:00Z", linkSentAt: null, remindersSent: [] }],
      fields: [],
      paymentRequest: { amount: "2000", currency: "USD", url: "https://paypal.me/studio/2000" },
    };
    await putDoc(env, kvDoc);

    const res = await account.request(
      "/tax-year?year=2026",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: {
      year: number;
      documents: Array<{ docId: string; amount: string; counterparties: Array<{ name: string }> }>;
      shareUrl?: string;
      shareToken?: string;
    } = await res.json();
    expect(body.year).toBe(2026);
    expect(body.documents.map((d) => d.docId)).toEqual(["doc-in"]);
    expect(body.shareUrl).toContain("/1099-season/");
    expect(body.shareToken).toBeTruthy();
    expect(body.documents[0].amount).toBe("2000");
    expect(body.documents[0].counterparties[0].name).toBe("Ana Ruiz");
  });
});

describe("POST /api/account/cobro", () => {
  it("402s for a free account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-free", "free@example.com", false, false, null, null);
    const pdf = await makeValidPdfBytes();
    const res = await account.request(
      "/cobro",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` }, body: buildForm(pdf, validCobroMeta) },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("creates a completed cobro with no signers and copies final.pdf", async () => {
    const { env, kv, r2 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-paid", "paid@example.com", true, false, null, null);
    const pdf = await makeValidPdfBytes();
    const res = await account.request(
      "/cobro",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` }, body: buildForm(pdf, validCobroMeta) },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { docId: string; statusToken: string } = await res.json();
    expect(body.docId).toBeTruthy();
    expect(body.statusToken).toBeTruthy();

    const [, raw] = [...kv._store.entries()].find(([k]) => k.startsWith("doc:"))!;
    const stored = JSON.parse(raw);
    expect(stored.kind).toBe("cobro");
    expect(stored.status).toBe("completed");
    expect(stored.signers).toEqual([]);
    expect(stored.paymentRequest.amount).toBe("150.00");
    expect(r2._store.has(`docs/${body.docId}/final.pdf`)).toBe(true);
  });

  it("rejects a cobro with neither email nor WhatsApp", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-paid", "paid@example.com", true, false, null, null);
    const pdf = await makeValidPdfBytes();
    const res = await account.request(
      "/cobro",
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: buildForm(pdf, { ...validCobroMeta, recipientEmail: "", recipientWhatsapp: "" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects http payment URLs", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-paid", "paid@example.com", true, false, null, null);
    const pdf = await makeValidPdfBytes();
    const res = await account.request(
      "/cobro",
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: buildForm(pdf, {
          ...validCobroMeta,
          paymentRequest: { amount: "10", currency: "USD", url: "http://evil.example/pay" },
        }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/account/cobro/:docId/remind", () => {
  afterEach(() => vi.restoreAllMocks());

  it("re-sends and bumps nextRemindAt", async () => {
    const { env, kv } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-paid", "paid@example.com", true, false, null, null);
    const now = Date.now();
    const doc: DocState = {
      docId: "cobro-1",
      accountId: "acct-paid",
      title: "Invoice",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 400 * 86400000).toISOString(),
      preparerSigns: false,
      status: "completed",
      completedAt: new Date(now).toISOString(),
      signers: [],
      fields: [],
      kind: "cobro",
      cobroRecipient: { name: "Ana", email: "ana@estudio.mx" },
      cobroRemindEveryDays: 30,
      cobroNextRemindAt: new Date(now - 1000).toISOString(),
      paymentRequest: { amount: "10", currency: "USD", url: "https://paypal.me/x/10" },
      locale: "en",
    };
    await putDoc(env, doc);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await account.request(
      "/cobro/cobro-1/remind",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const stored = JSON.parse(kv._store.get("doc:cobro-1") as string);
    expect(stored.cobroLastRemindAt).toBeTruthy();
    expect(new Date(stored.cobroNextRemindAt).getTime()).toBeGreaterThan(now);
    expect(spy.mock.calls.map((c) => c.join(" ")).join("\n")).toContain("ana@estudio.mx");
  });
});

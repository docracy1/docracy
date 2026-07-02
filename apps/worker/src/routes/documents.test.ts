import { describe, it, expect } from "vitest";
import documents from "./documents";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function buildForm(pdfBytes: Uint8Array, meta: object) {
  const form = new FormData();
  form.set("pdf", new File([pdfBytes], "doc.pdf", { type: "application/pdf" }));
  form.set("meta", JSON.stringify(meta));
  return form;
}

const validMeta = {
  preparerSigns: false,
  signers: [
    { order: 1, name: "Anna", email: "anna@example.com" },
    { order: 2, name: "Max", email: "max@example.com" },
  ],
  fields: [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05, type: "signature" }],
};

describe("POST /api/documents", () => {
  it("creates a document and emails the first signer", async () => {
    const { env, kv } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, validMeta) }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { docId: string; statusToken: string } = await res.json();
    expect(body.docId).toBeTruthy();
    expect(body.statusToken).toBeTruthy();
    const docKeys = [...kv._store.keys()].filter((k) => k.startsWith("doc:"));
    expect(docKeys).toHaveLength(1);
  });

  it("rejects a non-PDF file", async () => {
    const { env } = makeMockEnv();
    const res = await documents.request(
      "/",
      { method: "POST", body: buildForm(new TextEncoder().encode("not a pdf"), validMeta) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("rejects an oversized PDF", async () => {
    const { env } = makeMockEnv();
    const big = new Uint8Array(16 * 1024 * 1024);
    big.set(new TextEncoder().encode("%PDF-"));
    const res = await documents.request("/", { method: "POST", body: buildForm(big, validMeta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects an invalid signer email", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, signers: [{ order: 1, name: "Anna", email: "not-an-email" }] };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects duplicate signer emails", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = {
      ...validMeta,
      signers: [
        { order: 1, name: "Anna", email: "same@example.com" },
        { order: 2, name: "Max", email: "same@example.com" },
      ],
    };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects a field assigned to a signer that doesn't exist", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, fields: [{ ...validMeta.fields[0], signerOrder: 99 }] };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects more signers than the free tier allows", async () => {
    const { env } = makeMockEnv({ FREE_TIER_MAX_SIGNERS: "2" });
    const pdf = await makeValidPdfBytes();
    const meta = {
      ...validMeta,
      signers: [
        { order: 1, name: "A", email: "a@example.com" },
        { order: 2, name: "B", email: "b@example.com" },
        { order: 3, name: "C", email: "c@example.com" },
      ],
    };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(402);
  });

  it("re-derives signer order from array position, ignoring a tampered client-sent order", async () => {
    const { env, kv } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = {
      ...validMeta,
      signers: [
        { order: 99, name: "Anna", email: "anna@example.com" },
        { order: 99, name: "Max", email: "max@example.com" },
      ],
    };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const [, docValue] = [...kv._store.entries()].find(([k]) => k.startsWith("doc:"))!;
    const stored = JSON.parse(docValue);
    expect(stored.signers.map((s: { order: number }) => s.order)).toEqual([1, 2]);
  });

  it("enforces a per-IP rate limit", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    for (let i = 0; i < 10; i++) {
      const res = await documents.request(
        "/",
        { method: "POST", headers: { "CF-Connecting-IP": "1.2.3.4" }, body: buildForm(pdf, validMeta) },
        env,
        MOCK_CTX
      );
      expect(res.status).toBe(200);
    }
    const blocked = await documents.request(
      "/",
      { method: "POST", headers: { "CF-Connecting-IP": "1.2.3.4" }, body: buildForm(pdf, validMeta) },
      env,
      MOCK_CTX
    );
    expect(blocked.status).toBe(429);
  });
});

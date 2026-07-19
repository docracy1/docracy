import { describe, it, expect } from "vitest";
import documents from "./documents";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";

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
  fields: [
    { id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 },
    { id: "f2", signerOrder: 2, page: 0, xFrac: 0.1, yFrac: 0.5, wFrac: 0.2, hFrac: 0.05 },
  ],
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

  it("rejects a signer PIN that isn't 4-8 digits", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, signers: [{ ...validMeta.signers[0], pin: "12" }, validMeta.signers[1]] };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("hashes a valid signer PIN and never stores it raw", async () => {
    const { env, kv } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, signers: [{ ...validMeta.signers[0], pin: "1234" }, validMeta.signers[1]] };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const [, docValue] = [...kv._store.entries()].find(([k]) => k.startsWith("doc:"))!;
    const stored = JSON.parse(docValue);
    expect(stored.signers[0].pinHash).toBeTruthy();
    expect(stored.signers[0].pinHash).not.toBe("1234");
    expect(docValue).not.toContain("1234");
  });

  it("rejects a field with an unrecognized type", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, fields: [{ ...validMeta.fields[0], type: "checkbox" }] };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("accepts text/date/initials field types alongside signature", async () => {
    const { env, kv } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = {
      ...validMeta,
      fields: [
        { ...validMeta.fields[0], type: "text" },
        { ...validMeta.fields[1], type: "date" },
      ],
    };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const [, docValue] = [...kv._store.entries()].find(([k]) => k.startsWith("doc:"))!;
    const stored = JSON.parse(docValue);
    expect(stored.fields.map((f: { type: string }) => f.type)).toEqual(["text", "date"]);
  });

  it("rejects a document where a signer has no field at all", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    // Only signer 1 gets a field — signer 2 (Max) has nothing to sign.
    const meta = { ...validMeta, fields: [validMeta.fields[0]] };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
    const body: { error: string } = await res.json();
    expect(body.error).toMatch(/Max/);
  });

  it("rejects a custom subject over the length cap", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, customSubject: "x".repeat(151) };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects a custom message over the length cap", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, customMessage: "x".repeat(1001) };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("stores a valid custom subject/message on the doc", async () => {
    const { env, kv } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const meta = { ...validMeta, customSubject: "Please sign", customMessage: "Sign by Friday" };
    const res = await documents.request("/", { method: "POST", body: buildForm(pdf, meta) }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const [, docValue] = [...kv._store.entries()].find(([k]) => k.startsWith("doc:"))!;
    const stored = JSON.parse(docValue);
    expect(stored.customSubject).toBe("Please sign");
    expect(stored.customMessage).toBe("Sign by Friday");
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
    // Distinct signer emails per iteration so this only exercises the per-IP limit, not the
    // separate per-recipient-email invite limit (which caps at a lower number — see
    // "enforces a per-recipient-email invite limit" below).
    const metaFor = (i: number) => ({
      ...validMeta,
      signers: [
        { order: 1, name: "Anna", email: `anna${i}@example.com` },
        { order: 2, name: "Max", email: `max${i}@example.com` },
      ],
    });
    for (let i = 0; i < 10; i++) {
      const res = await documents.request(
        "/",
        { method: "POST", headers: { "CF-Connecting-IP": "1.2.3.4" }, body: buildForm(pdf, metaFor(i)) },
        env,
        MOCK_CTX
      );
      expect(res.status).toBe(200);
    }
    const blocked = await documents.request(
      "/",
      { method: "POST", headers: { "CF-Connecting-IP": "1.2.3.4" }, body: buildForm(pdf, metaFor(10)) },
      env,
      MOCK_CTX
    );
    expect(blocked.status).toBe(429);
  });

  it("enforces a per-recipient-email invite limit", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    // Distinct IPs per iteration so this only exercises the per-recipient-email limit, not the
    // per-IP creation limit above.
    for (let i = 0; i < 5; i++) {
      const res = await documents.request(
        "/",
        { method: "POST", headers: { "CF-Connecting-IP": `10.0.0.${i}` }, body: buildForm(pdf, validMeta) },
        env,
        MOCK_CTX
      );
      expect(res.status).toBe(200);
    }
    const blocked = await documents.request(
      "/",
      { method: "POST", headers: { "CF-Connecting-IP": "10.0.0.99" }, body: buildForm(pdf, validMeta) },
      env,
      MOCK_CTX
    );
    expect(blocked.status).toBe(429);
  });

  it("lets a paid account exceed the free-tier signer limit and attaches its accountId", async () => {
    const { env, kv } = makeMockEnv();
    const ctx = makeCtx();
    const sessionToken = await createSession(env, ctx, "acct-1", "paid@example.com", true, null, null);
    await ctx.flush();

    const pdf = await makeValidPdfBytes();
    const meta = {
      ...validMeta,
      signers: [
        { order: 1, name: "A", email: "a@example.com" },
        { order: 2, name: "B", email: "b@example.com" },
        { order: 3, name: "C", email: "c@example.com" },
      ],
      fields: [
        ...validMeta.fields,
        { id: "f3", signerOrder: 3, page: 0, xFrac: 0.1, yFrac: 0.7, wFrac: 0.2, hFrac: 0.05 },
      ],
    };
    const res = await documents.request(
      "/",
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` },
        body: buildForm(pdf, meta),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);

    const [, docValue] = [...kv._store.entries()].find(([k]) => k.startsWith("doc:"))!;
    const stored = JSON.parse(docValue);
    expect(stored.accountId).toBe("acct-1");
  });

  it("still applies the free-tier cap and leaves accountId null for a logged-in but unpaid account", async () => {
    const { env, kv } = makeMockEnv();
    const ctx = makeCtx();
    const sessionToken = await createSession(env, ctx, "acct-2", "unpaid@example.com", false, null, null);
    await ctx.flush();

    const pdf = await makeValidPdfBytes();
    const overLimitMeta = {
      ...validMeta,
      signers: [
        { order: 1, name: "A", email: "a@example.com" },
        { order: 2, name: "B", email: "b@example.com" },
        { order: 3, name: "C", email: "c@example.com" },
      ],
    };
    const blocked = await documents.request(
      "/",
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` },
        body: buildForm(pdf, overLimitMeta),
      },
      env,
      ctx
    );
    expect(blocked.status).toBe(402);

    const withinLimit = await documents.request(
      "/",
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` },
        body: buildForm(pdf, validMeta),
      },
      env,
      ctx
    );
    expect(withinLimit.status).toBe(200);

    const [, docValue] = [...kv._store.entries()].find(([k]) => k.startsWith("doc:"))!;
    const stored = JSON.parse(docValue);
    expect(stored.accountId).toBeNull();
  });
});

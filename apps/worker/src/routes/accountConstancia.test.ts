import { describe, it, expect } from "vitest";
import account from "./account";
import constancia from "./constancia";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import { putDoc } from "../lib/kv";
import { signConstanciaToken, signToken } from "@docracy/shared";
import { putConstanciaProfile } from "../lib/constancia";
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

async function seedCompletedDoc(
  env: ReturnType<typeof makeMockEnv>["env"],
  d1: ReturnType<typeof makeMockEnv>["d1"]
) {
  await d1
    .prepare(
      `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at)
       VALUES (?, ?, ?, 'completed', 0, ?, ?, ?)`
    )
    .bind("doc-in", "acct-1", "Cobro Ana", "2026-02-01T00:00:00Z", "2026-03-15T12:00:00Z", "2027-04-15T00:00:00Z")
    .run();
  const kvDoc: DocState = {
    docId: "doc-in",
    accountId: "acct-1",
    title: "Cobro Ana",
    createdAt: "2026-02-01T00:00:00Z",
    expiresAt: "2027-04-15T00:00:00Z",
    preparerSigns: false,
    status: "completed",
    completedAt: "2026-03-15T12:00:00Z",
    signers: [],
    fields: [],
    kind: "cobro",
    cobroRecipient: { name: "Ana Ruiz", email: "ana@estudio.mx" },
    paymentRequest: { amount: "150.00", currency: "MXN", url: "https://paypal.me/studio/150" },
  };
  await putDoc(env, kvDoc);
}

describe("GET /api/account/constancia", () => {
  it("402s for a free account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-free", "free@example.com", false, false, null, null);
    const res = await account.request(
      "/constancia?year=2026",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("returns a share token, totals, and completed docs for the year", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "paid@example.com", true, false, null, null);
    await seedCompletedDoc(env, d1);
    await putConstanciaProfile(env, "acct-1", "Ana Ruiz");

    const res = await account.request(
      "/constancia?year=2026&locale=es",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: {
      year: number;
      subjectName: string;
      shareToken: string;
      shareUrl: string;
      documents: Array<{ docId: string; amount: string }>;
      totals: Array<{ currency: string; amount: string }>;
      receipts: unknown[];
    } = await res.json();
    expect(body.year).toBe(2026);
    expect(body.subjectName).toBe("Ana Ruiz");
    expect(body.shareToken).toBeTruthy();
    expect(body.shareUrl).toContain("/es/constancia/");
    expect(body.documents.map((d) => d.docId)).toEqual(["doc-in"]);
    expect(body.totals).toEqual([{ currency: "MXN", amount: "150.00", count: 1 }]);
    expect(body.receipts).toEqual([]);
  });
});

describe("POST /api/account/constancia/receipts", () => {
  it("stores a PayPal-style PDF on the year packet", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "paid@example.com", true, false, null, null);
    const pdf = await makeValidPdfBytes();
    const form = new FormData();
    form.set("pdf", new File([pdf], "paypal-export.pdf", { type: "application/pdf" }));
    form.set("year", "2026");
    const res = await account.request(
      "/constancia/receipts",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` }, body: form },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { receipts: Array<{ filename: string; id: string }> } = await res.json();
    expect(body.receipts).toHaveLength(1);
    expect(body.receipts[0].filename).toBe("paypal-export.pdf");
    expect(body.receipts[0].id).toBeTruthy();
  });

  it("rejects a non-PDF upload", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "paid@example.com", true, false, null, null);
    const form = new FormData();
    form.set("pdf", new File([new Uint8Array([0x00, 0x01])], "note.txt", { type: "text/plain" }));
    form.set("year", "2026");
    const res = await account.request(
      "/constancia/receipts",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` }, body: form },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/account/constancia/profile", () => {
  it("stores the subject name without an email", async () => {
    const { env, kv } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "paid@example.com", true, false, null, null);
    const res = await account.request(
      "/constancia/profile",
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName: "  Ana  Ruiz " }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { subjectName: string } = await res.json();
    expect(body.subjectName).toBe("Ana Ruiz");
    const stored = JSON.parse(kv._store.get("constancia-profile:acct-1") as string);
    expect(stored.subjectName).toBe("Ana Ruiz");
    expect(JSON.stringify(stored)).not.toContain("paid@example.com");
  });

  it("rejects a name over 80 characters", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "paid@example.com", true, false, null, null);
    const res = await account.request(
      "/constancia/profile",
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName: "x".repeat(81) }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/constancia/:token", () => {
  it("401s a tampered or document token", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const docToken = await signToken("doc-1", 0, env.TOKEN_SECRET);
    const res = await constancia.request(`/${docToken}`, {}, env, ctx);
    expect(res.status).toBe(401);
  });

  it("returns the public packet without owner or counterparty emails", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    await seedCompletedDoc(env, d1);
    await putConstanciaProfile(env, "acct-1", "Ana Ruiz");
    const token = await signConstanciaToken("acct-1", 2026, env.TOKEN_SECRET);

    const res = await constancia.request(`/${token}?locale=es`, {}, env, ctx);
    expect(res.status).toBe(200);
    const raw = await res.text();
    expect(raw).not.toContain("ana@estudio.mx");
    expect(raw).not.toContain("paid@example.com");
    expect(raw).not.toContain("paypal.me");
    const body: {
      year: number;
      subjectName: string;
      documents: Array<{ title: string; counterparties: Array<{ name: string; email?: string }> }>;
      totals: Array<{ currency: string }>;
      receipts: unknown[];
    } = JSON.parse(raw);
    expect(body.year).toBe(2026);
    expect(body.subjectName).toBe("Ana Ruiz");
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0].title).toBe("Cobro Ana");
    expect(body.documents[0].counterparties[0].name).toBe("Ana Ruiz");
    expect(body.documents[0].counterparties[0].email).toBeUndefined();
    expect(body.totals[0].currency).toBe("MXN");
    expect(body.receipts).toEqual([]);
  });
});

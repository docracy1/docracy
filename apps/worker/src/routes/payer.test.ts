import { describe, it, expect } from "vitest";
import payer from "./payer";
import { makeMockEnv } from "../test/mockEnv";
import { putDoc } from "../lib/kv";
import { signConstanciaToken, signPayerToken, signToken } from "@docracy/shared";
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

describe("GET /api/payer/:token", () => {
  it("401s a document or constancia token", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const docToken = await signToken("doc-1", 0, env.TOKEN_SECRET);
    expect((await payer.request(`/${docToken}`, {}, env, ctx)).status).toBe(401);
    const cToken = await signConstanciaToken("acct-1", 2026, env.TOKEN_SECRET);
    expect((await payer.request(`/${cToken}`, {}, env, ctx)).status).toBe(401);
  });

  it("returns the public year list without emails or payment URLs", async () => {
    const { env, d1 } = makeMockEnv();
    const ctx = makeCtx();
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at)
         VALUES (?, ?, ?, 'completed', 0, ?, ?, ?)`
      )
      .bind("doc-pay", "acct-1", "W-9 Ana", "2026-02-01T00:00:00Z", "2026-03-15T12:00:00Z", "2027-04-15T00:00:00Z")
      .run();
    const kvDoc: DocState = {
      docId: "doc-pay",
      accountId: "acct-1",
      title: "W-9 Ana",
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
    const token = await signPayerToken("acct-1", 2026, env.TOKEN_SECRET);

    const res = await payer.request(`/${token}?locale=es`, {}, env, ctx);
    expect(res.status).toBe(200);
    const raw = await res.text();
    expect(raw).not.toContain("ana@estudio.mx");
    expect(raw).not.toContain("paypal.me");
    const body: {
      year: number;
      documents: Array<{ title: string; counterparties: Array<{ name: string; email?: string }> }>;
      totals: Array<{ currency: string }>;
    } = JSON.parse(raw);
    expect(body.year).toBe(2026);
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0].title).toBe("W-9 Ana");
    expect(body.documents[0].counterparties[0].name).toBe("Ana Ruiz");
    expect(body.documents[0].counterparties[0].email).toBeUndefined();
    expect(body.totals[0].currency).toBe("MXN");
  });
});

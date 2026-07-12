import { describe, it, expect, beforeEach } from "vitest";
import sign from "./sign";
import { putDoc } from "../lib/kv";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import { signToken } from "@docracy/shared";
import type { DocState } from "@docracy/shared";

// A real minimal 1x1 PNG — needed because pdf-lib's embedPng actually decodes the image.
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function seedDoc(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], r2: ReturnType<typeof makeMockEnv>["r2"]) {
  const pdf = await makeValidPdfBytes();
  const docId = "doc-1";
  await r2.put(`docs/${docId}/working.pdf`, pdf);
  const doc: DocState = {
    docId,
    accountId: null,
    title: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 99999999).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers: [
      { order: 1, name: "Anna", email: "anna@example.com", status: "pending", signedAt: null, linkSentAt: new Date().toISOString(), remindersSent: [] },
      { order: 2, name: "Max", email: "max@example.com", status: "pending", signedAt: null, linkSentAt: null, remindersSent: [] },
    ],
    fields: [
      { id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 },
      { id: "f2", signerOrder: 2, page: 0, xFrac: 0.1, yFrac: 0.5, wFrac: 0.2, hFrac: 0.05 },
    ],
  };
  await putDoc(env, doc);
  return docId;
}

describe("sign routes", () => {
  let env: Awaited<ReturnType<typeof makeMockEnv>>["env"];
  let r2: ReturnType<typeof makeMockEnv>["r2"];
  let docId: string;

  beforeEach(async () => {
    const mock = makeMockEnv();
    env = mock.env;
    r2 = mock.r2;
    docId = await seedDoc(env, r2);
  });

  it("rejects a tampered token", async () => {
    const res = await sign.request("/status/garbage.token.here", {}, env);
    expect(res.status).toBe(403);
  });

  it("status is visible regardless of whose turn it is", async () => {
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const res = await sign.request(`/status/${token2}`, {}, env);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.signers).toHaveLength(2);
  });

  it("GET /sign for a signer who isn't up yet returns onTurn: false with no PDF", async () => {
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const res = await sign.request(`/sign/${token2}`, {}, env);
    const body: any = await res.json();
    expect(body.onTurn).toBe(false);
    expect(body.pdfBase64).toBeUndefined();
  });

  it("rate-limits repeated reads of the same signing token", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    for (let i = 0; i < 30; i++) {
      const res = await sign.request(`/sign/${token1}`, {}, env);
      expect(res.status).toBe(200);
    }
    const blocked = await sign.request(`/sign/${token1}`, {}, env);
    expect(blocked.status).toBe(429);
  });

  it("rejects a submission missing a required field's value", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [], consent: true }) },
      env
    );
    expect(res.status).toBe(400);
  });

  it("rejects a submission that doesn't confirm consent", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }] }), // no `consent` field
      },
      env
    );
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toMatch(/consent|agree/i);
  });

  it("rejects a signature image over the size cap", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const oversized = "A".repeat(3_000_000); // decodes to ~2.25MB, over the 2MB cap
    const res = await sign.request(
      `/sign/${token1}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [{ fieldId: "f1", value: oversized }], consent: true }),
      },
      env
    );
    expect(res.status).toBe(400);
  });

  it("rejects signing out of turn", async () => {
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token2}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [{ fieldId: "f2", value: "Max" }], consent: true }),
      },
      env
    );
    expect(res.status).toBe(409);
  });

  it("advances to the next signer once the current one submits complete fields", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }], consent: true }),
      },
      env
    );
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status.signers[0].status).toBe("signed");
    expect(body.status.signers[1].status).toBe("pending");

    // Signer 1's old link should now be locked out.
    const lockedOut = await sign.request(`/sign/${token1}`, {}, env);
    const lockedOutBody: any = await lockedOut.json();
    expect(lockedOutBody.onTurn).toBe(false);
  });

  it("completes the document once the last signer submits", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }], consent: true }) },
      env
    );
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token2}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f2", value: TINY_PNG }], consent: true }) },
      env
    );
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status.status).toBe("completed");
    expect(r2._store.has(`docs/${docId}/final.pdf`)).toBe(true);
    expect(r2._store.has(`docs/${docId}/certificate.pdf`)).toBe(true);

    // seedDoc builds the DocState directly (bypassing documentCreation.ts), so there's no
    // "created" event here — only what the two POST /sign calls above append.
    const stored = JSON.parse((await env.DOCRACY_KV.get(`doc:${docId}`)) as string) as DocState;
    const eventTypes = (stored.events ?? []).map((e) => e.type);
    expect(eventTypes).toEqual(["consented", "signed", "invite_sent", "consented", "signed", "completed"]);
    const signedEvents = (stored.events ?? []).filter((e) => e.type === "signed");
    expect(signedEvents.every((e) => typeof e.pdfSha256 === "string" && e.pdfSha256!.length === 64)).toBe(true);
  });

  it("rejects a duplicate submission that wins the initial turn check but loses the pre-commit re-check", async () => {
    // Simulates a concurrent duplicate request: by the time this request re-checks the doc right
    // before committing (after the slow PDF burn), another in-flight request has already
    // advanced signer 1 past their turn — this one must back off instead of double-processing.
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    // Count only reads of the doc's own KV key — the handler also does an unrelated per-token
    // rate-limit KV read on every request, which isn't part of the race window this test targets.
    let docGetCalls = 0;
    const rawGet = (env.DOCRACY_KV.get as (key: string, type?: string) => Promise<unknown>).bind(env.DOCRACY_KV);
    (env.DOCRACY_KV as any).get = async (key: string, type?: string) => {
      const result = (await rawGet(key, type)) as unknown;
      if (!key.startsWith(`doc:${docId}`)) return result;
      docGetCalls++;
      if (docGetCalls === 2 && result) {
        const stored: DocState = JSON.parse(JSON.stringify(result));
        stored.signers[0].status = "signed";
        stored.signers[0].signedAt = new Date().toISOString();
        return stored;
      }
      return result;
    };

    const res = await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }], consent: true }) },
      env
    );
    expect(res.status).toBe(409);
  });
});

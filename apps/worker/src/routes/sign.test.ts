import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import sign from "./sign";
import { getDoc, putDoc } from "../lib/kv";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import { signToken, hashOpaqueToken } from "@docracy/shared";
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
    // Completion calls out to a real Time-Stamp Authority (see lib/timestamp.ts) — default to
    // "unreachable" in tests so they stay offline and deterministic; requestTimestamp's own
    // success/failure parsing is unit-tested separately in timestamp.test.ts.
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("no network in tests"));
  });

  afterEach(() => vi.restoreAllMocks());

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

  it("rejects a text field value over its (much smaller) length cap without applying the image byte cap", async () => {
    const existing = await getDoc(env, docId);
    await putDoc(env, { ...existing!, fields: [{ ...existing!.fields[0], type: "text" }, existing!.fields[1]] });
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const tooLong = "x".repeat(501); // over the 500-char text-field cap, tiny compared to the 2MB image cap
    const res = await sign.request(
      `/sign/${token1}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [{ fieldId: "f1", value: tooLong }], consent: true }),
      },
      env
    );
    expect(res.status).toBe(400);
  });

  it("accepts a normal-length text field value and burns it as plain text, not an image", async () => {
    const existing = await getDoc(env, docId);
    await putDoc(env, { ...existing!, fields: [{ ...existing!.fields[0], type: "text" }, existing!.fields[1]] });
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [{ fieldId: "f1", value: "Acme Corp" }], consent: true }),
      },
      env
    );
    expect(res.status).toBe(200);
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

    // The TSA is mocked as unreachable by default (see beforeEach) — completion must still
    // succeed, just without a trusted timestamp attached.
    expect(stored.timestampToken).toBeUndefined();
    expect(stored.timestampGenTime).toBeUndefined();
  });

  it("attaches a trusted timestamp to the completed document when the TSA responds", async () => {
    const genTime = new Date("2026-03-01T00:00:00.000Z");
    // Signer 2's submission is the one that reaches the completion branch and calls the TSA — the
    // hash it requests a timestamp for is only known once burnFields finishes, so the mock can't
    // be built with the real hash ahead of time. Instead, build a token whose messageImprint
    // matches whatever hash comes in by constructing it lazily inside the fetch mock.
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      const reqDer = init!.body as ArrayBuffer;
      const asn1 = asn1js.fromBER(reqDer);
      const tspReq = new pkijs.TimeStampReq({ schema: asn1.result });
      const hashBytes = new Uint8Array(tspReq.messageImprint.hashedMessage.valueBlock.valueHexView);

      const tstInfo = new pkijs.TSTInfo({
        version: 1,
        policy: "1.2.3.4",
        messageImprint: tspReq.messageImprint,
        serialNumber: new asn1js.Integer({ value: 1 }),
        genTime,
      });
      const signedData = new pkijs.SignedData({
        encapContentInfo: new pkijs.EncapsulatedContentInfo({
          eContentType: "1.2.840.113549.1.9.16.1.4",
          eContent: new asn1js.OctetString({ valueHex: tstInfo.toSchema().toBER(false) }),
        }),
      });
      const timeStampToken = new pkijs.ContentInfo({
        contentType: pkijs.ContentInfo.SIGNED_DATA,
        content: signedData.toSchema(),
      });
      const tspResp = new pkijs.TimeStampResp({
        status: new pkijs.PKIStatusInfo({ status: 0 }),
        timeStampToken,
      });
      void hashBytes; // messageImprint is echoed straight from the request, already matches by construction
      return new Response(tspResp.toSchema().toBER(false), { status: 200 });
    });

    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }], consent: true }) },
      env
    );
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    await sign.request(
      `/sign/${token2}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f2", value: TINY_PNG }], consent: true }) },
      env
    );

    const stored = JSON.parse((await env.DOCRACY_KV.get(`doc:${docId}`)) as string) as DocState;
    expect(stored.timestampGenTime).toBe(genTime.toISOString());
    expect(typeof stored.timestampToken).toBe("string");
    expect(stored.timestampToken!.length).toBeGreaterThan(0);
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

describe("parallel signing mode", () => {
  async function seedParallelDoc(
    env: Awaited<ReturnType<typeof makeMockEnv>>["env"],
    r2: ReturnType<typeof makeMockEnv>["r2"]
  ) {
    const pdf = await makeValidPdfBytes();
    const docId = "doc-parallel-1";
    await r2.put(`docs/${docId}/working.pdf`, pdf);
    const now = new Date().toISOString();
    const doc: DocState = {
      docId,
      accountId: null,
      title: null,
      createdAt: now,
      expiresAt: new Date(Date.now() + 99999999).toISOString(),
      preparerSigns: false,
      status: "pending",
      completedAt: null,
      signingMode: "parallel",
      signers: [
        { order: 1, name: "Anna", email: "anna@example.com", status: "pending", signedAt: null, linkSentAt: now, remindersSent: [] },
        { order: 2, name: "Max", email: "max@example.com", status: "pending", signedAt: null, linkSentAt: now, remindersSent: [] },
      ],
      fields: [
        { id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 },
        { id: "f2", signerOrder: 2, page: 0, xFrac: 0.1, yFrac: 0.5, wFrac: 0.2, hFrac: 0.05 },
      ],
    };
    await putDoc(env, doc);
    return docId;
  }

  let env: Awaited<ReturnType<typeof makeMockEnv>>["env"];
  let r2: ReturnType<typeof makeMockEnv>["r2"];
  let docId: string;

  beforeEach(async () => {
    const mock = makeMockEnv();
    env = mock.env;
    r2 = mock.r2;
    docId = await seedParallelDoc(env, r2);
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("no network in tests"));
  });

  afterEach(() => vi.restoreAllMocks());

  it("lets the second signer act before the first one signs", async () => {
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const getRes = await sign.request(`/sign/${token2}`, {}, env);
    expect(getRes.status).toBe(200);
    const getBody: any = await getRes.json();
    expect(getBody.onTurn).toBe(true);

    const postRes = await sign.request(
      `/sign/${token2}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f2", value: TINY_PNG }], consent: true }) },
      env
    );
    expect(postRes.status).toBe(200);
    const postBody: any = await postRes.json();
    expect(postBody.status.signers[1].status).toBe("signed");
    expect(postBody.status.signers[0].status).toBe("pending");
    expect(postBody.status.status).toBe("pending");
  });

  it("does not send a new invite after one signer completes their turn (everyone was already invited)", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }], consent: true }) },
      env
    );

    const stored = JSON.parse((await env.DOCRACY_KV.get(`doc:${docId}`)) as string) as DocState;
    const inviteEvents = (stored.events ?? []).filter((e) => e.type === "invite_sent");
    expect(inviteEvents).toHaveLength(0);

    // Signer 2 is still on turn independently — no chain advance needed.
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const res = await sign.request(`/sign/${token2}`, {}, env);
    const body: any = await res.json();
    expect(body.onTurn).toBe(true);
  });

  it("completes the document once every signer has submitted, in whichever order they sign", async () => {
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    await sign.request(
      `/sign/${token2}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f2", value: TINY_PNG }], consent: true }) },
      env
    );
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }], consent: true }) },
      env
    );
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status.status).toBe("completed");
    expect(r2._store.has(`docs/${docId}/final.pdf`)).toBe(true);
  });
});

describe("workspace branding", () => {
  const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
  const TINY_PNG_BYTES = Uint8Array.from(atob(TINY_PNG.split(",")[1]), (c) => c.charCodeAt(0));

  async function seedAccountDoc(
    env: Awaited<ReturnType<typeof makeMockEnv>>["env"],
    r2: ReturnType<typeof makeMockEnv>["r2"],
    accountId: string | null
  ) {
    const pdf = await makeValidPdfBytes();
    const docId = "doc-branded-1";
    await r2.put(`docs/${docId}/working.pdf`, pdf);
    const doc: DocState = {
      docId,
      accountId,
      title: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 99999999).toISOString(),
      preparerSigns: false,
      status: "pending",
      completedAt: null,
      signers: [
        { order: 1, name: "Anna", email: "anna@example.com", status: "pending", signedAt: null, linkSentAt: new Date().toISOString(), remindersSent: [] },
      ],
      fields: [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }],
    };
    await putDoc(env, doc);
    return docId;
  }

  it("omits brandLogoPath for an anonymous document", async () => {
    const { env, r2 } = makeMockEnv();
    const docId = await seedAccountDoc(env, r2, null);
    const token = await signToken(docId, 1, env.TOKEN_SECRET);

    const statusBody: any = await (await sign.request(`/status/${token}`, {}, env)).json();
    expect(statusBody.brandLogoPath).toBeNull();

    const signBody: any = await (await sign.request(`/sign/${token}`, {}, env)).json();
    expect(signBody.brandLogoPath).toBeNull();
  });

  it("omits brandLogoPath for a paid workspace that hasn't uploaded a logo", async () => {
    const { env, r2 } = makeMockEnv();
    await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "owner@example.com", new Date().toISOString())
      .run();
    const docId = await seedAccountDoc(env, r2, "acct-1");
    const token = await signToken(docId, 1, env.TOKEN_SECRET);

    const body: any = await (await sign.request(`/sign/${token}`, {}, env, MOCK_CTX)).json();
    expect(body.brandLogoPath).toBeNull();
  });

  it("includes brandLogoPath once the workspace uploads a logo", async () => {
    const { env, r2 } = makeMockEnv();
    await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "owner@example.com", new Date().toISOString())
      .run();
    await env.DOCRACY_DOCS.put("branding/acct-1/logo", TINY_PNG_BYTES, { httpMetadata: { contentType: "image/png" } });
    await env.DOCRACY_DB!.prepare(`UPDATE accounts SET logo_r2_key = ? WHERE id = ?`).bind("branding/acct-1/logo", "acct-1").run();

    const docId = await seedAccountDoc(env, r2, "acct-1");
    const token = await signToken(docId, 1, env.TOKEN_SECRET);

    const statusBody: any = await (await sign.request(`/status/${token}`, {}, env)).json();
    expect(statusBody.brandLogoPath).toBe("/api/branding/acct-1/logo");

    const signBody: any = await (await sign.request(`/sign/${token}`, {}, env, MOCK_CTX)).json();
    expect(signBody.brandLogoPath).toBe("/api/branding/acct-1/logo");
  });
});

describe("PIN-gated signing links", () => {
  let env: Awaited<ReturnType<typeof makeMockEnv>>["env"];
  let r2: ReturnType<typeof makeMockEnv>["r2"];
  let docId: string;

  beforeEach(async () => {
    const mock = makeMockEnv();
    env = mock.env;
    r2 = mock.r2;
    docId = await seedDoc(env, r2);
    const doc = await getDoc(env, docId);
    doc!.signers[0].pinHash = await hashOpaqueToken("1234", env.TOKEN_SECRET);
    await putDoc(env, doc!);
  });

  it("GET /sign reports needsPin without exposing the PDF when the signer has a PIN set", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(`/sign/${token1}`, {}, env);
    const body: any = await res.json();
    expect(body.onTurn).toBe(true);
    expect(body.needsPin).toBe(true);
    expect(body.pdfBase64).toBeUndefined();
  });

  it("rejects an unlock attempt with the wrong PIN", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}/unlock`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: "0000" }) },
      env
    );
    expect(res.status).toBe(401);
  });

  it("issues an unlock token for the correct PIN, which then unlocks GET /sign", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const unlockRes = await sign.request(
      `/sign/${token1}/unlock`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: "1234" }) },
      env
    );
    expect(unlockRes.status).toBe(200);
    const { unlockToken }: any = await unlockRes.json();
    expect(typeof unlockToken).toBe("string");

    const res = await sign.request(`/sign/${token1}`, { headers: { "X-Sign-Unlock": unlockToken } }, env);
    const body: any = await res.json();
    expect(body.needsPin).toBeUndefined();
    expect(body.pdfBase64).toBeTruthy();
  });

  it("rejects a POST submission without a valid unlock token", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }], consent: true }) },
      env
    );
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.needsPin).toBe(true);
  });

  it("rate-limits repeated PIN guesses", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    for (let i = 0; i < 10; i++) {
      const res = await sign.request(
        `/sign/${token1}/unlock`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: "0000" }) },
        env
      );
      expect(res.status).toBe(401);
    }
    const blocked = await sign.request(
      `/sign/${token1}/unlock`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: "1234" }) },
      env
    );
    expect(blocked.status).toBe(429);
  });

  it("rejects unlock attempts for a signer with no PIN set", async () => {
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token2}/unlock`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: "1234" }) },
      env
    );
    expect(res.status).toBe(400);
  });
});

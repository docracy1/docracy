import { describe, it, expect, beforeEach } from "vitest";
import sign from "./sign";
import { putDoc } from "../lib/kv";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import { signToken } from "@docracy/shared";
import type { DocState } from "@docracy/shared";

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

  it("rejects a submission missing a required field's value", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [] }) },
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
        body: JSON.stringify({ values: [{ fieldId: "f2", value: "Max" }] }),
      },
      env
    );
    expect(res.status).toBe(409);
  });

  // A real minimal 1x1 PNG — needed because pdf-lib's embedPng actually decodes the image.
  const TINY_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  it("advances to the next signer once the current one submits complete fields", async () => {
    const token1 = await signToken(docId, 1, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token1}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }] }),
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
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f1", value: TINY_PNG }] }) },
      env
    );
    const token2 = await signToken(docId, 2, env.TOKEN_SECRET);
    const res = await sign.request(
      `/sign/${token2}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [{ fieldId: "f2", value: TINY_PNG }] }) },
      env
    );
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status.status).toBe("completed");
    expect(r2._store.has(`docs/${docId}/final.pdf`)).toBe(true);
  });
});

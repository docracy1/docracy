import { describe, it, expect } from "vitest";
import templates from "./templates";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

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

function buildForm(pdfBytes: Uint8Array, meta: object) {
  const form = new FormData();
  form.set("pdf", new File([pdfBytes], "doc.pdf", { type: "application/pdf" }));
  form.set("meta", JSON.stringify(meta));
  return form;
}

const validMeta = {
  name: "My Lease",
  signerCount: 1,
  fields: [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }],
};

async function paidSession(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], ctx: ReturnType<typeof makeCtx>) {
  return createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);
}

describe("POST /api/account/templates", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const pdf = await makeValidPdfBytes();
    const res = await templates.request("/", { method: "POST", body: buildForm(pdf, validMeta) }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    const pdf = await makeValidPdfBytes();
    const res = await templates.request(
      "/",
      { method: "POST", body: buildForm(pdf, validMeta), headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("creates a template for a paid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    const res = await templates.request(
      "/",
      { method: "POST", body: buildForm(pdf, validMeta), headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { templateId: string } = await res.json();
    expect(body.templateId).toBeTruthy();
  });

  it("rejects a missing template name", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    const res = await templates.request(
      "/",
      {
        method: "POST",
        body: buildForm(pdf, { ...validMeta, name: "  " }),
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects a field assigned to a signer slot that doesn't exist", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    const res = await templates.request(
      "/",
      {
        method: "POST",
        body: buildForm(pdf, {
          ...validMeta,
          fields: [{ id: "f1", signerOrder: 2, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }],
        }),
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects a signer slot with no field placed", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    const res = await templates.request(
      "/",
      {
        method: "POST",
        body: buildForm(pdf, { ...validMeta, signerCount: 2 }),
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("rejects a field positioned outside the document", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    const res = await templates.request(
      "/",
      {
        method: "POST",
        body: buildForm(pdf, {
          ...validMeta,
          fields: [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.9, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }],
        }),
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      },
      env,
      ctx
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/account/templates", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await templates.request("/", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("lists only the requesting account's own templates", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    await templates.request(
      "/",
      { method: "POST", body: buildForm(pdf, validMeta), headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    const otherToken = await createSession(env, ctx, "acct-2", "max@example.com", true, null, null);
    await templates.request(
      "/",
      { method: "POST", body: buildForm(pdf, { ...validMeta, name: "Not Mine" }), headers: { Cookie: `${SESSION_COOKIE_NAME}=${otherToken}` } },
      env,
      ctx
    );

    const res = await templates.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, ctx);
    const body: { templates: Array<{ name: string }> } = await res.json();
    expect(body.templates.map((t) => t.name)).toEqual(["My Lease"]);
  });
});

describe("GET/DELETE /api/account/templates/:id", () => {
  it("round-trips a created template (fields + base64 PDF) and lets the owner delete it", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    const createRes = await templates.request(
      "/",
      { method: "POST", body: buildForm(pdf, validMeta), headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    const { templateId } = (await createRes.json()) as { templateId: string };

    const getRes = await templates.request(
      `/${templateId}`,
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(getRes.status).toBe(200);
    const body: { name: string; signerCount: number; fields: unknown[]; pdfBase64: string } = await getRes.json();
    expect(body.name).toBe("My Lease");
    expect(body.signerCount).toBe(1);
    expect(body.fields).toEqual(validMeta.fields);
    expect(atob(body.pdfBase64).length).toBe(pdf.length);

    const deleteRes = await templates.request(
      `/${templateId}`,
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(deleteRes.status).toBe(200);

    const afterDeleteRes = await templates.request(
      `/${templateId}`,
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(afterDeleteRes.status).toBe(404);
  });

  it("404s when another account tries to fetch or delete a template it doesn't own", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await paidSession(env, ctx);
    const pdf = await makeValidPdfBytes();

    const createRes = await templates.request(
      "/",
      { method: "POST", body: buildForm(pdf, validMeta), headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    const { templateId } = (await createRes.json()) as { templateId: string };

    const otherToken = await createSession(env, ctx, "acct-2", "max@example.com", true, null, null);
    const getRes = await templates.request(
      `/${templateId}`,
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${otherToken}` } },
      env,
      ctx
    );
    expect(getRes.status).toBe(404);

    const deleteRes = await templates.request(
      `/${templateId}`,
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${otherToken}` } },
      env,
      ctx
    );
    expect(deleteRes.status).toBe(404);
  });
});

import { describe, it, expect } from "vitest";
import { marketplaceAccount, marketplacePublic, marketplaceAdmin } from "./marketplace";
import templates from "./templates";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import type { Env } from "@docracy/shared";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

async function paidSessionHeaders(env: Env, accountId = "acct-1") {
  const token = await createSession(env, MOCK_CTX, accountId, "anna@example.com", true, false, null, null);
  return { Cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

async function adminSessionHeaders(env: Env) {
  const token = await createSession(env, MOCK_CTX, "admin-acct", "admin@example.com", false, false, null, null);
  return { Cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

function buildForm(pdfBytes: Uint8Array, meta: object) {
  const form = new FormData();
  form.set("pdf", new File([pdfBytes], "doc.pdf", { type: "application/pdf" }));
  form.set("meta", JSON.stringify(meta));
  return form;
}

async function createPrivateTemplate(env: Env, headers: Record<string, string>) {
  const pdf = await makeValidPdfBytes();
  const meta = {
    name: "My Lease",
    signerCount: 1,
    fields: [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }],
  };
  const res = await templates.request("/", { method: "POST", body: buildForm(pdf, meta), headers }, env, MOCK_CTX);
  const body: { templateId: string } = await res.json();
  return body.templateId;
}

describe("POST /api/account/marketplace/submit", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await marketplaceAccount.request(
      "/submit",
      { method: "POST", body: JSON.stringify({ templateId: "x" }), headers: { "Content-Type": "application/json" } },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("submits an existing saved template as pending", async () => {
    const { env } = makeMockEnv();
    const headers = await paidSessionHeaders(env);
    const templateId = await createPrivateTemplate(env, headers);

    const res = await marketplaceAccount.request(
      "/submit",
      {
        method: "POST",
        body: JSON.stringify({ templateId, category: "Rental & Lease Agreements", description: "A lease." }),
        headers: { ...headers, "Content-Type": "application/json" },
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const body: { ok: true; id: string; slug: string } = await res.json();
    expect(body.slug).toContain("my-lease");

    // Not publicly visible until approved.
    const publicRes = await marketplacePublic.request(`/${body.slug}`, {}, env, MOCK_CTX);
    expect(publicRes.status).toBe(404);
  });

  it("404s for a template that doesn't belong to this account", async () => {
    const { env } = makeMockEnv();
    const headers = await paidSessionHeaders(env);
    const otherHeaders = await paidSessionHeaders(env, "acct-2");
    const templateId = await createPrivateTemplate(env, headers);

    const res = await marketplaceAccount.request(
      "/submit",
      {
        method: "POST",
        body: JSON.stringify({ templateId }),
        headers: { ...otherHeaders, "Content-Type": "application/json" },
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(404);
  });

  it("caps pending submissions per account", async () => {
    const { env } = makeMockEnv();
    const headers = await paidSessionHeaders(env);

    for (let i = 0; i < 5; i++) {
      const templateId = await createPrivateTemplate(env, headers);
      const res = await marketplaceAccount.request(
        "/submit",
        { method: "POST", body: JSON.stringify({ templateId }), headers: { ...headers, "Content-Type": "application/json" } },
        env,
        MOCK_CTX
      );
      expect(res.status).toBe(200);
    }

    const templateId = await createPrivateTemplate(env, headers);
    const res = await marketplaceAccount.request(
      "/submit",
      { method: "POST", body: JSON.stringify({ templateId }), headers: { ...headers, "Content-Type": "application/json" } },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });
});

describe("marketplace admin review flow", () => {
  it("rejects a non-admin from the pending queue", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await paidSessionHeaders(env);
    const res = await marketplaceAdmin.request("/pending", { headers }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("approve makes a submission publicly visible; reject keeps it hidden", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await paidSessionHeaders(env);
    const adminHeaders = await adminSessionHeaders(env);

    const templateId1 = await createPrivateTemplate(env, headers);
    const submit1 = await marketplaceAccount.request(
      "/submit",
      { method: "POST", body: JSON.stringify({ templateId: templateId1 }), headers: { ...headers, "Content-Type": "application/json" } },
      env,
      MOCK_CTX
    );
    const { id: id1, slug: slug1 }: { id: string; slug: string } = await submit1.json();

    const templateId2 = await createPrivateTemplate(env, headers);
    const submit2 = await marketplaceAccount.request(
      "/submit",
      { method: "POST", body: JSON.stringify({ templateId: templateId2 }), headers: { ...headers, "Content-Type": "application/json" } },
      env,
      MOCK_CTX
    );
    const { id: id2, slug: slug2 }: { id: string; slug: string } = await submit2.json();

    const pendingRes = await marketplaceAdmin.request("/pending", { headers: adminHeaders }, env, MOCK_CTX);
    const { pending }: { pending: Array<{ id: string }> } = await pendingRes.json();
    expect(pending.map((p) => p.id).sort()).toEqual([id1, id2].sort());

    const approveRes = await marketplaceAdmin.request(`/${id1}/approve`, { method: "POST", headers: adminHeaders }, env, MOCK_CTX);
    expect(approveRes.status).toBe(200);

    const rejectRes = await marketplaceAdmin.request(
      `/${id2}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ rejectionReason: "Contains a real client name in the body text" }),
        headers: { ...adminHeaders, "Content-Type": "application/json" },
      },
      env,
      MOCK_CTX
    );
    expect(rejectRes.status).toBe(200);

    const approvedPublic = await marketplacePublic.request(`/${slug1}`, {}, env, MOCK_CTX);
    expect(approvedPublic.status).toBe(200);
    const approvedBody: { title: string; fields: unknown[] } = await approvedPublic.json();
    expect(approvedBody.fields.length).toBeGreaterThan(0);

    const approvedPdf = await marketplacePublic.request(`/${slug1}/pdf`, {}, env, MOCK_CTX);
    expect(approvedPdf.status).toBe(200);
    expect(approvedPdf.headers.get("Content-Type")).toBe("application/pdf");
    const pdfBytes = new Uint8Array(await approvedPdf.arrayBuffer());
    expect(new TextDecoder().decode(pdfBytes.slice(0, 5))).toBe("%PDF-");

    const rejectedPublic = await marketplacePublic.request(`/${slug2}`, {}, env, MOCK_CTX);
    expect(rejectedPublic.status).toBe(404);

    const rejectedPdf = await marketplacePublic.request(`/${slug2}/pdf`, {}, env, MOCK_CTX);
    expect(rejectedPdf.status).toBe(404);

    const listRes = await marketplacePublic.request("/", {}, env, MOCK_CTX);
    const { templates: approvedList }: { templates: Array<{ slug: string }> } = await listRes.json();
    expect(approvedList.map((t) => t.slug)).toEqual([slug1]);
  });

  it("can't review the same submission twice", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const headers = await paidSessionHeaders(env);
    const adminHeaders = await adminSessionHeaders(env);
    const templateId = await createPrivateTemplate(env, headers);
    const submit = await marketplaceAccount.request(
      "/submit",
      { method: "POST", body: JSON.stringify({ templateId }), headers: { ...headers, "Content-Type": "application/json" } },
      env,
      MOCK_CTX
    );
    const { id }: { id: string } = await submit.json();

    const first = await marketplaceAdmin.request(`/${id}/approve`, { method: "POST", headers: adminHeaders }, env, MOCK_CTX);
    expect(first.status).toBe(200);
    const second = await marketplaceAdmin.request(`/${id}/reject`, { method: "POST", headers: adminHeaders }, env, MOCK_CTX);
    expect(second.status).toBe(404);
  });
});

import { describe, it, expect } from "vitest";
import zapier from "./zapier";
import { issueApiToken } from "../lib/apiTokens";
import { createTemplate } from "../lib/templates";
import { listWebhooks } from "../lib/webhooks";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import type { DocField } from "@docracy/shared";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

async function paidWorkspace(env: Awaited<ReturnType<typeof makeMockEnv>>["env"]) {
  await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
    .bind("acct-1", "owner@example.com", new Date().toISOString())
    .run();
  const token = await issueApiToken(env, "acct-1");
  return { token, authHeader: { Authorization: `Bearer ${token}` } };
}

describe("GET /api/zapier/auth-test", () => {
  it("401s without a token", async () => {
    const { env } = makeMockEnv();
    const res = await zapier.request("/auth-test", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("returns the workspace email for a valid token", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const res = await zapier.request("/auth-test", { headers: authHeader }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { email: string; workspaceId: string } = await res.json();
    expect(body).toEqual({ email: "owner@example.com", workspaceId: "acct-1" });
  });
});

describe("POST /api/zapier/hooks/:event and DELETE /api/zapier/hooks/:id", () => {
  it("401s without a token", async () => {
    const { env } = makeMockEnv();
    const res = await zapier.request(
      "/hooks/document-completed",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_url: "https://hooks.zapier.com/x" }) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("rejects an unrecognized event slug", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const res = await zapier.request(
      "/hooks/not-a-real-event",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ target_url: "https://hooks.zapier.com/x" }),
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing target_url", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const res = await zapier.request(
      "/hooks/document-completed",
      { method: "POST", headers: { "Content-Type": "application/json", ...authHeader }, body: JSON.stringify({}) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("subscribes, creating a webhook scoped to the workspace, then unsubscribes it", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);

    const subRes = await zapier.request(
      "/hooks/document-completed",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ target_url: "https://hooks.zapier.com/abc123" }),
      },
      env,
      MOCK_CTX
    );
    expect(subRes.status).toBe(200);
    const { id }: { id: string } = await subRes.json();
    expect(id).toBeTruthy();

    const webhooksBefore = await listWebhooks(env, "acct-1");
    expect(webhooksBefore).toEqual([
      expect.objectContaining({ id, url: "https://hooks.zapier.com/abc123", events: ["document.completed"] }),
    ]);

    const unsubRes = await zapier.request(`/hooks/${id}`, { method: "DELETE", headers: authHeader }, env, MOCK_CTX);
    expect(unsubRes.status).toBe(200);
    expect(await listWebhooks(env, "acct-1")).toEqual([]);
  });

  it("404s unsubscribing a webhook that doesn't belong to this workspace", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const res = await zapier.request("/hooks/no-such-id", { method: "DELETE", headers: authHeader }, env, MOCK_CTX);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/zapier/templates", () => {
  it("401s without a token", async () => {
    const { env } = makeMockEnv();
    const res = await zapier.request("/templates", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("lists only this workspace's templates in Zapier's {id, name} dropdown shape", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const pdf = await makeValidPdfBytes();
    const fields: DocField[] = [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }];
    const { templateId } = await createTemplate(env, "acct-1", pdf, "NDA", 1, 1, fields);

    const res = await zapier.request("/templates", { headers: authHeader }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: Array<{ id: string; name: string }> = await res.json();
    expect(body).toEqual([{ id: templateId, name: "NDA (1 signer)" }]);
  });
});

describe("POST /api/zapier/documents", () => {
  async function seedTemplate(env: Awaited<ReturnType<typeof makeMockEnv>>["env"]) {
    const pdf = await makeValidPdfBytes();
    const fields: DocField[] = [
      { id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 },
      { id: "f2", signerOrder: 2, page: 0, xFrac: 0.1, yFrac: 0.5, wFrac: 0.2, hFrac: 0.05 },
    ];
    const { templateId } = await createTemplate(env, "acct-1", pdf, "Contract", 2, 1, fields);
    return templateId;
  }

  it("401s without a token", async () => {
    const { env } = makeMockEnv();
    const res = await zapier.request(
      "/documents",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("creates and sends a document from a template", async () => {
    const { env, kv } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const templateId = await seedTemplate(env);

    const res = await zapier.request(
      "/documents",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          templateId,
          signers: [
            { name: "Anna", email: "anna@example.com" },
            { name: "Max", email: "max@example.com" },
          ],
        }),
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const body: { docId: string; statusToken: string; statusUrl: string } = await res.json();
    expect(body.docId).toBeTruthy();
    expect(body.statusUrl).toContain(body.statusToken);
    expect([...kv._store.keys()].some((k) => k.startsWith("doc:"))).toBe(true);
  });

  it("404s for a template that doesn't exist", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const res = await zapier.request(
      "/documents",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ templateId: "no-such-template", signers: [{ name: "Anna", email: "anna@example.com" }] }),
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(404);
  });

  it("rejects a signer count that doesn't match the template", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const templateId = await seedTemplate(env);

    const res = await zapier.request(
      "/documents",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ templateId, signers: [{ name: "Anna", email: "anna@example.com" }] }),
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid signer email", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const templateId = await seedTemplate(env);

    const res = await zapier.request(
      "/documents",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          templateId,
          signers: [
            { name: "Anna", email: "not-an-email" },
            { name: "Max", email: "max@example.com" },
          ],
        }),
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("does not let one workspace use another workspace's template", async () => {
    const { env } = makeMockEnv();
    const { authHeader } = await paidWorkspace(env);
    const pdf = await makeValidPdfBytes();
    const { templateId } = await createTemplate(env, "someone-elses-workspace", pdf, "Not Yours", 1, 1, [
      { id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 },
    ]);

    const res = await zapier.request(
      "/documents",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ templateId, signers: [{ name: "Anna", email: "anna@example.com" }] }),
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(404);
  });
});

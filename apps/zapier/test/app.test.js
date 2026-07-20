import { describe, it, expect, vi } from "vitest";
const { BASE_URL } = require("../constants");
const authentication = require("../authentication");
const documentCompletedTrigger = require("../triggers/documentCompleted");
const documentCreatedTrigger = require("../triggers/documentCreated");
const signerSignedTrigger = require("../triggers/signerSigned");
const sendDocumentFromTemplateCreate = require("../creates/sendDocumentFromTemplate");
const app = require("../index");

function fakeZ(responseData) {
  return { request: vi.fn().mockResolvedValue({ data: responseData }) };
}

describe("authentication", () => {
  it("test() calls the auth-test endpoint and returns its data", async () => {
    const z = fakeZ({ email: "owner@example.com", workspaceId: "acct-1" });
    const result = await authentication.test(z, {});
    expect(z.request).toHaveBeenCalledWith({ url: `${BASE_URL}/api/zapier/auth-test` });
    expect(result).toEqual({ email: "owner@example.com", workspaceId: "acct-1" });
  });
});

describe("index.js beforeRequest middleware", () => {
  const includeApiKey = app.beforeRequest[0];

  it("adds a Bearer Authorization header from authData.apiKey", () => {
    const request = { headers: {} };
    const result = includeApiKey(request, null, { authData: { apiKey: "dk_abc123" } });
    expect(result.headers.Authorization).toBe("Bearer dk_abc123");
  });

  it("leaves the request untouched when there's no apiKey yet (during the auth test itself)", () => {
    const request = { headers: {} };
    const result = includeApiKey(request, null, { authData: {} });
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe.each([
  ["documentCreated", documentCreatedTrigger, "document-created"],
  ["signerSigned", signerSignedTrigger, "signer-signed"],
  ["documentCompleted", documentCompletedTrigger, "document-completed"],
])("%s trigger", (_name, trigger, slug) => {
  it("subscribes by POSTing to its dedicated hook endpoint", async () => {
    const z = fakeZ({ id: "wh-1" });
    const bundle = { targetUrl: "https://hooks.zapier.com/xyz" };
    const result = await trigger.operation.performSubscribe(z, bundle);
    expect(z.request).toHaveBeenCalledWith({
      url: `${BASE_URL}/api/zapier/hooks/${slug}`,
      method: "POST",
      body: { target_url: bundle.targetUrl },
    });
    expect(result).toEqual({ id: "wh-1" });
  });

  it("unsubscribes by DELETEing the hook by the id the subscribe response returned", async () => {
    const z = fakeZ({ ok: true });
    await trigger.operation.performUnsubscribe(z, { subscribeData: { id: "wh-1" } });
    expect(z.request).toHaveBeenCalledWith({ url: `${BASE_URL}/api/zapier/hooks/wh-1`, method: "DELETE" });
  });

  it("falls back to sample data when there's no real payload yet (Zap editor test click)", () => {
    const result = trigger.operation.perform(null, {});
    expect(result).toEqual([trigger.operation.sample]);
  });

  it("has a description starting with 'Triggers when' (Zapier's own style requirement)", () => {
    expect(trigger.display.description).toMatch(/^Triggers when /);
  });

  it("performList also returns the fallback sample (no genuine polling endpoint exists)", () => {
    expect(trigger.operation.performList()).toEqual([trigger.operation.sample]);
  });
});

describe("documentCompleted trigger perform", () => {
  it("maps a real webhook payload into a Zapier-friendly array with an id", () => {
    const bundle = { cleanedRequest: { event: "document.completed", data: { docId: "doc-1", title: "NDA" } } };
    expect(documentCompletedTrigger.operation.perform(null, bundle)).toEqual([{ id: "doc-1", docId: "doc-1", title: "NDA" }]);
  });
});

describe("signerSigned trigger perform", () => {
  it("builds a composite id from docId + signerOrder, since order alone repeats across documents", () => {
    const bundle = { cleanedRequest: { data: { docId: "doc-1", signerOrder: 2 } } };
    expect(signerSignedTrigger.operation.perform(null, bundle)).toEqual([{ id: "doc-1-2", docId: "doc-1", signerOrder: 2 }]);
  });
});

describe("sendDocumentFromTemplate create", () => {
  it("only includes signer slots that have both a name and an email filled in", async () => {
    const z = fakeZ({ docId: "doc-1" });
    const bundle = {
      inputData: {
        templateId: "tpl-1",
        signer1Name: "Anna",
        signer1Email: "anna@example.com",
        signer2Name: "Max",
        signer2Email: "max@example.com",
        signer3Name: "",
        signer3Email: "",
      },
    };
    await sendDocumentFromTemplateCreate.operation.perform(z, bundle);
    expect(z.request).toHaveBeenCalledWith({
      url: `${BASE_URL}/api/zapier/documents`,
      method: "POST",
      body: {
        templateId: "tpl-1",
        signers: [
          { name: "Anna", email: "anna@example.com" },
          { name: "Max", email: "max@example.com" },
        ],
      },
    });
  });

  it("sends zero signers when no slots are filled in", async () => {
    const z = fakeZ({});
    await sendDocumentFromTemplateCreate.operation.perform(z, { inputData: { templateId: "tpl-1" } });
    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({ body: { templateId: "tpl-1", signers: [] } })
    );
  });

  it("ignores a slot with only a name or only an email, not both", async () => {
    const z = fakeZ({});
    await sendDocumentFromTemplateCreate.operation.perform(z, {
      inputData: { templateId: "tpl-1", signer1Name: "Anna", signer1Email: "", signer2Email: "max@example.com" },
    });
    expect(z.request).toHaveBeenCalledWith(expect.objectContaining({ body: { templateId: "tpl-1", signers: [] } }));
  });
});

describe("app definition", () => {
  it("registers every trigger and create under its own key", () => {
    expect(Object.keys(app.triggers).sort()).toEqual(
      ["template_list", "document_created", "signer_signed", "document_completed"].sort()
    );
    expect(Object.keys(app.creates)).toEqual(["send_document_from_template"]);
  });
});

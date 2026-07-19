import { describe, it, expect, vi, afterEach } from "vitest";
import { createWebhook, listWebhooks, deleteWebhook, deliverWebhookEvent } from "./webhooks";
import { makeMockEnv } from "../test/mockEnv";

describe("webhooks lib — CRUD", () => {
  it("creates a webhook and returns a whsec_-prefixed secret shown only once", async () => {
    const { env } = makeMockEnv();
    const { webhookId, secret } = await createWebhook(env, "acct-1", "https://example.com/hook", ["document.created"]);
    expect(webhookId).toBeTruthy();
    expect(secret).toMatch(/^whsec_/);

    const list = await listWebhooks(env, "acct-1");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: webhookId, url: "https://example.com/hook", events: ["document.created"] });
    expect(list[0]).not.toHaveProperty("secret");
  });

  it("lists webhooks newest first", async () => {
    const { env } = makeMockEnv();
    const { webhookId: first } = await createWebhook(env, "acct-1", "https://example.com/a", ["document.created"]);
    const { webhookId: second } = await createWebhook(env, "acct-1", "https://example.com/b", ["document.completed"]);

    const list = await listWebhooks(env, "acct-1");
    expect(list.map((w) => w.id)).toEqual([second, first]);
  });

  it("does not let one account see or delete another account's webhook", async () => {
    const { env } = makeMockEnv();
    const { webhookId } = await createWebhook(env, "acct-1", "https://example.com/hook", ["document.created"]);

    expect(await listWebhooks(env, "acct-2")).toEqual([]);
    expect(await deleteWebhook(env, "acct-2", webhookId)).toBe(false);

    expect(await deleteWebhook(env, "acct-1", webhookId)).toBe(true);
    expect(await listWebhooks(env, "acct-1")).toEqual([]);
  });

  it("reports deleting a nonexistent webhook as unsuccessful", async () => {
    const { env } = makeMockEnv();
    expect(await deleteWebhook(env, "acct-1", "no-such-webhook")).toBe(false);
  });
});

describe("deliverWebhookEvent", () => {
  afterEach(() => vi.restoreAllMocks());

  it("POSTs a signed payload only to webhooks subscribed to that event type", async () => {
    const { env } = makeMockEnv();
    await createWebhook(env, "acct-1", "https://example.com/subscribed", ["document.created"]);
    await createWebhook(env, "acct-1", "https://example.com/not-subscribed", ["document.completed"]);
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    await deliverWebhookEvent(env, "acct-1", "document.created", { docId: "doc-1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.com/subscribed");
    expect((init!.headers as Record<string, string>)["X-Docracy-Event"]).toBe("document.created");
    expect(typeof (init!.headers as Record<string, string>)["X-Docracy-Signature"]).toBe("string");
    expect(JSON.parse(init!.body as string)).toEqual({ event: "document.created", data: { docId: "doc-1" } });
  });

  it("signs the payload with each webhook's own secret, verifiable by that secret alone", async () => {
    const { env } = makeMockEnv();
    const { secret } = await createWebhook(env, "acct-1", "https://example.com/hook", ["document.created"]);
    let capturedBody = "";
    let capturedSignature = "";
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      capturedBody = init!.body as string;
      capturedSignature = (init!.headers as Record<string, string>)["X-Docracy-Signature"];
      return new Response("{}", { status: 200 });
    });

    await deliverWebhookEvent(env, "acct-1", "document.created", { docId: "doc-1" });

    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
      "verify",
    ]);
    const sigBytes = Uint8Array.from(capturedSignature.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(capturedBody));
    expect(valid).toBe(true);
  });

  it("does not throw when a subscriber endpoint is unreachable", async () => {
    const { env } = makeMockEnv();
    await createWebhook(env, "acct-1", "https://example.com/down", ["document.created"]);
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("connection refused"));

    await expect(deliverWebhookEvent(env, "acct-1", "document.created", { docId: "doc-1" })).resolves.toBeUndefined();
  });

  it("does nothing (and never calls fetch) when the account has no webhooks", async () => {
    const { env } = makeMockEnv();
    const fetchMock = vi.spyOn(global, "fetch");
    await deliverWebhookEvent(env, "acct-1", "document.created", { docId: "doc-1" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

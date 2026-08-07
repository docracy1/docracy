import { describe, it, expect } from "vitest";
import whatsappWebhook from "./whatsappWebhook";
import { putDoc, getDoc } from "../lib/kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function makeDoc(docId: string): DocState {
  const now = new Date();
  return {
    docId,
    accountId: null,
    title: null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    whatsappInvites: true,
    signers: [
      {
        order: 1,
        name: "Anna",
        email: "anna@example.com",
        whatsappPhone: "+14155551234",
        status: "pending",
        signedAt: null,
        linkSentAt: now.toISOString(),
        remindersSent: [],
      },
    ],
    fields: [],
  };
}

function statusPayload(docId: string, order: number, status: "delivered" | "read") {
  return JSON.stringify({
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [{ status, timestamp: String(Math.floor(Date.now() / 1000)), biz_opaque_callback_data: `${docId}:${order}` }],
            },
          },
        ],
      },
    ],
  });
}

describe("GET /api/webhooks/whatsapp (verification handshake)", () => {
  it("echoes the challenge when the verify token matches", async () => {
    const { env } = makeMockEnv({ WHATSAPP_WEBHOOK_VERIFY_TOKEN: "verify-me" });
    const res = await whatsappWebhook.request(
      "/?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=1234",
      { method: "GET" },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("1234");
  });

  it("403s when the verify token doesn't match", async () => {
    const { env } = makeMockEnv({ WHATSAPP_WEBHOOK_VERIFY_TOKEN: "verify-me" });
    const res = await whatsappWebhook.request(
      "/?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1234",
      { method: "GET" },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(403);
  });
});

describe("POST /api/webhooks/whatsapp (delivery/read receipts)", () => {
  it("stamps whatsappDeliveredAt and appends an audit event", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc("doc-1"));

    const res = await whatsappWebhook.request(
      "/",
      { method: "POST", body: statusPayload("doc-1", 1, "delivered") },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const doc = await getDoc(env, "doc-1");
    expect(doc?.signers[0].whatsappDeliveredAt).toBeTruthy();
    expect(doc?.events?.some((e) => e.type === "whatsapp_delivered" && e.signerOrder === 1)).toBe(true);
  });

  it("stamps whatsappReadAt separately from delivered", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc("doc-2"));

    await whatsappWebhook.request("/", { method: "POST", body: statusPayload("doc-2", 1, "delivered") }, env, MOCK_CTX);
    await whatsappWebhook.request("/", { method: "POST", body: statusPayload("doc-2", 1, "read") }, env, MOCK_CTX);

    const doc = await getDoc(env, "doc-2");
    expect(doc?.signers[0].whatsappDeliveredAt).toBeTruthy();
    expect(doc?.signers[0].whatsappReadAt).toBeTruthy();
    expect(doc?.events?.filter((e) => e.type === "whatsapp_delivered" || e.type === "whatsapp_read")).toHaveLength(2);
  });

  it("ignores a receipt for an unknown document without erroring", async () => {
    const { env } = makeMockEnv();
    const res = await whatsappWebhook.request(
      "/",
      { method: "POST", body: statusPayload("no-such-doc", 1, "delivered") },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
  });

  it("skips processing when a configured signature doesn't verify, but still returns 200", async () => {
    const { env } = makeMockEnv({ WHATSAPP_APP_SECRET: "shh" });
    await putDoc(env, makeDoc("doc-3"));

    const res = await whatsappWebhook.request(
      "/",
      {
        method: "POST",
        body: statusPayload("doc-3", 1, "delivered"),
        headers: { "x-hub-signature-256": "sha256=00" },
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const doc = await getDoc(env, "doc-3");
    expect(doc?.signers[0].whatsappDeliveredAt).toBeFalsy();
  });

  it("processes the receipt when the signature verifies", async () => {
    const secret = "shh";
    const { env } = makeMockEnv({ WHATSAPP_APP_SECRET: secret });
    await putDoc(env, makeDoc("doc-4"));

    const rawBody = statusPayload("doc-4", 1, "delivered");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
    const sigHex = [...sigBytes].map((b) => b.toString(16).padStart(2, "0")).join("");

    const res = await whatsappWebhook.request(
      "/",
      { method: "POST", body: rawBody, headers: { "x-hub-signature-256": `sha256=${sigHex}` } },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const doc = await getDoc(env, "doc-4");
    expect(doc?.signers[0].whatsappDeliveredAt).toBeTruthy();
  });
});

import { describe, it, expect } from "vitest";
import { verifyAndExtract } from "./resend";
import { makeMockEnv } from "../../test/mockEnv";

const SECRET_BASE64 = btoa("test-secret-bytes");
const WEBHOOK_SECRET = `whsec_${SECRET_BASE64}`;

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function signPayload(svixId: string, timestamp: number, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(SECRET_BASE64), (c) => c.charCodeAt(0)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${svixId}.${timestamp}.${rawBody}`));
  return `v1,${base64Encode(new Uint8Array(sig))}`;
}

function openedPayload(emailType?: string): string {
  return JSON.stringify({
    type: "email.opened",
    data: { email_id: "abc", to: ["signer@example.com"], tags: emailType ? [{ name: "email_type", value: emailType }] : [] },
  });
}

describe("verifyAndExtract (Resend)", () => {
  it("accepts a validly-signed email.opened event and extracts its email_type tag", async () => {
    const { env } = makeMockEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const svixId = "msg_1";
    const timestamp = Math.floor(Date.now() / 1000);
    const rawBody = openedPayload("signing_invite");
    const signature = await signPayload(svixId, timestamp, rawBody);

    const result = await verifyAndExtract(rawBody, svixId, String(timestamp), signature, env);

    expect(result).toEqual({ event: "email_opened", emailType: "signing_invite" });
  });

  it("maps email.clicked and email.bounced to their funnel events", async () => {
    const { env } = makeMockEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const svixId = "msg_2";
    const timestamp = Math.floor(Date.now() / 1000);

    for (const [resendType, expected] of [
      ["email.clicked", "email_clicked"],
      ["email.bounced", "email_bounced"],
    ] as const) {
      const rawBody = JSON.stringify({ type: resendType, data: { tags: [] } });
      const signature = await signPayload(svixId, timestamp, rawBody);
      const result = await verifyAndExtract(rawBody, svixId, String(timestamp), signature, env);
      expect(result).toEqual({ event: expected, emailType: null });
    }
  });

  it("returns null for an event type this app doesn't act on", async () => {
    const { env } = makeMockEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const svixId = "msg_3";
    const timestamp = Math.floor(Date.now() / 1000);
    const rawBody = JSON.stringify({ type: "email.delivered", data: {} });
    const signature = await signPayload(svixId, timestamp, rawBody);

    expect(await verifyAndExtract(rawBody, svixId, String(timestamp), signature, env)).toBeNull();
  });

  it("returns null when the signature doesn't match", async () => {
    const { env } = makeMockEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const rawBody = openedPayload();
    const result = await verifyAndExtract(rawBody, "msg_4", String(Math.floor(Date.now() / 1000)), "v1,not-a-real-signature", env);
    expect(result).toBeNull();
  });

  it("returns null for a stale (replayed) timestamp", async () => {
    const { env } = makeMockEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const svixId = "msg_5";
    const staleTimestamp = Math.floor(Date.now() / 1000) - 3600;
    const rawBody = openedPayload();
    const signature = await signPayload(svixId, staleTimestamp, rawBody);

    expect(await verifyAndExtract(rawBody, svixId, String(staleTimestamp), signature, env)).toBeNull();
  });

  it("returns null when no webhook secret is configured", async () => {
    const { env } = makeMockEnv();
    const svixId = "msg_6";
    const timestamp = Math.floor(Date.now() / 1000);
    const rawBody = openedPayload();
    const signature = await signPayload(svixId, timestamp, rawBody);

    expect(await verifyAndExtract(rawBody, svixId, String(timestamp), signature, env)).toBeNull();
  });

  it("returns null when any svix header is missing", async () => {
    const { env } = makeMockEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    expect(await verifyAndExtract(openedPayload(), null, "123", "v1,abc", env)).toBeNull();
    expect(await verifyAndExtract(openedPayload(), "msg_7", null, "v1,abc", env)).toBeNull();
    expect(await verifyAndExtract(openedPayload(), "msg_7", "123", null, env)).toBeNull();
  });
});

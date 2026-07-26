import { describe, it, expect } from "vitest";
import resendWebhook from "./resendWebhook";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

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

describe("POST /api/webhooks/resend", () => {
  it("logs email_opened with its email_type and returns 200", async () => {
    const calls: unknown[][] = [];
    const { env } = makeMockEnv({
      RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });
    const svixId = "msg_1";
    const timestamp = Math.floor(Date.now() / 1000);
    const rawBody = JSON.stringify({
      type: "email.opened",
      data: { tags: [{ name: "email_type", value: "signing_invite" }] },
    });
    const signature = await signPayload(svixId, timestamp, rawBody);

    const res = await resendWebhook.request(
      "/",
      {
        method: "POST",
        body: rawBody,
        headers: { "svix-id": svixId, "svix-timestamp": String(timestamp), "svix-signature": signature },
      },
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    const [point] = calls[0] as [{ blobs: string[] }];
    expect(point.blobs[0]).toBe("email_opened");
    expect(point.blobs[12]).toBe("signing_invite"); // blob13 = emailType
  });

  it("still returns 200 (but logs nothing) for an invalid signature", async () => {
    const calls: unknown[][] = [];
    const { env } = makeMockEnv({
      RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });

    const res = await resendWebhook.request(
      "/",
      {
        method: "POST",
        body: JSON.stringify({ type: "email.opened", data: {} }),
        headers: { "svix-id": "msg_2", "svix-timestamp": String(Math.floor(Date.now() / 1000)), "svix-signature": "v1,bogus" },
      },
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });
});

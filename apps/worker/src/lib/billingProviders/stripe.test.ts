import { describe, it, expect } from "vitest";
import { verifyAndExtract } from "./stripe";
import { makeMockEnv } from "../../test/mockEnv";

const WEBHOOK_SECRET = "whsec_test_secret";

async function signPayload(rawBody: string, timestamp: number, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function makeHeader(rawBody: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): Promise<string> {
  const sig = await signPayload(rawBody, timestamp, secret);
  return `t=${timestamp},v1=${sig}`;
}

function checkoutCompletedPayload(accountId: string): string {
  return JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { client_reference_id: accountId } },
  });
}

describe("verifyAndExtract (Stripe)", () => {
  it("accepts a validly-signed checkout.session.completed event", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = checkoutCompletedPayload("acct-1");
    const header = await makeHeader(body, WEBHOOK_SECRET);

    const result = await verifyAndExtract(body, header, env);
    expect(result).toEqual({ accountId: "acct-1", paid: true });
  });

  it("rejects a signature made with the wrong secret", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = checkoutCompletedPayload("acct-1");
    const header = await makeHeader(body, "wrong-secret");

    expect(await verifyAndExtract(body, header, env)).toBeNull();
  });

  it("rejects a tampered body (signature no longer matches)", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = checkoutCompletedPayload("acct-1");
    const header = await makeHeader(body, WEBHOOK_SECRET);
    const tamperedBody = checkoutCompletedPayload("acct-attacker");

    expect(await verifyAndExtract(tamperedBody, header, env)).toBeNull();
  });

  it("rejects a missing signature header", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    expect(await verifyAndExtract(checkoutCompletedPayload("acct-1"), null, env)).toBeNull();
  });

  it("returns null when STRIPE_WEBHOOK_SECRET isn't configured", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: undefined });
    const body = checkoutCompletedPayload("acct-1");
    const header = await makeHeader(body, WEBHOOK_SECRET);
    expect(await verifyAndExtract(body, header, env)).toBeNull();
  });

  it("rejects a stale (replayed) event outside the tolerance window", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = checkoutCompletedPayload("acct-1");
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes old
    const header = await makeHeader(body, WEBHOOK_SECRET, staleTimestamp);

    expect(await verifyAndExtract(body, header, env)).toBeNull();
  });

  it("returns null for an event type it doesn't act on, even with a valid signature", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = JSON.stringify({ type: "customer.subscription.deleted", data: { object: {} } });
    const header = await makeHeader(body, WEBHOOK_SECRET);

    expect(await verifyAndExtract(body, header, env)).toBeNull();
  });

  it("returns null when client_reference_id is missing", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: {} } });
    const header = await makeHeader(body, WEBHOOK_SECRET);

    expect(await verifyAndExtract(body, header, env)).toBeNull();
  });
});

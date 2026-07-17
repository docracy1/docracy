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

function checkoutCompletedPayload(accountId: string, customerId?: string): string {
  return JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { client_reference_id: accountId, ...(customerId ? { customer: customerId } : {}) } },
  });
}

function subscriptionDeletedPayload(customerId?: string): string {
  return JSON.stringify({
    type: "customer.subscription.deleted",
    data: { object: customerId ? { customer: customerId } : {} },
  });
}

describe("verifyAndExtract (Stripe)", () => {
  it("accepts a validly-signed checkout.session.completed event", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = checkoutCompletedPayload("acct-1", "cus_1");
    const header = await makeHeader(body, WEBHOOK_SECRET);

    const result = await verifyAndExtract(body, header, env);
    expect(result).toEqual({ type: "checkout_completed", accountId: "acct-1", customerId: "cus_1" });
  });

  it("accepts a checkout.session.completed event with no customer id yet", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = checkoutCompletedPayload("acct-1");
    const header = await makeHeader(body, WEBHOOK_SECRET);

    const result = await verifyAndExtract(body, header, env);
    expect(result).toEqual({ type: "checkout_completed", accountId: "acct-1", customerId: null });
  });

  it("accepts a validly-signed customer.subscription.deleted event", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = subscriptionDeletedPayload("cus_1");
    const header = await makeHeader(body, WEBHOOK_SECRET);

    const result = await verifyAndExtract(body, header, env);
    expect(result).toEqual({ type: "subscription_deleted", customerId: "cus_1" });
  });

  it("returns null for a subscription.deleted event with no customer id", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = subscriptionDeletedPayload();
    const header = await makeHeader(body, WEBHOOK_SECRET);

    expect(await verifyAndExtract(body, header, env)).toBeNull();
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
    const body = JSON.stringify({ type: "invoice.payment_failed", data: { object: {} } });
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

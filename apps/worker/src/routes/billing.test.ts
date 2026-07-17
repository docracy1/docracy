import { describe, it, expect, vi, afterEach } from "vitest";
import billing from "./billing";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { makeMockEnv } from "../test/mockEnv";

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

describe("POST /api/billing/checkout", () => {
  afterEach(() => vi.restoreAllMocks());

  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await billing.request("/checkout", { method: "POST" }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("501s when Stripe isn't configured", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    const res = await billing.request(
      "/checkout",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(501);
  });

  it("creates a Stripe checkout session and returns its URL", async () => {
    const { env } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PRICE_ID: "price_x" });
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ url: "https://checkout.stripe.com/session/xyz" }), { status: 200 }));

    const res = await billing.request(
      "/checkout",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { url: string } = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session/xyz");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({ method: "POST" })
    );
    const callInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(callInit.body as string).toContain("client_reference_id=acct-1");
  });

  it("returns 502 when Stripe's API call fails", async () => {
    const { env } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PRICE_ID: "price_x" });
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 400 }));

    const res = await billing.request(
      "/checkout",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(502);
  });
});

async function signWebhook(rawBody: string, secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const signature = [...new Uint8Array(sigBytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${signature}`;
}

describe("POST /api/billing/webhook", () => {
  it("always responds ok, even for an invalid signature", async () => {
    const { env } = makeMockEnv();
    const res = await billing.request(
      "/webhook",
      { method: "POST", body: "{}", headers: { "Stripe-Signature": "t=1,v1=deadbeef" } },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
  });

  it("marks the account paid for a validly-signed checkout.session.completed event", async () => {
    const { env, d1 } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: "whsec_test" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    const rawBody = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "acct-1" } },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("whsec_test"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
    const signature = [...new Uint8Array(sigBytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

    const res = await billing.request(
      "/webhook",
      {
        method: "POST",
        body: rawBody,
        headers: { "Stripe-Signature": `t=${timestamp},v1=${signature}` },
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const row = (await d1.prepare("SELECT is_paid FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      is_paid: number;
    } | null;
    expect(row?.is_paid).toBe(1);
  });

  it("records the Stripe customer id from checkout.session.completed", async () => {
    const { env, d1 } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: "whsec_test" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    const rawBody = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "acct-1", customer: "cus_1" } },
    });
    const signature = await signWebhook(rawBody, "whsec_test");

    await billing.request("/webhook", { method: "POST", body: rawBody, headers: { "Stripe-Signature": signature } }, env, MOCK_CTX);

    const row = (await d1.prepare("SELECT stripe_customer_id FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      stripe_customer_id: string | null;
    } | null;
    expect(row?.stripe_customer_id).toBe("cus_1");
  });

  it("unmarks the account paid for a validly-signed customer.subscription.deleted event", async () => {
    const { env, d1 } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: "whsec_test" });
    await d1
      .prepare(
        `INSERT INTO accounts (id, email, created_at, is_paid, paid_at, stripe_customer_id) VALUES (?, ?, ?, 1, ?, ?)`
      )
      .bind("acct-1", "anna@example.com", new Date().toISOString(), new Date().toISOString(), "cus_1")
      .run();

    const rawBody = JSON.stringify({ type: "customer.subscription.deleted", data: { object: { customer: "cus_1" } } });
    const signature = await signWebhook(rawBody, "whsec_test");

    const res = await billing.request(
      "/webhook",
      { method: "POST", body: rawBody, headers: { "Stripe-Signature": signature } },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const row = (await d1.prepare("SELECT is_paid, paid_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      is_paid: number;
      paid_at: string | null;
    } | null;
    expect(row?.is_paid).toBe(0);
    expect(row?.paid_at).toBeNull();
  });

  it("is a no-op for customer.subscription.deleted when no account matches the customer id", async () => {
    const { env } = makeMockEnv({ STRIPE_WEBHOOK_SECRET: "whsec_test" });
    const rawBody = JSON.stringify({ type: "customer.subscription.deleted", data: { object: { customer: "cus_unknown" } } });
    const signature = await signWebhook(rawBody, "whsec_test");

    const res = await billing.request(
      "/webhook",
      { method: "POST", body: rawBody, headers: { "Stripe-Signature": signature } },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
  });
});

describe("POST /api/billing/portal", () => {
  afterEach(() => vi.restoreAllMocks());

  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await billing.request("/portal", { method: "POST" }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("402s for a logged-in but unpaid account", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", false, null, null);
    const res = await billing.request(
      "/portal",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(402);
  });

  it("501s when Stripe isn't configured", async () => {
    const { env } = makeMockEnv();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);
    const res = await billing.request(
      "/portal",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(501);
  });

  it("404s when the paid account has no Stripe customer id on file", async () => {
    const { env } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x" });
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);
    const res = await billing.request(
      "/portal",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(404);
  });

  it("creates a billing portal session and returns its URL", async () => {
    const { env, d1 } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, stripe_customer_id) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString(), "cus_1")
      .run();
    const ctx = makeCtx();
    const token = await createSession(env, ctx, "acct-1", "anna@example.com", true, null, null);

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ url: "https://billing.stripe.com/session/xyz" }), { status: 200 }));

    const res = await billing.request(
      "/portal",
      { method: "POST", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const body: { url: string } = await res.json();
    expect(body.url).toBe("https://billing.stripe.com/session/xyz");

    const callInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(callInit.body as string).toContain("customer=cus_1");
  });
});

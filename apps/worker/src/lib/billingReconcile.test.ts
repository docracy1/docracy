import { describe, it, expect, vi, afterEach } from "vitest";
import {
  applySessionIfPaid,
  isCheckoutSessionPaid,
  reconcileCheckoutForAccount,
  reconcileStaleCheckouts,
  stripeCustomerIdFromSession,
} from "./billingReconcile";
import { persistCheckoutSession } from "./billing";
import { makeMockEnv } from "../test/mockEnv";

describe("isCheckoutSessionPaid", () => {
  it("requires status=complete and a paid payment_status", () => {
    expect(isCheckoutSessionPaid({ status: "complete", payment_status: "paid" })).toBe(true);
    expect(isCheckoutSessionPaid({ status: "complete", payment_status: "no_payment_required" })).toBe(true);
    expect(isCheckoutSessionPaid({ status: "complete", payment_status: "unpaid" })).toBe(false);
    expect(isCheckoutSessionPaid({ status: "open", payment_status: "paid" })).toBe(false);
  });
});

describe("stripeCustomerIdFromSession", () => {
  it("reads a string customer or an expanded object", () => {
    expect(stripeCustomerIdFromSession({ customer: "cus_1" })).toBe("cus_1");
    expect(stripeCustomerIdFromSession({ customer: { id: "cus_2" } })).toBe("cus_2");
    expect(stripeCustomerIdFromSession({ customer: null })).toBeNull();
  });
});

describe("applySessionIfPaid", () => {
  it("upgrades the matching account when Stripe says the session is paid", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    const ok = await applySessionIfPaid(env, "acct-1", {
      status: "complete",
      payment_status: "paid",
      client_reference_id: "acct-1",
      customer: "cus_9",
    });
    expect(ok).toBe(true);
    const row = (await d1.prepare("SELECT is_paid, stripe_customer_id FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      is_paid: number;
      stripe_customer_id: string | null;
    } | null;
    expect(row?.is_paid).toBe(1);
    expect(row?.stripe_customer_id).toBe("cus_9");
  });

  it("refuses to upgrade when client_reference_id belongs to someone else", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    const ok = await applySessionIfPaid(env, "acct-1", {
      status: "complete",
      payment_status: "paid",
      client_reference_id: "acct-other",
      customer: "cus_9",
    });
    expect(ok).toBe(false);
    const row = (await d1.prepare("SELECT is_paid FROM accounts WHERE id = ?").bind("acct-1").first()) as { is_paid: number };
    expect(row.is_paid).toBe(0);
  });
});

describe("reconcileCheckoutForAccount", () => {
  afterEach(() => vi.restoreAllMocks());

  it("applies a completed Checkout Session fetched from Stripe", async () => {
    const { env, d1 } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();
    await persistCheckoutSession(env, "acct-1", "cs_test_1");

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "cs_test_1",
          status: "complete",
          payment_status: "paid",
          client_reference_id: "acct-1",
          customer: "cus_1",
        }),
        { status: 200 }
      )
    );

    const result = await reconcileCheckoutForAccount(env, "acct-1", "cs_test_1");
    expect(result).toEqual({ paid: true, reconciled: true });
    const row = (await d1.prepare("SELECT is_paid FROM accounts WHERE id = ?").bind("acct-1").first()) as { is_paid: number };
    expect(row.is_paid).toBe(1);
  });

  it("is a no-op when the session is still open", async () => {
    const { env, d1 } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "cs_test_1", status: "open", payment_status: "unpaid", client_reference_id: "acct-1" }), {
        status: 200,
      })
    );

    const result = await reconcileCheckoutForAccount(env, "acct-1", "cs_test_1");
    expect(result.paid).toBe(false);
    const row = (await d1.prepare("SELECT is_paid FROM accounts WHERE id = ?").bind("acct-1").first()) as { is_paid: number };
    expect(row.is_paid).toBe(0);
  });
});

describe("reconcileStaleCheckouts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("heals an unpaid account whose Checkout Session completed more than a minute ago", async () => {
    const { env, d1 } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x" });
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();
    await persistCheckoutSession(env, "acct-1", "cs_test_stale");
    const old = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await d1
      .prepare(`UPDATE accounts SET stripe_checkout_created_at = ? WHERE id = ?`)
      .bind(old, "acct-1")
      .run();

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "cs_test_stale",
          status: "complete",
          payment_status: "paid",
          client_reference_id: "acct-1",
          customer: "cus_stale",
        }),
        { status: 200 }
      )
    );
    vi.spyOn(console, "log").mockImplementation(() => {});

    const healed = await reconcileStaleCheckouts(env);
    expect(healed).toBe(1);
    const row = (await d1.prepare("SELECT is_paid FROM accounts WHERE id = ?").bind("acct-1").first()) as { is_paid: number };
    expect(row.is_paid).toBe(1);
  });
});

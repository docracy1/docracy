import { describe, it, expect } from "vitest";
import { runPaymentFreezeSweep } from "./paymentFreeze";
import { makeMockEnv } from "../test/mockEnv";

describe("runPaymentFreezeSweep", () => {
  it("freezes (downgrades) an account whose payment has been failing for more than 7 days", async () => {
    const { env, d1 } = makeMockEnv();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-overdue", "overdue@example.com", new Date().toISOString(), eightDaysAgo)
      .run();

    await runPaymentFreezeSweep(env);

    const row = (await d1.prepare("SELECT is_paid, payment_failed_at FROM accounts WHERE id = ?").bind("acct-overdue").first()) as {
      is_paid: number;
      payment_failed_at: string | null;
    } | null;
    expect(row?.is_paid).toBe(0);
    expect(row?.payment_failed_at).toBeNull();
  });

  it("leaves an account within the 7-day grace period untouched", async () => {
    const { env, d1 } = makeMockEnv();
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-recent", "recent@example.com", new Date().toISOString(), oneDayAgo)
      .run();

    await runPaymentFreezeSweep(env);

    const row = (await d1.prepare("SELECT is_paid FROM accounts WHERE id = ?").bind("acct-recent").first()) as {
      is_paid: number;
    } | null;
    expect(row?.is_paid).toBe(1);
  });
});

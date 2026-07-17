import { describe, it, expect } from "vitest";
import { findAccountIdByStripeCustomerId, getStripeCustomerId, markAccountPaid, setStripeCustomerId } from "./billing";
import { issueApiToken, hasApiToken } from "./apiTokens";
import { makeMockEnv } from "../test/mockEnv";

describe("markAccountPaid", () => {
  it("marks an account as paid and stamps paid_at", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    await markAccountPaid(env, "acct-1", true);

    const row = (await d1.prepare("SELECT is_paid, paid_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      is_paid: number;
      paid_at: string | null;
    } | null;
    expect(row?.is_paid).toBe(1);
    expect(row?.paid_at).toBeTruthy();
  });

  it("unmarks an account and clears paid_at", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, paid_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString(), new Date().toISOString())
      .run();

    await markAccountPaid(env, "acct-1", false);

    const row = (await d1.prepare("SELECT is_paid, paid_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      is_paid: number;
      paid_at: string | null;
    } | null;
    expect(row?.is_paid).toBe(0);
    expect(row?.paid_at).toBeNull();
  });

  it("does nothing (doesn't throw) when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    await expect(markAccountPaid(env, "acct-1", true)).resolves.toBeUndefined();
  });

  it("revokes the account's API token the moment it's unmarked as paid", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();
    await issueApiToken(env, "acct-1");
    expect(await hasApiToken(env, "acct-1")).toBe(true);

    await markAccountPaid(env, "acct-1", false);

    expect(await hasApiToken(env, "acct-1")).toBe(false);
  });

  it("does not touch an API token when marking an account as paid", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();
    await issueApiToken(env, "acct-1");

    await markAccountPaid(env, "acct-1", true);

    expect(await hasApiToken(env, "acct-1")).toBe(true);
  });
});

describe("stripe customer id linking", () => {
  async function insertAccount(d1: ReturnType<typeof makeMockEnv>["d1"], id: string) {
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind(id, `${id}@example.com`, new Date().toISOString())
      .run();
  }

  it("sets and reads back a Stripe customer id", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1");

    await setStripeCustomerId(env, "acct-1", "cus_1");

    expect(await getStripeCustomerId(env, "acct-1")).toBe("cus_1");
  });

  it("resolves an account id back from a Stripe customer id", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1");
    await setStripeCustomerId(env, "acct-1", "cus_1");

    expect(await findAccountIdByStripeCustomerId(env, "cus_1")).toBe("acct-1");
    expect(await findAccountIdByStripeCustomerId(env, "cus_unknown")).toBeNull();
  });

  it("never overwrites an already-set customer id", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1");
    await setStripeCustomerId(env, "acct-1", "cus_1");

    await setStripeCustomerId(env, "acct-1", "cus_2");

    expect(await getStripeCustomerId(env, "acct-1")).toBe("cus_1");
  });

  it("returns null when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    await expect(setStripeCustomerId(env, "acct-1", "cus_1")).resolves.toBeUndefined();
    expect(await getStripeCustomerId(env, "acct-1")).toBeNull();
    expect(await findAccountIdByStripeCustomerId(env, "cus_1")).toBeNull();
  });
});

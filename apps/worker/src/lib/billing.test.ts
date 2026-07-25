import { describe, it, expect } from "vitest";
import {
  clearPaymentFailed,
  findAccountIdByEmail,
  findAccountIdByStripeCustomerId,
  findAccountsPastPaymentFailureGrace,
  getStripeCustomerId,
  markAccountEnterprise,
  markAccountPaid,
  markPaymentFailed,
  setStripeCustomerId,
} from "./billing";
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

  it("deletes cloud-storage connections the moment an account is unmarked as paid", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, is_enterprise) VALUES (?, ?, ?, 1, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();
    await d1
      .prepare(
        `INSERT INTO cloud_connections (id, account_id, provider, access_token, created_at) VALUES (?, ?, ?, ?, ?)`
      )
      .bind("conn-1", "acct-1", "dropbox", "at-1", new Date().toISOString())
      .run();

    await markAccountPaid(env, "acct-1", false);

    const row = await d1.prepare("SELECT COUNT(*) as n FROM cloud_connections WHERE account_id = ?").bind("acct-1").first();
    expect((row as { n: number }).n).toBe(0);
  });

  it("clears a pending payment_failed_at when the account is marked paid again", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString(), new Date().toISOString())
      .run();

    await markAccountPaid(env, "acct-1", true);

    const row = (await d1.prepare("SELECT payment_failed_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      payment_failed_at: string | null;
    } | null;
    expect(row?.payment_failed_at).toBeNull();
  });

  it("clears payment_failed_at when the account is frozen/downgraded", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString(), new Date().toISOString())
      .run();

    await markAccountPaid(env, "acct-1", false);

    const row = (await d1.prepare("SELECT payment_failed_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      payment_failed_at: string | null;
    } | null;
    expect(row?.payment_failed_at).toBeNull();
  });
});

describe("markPaymentFailed", () => {
  it("stamps payment_failed_at on first failure", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    await markPaymentFailed(env, "acct-1");

    const row = (await d1.prepare("SELECT payment_failed_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      payment_failed_at: string | null;
    } | null;
    expect(row?.payment_failed_at).toBeTruthy();
  });

  it("doesn't reset the timestamp on a repeat failure (dunning retries count from the first)", async () => {
    const { env, d1 } = makeMockEnv();
    const firstFailure = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString(), firstFailure)
      .run();

    await markPaymentFailed(env, "acct-1");

    const row = (await d1.prepare("SELECT payment_failed_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      payment_failed_at: string | null;
    } | null;
    expect(row?.payment_failed_at).toBe(firstFailure);
  });

  it("does nothing (doesn't throw) when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    await expect(markPaymentFailed(env, "acct-1")).resolves.toBeUndefined();
  });
});

describe("clearPaymentFailed", () => {
  it("clears payment_failed_at", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString(), new Date().toISOString())
      .run();

    await clearPaymentFailed(env, "acct-1");

    const row = (await d1.prepare("SELECT payment_failed_at FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      payment_failed_at: string | null;
    } | null;
    expect(row?.payment_failed_at).toBeNull();
  });
});

describe("findAccountsPastPaymentFailureGrace", () => {
  it("returns accounts whose payment has been failing for more than 7 days", async () => {
    const { env, d1 } = makeMockEnv();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-overdue", "overdue@example.com", new Date().toISOString(), eightDaysAgo)
      .run();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, payment_failed_at) VALUES (?, ?, ?, 1, ?)`)
      .bind("acct-recent", "recent@example.com", new Date().toISOString(), oneDayAgo)
      .run();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-fine", "fine@example.com", new Date().toISOString())
      .run();

    expect(await findAccountsPastPaymentFailureGrace(env)).toEqual(["acct-overdue"]);
  });

  it("returns an empty array when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    expect(await findAccountsPastPaymentFailureGrace(env)).toEqual([]);
  });
});

describe("markAccountEnterprise", () => {
  it("sets is_enterprise without stamping any expiry — Stripe's own subscription is authoritative now", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    await markAccountEnterprise(env, "acct-1");

    const row = (await d1.prepare("SELECT is_enterprise FROM accounts WHERE id = ?").bind("acct-1").first()) as {
      is_enterprise: number;
    } | null;
    expect(row?.is_enterprise).toBe(1);
  });

  it("does nothing (doesn't throw) when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    await expect(markAccountEnterprise(env, "acct-1")).resolves.toBeUndefined();
  });
});

describe("findAccountIdByEmail", () => {
  it("resolves an account id by email, case-insensitively", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    expect(await findAccountIdByEmail(env, "Anna@Example.com")).toBe("acct-1");
  });

  it("returns null for an unknown email", async () => {
    const { env } = makeMockEnv();
    expect(await findAccountIdByEmail(env, "nobody@example.com")).toBeNull();
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

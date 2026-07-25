import { describe, it, expect } from "vitest";
import { runEnterpriseExpirySweep } from "./enterpriseExpiry";
import { markAccountEnterprise } from "./billing";
import { makeMockEnv } from "../test/mockEnv";

async function seedAccount(d1: ReturnType<typeof makeMockEnv>["d1"], id: string, expiresAt: string | null) {
  await d1
    .prepare(
      `INSERT INTO accounts (id, email, created_at, is_paid, is_enterprise, enterprise_expires_at) VALUES (?, ?, ?, 1, 1, ?)`
    )
    .bind(id, `${id}@example.com`, new Date().toISOString(), expiresAt)
    .run();
}

describe("runEnterpriseExpirySweep", () => {
  it("revokes paid + enterprise status for an account past its expiry date", async () => {
    const { env, d1 } = makeMockEnv();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await seedAccount(d1, "acct-expired", yesterday);

    await runEnterpriseExpirySweep(env);

    const row = (await d1
      .prepare("SELECT is_paid, is_enterprise, enterprise_expires_at FROM accounts WHERE id = ?")
      .bind("acct-expired")
      .first()) as { is_paid: number; is_enterprise: number; enterprise_expires_at: string | null } | null;
    expect(row?.is_paid).toBe(0);
    expect(row?.is_enterprise).toBe(0);
    expect(row?.enterprise_expires_at).toBeNull();
  });

  it("also deletes any cloud-storage connections for an account past its expiry date", async () => {
    const { env, d1 } = makeMockEnv();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await seedAccount(d1, "acct-expired", yesterday);
    await d1
      .prepare(
        `INSERT INTO cloud_connections (id, account_id, provider, access_token, created_at) VALUES (?, ?, ?, ?, ?)`
      )
      .bind("conn-1", "acct-expired", "dropbox", "at-1", new Date().toISOString())
      .run();

    await runEnterpriseExpirySweep(env);

    const row = await d1.prepare("SELECT COUNT(*) as n FROM cloud_connections WHERE account_id = ?").bind("acct-expired").first();
    expect((row as { n: number }).n).toBe(0);
  });

  it("leaves an account with a future expiry date untouched", async () => {
    const { env, d1 } = makeMockEnv();
    const nextYear = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString();
    await seedAccount(d1, "acct-active", nextYear);

    await runEnterpriseExpirySweep(env);

    const row = (await d1.prepare("SELECT is_paid, is_enterprise FROM accounts WHERE id = ?").bind("acct-active").first()) as {
      is_paid: number;
      is_enterprise: number;
    } | null;
    expect(row?.is_paid).toBe(1);
    expect(row?.is_enterprise).toBe(1);
  });

  it("ignores enterprise accounts with no expiry date set", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-no-expiry", null);

    await runEnterpriseExpirySweep(env);

    const row = (await d1.prepare("SELECT is_paid, is_enterprise FROM accounts WHERE id = ?").bind("acct-no-expiry").first()) as {
      is_paid: number;
      is_enterprise: number;
    } | null;
    expect(row?.is_paid).toBe(1);
    expect(row?.is_enterprise).toBe(1);
  });
});

describe("markAccountEnterprise", () => {
  it("stamps enterprise_expires_at roughly one year out", async () => {
    const { env, d1 } = makeMockEnv();
    await d1
      .prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
      .bind("acct-1", "anna@example.com", new Date().toISOString())
      .run();

    await markAccountEnterprise(env, "acct-1");

    const row = (await d1
      .prepare("SELECT is_enterprise, enterprise_expires_at FROM accounts WHERE id = ?")
      .bind("acct-1")
      .first()) as { is_enterprise: number; enterprise_expires_at: string } | null;
    expect(row?.is_enterprise).toBe(1);
    const daysOut = (new Date(row!.enterprise_expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysOut).toBeGreaterThan(360);
    expect(daysOut).toBeLessThan(370);
  });
});

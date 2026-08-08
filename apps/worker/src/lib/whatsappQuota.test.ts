import { describe, it, expect } from "vitest";
import { consumeWhatsappQuota, consumeWhatsappQuotaWithOverage, peekWhatsappQuotaRemaining } from "./whatsappQuota";
import { makeMockEnv } from "../test/mockEnv";

async function seedAccount(d1: ReturnType<typeof makeMockEnv>["d1"], id: string) {
  await d1.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`).bind(id, `${id}@example.com`, new Date().toISOString()).run();
}

describe("whatsapp quota — free tier (2/month)", () => {
  it("starts with the full monthly allowance", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    expect(await peekWhatsappQuotaRemaining(env, "acct-1", false)).toBe(2);
  });

  it("consumes down to zero and then refuses", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    expect(await consumeWhatsappQuota(env, "acct-1", false, 1)).toBe(true);
    expect(await peekWhatsappQuotaRemaining(env, "acct-1", false)).toBe(1);
    expect(await consumeWhatsappQuota(env, "acct-1", false, 1)).toBe(true);
    expect(await peekWhatsappQuotaRemaining(env, "acct-1", false)).toBe(0);
    expect(await consumeWhatsappQuota(env, "acct-1", false, 1)).toBe(false);
  });

  it("refuses a single request that would exceed the cap, without partially consuming it", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    expect(await consumeWhatsappQuota(env, "acct-1", false, 3)).toBe(false);
    expect(await peekWhatsappQuotaRemaining(env, "acct-1", false)).toBe(2);
  });

  it("resets the allowance once the stored month is stale", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    await d1
      .prepare(`UPDATE accounts SET whatsapp_quota_month = ?, whatsapp_quota_used = ? WHERE id = ?`)
      .bind("2020-01", 2, "acct-1")
      .run();
    expect(await peekWhatsappQuotaRemaining(env, "acct-1", false)).toBe(2);
    expect(await consumeWhatsappQuota(env, "acct-1", false, 2)).toBe(true);
  });

  it("degrades to unlimited when D1 isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    expect(await peekWhatsappQuotaRemaining(env, "acct-1", false)).toBe(2);
    expect(await consumeWhatsappQuota(env, "acct-1", false, 5)).toBe(true);
  });
});

describe("whatsapp quota — paid tier (10/month, hard cap when overage isn't configured)", () => {
  it("starts with the full paid monthly allowance", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-paid");
    expect(await peekWhatsappQuotaRemaining(env, "acct-paid", true)).toBe(10);
  });

  it("allows up to 10 but refuses the 11th", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-paid");
    expect(await consumeWhatsappQuota(env, "acct-paid", true, 10)).toBe(true);
    expect(await peekWhatsappQuotaRemaining(env, "acct-paid", true)).toBe(0);
    expect(await consumeWhatsappQuota(env, "acct-paid", true, 1)).toBe(false);
  });

  it("keeps the free and paid tiers on separate limits for the same account row shape", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    expect(await consumeWhatsappQuota(env, "acct-1", false, 2)).toBe(true); // exhausts the free cap
    expect(await consumeWhatsappQuota(env, "acct-1", false, 1)).toBe(false);
    // Same account, now treated as paid — sees the higher cap applied to the same usage counter.
    expect(await peekWhatsappQuotaRemaining(env, "acct-1", true)).toBe(8);
  });
});

describe("consumeWhatsappQuotaWithOverage (paid, billing-enabled deployments)", () => {
  it("never refuses, and reports zero overage while within the included allowance", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-paid");
    expect(await consumeWhatsappQuotaWithOverage(env, "acct-paid", 7)).toBe(0);
    expect(await peekWhatsappQuotaRemaining(env, "acct-paid", true)).toBe(3);
  });

  it("bills only the portion of a request that crosses the included limit", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-paid");
    await consumeWhatsappQuotaWithOverage(env, "acct-paid", 8); // 8 used, 2 left in the included 10
    expect(await consumeWhatsappQuotaWithOverage(env, "acct-paid", 5)).toBe(3); // 2 free + 3 billed
  });

  it("bills the full request once already past the included limit", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-paid");
    await consumeWhatsappQuotaWithOverage(env, "acct-paid", 12); // 2 billed already
    expect(await consumeWhatsappQuotaWithOverage(env, "acct-paid", 4)).toBe(4);
  });

  it("degrades to zero overage when D1 isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    expect(await consumeWhatsappQuotaWithOverage(env, "acct-paid", 20)).toBe(0);
  });
});

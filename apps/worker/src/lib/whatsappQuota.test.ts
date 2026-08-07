import { describe, it, expect } from "vitest";
import { consumeWhatsappQuota, peekWhatsappQuotaRemaining } from "./whatsappQuota";
import { makeMockEnv } from "../test/mockEnv";

async function seedAccount(d1: ReturnType<typeof makeMockEnv>["d1"], id: string) {
  await d1.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 0)`).bind(id, `${id}@example.com`, new Date().toISOString()).run();
}

describe("whatsapp quota", () => {
  it("starts with the full monthly allowance", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    expect(await peekWhatsappQuotaRemaining(env, "acct-1")).toBe(2);
  });

  it("consumes down to zero and then refuses", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    expect(await consumeWhatsappQuota(env, "acct-1", 1)).toBe(true);
    expect(await peekWhatsappQuotaRemaining(env, "acct-1")).toBe(1);
    expect(await consumeWhatsappQuota(env, "acct-1", 1)).toBe(true);
    expect(await peekWhatsappQuotaRemaining(env, "acct-1")).toBe(0);
    expect(await consumeWhatsappQuota(env, "acct-1", 1)).toBe(false);
  });

  it("refuses a single request that would exceed the cap, without partially consuming it", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    expect(await consumeWhatsappQuota(env, "acct-1", 3)).toBe(false);
    expect(await peekWhatsappQuotaRemaining(env, "acct-1")).toBe(2);
  });

  it("resets the allowance once the stored month is stale", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(d1, "acct-1");
    await d1
      .prepare(`UPDATE accounts SET whatsapp_quota_month = ?, whatsapp_quota_used = ? WHERE id = ?`)
      .bind("2020-01", 2, "acct-1")
      .run();
    expect(await peekWhatsappQuotaRemaining(env, "acct-1")).toBe(2);
    expect(await consumeWhatsappQuota(env, "acct-1", 2)).toBe(true);
  });

  it("degrades to unlimited when D1 isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    expect(await peekWhatsappQuotaRemaining(env, "acct-1")).toBe(2);
    expect(await consumeWhatsappQuota(env, "acct-1", 5)).toBe(true);
  });
});

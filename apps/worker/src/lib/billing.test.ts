import { describe, it, expect } from "vitest";
import { markAccountPaid } from "./billing";
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
});

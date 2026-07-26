import { describe, it, expect } from "vitest";
import { scheduleOnboardingEmails, runOnboardingEmailSweep } from "./onboardingEmails";
import { makeMockEnv } from "../test/mockEnv";

type MockD1 = ReturnType<typeof makeMockEnv>["d1"];

async function insertAccount(d1: MockD1, id: string, email: string) {
  await d1
    .prepare(`INSERT INTO accounts (id, email, created_at, is_paid, last_login_at) VALUES (?, ?, ?, 0, ?)`)
    .bind(id, email, new Date().toISOString(), new Date().toISOString())
    .run();
}

async function insertOnboardingRow(d1: MockD1, accountId: string, email: string, createdAgoMs: number) {
  const createdAt = new Date(Date.now() - createdAgoMs).toISOString();
  await d1
    .prepare(`INSERT INTO onboarding_emails (account_id, email, account_created_at) VALUES (?, ?, ?)`)
    .bind(accountId, email, createdAt)
    .run();
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("scheduleOnboardingEmails", () => {
  it("inserts a row with no steps sent yet", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1", "new@example.com");

    await scheduleOnboardingEmails(env, "acct-1", "new@example.com");

    const row = (await d1.prepare(`SELECT * FROM onboarding_emails WHERE account_id = ?`).bind("acct-1").first()) as Record<
      string,
      unknown
    > | null;
    expect(row?.email).toBe("new@example.com");
    expect(row?.step1_sent_at).toBeNull();
    expect(row?.step2_sent_at).toBeNull();
    expect(row?.step3_sent_at).toBeNull();
    expect(row?.step4_sent_at).toBeNull();
  });
});

describe("runOnboardingEmailSweep", () => {
  it("sends step 1 once 3 minutes have passed and marks it sent", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1", "new@example.com");
    await insertOnboardingRow(d1, "acct-1", "new@example.com", 4 * MINUTE);

    await runOnboardingEmailSweep(env);

    const row = (await d1.prepare(`SELECT step1_sent_at FROM onboarding_emails WHERE account_id = ?`).bind("acct-1").first()) as {
      step1_sent_at: string | null;
    } | null;
    expect(row?.step1_sent_at).not.toBeNull();
  });

  it("does not send step 1 before 3 minutes have passed", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1", "new@example.com");
    await insertOnboardingRow(d1, "acct-1", "new@example.com", 1 * MINUTE);

    await runOnboardingEmailSweep(env);

    const row = (await d1.prepare(`SELECT step1_sent_at FROM onboarding_emails WHERE account_id = ?`).bind("acct-1").first()) as {
      step1_sent_at: string | null;
    } | null;
    expect(row?.step1_sent_at).toBeNull();
  });

  it("does not re-send a step that's already been sent", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1", "new@example.com");
    await insertOnboardingRow(d1, "acct-1", "new@example.com", 10 * MINUTE);
    const firstSentAt = new Date(Date.now() - 5 * MINUTE).toISOString();
    await d1.prepare(`UPDATE onboarding_emails SET step1_sent_at = ? WHERE account_id = ?`).bind(firstSentAt, "acct-1").run();

    await runOnboardingEmailSweep(env);

    const row = (await d1.prepare(`SELECT step1_sent_at FROM onboarding_emails WHERE account_id = ?`).bind("acct-1").first()) as {
      step1_sent_at: string | null;
    } | null;
    expect(row?.step1_sent_at).toBe(firstSentAt);
  });

  it("sends step 2 (4h) only once the account has NOT sent a document", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-sent", "sent@example.com");
    await insertOnboardingRow(d1, "acct-sent", "sent@example.com", 5 * HOUR);
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind("doc-1", "acct-sent", "Some doc", "pending", new Date().toISOString(), new Date(Date.now() + DAY).toISOString())
      .run();

    await insertAccount(d1, "acct-not-sent", "notsent@example.com");
    await insertOnboardingRow(d1, "acct-not-sent", "notsent@example.com", 5 * HOUR);

    await runOnboardingEmailSweep(env);

    const sentRow = (await d1.prepare(`SELECT step2_sent_at FROM onboarding_emails WHERE account_id = ?`).bind("acct-sent").first()) as {
      step2_sent_at: string | null;
    } | null;
    const notSentRow = (await d1
      .prepare(`SELECT step2_sent_at FROM onboarding_emails WHERE account_id = ?`)
      .bind("acct-not-sent")
      .first()) as { step2_sent_at: string | null } | null;

    expect(sentRow?.step2_sent_at).toBeNull(); // already sent a document — no nudge
    expect(notSentRow?.step2_sent_at).not.toBeNull(); // never sent one — gets the nudge
  });

  it("sends only the most-escalated due step per account in a single sweep (long cron gap)", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1", "new@example.com");
    // Account created 4 days ago with nothing ever sent: steps 1-4 are all overdue at once.
    await insertOnboardingRow(d1, "acct-1", "new@example.com", 4 * DAY);

    await runOnboardingEmailSweep(env);

    const row = (await d1
      .prepare(`SELECT step1_sent_at, step2_sent_at, step3_sent_at, step4_sent_at FROM onboarding_emails WHERE account_id = ?`)
      .bind("acct-1")
      .first()) as Record<string, string | null> | null;

    const sentCount = Object.values(row ?? {}).filter((v) => v !== null).length;
    expect(sentCount).toBe(1);
    expect(row?.step4_sent_at).not.toBeNull(); // the most escalated one wins
  });
});

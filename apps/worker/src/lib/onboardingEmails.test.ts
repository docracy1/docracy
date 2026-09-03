import { describe, it, expect } from "vitest";
import { scheduleOnboardingEmails, schedulePreparerLeadEmails, runOnboardingEmailSweep } from "./onboardingEmails";
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

  it("sends step 2 (day-2 Docstoc-style check-in) once 2 days have passed", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1", "new@example.com");
    await insertOnboardingRow(d1, "acct-1", "new@example.com", 2 * DAY + HOUR);

    await runOnboardingEmailSweep(env);

    const row = (await d1
      .prepare(`SELECT step1_sent_at, step2_sent_at, step3_sent_at, step4_sent_at FROM onboarding_emails WHERE account_id = ?`)
      .bind("acct-1")
      .first()) as Record<string, string | null> | null;

    // Latest-first: day-2 is due and day-3 is not yet — only step2 lands.
    expect(row?.step2_sent_at).not.toBeNull();
    expect(row?.step4_sent_at).toBeNull();
    expect(row?.step1_sent_at).toBeNull();
    expect(row?.step3_sent_at).toBeNull();
  });

  it("sends step 3 (24h) only once the account has NOT sent a document", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-sent", "sent@example.com");
    await insertOnboardingRow(d1, "acct-sent", "sent@example.com", 25 * HOUR);
    await d1
      .prepare(
        `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at) VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind("doc-1", "acct-sent", "Some doc", "pending", new Date().toISOString(), new Date(Date.now() + DAY).toISOString())
      .run();

    await insertAccount(d1, "acct-not-sent", "notsent@example.com");
    await insertOnboardingRow(d1, "acct-not-sent", "notsent@example.com", 25 * HOUR);

    await runOnboardingEmailSweep(env);

    const sentRow = (await d1.prepare(`SELECT step3_sent_at FROM onboarding_emails WHERE account_id = ?`).bind("acct-sent").first()) as {
      step3_sent_at: string | null;
    } | null;
    const notSentRow = (await d1
      .prepare(`SELECT step3_sent_at FROM onboarding_emails WHERE account_id = ?`)
      .bind("acct-not-sent")
      .first()) as { step3_sent_at: string | null } | null;

    expect(sentRow?.step3_sent_at).toBeNull(); // already sent a document — no nudge
    expect(notSentRow?.step3_sent_at).not.toBeNull(); // never sent one — gets the nudge
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

describe("schedulePreparerLeadEmails", () => {
  it("inserts a lead for an anonymous opt-in", async () => {
    const { env, d1 } = makeMockEnv();
    await schedulePreparerLeadEmails(env, "Preparer@Example.com");

    const row = (await d1.prepare(`SELECT * FROM onboarding_leads WHERE email = ?`).bind("preparer@example.com").first()) as Record<
      string,
      unknown
    > | null;
    expect(row?.source).toBe("preparer_optin");
    expect(row?.step1_sent_at).toBeNull();
  });

  it("does not start a lead drip for an address that already has an account", async () => {
    const { env, d1 } = makeMockEnv();
    await insertAccount(d1, "acct-1", "preparer@example.com");
    await schedulePreparerLeadEmails(env, "preparer@example.com");

    const row = await d1.prepare(`SELECT 1 FROM onboarding_leads WHERE email = ?`).bind("preparer@example.com").first();
    expect(row).toBeNull();
  });

  it("does not restart the sequence on a second opt-in", async () => {
    const { env, d1 } = makeMockEnv();
    await schedulePreparerLeadEmails(env, "preparer@example.com");
    const first = (await d1.prepare(`SELECT opted_in_at FROM onboarding_leads WHERE email = ?`).bind("preparer@example.com").first()) as {
      opted_in_at: string;
    };
    await schedulePreparerLeadEmails(env, "preparer@example.com");
    const second = (await d1.prepare(`SELECT opted_in_at FROM onboarding_leads WHERE email = ?`).bind("preparer@example.com").first()) as {
      opted_in_at: string;
    };
    expect(second.opted_in_at).toBe(first.opted_in_at);
  });

  it("clears the lead when the same email creates an account", async () => {
    const { env, d1 } = makeMockEnv();
    await schedulePreparerLeadEmails(env, "preparer@example.com");
    await insertAccount(d1, "acct-1", "preparer@example.com");
    await scheduleOnboardingEmails(env, "acct-1", "preparer@example.com");

    const lead = await d1.prepare(`SELECT 1 FROM onboarding_leads WHERE email = ?`).bind("preparer@example.com").first();
    expect(lead).toBeNull();
    const accountRow = await d1.prepare(`SELECT 1 FROM onboarding_emails WHERE account_id = ?`).bind("acct-1").first();
    expect(accountRow).not.toBeNull();
  });
});

describe("runOnboardingEmailSweep leads", () => {
  it("sends preparer lead step 1 after the delay", async () => {
    const { env, d1 } = makeMockEnv();
    const optedInAt = new Date(Date.now() - 4 * MINUTE).toISOString();
    await d1
      .prepare(`INSERT INTO onboarding_leads (email, source, opted_in_at) VALUES (?, ?, ?)`)
      .bind("preparer@example.com", "preparer_optin", optedInAt)
      .run();

    await runOnboardingEmailSweep(env);

    const row = (await d1.prepare(`SELECT step1_sent_at FROM onboarding_leads WHERE email = ?`).bind("preparer@example.com").first()) as {
      step1_sent_at: string | null;
    };
    expect(row.step1_sent_at).not.toBeNull();
  });
});

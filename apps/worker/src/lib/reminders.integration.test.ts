import { describe, it, expect } from "vitest";
import { runReminderSweep } from "./reminders";
import { putDoc, getDoc } from "./kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

function makeDoc(daysAgo: number, remindersSent: number[] = []): DocState {
  const linkSentAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: linkSentAt,
    expiresAt: new Date(Date.now() + 99999999).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers: [
      { order: 1, name: "Anna", email: "anna@example.com", status: "pending", signedAt: null, linkSentAt, remindersSent },
      { order: 2, name: "Max", email: "max@example.com", status: "pending", signedAt: null, linkSentAt: null, remindersSent: [] },
    ],
    fields: [],
  };
}

describe("runReminderSweep", () => {
  it("does nothing before day 2", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc(1));
    await runReminderSweep(env);
    const doc = await getDoc(env, "doc-1");
    expect(doc!.signers[0].remindersSent).toEqual([]);
  });

  it("records the day-2 reminder once 2 days have passed", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc(2));
    await runReminderSweep(env);
    const doc = await getDoc(env, "doc-1");
    expect(doc!.signers[0].remindersSent).toEqual([2]);
  });

  it("doesn't send the same reminder twice", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc(2, [2]));
    await runReminderSweep(env);
    const doc = await getDoc(env, "doc-1");
    expect(doc!.signers[0].remindersSent).toEqual([2]);
  });

  it("catches up to day-4 once enough time has passed", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc(5, [2]));
    await runReminderSweep(env);
    const doc = await getDoc(env, "doc-1");
    expect(doc!.signers[0].remindersSent).toEqual([2, 4]);
  });

  it("skips completed documents", async () => {
    const { env } = makeMockEnv();
    const doc = makeDoc(6);
    doc.status = "completed";
    await putDoc(env, doc);
    await runReminderSweep(env);
    const stored = await getDoc(env, "doc-1");
    expect(stored!.signers[0].remindersSent).toEqual([]);
  });
});

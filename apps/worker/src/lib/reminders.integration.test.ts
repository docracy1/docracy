import { describe, it, expect } from "vitest";
import { runReminderSweep, URGENT_SENTINEL } from "./reminders";
import { putDoc, getDoc } from "./kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

const FAR_FUTURE_MS = 30 * 24 * 60 * 60 * 1000;

function makeDoc(daysAgo: number, remindersSent: number[] = [], expiresInMs = FAR_FUTURE_MS): DocState {
  const linkSentAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: linkSentAt,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
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

  it("sends the urgent expiry warning even if this signer's own turn just started", async () => {
    // Signer only started waiting today (daysWaiting=0, no day-2/4/6 threshold due), but the
    // document itself expires in 1 day — an earlier signer in the chain ate most of the 9-day
    // budget. Without an absolute-deadline check this signer would get no warning at all.
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc(0, [], 1 * 24 * 60 * 60 * 1000));
    await runReminderSweep(env);
    const doc = await getDoc(env, "doc-1");
    expect(doc!.signers[0].remindersSent).toEqual([URGENT_SENTINEL]);
  });

  it("doesn't re-send the urgent warning once it's already gone out", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc(0, [URGENT_SENTINEL], 1 * 24 * 60 * 60 * 1000));
    await runReminderSweep(env);
    const doc = await getDoc(env, "doc-1");
    expect(doc!.signers[0].remindersSent).toEqual([URGENT_SENTINEL]);
  });
});

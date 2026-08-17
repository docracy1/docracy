import { describe, it, expect, vi, afterEach } from "vitest";
import { scheduleDelayedPinDelivery } from "./pinDelivery";
import { getDoc, putDoc } from "./kv";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState, Signer } from "@docracy/shared";

function makeSigner(overrides: Partial<Signer> = {}): Signer {
  return {
    order: 1,
    name: "Anna",
    email: "anna@example.com",
    status: "pending",
    signedAt: null,
    linkSentAt: new Date().toISOString(),
    remindersSent: [],
    ...overrides,
  };
}

function makeDoc(overrides: Partial<DocState> = {}): DocState {
  const now = new Date();
  return {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers: [makeSigner()],
    fields: [],
    ...overrides,
  };
}

async function runScheduled(env: Parameters<typeof scheduleDelayedPinDelivery>[0], docId: string, order: number, pin: string) {
  vi.useFakeTimers();
  try {
    const p = scheduleDelayedPinDelivery(env, docId, order, pin);
    await vi.advanceTimersByTimeAsync(30_000);
    await p;
  } finally {
    vi.useRealTimers();
  }
}

describe("scheduleDelayedPinDelivery", () => {
  afterEach(() => vi.restoreAllMocks());

  it("waits ~30s, then sends via email and records pinSentAt + a pin_sent audit event", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(env, makeDoc({ signers: [makeSigner({ pinDeliveryChannel: "email" })] }));

    await runScheduled(env, "doc-1", 1, "4242");

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).toContain("4242");
    const doc = await getDoc(env, "doc-1");
    expect(doc?.signers[0].pinSentAt).toBeTruthy();
    expect(doc?.events?.some((e) => e.type === "pin_sent" && e.signerOrder === 1)).toBe(true);
  });

  it("routes to WhatsApp when that's the chosen channel", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(
      env,
      makeDoc({ signers: [makeSigner({ pinDeliveryChannel: "whatsapp", whatsappPhone: "+14155551234" })] })
    );

    await runScheduled(env, "doc-1", 1, "4242");

    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).toContain("signing_pin");
    expect(logged).toContain("pin_code=4242");
  });

  it("routes to SMS when that's the chosen channel", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(
      env,
      makeDoc({ signers: [makeSigner({ pinDeliveryChannel: "sms", phone: "4155551234", smsCarrier: "verizon" })] })
    );

    await runScheduled(env, "doc-1", 1, "4242");

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).toContain("4155551234@vtext.com");
  });

  it("does nothing if the doc no longer exists", async () => {
    const { env } = makeMockEnv();
    await expect(runScheduled(env, "no-such-doc", 1, "4242")).resolves.toBeUndefined();
  });

  it("does not send if the document was voided during the delay", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(env, makeDoc({ status: "voided", signers: [makeSigner({ pinDeliveryChannel: "email" })] }));

    await runScheduled(env, "doc-1", 1, "4242");

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("4242");
  });

  it("does not double-send when pinSentAt is already set (e.g. a resend raced the delay)", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(
      env,
      makeDoc({ signers: [makeSigner({ pinDeliveryChannel: "email", pinSentAt: new Date().toISOString() })] })
    );

    await runScheduled(env, "doc-1", 1, "4242");

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("4242");
  });

  it("no-ops for a signer with no pinDeliveryChannel", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(env, makeDoc({ signers: [makeSigner()] }));

    await runScheduled(env, "doc-1", 1, "4242");

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("4242");
  });
});

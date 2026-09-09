import { describe, it, expect, vi, afterEach } from "vitest";
import { scheduleDelayedPinDelivery, runDuePinDeliverySweep } from "./pinDelivery";
import { getDoc, putDoc } from "./kv";
import { makeMockEnv } from "../test/mockEnv";
import { encryptPin } from "@docracy/shared";
import type { DocState, Signer } from "@docracy/shared";

const TEST_SECRET = "test-secret";

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
    await vi.advanceTimersByTimeAsync(5_000);
    await p;
  } finally {
    vi.useRealTimers();
  }
}

describe("scheduleDelayedPinDelivery", () => {
  afterEach(() => vi.restoreAllMocks());

  it("waits, then sends via email and records pinSentAt + a pin_sent audit event", async () => {
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

  it("clears pinPendingEncrypted once the fast path delivers it", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const pinPendingEncrypted = await encryptPin("4242", TEST_SECRET);
    await putDoc(env, makeDoc({ signers: [makeSigner({ pinDeliveryChannel: "email", pinPendingEncrypted })] }));

    await runScheduled(env, "doc-1", 1, "4242");

    const doc = await getDoc(env, "doc-1");
    expect(doc?.signers[0].pinPendingEncrypted).toBeUndefined();
  });
});

// The reliable delivery path — see pinDelivery.ts's comment on scheduleDelayedPinDelivery for why
// the fast path alone (a delay inside ctx.waitUntil) isn't enough on Workers. This runs from its
// own hourly cron invocation, so it isn't a fake-timer test — it just needs pinPendingEncrypted to
// still be sitting on the signer, exactly as documentCreation.ts leaves it until something
// delivers it, and decrypts with the same TOKEN_SECRET makeMockEnv() sets ("test-secret").
describe("runDuePinDeliverySweep", () => {
  afterEach(() => vi.restoreAllMocks());

  it("decrypts and sends a pending PIN, sets pinSentAt, clears pinPendingEncrypted, and logs a pin_sent event", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const pinPendingEncrypted = await encryptPin("4242", TEST_SECRET);
    await putDoc(
      env,
      makeDoc({ docId: "doc-1", signers: [makeSigner({ pinDeliveryChannel: "email", pinPendingEncrypted })] })
    );

    await runDuePinDeliverySweep(env);

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).toContain("4242");
    const doc = await getDoc(env, "doc-1");
    expect(doc?.signers[0].pinSentAt).toBeTruthy();
    expect(doc?.signers[0].pinPendingEncrypted).toBeUndefined();
    expect(doc?.events?.some((e) => e.type === "pin_sent" && e.signerOrder === 1)).toBe(true);
  });

  it("skips a signer that's already been sent, even if pinPendingEncrypted is somehow still set", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const pinPendingEncrypted = await encryptPin("4242", TEST_SECRET);
    await putDoc(
      env,
      makeDoc({
        docId: "doc-1",
        signers: [makeSigner({ pinDeliveryChannel: "email", pinPendingEncrypted, pinSentAt: new Date().toISOString() })],
      })
    );

    await runDuePinDeliverySweep(env);

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("4242");
  });

  it("skips voided documents", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const pinPendingEncrypted = await encryptPin("4242", TEST_SECRET);
    await putDoc(
      env,
      makeDoc({
        docId: "doc-1",
        status: "voided",
        signers: [makeSigner({ pinDeliveryChannel: "email", pinPendingEncrypted })],
      })
    );

    await runDuePinDeliverySweep(env);

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("4242");
  });

  it("does nothing for a signer with no pinPendingEncrypted", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(env, makeDoc({ docId: "doc-1", signers: [makeSigner({ pinDeliveryChannel: "email" })] }));

    await runDuePinDeliverySweep(env);

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("4242");
  });

  it("logs (but does not throw) when pinPendingEncrypted can't be decrypted", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await putDoc(
      env,
      makeDoc({
        docId: "doc-1",
        signers: [makeSigner({ pinDeliveryChannel: "email", pinPendingEncrypted: "not-a-real-ciphertext" })],
      })
    );

    await expect(runDuePinDeliverySweep(env)).resolves.toBeUndefined();

    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("4242");
    expect(errSpy).toHaveBeenCalled();
    expect((await getDoc(env, "doc-1"))?.signers[0].pinSentAt).toBeFalsy();
  });

  it("delivers pending PINs across multiple documents and multiple signers in one sweep", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const [enc1, enc2, enc3] = await Promise.all([
      encryptPin("1111", TEST_SECRET),
      encryptPin("2222", TEST_SECRET),
      encryptPin("3333", TEST_SECRET),
    ]);
    await putDoc(
      env,
      makeDoc({
        docId: "doc-1",
        signers: [
          makeSigner({ order: 1, pinDeliveryChannel: "email", pinPendingEncrypted: enc1 }),
          makeSigner({
            order: 2,
            name: "Bob",
            email: "bob@example.com",
            pinDeliveryChannel: "email",
            pinPendingEncrypted: enc2,
          }),
        ],
      })
    );
    await putDoc(
      env,
      makeDoc({ docId: "doc-2", signers: [makeSigner({ pinDeliveryChannel: "email", pinPendingEncrypted: enc3 })] })
    );

    await runDuePinDeliverySweep(env);

    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).toContain("1111");
    expect(logged).toContain("2222");
    expect(logged).toContain("3333");
    expect((await getDoc(env, "doc-1"))?.signers.every((s) => s.pinSentAt)).toBe(true);
    expect((await getDoc(env, "doc-2"))?.signers[0].pinSentAt).toBeTruthy();
  });
});

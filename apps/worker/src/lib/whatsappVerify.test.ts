import { describe, it, expect, vi, afterEach } from "vitest";
import { requestWhatsappVerification, confirmWhatsappVerification } from "./whatsappVerify";
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

/** Pulls the just-sent code out of the [whatsapp:dev] console.log line — the same trick every
 *  other test in this file uses instead of mocking the WhatsApp send itself. */
function extractSentCode(logSpy: ReturnType<typeof vi.spyOn>): string {
  const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
  const match = logged.match(/pin_code=(\d{6})/);
  if (!match) throw new Error(`no code found in logs:\n${logged}`);
  return match[1];
}

describe("requestWhatsappVerification", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends a 6-digit code and stores its hash + expiry on the signer", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(env, makeDoc({ signers: [makeSigner({ whatsappPhone: "+14155551234" })] }));

    const result = await requestWhatsappVerification(env, "doc-1", 1);

    expect(result.ok).toBe(true);
    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).toMatch(/pin_code=\d{6}/);
    const doc = await getDoc(env, "doc-1");
    expect(doc?.signers[0].whatsappVerifyHash).toBeTruthy();
    expect(doc?.signers[0].whatsappVerifyExpiresAt).toBeTruthy();
    expect(doc?.signers[0].whatsappVerifiedAt).toBeFalsy();
  });

  it("fails when the signer has no whatsappPhone on file", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc({ signers: [makeSigner()] }));

    const result = await requestWhatsappVerification(env, "doc-1", 1);

    expect(result.ok).toBe(false);
  });

  it("is a no-op success if the signer is already verified", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(
      env,
      makeDoc({
        signers: [makeSigner({ whatsappPhone: "+14155551234", whatsappVerifiedAt: new Date().toISOString() })],
      })
    );

    const result = await requestWhatsappVerification(env, "doc-1", 1);

    expect(result.ok).toBe(true);
    expect(logSpy.mock.calls.map((c) => c.join(" ")).join("\n")).not.toContain("pin_code=");
  });

  it("fails for a voided document", async () => {
    const { env } = makeMockEnv();
    await putDoc(
      env,
      makeDoc({ status: "voided", signers: [makeSigner({ whatsappPhone: "+14155551234" })] })
    );

    const result = await requestWhatsappVerification(env, "doc-1", 1);

    expect(result.ok).toBe(false);
  });
});

describe("confirmWhatsappVerification", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts the right code and sets whatsappVerifiedAt + a whatsapp_verified audit event", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(env, makeDoc({ signers: [makeSigner({ whatsappPhone: "+14155551234" })] }));
    await requestWhatsappVerification(env, "doc-1", 1);
    const code = extractSentCode(logSpy);

    const result = await confirmWhatsappVerification(env, "doc-1", 1, code);

    expect(result.ok).toBe(true);
    const doc = await getDoc(env, "doc-1");
    expect(doc?.signers[0].whatsappVerifiedAt).toBeTruthy();
    expect(doc?.signers[0].whatsappVerifyHash).toBeUndefined();
    expect(doc?.signers[0].whatsappVerifyExpiresAt).toBeUndefined();
    expect(doc?.events?.some((e) => e.type === "whatsapp_verified" && e.signerOrder === 1)).toBe(true);
  });

  it("rejects the wrong code", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await putDoc(env, makeDoc({ signers: [makeSigner({ whatsappPhone: "+14155551234" })] }));
    await requestWhatsappVerification(env, "doc-1", 1);
    const code = extractSentCode(logSpy);
    const wrongCode = code === "000000" ? "111111" : "000000";

    const result = await confirmWhatsappVerification(env, "doc-1", 1, wrongCode);

    expect(result.ok).toBe(false);
    expect((await getDoc(env, "doc-1"))?.signers[0].whatsappVerifiedAt).toBeFalsy();
  });

  it("rejects a code after it's expired", async () => {
    vi.useFakeTimers();
    try {
      const { env } = makeMockEnv();
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await putDoc(env, makeDoc({ signers: [makeSigner({ whatsappPhone: "+14155551234" })] }));
      await requestWhatsappVerification(env, "doc-1", 1);
      const code = extractSentCode(logSpy);

      vi.advanceTimersByTime(11 * 60 * 1000);
      const result = await confirmWhatsappVerification(env, "doc-1", 1, code);

      expect(result.ok).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not double-confirm once already verified", async () => {
    const { env } = makeMockEnv();
    await putDoc(
      env,
      makeDoc({
        signers: [makeSigner({ whatsappPhone: "+14155551234", whatsappVerifiedAt: new Date().toISOString() })],
      })
    );

    const result = await confirmWhatsappVerification(env, "doc-1", 1, "000000");

    expect(result.ok).toBe(true);
  });

  it("fails when no code has been requested yet", async () => {
    const { env } = makeMockEnv();
    await putDoc(env, makeDoc({ signers: [makeSigner({ whatsappPhone: "+14155551234" })] }));

    const result = await confirmWhatsappVerification(env, "doc-1", 1, "123456");

    expect(result.ok).toBe(false);
  });
});

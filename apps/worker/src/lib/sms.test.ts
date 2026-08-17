import { describe, it, expect, vi, afterEach } from "vitest";
import { isSmsCarrier, normalizeUsPhone, smsGatewayAddress, sendPinSms } from "./sms";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

function makeDoc(overrides: Partial<DocState["signers"][number]> = {}): DocState {
  return {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 999_999_999).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers: [
      {
        order: 1,
        name: "Anna",
        email: "anna@example.com",
        phone: "4155551234",
        smsCarrier: "verizon",
        status: "pending",
        signedAt: null,
        linkSentAt: null,
        remindersSent: [],
        ...overrides,
      },
    ],
    fields: [],
  };
}

describe("sms gateways", () => {
  it("normalizes US numbers", () => {
    expect(normalizeUsPhone("4155551234")).toBe("4155551234");
    expect(normalizeUsPhone("+1 (415) 555-1234")).toBe("4155551234");
    expect(normalizeUsPhone("123")).toBeNull();
  });

  it("builds carrier gateway addresses", () => {
    expect(smsGatewayAddress("4155551234", "verizon")).toBe("4155551234@vtext.com");
    expect(smsGatewayAddress("+14155551234", "att")).toBe("4155551234@txt.att.net");
    expect(smsGatewayAddress("bad", "att")).toBeNull();
  });

  it("validates carrier ids", () => {
    expect(isSmsCarrier("verizon")).toBe(true);
    expect(isSmsCarrier("twilio")).toBe(false);
  });
});

describe("sendPinSms", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs the PIN as a dev-mode SMS to the carrier gateway address", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendPinSms(env, makeDoc(), 1, "4242");
    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).toContain("4155551234@vtext.com");
    expect(logged).toContain("4242");
  });

  it("no-ops for a signer with no phone/carrier on file", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const doc = makeDoc({ phone: undefined, smsCarrier: undefined });
    await sendPinSms(env, doc, 1, "4242");
    expect(logSpy).not.toHaveBeenCalled();
  });
});

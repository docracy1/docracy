import { describe, it, expect, vi, afterEach } from "vitest";
import { normalizeE164, sendWhatsAppPin } from "./whatsapp";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

function makeDoc(overrides: Partial<DocState> = {}): DocState {
  return {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 999_999_999).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    whatsappInvites: true,
    signers: [
      {
        order: 1,
        name: "Anna",
        email: "anna@example.com",
        whatsappPhone: "+14155551234",
        status: "pending",
        signedAt: null,
        linkSentAt: null,
        remindersSent: [],
      },
    ],
    fields: [],
    ...overrides,
  };
}

describe("normalizeE164", () => {
  it("normalizes international numbers with or without a leading +", () => {
    expect(normalizeE164("+14155551234")).toBe("+14155551234");
    expect(normalizeE164("4155551234")).toBe("+4155551234");
    expect(normalizeE164("+34 611 22 33 44")).toBe("+34611223344");
  });

  it("rejects numbers outside the E.164 length range", () => {
    expect(normalizeE164("1234567")).toBeNull(); // 7 digits — too short
    expect(normalizeE164("1234567890123456")).toBeNull(); // 16 digits — too long
  });

  it("rejects a leading-zero national number (no valid country code starts with 0)", () => {
    expect(normalizeE164("0155551234")).toBeNull();
  });
});

describe("sendWhatsAppPin", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs a dev-mode line with the PIN as the template variable when no access token is configured", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendWhatsAppPin(env, makeDoc(), 1, "4242");
    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).toContain("+14155551234");
    expect(logged).toContain("signing_pin");
    expect(logged).toContain("pin_code=4242");
  });

  it("no-ops for a signer with no whatsappPhone", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const doc = makeDoc({ signers: [{ ...makeDoc().signers[0], whatsappPhone: undefined }] });
    await sendWhatsAppPin(env, doc, 1, "4242");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("posts to Meta's Cloud API with the PIN template and a ':pin'-suffixed callback data", async () => {
    const { env } = makeMockEnv({ WHATSAPP_ACCESS_TOKEN: "tok", WHATSAPP_PHONE_NUMBER_ID: "12345" });
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await sendWhatsAppPin(env, makeDoc(), 1, "4242");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("12345/messages");
    const body = JSON.parse(String(init?.body));
    expect(body.template.name).toBe("signing_pin");
    expect(body.template.components[0].parameters[0]).toMatchObject({ parameter_name: "pin_code", text: "4242" });
    expect(body.biz_opaque_callback_data).toBe("doc-1:1:pin");
  });
});

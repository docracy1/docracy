import { describe, it, expect } from "vitest";
import { normalizeE164 } from "./whatsapp";

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

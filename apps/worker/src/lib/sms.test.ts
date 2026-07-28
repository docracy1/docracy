import { describe, it, expect } from "vitest";
import { isSmsCarrier, normalizeUsPhone, smsGatewayAddress } from "./sms";

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

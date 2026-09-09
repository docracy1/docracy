import { describe, expect, it } from "vitest";
import { parsePaymentRequest } from "./paymentRequest";

describe("parsePaymentRequest", () => {
  it("treats missing or empty as off", () => {
    expect(parsePaymentRequest(undefined)).toEqual({});
    expect(parsePaymentRequest(null)).toEqual({});
    expect(parsePaymentRequest({})).toEqual({});
  });

  it("accepts a valid USD PayPal-style link", () => {
    const result = parsePaymentRequest({
      amount: "150.00",
      currency: "usd",
      url: "https://paypal.me/studio/150",
    });
    expect(result.error).toBeUndefined();
    expect(result.paymentRequest).toEqual({
      amount: "150.00",
      currency: "USD",
      url: "https://paypal.me/studio/150",
      method: "link",
    });
  });

  it("accepts a crypto method with no url, leaving url blank for the caller to fill in", () => {
    const result = parsePaymentRequest({ amount: "200", currency: "MXN", method: "crypto" });
    expect(result.error).toBeUndefined();
    expect(result.paymentRequest).toEqual({
      amount: "200",
      currency: "MXN",
      url: "",
      method: "crypto",
    });
  });

  it("still validates amount/currency for crypto method", () => {
    expect(parsePaymentRequest({ amount: "ten", currency: "MXN", method: "crypto" }).error).toMatch(/amount/);
    expect(parsePaymentRequest({ amount: "200", currency: "JPY", method: "crypto" }).error).toMatch(/currency/);
  });

  it("rejects http and javascript URLs", () => {
    expect(parsePaymentRequest({ amount: "10", currency: "USD", url: "http://example.com/pay" }).error).toMatch(/https/);
    expect(
      parsePaymentRequest({ amount: "10", currency: "USD", url: "javascript:alert(1)" }).error
    ).toMatch(/https/);
  });

  it("rejects unknown currencies and malformed amounts", () => {
    expect(parsePaymentRequest({ amount: "10", currency: "JPY", url: "https://pay.example/x" }).error).toMatch(
      /currency/
    );
    expect(parsePaymentRequest({ amount: "ten", currency: "USD", url: "https://pay.example/x" }).error).toMatch(
      /amount/
    );
  });
});

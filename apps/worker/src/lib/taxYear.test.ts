import { describe, it, expect } from "vitest";
import { parseTaxYear, taxYearBounds, counterpartiesFromDoc, taxYearCsv, type TaxYearRow } from "./taxYear";
import type { DocState } from "@docracy/shared";

describe("parseTaxYear", () => {
  it("defaults to the current UTC year", () => {
    const now = new Date("2026-09-04T12:00:00Z");
    expect(parseTaxYear(undefined, now)).toBe(2026);
    expect(parseTaxYear("", now)).toBe(2026);
  });

  it("rejects junk", () => {
    expect(parseTaxYear("nope")).toEqual({ error: "year must be a calendar year like 2026" });
    expect(parseTaxYear("1999")).toEqual({ error: "year must be a calendar year like 2026" });
  });
});

describe("taxYearBounds", () => {
  it("is a UTC calendar year", () => {
    expect(taxYearBounds(2026)).toEqual({
      start: "2026-01-01T00:00:00.000Z",
      end: "2027-01-01T00:00:00.000Z",
    });
  });
});

describe("counterpartiesFromDoc", () => {
  it("uses cobroRecipient for cobro docs", () => {
    const doc = {
      kind: "cobro",
      cobroRecipient: { name: "Luis", email: "luis@estudio.mx" },
      signers: [],
    } as unknown as DocState;
    expect(counterpartiesFromDoc(doc)).toEqual([{ name: "Luis", email: "luis@estudio.mx" }]);
  });

  it("lists signers for a normal chain", () => {
    const doc = {
      signers: [
        { order: 2, name: "B", email: "b@x.com" },
        { order: 1, name: "A", email: "a@x.com" },
      ],
    } as unknown as DocState;
    expect(counterpartiesFromDoc(doc)).toEqual([
      { name: "A", email: "a@x.com" },
      { name: "B", email: "b@x.com" },
    ]);
  });
});

describe("taxYearCsv", () => {
  it("quotes commas and quotes in titles", () => {
    const row: TaxYearRow = {
      docId: "d1",
      title: 'W-9, "studio"',
      completedAt: "2026-03-01T00:00:00.000Z",
      expiresAt: "2027-04-15T00:00:00.000Z",
      statusToken: "tok",
      signedPageUrl: "https://docracy.io/signed/tok",
      counterparties: [{ name: "Ana, LLC", email: "ana@x.com" }],
      amount: "200.00",
      currency: "USD",
      paymentUrl: "https://paypal.me/x",
      kind: "sign",
    };
    const csv = taxYearCsv(2026, [row]);
    expect(csv).toContain('"W-9, ""studio"""');
    expect(csv).toContain('"Ana, LLC"');
    expect(csv.split("\n")[0]).toBe(
      "year,completedAt,title,counterpartyNames,counterpartyEmails,amount,currency,paymentUrl,expiresAt,signedPageUrl"
    );
  });
});

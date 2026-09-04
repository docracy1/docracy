import { describe, it, expect } from "vitest";
import {
  normalizeSubjectName,
  MAX_SUBJECT_NAME,
  toPublicConstanciaRow,
  totalsByCurrency,
  constanciaPageUrl,
} from "./constancia";
import type { TaxYearRow } from "./taxYear";

describe("normalizeSubjectName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeSubjectName("  Ana   Ruiz  ")).toBe("Ana Ruiz");
  });

  it("rejects empty and oversized names", () => {
    expect(normalizeSubjectName("")).toEqual({ error: "A name is required" });
    expect(normalizeSubjectName("   ")).toEqual({ error: "A name is required" });
    expect(normalizeSubjectName(1)).toEqual({ error: "A name is required" });
    expect(normalizeSubjectName("x".repeat(MAX_SUBJECT_NAME + 1))).toEqual({
      error: `Name must be ${MAX_SUBJECT_NAME} characters or fewer`,
    });
  });
});

describe("toPublicConstanciaRow", () => {
  it("drops counterparty emails", () => {
    const row: TaxYearRow = {
      docId: "doc-1",
      title: "Invoice",
      completedAt: "2026-03-15T12:00:00Z",
      expiresAt: "2027-04-15T00:00:00Z",
      statusToken: "secret-token",
      signedPageUrl: "https://docracy.io/signed/abc",
      counterparties: [{ name: "Ana Ruiz", email: "ana@estudio.mx" }],
      amount: "150.00",
      currency: "MXN",
      paymentUrl: "https://paypal.me/studio/150",
      kind: "cobro",
    };
    const pub = toPublicConstanciaRow(row);
    expect(pub).toEqual({
      title: "Invoice",
      completedAt: "2026-03-15T12:00:00Z",
      counterparties: [{ name: "Ana Ruiz" }],
      amount: "150.00",
      currency: "MXN",
      signedPageUrl: "https://docracy.io/signed/abc",
      kind: "cobro",
    });
    expect(JSON.stringify(pub)).not.toContain("ana@estudio.mx");
    expect(JSON.stringify(pub)).not.toContain("paypal.me");
    expect(JSON.stringify(pub)).not.toContain("doc-1");
  });
});

describe("totalsByCurrency", () => {
  it("sums per currency and skips blank amounts", () => {
    expect(
      totalsByCurrency([
        { amount: "150.00", currency: "MXN" },
        { amount: "50", currency: "mxn" },
        { amount: "2000", currency: "USD" },
        { amount: "", currency: "USD" },
      ])
    ).toEqual([
      { currency: "MXN", amount: "200.00", count: 2 },
      { currency: "USD", amount: "2000", count: 1 },
    ]);
  });
});

describe("constanciaPageUrl", () => {
  it("uses Spanish as the lead share path", () => {
    expect(constanciaPageUrl("https://docracy.io", "tok", "es")).toBe(
      "https://docracy.io/es/constancia/tok"
    );
    expect(constanciaPageUrl("https://docracy.io/", "tok", "en")).toBe(
      "https://docracy.io/income-proof/tok"
    );
  });
});

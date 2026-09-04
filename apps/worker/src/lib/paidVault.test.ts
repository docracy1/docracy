import { describe, it, expect } from "vitest";
import { addUtcMonths, nextTaxDeadline, paidVaultDays, paidVaultExpiresAt } from "./paidVault";

describe("paidVaultDays", () => {
  it("uses April 15 of the next calendar year when that is later than 13 months", () => {
    const from = new Date("2026-01-15T12:00:00.000Z");
    expect(nextTaxDeadline(from).toISOString()).toBe("2027-04-15T00:00:00.000Z");
    expect(addUtcMonths(from, 13).toISOString()).toBe("2027-02-15T12:00:00.000Z");
    expect(paidVaultExpiresAt(from).toISOString()).toBe("2027-04-15T00:00:00.000Z");
    const days = paidVaultDays(from);
    expect(days).toBeGreaterThan(400);
    expect(days).toBeLessThan(500);
  });

  it("floors at 13 months when next April 15 is sooner (December hire)", () => {
    const from = new Date("2026-12-20T00:00:00.000Z");
    expect(nextTaxDeadline(from).toISOString()).toBe("2027-04-15T00:00:00.000Z");
    expect(addUtcMonths(from, 13).toISOString()).toBe("2028-01-20T00:00:00.000Z");
    expect(paidVaultExpiresAt(from).toISOString()).toBe("2028-01-20T00:00:00.000Z");
    expect(paidVaultDays(from)).toBe(396);
  });

  it("clamps month-end overflow (Jan 31 + 13 months)", () => {
    const from = new Date("2026-01-31T00:00:00.000Z");
    expect(addUtcMonths(from, 13).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });
});

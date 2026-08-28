import { describe, expect, it } from "vitest";
import { analyticsCountFromIso, analyticsCountFromSince, analyticsCountFromSql } from "./analyticsBaseline";

describe("analyticsBaseline", () => {
  it("returns null when unset", () => {
    expect(analyticsCountFromIso({})).toBeNull();
    expect(analyticsCountFromSql({})).toBe("");
  });

  it("normalizes date-only to UTC midnight", () => {
    expect(analyticsCountFromIso({ ANALYTICS_COUNT_FROM: "2030-01-01" })).toBe("2030-01-01T00:00:00Z");
  });

  it("accepts full ISO datetime", () => {
    expect(analyticsCountFromIso({ ANALYTICS_COUNT_FROM: "2026-09-01T12:00:00Z" })).toBe("2026-09-01T12:00:00Z");
  });

  it("rejects invalid strings", () => {
    expect(analyticsCountFromIso({ ANALYTICS_COUNT_FROM: "2030-01-01'; DROP TABLE--" })).toBeNull();
  });

  it("builds SQL fragment", () => {
    expect(analyticsCountFromSql({ ANALYTICS_COUNT_FROM: "2030-01-01" })).toBe(
      " AND timestamp >= toDateTime('2030-01-01T00:00:00Z')",
    );
  });

  it("matches D1 since helper", () => {
    expect(analyticsCountFromSince({ ANALYTICS_COUNT_FROM: "2030-01-01" })).toBe("2030-01-01T00:00:00Z");
  });
});

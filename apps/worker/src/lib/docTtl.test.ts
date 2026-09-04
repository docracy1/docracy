import { describe, it, expect } from "vitest";
import { resolveTtlDays, defaultTtlDays, maxTtlDays } from "./docTtl";
import { paidVaultDays } from "./paidVault";
import { makeMockEnv } from "../test/mockEnv";

describe("resolveTtlDays", () => {
  const { env } = makeMockEnv();

  it("uses DOC_TTL_DAYS for free, and the tax-year vault for paid without override", () => {
    expect(resolveTtlDays(env, { isPaid: false })).toEqual({ ttlDays: 9 });
    expect(resolveTtlDays(env, { isPaid: true })).toEqual({ ttlDays: paidVaultDays() });
    expect(defaultTtlDays(env)).toBe(9);
    expect(maxTtlDays(env)).toBe(500);
  });

  it("ignores client ttlDays when not paid", () => {
    expect(resolveTtlDays(env, { isPaid: false, ttlDays: 30 })).toEqual({ ttlDays: 9 });
  });

  it("accepts a paid override within bounds", () => {
    expect(resolveTtlDays(env, { isPaid: true, ttlDays: 30 })).toEqual({ ttlDays: 30 });
    expect(resolveTtlDays(env, { isPaid: true, ttlDays: 400 })).toEqual({ ttlDays: 400 });
  });

  it("rejects non-integer / out-of-range paid overrides", () => {
    expect(resolveTtlDays(env, { isPaid: true, ttlDays: 0 })).toEqual({
      error: "ttlDays must be a positive integer",
    });
    expect(resolveTtlDays(env, { isPaid: true, ttlDays: 501 })).toEqual({
      error: "ttlDays cannot exceed 500",
    });
  });
});

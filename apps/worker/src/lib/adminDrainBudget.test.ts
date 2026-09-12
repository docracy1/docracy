import { describe, it, expect } from "vitest";
import { DAILY_DRAIN_BUDGET, getDrainBudgetRemaining, getDrainBudgetUsed, recordDrainBudgetUsage } from "./adminDrainBudget";
import { makeMockEnv } from "../test/mockEnv";

const DAY_1 = new Date("2026-09-13T10:00:00Z");
const DAY_2 = new Date("2026-09-14T01:00:00Z");

describe("admin drain daily budget", () => {
  it("starts at zero used / full remaining with nothing recorded yet", async () => {
    const { env } = makeMockEnv();
    expect(await getDrainBudgetUsed(env, DAY_1)).toBe(0);
    expect(await getDrainBudgetRemaining(env, DAY_1)).toBe(DAILY_DRAIN_BUDGET);
  });

  it("accumulates usage across multiple calls on the same UTC day", async () => {
    const { env } = makeMockEnv();
    await recordDrainBudgetUsage(env, 3, DAY_1);
    await recordDrainBudgetUsage(env, 5, DAY_1);

    expect(await getDrainBudgetUsed(env, DAY_1)).toBe(8);
    expect(await getDrainBudgetRemaining(env, DAY_1)).toBe(DAILY_DRAIN_BUDGET - 8);
  });

  it("never returns remaining below zero once usage exceeds the cap", async () => {
    const { env } = makeMockEnv();
    await recordDrainBudgetUsage(env, DAILY_DRAIN_BUDGET + 50, DAY_1);

    expect(await getDrainBudgetRemaining(env, DAY_1)).toBe(0);
  });

  it("keeps a separate counter per UTC calendar day", async () => {
    const { env } = makeMockEnv();
    await recordDrainBudgetUsage(env, DAILY_DRAIN_BUDGET, DAY_1);

    expect(await getDrainBudgetRemaining(env, DAY_1)).toBe(0);
    expect(await getDrainBudgetRemaining(env, DAY_2)).toBe(DAILY_DRAIN_BUDGET);
  });

  it("ignores a non-positive usage record", async () => {
    const { env } = makeMockEnv();
    await recordDrainBudgetUsage(env, 0, DAY_1);
    await recordDrainBudgetUsage(env, -5, DAY_1);

    expect(await getDrainBudgetUsed(env, DAY_1)).toBe(0);
  });
});

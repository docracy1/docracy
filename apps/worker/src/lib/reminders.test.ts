import { describe, it, expect } from "vitest";
import { dueThreshold, daysBetween } from "./reminders";

describe("daysBetween", () => {
  it("floors partial days", () => {
    const from = new Date("2026-07-01T00:00:00Z").toISOString();
    const to = new Date("2026-07-03T23:00:00Z").getTime();
    expect(daysBetween(from, to)).toBe(2);
  });
});

describe("dueThreshold", () => {
  it("is undefined before day 2", () => {
    expect(dueThreshold(1, [])).toBeUndefined();
  });

  it("fires the day-2 reminder once 2 days have passed", () => {
    expect(dueThreshold(2, [])).toBe(2);
  });

  it("does not re-fire a threshold already sent", () => {
    expect(dueThreshold(2, [2])).toBeUndefined();
  });

  it("fires day-4 once day-2 has already been sent and 4 days have passed", () => {
    expect(dueThreshold(4, [2])).toBe(4);
  });

  it("fires the final day-6 'expires soon' reminder", () => {
    expect(dueThreshold(6, [2, 4])).toBe(6);
  });

  it("does not fire again after all thresholds are exhausted", () => {
    expect(dueThreshold(8, [2, 4, 6])).toBeUndefined();
  });

  it("catches up to the highest unsent threshold if the sweep missed a day", () => {
    // e.g. cron didn't run for a few days — still gets exactly one threshold, not a pile-up.
    expect(dueThreshold(5, [2])).toBe(4);
  });
});

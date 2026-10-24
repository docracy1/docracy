import { describe, expect, it } from "vitest";
import { isDailySweepHour } from "./cronSchedule";
import { isWiseSyncHour } from "./wiseSync";

describe("cron schedule", () => {
  it("runs the daily sweeps once a day in the 08 UTC hour", () => {
    const hits = Array.from({ length: 24 }, (_, h) => Date.UTC(2026, 9, 24, h, 7)).filter(isDailySweepHour);
    expect(hits).toEqual([Date.UTC(2026, 9, 24, 8, 7)]);
  });

  it("never shares an hour with the Wise sync", () => {
    for (let h = 0; h < 24; h += 1) {
      const t = Date.UTC(2026, 9, 24, h, 7);
      expect(isDailySweepHour(t) && isWiseSyncHour(t)).toBe(false);
    }
  });
});

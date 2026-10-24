import { describe, expect, it } from "vitest";
import type { Env } from "@docracy/shared";
import { isWiseSyncHour, runWiseSync } from "./wiseSync";

describe("Wise dashboard sync on the hourly cron", () => {
  it("runs at 00, 06, 12 and 18 UTC only", () => {
    expect(isWiseSyncHour(Date.UTC(2026, 9, 24, 6, 7))).toBe(true);
    expect(isWiseSyncHour(Date.UTC(2026, 9, 24, 0, 7))).toBe(true);
    expect(isWiseSyncHour(Date.UTC(2026, 9, 24, 7, 7))).toBe(false);
  });

  it("posts to the binding with Basic auth and skips without it", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const WISE = { fetch: async (url: string, init?: RequestInit) => (calls.push({ url, init }), new Response("{}", { status: 200 })) };
    await runWiseSync({ WISE, WISE_DASHBOARD_AUTH: "u:p" } as unknown as Env);
    expect(calls[0]?.url).toBe("https://wise-cashflow-dashboard/api/sync");
    expect((calls[0]?.init?.headers as Record<string, string>).authorization).toBe(`Basic ${btoa("u:p")}`);
    await runWiseSync({ WISE } as unknown as Env);
    expect(calls).toHaveLength(1);
  });

  it("throws on a failed sync so the cron logs it", async () => {
    const WISE = { fetch: async () => new Response("no", { status: 401 }) };
    await expect(runWiseSync({ WISE, WISE_DASHBOARD_AUTH: "u:p" } as unknown as Env)).rejects.toThrow("401");
  });
});

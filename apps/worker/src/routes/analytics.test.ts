import { describe, it, expect } from "vitest";
import analytics from "./analytics";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function post(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

describe("POST /api/analytics/pageview", () => {
  it("logs a page_view event for a tracked route", async () => {
    const writeDataPoint = () => {};
    const calls: unknown[] = [];
    const { env } = makeMockEnv({
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });

    const res = await analytics.request(
      "/pageview",
      post({ route: "/free-templates/mutual-nda" }, { "user-agent": "GPTBot/1.1" }),
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    expect(calls).toEqual([[{ blobs: ["page_view", "/free-templates/mutual-nda", "bot", "GPTBot"], doubles: [1], indexes: ["page_view"] }]]);
  });

  it("rejects a route not in the allow-list", async () => {
    const { env } = makeMockEnv();
    const res = await analytics.request("/pageview", post({ route: "/dashboard" }), env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects a missing route", async () => {
    const { env } = makeMockEnv();
    const res = await analytics.request("/pageview", post({}), env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    const { env } = makeMockEnv();
    const res = await analytics.request(
      "/pageview",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "not json" },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });
});

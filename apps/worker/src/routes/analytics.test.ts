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

function eventsOf(calls: unknown[][]): string[] {
  return calls.map((args) => (args[0] as { blobs: string[] }).blobs[0]);
}

describe("POST /api/analytics/pageview", () => {
  it("logs a page_view event for a tracked route, including the CF-IPCountry header", async () => {
    const calls: unknown[][] = [];
    const { env } = makeMockEnv({
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });

    const res = await analytics.request(
      "/pageview",
      post({ route: "/free-templates/mutual-nda" }, { "user-agent": "GPTBot/1.1", "CF-IPCountry": "US" }),
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    expect(calls).toEqual([
      [
        {
          blobs: ["page_view", "/free-templates/mutual-nda", "bot", "GPTBot", "US", "", "", "", "", "", "", "", "", ""],
          doubles: [1, 0],
          indexes: ["page_view"],
        },
      ],
    ]);
  });

  it("also logs landingpage_loaded for the homepage", async () => {
    const calls: unknown[][] = [];
    const { env } = makeMockEnv({
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });

    const res = await analytics.request("/pageview", post({ route: "/" }), env, MOCK_CTX);

    expect(res.status).toBe(200);
    expect(eventsOf(calls)).toEqual(["page_view", "landingpage_loaded"]);
  });

  it("tracks a dynamic blog post route and logs blog_article_loaded (not for the /blog index)", async () => {
    const calls: unknown[][] = [];
    const { env } = makeMockEnv({
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });

    const postRes = await analytics.request("/pageview", post({ route: "/blog/some-newly-published-post" }), env, MOCK_CTX);
    expect(postRes.status).toBe(200);
    expect(eventsOf(calls)).toEqual(["page_view", "blog_article_loaded"]);

    calls.length = 0;
    const indexRes = await analytics.request("/pageview", post({ route: "/blog" }), env, MOCK_CTX);
    expect(indexRes.status).toBe(200);
    expect(eventsOf(calls)).toEqual(["page_view"]);
  });

  it("logs referral_source_detected for an external referrer, but not a same-origin one", async () => {
    const calls: unknown[][] = [];
    const { env } = makeMockEnv({
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });

    const external = await analytics.request(
      "/pageview",
      post({ route: "/mcp" }, { "x-referrer": "https://news.ycombinator.com/item?id=1" }),
      env,
      MOCK_CTX
    );
    expect(external.status).toBe(200);
    expect(eventsOf(calls)).toEqual(["page_view", "referral_source_detected"]);
    const referralCall = calls[1][0] as { blobs: string[] };
    expect(referralCall.blobs[8]).toBe("news.ycombinator.com"); // blob9 = source

    calls.length = 0;
    const sameOrigin = await analytics.request(
      "/pageview",
      post({ route: "/mcp" }, { "x-referrer": "http://localhost/pricing" }),
      env,
      MOCK_CTX
    );
    expect(sameOrigin.status).toBe(200);
    expect(eventsOf(calls)).toEqual(["page_view"]);
  });

  it("skips logging (but still returns 200) when the notrack cookie is set", async () => {
    const calls: unknown[][] = [];
    const { env } = makeMockEnv({
      ANALYTICS: { writeDataPoint: (...args: unknown[]) => calls.push(args) } as any,
    });

    const res = await analytics.request(
      "/pageview",
      post({ route: "/mcp" }, { cookie: "docracy_notrack=1" }),
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    const body: { ok: boolean; skipped?: boolean } = await res.json();
    expect(body.skipped).toBe(true);
    expect(calls).toEqual([]);
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

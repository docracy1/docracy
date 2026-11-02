import { describe, it, expect } from "vitest";
import worker from "./index";
import { makeMockEnv } from "./test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

describe("security headers on API responses", () => {
  it("adds the common headers and a CSP to a text response", async () => {
    const { env } = makeMockEnv();
    const res = await worker.fetch(new Request("https://api.docracy.io/robots.txt"), env, MOCK_CTX);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Strict-Transport-Security")).toContain("preload");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
    expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; frame-ancestors 'none'");
    // The sitemaps served here must stay readable for crawlers; everything else stays closed.
    const body = await res.text();
    expect(body).toContain("Allow: /api/blog-posts/sitemap.xml$");
    expect(body).toContain("Allow: /api/marketplace/sitemap.xml$");
    expect(body.trim().endsWith("Disallow: /")).toBe(true);
  });

  it("keeps protected routes closed and still sets the headers on a 401", async () => {
    const { env } = makeMockEnv();
    const res = await worker.fetch(new Request("https://api.docracy.io/api/account/templates"), env, MOCK_CTX);
    expect(res.status).toBe(401);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });
});

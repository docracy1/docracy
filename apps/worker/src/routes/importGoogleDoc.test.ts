import { describe, it, expect, vi, afterEach } from "vitest";
import { importGoogleDoc } from "./importGoogleDoc";
import { makeMockEnv } from "../test/mockEnv";
import { resetRateLimitMemoryForTests } from "../lib/ratelimit";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

afterEach(() => {
  vi.restoreAllMocks();
  resetRateLimitMemoryForTests();
});

describe("POST /api/import/google-doc", () => {
  it("returns the PDF bytes for a publicly-shared doc", async () => {
    const { env } = makeMockEnv();
    const pdfBytes = new Uint8Array([37, 80, 68, 70]); // "%PDF"
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(pdfBytes, { status: 200, headers: { "content-type": "application/pdf" } })
    );

    const res = await importGoogleDoc.request(
      "/",
      { method: "POST", body: JSON.stringify({ url: "https://docs.google.com/document/d/abc123XYZ/edit" }) },
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(pdfBytes);
  });

  it("rejects a URL that isn't a Google Docs link", async () => {
    const { env } = makeMockEnv();
    const res = await importGoogleDoc.request(
      "/",
      { method: "POST", body: JSON.stringify({ url: "https://example.com/not-a-doc" }) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("returns a clear error when the doc isn't shared publicly (Google serves an HTML login page)", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<html>sign in</html>", { status: 200, headers: { "content-type": "text/html" } })
    );

    const res = await importGoogleDoc.request(
      "/",
      { method: "POST", body: JSON.stringify({ url: "https://docs.google.com/document/d/abc123XYZ/edit" }) },
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Anyone with the link");
  });

  it("returns 502 when the upstream fetch throws", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));

    const res = await importGoogleDoc.request(
      "/",
      { method: "POST", body: JSON.stringify({ url: "https://docs.google.com/document/d/abc123XYZ/edit" }) },
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(502);
  });

  it("enforces the per-IP rate limit", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(global, "fetch").mockImplementation(
      async () => new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "application/pdf" } })
    );
    const req = () =>
      importGoogleDoc.request(
        "/",
        {
          method: "POST",
          headers: { "CF-Connecting-IP": "1.2.3.4" },
          body: JSON.stringify({ url: "https://docs.google.com/document/d/abc123XYZ/edit" }),
        },
        env,
        MOCK_CTX
      );

    for (let i = 0; i < 10; i++) {
      const res = await req();
      expect(res.status).toBe(200);
    }
    const limited = await req();
    expect(limited.status).toBe(429);
  });
});

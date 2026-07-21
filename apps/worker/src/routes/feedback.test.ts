import { describe, it, expect, vi, afterEach } from "vitest";
import feedback from "./feedback";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function post(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

describe("POST /api/feedback", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a valid submission and emails FEEDBACK_EMAIL", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const res = await feedback.request("/", post({ email: "anna@example.com", message: "Found a bug." }), env, MOCK_CTX);

    expect(res.status).toBe(200);
    const body: { ok: boolean } = await res.json();
    expect(body.ok).toBe(true);
    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).toContain(`to=${env.FEEDBACK_EMAIL}`);
    expect(logged).toContain("reply-to=anna@example.com");
    expect(logged).toContain("Found a bug.");
  });

  it("rejects an invalid email address", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await feedback.request("/", post({ email: "not-an-email", message: "hi" }), env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects an empty message", async () => {
    const { env } = makeMockEnv();
    const res = await feedback.request("/", post({ email: "anna@example.com", message: "   " }), env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("rejects an oversized message", async () => {
    const { env } = makeMockEnv();
    const res = await feedback.request(
      "/",
      post({ email: "anna@example.com", message: "A".repeat(5000) }),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });

  it("escapes HTML in the message body", async () => {
    const { env } = makeMockEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await feedback.request(
      "/",
      post({ email: "anna@example.com", message: "<script>alert(1)</script>" }),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).not.toContain("<script>alert(1)</script>");
    expect(logged).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("enforces a per-IP rate limit", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(console, "log").mockImplementation(() => {});
    for (let i = 0; i < 5; i++) {
      const res = await feedback.request(
        "/",
        post({ email: "anna@example.com", message: `msg ${i}` }, { "CF-Connecting-IP": "1.2.3.4" }),
        env,
        MOCK_CTX
      );
      expect(res.status).toBe(200);
    }
    const blocked = await feedback.request(
      "/",
      post({ email: "anna@example.com", message: "one more" }, { "CF-Connecting-IP": "1.2.3.4" }),
      env,
      MOCK_CTX
    );
    expect(blocked.status).toBe(429);
  });

  it("returns the AI's answer and skips emailing the founder when it can answer", async () => {
    const { env } = makeMockEnv({ DOUBAO_API_KEY: "test-key" });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "The free plan supports up to 2 signers." } }] }),
    } as Response);

    const res = await feedback.request(
      "/",
      post({ email: "anna@example.com", message: "How many signers on the free plan?" }),
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    const body: { ok: boolean; aiAnswer?: string } = await res.json();
    expect(body.aiAnswer).toBe("The free plan supports up to 2 signers.");
    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).not.toContain(`to=${env.FEEDBACK_EMAIL}`);
  });

  it("falls back to emailing the founder when the AI can't answer", async () => {
    const { env } = makeMockEnv({ DOUBAO_API_KEY: "test-key" });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "CANNOT_ANSWER" } }] }),
    } as Response);

    const res = await feedback.request(
      "/",
      post({ email: "anna@example.com", message: "Why hasn't my document arrived?" }),
      env,
      MOCK_CTX
    );

    expect(res.status).toBe(200);
    const body: { ok: boolean; aiAnswer?: string } = await res.json();
    expect(body.aiAnswer).toBeUndefined();
    const logged = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).toContain(`to=${env.FEEDBACK_EMAIL}`);
  });
});

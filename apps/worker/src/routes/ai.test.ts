import { describe, it, expect, vi, afterEach } from "vitest";
import ai from "./ai";
import { makeMockEnv } from "../test/mockEnv";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function post(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

async function paidCookie(env: Parameters<typeof createSession>[0]) {
  const token = await createSession(env, MOCK_CTX, "acct-1", "anna@example.com", true, null, null);
  return { Cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

describe("POST /explain", () => {
  afterEach(() => vi.restoreAllMocks());

  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await ai.request("/explain", post({ text: "some contract text" }), env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("402s for a signed-in but non-paid account", async () => {
    const { env } = makeMockEnv();
    const token = await createSession(env, MOCK_CTX, "acct-2", "bob@example.com", false, null, null);
    const res = await ai.request(
      "/explain",
      post({ text: "some contract text" }, { Cookie: `${SESSION_COOKIE_NAME}=${token}` }),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(402);
  });

  it("400s for missing text", async () => {
    const { env } = makeMockEnv();
    const res = await ai.request("/explain", post({}, await paidCookie(env)), env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("returns the AI's explanation for a paid account", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "- Point one\n- Point two\nWatch out for: nothing." });
    const res = await ai.request("/explain", post({ text: "some contract text" }, await paidCookie(env)), env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { explanation: string } = await res.json();
    expect(body.explanation).toContain("Point one");
  });

  it("502s when the model can't produce an explanation", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({});
    const res = await ai.request("/explain", post({ text: "some contract text" }, await paidCookie(env)), env, MOCK_CTX);
    expect(res.status).toBe(502);
  });
});

describe("POST /risks", () => {
  afterEach(() => vi.restoreAllMocks());

  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await ai.request("/risks", post({ text: "some contract text" }), env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("returns a parsed risk list for a paid account", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: JSON.stringify([{ issue: "Long non-compete", severity: "high", detail: "24 months" }]),
    });
    const res = await ai.request("/risks", post({ text: "some contract text" }, await paidCookie(env)), env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { risks: unknown[] } = await res.json();
    expect(body.risks).toHaveLength(1);
  });

  it("502s when the model's response can't be parsed", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "not json at all" });
    const res = await ai.request("/risks", post({ text: "some contract text" }, await paidCookie(env)), env, MOCK_CTX);
    expect(res.status).toBe(502);
  });
});

describe("POST /generate", () => {
  afterEach(() => vi.restoreAllMocks());

  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await ai.request("/generate", post({ prompt: "a web design contract" }), env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("400s for an empty prompt", async () => {
    const { env } = makeMockEnv();
    const res = await ai.request("/generate", post({ prompt: "  " }, await paidCookie(env)), env, MOCK_CTX);
    expect(res.status).toBe(400);
  });

  it("returns a generated PDF + fields for a paid account", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: JSON.stringify({
        title: "Web Design Agreement",
        signerLabels: ["Client", "Freelancer"],
        body: "Scope: build a website.\n\nPayment: $2,500 fixed price.",
      }),
    });
    const res = await ai.request(
      "/generate",
      post({ prompt: "a web design contract for $2,500" }, await paidCookie(env)),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const body: { title: string; signerLabels: string[]; fields: unknown[]; pdfBase64: string } = await res.json();
    expect(body.title).toBe("Web Design Agreement");
    expect(body.signerLabels).toEqual(["Client", "Freelancer"]);
    expect(body.fields).toHaveLength(4);
    expect(body.pdfBase64.length).toBeGreaterThan(0);
  });

  it("502s when the model can't draft usable content", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "I need more details." });
    const res = await ai.request("/generate", post({ prompt: "something vague" }, await paidCookie(env)), env, MOCK_CTX);
    expect(res.status).toBe(502);
  });
});

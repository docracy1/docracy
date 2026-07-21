import { describe, it, expect, vi, afterEach } from "vitest";
import { answerSupportQuestion } from "./support";
import { makeMockEnv } from "../test/mockEnv";

function mockFetchOnce(response: unknown) {
  return vi.spyOn(global, "fetch").mockResolvedValueOnce(response as Response);
}

describe("answerSupportQuestion", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns null without calling out when DOUBAO_API_KEY is unset", async () => {
    const { env } = makeMockEnv();
    const fetchSpy = vi.spyOn(global, "fetch");
    const result = await answerSupportQuestion(env, "What's the free plan limit?");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the model's answer when it responds with one", async () => {
    const { env } = makeMockEnv({ DOUBAO_API_KEY: "test-key" });
    mockFetchOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "Free plan supports up to 2 signers." } }] }),
    });
    const result = await answerSupportQuestion(env, "How many signers on the free plan?");
    expect(result).toBe("Free plan supports up to 2 signers.");
  });

  it("returns null when the model can't answer confidently", async () => {
    const { env } = makeMockEnv({ DOUBAO_API_KEY: "test-key" });
    mockFetchOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "CANNOT_ANSWER" } }] }),
    });
    const result = await answerSupportQuestion(env, "Why hasn't my document arrived?");
    expect(result).toBeNull();
  });

  it("returns null on a non-ok response, without throwing", async () => {
    const { env } = makeMockEnv({ DOUBAO_API_KEY: "test-key" });
    mockFetchOnce({ ok: false, status: 500, text: async () => "server error" });
    const result = await answerSupportQuestion(env, "hi");
    expect(result).toBeNull();
  });

  it("returns null when the request throws, without propagating the error", async () => {
    const { env } = makeMockEnv({ DOUBAO_API_KEY: "test-key" });
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("network down"));
    const result = await answerSupportQuestion(env, "hi");
    expect(result).toBeNull();
  });

  it("returns null when the response body has no usable answer", async () => {
    const { env } = makeMockEnv({ DOUBAO_API_KEY: "test-key" });
    mockFetchOnce({ ok: true, json: async () => ({ choices: [] }) });
    const result = await answerSupportQuestion(env, "hi");
    expect(result).toBeNull();
  });
});

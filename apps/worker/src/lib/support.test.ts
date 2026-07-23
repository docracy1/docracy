import { describe, it, expect, vi, afterEach } from "vitest";
import { answerSupportQuestion } from "./support";
import { makeMockEnv } from "../test/mockEnv";

describe("answerSupportQuestion", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the model's answer when it responds with one", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "Free plan supports up to 2 signers." });
    const result = await answerSupportQuestion(env, "How many signers on the free plan?");
    expect(result).toBe("Free plan supports up to 2 signers.");
  });

  it("returns null when the model can't answer confidently", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "CANNOT_ANSWER" });
    const result = await answerSupportQuestion(env, "Why hasn't my document arrived?");
    expect(result).toBeNull();
  });

  it("returns null when the request throws, without propagating the error", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockRejectedValueOnce(new Error("neuron quota exceeded"));
    const result = await answerSupportQuestion(env, "hi");
    expect(result).toBeNull();
  });

  it("returns null when the response has no usable answer", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({});
    const result = await answerSupportQuestion(env, "hi");
    expect(result).toBeNull();
  });
});

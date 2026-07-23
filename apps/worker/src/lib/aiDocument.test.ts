import { describe, it, expect, vi, afterEach } from "vitest";
import { explainContract, analyzeContractRisks } from "./aiDocument";
import { makeMockEnv } from "../test/mockEnv";

describe("explainContract", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the model's trimmed response", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "  Some plain-English summary.  " });
    const result = await explainContract(env, "This agreement is between...");
    expect(result).toBe("Some plain-English summary.");
  });

  it("returns null when the response is empty", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({});
    const result = await explainContract(env, "text");
    expect(result).toBeNull();
  });

  it("returns null when the request throws, without propagating the error", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockRejectedValueOnce(new Error("neuron quota exceeded"));
    const result = await explainContract(env, "text");
    expect(result).toBeNull();
  });
});

describe("analyzeContractRisks", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a parsed risk list from a clean JSON array", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: JSON.stringify([{ issue: "Long non-compete", severity: "high", detail: "24 months, most states cap around 12." }]),
    });
    const result = await analyzeContractRisks(env, "text");
    expect(result).toEqual([{ issue: "Long non-compete", severity: "high", detail: "24 months, most states cap around 12." }]);
  });

  it("returns an empty array when the model finds nothing notable", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "[]" });
    const result = await analyzeContractRisks(env, "text");
    expect(result).toEqual([]);
  });

  it("extracts the JSON array even if the model wraps it in prose", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: `Here you go:\n${JSON.stringify([{ issue: "x", severity: "low", detail: "y" }])}\nHope that helps!`,
    });
    const result = await analyzeContractRisks(env, "text");
    expect(result).toEqual([{ issue: "x", severity: "low", detail: "y" }]);
  });

  it("parses risks whose detail string contains literal (unescaped) newlines", async () => {
    // Same real-world model quirk as aiGenerate.test.ts — a multi-line "detail" value with actual
    // line breaks instead of `\n` escapes, which plain JSON.parse rejects.
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: '[{"issue": "Long non-compete", "severity": "high", "detail": "Spans 5 years,\nworldwide, no carve-outs."}]',
    });
    const result = await analyzeContractRisks(env, "text");
    expect(result).toEqual([{ issue: "Long non-compete", severity: "high", detail: "Spans 5 years,\nworldwide, no carve-outs." }]);
  });

  it("drops malformed entries but keeps valid ones", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: JSON.stringify([
        { issue: "valid", severity: "medium", detail: "ok" },
        { issue: "missing severity", detail: "bad" },
        { issue: 42, severity: "low", detail: "bad type" },
      ]),
    });
    const result = await analyzeContractRisks(env, "text");
    expect(result).toEqual([{ issue: "valid", severity: "medium", detail: "ok" }]);
  });

  it("returns null when the response can't be parsed as JSON at all", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "I couldn't find any issues." });
    const result = await analyzeContractRisks(env, "text");
    expect(result).toBeNull();
  });

  it("returns null when the request throws, without propagating the error", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockRejectedValueOnce(new Error("boom"));
    const result = await analyzeContractRisks(env, "text");
    expect(result).toBeNull();
  });
});

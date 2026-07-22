import { describe, it, expect, vi } from "vitest";
import { classifyBot, logFunnelEvent } from "./analytics";
import { makeMockEnv } from "../test/mockEnv";

describe("classifyBot", () => {
  it("classifies known AI crawler user agents", () => {
    expect(classifyBot("Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)")).toEqual({
      isBot: true,
      botName: "GPTBot",
    });
    expect(classifyBot("ClaudeBot/1.0")).toEqual({ isBot: true, botName: "ClaudeBot" });
    expect(classifyBot("Mozilla/5.0 (compatible; PerplexityBot/1.0)")).toEqual({
      isBot: true,
      botName: "PerplexityBot",
    });
  });

  it("classifies a normal browser user agent as human", () => {
    expect(classifyBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15")).toEqual({
      isBot: false,
      botName: "",
    });
  });

  it("treats a missing user agent as human (not a bot)", () => {
    expect(classifyBot(undefined)).toEqual({ isBot: false, botName: "" });
    expect(classifyBot(null)).toEqual({ isBot: false, botName: "" });
    expect(classifyBot("")).toEqual({ isBot: false, botName: "" });
  });
});

describe("logFunnelEvent", () => {
  it("writes a data point with the expected shape for a bot request", () => {
    const writeDataPoint = vi.fn();
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });

    logFunnelEvent(env, "page_view", "/free-templates/mutual-nda", "GPTBot/1.1");

    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["page_view", "/free-templates/mutual-nda", "bot", "GPTBot"],
      doubles: [1],
      indexes: ["page_view"],
    });
  });

  it("writes a data point for a human request", () => {
    const writeDataPoint = vi.fn();
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });

    logFunnelEvent(env, "document_completed", "/prepare", "Mozilla/5.0");

    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["document_completed", "/prepare", "human", ""],
      doubles: [1],
      indexes: ["document_completed"],
    });
  });

  it("does nothing when the ANALYTICS binding is absent", () => {
    const { env } = makeMockEnv({ ANALYTICS: undefined });
    expect(() => logFunnelEvent(env, "page_view", "/mcp", "Mozilla/5.0")).not.toThrow();
  });

  it("swallows a write error rather than throwing", () => {
    const writeDataPoint = vi.fn(() => {
      throw new Error("boom");
    });
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });
    expect(() => logFunnelEvent(env, "page_view", "/mcp", "Mozilla/5.0")).not.toThrow();
  });
});

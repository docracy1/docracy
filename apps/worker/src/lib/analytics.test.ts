import { describe, it, expect, vi } from "vitest";
import { classifyBot, trackEvent, isExcludedAgent, sanitizeAttribution, isBlockedAttributionSource } from "./analytics";
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

  it("classifies social preview, SEO, and raw HTTP clients as bots", () => {
    expect(classifyBot("facebookexternalhit/1.1").botName).toBe("facebookexternalhit");
    expect(classifyBot("Twitterbot/1.0").botName).toBe("Twitterbot");
    expect(classifyBot("LinkedInBot/1.0").botName).toBe("LinkedInBot");
    expect(classifyBot("Slackbot-LinkExpanding 1.0").botName).toBe("Slackbot");
    expect(classifyBot("Mozilla/5.0 (compatible; AhrefsBot/7.0)").botName).toBe("AhrefsBot");
    expect(classifyBot("Mozilla/5.0 (compatible; SemrushBot/7~bl)").botName).toBe("SemrushBot");
    expect(classifyBot("curl/8.0.1").botName).toBe("curl");
    expect(classifyBot("python-requests/2.31.0").botName).toBe("python-requests");
    expect(classifyBot("Mozilla/5.0 HeadlessChrome/120.0").botName).toBe("HeadlessChrome");
  });

  it("classifies a normal browser user agent as human", () => {
    expect(classifyBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15")).toEqual({
      isBot: false,
      botName: "",
    });
  });

  it("classifies Cursor agent user agents", () => {
    expect(classifyBot("Mozilla/5.0 Cursor/1.0")).toEqual({ isBot: true, botName: "Cursor" });
  });

  it("treats a missing user agent as human (not a bot)", () => {
    expect(classifyBot(undefined)).toEqual({ isBot: false, botName: "" });
    expect(classifyBot(null)).toEqual({ isBot: false, botName: "" });
    expect(classifyBot("")).toEqual({ isBot: false, botName: "" });
  });
});

describe("isExcludedAgent", () => {
  it("excludes Claude and Cursor agents from analytics", () => {
    expect(isExcludedAgent("ClaudeBot/1.0")).toBe(true);
    expect(isExcludedAgent("Claude-User")).toBe(true);
    expect(isExcludedAgent("Mozilla/5.0 Cursor/1.0")).toBe(true);
  });

  it("does not exclude other bots or humans", () => {
    expect(isExcludedAgent("GPTBot/1.1")).toBe(false);
    expect(isExcludedAgent("Mozilla/5.0")).toBe(false);
  });
});

describe("sanitizeAttribution", () => {
  it("drops legacy docstoc junk tags", () => {
    expect(isBlockedAttributionSource("docstoc")).toBe(true);
    expect(sanitizeAttribution("docstoc")).toBe("");
    expect(sanitizeAttribution("docstoc/migration")).toBe("");
    expect(sanitizeAttribution("linkedin/post-01")).toBe("linkedin/post-01");
  });
});

describe("trackEvent", () => {
  it("writes a data point with the expected 15-blob shape for a bot request", () => {
    const writeDataPoint = vi.fn();
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });

    trackEvent(env, {
      event: "page_view",
      route: "/free-templates/mutual-nda",
      userAgent: "GPTBot/1.1",
      country: "US",
    });

    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["page_view", "/free-templates/mutual-nda", "bot", "GPTBot", "US", "", "", "", "", "", "", "", "", "", ""],
      doubles: [1, 0],
      indexes: ["page_view"],
    });
  });

  it("skips writing for Claude and Cursor agents", () => {
    const writeDataPoint = vi.fn();
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });

    trackEvent(env, { event: "page_view", route: "/", userAgent: "ClaudeBot/1.0" });
    trackEvent(env, { event: "page_view", route: "/", userAgent: "Mozilla/5.0 Cursor/1.0" });

    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it("writes a data point for a human request with every optional field populated", () => {
    const writeDataPoint = vi.fn();
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });

    trackEvent(env, {
      event: "document_signed",
      route: "/sign",
      userAgent: "Mozilla/5.0",
      country: "AT",
      userId: "acct-1",
      documentId: "doc-1",
      templateId: "tpl-1",
      source: "utm-test",
      referrer: "https://example.com",
      sessionId: "sess-1",
      durationMs: 1234,
      errorCode: "some_error",
      emailType: "signing_invite",
      templateCategory: "nda",
      attribution: "linkedin/post-01-auto",
    });

    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: [
        "document_signed",
        "/sign",
        "human",
        "",
        "AT",
        "acct-1",
        "doc-1",
        "tpl-1",
        "utm-test",
        "https://example.com",
        "sess-1",
        "some_error",
        "signing_invite",
        "nda",
        "linkedin/post-01-auto",
      ],
      doubles: [1, 1234],
      indexes: ["document_signed"],
    });
  });

  it("defaults every optional field to an empty string/zero when omitted", () => {
    const writeDataPoint = vi.fn();
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });

    trackEvent(env, { event: "signup_completed" });

    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["signup_completed", "", "human", "", "", "", "", "", "", "", "", "", "", "", ""],
      doubles: [1, 0],
      indexes: ["signup_completed"],
    });
  });

  it("does nothing when the ANALYTICS binding is absent", () => {
    const { env } = makeMockEnv({ ANALYTICS: undefined });
    expect(() => trackEvent(env, { event: "page_view", route: "/mcp" })).not.toThrow();
  });

  it("swallows a write error rather than throwing", () => {
    const writeDataPoint = vi.fn(() => {
      throw new Error("boom");
    });
    const { env } = makeMockEnv({ ANALYTICS: { writeDataPoint } as any });
    expect(() => trackEvent(env, { event: "page_view", route: "/mcp" })).not.toThrow();
  });
});

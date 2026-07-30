import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeMockEnv } from "../test/mockEnv";
import {
  extractMainModuleSrc,
  isJavascriptContentType,
  looksLikeHtmlFallback,
  runSpaSmokeAndAlert,
  runSpaSmokeChecks,
} from "./spaSmoke";
import * as email from "./email";

const HTML_OK = `<!doctype html><html><head></head><body><div id="root"></div>
<script type="module" crossorigin src="/assets/index-abc123.js"></script></body></html>`;

const JS_OK = "import{c as e}from\"./chunk.js\";console.log(e);";

beforeEach(() => {
  vi.spyOn(email, "sendSpaSmokeAlert").mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("extractMainModuleSrc", () => {
  it("finds type=module script src", () => {
    expect(extractMainModuleSrc(HTML_OK)).toBe("/assets/index-abc123.js");
  });

  it("returns null when missing", () => {
    expect(extractMainModuleSrc("<html><body>no scripts</body></html>")).toBeNull();
  });
});

describe("content-type / HTML fallback helpers", () => {
  it("accepts javascript content types", () => {
    expect(isJavascriptContentType("application/javascript")).toBe(true);
    expect(isJavascriptContentType("text/javascript; charset=utf-8")).toBe(true);
    expect(isJavascriptContentType("text/html; charset=utf-8")).toBe(false);
  });

  it("detects HTML SPA fallback bodies", () => {
    expect(looksLikeHtmlFallback("<!DOCTYPE html><html>")).toBe(true);
    expect(looksLikeHtmlFallback(JS_OK)).toBe(false);
  });
});

describe("runSpaSmokeChecks", () => {
  it("passes when pages hydrate and API returns JSON 400", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/api/auth/request-link")) {
        return new Response(JSON.stringify({ error: "bad" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith(".js")) {
        return new Response(JS_OK, {
          status: 200,
          headers: { "Content-Type": "application/javascript" },
        });
      }
      return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
    });
    const { env } = makeMockEnv({ PUBLIC_APP_URL: "https://docracy.io", PUBLIC_WORKER_URL: "https://api.docracy.io" });
    expect(await runSpaSmokeChecks(env)).toEqual([]);
  });

  it("fails when asset Content-Type is text/html", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/auth/request-link")) {
        return new Response(JSON.stringify({ error: "bad" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith(".js")) {
        return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
    });
    const { env } = makeMockEnv({ PUBLIC_APP_URL: "https://docracy.io" });
    const failures = await runSpaSmokeChecks(env);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => f.detail.includes("SPA HTML fallback") || f.detail.includes("text/html"))).toBe(true);
  });
});

describe("runSpaSmokeAndAlert", () => {
  function mockHealthyFetch() {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/auth/request-link")) {
        return new Response(JSON.stringify({ error: "bad" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith(".js")) {
        return new Response(JS_OK, { status: 200, headers: { "Content-Type": "application/javascript" } });
      }
      return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
    });
  }

  function mockBrokenFetch() {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/auth/request-link")) {
        return new Response(JSON.stringify({ error: "bad" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith(".js")) {
        return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
      }
      return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
    });
  }

  it("does not email when healthy", async () => {
    mockHealthyFetch();
    const { env } = makeMockEnv();
    await runSpaSmokeAndAlert(env);
    expect(email.sendSpaSmokeAlert).not.toHaveBeenCalled();
  });

  it("emails founder on first failure", async () => {
    mockBrokenFetch();
    const { env } = makeMockEnv({ FEEDBACK_EMAIL: "founder@docracy.io" });
    await runSpaSmokeAndAlert(env);
    expect(email.sendSpaSmokeAlert).toHaveBeenCalledTimes(1);
    expect(vi.mocked(email.sendSpaSmokeAlert).mock.calls[0][1]).toBe("founder@docracy.io");
  });

  it("dedupes: second failure within 6h does not re-email", async () => {
    mockBrokenFetch();
    const { env } = makeMockEnv({ FEEDBACK_EMAIL: "founder@docracy.io" });
    await runSpaSmokeAndAlert(env);
    await runSpaSmokeAndAlert(env);
    expect(email.sendSpaSmokeAlert).toHaveBeenCalledTimes(1);
  });
});

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
  it("passes when pages hydrate and in-process auth returns JSON 400", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
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

  it("does not call the public API origin for the auth shape check", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/auth/request-link")) {
        throw new Error("public self-fetch must not be used for auth smoke");
      }
      if (url.endsWith(".js")) {
        return new Response(JS_OK, { status: 200, headers: { "Content-Type": "application/javascript" } });
      }
      return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
    });
    const { env } = makeMockEnv({ PUBLIC_APP_URL: "https://docracy.io", PUBLIC_WORKER_URL: "https://api.docracy.io" });
    expect(await runSpaSmokeChecks(env)).toEqual([]);
    expect(fetchSpy.mock.calls.every(([input]) => !String(input).includes("/api/auth/request-link"))).toBe(true);
  });
});

describe("runSpaSmokeAndAlert", () => {
  function mockHealthyFetch() {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith(".js")) {
        return new Response(JS_OK, { status: 200, headers: { "Content-Type": "application/javascript" } });
      }
      return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
    });
  }

  function mockBrokenFetch() {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
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

  // Two strikes: a single hourly run's confirmed failure (survives every in-run retry) still
  // isn't enough to alert by itself — a day with several back-to-back deploys can exceed even a
  // generous in-run retry budget on its own. Only a SECOND consecutive hourly run seeing the
  // failure persist should actually page anyone.
  it("does not email on the first confirmed failure (first strike)", async () => {
    vi.useFakeTimers();
    mockBrokenFetch();
    const { env } = makeMockEnv({ FEEDBACK_EMAIL: "founder@docracy.io" });
    const promise = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await promise;
    expect(email.sendSpaSmokeAlert).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("emails founder when the same failure is confirmed on a second consecutive run", async () => {
    vi.useFakeTimers();
    mockBrokenFetch();
    const { env } = makeMockEnv({ FEEDBACK_EMAIL: "founder@docracy.io" });
    const first = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await first;
    expect(email.sendSpaSmokeAlert).not.toHaveBeenCalled();

    vi.setSystemTime(Date.now() + 60 * 60 * 1000); // next hourly cron tick
    const second = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await second;
    expect(email.sendSpaSmokeAlert).toHaveBeenCalledTimes(1);
    expect(vi.mocked(email.sendSpaSmokeAlert).mock.calls[0][1]).toBe("founder@docracy.io");
    vi.useRealTimers();
  });

  it("treats a first strike older than 90 minutes as stale, not confirming", async () => {
    vi.useFakeTimers();
    mockBrokenFetch();
    const { env } = makeMockEnv({ FEEDBACK_EMAIL: "founder@docracy.io" });
    const first = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await first;

    vi.setSystemTime(Date.now() + 91 * 60 * 1000); // stale — well past one hourly tick + slack
    const second = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await second;
    expect(email.sendSpaSmokeAlert).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("dedupes: second alert within 6h of the confirming alert does not re-email", async () => {
    vi.useFakeTimers();
    mockBrokenFetch();
    const { env } = makeMockEnv({ FEEDBACK_EMAIL: "founder@docracy.io" });
    const first = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await first;

    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    const second = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await second;
    expect(email.sendSpaSmokeAlert).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 60 * 60 * 1000); // still within the 6h reminder window
    const third = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(60000);
    await third;
    expect(email.sendSpaSmokeAlert).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  // Pages-only blip: first pass fails hydrate, a retry moments later passes — must not alert.
  // (API auth is in-process now, so the old public 522 self-fetch path is gone.)
  it("does not email when the first pass fails but a retry a few seconds later passes", async () => {
    vi.useFakeTimers();
    let call = 0;
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      call++;
      const url = String(input);
      // 3 page HTML fetches + 3 asset fetches = 6 per pass
      const failingFirstPass = call <= 6;
      if (url.endsWith(".js")) {
        return failingFirstPass
          ? new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } })
          : new Response(JS_OK, { status: 200, headers: { "Content-Type": "application/javascript" } });
      }
      return new Response(HTML_OK, { status: 200, headers: { "Content-Type": "text/html" } });
    });
    const { env } = makeMockEnv({ FEEDBACK_EMAIL: "founder@docracy.io" });
    const promise = runSpaSmokeAndAlert(env);
    await vi.advanceTimersByTimeAsync(10000);
    await promise;
    expect(email.sendSpaSmokeAlert).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

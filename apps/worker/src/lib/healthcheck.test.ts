import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeMockEnv } from "../test/mockEnv";
import { runHealthCheck, runHealthCheckAndAlert, readStatusHistory } from "./healthcheck";
import * as timestamp from "./timestamp";
import * as email from "./email";

beforeEach(() => {
  vi.spyOn(timestamp, "requestTimestamp").mockResolvedValue({ genTime: "2026-01-01T00:00:00Z", tokenBase64: "abc" });
  vi.spyOn(email, "sendHealthAlert").mockResolvedValue(undefined);
  // Covers the MCP connector check (and Stripe, unless a test overrides this) with a healthy
  // default — tests that need a specific failure re-mock fetch themselves.
  vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runHealthCheck", () => {
  it("reports every check healthy when everything responds", async () => {
    const { env } = makeMockEnv();
    const results = await runHealthCheck(env);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results.map((r) => r.name).sort()).toEqual(["D1", "FreeTSA", "KV", "MCP connector", "Stripe"]);
  });

  it("reports Stripe as ok-but-unconfigured when no key is set", async () => {
    const { env } = makeMockEnv();
    const results = await runHealthCheck(env);
    const stripe = results.find((r) => r.name === "Stripe")!;
    expect(stripe.ok).toBe(true);
    expect(stripe.detail).toBe("not configured");
  });

  it("flags FreeTSA as failed when requestTimestamp returns null", async () => {
    vi.spyOn(timestamp, "requestTimestamp").mockResolvedValue(null);
    const { env } = makeMockEnv();
    const results = await runHealthCheck(env);
    expect(results.find((r) => r.name === "FreeTSA")).toMatchObject({ ok: false });
  });

  it("flags Stripe as failed on a non-2xx response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 401 }));
    const { env } = makeMockEnv({ STRIPE_SECRET_KEY: "sk_test_x" });
    const results = await runHealthCheck(env);
    expect(results.find((r) => r.name === "Stripe")).toMatchObject({ ok: false, detail: "HTTP 401" });
  });

  it("flags KV as failed when the binding throws", async () => {
    const { env, kv } = makeMockEnv();
    vi.spyOn(kv, "get").mockRejectedValue(new Error("kv unreachable"));
    const results = await runHealthCheck(env);
    expect(results.find((r) => r.name === "KV")).toMatchObject({ ok: false, detail: "kv unreachable" });
  });
});

describe("runHealthCheckAndAlert", () => {
  it("does not send an alert when every check is healthy", async () => {
    const { env } = makeMockEnv();
    await runHealthCheckAndAlert(env);
    expect(email.sendHealthAlert).not.toHaveBeenCalled();
  });

  it("emails an alert listing only the failed checks", async () => {
    vi.spyOn(timestamp, "requestTimestamp").mockResolvedValue(null);
    const { env } = makeMockEnv();
    await runHealthCheckAndAlert(env);
    expect(email.sendHealthAlert).toHaveBeenCalledTimes(1);
    const failures = vi.mocked(email.sendHealthAlert).mock.calls[0][1];
    expect(failures).toEqual([{ name: "FreeTSA", ok: false, detail: "requestTimestamp returned null" }]);
  });

  it("persists today's result to KV so the public status page has real history", async () => {
    const { env } = makeMockEnv();
    await runHealthCheckAndAlert(env);
    const history = await readStatusHistory(env);
    expect(history).toHaveLength(1);
    expect(history[0].ok).toBe(true);
    expect(history[0].date).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe("readStatusHistory", () => {
  it("returns an empty array when no history has been recorded yet", async () => {
    const { env } = makeMockEnv();
    expect(await readStatusHistory(env)).toEqual([]);
  });
});

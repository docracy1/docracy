import { describe, it, expect } from "vitest";
import { checkRateLimit, checkInviteRateLimit, checkTokenAccessRateLimit, checkFeedbackRateLimit } from "./ratelimit";
import { makeMockEnv } from "../test/mockEnv";

describe("checkRateLimit (per-IP document creation)", () => {
  it("allows up to the cap then blocks", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 10; i++) {
      expect(await checkRateLimit(env, "1.2.3.4")).toBe(true);
    }
    expect(await checkRateLimit(env, "1.2.3.4")).toBe(false);
  });

  it("tracks separate IPs independently", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 10; i++) await checkRateLimit(env, "1.1.1.1");
    expect(await checkRateLimit(env, "1.1.1.1")).toBe(false);
    expect(await checkRateLimit(env, "2.2.2.2")).toBe(true);
  });
});

describe("checkInviteRateLimit (per-recipient-email)", () => {
  it("allows up to the cap then blocks", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 5; i++) {
      expect(await checkInviteRateLimit(env, "victim@example.com")).toBe(true);
    }
    expect(await checkInviteRateLimit(env, "victim@example.com")).toBe(false);
  });

  it("is case-insensitive on the recipient address", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 5; i++) await checkInviteRateLimit(env, "victim@example.com");
    expect(await checkInviteRateLimit(env, "Victim@Example.com")).toBe(false);
  });

  it("tracks separate recipients independently", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 5; i++) await checkInviteRateLimit(env, "a@example.com");
    expect(await checkInviteRateLimit(env, "a@example.com")).toBe(false);
    expect(await checkInviteRateLimit(env, "b@example.com")).toBe(true);
  });
});

describe("checkTokenAccessRateLimit (per-token sign/status link reads)", () => {
  it("allows up to the cap then blocks", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 30; i++) {
      expect(await checkTokenAccessRateLimit(env, "tok-1")).toBe(true);
    }
    expect(await checkTokenAccessRateLimit(env, "tok-1")).toBe(false);
  });

  it("tracks separate tokens independently", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 30; i++) await checkTokenAccessRateLimit(env, "tok-a");
    expect(await checkTokenAccessRateLimit(env, "tok-a")).toBe(false);
    expect(await checkTokenAccessRateLimit(env, "tok-b")).toBe(true);
  });
});

describe("checkFeedbackRateLimit (per-IP feedback form)", () => {
  it("allows up to the cap then blocks", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 5; i++) {
      expect(await checkFeedbackRateLimit(env, "1.2.3.4")).toBe(true);
    }
    expect(await checkFeedbackRateLimit(env, "1.2.3.4")).toBe(false);
  });

  it("tracks separate IPs independently", async () => {
    const { env } = makeMockEnv();
    for (let i = 0; i < 5; i++) await checkFeedbackRateLimit(env, "1.1.1.1");
    expect(await checkFeedbackRateLimit(env, "1.1.1.1")).toBe(false);
    expect(await checkFeedbackRateLimit(env, "2.2.2.2")).toBe(true);
  });
});

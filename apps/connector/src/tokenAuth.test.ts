import { describe, it, expect } from "vitest";
import { extractApiToken, resolvePaidAccountId } from "./tokenAuth";
import { hashOpaqueToken } from "@docracy/shared";
import type { ConnectorEnv } from "./types";

describe("extractApiToken", () => {
  it("reads a Bearer token from the Authorization header", () => {
    const req = new Request("https://example.com/mcp", { headers: { Authorization: "Bearer dk_abc123" } });
    expect(extractApiToken(req)).toBe("dk_abc123");
  });

  it("reads a token from the ?token= query param", () => {
    const req = new Request("https://example.com/mcp?token=dk_abc123");
    expect(extractApiToken(req)).toBe("dk_abc123");
  });

  it("prefers the Authorization header over the query param when both are present", () => {
    const req = new Request("https://example.com/mcp?token=from-query", {
      headers: { Authorization: "Bearer from-header" },
    });
    expect(extractApiToken(req)).toBe("from-header");
  });

  it("returns null when neither is present", () => {
    const req = new Request("https://example.com/mcp");
    expect(extractApiToken(req)).toBeNull();
  });
});

describe("resolvePaidAccountId", () => {
  const TOKEN_SECRET = "test-secret";

  function makeEnv(kvData: Record<string, unknown>): ConnectorEnv {
    return {
      DOCRACY_KV: {
        get: async (key: string, type?: "json") => {
          const val = kvData[key];
          if (val === undefined) return null;
          return type === "json" ? val : JSON.stringify(val);
        },
      } as unknown as ConnectorEnv["DOCRACY_KV"],
      TOKEN_SECRET,
    };
  }

  it("resolves the accountId for a valid token", async () => {
    const hash = await hashOpaqueToken("dk_valid", TOKEN_SECRET);
    const env = makeEnv({ [`apitoken:${hash}`]: { accountId: "acct-1" } });
    const req = new Request("https://example.com/mcp", { headers: { Authorization: "Bearer dk_valid" } });

    expect(await resolvePaidAccountId(req, env)).toBe("acct-1");
  });

  it("returns null for an unrecognized token", async () => {
    const env = makeEnv({});
    const req = new Request("https://example.com/mcp", { headers: { Authorization: "Bearer dk_unknown" } });

    expect(await resolvePaidAccountId(req, env)).toBeNull();
  });

  it("returns null when no token is present at all", async () => {
    const env = makeEnv({});
    const req = new Request("https://example.com/mcp");

    expect(await resolvePaidAccountId(req, env)).toBeNull();
  });

  it("resolves via the ?token= query param too", async () => {
    const hash = await hashOpaqueToken("dk_valid", TOKEN_SECRET);
    const env = makeEnv({ [`apitoken:${hash}`]: { accountId: "acct-1" } });
    const req = new Request("https://example.com/mcp?token=dk_valid");

    expect(await resolvePaidAccountId(req, env)).toBe("acct-1");
  });
});

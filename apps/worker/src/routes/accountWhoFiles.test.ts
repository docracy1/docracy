import { describe, it, expect } from "vitest";
import account from "./account";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { parseWhoFilesVault, whoFilesVaultKey } from "../lib/whoFilesVault";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

describe("parseWhoFilesVault", () => {
  it("keeps known row ids and a corridor slug", () => {
    const parsed = parseWhoFilesVault({
      done: ["i9", "acta", "not-a-row", 3],
      countrySlug: "mexico-to-us",
    });
    expect(parsed).toEqual({ done: ["i9", "acta"], countrySlug: "mexico-to-us" });
  });

  it("drops a junk country slug", () => {
    const parsed = parseWhoFilesVault({ done: ["i9"], countrySlug: "https://evil.example" });
    expect(parsed).toEqual({ done: ["i9"], countrySlug: "" });
  });

  it("rejects a non-array body", () => {
    expect(parseWhoFilesVault({ done: "i9" })).toBeNull();
    expect(parseWhoFilesVault(null)).toBeNull();
  });
});

describe("GET/PUT /api/account/who-files-where", () => {
  it("401s when signed out", async () => {
    const { env } = makeMockEnv();
    const res = await account.request("/who-files-where", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("returns empty defaults then persists for a free account", async () => {
    const { env } = makeMockEnv();
    const token = await createSession(env, MOCK_CTX, "acct-free", "free@example.com", false, false, null, null);
    const cookie = { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } };

    const empty = await account.request("/who-files-where", cookie, env, MOCK_CTX);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ done: [], countrySlug: "", updatedAt: null });

    const put = await account.request(
      "/who-files-where",
      {
        method: "PUT",
        headers: { ...cookie.headers, "Content-Type": "application/json" },
        body: JSON.stringify({ done: ["i9", "acta", "bogus"], countrySlug: "colombia-to-us" }),
      },
      env,
      MOCK_CTX
    );
    expect(put.status).toBe(200);
    const saved = (await put.json()) as { done: string[]; countrySlug: string; updatedAt: string };
    expect(saved.done).toEqual(["i9", "acta"]);
    expect(saved.countrySlug).toBe("colombia-to-us");
    expect(saved.updatedAt).toMatch(/^\d{4}-/);

    const again = await account.request("/who-files-where", cookie, env, MOCK_CTX);
    const body = (await again.json()) as { done: string[]; countrySlug: string };
    expect(body).toMatchObject({ done: ["i9", "acta"], countrySlug: "colombia-to-us" });
    expect(await env.DOCRACY_KV.get(whoFilesVaultKey("acct-free"))).toContain("acta");
  });

  it("scopes KV to the workspace, not another account", async () => {
    const { env } = makeMockEnv();
    const a = await createSession(env, MOCK_CTX, "acct-a", "a@example.com", true, false, null, null);
    const b = await createSession(env, MOCK_CTX, "acct-b", "b@example.com", true, false, null, null);

    await account.request(
      "/who-files-where",
      {
        method: "PUT",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${a}`, "Content-Type": "application/json" },
        body: JSON.stringify({ done: ["cobro"], countrySlug: "mexico-to-us" }),
      },
      env,
      MOCK_CTX
    );

    const other = await account.request(
      "/who-files-where",
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${b}` } },
      env,
      MOCK_CTX
    );
    expect(await other.json()).toEqual({ done: [], countrySlug: "", updatedAt: null });
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import analytics from "../routes/analytics";
import admin from "../routes/admin";
import { makeMockEnv } from "../test/mockEnv";
import { createSession, SESSION_COOKIE_NAME } from "./auth";
import {
  cleanPath,
  countryCode,
  deviceOf,
  isUntracked,
  isVisitorBot,
  netKind,
  pageKindOf,
  resetVisitorMemory,
  sourceOf,
  visitorHash,
} from "./visitorCount";
import { cleanupVisitorCount, insertPageview, visitorOverview, type PageviewRow } from "./visitorCountDb";
import type { Env } from "@docracy/shared";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15";
const ORIGIN = "http://localhost:5173"; // PUBLIC_APP_URL of the mock env

function visit(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "text/plain", Origin: ORIGIN, "user-agent": BROWSER, "CF-Connecting-IP": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

function envWithSalt(overrides: Partial<Env> = {}) {
  return makeMockEnv({ VISITOR_HASH_SALT: "test-salt", ...overrides });
}

async function rows(env: Env) {
  return (await env.DOCRACY_DB!.prepare("SELECT * FROM analytics_events ORDER BY id").all<Record<string, unknown>>()).results;
}

beforeEach(() => resetVisitorMemory());

describe("visitor count helpers", () => {
  it("hashes day, salt, IP and user agent into 16 hex chars that change with the day", async () => {
    const a = await visitorHash("2026-11-13", "s", "1.2.3.4", BROWSER);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(await visitorHash("2026-11-13", "s", "1.2.3.4", BROWSER)).toBe(a);
    expect(await visitorHash("2026-11-14", "s", "1.2.3.4", BROWSER)).not.toBe(a);
    expect(await visitorHash("2026-11-13", "other", "1.2.3.4", BROWSER)).not.toBe(a);
  });

  it("cleans paths and keeps every token-bearing or signed-in page out", () => {
    expect(cleanPath("/pricing/?utm_source=x#top")).toBe("/pricing");
    expect(cleanPath("//evil.example/x")).toBe("");
    expect(cleanPath("https://docracy.io/")).toBe("");
    for (const p of ["/sign/abc", "/status/abc", "/signed/abc", "/es/firmado/abc", "/embed/sign/abc", "/dashboard", "/admin/analytics", "/auth/verify", "/team/accept", "/1099-season/tok", "/es/constancia/tok", "/income-proof/tok"]) {
      expect(isUntracked(p), p).toBe(true);
    }
    for (const p of ["/", "/1099-season", "/income-proof", "/es/constancia", "/blog/w9", "/signing-guide"]) {
      expect(isUntracked(p), p).toBe(false);
    }
  });

  it("sorts paths into kinds of page", () => {
    expect(pageKindOf("/")).toBe("home");
    expect(pageKindOf("/es")).toBe("home");
    expect(pageKindOf("/free-templates/mutual-nda")).toBe("template");
    expect(pageKindOf("/es/plantillas-gratis/contrato")).toBe("template");
    expect(pageKindOf("/free-templates")).toBe("templates");
    expect(pageKindOf("/blog")).toBe("blog");
    expect(pageKindOf("/blog/how-to")).toBe("blog");
    expect(pageKindOf("/prepare")).toBe("prepare");
    expect(pageKindOf("/es/precios")).toBe("pricing");
    expect(pageKindOf("/trust")).toBe("legal");
    expect(pageKindOf("/nda-signing")).toBe("landing");
  });

  it("keeps only the referrer host, prefers utm_source and ignores our own site", () => {
    expect(sourceOf("", "https://www.google.com/search?q=secret")).toBe("google.com");
    expect(sourceOf("LinkedIn", "https://www.google.com/")).toBe("linkedin");
    expect(sourceOf("", "https://docracy.io/pricing")).toBe("");
    expect(sourceOf("", "not a url")).toBe("");
  });

  it("classifies bots, devices, countries and networks", () => {
    expect(isVisitorBot("")).toBe(true);
    expect(isVisitorBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isVisitorBot("Mozilla/5.0 HeadlessChrome/120")).toBe(true);
    expect(isVisitorBot(BROWSER)).toBe(false);
    expect(deviceOf(BROWSER, 390)).toBe("mobile");
    expect(deviceOf(BROWSER, 800)).toBe("tablet");
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(countryCode("us")).toBe("US");
    expect(countryCode("XX")).toBe("");
    expect(netKind(16509, "AMAZON-02")).toBe("dc");
    expect(netKind(7922, "Comcast Cable")).toBe("isp");
    expect(netKind(13335, "Cloudflare")).toBe("isp");
    expect(netKind(99999, "Some Hosting Ltd")).toBe("dc");
    expect(netKind(undefined, undefined)).toBe("");
  });
});

describe("POST /api/analytics/visit", () => {
  it("counts a browser page view without storing IP, query or full referrer", async () => {
    const { env } = envWithSalt();
    const res = await analytics.request(
      "/visit",
      visit({ path: "/free-templates/mutual-nda?utm_source=x", referrer: "https://www.google.com/search?q=nda", width: 1280 }, { "CF-IPCountry": "US" }),
      env,
      MOCK_CTX,
    );
    expect(res.status).toBe(200);
    const { id } = await res.json<{ id: number }>();
    expect(id).toBeGreaterThan(0);
    const [row] = await rows(env);
    expect(row).toMatchObject({ path: "/free-templates/mutual-nda", kind: "template", source: "google.com", device: "desktop", country: "US", seconds: null });
    expect(String(row!.visitor)).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.stringify(row)).not.toContain("203.0.113.7");
    expect(JSON.stringify(row)).not.toContain("q=nda");
  });

  it("skips Do Not Track, GPC, bots, other sites, token pages, the notrack cookie and a missing salt", async () => {
    const cases: [unknown, Record<string, string>, Partial<Env>?][] = [
      [{ path: "/" }, { dnt: "1" }],
      [{ path: "/" }, { "sec-gpc": "1" }],
      [{ path: "/" }, { "user-agent": "Mozilla/5.0 (compatible; bingbot/2.0)" }],
      [{ path: "/" }, { Origin: "https://evil.example" }],
      [{ path: "/sign/secret-token" }, {}],
      [{ path: "/" }, { Cookie: "docracy_notrack=1" }],
      [{ path: "/" }, {}, { VISITOR_HASH_SALT: undefined }],
      ["not json", {}],
    ];
    for (const [body, headers, overrides] of cases) {
      const { env } = envWithSalt(overrides ?? {});
      const res = await analytics.request("/visit", visit(body, headers), env, MOCK_CTX);
      expect(res.status, JSON.stringify(headers)).toBe(204);
      expect(await rows(env)).toHaveLength(0);
    }
  });

  it("does not count a signed-in admin", async () => {
    const { env } = envWithSalt({ ADMIN_EMAILS: "admin@example.com" });
    const token = await createSession(env, MOCK_CTX, "acct-1", "admin@example.com", false, false, null, null);
    const res = await analytics.request("/visit", visit({ path: "/" }, { Cookie: `${SESSION_COOKIE_NAME}=${token}` }), env, MOCK_CTX);
    expect(res.status).toBe(204);
    expect(await rows(env)).toHaveLength(0);
  });

  it("records the visible time only for the same visitor hash", async () => {
    const { env } = envWithSalt();
    const res = await analytics.request("/visit", visit({ path: "/pricing" }), env, MOCK_CTX);
    const { id } = await res.json<{ id: number }>();

    // Another IP cannot set it.
    await analytics.request("/visit/end", visit({ id, seconds: 999 }, { "CF-Connecting-IP": "198.51.100.1" }), env, MOCK_CTX);
    expect((await rows(env))[0]!.seconds).toBeNull();

    expect((await analytics.request("/visit/end", visit({ id, seconds: 42.4 }), env, MOCK_CTX)).status).toBe(204);
    expect((await rows(env))[0]!.seconds).toBe(42);
    // A second, smaller report does not lower it; an absurd one is capped at 30 minutes.
    await analytics.request("/visit/end", visit({ id, seconds: 5 }), env, MOCK_CTX);
    expect((await rows(env))[0]!.seconds).toBe(42);
    await analytics.request("/visit/end", visit({ id, seconds: 99999 }), env, MOCK_CTX);
    expect((await rows(env))[0]!.seconds).toBe(1800);
  });

  it("answers 204 instead of failing when the table is missing", async () => {
    const { env } = envWithSalt();
    await env.DOCRACY_DB!.prepare("DROP TABLE analytics_events").run();
    const res = await analytics.request("/visit", visit({ path: "/" }), env, MOCK_CTX);
    expect(res.status).toBe(204);
  });
});

describe("visitor count in D1", () => {
  const base: PageviewRow = { day: "2026-11-13", ts: 0, path: "/", kind: "home", source: "", device: "desktop", country: "US", net: "isp", visitor: "a" };

  it("stops at the daily cap", async () => {
    const { env } = makeMockEnv();
    const db = env.DOCRACY_DB!;
    expect(await insertPageview(db, { ...base, ts: 1 }, 2)).not.toBeNull();
    expect(await insertPageview(db, { ...base, ts: 2 }, 2)).not.toBeNull();
    expect(await insertPageview(db, { ...base, ts: 3 }, 2)).toBeNull();
    expect(await insertPageview(db, { ...base, day: "2026-11-14", ts: 4 }, 2)).not.toBeNull();
  });

  it("computes visitors, time on page, bounces and second pages per kind, and network per country", async () => {
    const { env } = makeMockEnv();
    const db = env.DOCRACY_DB!;
    const t0 = 1_700_000_000;
    const add = async (row: Partial<PageviewRow>, seconds?: number) => {
      const id = await insertPageview(db, { ...base, ...row });
      if (seconds !== undefined) await db.prepare("UPDATE analytics_events SET seconds = ? WHERE id = ?").bind(seconds, id).run();
    };
    // a: template → pricing (60 s later) → prepare, one visit; then 2 h later a template again (new visit, bounce, 20 s visible).
    await add({ visitor: "a", ts: t0, path: "/free-templates/nda", kind: "template" });
    await add({ visitor: "a", ts: t0 + 60, path: "/pricing", kind: "pricing" }, 30);
    await add({ visitor: "a", ts: t0 + 100, path: "/prepare", kind: "prepare" });
    await add({ visitor: "a", ts: t0 + 7200, path: "/free-templates/lease", kind: "template" }, 20);
    // b: a data-centre bounce on a template from DE, no time known.
    await add({ visitor: "b", ts: t0 + 10, path: "/free-templates/nda", kind: "template", country: "DE", net: "dc" });
    // c: home → blog, US, network unknown.
    await add({ visitor: "c", ts: t0 + 20, path: "/", kind: "home", net: "" });
    await add({ visitor: "c", ts: t0 + 50, path: "/blog/x", kind: "blog", net: "" });

    const o = await visitorOverview(db, { today: "2026-11-13", days: 7 });
    expect(o.totals).toMatchObject({ visitors: 3, pageviews: 7, visits: 4, bounces: 2, secondPage: 2 });

    const template = o.kinds.find((k) => k.kind === "template")!;
    // Views: a (gap 60 s), a (20 s visible), b (unknown) → 2 timed, average 40 s.
    expect(template).toMatchObject({ visitors: 2, pageviews: 3, timed: 2, avgSeconds: 40, entries: 3, bounces: 2, secondPage: 1 });
    // Visits starting on a template with a known time: a's first (60 + 30) and a's second (20) → 55 s.
    expect(template.avgVisitSeconds).toBe(55);
    expect(o.kinds.find((k) => k.kind === "pricing")).toMatchObject({ pageviews: 1, timed: 1, avgSeconds: 30, entries: 0 });
    expect(o.kinds.find((k) => k.kind === "home")).toMatchObject({ entries: 1, bounces: 0, secondPage: 1, avgSeconds: 30 });
    expect(o.kinds.find((k) => k.kind === "docs")).toBeUndefined();

    expect(o.countries).toEqual([
      { country: "US", visitors: 2, pageviews: 6, dc: 0, isp: 1, unknownNet: 1, visits: 3, bounces: 1 },
      { country: "DE", visitors: 1, pageviews: 1, dc: 1, isp: 0, unknownNet: 0, visits: 1, bounces: 1 },
    ]);
    expect(o.pages[0]).toMatchObject({ value: "/free-templates/nda", kind: "template", visitors: 2 });
    expect(o.sources).toEqual([{ value: "direct", visitors: 3, pageviews: 7 }]);
  });

  it("deletes rows older than 180 days and tolerates a missing table", async () => {
    const { env } = makeMockEnv();
    const db = env.DOCRACY_DB!;
    await insertPageview(db, { ...base, day: "2026-01-01" });
    await insertPageview(db, { ...base, day: "2026-11-01" });
    await cleanupVisitorCount(env, new Date("2026-11-13T08:00:00Z"));
    expect((await rows(env)).map((r) => r.day)).toEqual(["2026-11-01"]);
    await db.prepare("DROP TABLE analytics_events").run();
    await expect(cleanupVisitorCount(env)).resolves.toBeUndefined();
  });
});

describe("GET /api/admin/visitors", () => {
  it("is admin only and returns the overview", async () => {
    const { env } = envWithSalt({ ADMIN_EMAILS: "admin@example.com" });
    expect((await admin.request("/visitors", {}, env, MOCK_CTX)).status).toBe(401);
    const token = await createSession(env, MOCK_CTX, "acct-1", "admin@example.com", false, false, null, null);
    const res = await admin.request("/visitors?days=7", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body = await res.json<{ days: number; saltConfigured: boolean; kinds: unknown[] }>();
    expect(body).toMatchObject({ days: 7, saltConfigured: true, kinds: [] });
  });
});

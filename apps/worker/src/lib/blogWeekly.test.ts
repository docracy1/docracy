import { describe, expect, it } from "vitest";
import { ensureWeeklyBlogInfra } from "./blogTopicQueue";
import { makeMockEnv } from "../test/mockEnv";

/** Mirrors slug uniqueness helper behavior used by weekly publish. */
function ensureUniqueSlug(desired: string, taken: Set<string>): string {
  let slug = desired;
  let n = 2;
  while (taken.has(slug.toLowerCase())) {
    slug = `${desired.slice(0, 76)}-${n}`;
    n += 1;
  }
  return slug;
}

describe("weekly blog slug uniqueness", () => {
  it("keeps the preferred slug when free", () => {
    expect(ensureUniqueSlug("how-to-sign-online", new Set())).toBe("how-to-sign-online");
  });

  it("suffixes when colliding", () => {
    const taken = new Set(["how-to-sign-online"]);
    expect(ensureUniqueSlug("how-to-sign-online", taken)).toBe("how-to-sign-online-2");
  });
});

describe("weekly blog LATAM queue refill", () => {
  it("seeds LATAM topics when the table is empty", async () => {
    const { env, d1 } = makeMockEnv();
    await d1.exec("DROP TABLE blog_topic_queue");

    await ensureWeeklyBlogInfra(env);

    const row = (await d1
      .prepare(`SELECT COUNT(*) as n FROM blog_topic_queue WHERE status = 'queued' AND id LIKE 'btq_3%'`)
      .first()) as { n: number } | null;
    expect(Number(row?.n ?? 0)).toBeGreaterThanOrEqual(7);
    const itin = (await d1
      .prepare(`SELECT slug FROM blog_topic_queue WHERE slug = ?`)
      .bind("itin-vs-ssn-after-arriving-in-the-us")
      .first()) as { slug: string } | null;
    expect(itin?.slug).toBe("itin-vs-ssn-after-arriving-in-the-us");
    const acta = (await d1
      .prepare(`SELECT slug FROM blog_topic_queue WHERE slug = ?`)
      .bind("acta-de-nacimiento-apostilla-mexico")
      .first()) as { slug: string } | null;
    expect(acta?.slug).toBe("acta-de-nacimiento-apostilla-mexico");
    const cita = (await d1
      .prepare(`SELECT slug FROM blog_topic_queue WHERE slug = ?`)
      .bind("cita-consular-ais-cas-ustraveldocs")
      .first()) as { slug: string } | null;
    expect(cita?.slug).toBe("cita-consular-ais-cas-ustraveldocs");
    const ead = (await d1
      .prepare(`SELECT slug FROM blog_topic_queue WHERE slug = ?`)
      .bind("permiso-de-trabajo-i-765-ead-tps")
      .first()) as { slug: string } | null;
    expect(ead?.slug).toBe("permiso-de-trabajo-i-765-ead-tps");
    const bank = (await d1
      .prepare(`SELECT slug FROM blog_topic_queue WHERE slug = ?`)
      .bind("abrir-cuenta-bancaria-con-itin")
      .first()) as { slug: string } | null;
    expect(bank?.slug).toBe("abrir-cuenta-bancaria-con-itin");
  });

  it("is idempotent on a migrated database", async () => {
    const { env, d1 } = makeMockEnv();
    const before = (await d1.prepare(`SELECT COUNT(*) as n FROM blog_topic_queue`).first()) as { n: number } | null;
    await ensureWeeklyBlogInfra(env);
    await ensureWeeklyBlogInfra(env);
    const after = (await d1.prepare(`SELECT COUNT(*) as n FROM blog_topic_queue`).first()) as { n: number } | null;
    expect(Number(after?.n)).toBe(Number(before?.n));
    expect(Number(after?.n)).toBeGreaterThanOrEqual(44);
  });

  it("moves job-phrase topics to the Monday head", async () => {
    const { env, d1 } = makeMockEnv();
    await ensureWeeklyBlogInfra(env);
    const first = (await d1
      .prepare(`SELECT slug FROM blog_topic_queue WHERE status = 'queued' ORDER BY sort_order ASC, created_at ASC LIMIT 1`)
      .first()) as { slug: string } | null;
    expect(first?.slug).toBe("acta-de-nacimiento-apostilla-mexico");
  });
});

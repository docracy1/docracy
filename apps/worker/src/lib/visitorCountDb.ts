/**
 * D1 side of the cookieless visitor count (lib/visitorCount.ts): one insert per page view (with the daily cap), the
 * visible-time update when the page is left, the daily clean-up and the figures of the admin page. Everything is
 * counted in SQL; the Worker only gets sums, never rows.
 */
import type { Env } from "@docracy/shared";
import { MAX_PAGE_SECONDS, PAGE_KINDS, VISITOR_DAILY_CAP, VISITOR_KEEP_DAYS, VISIT_GAP_SECONDS } from "./visitorCount";

type DB = NonNullable<Env["DOCRACY_DB"]>;

export interface PageviewRow {
  day: string;
  ts: number;
  path: string;
  kind: string;
  source: string;
  device: string;
  country: string;
  net: string;
  visitor: string;
}

/**
 * Writes the row unless the day already has `cap` rows and returns its id (null when the cap stopped it). The rowid
 * grows with time and old days are only ever deleted as a whole, so today's count is MAX(id) - MIN(id of today) + 1:
 * two index seeks instead of counting the day.
 */
export async function insertPageview(db: DB, row: PageviewRow, cap = VISITOR_DAILY_CAP): Promise<number | null> {
  const result = await db
    .prepare(
      "INSERT INTO analytics_events (day, ts, path, kind, source, device, country, net, visitor) " +
        "SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9 " +
        "WHERE COALESCE((SELECT MAX(id) FROM analytics_events) - (SELECT MIN(id) FROM analytics_events WHERE day = ?1) + 1, 0) < ?10 " +
        "RETURNING id",
    )
    .bind(row.day, row.ts, row.path, row.kind, row.source || null, row.device || null, row.country || null, row.net || null, row.visitor, cap)
    .first<{ id: number }>();
  return result ? Number(result.id) : null;
}

/**
 * Visible time of one page view, sent when the page is left. Only the same daily hash (same IP and browser, same day)
 * can set it, so a stranger who guesses an id changes nothing. The larger value wins: the browser may report twice.
 */
export async function recordSeconds(db: DB, id: number, visitor: string, day: string, seconds: number): Promise<void> {
  const value = Math.max(0, Math.min(MAX_PAGE_SECONDS, Math.round(seconds)));
  await db
    .prepare("UPDATE analytics_events SET seconds = MAX(COALESCE(seconds, 0), ?1) WHERE id = ?2 AND visitor = ?3 AND day = ?4")
    .bind(value, id, visitor, day)
    .run();
}

/** Daily cron: rows older than VISITOR_KEEP_DAYS go. Missing table (migration 0037 not applied) is no error. */
export async function cleanupVisitorCount(env: Env, now = new Date()): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const cutoff = new Date(now.getTime() - VISITOR_KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  try {
    await env.DOCRACY_DB.prepare("DELETE FROM analytics_events WHERE day < ?").bind(cutoff).run();
  } catch (e) {
    if (!/no such table/i.test(e instanceof Error ? e.message : String(e))) throw e;
  }
}

/** One kind of page: the page-view side (who saw it, how long) and the visit side (visits that started there). */
export interface KindStats {
  kind: string;
  visitors: number;
  pageviews: number;
  /** Page views with a known time on the page (visible time, else the gap to the next view of the same visit). */
  timed: number;
  /** Average seconds on the page over `timed`; null when none is known. */
  avgSeconds: number | null;
  /** Visits whose first page was of this kind. */
  entries: number;
  /** Of those, visits with only this one page view. */
  bounces: number;
  /** Of those, visits that went on to a second page. */
  secondPage: number;
  /** Average visit length (sum of the known page times) over entries with at least one known time. */
  avgVisitSeconds: number | null;
}

export interface CountryStats {
  country: string;
  visitors: number;
  pageviews: number;
  /** Visitors by kind of network; a hash seen on both counts in both. */
  dc: number;
  isp: number;
  unknownNet: number;
  /** Visits started in this country and how many of them were one page only. */
  visits: number;
  bounces: number;
}

export interface Count {
  value: string;
  visitors: number;
  pageviews: number;
}

export interface VisitorOverview {
  days: number;
  first: string;
  today: string;
  totals: { visitors: number; pageviews: number; visits: number; bounces: number; secondPage: number; timed: number; avgSeconds: number | null };
  daily: { day: string; visitors: number; pageviews: number }[];
  kinds: KindStats[];
  countries: CountryStats[];
  pages: (Count & { kind: string })[];
  sources: Count[];
  devices: Count[];
}

/**
 * The window part every visit query shares. Per page view: `spent` = seconds on the page (the visible time the
 * browser sent, else the gap to the next view when that is within one visit), `entry` = 1 when it starts a visit
 * (first view of the hash or more than 30 minutes after the previous one), `visit` = running visit number per hash.
 * ?1 = first day, ?2 = visit gap in seconds.
 */
const VIEWS_CTE =
  "WITH v AS (SELECT id, visitor, ts, kind, country, seconds, " +
  "ts - LAG(ts) OVER w AS gap, LEAD(ts) OVER w - ts AS next_gap " +
  "FROM analytics_events WHERE day >= ?1 WINDOW w AS (PARTITION BY visitor ORDER BY ts, id)), " +
  "t AS (SELECT *, CASE WHEN seconds IS NOT NULL THEN seconds WHEN next_gap <= ?2 THEN next_gap END AS spent, " +
  "CASE WHEN gap IS NULL OR gap > ?2 THEN 1 ELSE 0 END AS entry FROM v), " +
  "s AS (SELECT *, SUM(entry) OVER (PARTITION BY visitor ORDER BY ts, id ROWS UNBOUNDED PRECEDING) AS visit FROM t) ";

/** Adds one row per visit: kind and country of its first page, page views, how many with a known time, their sum. */
const VISITS_CTE =
  VIEWS_CTE +
  ", g AS (SELECT MAX(CASE WHEN entry = 1 THEN kind END) AS kind, MAX(CASE WHEN entry = 1 THEN country END) AS country, " +
  "COUNT(*) AS n, COUNT(spent) AS timed, SUM(spent) AS spent FROM s GROUP BY visitor, visit) ";

export const SQL = {
  totals:
    "SELECT COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews FROM analytics_events WHERE day >= ?1",
  daily:
    "SELECT day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews FROM analytics_events WHERE day >= ?1 GROUP BY day ORDER BY day DESC",
  kindViews:
    VIEWS_CTE +
    "SELECT kind, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews, COUNT(spent) AS timed, COALESCE(SUM(spent), 0) AS spent " +
    "FROM s GROUP BY kind",
  kindVisits:
    VISITS_CTE +
    "SELECT kind, COUNT(*) AS entries, COALESCE(SUM(n = 1), 0) AS bounces, COALESCE(SUM(n >= 2), 0) AS secondPage, " +
    "COALESCE(SUM(timed > 0), 0) AS timedVisits, COALESCE(SUM(spent), 0) AS spent FROM g GROUP BY kind",
  countries:
    "SELECT COALESCE(country, '??') AS country, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews, " +
    "COUNT(DISTINCT CASE WHEN net = 'dc' THEN visitor END) AS dc, COUNT(DISTINCT CASE WHEN net = 'isp' THEN visitor END) AS isp, " +
    "COUNT(DISTINCT CASE WHEN net IS NULL THEN visitor END) AS unknownNet " +
    "FROM analytics_events WHERE day >= ?1 GROUP BY 1 ORDER BY visitors DESC, pageviews DESC, country LIMIT ?2",
  countryVisits:
    VISITS_CTE + "SELECT COALESCE(country, '??') AS country, COUNT(*) AS visits, COALESCE(SUM(n = 1), 0) AS bounces FROM g GROUP BY 1",
  pages:
    "SELECT path AS value, MAX(kind) AS kind, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews FROM analytics_events " +
    "WHERE day >= ?1 GROUP BY path ORDER BY visitors DESC, pageviews DESC, value LIMIT ?2",
  sources:
    "SELECT COALESCE(source, 'direct') AS value, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews FROM analytics_events " +
    "WHERE day >= ?1 GROUP BY 1 ORDER BY visitors DESC, pageviews DESC, value LIMIT ?2",
  devices:
    "SELECT COALESCE(device, 'unknown') AS value, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews FROM analytics_events " +
    "WHERE day >= ?1 GROUP BY 1 ORDER BY visitors DESC, pageviews DESC, value LIMIT ?2",
} as const;

/** First day of a window of `days` days ending today (today included). */
export function firstDay(today: string, days: number): string {
  return new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * 86_400_000).toISOString().slice(0, 10);
}

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0)) || 0;
const avg = (total: number, n: number): number | null => (n > 0 ? total / n : null);

/** All figures of the "Visitors" section of the admin page for the last `days` days. */
export async function visitorOverview(db: DB, options: { today: string; days: number }): Promise<VisitorOverview> {
  const { today, days } = options;
  const first = firstDay(today, days);
  const all = async <T>(sql: string, ...params: unknown[]): Promise<T[]> =>
    ((await db.prepare(sql).bind(first, ...params).all<T>()).results ?? []) as T[];

  const [totalsRows, daily, kindViews, kindVisits, countries, countryVisits, pages, sources, devices] = await Promise.all([
    all<{ visitors: number; pageviews: number }>(SQL.totals),
    all<{ day: string; visitors: number; pageviews: number }>(SQL.daily),
    all<{ kind: string; visitors: number; pageviews: number; timed: number; spent: number }>(SQL.kindViews, VISIT_GAP_SECONDS),
    all<{ kind: string; entries: number; bounces: number; secondPage: number; timedVisits: number; spent: number }>(SQL.kindVisits, VISIT_GAP_SECONDS),
    all<Omit<CountryStats, "visits" | "bounces">>(SQL.countries, 30),
    all<{ country: string; visits: number; bounces: number }>(SQL.countryVisits, VISIT_GAP_SECONDS),
    all<Count & { kind: string }>(SQL.pages, 25),
    all<Count>(SQL.sources, 15),
    all<Count>(SQL.devices, 5),
  ]);

  const views = new Map(kindViews.map((r) => [r.kind, r]));
  const visits = new Map(kindVisits.map((r) => [r.kind, r]));
  const known = new Set<string>([...PAGE_KINDS, ...views.keys(), ...visits.keys()]);
  const kinds: KindStats[] = [...known]
    .map((kind) => {
      const pv = views.get(kind);
      const vi = visits.get(kind);
      return {
        kind,
        visitors: num(pv?.visitors),
        pageviews: num(pv?.pageviews),
        timed: num(pv?.timed),
        avgSeconds: avg(num(pv?.spent), num(pv?.timed)),
        entries: num(vi?.entries),
        bounces: num(vi?.bounces),
        secondPage: num(vi?.secondPage),
        avgVisitSeconds: avg(num(vi?.spent), num(vi?.timedVisits)),
      };
    })
    .filter((k) => k.pageviews > 0)
    .sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews || a.kind.localeCompare(b.kind));

  const byCountry = new Map(countryVisits.map((r) => [r.country, r]));
  const sum = (key: keyof KindStats) => kinds.reduce((acc, k) => acc + num(k[key]), 0);
  const timed = sum("timed");
  const spent = kindViews.reduce((acc, r) => acc + num(r.spent), 0);

  return {
    days,
    first,
    today,
    totals: {
      visitors: num(totalsRows[0]?.visitors),
      pageviews: num(totalsRows[0]?.pageviews),
      visits: sum("entries"),
      bounces: sum("bounces"),
      secondPage: sum("secondPage"),
      timed,
      avgSeconds: avg(spent, timed),
    },
    daily: daily.map((d) => ({ day: d.day, visitors: num(d.visitors), pageviews: num(d.pageviews) })),
    kinds,
    countries: countries.map((c) => ({
      country: c.country,
      visitors: num(c.visitors),
      pageviews: num(c.pageviews),
      dc: num(c.dc),
      isp: num(c.isp),
      unknownNet: num(c.unknownNet),
      visits: num(byCountry.get(c.country)?.visits),
      bounces: num(byCountry.get(c.country)?.bounces),
    })),
    pages: pages.map((p) => ({ value: p.value, kind: p.kind, visitors: num(p.visitors), pageviews: num(p.pageviews) })),
    sources: sources.map((s) => ({ value: s.value, visitors: num(s.visitors), pageviews: num(s.pageviews) })),
    devices: devices.map((s) => ({ value: s.value, visitors: num(s.visitors), pageviews: num(s.pageviews) })),
  };
}

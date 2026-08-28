import type { Env } from "@docracy/shared";

const ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}Z)?$/;

/** Normalized UTC ISO datetime for SQL + API, or null when unset/invalid. */
export function analyticsCountFromIso(env: Pick<Env, "ANALYTICS_COUNT_FROM">): string | null {
  const raw = env.ANALYTICS_COUNT_FROM?.trim();
  if (!raw || !ISO_RE.test(raw)) return null;
  return raw.includes("T") ? raw : `${raw}T00:00:00Z`;
}

/** Analytics Engine SQL fragment — excludes events before the admin baseline (SEO/history untouched). */
export function analyticsCountFromSql(env: Pick<Env, "ANALYTICS_COUNT_FROM">): string {
  const iso = analyticsCountFromIso(env);
  if (!iso) return "";
  return ` AND timestamp >= toDateTime('${iso}')`;
}

/** D1 `>= ?` bind value for account-linked document drill-downs in admin. */
export function analyticsCountFromSince(env: Pick<Env, "ANALYTICS_COUNT_FROM">): string | null {
  return analyticsCountFromIso(env);
}

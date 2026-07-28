import type { Env } from "@docracy/shared";

/** Free-tier and unpaid default retention — env DOC_TTL_DAYS (currently 9). */
export function defaultTtlDays(env: Env): number {
  return Number(env.DOC_TTL_DAYS) || 9;
}

/** Paid accounts may extend retention up to this many days (env DOC_TTL_MAX_DAYS, default 90). */
export function maxTtlDays(env: Env): number {
  const n = Number(env.DOC_TTL_MAX_DAYS);
  return Number.isFinite(n) && n >= 1 ? n : 90;
}

/**
 * Resolves how long a new document should live.
 * - Free / anonymous: always the default (ignores any client-supplied value).
 * - Paid with no override: default.
 * - Paid with ttlDays: clamped to [1, maxTtlDays].
 * Returns an error string when the paid override is present but invalid.
 */
export function resolveTtlDays(
  env: Env,
  opts: { isPaid: boolean; ttlDays?: number }
): { ttlDays: number } | { error: string } {
  const fallback = defaultTtlDays(env);
  if (!opts.isPaid || opts.ttlDays === undefined) {
    return { ttlDays: fallback };
  }
  if (!Number.isInteger(opts.ttlDays) || opts.ttlDays < 1) {
    return { error: "ttlDays must be a positive integer" };
  }
  const max = maxTtlDays(env);
  if (opts.ttlDays > max) {
    return { error: `ttlDays cannot exceed ${max}` };
  }
  return { ttlDays: opts.ttlDays };
}

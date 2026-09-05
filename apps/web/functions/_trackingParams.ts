import { FIRST_TOUCH_COOKIE, serializeFirstTouchCookie } from "../src/lib/firstTouchCookie";

/** Query keys that only exist for attribution. Functional params (freeTemplate, next, send) stay. */
export const TRACKING_QUERY_KEYS = new Set([
  "ref",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "gclid",
  "fbclid",
  "msclkid",
  "twclid",
  "ttclid",
  "_ga",
  "mc_cid",
  "mc_eid",
]);

export function stripTrackingSearch(search: string): { nextSearch: string; stripped: Record<string, string> } {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const stripped: Record<string, string> = {};
  for (const key of [...params.keys()]) {
    if (!TRACKING_QUERY_KEYS.has(key.toLowerCase())) continue;
    stripped[key.toLowerCase()] = params.get(key) ?? "";
    params.delete(key);
  }
  const qs = params.toString();
  return { nextSearch: qs ? `?${qs}` : "", stripped };
}

export function firstTouchCookieFromStripped(stripped: Record<string, string>): string | null {
  const source = stripped.utm_source || stripped.ref || "";
  if (!source) return null;
  return serializeFirstTouchCookie(source, stripped.utm_medium || "", stripped.utm_campaign || stripped.utm_content || "");
}

function hasFileExtension(pathname: string): boolean {
  return /\.[a-z0-9]+$/i.test(pathname);
}

/**
 * One-hop public URL: apex host on docracy.io, no trailing slash, no tracking params.
 * Preview / localhost keep their host so local dev does not bounce to production.
 */
export function canonicalPublicLocation(url: URL): { location: string; stripped: Record<string, string> } | null {
  const { nextSearch, stripped } = stripTrackingSearch(url.search);
  let pathname = url.pathname;
  const hadTrailing = pathname.length > 1 && pathname.endsWith("/") && !hasFileExtension(pathname);
  if (hadTrailing) pathname = pathname.replace(/\/+$/, "");

  const isProd = url.hostname === "docracy.io" || url.hostname === "www.docracy.io";
  const host = isProd ? "docracy.io" : url.host;
  const protocol = isProd ? "https:" : url.protocol;
  const location = `${protocol}//${host}${pathname === "" ? "/" : pathname}${nextSearch}`;

  const current = `${url.protocol}//${url.host}${url.pathname}${url.search}`;
  if (location === current) return null;
  return { location, stripped };
}

export function firstTouchSetCookieHeader(stripped: Record<string, string>): string | null {
  const value = firstTouchCookieFromStripped(stripped);
  if (!value) return null;
  return `${FIRST_TOUCH_COOKIE}=${value}; Path=/; Max-Age=1800; SameSite=Lax; Secure`;
}

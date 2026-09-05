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

/** Destinations for /try, /nda, /go/* — keep functional params, never tracking query. */
export type ShortLinkDest = {
  pathname: string;
  keep?: Record<string, string>;
  implied: Record<string, string>;
};

export const SHORT_LINK_DESTINATIONS: Record<string, ShortLinkDest> = {
  "/try": { pathname: "/prepare", keep: { freeTemplate: "mutual-nda" }, implied: { ref: "try" } },
  "/nda": { pathname: "/prepare", keep: { freeTemplate: "mutual-nda" }, implied: { ref: "nda" } },
  "/price": { pathname: "/pricing", implied: { ref: "price" } },
  "/submit": { pathname: "/submit-template", implied: { ref: "submit" } },
  "/marketplace": { pathname: "/free-templates", implied: { ref: "marketplace" } },
  "/go/ph": {
    pathname: "/prepare",
    keep: { freeTemplate: "mutual-nda" },
    implied: { utm_source: "producthunt", utm_medium: "launch", utm_campaign: "launch" },
  },
  "/go/hn": {
    pathname: "/prepare",
    keep: { freeTemplate: "mutual-nda" },
    implied: { utm_source: "hackernews", utm_medium: "showhn", utm_campaign: "showhn" },
  },
  "/go/li": { pathname: "/prepare", keep: { freeTemplate: "mutual-nda" }, implied: { ref: "linkedin" } },
  "/go/x": { pathname: "/prepare", keep: { freeTemplate: "mutual-nda" }, implied: { ref: "x" } },
  "/go/dm": { pathname: "/outreach/general", implied: { utm_source: "outreach", utm_medium: "dm", utm_campaign: "dm" } },
  "/go/si": {
    pathname: "/prepare",
    keep: { freeTemplate: "mutual-nda" },
    implied: { utm_source: "startupinspire", utm_medium: "directory", utm_campaign: "listing" },
  },
  "/go/ti": {
    pathname: "/prepare",
    keep: { freeTemplate: "mutual-nda" },
    implied: { utm_source: "techimply", utm_medium: "directory", utm_campaign: "listing" },
  },
  "/go/gl": { pathname: "/mcp", implied: { utm_source: "glama", utm_medium: "directory", utm_campaign: "listing" } },
  "/go/sh": {
    pathname: "/prepare",
    keep: { freeTemplate: "mutual-nda" },
    implied: { utm_source: "saashub", utm_medium: "directory", utm_campaign: "listing" },
  },
  "/go/at": {
    pathname: "/prepare",
    keep: { freeTemplate: "mutual-nda" },
    implied: { utm_source: "alternativeto", utm_medium: "directory", utm_campaign: "listing" },
  },
  "/go/dm-fl": {
    pathname: "/outreach/freelancer",
    implied: { utm_source: "outreach", utm_medium: "dm", utm_campaign: "dm-freelancer" },
  },
  "/go/dm-ag": {
    pathname: "/outreach/agency",
    implied: { utm_source: "outreach", utm_medium: "dm", utm_campaign: "dm-agency" },
  },
  "/go/dm-po": {
    pathname: "/outreach/peopleops",
    implied: { utm_source: "outreach", utm_medium: "dm", utm_campaign: "dm-peopleops" },
  },
  "/go/dm-fo": {
    pathname: "/outreach/founder",
    implied: { utm_source: "outreach", utm_medium: "dm", utm_campaign: "dm-founder" },
  },
};

function normalizeShortPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.replace(/\/+$/, "");
  return pathname || "/";
}

/**
 * One hop from a short share URL to its clean destination (apex host, no tracking query).
 * Attribution is the implied short-link source, overwritten by any incoming utm/ref.
 */
export function shortLinkCanonical(url: URL): { location: string; stripped: Record<string, string> } | null {
  const dest = SHORT_LINK_DESTINATIONS[normalizeShortPath(url.pathname)];
  if (!dest) return null;

  const { stripped: fromQuery } = stripTrackingSearch(url.search);
  const stripped = { ...dest.implied, ...fromQuery };

  const isProd = url.hostname === "docracy.io" || url.hostname === "www.docracy.io";
  const host = isProd ? "docracy.io" : url.host;
  const protocol = isProd ? "https:" : url.protocol;
  const params = new URLSearchParams(dest.keep ?? {});
  const qs = params.toString();
  return { location: `${protocol}//${host}${dest.pathname}${qs ? `?${qs}` : ""}`, stripped };
}

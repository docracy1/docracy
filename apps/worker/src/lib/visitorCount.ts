/**
 * Own cookieless visitor count (owner 13.11.2026, carried over from firmenbuchdaten.at): visitors, time on page,
 * bounces and second pages per kind of page. Runs next to the Analytics Engine funnel (lib/analytics.ts), which counts
 * events but has no notion of a visitor and so cannot tell how long anyone stays.
 *
 * Stored per public page view, and only this (table analytics_events, migration 0037): day, time, path, kind of page,
 * source host, device class, country, kind of network and a visitor hash that is formed anew every day. No cookie,
 * nothing in the browser's storage, no IP address (it only goes into the daily hash), never a full referrer URL and
 * never a signing or status link (those carry tokens and are not counted at all). The privacy page says the same.
 */
import { classifyBot } from "./analytics";

/** Days a row is kept; the daily cron deletes older rows and the privacy page names the period. */
export const VISITOR_KEEP_DAYS = 180;

/**
 * At most this many rows per day. D1 free allows 100,000 written rows a day for the whole account; one page view
 * costs about three (row, day index, the later `seconds` update). After the cap the day is simply not counted further.
 */
export const VISITOR_DAILY_CAP = 5000;

/** Two page views of one hash with more than 30 minutes in between are two visits (as Plausible counts). */
export const VISIT_GAP_SECONDS = 30 * 60;

/** Visible time above this is not believed (a tab left open overnight); the value is capped, not dropped. */
export const MAX_PAGE_SECONDS = 30 * 60;

/** 16 hex characters from day, salt, IP and user agent. A new day gives a new hash, so no visitor is followed longer. */
export async function visitorHash(day: string, salt: string, ip: string, userAgent: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${day}|${salt}|visitors|${ip}|${userAgent}`));
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function countryCode(value: unknown): string {
  const code = (typeof value === "string" ? value : "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1" ? code : "";
}

/** Path without query, anchor and trailing slash; anything that is not a path becomes "". */
export function cleanPath(value: unknown): string {
  if (typeof value !== "string") return "";
  const path = value.split("#")[0]!.split("?")[0]!.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return (path.length > 1 ? path.replace(/\/+$/, "") || "/" : "/").slice(0, 200);
}

/**
 * Not counted: the signed-in app, the API, and every page whose path carries a token (signing, status, signed copy,
 * embedded signing, 1099 / income-proof request links, magic-link and team-invite confirmations). The figures describe
 * the public site; a token in the table would be the one thing here that points to a person.
 */
const UNTRACKED = [
  /^\/(sign|status|signed|embed|auth|team|dashboard|bulk-send|admin|api|account)(\/|$)/,
  /^\/es\/firmado(\/|$)/,
  /^\/(1099-season|income-proof)\/./,
  /^\/es\/(temporada-1099|constancia)\/./,
];

export function isUntracked(path: string): boolean {
  return UNTRACKED.some((re) => re.test(path));
}

export type PageKind = "home" | "template" | "templates" | "blog" | "prepare" | "pricing" | "docs" | "legal" | "login" | "landing";

export const PAGE_KINDS: readonly PageKind[] = ["home", "landing", "template", "templates", "blog", "prepare", "pricing", "docs", "legal", "login"];

const KIND_EXACT: Record<string, PageKind> = {
  "/": "home",
  "/es": "home",
  "/free-templates": "templates",
  "/es/plantillas-gratis": "templates",
  "/template-marketplace": "templates",
  "/es/marketplace-de-plantillas": "templates",
  "/marketplace": "templates",
  "/prepare": "prepare",
  "/prepare/sent": "prepare",
  "/es/preparar": "prepare",
  "/try": "prepare",
  "/pricing": "pricing",
  "/es/precios": "pricing",
  "/price": "pricing",
  "/docs": "docs",
  "/es/documentacion": "docs",
  "/developers": "docs",
  "/es/desarrolladores": "docs",
  "/mcp": "docs",
  "/es/mcp": "docs",
  "/privacy": "legal",
  "/terms": "legal",
  "/trust": "legal",
  "/dpa": "legal",
  "/imprint": "legal",
  "/login": "login",
};

/** Kind of page for the breakdown on the admin page; every other public page is an SEO / feature "landing". */
export function pageKindOf(path: string): PageKind {
  const exact = KIND_EXACT[path];
  if (exact) return exact;
  if (/^\/(es\/plantillas-gratis|free-templates)\/[^/]+$/.test(path)) return "template";
  if (path === "/blog" || path.startsWith("/blog/")) return "blog";
  return "landing";
}

/** Device class from the window width, not from the user agent: the width is what matters for the layout. */
export function deviceOf(userAgent: string, width?: unknown): "mobile" | "tablet" | "desktop" {
  if (typeof width === "number" && Number.isFinite(width) && width > 0) {
    if (width < 640) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Crawlers and tools beyond the named list in lib/analytics.ts; an empty user agent is never a person here. */
const GENERIC_BOT =
  /bot|crawl|spider|slurp|scrape|headless|lighthouse|pagespeed|preview|python|curl|wget|httpclient|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|phantomjs|puppeteer|playwright|selenium|mediapartners|adsbot|feedfetcher|monitor|uptime|semrush|ahrefs|bytespider|yandex|baidu|archive\.org|google-inspectiontool/i;

export function isVisitorBot(userAgent: string): boolean {
  return !userAgent.trim() || classifyBot(userAgent).isBot || GENERIC_BOT.test(userAgent);
}

const OWN_HOST = "docracy.io";

/** Only the host of the referrer, lower case, without www; our own pages and junk give "". */
export function referrerHost(referrer: unknown): string {
  if (typeof referrer !== "string" || !referrer) return "";
  try {
    const host = new URL(referrer.slice(0, 500)).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === OWN_HOST || host.endsWith(`.${OWN_HOST}`) || host === "localhost" || host.endsWith(".pages.dev")) return "";
    return host.slice(0, 100);
  } catch {
    return "";
  }
}

/** Source of a visit: utm_source wins (it says what triggered the visit), then the referrer host. */
export function sourceOf(utmSource: unknown, referrer: unknown): string {
  const utm = typeof utmSource === "string" ? utmSource.trim().toLowerCase().slice(0, 100).replace(/[^a-z0-9._-]/g, "") : "";
  const source = utm || referrerHost(referrer);
  return source.includes("docstoc") ? "" : source;
}

/**
 * Kind of network a page view comes from, from Cloudflare's request.cf.asn and asOrganization (as firmenbuchdaten.at,
 * owner 13.11.2026). "dc" = data centre or hosting network (cloud, VPS, scraping proxies), "isp" = any other network,
 * "" = unknown. Only this word is stored, never the ASN. Nothing is filtered by it; it shows how many visitors come from
 * data centres. Cloudflare's own network (WARP, relays, AS13335) counts as "isp": people use it from their devices.
 */
const DATA_CENTRE_ASNS = new Set<number>([
  16509, 14618, 8987, // Amazon AWS
  15169, 396982, 19527, 36492, // Google Cloud
  8075, 8068, 8069, // Microsoft Azure
  14061, // DigitalOcean
  16276, // OVH
  24940, 213230, // Hetzner
  63949, // Akamai Linode
  20473, // Vultr / Choopa
  31898, // Oracle Cloud
  45102, 37963, // Alibaba Cloud
  132203, 45090, // Tencent Cloud
  136907, // Huawei Cloud
  51167, // Contabo
  60781, 28753, 16265, // Leaseweb
  9009, // M247
  212238, 60068, // Datacamp / CDN77
  62240, // Clouvider
  202425, // IP Volume
  9370, // Sakura
  12876, // Scaleway
  197540, // netcup
  8560, // IONOS
  46606, // Unified Layer
  36352, // ColoCrossing
  53667, // FranTech / BuyVM
  40021, // Contabo US / Nubes
  174, // Cogent (transit, mostly servers)
]);

const DATA_CENTRE_NAME =
  /\b(amazon|aws|google cloud|microsoft|azure|digitalocean|ovh|hetzner|linode|akamai|vultr|choopa|oracle|alibaba|tencent|huawei cloud|contabo|leaseweb|m247|datacamp|cdn77|clouvider|scaleway|netcup|ionos|hosting|hostinger|server|colo|datacenter|data center|vps|cloud)\b/i;

export type NetKind = "dc" | "isp" | "";

export function netKind(asn: unknown, organisation: unknown): NetKind {
  const number = typeof asn === "number" ? asn : Number(asn);
  const name = typeof organisation === "string" ? organisation : "";
  if (!Number.isFinite(number) || number <= 0) return name ? (DATA_CENTRE_NAME.test(name) ? "dc" : "isp") : "";
  if (number === 13335) return "isp";
  if (DATA_CENTRE_ASNS.has(number)) return "dc";
  return DATA_CENTRE_NAME.test(name) ? "dc" : "isp";
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 80;

/** Best effort per isolate: one IP gets at most 80 rows in ten minutes. */
const recent = new Map<string, number[]>();

export function tooMany(ip: string, now: number): boolean {
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_IP) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) for (const [key, times] of recent) if (!times.some((t) => now - t < WINDOW_MS)) recent.delete(key);
  return false;
}

/** For tests: forget the in-memory limits. */
export function resetVisitorMemory(): void {
  recent.clear();
}

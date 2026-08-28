/**
 * First-touch marketing attribution, stored in the browser.
 *
 * Answers which post/channel found a customer. Analytics Engine already records a per-pageview
 * `referrer`, but that only describes the *current* navigation — by signup or Upgrade days later,
 * the LinkedIn/X referrer is gone. This persists first touch so signup_completed / checkout_started
 * can still carry it.
 *
 * Written once, never overwritten: we credit the channel that *found* the customer.
 *
 * Direct visits with no UTM and no external referrer record nothing (not "direct"), so a later
 * tagged click can still become first touch. Events from a browser with no stored source report
 * "direct" at read time (see attributionLabel).
 */

const STORAGE_KEY = "docracy_attribution";
const MAX_PART_LENGTH = 32;
const ALLOWED_CHARS = /[^a-z0-9._-]/g;

/** Legacy docstoc tags — drop from first-touch and the address bar. */
export function isBlockedRefSource(source: string): boolean {
  const clean = source.trim().toLowerCase();
  return clean !== "" && clean.startsWith("docstoc");
}

interface StoredAttribution {
  source: string;
  medium: string;
  campaign: string;
  firstSeenAt: string;
}

function sanitize(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(ALLOWED_CHARS, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_PART_LENGTH);
}

function read(): StoredAttribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAttribution>;
    if (!parsed.source) return null;
    return {
      source: parsed.source,
      medium: parsed.medium ?? "",
      campaign: parsed.campaign ?? "",
      firstSeenAt: parsed.firstSeenAt ?? "",
    };
  } catch {
    return null;
  }
}

function write(entry: StoredAttribution): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Storage blocked — this visit just won't be attributable.
  }
}

function referrerHost(): string {
  try {
    if (!document.referrer) return "";
    const host = new URL(document.referrer).hostname;
    if (!host || host === window.location.hostname) return "";
    return sanitize(host.replace(/^www\./, ""));
  } catch {
    return "";
  }
}

/**
 * Records this visit's source if none is stored yet. Call once on app boot.
 * Precedence: utm_source → ref → external referrer host.
 */
export function captureAttribution(): void {
  if (read()) return;

  const params = new URLSearchParams(window.location.search);
  const utmSource = sanitize(params.get("utm_source"));
  const refSource = sanitize(params.get("ref"));
  const source =
    (utmSource && !isBlockedRefSource(utmSource) ? utmSource : "") ||
    (refSource && !isBlockedRefSource(refSource) ? refSource : "") ||
    referrerHost();
  if (!source) return;

  write({
    source,
    medium: sanitize(params.get("utm_medium")),
    campaign: sanitize(params.get("utm_campaign")) || sanitize(params.get("utm_content")),
    firstSeenAt: new Date().toISOString(),
  });
}

/**
 * Seeds first-touch from a short vanity path (/try, /go/ph) before client-side redirect.
 * No-ops if attribution already exists — same first-touch rule as captureAttribution.
 */
export function seedAttribution(source: string, campaign = "", medium = "shortlink"): void {
  if (read()) return;
  const cleanSource = sanitize(source);
  if (!cleanSource) return;
  write({
    source: cleanSource,
    medium: sanitize(medium),
    campaign: sanitize(campaign),
    firstSeenAt: new Date().toISOString(),
  });
}

/** Clears a stored first-touch if it was a blocked legacy tag (e.g. docstoc). */
export function purgeStoredBlockedAttribution(): void {
  const stored = read();
  if (!stored || !isBlockedRefSource(stored.source)) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Removes blocked ref/utm params from the address bar so junk tags don't linger in shared URLs. */
export function stripBlockedAttributionParams(): void {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    let changed = false;
    if (params.has("ref") && isBlockedRefSource(params.get("ref") ?? "")) {
      params.delete("ref");
      changed = true;
    }
    if (params.has("utm_source") && isBlockedRefSource(params.get("utm_source") ?? "")) {
      params.delete("utm_source");
      params.delete("utm_medium");
      params.delete("utm_campaign");
      params.delete("utm_content");
      changed = true;
    }
    if (!changed) return;
    const next = `${url.pathname}${params.toString() ? `?${params}` : ""}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  } catch {
    // Non-fatal — analytics still ignores the blocked tag server-side.
  }
}

/** Compact `source/campaign` label for analytics, e.g. `linkedin/post-01-auto` or `direct`. */
export function attributionLabel(): string {
  const stored = read();
  if (!stored) return "direct";
  return stored.campaign ? `${stored.source}/${stored.campaign}` : stored.source;
}

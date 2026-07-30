import type { Env } from "@docracy/shared";
import { sendSpaSmokeAlert } from "./email";

/** Browser-like UA so Pages/WAF don't treat the probe as a raw bot. */
const PROBE_UA =
  "Mozilla/5.0 (compatible; DocracySpaSmoke/1.0; +https://docracy.io) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";

const ALERT_STATE_KEY = "spa-smoke:alert";
/** Reminder while still down — don't email every hourly tick. */
const REMIND_AFTER_MS = 6 * 60 * 60 * 1000;

export interface SpaSmokeFailure {
  name: string;
  detail: string;
}

interface AlertState {
  failing: boolean;
  lastAlertAt: number;
  fingerprint: string;
}

const CRITICAL_PATHS = ["/", "/login", "/prepare"] as const;

function origin(env: Env): string {
  return (env.PUBLIC_APP_URL || "https://docracy.io").replace(/\/$/, "");
}

function workerOrigin(env: Env): string {
  return (env.PUBLIC_WORKER_URL || "https://api.docracy.io").replace(/\/$/, "");
}

/** Pull the Vite main module from HTML (`<script type="module" src="/assets/....js">`). */
export function extractMainModuleSrc(html: string): string | null {
  const re =
    /<script[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+\.js[^"']*)["'][^>]*>|<script[^>]*\bsrc=["']([^"']+\.js[^"']*)["'][^>]*\btype=["']module["'][^>]*>/i;
  const m = html.match(re);
  return m?.[1] ?? m?.[2] ?? null;
}

export function isJavascriptContentType(ct: string | null): boolean {
  if (!ct) return false;
  const lower = ct.toLowerCase();
  return (
    lower.includes("javascript") ||
    lower.includes("ecmascript") ||
    lower.startsWith("text/js")
  );
}

export function looksLikeHtmlFallback(body: string): boolean {
  const head = body.slice(0, 256).trimStart().toLowerCase();
  return head.startsWith("<!doctype") || head.startsWith("<html") || head.startsWith("<head");
}

function absUrl(base: string, src: string): string {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

async function fetchText(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; contentType: string | null; body: string }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": PROBE_UA,
      Accept: init?.method === "POST" ? "application/json" : "*/*",
      ...(init?.headers ?? {}),
    },
    redirect: "follow",
  });
  const body = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    contentType: res.headers.get("content-type"),
    body,
  };
}

/** Verify one SPA URL hydrates: HTML references a JS module that is actually JavaScript. */
export async function checkSpaPage(pageUrl: string): Promise<SpaSmokeFailure | null> {
  let page;
  try {
    page = await fetchText(pageUrl);
  } catch (err) {
    return { name: pageUrl, detail: `fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!page.ok) {
    return { name: pageUrl, detail: `HTTP ${page.status}` };
  }
  if (!page.contentType?.toLowerCase().includes("text/html")) {
    return { name: pageUrl, detail: `expected text/html, got ${page.contentType ?? "(none)"}` };
  }

  const src = extractMainModuleSrc(page.body);
  if (!src) {
    return { name: pageUrl, detail: "no <script type=module src=*.js> in HTML" };
  }

  const assetUrl = absUrl(pageUrl, src);
  let asset;
  try {
    asset = await fetchText(assetUrl);
  } catch (err) {
    return {
      name: `${pageUrl} → ${src}`,
      detail: `asset fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  if (!asset.ok) {
    return { name: `${pageUrl} → ${src}`, detail: `asset HTTP ${asset.status}` };
  }
  if (!isJavascriptContentType(asset.contentType)) {
    return {
      name: `${pageUrl} → ${src}`,
      detail: `asset Content-Type is ${asset.contentType ?? "(none)"} (expected javascript) — likely SPA HTML fallback`,
    };
  }
  if (looksLikeHtmlFallback(asset.body)) {
    return {
      name: `${pageUrl} → ${src}`,
      detail: "asset body looks like HTML (SPA fallback) instead of JavaScript",
    };
  }
  return null;
}

async function checkAuthApiShape(env: Env): Promise<SpaSmokeFailure | null> {
  const url = `${workerOrigin(env)}/api/auth/request-link`;
  try {
    // Invalid body → 400 JSON without sending a magic link (no email spam).
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": PROBE_UA,
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: origin(env),
      },
      body: JSON.stringify({}),
    });
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.toLowerCase().includes("application/json")) {
      return { name: "API auth/request-link", detail: `expected JSON, got ${ct || "(none)"} (HTTP ${res.status})` };
    }
    // 400 is the healthy "validation failed" shape; 5xx is broken.
    if (res.status >= 500) {
      return { name: "API auth/request-link", detail: `HTTP ${res.status}` };
    }
    return null;
  } catch (err) {
    return {
      name: "API auth/request-link",
      detail: `fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function runSpaSmokeChecks(env: Env): Promise<SpaSmokeFailure[]> {
  const base = origin(env);
  const pageResults = await Promise.all(CRITICAL_PATHS.map((p) => checkSpaPage(`${base}${p}`)));
  const failures = pageResults.filter((f): f is SpaSmokeFailure => f !== null);
  const apiFail = await checkAuthApiShape(env);
  if (apiFail) failures.push(apiFail);
  return failures;
}

function fingerprint(failures: SpaSmokeFailure[]): string {
  return failures
    .map((f) => `${f.name}|${f.detail}`)
    .sort()
    .join("\n");
}

async function readState(env: Env): Promise<AlertState | null> {
  const raw = await env.DOCRACY_KV.get(ALERT_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AlertState;
  } catch {
    return null;
  }
}

async function writeState(env: Env, state: AlertState | null): Promise<void> {
  if (!state) {
    await env.DOCRACY_KV.delete(ALERT_STATE_KEY);
    return;
  }
  await env.DOCRACY_KV.put(ALERT_STATE_KEY, JSON.stringify(state), {
    expirationTtl: 30 * 24 * 60 * 60,
  });
}

/**
 * Hourly SPA smoke: Sign in (/login) + Start free (/prepare) must hydrate.
 * Alerts FEEDBACK_EMAIL (founder@docracy.io) on transition to failing, then every 6h while down.
 */
export async function runSpaSmokeAndAlert(env: Env): Promise<void> {
  const failures = await runSpaSmokeChecks(env);
  const prev = await readState(env);
  const now = Date.now();

  if (failures.length === 0) {
    if (prev?.failing) {
      console.log("[spa-smoke] recovered after previous failure");
    }
    await writeState(env, null);
    return;
  }

  const fp = fingerprint(failures);
  const shouldAlert =
    !prev?.failing ||
    prev.fingerprint !== fp ||
    now - (prev.lastAlertAt ?? 0) >= REMIND_AFTER_MS;

  if (shouldAlert) {
    const to = env.FEEDBACK_EMAIL || "founder@docracy.io";
    await sendSpaSmokeAlert(env, to, failures);
    await writeState(env, { failing: true, lastAlertAt: now, fingerprint: fp });
    console.error(`[spa-smoke] alerted ${to}: ${failures.map((f) => f.name).join(", ")}`);
  } else {
    console.error(`[spa-smoke] still failing (suppressed): ${failures.map((f) => f.name).join(", ")}`);
  }
}

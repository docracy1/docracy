import type { Env } from "@docracy/shared";

const ACCESS_TOKEN_KV_KEY = "transak:accessToken";
// Refresh a bit before Transak's own 7-day expiry, not exactly at it — avoids a request landing
// right on the boundary and getting a token that's valid for the exchange but expires mid-flight.
const REFRESH_SKEW_MS = 60 * 60 * 1000;

/** Host for the refresh-token (access token exchange) call — confirmed by a direct manual test
 *  against production ("https://api.transak.com/partners/api/v2/refresh-token" returns a real
 *  token with production credentials). */
function authBaseUrl(env: Env): string {
  const isStaging = (env.TRANSAK_ENVIRONMENT ?? "STAGING") !== "PRODUCTION";
  return isStaging ? "https://api-stg.transak.com" : "https://api.transak.com";
}

/** Host for the Create Widget URL (session) call — a DIFFERENT subdomain from authBaseUrl above,
 *  confirmed against Transak's own API reference: "api-gateway-stg.transak.com" (staging) /
 *  "api-gateway.transak.com" (production). Mixing this up with authBaseUrl was the actual cause
 *  of an earlier "Authorization Required" 401 even with a valid access token. */
function widgetSessionBaseUrl(env: Env): string {
  const isStaging = (env.TRANSAK_ENVIRONMENT ?? "STAGING") !== "PRODUCTION";
  return isStaging ? "https://api-gateway-stg.transak.com" : "https://api-gateway.transak.com";
}

interface CachedAccessToken {
  accessToken: string;
  expiresAt: number;
}

/** Exchanges TRANSAK_API_SECRET for a short-lived (7-day) Partner Access Token — Transak's docs
 *  explicitly warn against calling this on every request ("can cause unnecessary token
 *  regeneration and potential rate-limiting issues"), so the result is cached in KV and only
 *  refreshed once it's actually close to expiring. */
async function refreshAccessToken(env: Env): Promise<CachedAccessToken | null> {
  const res = await fetch(`${authBaseUrl(env)}/partners/api/v2/refresh-token`, {
    method: "POST",
    headers: {
      "x-api-key": env.TRANSAK_API_KEY!,
      "api-secret": env.TRANSAK_API_SECRET!,
      "content-type": "application/json",
    },
    body: JSON.stringify({ apiKey: env.TRANSAK_API_KEY }),
  });
  if (!res.ok) {
    console.error(`Transak access-token refresh failed (${res.status}): ${await res.text()}`);
    return null;
  }
  const data = (await res.json()) as { data?: { accessToken?: string; expiresAt?: number } };
  const accessToken = data.data?.accessToken;
  const expiresAt = data.data?.expiresAt;
  if (!accessToken || !expiresAt) return null;
  // Transak's expiresAt is a Unix timestamp in seconds.
  return { accessToken, expiresAt: expiresAt * 1000 };
}

async function getAccessToken(env: Env): Promise<string | null> {
  const cached = await env.DOCRACY_KV.get<CachedAccessToken>(ACCESS_TOKEN_KV_KEY, "json");
  if (cached && cached.expiresAt - REFRESH_SKEW_MS > Date.now()) return cached.accessToken;

  const fresh = await refreshAccessToken(env);
  if (!fresh) return null;
  const ttlSeconds = Math.max(60, Math.floor((fresh.expiresAt - Date.now()) / 1000));
  await env.DOCRACY_KV.put(ACCESS_TOKEN_KV_KEY, JSON.stringify(fresh), { expirationTtl: ttlSeconds });
  return fresh.accessToken;
}

/** Widget session URLs are single-use and expire in 5 minutes (Transak's own limit) — so this is
 *  called fresh every time a user opens the "convert your money" widget, never cached (unlike the
 *  access token above, which is deliberately reused across many session calls).
 *
 *  Verified against Transak's own API reference: this call needs `x-api-key` AND `access-token`
 *  (not just the latter — an earlier version omitted x-api-key and got a 401 "Authorization
 *  Required" even with a valid token), plus `x-user-ip` — the end user's own IP, not the
 *  worker's. Docracy never logs or stores this beyond forwarding it in this one request. */
export async function createWidgetSessionUrl(
  env: Env,
  params: { fiatCurrency?: string; email?: string; userIp: string }
): Promise<{ widgetUrl: string } | { error: string }> {
  if (!env.TRANSAK_API_KEY || !env.TRANSAK_API_SECRET) {
    // Deliberately not logging the values themselves — just which one(s) are missing/empty, so a
    // secret that got set to an empty string (distinct from never being set at all) is easy to
    // spot in `wrangler tail` instead of looking identical to "not configured yet".
    console.error(
      `Transak not configured: TRANSAK_API_KEY ${env.TRANSAK_API_KEY ? "present" : "missing/empty"}, ` +
        `TRANSAK_API_SECRET ${env.TRANSAK_API_SECRET ? "present" : "missing/empty"}`
    );
    return { error: "not_configured" };
  }
  const isStaging = (env.TRANSAK_ENVIRONMENT ?? "STAGING") !== "PRODUCTION";
  const widgetBase = isStaging ? "https://global-stg.transak.com" : "https://global.transak.com";

  const accessToken = await getAccessToken(env);
  if (!accessToken) return { error: "request_failed" };

  const res = await fetch(`${widgetSessionBaseUrl(env)}/api/v2/auth/session`, {
    method: "POST",
    headers: {
      "access-token": accessToken,
      "x-api-key": env.TRANSAK_API_KEY,
      "x-user-ip": params.userIp,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      widgetParams: {
        apiKey: env.TRANSAK_API_KEY,
        referrerDomain: new URL(env.PUBLIC_APP_URL).hostname,
        // Left unset, Transak's widget defaults to BUY only — explicit here so "convert your
        // money" actually covers both directions (buy crypto with fiat, sell crypto back to
        // fiat), matching what the page copy promises.
        productsAvailed: ["BUY", "SELL"],
        ...(params.fiatCurrency ? { fiatCurrency: params.fiatCurrency } : {}),
        ...(params.email ? { email: params.email } : {}),
      },
    }),
  });

  if (!res.ok) {
    console.error(`Transak widget session creation failed (${res.status}): ${await res.text()}`);
    return { error: "request_failed" };
  }
  const data = (await res.json()) as { data?: { sessionId?: string } };
  const sessionId = data.data?.sessionId;
  if (!sessionId) return { error: "request_failed" };
  return { widgetUrl: `${widgetBase}?apiKey=${env.TRANSAK_API_KEY}&sessionId=${sessionId}` };
}

import type { Env } from "@docracy/shared";

const ACCESS_TOKEN_KV_KEY = "transak:accessToken";
// Refresh a bit before Transak's own 7-day expiry, not exactly at it — avoids a request landing
// right on the boundary and getting a token that's valid for the exchange but expires mid-flight.
const REFRESH_SKEW_MS = 60 * 60 * 1000;

function authBaseUrl(env: Env): string {
  const isStaging = (env.TRANSAK_ENVIRONMENT ?? "STAGING") !== "PRODUCTION";
  // Production host inferred from the "-stg" naming convention used elsewhere in Transak's API
  // (same pattern as the widget host below) — not directly confirmed in their docs. Worth a
  // one-time check against a real PRODUCTION run before relying on it.
  return isStaging ? "https://api-stg.transak.com" : "https://api.transak.com";
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
 *  NOT YET VERIFIED against a real PRODUCTION run (only staging docs were reachable while
 *  building this): the production host names (both here and in refreshAccessToken above) are
 *  inferred from the "-stg" naming convention, not directly confirmed. Confirm on first real
 *  production test before relying on it beyond staging. */
export async function createWidgetSessionUrl(
  env: Env,
  params: { fiatCurrency?: string; email?: string }
): Promise<{ widgetUrl: string } | { error: string }> {
  if (!env.TRANSAK_API_KEY || !env.TRANSAK_API_SECRET) return { error: "not_configured" };
  const isStaging = (env.TRANSAK_ENVIRONMENT ?? "STAGING") !== "PRODUCTION";
  const widgetBase = isStaging ? "https://global-stg.transak.com" : "https://global.transak.com";

  const accessToken = await getAccessToken(env);
  if (!accessToken) return { error: "request_failed" };

  const res = await fetch(`${authBaseUrl(env)}/api/v2/auth/session`, {
    method: "POST",
    headers: {
      "access-token": accessToken,
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

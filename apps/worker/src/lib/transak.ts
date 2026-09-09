import type { Env } from "@docracy/shared";

/** Widget session URLs are single-use and expire in 5 minutes (Transak's own limit) — so this is
 *  called fresh every time a user opens the "convert your money" widget, never cached.
 *
 *  NOT YET VERIFIED against Transak's own account docs (only public marketing/docs pages were
 *  reachable while building this): the staging widget host (`global-stg.transak.com`, inferred
 *  from the "-stg" pattern on the auth API host) and the exact session-response field name.
 *  Confirm both against the Partner Dashboard's own docs/Postman collection once real credentials
 *  are in hand, before relying on this in anything but a manual smoke test. */
export async function createWidgetSessionUrl(
  env: Env,
  params: { fiatCurrency?: string; email?: string }
): Promise<{ widgetUrl: string } | { error: string }> {
  if (!env.TRANSAK_API_KEY || !env.TRANSAK_ACCESS_TOKEN) return { error: "not_configured" };
  const isStaging = (env.TRANSAK_ENVIRONMENT ?? "STAGING") !== "PRODUCTION";
  const authBase = isStaging ? "https://api-gateway-stg.transak.com" : "https://api-gateway.transak.com";
  const widgetBase = isStaging ? "https://global-stg.transak.com" : "https://global.transak.com";

  const res = await fetch(`${authBase}/api/v2/auth/session`, {
    method: "POST",
    headers: {
      "access-token": env.TRANSAK_ACCESS_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      widgetParams: {
        apiKey: env.TRANSAK_API_KEY,
        referrerDomain: new URL(env.PUBLIC_APP_URL).hostname,
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

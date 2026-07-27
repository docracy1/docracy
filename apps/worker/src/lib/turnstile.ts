import type { Env } from "@docracy/shared";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Verifies a Cloudflare Turnstile token from the login form (see routes/auth.ts's
 *  POST /request-link). Returns true — skipping verification entirely — when
 *  TURNSTILE_SECRET_KEY isn't configured yet, the same graceful-degradation pattern every other
 *  optional secret in this codebase follows; this only starts enforcing once a widget has been
 *  created and both the secret and the frontend's public site key are wired up together. */
export async function verifyTurnstile(env: Env, token: string | undefined, ip: string | null): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch(SITEVERIFY_URL, { method: "POST", body });
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Cloudflare's own verification endpoint being unreachable shouldn't itself be treated as a
    // pass — fail closed, same as an explicit `success: false`.
    return false;
  }
}

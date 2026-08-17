import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import {
  adminLogin,
  requestMagicLink,
  consumeMagicLink,
  isAdminEmail,
  optionalAccount,
  resolveAccount,
  revokeSession,
  getGoogleLoginAuthorizeUrl,
  handleGoogleLoginCallback,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  type AccountContext,
} from "../lib/auth";
import { trackEvent, NOTRACK_COOKIE_NAME, noTrackCookieOptions, sanitizeAttribution } from "../lib/analytics";
import { peekWhatsappQuotaRemaining } from "../lib/whatsappQuota";
import type { Env, Locale } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Variables = { account: AccountContext | null };
const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

auth.post("/request-link", async (c) => {
  let body: { email?: string; turnstileToken?: string; attribution?: string; next?: string; locale?: Locale };
  try {
    body = await c.req.json<{ email?: string; turnstileToken?: string; attribution?: string; next?: string; locale?: Locale }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const email = body.email?.trim() ?? "";
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const locale = body.locale === "es" ? "es" : undefined;
  const result = await requestMagicLink(c.env, c.executionCtx, email, ip, body.turnstileToken, body.next, locale);
  if (!result.ok) return c.json({ error: result.error }, 400);
  // Fired for every request, new account or returning login alike — there's no way to know which
  // without a D1 lookup this route doesn't otherwise need, and a broad "auth flow started" signal
  // is still useful for the Activation funnel even with that overlap. Skip for ADMIN_EMAILS so
  // founder QA never lands in the Activation funnel.
  if (!isAdminEmail(c.env, email)) {
    trackEvent(c.env, {
      event: "signup_started",
      route: "auth",
      userAgent: c.req.header("user-agent"),
      country: c.req.header("CF-IPCountry"),
      attribution: sanitizeAttribution(body.attribution),
    });
  }
  return c.json({ ok: true });
});

auth.post("/consume", async (c) => {
  let body: { token?: string; attribution?: string };
  try {
    body = await c.req.json<{ token?: string; attribution?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const token = body.token?.trim() ?? "";
  if (!token) return c.json({ error: "Missing token" }, 400);

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const userAgent = c.req.header("User-Agent") ?? null;
  const result = await consumeMagicLink(
    c.env,
    c.executionCtx,
    token,
    ip,
    userAgent,
    sanitizeAttribution(body.attribution)
  );
  if (!result.ok) return c.json({ error: result.error }, 400);

  setCookie(c, SESSION_COOKIE_NAME, result.sessionToken, {
    ...sessionCookieOptions(c.env),
    maxAge: SESSION_TTL_SECONDS,
  });
  // Founders on ADMIN_EMAILS always get the notrack cookie so QA visits never inflate funnels.
  const account = await resolveAccount(c.env, result.sessionToken);
  if (account && isAdminEmail(c.env, account.email)) {
    setCookie(c, NOTRACK_COOKIE_NAME, "1", noTrackCookieOptions(c.env));
  }
  return c.json({ ok: true, ...(result.next ? { next: result.next } : {}) });
});

auth.post("/admin-login", async (c) => {
  let body: { email?: string; password?: string };
  try {
    body = await c.req.json<{ email?: string; password?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!EMAIL_RE.test(email) || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const userAgent = c.req.header("User-Agent") ?? null;
  const result = await adminLogin(c.env, c.executionCtx, email, password, ip, userAgent);
  if (!result.ok) return c.json({ error: result.error }, 401);

  setCookie(c, SESSION_COOKIE_NAME, result.sessionToken, {
    ...sessionCookieOptions(c.env),
    maxAge: SESSION_TTL_SECONDS,
  });
  setCookie(c, NOTRACK_COOKIE_NAME, "1", noTrackCookieOptions(c.env));
  return c.json({ ok: true });
});

auth.post("/logout", async (c) => {
  await revokeSession(c.env, getCookie(c, SESSION_COOKIE_NAME));
  deleteCookie(c, SESSION_COOKIE_NAME, sessionCookieOptions(c.env));
  return c.json({ ok: true });
});

/** Full-page redirect into Google OAuth. Callback must stay on PUBLIC_APP_URL (/api proxy) so the
 *  session cookie is first-party on the Pages host. */
auth.get("/google", async (c) => {
  const next = c.req.query("next") ?? undefined;
  const result = await getGoogleLoginAuthorizeUrl(c.env, next);
  if (!result.ok) {
    return c.redirect(`${c.env.PUBLIC_APP_URL}/login?error=${encodeURIComponent(result.error)}`);
  }
  return c.redirect(result.url);
});

auth.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const oauthError = c.req.query("error");
  if (oauthError || !code || !state) {
    const msg = oauthError === "access_denied" ? "Google sign-in was cancelled." : "Google sign-in failed.";
    return c.redirect(`${c.env.PUBLIC_APP_URL}/login?error=${encodeURIComponent(msg)}`);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const userAgent = c.req.header("User-Agent") ?? null;
  const result = await handleGoogleLoginCallback(c.env, c.executionCtx, code, state, ip, userAgent);
  if (!result.ok) {
    return c.redirect(`${c.env.PUBLIC_APP_URL}/login?error=${encodeURIComponent(result.error)}`);
  }

  setCookie(c, SESSION_COOKIE_NAME, result.sessionToken, {
    ...sessionCookieOptions(c.env),
    maxAge: SESSION_TTL_SECONDS,
  });
  if (isAdminEmail(c.env, result.email)) {
    setCookie(c, NOTRACK_COOKIE_NAME, "1", noTrackCookieOptions(c.env));
  }

  const dest = result.next || "/dashboard";
  return c.redirect(`${c.env.PUBLIC_APP_URL}${dest.startsWith("/") ? dest : "/dashboard"}`);
});

auth.get("/me", optionalAccount, async (c) => {
  const account = c.get("account");
  const isAdmin = !!account && isAdminEmail(c.env, account.email);
  // Keep the founder notrack cookie fresh on every /me so Pages middleware pageviews (which only
  // see the cookie, not the session alone when forwarded) stay opted out.
  if (isAdmin) {
    setCookie(c, NOTRACK_COOKIE_NAME, "1", noTrackCookieOptions(c.env));
  }

  // marketing_opt_in isn't part of the cached session record (SessionRecord/AccountContext) —
  // it's a low-stakes UI preference, not an authorization decision, so it's simplest to just read
  // it fresh from D1 on every /me rather than threading it through the session cache/refresh path.
  let marketingOptIn = false;
  if (account && c.env.DOCRACY_DB) {
    const row = await c.env.DOCRACY_DB.prepare(`SELECT marketing_opt_in FROM accounts WHERE id = ?`)
      .bind(account.id)
      .first<{ marketing_opt_in: number }>();
    marketingOptIn = !!row?.marketing_opt_in;
  }

  // Every tier now has a real cap — 1/month free, 10/month paid, 50/month enterprise fair-use —
  // so all three need the "X left this month" nudge on Prepare. Same low-stakes fresh-D1-read
  // posture as marketingOptIn above, not part of the cached session record.
  const whatsappQuotaRemaining = account
    ? await peekWhatsappQuotaRemaining(c.env, account.workspaceId, account.isPaid, account.isEnterprise)
    : undefined;

  return c.json({
    account: account ? { ...account, marketingOptIn, ...(whatsappQuotaRemaining !== undefined ? { whatsappQuotaRemaining } : {}) } : null,
    isAdmin,
  });
});

export default auth;

import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import {
  adminLogin,
  requestMagicLink,
  consumeMagicLink,
  isAdminEmail,
  optionalAccount,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  type AccountContext,
} from "../lib/auth";
import type { Env } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Variables = { account: AccountContext | null };
const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

auth.post("/request-link", async (c) => {
  let body: { email?: string };
  try {
    body = await c.req.json<{ email?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const email = body.email?.trim() ?? "";
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const result = await requestMagicLink(c.env, c.executionCtx, email, ip);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true });
});

auth.post("/consume", async (c) => {
  let body: { token?: string };
  try {
    body = await c.req.json<{ token?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const token = body.token?.trim() ?? "";
  if (!token) return c.json({ error: "Missing token" }, 400);

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const userAgent = c.req.header("User-Agent") ?? null;
  const result = await consumeMagicLink(c.env, c.executionCtx, token, ip, userAgent);
  if (!result.ok) return c.json({ error: result.error }, 400);

  setCookie(c, SESSION_COOKIE_NAME, result.sessionToken, {
    ...sessionCookieOptions(c.env),
    maxAge: SESSION_TTL_SECONDS,
  });
  return c.json({ ok: true });
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
  return c.json({ ok: true });
});

auth.post("/logout", async (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});

auth.get("/me", optionalAccount, async (c) => {
  const account = c.get("account");
  const isAdmin = !!account && isAdminEmail(c.env, account.email);
  return c.json({ account, isAdmin });
});

export default auth;

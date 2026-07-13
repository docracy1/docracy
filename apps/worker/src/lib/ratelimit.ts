import type { Env } from "@docracy/shared";

const WINDOW_SECONDS = 60 * 60; // 1 hour
const MAX_PER_WINDOW = 10;

/**
 * Soft, non-atomic counter — a burst of concurrent requests could slip a couple over the cap.
 * Fine here: every caller below is a cost/abuse throttle, not a hard security boundary.
 */
async function checkLimit(env: Env, key: string, max: number, windowSeconds: number): Promise<boolean> {
  const rlKey = `ratelimit:${key}`;
  const current = await env.DOCRACY_KV.get(rlKey);
  const count = current ? Number(current) : 0;
  if (count >= max) return false;
  await env.DOCRACY_KV.put(rlKey, String(count + 1), { expirationTtl: windowSeconds });
  return true;
}

/**
 * Soft per-IP limit on document creation. Keeps a single script from running the free tier's
 * storage costs up, since there's no signup to gate it.
 */
export async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  return checkLimit(env, `ip:${ip}`, MAX_PER_WINDOW, WINDOW_SECONDS);
}

const INVITE_WINDOW_SECONDS = 60 * 60; // 1 hour
const INVITE_MAX_PER_WINDOW = 5;

/**
 * Per-recipient-email cap on signing invites, independent of the creator's IP. Without this, one
 * IP can fan invites out across many separate documents naming the same victim address — the
 * per-IP creation limit above doesn't stop that, since each document is a fresh "creation".
 */
export async function checkInviteRateLimit(env: Env, email: string): Promise<boolean> {
  return checkLimit(env, `invite:${email.toLowerCase()}`, INVITE_MAX_PER_WINDOW, INVITE_WINDOW_SECONDS);
}

const TOKEN_ACCESS_WINDOW_SECONDS = 60;
const TOKEN_ACCESS_MAX_PER_WINDOW = 30;

/**
 * Per-token soft limit on sign/status link reads. A signing link has no account behind it, so if
 * one leaks (forwarded email, screenshot, shared device, a stray log line) this stops it from
 * being hammered for unbounded R2 egress / bandwidth cost.
 */
export async function checkTokenAccessRateLimit(env: Env, token: string): Promise<boolean> {
  return checkLimit(env, `token:${token}`, TOKEN_ACCESS_MAX_PER_WINDOW, TOKEN_ACCESS_WINDOW_SECONDS);
}

const FEEDBACK_WINDOW_SECONDS = 60 * 60; // 1 hour
const FEEDBACK_MAX_PER_WINDOW = 5;

/** Soft per-IP limit on the feedback form, so it can't be used to mail-bomb FEEDBACK_EMAIL. */
export async function checkFeedbackRateLimit(env: Env, ip: string): Promise<boolean> {
  return checkLimit(env, `feedback:${ip}`, FEEDBACK_MAX_PER_WINDOW, FEEDBACK_WINDOW_SECONDS);
}

const MAGIC_LINK_WINDOW_SECONDS = 60 * 60; // 1 hour
const MAGIC_LINK_MAX_PER_WINDOW = 5;

/** Per-recipient-email cap on magic-link requests, so the login form can't be used to mail-bomb
 *  an arbitrary address (same rationale as checkInviteRateLimit). */
export async function checkMagicLinkRateLimit(env: Env, email: string): Promise<boolean> {
  return checkLimit(env, `magiclink:${email.toLowerCase()}`, MAGIC_LINK_MAX_PER_WINDOW, MAGIC_LINK_WINDOW_SECONDS);
}

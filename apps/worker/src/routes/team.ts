import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import {
  requirePaidAccount,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  type AccountContext,
} from "../lib/auth";
import {
  acceptTeamInvite,
  cancelTeamInvite,
  inviteTeamMember,
  listPendingInvites,
  listTeamMembers,
  removeTeamMember,
} from "../lib/team";
import { checkTeamInviteRateLimit } from "../lib/ratelimit";
import type { Env } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Variables = { account: AccountContext | null };
const team = new Hono<{ Bindings: Env; Variables: Variables }>();

team.post("/invite", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  // Single-level workspaces only — a team member can't invite further on the owner's behalf.
  if (account.id !== account.workspaceId) {
    return c.json({ error: "Only the workspace owner can invite teammates." }, 403);
  }

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
  if (!(await checkTeamInviteRateLimit(c.env, email))) {
    return c.json({ error: "Too many invites sent to that address recently. Please try again later." }, 429);
  }

  const result = await inviteTeamMember(c.env, account.id, account.email, email);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true });
});

team.get("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ members: [], pendingInvites: [] });
  }
  const account = c.get("account")!;
  const [members, pendingInvites] = await Promise.all([
    listTeamMembers(c.env, account.workspaceId),
    account.id === account.workspaceId ? listPendingInvites(c.env, account.workspaceId) : Promise.resolve([]),
  ]);
  return c.json({ members, pendingInvites });
});

team.delete("/invites/:id", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  if (account.id !== account.workspaceId) {
    return c.json({ error: "Only the workspace owner can manage invites." }, 403);
  }
  const cancelled = await cancelTeamInvite(c.env, account.id, c.req.param("id"));
  if (!cancelled) return c.json({ error: "Invite not found" }, 404);
  return c.json({ ok: true });
});

team.delete("/:memberAccountId", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  if (account.id !== account.workspaceId) {
    return c.json({ error: "Only the workspace owner can remove teammates." }, 403);
  }
  const memberAccountId = c.req.param("memberAccountId");
  if (memberAccountId === account.id) {
    return c.json({ error: "You can't remove yourself as the workspace owner." }, 400);
  }
  const removed = await removeTeamMember(c.env, account.id, memberAccountId);
  if (!removed) return c.json({ error: "Team member not found" }, 404);
  return c.json({ ok: true });
});

// Not behind requireAccount — accepting an invite is how a brand-new (or currently signed-out)
// person joins, so there's no session to require yet.
team.post("/accept", async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
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
  const result = await acceptTeamInvite(c.env, c.executionCtx, token, ip, userAgent);
  if (!result.ok) return c.json({ error: result.error }, 400);

  setCookie(c, SESSION_COOKIE_NAME, result.sessionToken, {
    ...sessionCookieOptions(c.env),
    maxAge: SESSION_TTL_SECONDS,
  });
  return c.json({ ok: true });
});

export default team;

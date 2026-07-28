import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { requireApiTokenAccount, type ApiTokenAccount } from "../lib/apiTokenAuth";
import { issueEmbedSession, resolveEmbedSession } from "../lib/embedSessions";
import { checkTokenAccessRateLimit } from "../lib/ratelimit";
import type { Env } from "@docracy/shared";

type SessionVars = { account: AccountContext | null };
type ApiVars = { apiAccount: ApiTokenAccount };

const embed = new Hono<{ Bindings: Env }>();

async function createSession(
  c: { env: Env; json: (body: unknown, status?: number) => Response },
  workspaceId: string,
  body: {
    docId?: string;
    signerOrder?: number;
    allowedOrigins?: string[];
    returnUrl?: string;
    ttlSeconds?: number;
  }
) {
  if (!body.docId) return c.json({ error: "Missing docId" }, 400);
  if (!Number.isInteger(body.signerOrder) || (body.signerOrder as number) < 1) {
    return c.json({ error: "signerOrder must be a positive integer" }, 400);
  }
  const result = await issueEmbedSession({
    env: c.env,
    accountId: workspaceId,
    docId: body.docId,
    signerOrder: body.signerOrder as number,
    allowedOrigins: body.allowedOrigins ?? [],
    returnUrl: body.returnUrl,
    ttlSeconds: body.ttlSeconds,
  });
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

/** Dashboard / cookie session — paid accounts only. */
const sessionEmbed = new Hono<{ Bindings: Env; Variables: SessionVars }>();
sessionEmbed.post("/sessions", requirePaidAccount, async (c) => {
  const account = c.get("account")!;
  let body: {
    docId?: string;
    signerOrder?: number;
    allowedOrigins?: string[];
    returnUrl?: string;
    ttlSeconds?: number;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  return createSession(c, account.workspaceId, body);
});

/** Programmatic — API token (Zapier / partner integrations). */
const apiEmbed = new Hono<{ Bindings: Env; Variables: ApiVars }>();
apiEmbed.use("*", requireApiTokenAccount);
apiEmbed.post("/sessions", async (c) => {
  const account = c.get("apiAccount");
  let body: {
    docId?: string;
    signerOrder?: number;
    allowedOrigins?: string[];
    returnUrl?: string;
    ttlSeconds?: number;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  return createSession(c, account.workspaceId, body);
});

/** Public resolve for the embed page — rate-limited; returns a short-use signing token. */
embed.get("/sessions/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }
  const resolved = await resolveEmbedSession(c.env, token);
  if (!resolved) return c.json({ error: "Embed session expired or invalid" }, 404);
  return c.json(resolved);
});

embed.route("/", sessionEmbed);
embed.route("/api-token", apiEmbed);

export default embed;

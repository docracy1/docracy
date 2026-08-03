import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { requireAdminAccount, type AccountContext } from "../lib/auth";
import { castRoadmapVote, createRoadmapFeature, deleteRoadmapFeature, listRoadmapFeatures } from "../lib/roadmap";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

const VOTER_COOKIE_NAME = "docracy_roadmap_voter";
const VOTER_COOKIE_MAX_AGE_SECONDS = 5 * 365 * 24 * 60 * 60;

/** Server-only anonymous voter id — same idea as the docracy_notrack opt-out cookie, but
 *  httpOnly since nothing client-side ever needs to read its value, only send it back. */
function voterCookieOptions(env: Env) {
  const isHttps = env.PUBLIC_APP_URL.startsWith("https");
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? "None" : "Lax") as "None" | "Lax",
    path: "/",
    maxAge: VOTER_COOKIE_MAX_AGE_SECONDS,
  };
}

function getOrCreateVoterId(c: AppContext): string {
  const existing = getCookie(c, VOTER_COOKIE_NAME);
  if (existing) return existing;
  const id = crypto.randomUUID();
  setCookie(c, VOTER_COOKIE_NAME, id, voterCookieOptions(c.env));
  return id;
}

// Public — anyone browsing /roadmap, no auth. Mounted at /api/roadmap.
export const roadmapPublic = new Hono<{ Bindings: Env; Variables: Variables }>();

roadmapPublic.get("/", async (c) => {
  const voterId = getCookie(c, VOTER_COOKIE_NAME) ?? null;
  const features = await listRoadmapFeatures(c.env, voterId);
  return c.json({ features });
});

interface VoteBody {
  vote?: string;
}

roadmapPublic.post("/:id/vote", async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  let body: VoteBody;
  try {
    body = await c.req.json<VoteBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (body.vote !== "yes" && body.vote !== "no") {
    return c.json({ error: "vote must be \"yes\" or \"no\"" }, 400);
  }
  const voterId = getOrCreateVoterId(c);
  const result = await castRoadmapVote(c.env, c.req.param("id"), voterId, body.vote);
  if (!result.ok) return c.json({ error: result.error }, 404);
  return c.json({ ok: true });
});

// Admin CRUD — mounted at /api/admin/roadmap, gated by requireAdminAccount.
export const roadmapAdmin = new Hono<{ Bindings: Env; Variables: Variables }>();

roadmapAdmin.get("/", requireAdminAccount, async (c) => {
  const features = await listRoadmapFeatures(c.env);
  return c.json({ features });
});

interface CreateBody {
  title?: string;
  description?: string;
}

roadmapAdmin.post("/", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  let body: CreateBody;
  try {
    body = await c.req.json<CreateBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const result = await createRoadmapFeature(c.env, body.title ?? "", body.description ?? "");
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true, id: result.id });
});

roadmapAdmin.delete("/:id", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  await deleteRoadmapFeature(c.env, c.req.param("id"));
  return c.json({ ok: true });
});

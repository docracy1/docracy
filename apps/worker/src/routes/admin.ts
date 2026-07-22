import { Hono } from "hono";
import { queryFunnelSummary } from "../lib/analyticsQuery";
import { requireAdminAccount, type AccountContext } from "../lib/auth";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

admin.get("/analytics", requireAdminAccount, async (c) => {
  const days = Math.min(90, Math.max(1, Number(c.req.query("days")) || 30));
  const rows = await queryFunnelSummary(c.env, days);
  if (rows === null) {
    return c.json(
      {
        error:
          "Analytics Engine's read API isn't configured yet — set CF_ANALYTICS_API_TOKEN " +
          "(a Cloudflare API token scoped to Account Analytics:Read) via `wrangler secret put`.",
      },
      501
    );
  }
  return c.json({ days, rows });
});

export default admin;

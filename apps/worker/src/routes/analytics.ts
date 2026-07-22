import { Hono } from "hono";
import { logFunnelEvent } from "../lib/analytics";
import type { Env } from "@docracy/shared";

// Only the routes this funnel actually cares about (public marketing pages) — an allow-list, not
// a denylist, so a junk/typo'd route from a stray client never becomes a phantom row in the data.
const TRACKED_ROUTES = new Set([
  "/",
  "/free-templates",
  "/mcp",
  "/free-templates/mutual-nda",
  "/free-templates/independent-contractor-agreement",
  "/free-templates/offer-letter",
  "/free-templates/remote-work-policy",
  "/free-templates/freelance-service-agreement",
  "/free-templates/unilateral-nda",
  "/free-templates/simple-commercial-lease-agreement",
  "/free-templates/non-compete-non-solicitation-agreement",
  "/free-templates/consulting-agreement",
  "/free-templates/vendor-agreement",
  "/free-templates/separation-agreement",
  "/free-templates/equipment-rental-agreement",
  "/free-templates/partnership-agreement",
  "/free-templates/sales-agreement",
  "/free-templates/referral-agreement",
]);

const analytics = new Hono<{ Bindings: Env }>();

// Called by apps/web/functions/_middleware.ts on every request to a tracked route, server-side —
// deliberately not a client-side JS beacon, since most AI crawlers this is meant to measure never
// execute JavaScript and would otherwise never be counted at all.
analytics.post("/pageview", async (c) => {
  let body: { route?: string };
  try {
    body = await c.req.json<{ route?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const route = body.route ?? "";
  if (!TRACKED_ROUTES.has(route)) return c.json({ error: "Unknown route" }, 400);

  logFunnelEvent(c.env, "page_view", route, c.req.header("user-agent"));
  return c.json({ ok: true });
});

export default analytics;

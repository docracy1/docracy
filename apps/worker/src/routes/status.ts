import { Hono } from "hono";
import { runHealthCheck, readStatusHistory } from "../lib/healthcheck";
import type { Env } from "@docracy/shared";

const status = new Hono<{ Bindings: Env }>();

// Public, unauthenticated — runs the same checks as the daily alerting sweep, live, so the public
// status page always reflects the current moment rather than a cached/stale snapshot. History
// comes from whatever the daily cron has actually recorded in KV — never backfilled/fabricated for
// dates before this shipped.
status.get("/", async (c) => {
  const [current, history] = await Promise.all([runHealthCheck(c.env), readStatusHistory(c.env)]);
  return c.json({ checkedAt: new Date().toISOString(), current, history });
});

export default status;

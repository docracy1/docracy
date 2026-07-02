import { Hono } from "hono";
import { cors } from "hono/cors";
import documents from "./routes/documents";
import sign from "./routes/sign";
import { runReminderSweep } from "./lib/reminders";
import { reconcileD1Index } from "./lib/index-d1";
import { runExpiredDocCleanup } from "./lib/cleanup";
import type { Env } from "@docracy/shared";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

// An unset TOKEN_SECRET would otherwise silently become the string "undefined" wherever it's
// used to sign/verify links — every link would still "work" but with a predictable, guessable
// key. Fail loudly instead of shipping that quietly.
app.use("/api/*", async (c, next) => {
  if (!c.env.TOKEN_SECRET) {
    return c.json({ error: "Server misconfigured: TOKEN_SECRET is not set" }, 500);
  }
  await next();
});

app.route("/api/documents", documents);
app.route("/api", sign);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (!env.TOKEN_SECRET) {
      console.error("Skipping reminder sweep: TOKEN_SECRET is not set");
      return;
    }
    ctx.waitUntil(runReminderSweep(env));
    ctx.waitUntil(reconcileD1Index(env).catch((err) => console.error("D1 reconciliation sweep failed:", err)));
    ctx.waitUntil(runExpiredDocCleanup(env).catch((err) => console.error("Expired doc cleanup sweep failed:", err)));
  },
};

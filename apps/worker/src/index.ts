import { Hono } from "hono";
import { cors } from "hono/cors";
import documents from "./routes/documents";
import sign from "./routes/sign";
import feedback from "./routes/feedback";
import auth from "./routes/auth";
import billing from "./routes/billing";
import account from "./routes/account";
import templates from "./routes/templates";
import { runReminderSweep } from "./lib/reminders";
import { reconcileD1Index } from "./lib/index-d1";
import { runExpiredDocCleanup } from "./lib/cleanup";
import { runHealthCheckAndAlert } from "./lib/healthcheck";
import type { Env } from "@docracy/shared";

const app = new Hono<{ Bindings: Env }>();

// credentials: true + an explicit echoed origin — session cookies need both; a wildcard origin
// is browser-rejected once credentialed requests are involved.
app.use(
  "/api/*",
  cors({
    origin: (_origin, c) => c.env.PUBLIC_APP_URL,
    credentials: true,
  })
);

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
app.route("/api/feedback", feedback);
app.route("/api/auth", auth);
app.route("/api/billing", billing);
app.route("/api/account", account);
app.route("/api/account/templates", templates);

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
    ctx.waitUntil(runHealthCheckAndAlert(env).catch((err) => console.error("Healthcheck sweep failed:", err)));
  },
};

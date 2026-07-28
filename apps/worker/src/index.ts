import { Hono } from "hono";
import { cors } from "hono/cors";
import documents from "./routes/documents";
import sign from "./routes/sign";
import feedback from "./routes/feedback";
import auth from "./routes/auth";
import billing from "./routes/billing";
import account from "./routes/account";
import templates from "./routes/templates";
import webhooksRoute from "./routes/webhooks";
import connectorsRoute from "./routes/connectors";
import teamRoute from "./routes/team";
import brandingRoute from "./routes/branding";
import brandingPublicRoute from "./routes/brandingPublic";
import contactsRoute from "./routes/contacts";
import bulkSendRoute from "./routes/bulkSend";
import embedRoute from "./routes/embed";
import zapierRoute from "./routes/zapier";
import aiRoute from "./routes/ai";
import analyticsRoute from "./routes/analytics";
import adminRoute from "./routes/admin";
import statusRoute from "./routes/status";
import resendWebhook from "./routes/resendWebhook";
import { blogPostsAdmin, blogPostsPublic } from "./routes/blogPosts";
import { runReminderSweep } from "./lib/reminders";
import { reconcileD1Index } from "./lib/index-d1";
import { runExpiredDocCleanup } from "./lib/cleanup";
import { runHealthCheckAndAlert } from "./lib/healthcheck";
import { runPaymentFreezeSweep } from "./lib/paymentFreeze";
import { runOnboardingEmailSweep } from "./lib/onboardingEmails";
import { runCompletionEmailSweep } from "./lib/completionEmails";
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
app.route("/api/account/webhooks", webhooksRoute);
app.route("/api/account/connectors", connectorsRoute);
app.route("/api/account/team", teamRoute);
app.route("/api/account/branding", brandingRoute);
app.route("/api/account/contacts", contactsRoute);
app.route("/api/account/bulk-send", bulkSendRoute);
app.route("/api/embed", embedRoute);
app.route("/api/branding", brandingPublicRoute);
app.route("/api/zapier", zapierRoute);
app.route("/api/account/ai", aiRoute);
app.route("/api/analytics", analyticsRoute);
app.route("/api/admin", adminRoute);
app.route("/api/admin/blog-posts", blogPostsAdmin);
app.route("/api/blog-posts", blogPostsPublic);
app.route("/api/status", statusRoute);
app.route("/api/webhooks/resend", resendWebhook);

// The frequent cron (see wrangler.toml's second crons entry) exists to give the onboarding email
// drip and the preparer completion-nudge sweep minute-scale granularity (both have hour-scale
// thresholds) — everything else here is fine running once a day. Without branching on event.cron,
// adding that entry would make the daily sweeps below fire every few minutes too.
const FREQUENT_CRON = "*/5 * * * *";

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (!env.TOKEN_SECRET) {
      console.error("Skipping scheduled sweeps: TOKEN_SECRET is not set");
      return;
    }

    if (event.cron === FREQUENT_CRON) {
      ctx.waitUntil(runOnboardingEmailSweep(env).catch((err) => console.error("Onboarding email sweep failed:", err)));
      ctx.waitUntil(runCompletionEmailSweep(env).catch((err) => console.error("Completion-email sweep failed:", err)));
      return;
    }

    ctx.waitUntil(runReminderSweep(env));
    ctx.waitUntil(reconcileD1Index(env).catch((err) => console.error("D1 reconciliation sweep failed:", err)));
    ctx.waitUntil(runExpiredDocCleanup(env).catch((err) => console.error("Expired doc cleanup sweep failed:", err)));
    ctx.waitUntil(runHealthCheckAndAlert(env).catch((err) => console.error("Healthcheck sweep failed:", err)));
    ctx.waitUntil(runPaymentFreezeSweep(env).catch((err) => console.error("Payment freeze sweep failed:", err)));
  },
};

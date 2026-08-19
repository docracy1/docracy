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
import unsubscribeRoute from "./routes/unsubscribe";
import resendWebhook from "./routes/resendWebhook";
import whatsappWebhook from "./routes/whatsappWebhook";
import { blogPostsAdmin, blogPostsPublic } from "./routes/blogPosts";
import { marketplaceAccount, marketplacePublic, marketplaceAdmin } from "./routes/marketplace";
import { roadmapAdmin, roadmapPublic } from "./routes/roadmap";
import { runReminderSweep } from "./lib/reminders";
import { reconcileD1Index } from "./lib/index-d1";
import { runExpiredDocCleanup } from "./lib/cleanup";
import { runHealthCheckAndAlert } from "./lib/healthcheck";
import { runPaymentFreezeSweep } from "./lib/paymentFreeze";
import { runOnboardingEmailSweep } from "./lib/onboardingEmails";
import { runCompletionEmailSweep } from "./lib/completionEmails";
import { runSpaSmokeAndAlert } from "./lib/spaSmoke";
import { BLOG_WEEKLY_CRON, runWeeklyBlogPublish, isWeeklyBlogMondayUtc } from "./lib/blogWeekly";
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

// api.docracy.io serves no browsable pages — every route is a JSON API endpoint (many auth-gated,
// returning 401/404 for unauthenticated or bare requests). Without this, Cloudflare's own default
// robots.txt permits Googlebot to crawl the domain, which then reports those API responses as
// indexing errors in Search Console for a page that was never meant to be indexed.
app.get("/robots.txt", (c) => c.text("User-agent: *\nDisallow: /\n"));

app.route("/api/documents", documents);
app.route("/api", sign);
app.route("/api/feedback", feedback);
app.route("/api/auth", auth);
app.route("/api/billing", billing);
app.route("/api/account", account);
app.route("/api/account/templates", templates);
app.route("/api/account/marketplace", marketplaceAccount);
app.route("/api/marketplace", marketplacePublic);
app.route("/api/admin/marketplace", marketplaceAdmin);
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
app.route("/api/admin/roadmap", roadmapAdmin);
app.route("/api/roadmap", roadmapPublic);
app.route("/api/status", statusRoute);
app.route("/api/unsubscribe", unsubscribeRoute);
app.route("/api/webhooks/resend", resendWebhook);
app.route("/api/webhooks/whatsapp", whatsappWebhook);

// Hourly cron runs onboarding drip + completion nudges. Daily cron runs reminders/cleanup/health,
// and on Mondays (UTC) also publishes one queued SEO blog post. Branch on event.cron so the
// hourly schedule does not re-fire daily sweeps. (No separate Monday cron — account trigger limit.)
// Offset to :07, not :00 — see wrangler.toml's [triggers] comment for why (thundering-herd 522s
// observed right at the hour mark). Must exactly match the hourly entry in wrangler.toml's crons.
const HOURLY_CRON = "7 * * * *";

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (!env.TOKEN_SECRET) {
      console.error("Skipping scheduled sweeps: TOKEN_SECRET is not set");
      return;
    }

    if (event.cron === HOURLY_CRON) {
      // SPA Sign in / Start free hydrate probe — dispatched FIRST, before the heavier sweeps below.
      // All three run as concurrent waitUntil tasks inside the same invocation (no separate cron
      // slot available — see wrangler.toml), sharing that invocation's subrequest/CPU budget. The
      // onboarding/completion sweeps do enough KV work to matter (see their own "doubles KV list
      // usage" comment) — started after this one, so the smoke check's handful of self-fetches
      // aren't competing with that for the shared budget. Observed in production: the alert fired
      // with a genuine (retry-confirmed) 522 exactly at an hourly tick, yet manual checks moments
      // later passed cleanly — consistent with transient in-invocation contention, not a real outage.
      ctx.waitUntil(runSpaSmokeAndAlert(env).catch((err) => console.error("SPA smoke sweep failed:", err)));
      ctx.waitUntil(runOnboardingEmailSweep(env).catch((err) => console.error("Onboarding email sweep failed:", err)));
      ctx.waitUntil(runCompletionEmailSweep(env).catch((err) => console.error("Completion-email sweep failed:", err)));
      return;
    }

    // Daily path (and any unmatched cron string — keep previous behavior for safety).
    if (isWeeklyBlogMondayUtc(new Date()) || event.cron === BLOG_WEEKLY_CRON) {
      ctx.waitUntil(runWeeklyBlogPublish(env).catch((err) => console.error("Weekly blog publish failed:", err)));
    }

    ctx.waitUntil(runReminderSweep(env));
    ctx.waitUntil(reconcileD1Index(env).catch((err) => console.error("D1 reconciliation sweep failed:", err)));
    ctx.waitUntil(runExpiredDocCleanup(env).catch((err) => console.error("Expired doc cleanup sweep failed:", err)));
    ctx.waitUntil(runHealthCheckAndAlert(env).catch((err) => console.error("Healthcheck sweep failed:", err)));
    ctx.waitUntil(runPaymentFreezeSweep(env).catch((err) => console.error("Payment freeze sweep failed:", err)));
  },
};

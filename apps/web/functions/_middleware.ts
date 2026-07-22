// Logs a page_view funnel event for every request to a public marketing route, BEFORE the static
// asset is served — deliberately server-side, not a client-side JS beacon, since most AI crawlers
// this is meant to measure (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) never execute
// JavaScript and would otherwise never be counted at all. Fire-and-forget via ctx.waitUntil so a
// slow/failing analytics call never delays the actual page response.
const WORKER_URL = "https://api.docracy.io";

const STATIC_TEMPLATE_SLUGS = [
  "mutual-nda",
  "independent-contractor-agreement",
  "offer-letter",
  "remote-work-policy",
  "freelance-service-agreement",
  "unilateral-nda",
  "simple-commercial-lease-agreement",
  "non-compete-non-solicitation-agreement",
  "consulting-agreement",
  "vendor-agreement",
  "separation-agreement",
  "equipment-rental-agreement",
  "partnership-agreement",
  "sales-agreement",
  "referral-agreement",
];

const TRACKED_ROUTES = new Set([
  "/",
  "/free-templates",
  "/mcp",
  ...STATIC_TEMPLATE_SLUGS.map((slug) => `/free-templates/${slug}`),
]);

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  if (TRACKED_ROUTES.has(url.pathname)) {
    context.waitUntil(
      fetch(`${WORKER_URL}/api/analytics/pageview`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": context.request.headers.get("user-agent") ?? "",
        },
        body: JSON.stringify({ route: url.pathname }),
      }).catch(() => {})
    );
  }
  return context.next();
};

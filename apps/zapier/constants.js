// Docracy is a single hosted product (not self-hosted per customer), so unlike a generic
// "enter your API URL" field, the base URL is just a constant. Bump this if the worker's public
// hostname ever changes. The env var override exists only for local test runs against a
// `wrangler dev` instance — Zapier's own runtime never sets it, so production always uses the
// real constant.
module.exports = {
  BASE_URL: process.env.DOCRACY_ZAPIER_TEST_BASE_URL || "https://docracy-worker.rl-d77.workers.dev",
};

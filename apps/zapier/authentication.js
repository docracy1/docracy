const { BASE_URL } = require("./constants");

// GET /api/zapier/auth-test (apps/worker/src/routes/zapier.ts) — 401s on a bad/missing key,
// otherwise returns { email, workspaceId }, which Zapier merges into bundle.inputData for the
// connectionLabel template below.
const test = (z, bundle) => z.request({ url: `${BASE_URL}/api/zapier/auth-test` }).then((response) => response.data);

module.exports = {
  type: "custom",
  fields: [
    {
      key: "apiKey",
      label: "API Key",
      type: "string",
      required: true,
      helpText:
        'Find this on your [Docracy Dashboard](https://docracy.pages.dev/dashboard) under "MCP connector & API key" — ' +
        "click Generate (or Regenerate) to get one. The same key works for Zapier and for AI assistants like Claude.",
    },
  ],
  test,
  connectionLabel: "{{bundle.inputData.email}}",
};

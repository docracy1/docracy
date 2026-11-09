import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "_middleware.ts");
const out = path.join(os.tmpdir(), `middleware-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [src],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { onRequest } = createRequire(import.meta.url)(out);

// Prerendered homepage shell: what the ASSETS binding returns for /index.html AND, through the
// `/* /index.html 200` catch-all, for every path that has no real file of its own.
const INDEX_HTML = `<!doctype html><html><head><title>Home</title><link rel="canonical" href="https://docracy.io/"/></head>
<body><div id="root"><h1>Stop chasing the invoice</h1></div><script type="module" src="/assets/index-abc123.js"></script></body></html>`;

// Simulates the Cloudflare Pages asset layer: `_redirects` rules first (301), then real files,
// then the SPA catch-all serving index.html as a 200 for anything else.
function makeContext(url, { redirects = {}, files = {} } = {}) {
  const assetFetch = async (input) => {
    const u = new URL(input instanceof Request ? input.url : String(input));
    if (redirects[u.pathname]) {
      return new Response(null, { status: 301, headers: { Location: new URL(redirects[u.pathname], u.origin).toString() } });
    }
    // Pages serves an extensionless URL from its `<path>.html` file.
    const file = files[u.pathname] ?? files[`${u.pathname}.html`];
    if (file) {
      return new Response(file, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response(INDEX_HTML, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  };
  const request = new Request(url, { method: "GET" });
  const nextCalls = [];
  return {
    nextCalls,
    context: {
      request,
      env: { ASSETS: { fetch: assetFetch } },
      waitUntil() {},
      next: async () => {
        nextCalls.push(request.url);
        return assetFetch(request);
      },
    },
  };
}

const LEAF_HTML = `<!doctype html><html><head><title>Pricing</title></head><body><div id="root"><h1>Pricing</h1></div><script type="module" src="/assets/index-abc123.js"></script></body></html>`;

// A `_redirects` source has no prerendered HTML of its own — the 301 must be let through instead
// of being replaced by the unknown-URL 404 (this is how /templates, /1099 and every A-vs-B twin
// came back as 404 in Search Console).
{
  const { context } = makeContext("https://docracy.io/templates", { redirects: { "/templates": "/free-templates" } });
  const res = await onRequest(context);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://docracy.io/free-templates");
}
{
  const { context } = makeContext("https://docracy.io/eversign-vs-docusign", {
    redirects: { "/eversign-vs-docusign": "/docusign-vs-eversign" },
  });
  const res = await onRequest(context);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://docracy.io/docusign-vs-eversign");
}

// A genuinely unknown URL still gets a real 404 with noindex — never the homepage as a 200.
{
  const { context } = makeContext("https://docracy.io/this-does-not-exist");
  const res = await onRequest(context);
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  const body = await res.text();
  assert.ok(body.includes("Page not found | Docracy"));
  assert.ok(!body.includes("Stop chasing the invoice"));
}

// A prerendered page is served untouched through context.next().
{
  const { context, nextCalls } = makeContext("https://docracy.io/pricing", { files: { "/pricing.html": LEAF_HTML } });
  const res = await onRequest(context);
  assert.equal(res.status, 200);
  assert.equal(nextCalls.length, 1);
  assert.ok((await res.text()).includes("<h1>Pricing</h1>"));
}

// Client-only app routes keep the emptied, noindex SPA shell (status 200) — no redirect probe.
{
  const { context } = makeContext("https://docracy.io/dashboard");
  const res = await onRequest(context);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  const body = await res.text();
  assert.ok(!body.includes("Stop chasing the invoice"));
  assert.ok(body.includes('type="module"'));
}

fs.rmSync(out, { force: true });
console.log("_middleware.test.mjs OK");

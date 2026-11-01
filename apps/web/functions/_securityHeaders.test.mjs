import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `securityHeaders-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "_securityHeaders.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { applySecurityHeaders, buildCsp, isNonHtmlFilePath, newNonce } = createRequire(import.meta.url)(out);

// Node has no HTMLRewriter: the nonce attribute path is covered by the wrangler build check,
// the header logic by these tests.
const nonce = newNonce();
assert.match(nonce, /^[A-Za-z0-9+/]+=*$/);
assert.notEqual(newNonce(), nonce);

const csp = buildCsp(nonce);
assert.ok(csp.includes(`'nonce-${nonce}'`));
assert.ok(!csp.includes("unsafe-inline") || csp.indexOf("unsafe-inline") > csp.indexOf("style-src"), "script-src must not allow unsafe-inline");
assert.ok(!/script-src[^;]*unsafe-inline/.test(csp));
assert.ok(csp.includes("frame-ancestors 'none'"));
assert.ok(buildCsp(nonce, { embed: true }).includes("frame-ancestors *"));

assert.equal(isNonHtmlFilePath("/foo.txt"), true);
assert.equal(isNonHtmlFilePath("/pricing"), false);
assert.equal(isNonHtmlFilePath("/pricing.html"), false);
assert.equal(isNonHtmlFilePath("/.well-known/security.txt"), true);

const html = () => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });

// HTML page: full header set, DENY, nonce policy.
const page = applySecurityHeaders(new Request("https://docracy.io/pricing"), html(), nonce);
assert.equal(page.status, 200);
assert.equal(page.headers.get("x-frame-options"), "DENY");
assert.equal(page.headers.get("x-content-type-options"), "nosniff");
assert.ok(page.headers.get("strict-transport-security").includes("preload"));
assert.ok(page.headers.get("permissions-policy").includes("camera"));
assert.ok(page.headers.get("content-security-policy").includes(`'nonce-${nonce}'`));

// Embedded signing: framable, no X-Frame-Options.
const embed = applySecurityHeaders(new Request("https://docracy.io/embed/sign/abc"), html(), nonce);
assert.equal(embed.headers.get("x-frame-options"), null);
assert.ok(embed.headers.get("content-security-policy").includes("frame-ancestors *"));

// Missing static file that fell through to the SPA shell: real 404.
const missing = applySecurityHeaders(new Request("https://docracy.io/nope.txt"), html(), nonce);
assert.equal(missing.status, 404);
assert.equal(missing.headers.get("x-frame-options"), "DENY");

// A real text file keeps its body and gets the common headers, but no HTML policy.
const txt = applySecurityHeaders(
  new Request("https://docracy.io/llms.txt"),
  new Response("hello", { headers: { "content-type": "text/plain" } }),
  nonce
);
assert.equal(txt.status, 200);
assert.equal(await txt.text(), "hello");
assert.equal(txt.headers.get("content-security-policy"), null);
assert.equal(txt.headers.get("x-frame-options"), "DENY");

// Existing policy on a non-HTML response (API JSON from the worker) is left alone.
const json = applySecurityHeaders(
  new Request("https://docracy.io/api/x"),
  new Response("{}", { headers: { "content-type": "application/json", "content-security-policy": "default-src 'none'" } }),
  nonce
);
assert.equal(json.headers.get("content-security-policy"), "default-src 'none'");

fs.unlinkSync(out);
console.log("_securityHeaders.test.mjs: ok");

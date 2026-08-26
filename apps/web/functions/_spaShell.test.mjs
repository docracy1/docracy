import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "_spaShell.ts");
const out = path.join(os.tmpdir(), `spaShell-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [src],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const {
  emptyRoot,
  sanitizeForNoIndex,
  isSpaAppPath,
  hasFileExtension,
  hasViteModuleScript,
} = createRequire(import.meta.url)(out);

const nested = `<!doctype html><html><head>
<title>Home</title>
<meta name="description" content="Home desc" />
<link rel="canonical" href="https://docracy.io/" />
<meta property="og:url" content="https://docracy.io/" />
<script type="application/ld+json">{"@type":"SoftwareApplication"}</script>
</head><body>
<div id="root"><div class="wrap"><h1>The fastest way</h1><div>inner</div></div></div>
<script type="module" src="/assets/x.js"></script>
</body></html>`;

assert.equal(emptyRoot(nested).includes('<div id="root"></div>'), true);
assert.equal(emptyRoot(nested).includes("The fastest way"), false);

const cleaned = sanitizeForNoIndex(nested, "Page not found — Docracy");
assert.match(cleaned, /<title>Page not found — Docracy<\/title>/);
assert.match(cleaned, /noindex, nofollow/);
assert.equal(cleaned.includes('rel="canonical"'), false);
assert.equal(cleaned.includes("SoftwareApplication"), false);
assert.equal(cleaned.includes("The fastest way"), false);
assert.equal(cleaned.includes('<div id="root"></div>'), true);
assert.equal(hasViteModuleScript(cleaned), true, "sanitize must keep the Vite module script");
assert.equal(hasViteModuleScript(`<!doctype html><html><body><div id="root"></div></body></html>`), false);

assert.equal(isSpaAppPath("/login"), true);
assert.equal(isSpaAppPath("/prepare"), true);
assert.equal(isSpaAppPath("/sign/abc"), true);
assert.equal(isSpaAppPath("/pricing"), false);
assert.equal(hasFileExtension("/assets/x.js"), true);
assert.equal(hasFileExtension("/pricing"), false);

fs.unlinkSync(out);
console.log("_spaShell.test.mjs: ok");

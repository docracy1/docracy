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
  stripVideoMetaTags,
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

const withVideoMeta = `${nested.slice(0, nested.indexOf("</head>"))}
<meta property="og:video" content="https://docracy.io/videos/how-it-works.webm" />
<meta name="twitter:player" content="https://docracy.io/how-it-works" />
</head>${nested.slice(nested.indexOf("</head>") + 7)}`;
assert.equal(stripVideoMetaTags(withVideoMeta).includes("og:video"), false);
assert.equal(stripVideoMetaTags(withVideoMeta).includes("twitter:player"), false);

assert.equal(isSpaAppPath("/login"), true);
assert.equal(isSpaAppPath("/prepare"), true);
assert.equal(isSpaAppPath("/sign/abc"), true);
assert.equal(isSpaAppPath("/income-proof/tok"), true);
assert.equal(isSpaAppPath("/es/constancia/tok"), true);
assert.equal(isSpaAppPath("/income-proof"), false);
assert.equal(isSpaAppPath("/es/constancia"), false);
assert.equal(isSpaAppPath("/1099-season/tok"), true);
assert.equal(isSpaAppPath("/es/temporada-1099/tok"), true);
assert.equal(isSpaAppPath("/1099-season"), false);
assert.equal(isSpaAppPath("/es/temporada-1099"), false);
assert.equal(isSpaAppPath("/pricing"), false);
assert.equal(hasFileExtension("/assets/x.js"), true);
assert.equal(hasFileExtension("/pricing"), false);

fs.unlinkSync(out);
console.log("_spaShell.test.mjs: ok");

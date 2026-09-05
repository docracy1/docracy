import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "_trackingParams.ts");
const out = path.join(os.tmpdir(), `trackingParams-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [src],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const {
  stripTrackingSearch,
  canonicalPublicLocation,
  firstTouchCookieFromStripped,
  firstTouchSetCookieHeader,
  shortLinkCanonical,
} = createRequire(import.meta.url)(out);

const stripped = stripTrackingSearch("?ref=seo-price&freeTemplate=mutual-nda");
assert.equal(stripped.nextSearch, "?freeTemplate=mutual-nda");
assert.equal(stripped.stripped.ref, "seo-price");

const utm = stripTrackingSearch("?utm_source=producthunt&utm_medium=launch&utm_campaign=launch&freeTemplate=mutual-nda");
assert.equal(utm.nextSearch, "?freeTemplate=mutual-nda");
assert.equal(utm.stripped.utm_source, "producthunt");

assert.equal(stripTrackingSearch("?send=1").nextSearch, "?send=1");
assert.equal(stripTrackingSearch("?next=%2Fes%2Fcobro%3Fsend%3D1&ref=cobro").nextSearch, "?next=%2Fes%2Fcobro%3Fsend%3D1");

const pricing = canonicalPublicLocation(new URL("https://docracy.io/pricing?ref=seo-price"));
assert.equal(pricing.location, "https://docracy.io/pricing");
assert.equal(pricing.stripped.ref, "seo-price");

const www = canonicalPublicLocation(new URL("https://www.docracy.io/pricing?ref=blog-nda"));
assert.equal(www.location, "https://docracy.io/pricing");

const prepare = canonicalPublicLocation(
  new URL("https://docracy.io/prepare?freeTemplate=mutual-nda&ref=seo-docusign-alternative")
);
assert.equal(prepare.location, "https://docracy.io/prepare?freeTemplate=mutual-nda");

const slash = canonicalPublicLocation(new URL("https://docracy.io/blog/what-is-an-nda/"));
assert.equal(slash.location, "https://docracy.io/blog/what-is-an-nda");

const local = canonicalPublicLocation(new URL("http://localhost:5173/pricing?ref=x"));
assert.equal(local.location, "http://localhost:5173/pricing");

assert.equal(canonicalPublicLocation(new URL("https://docracy.io/pricing")), null);
assert.equal(canonicalPublicLocation(new URL("https://docracy.io/prepare?freeTemplate=mutual-nda")), null);

const cookie = firstTouchCookieFromStripped({ ref: "seo-price" });
assert.ok(cookie);
assert.ok(firstTouchSetCookieHeader({ ref: "seo-price" }).startsWith("docracy_ft="));
assert.equal(firstTouchSetCookieHeader({}), null);

const tryLink = shortLinkCanonical(new URL("https://docracy.io/try"));
assert.equal(tryLink.location, "https://docracy.io/prepare?freeTemplate=mutual-nda");
assert.equal(tryLink.stripped.ref, "try");

const tryWww = shortLinkCanonical(new URL("https://www.docracy.io/try?utm_source=newsletter"));
assert.equal(tryWww.location, "https://docracy.io/prepare?freeTemplate=mutual-nda");
assert.equal(tryWww.stripped.utm_source, "newsletter");

const trySlash = shortLinkCanonical(new URL("https://docracy.io/try/"));
assert.equal(trySlash.location, "https://docracy.io/prepare?freeTemplate=mutual-nda");

const goPh = shortLinkCanonical(new URL("https://docracy.io/go/ph"));
assert.equal(goPh.location, "https://docracy.io/prepare?freeTemplate=mutual-nda");
assert.equal(goPh.stripped.utm_source, "producthunt");

const goGl = shortLinkCanonical(new URL("https://docracy.io/go/gl"));
assert.equal(goGl.location, "https://docracy.io/mcp");

assert.equal(shortLinkCanonical(new URL("https://docracy.io/pricing")), null);

const localTry = shortLinkCanonical(new URL("http://localhost:5173/try"));
assert.equal(localTry.location, "http://localhost:5173/prepare?freeTemplate=mutual-nda");

fs.unlinkSync(out);
console.log("_trackingParams.test.mjs: ok");

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

fs.unlinkSync(out);
console.log("_trackingParams.test.mjs: ok");

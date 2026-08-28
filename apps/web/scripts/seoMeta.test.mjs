import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `seoMeta-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/seoMeta.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { ensureMetaDescription } = createRequire(import.meta.url)(out);

const short = "Covers position, pay, work schedule, confidentiality, and termination terms for a new hire.";
const padded = ensureMetaDescription(short);
assert.ok(padded.length >= 120, `expected >= 120 chars, got ${padded.length}`);
assert.ok(padded.length <= 160, `expected <= 160 chars, got ${padded.length}`);
assert.match(padded, /Docracy/);

const long = "x".repeat(200);
assert.equal(ensureMetaDescription(long).length, 160);
assert.equal(ensureMetaDescription(long).endsWith("…"), true);

assert.equal(ensureMetaDescription(""), "");

fs.unlinkSync(out);
console.log("seoMeta.test.mjs: ok");

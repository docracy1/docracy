import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `latamSearch-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/latamSearch.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { searchLatamIndex, latamSearchIndex, LATAM_SEARCH_EN, LATAM_SEARCH_ES, foldLatamQuery } =
  createRequire(import.meta.url)(out);

assert.equal(LATAM_SEARCH_EN, "/latam-search");
assert.equal(LATAM_SEARCH_ES, "/es/buscar");
assert.equal(foldLatamQuery("Apostilla México"), "apostilla mexico");

const i9 = searchLatamIndex("i-9")[0];
assert.ok(i9, "I-9 must hit");
assert.equal(i9.officialHref, "https://www.uscis.gov/i-9");

const mx = searchLatamIndex("apostilla mexico").find((e) => e.id === "country-mexico-to-us");
assert.ok(mx);
assert.match(mx.officialHref, /gob\.mx\/sre/);

const cuba = searchLatamIndex("cuba legalizacion")[0];
assert.ok(cuba);
assert.equal(cuba.officialHref, "https://www.minjus.gob.cu/es");

const cfdi = searchLatamIndex("cfdi")[0];
assert.equal(cfdi.kind, "honest-no");
assert.equal(cfdi.docracyTo, "/cobro#send");
assert.equal(cfdi.paid, true);

const cobro = searchLatamIndex("cobro")[0];
assert.equal(cobro.paid, true);
assert.ok(!searchLatamIndex("i-9")[0].paid, "I-9 signing stays free");

const w8 = searchLatamIndex("w-8ben")[0];
assert.equal(w8.kind, "honest-no");

const brazil = searchLatamIndex("apostilla brasil");
assert.ok(!brazil.some((e) => /brazil|brasil/i.test(e.id + e.docracyTo)));

const index = latamSearchIndex();
assert.ok(!index.some((e) => /brazil|puerto-rico/i.test(e.id)));
assert.ok(index.every((e) => e.docracyTo.startsWith("/") || e.docracyTo.startsWith("http")));
assert.ok(index.some((e) => e.id === "playbook-everify"));

const paths = fs.readFileSync(path.join(__dirname, "../src/lib/i18n/paths.ts"), "utf8");
assert.ok(paths.includes('"/latam-search": "/es/buscar"'));

fs.unlinkSync(out);
console.log("latamSearch.test.mjs: ok");

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `seoLatam-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/seoPages.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { SEO_LANDING_PAGES, SEO_VS_REDIRECTS, getSeoLandingPage, resolveSeoLandingCopy } =
  createRequire(import.meta.url)(out);

for (const slug of ["kita-vs-alegra", "kita-vs-siigo", "alegra-vs-siigo"]) {
  const page = getSeoLandingPage(slug);
  assert.ok(page, `missing ${slug}`);
  assert.equal(page.lane, "latam");
  assert.ok(page.es?.seoTitle, `${slug} needs Spanish copy`);
  const es = resolveSeoLandingCopy(page, "es");
  assert.equal(es.seoTitle, page.es.seoTitle);
}

assert.deepEqual(
  SEO_VS_REDIRECTS.filter((r) => r.to.includes("kita-vs-alegra") || r.to.includes("kita-vs-siigo") || r.to.includes("alegra-vs-siigo")),
  [
    { from: "/alegra-vs-kita", to: "/kita-vs-alegra" },
    { from: "/es/alegra-vs-kita", to: "/es/kita-vs-alegra" },
    { from: "/siigo-vs-kita", to: "/kita-vs-siigo" },
    { from: "/es/siigo-vs-kita", to: "/es/kita-vs-siigo" },
    { from: "/siigo-vs-alegra", to: "/alegra-vs-siigo" },
    { from: "/es/siigo-vs-alegra", to: "/es/alegra-vs-siigo" },
  ]
);

assert.ok(SEO_LANDING_PAGES.every((p) => p.lane === "esign" || p.lane === "latam"));

const redirects = fs.readFileSync(path.join(__dirname, "../public/_redirects"), "utf8");
for (const line of [
  "/whatsapp-invoice  /cobro  301",
  "/es/factura-whatsapp  /es/cobro  301",
  "/send-invoice-whatsapp  /cobro  301",
  "/es/factura-por-whatsapp  /es/cobro  301",
  "/alegra-vs-kita  /kita-vs-alegra  301",
  "/docracy-vs-kita  /kita-alternative  301",
  "/i9  /i-9  301",
  "/es/i-9  /es/formulario-i-9  301",
  "/visa-documents  /visa-supporting-documents  301",
  "/es/documentos-visa  /es/documentos-para-visa  301",
]) {
  assert.ok(redirects.includes(line), `missing one-hop redirect: ${line}`);
}
assert.ok(!redirects.includes("/send-invoice-whatsapp  /whatsapp-invoice"), "alias must not chain through /whatsapp-invoice");

fs.unlinkSync(out);
console.log("seoLatam.test.mjs: ok");

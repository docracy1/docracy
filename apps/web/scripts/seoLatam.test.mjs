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

{
  const page = getSeoLandingPage("boundless-vs-citizenpath");
  assert.ok(page, "missing boundless-vs-citizenpath");
  assert.equal(page.lane, "immigrant");
  assert.ok(page.es?.seoTitle, "boundless-vs-citizenpath needs Spanish copy");
  assert.equal(resolveSeoLandingCopy(page, "es").seoTitle, page.es.seoTitle);
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

assert.ok(SEO_LANDING_PAGES.every((p) => p.lane === "esign" || p.lane === "latam" || p.lane === "immigrant"));
assert.ok(
  SEO_VS_REDIRECTS.some((r) => r.from === "/citizenpath-vs-boundless" && r.to === "/boundless-vs-citizenpath")
);
assert.ok(
  SEO_VS_REDIRECTS.some((r) => r.from === "/es/citizenpath-vs-boundless" && r.to === "/es/boundless-vs-citizenpath")
);

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
  "/boundless  /boundless-alternative  301",
  "/es/boundless  /es/alternativa-a-boundless  301",
  "/citizenpath-vs-boundless  /boundless-vs-citizenpath  301",
  "/es/gestoria-de-visa  /es/alternativa-a-gestoria-de-visa  301",
  "/es/de-mexico-a-eeuu  /es/mexico-a-eeuu  301",
  "/es/de-colombia-a-eeuu  /es/colombia-a-eeuu  301",
  "/es/renta-inmigrante  /es/arrendamiento-inmigrante  301",
  "/es/de-panama-a-eeuu  /es/panama-a-eeuu  301",
  "/panama-usa  /panama-to-us  301",
  "/es/de-venezuela-a-eeuu  /es/venezuela-a-eeuu  301",
  "/venezuela-usa  /venezuela-to-us  301",
  "/es/ya-llegue  /es/despues-de-llegar  301",
  "/es/w-7  /es/itin  301",
  "/es/quien-presenta  /es/quien-sube-donde  301",
  "/where-each-file-goes  /who-files-where  301",
]) {
  assert.ok(redirects.includes(line), `missing one-hop redirect: ${line}`);
}
assert.ok(!redirects.includes("/send-invoice-whatsapp  /whatsapp-invoice"), "alias must not chain through /whatsapp-invoice");

const marketingOut = path.join(os.tmpdir(), `seoLatam-marketing-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/marketingPages.ts")],
  outfile: marketingOut,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { FEATURE_PAGES, getFeaturePageContent, LATAM_COUNTRY_CORRIDORS, GENERATED_COUNTRY_CORRIDORS } =
  createRequire(import.meta.url)(marketingOut);
for (const slug of ["mexico-to-us", "colombia-to-us", "immigrant-housing", "after-arrival", "itin"]) {
  const en = FEATURE_PAGES.find((p) => p.slug === slug);
  assert.ok(en, `missing FEATURE_PAGES ${slug}`);
  assert.equal(en.xDefault, "es", `${slug} x-default must be Spanish`);
  const es = getFeaturePageContent(slug, "es");
  assert.ok(es?.seoTitle, `${slug} needs Spanish copy`);
  assert.equal(es.ctaTo, "/packets/latam-to-us");
}
assert.ok(
  getFeaturePageContent("mexico-to-us", "es").relatedLinks.some((l) =>
    l.to.startsWith("https://www.gob.mx/sre/")
  ),
  "Mexico door must link official SRE apostille"
);
assert.ok(
  getFeaturePageContent("colombia-to-us", "es").relatedLinks.some((l) =>
    l.to.startsWith("https://www.cancilleria.gov.co/")
  ),
  "Colombia door must link official Cancillería apostille"
);
assert.ok(
  getFeaturePageContent("after-arrival", "es").relatedLinks.some((l) => l.to === "/who-files-where"),
  "after-arrival must point at the who-files-where checklist"
);
assert.ok(
  getFeaturePageContent("itin", "es").relatedLinks.some((l) => l.to === "/who-files-where"),
  "itin must point at the who-files-where checklist"
);

assert.equal(LATAM_COUNTRY_CORRIDORS.length, 18, "Spanish LATAM catalog (MX+CO handmade + 16 generated)");
assert.equal(GENERATED_COUNTRY_CORRIDORS.length, 16);
assert.ok(!LATAM_COUNTRY_CORRIDORS.some((c) => /brazil|puerto-rico|portugal/i.test(c.slug)));
assert.ok(
  !LATAM_COUNTRY_CORRIDORS.some((c) => /hcch\.net/i.test(c.officialHref)),
  "country doors must use verified government apostille/legalization URLs, not HCCH fallbacks"
);
assert.equal(new Set(LATAM_COUNTRY_CORRIDORS.map((c) => c.slug)).size, LATAM_COUNTRY_CORRIDORS.length);

const officialBySlug = {
  "peru-to-us": "https://www.gob.pe/37302-apostilla-y-legalizacion-apostillar-y-legalizar-documentos-digitales",
  "argentina-to-us": "https://www.cancilleria.gob.ar/es/servicios/apostilla-legalizacion-con-validez-internacional-tad",
  "chile-to-us": "https://www.consulado.gob.cl/servicios-en-linea/solicitar-apostilla-chilena",
  "panama-to-us": "https://panamaconecta.gob.pa/servicios",
  "venezuela-to-us": "https://tramites.saren.gob.ve",
  "ecuador-to-us": "https://serviciosdigitales.cancilleria.gob.ec",
  "guatemala-to-us": "https://www.tramites.gob.gt/servicio/1733/",
  "honduras-to-us": "https://tramitedigital.sreci.gob.hn/SOL/web/ciudadano/#/inicio",
  "el-salvador-to-us": "https://apostilla.rree.gob.sv/",
  "dominican-republic-to-us": "https://servicios360.mirex.gob.do/apostillas-legalizaciones/",
  "bolivia-to-us": "https://apostilla.rree.gob.bo/",
  "costa-rica-to-us": "https://www.rree.go.cr/?cat=autenticaciones&sec=servicios",
  "nicaragua-to-us": "https://citas.cancilleria.gob.ni/",
  "uruguay-to-us":
    "https://www.gub.uy/tramites/apostilla-yo-legalizacion-documentos-publicos-uruguayos-extranjeros-produzcan-efectos-exterior-republica",
  "paraguay-to-us": "https://www.mre.gov.py/legalizaciones-apostilla/",
  "cuba-to-us": "https://www.minjus.gob.cu/es",
};

const cuba = LATAM_COUNTRY_CORRIDORS.find((c) => c.slug === "cuba-to-us");
assert.ok(cuba);
assert.match(cuba.officialNoteEn, /not a party to the Apostille/i, "Cuba is not an Apostille state");
assert.match(cuba.officialNoteEs, /no es parte del Convenio de Apostilla/i);
assert.ok(!/in force 2023/i.test(cuba.officialNoteEn), "do not claim Cuba joined Apostille in 2023");

for (const c of GENERATED_COUNTRY_CORRIDORS) {
  const en = FEATURE_PAGES.find((p) => p.slug === c.slug);
  assert.ok(en, `missing FEATURE_PAGES ${c.slug}`);
  assert.equal(en.xDefault, "es", `${c.slug} x-default must be Spanish`);
  assert.equal(en.ctaTo, "/packets/latam-to-us", `${c.slug} must convert to the LATAM package`);
  assert.match(en.ctaLabel, /\$10\/month|subscription/i, `${c.slug} CTA must name the $10 subscription`);
  assert.match(en.seoDescription, /\$10\/month USD subscription/, `${c.slug} SEO must name the subscription`);
  const es = getFeaturePageContent(c.slug, "es");
  assert.ok(es?.seoTitle, `${c.slug} needs Spanish copy`);
  assert.equal(es.ctaTo, "/packets/latam-to-us");
  assert.match(es.ctaLabel, /\$10\/mes/, `${c.slug} ES CTA must name $10/mes`);
  assert.match(es.seoDescription, /suscripción de USD \$10\/mes/, `${c.slug} ES SEO must name the subscription`);
  assert.ok(
    es.relatedLinks.some((l) => l.to === c.officialHref),
    `${c.slug} must link official apostille ${c.officialHref}`
  );
  if (officialBySlug[c.slug]) {
    assert.equal(c.officialHref, officialBySlug[c.slug], `${c.slug} official apostille URL`);
  }
}

fs.unlinkSync(out);
fs.unlinkSync(marketingOut);
console.log("seoLatam.test.mjs: ok");

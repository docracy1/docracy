import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `whoFilesWhere-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/whoFilesWhere.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const {
  OFFICIAL_DESTINATIONS,
  WHO_FILES_ROWS,
  WHO_FILES_GROUPS,
  officialHrefsInPlaybook,
  WHO_FILES_WHERE_EN,
  WHO_FILES_WHERE_ES,
} = createRequire(import.meta.url)(out);

assert.equal(WHO_FILES_WHERE_EN, "/who-files-where");
assert.equal(WHO_FILES_WHERE_ES, "/es/quien-sube-donde");

assert.equal(OFFICIAL_DESTINATIONS.uscisI9, "https://www.uscis.gov/i-9");
assert.equal(OFFICIAL_DESTINATIONS.eVerify, "https://www.e-verify.gov/");
assert.equal(OFFICIAL_DESTINATIONS.ceac, "https://ceac.state.gov/genniv/");
assert.equal(OFFICIAL_DESTINATIONS.uscisAccount, "https://myaccount.uscis.gov/");
assert.equal(OFFICIAL_DESTINATIONS.uscisAddress, "https://www.uscis.gov/addresschange");
assert.equal(OFFICIAL_DESTINATIONS.i94, "https://i94.cbp.dhs.gov/I94/#/home");
assert.equal(OFFICIAL_DESTINATIONS.ssn, "https://www.ssa.gov/ssnumber/");
assert.equal(OFFICIAL_DESTINATIONS.itin, "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin");
assert.equal(OFFICIAL_DESTINATIONS.w7, "https://www.irs.gov/forms-pubs/about-form-w-7");
assert.equal(OFFICIAL_DESTINATIONS.w9, "https://www.irs.gov/forms-pubs/about-form-w-9");

assert.ok(WHO_FILES_ROWS.some((r) => r.id === "everify"));
assert.ok(WHO_FILES_ROWS.every((r) => r.weDontKey.startsWith("whoFiles.weDont.")));
assert.ok(WHO_FILES_ROWS.every((r) => WHO_FILES_GROUPS.includes(r.group)));
assert.equal(new Set(WHO_FILES_ROWS.map((r) => r.id)).size, WHO_FILES_ROWS.length);

for (const href of officialHrefsInPlaybook()) {
  assert.match(href, /^https:\/\//, href);
  assert.ok(!/brazil|cnj\.jus\.br|e-apostila/i.test(href), `no Brazil hosts: ${href}`);
}

const blob = WHO_FILES_ROWS.map((r) => `${r.titleKey} ${r.bodyKey} ${r.weDontKey}`).join(" ");
assert.ok(!/w-8ben|w8ben/i.test(blob));
assert.ok(WHO_FILES_ROWS.some((r) => r.officialHref === OFFICIAL_DESTINATIONS.eVerify));

const corridorsOut = path.join(os.tmpdir(), `whoFilesWhere-corr-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/latamCountryCorridors.ts")],
  outfile: corridorsOut,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { LATAM_COUNTRY_CORRIDORS } = createRequire(import.meta.url)(corridorsOut);
assert.ok(LATAM_COUNTRY_CORRIDORS.every((c) => officialHrefsInPlaybook().includes(c.officialHref)));
assert.ok(!LATAM_COUNTRY_CORRIDORS.some((c) => /brazil|puerto-rico/i.test(c.slug)));
const cuba = LATAM_COUNTRY_CORRIDORS.find((c) => c.slug === "cuba-to-us");
assert.equal(cuba.officialHref, "https://www.minjus.gob.cu/es");

const paths = fs.readFileSync(path.join(__dirname, "../src/lib/i18n/paths.ts"), "utf8");
assert.ok(paths.includes('"/who-files-where": "/es/quien-sube-donde"'));

fs.unlinkSync(out);
fs.unlinkSync(corridorsOut);
console.log("whoFilesWhere.test.mjs: ok");

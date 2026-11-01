import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The landing page ships a copy of four catalog entries and the catalog size (lib/featuredTemplates.ts)
// so the eager bundle stays free of the template data. This keeps the copy honest.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
function load(entry) {
  const out = path.join(os.tmpdir(), `${path.basename(entry, ".ts")}-test-${process.pid}.cjs`);
  buildSync({ entryPoints: [path.join(__dirname, "../src/lib", entry)], outfile: out, bundle: true, platform: "node", format: "cjs", logLevel: "silent" });
  const mod = require(out);
  fs.unlinkSync(out);
  return mod;
}
const { FREE_TEMPLATES } = load("freeTemplates.ts");
const { FEATURED_TEMPLATES, FREE_TEMPLATE_COUNT } = load("featuredTemplates.ts");

assert.equal(FREE_TEMPLATE_COUNT, FREE_TEMPLATES.length, "FREE_TEMPLATE_COUNT must equal FREE_TEMPLATES.length");
assert.equal(FEATURED_TEMPLATES.length, 4);
for (const f of FEATURED_TEMPLATES) {
  const t = FREE_TEMPLATES.find((x) => x.slug === f.slug);
  assert.ok(t, `featured template ${f.slug} is not in the catalog`);
  for (const k of ["name", "description", "pdfPath"]) assert.equal(f[k], t[k], `${f.slug}.${k} drifted from the catalog`);
}
console.log("featuredTemplates.test.mjs: ok");

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `pricingLatamLead-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/planRows.tsx")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
  jsx: "automatic",
});
const { pricingPlanRows } = createRequire(import.meta.url)(out);

const es = pricingPlanRows("es").map((r) => r.labelKey);
assert.equal(es[0], "plan.immigrantPacket");
assert.ok(es.indexOf("plan.cobro") < es.indexOf("plan.signersPerDoc"));
assert.ok(es.indexOf("plan.constancia") < es.indexOf("plan.signersPerDoc"));

const en = pricingPlanRows("en").map((r) => r.labelKey);
assert.equal(en[0], "plan.signersPerDoc");
assert.ok(!en.includes("plan.immigrantPacket"));

console.log("pricingLatamLead.test.mjs: ok");

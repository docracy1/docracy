import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `latamCheckout-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/latamCheckout.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { isLatamLoginIntent, loginWithCheckout, pricingCheckoutPath, pricingUpgradeHref } =
  createRequire(import.meta.url)(out);

assert.equal(isLatamLoginIntent("latam-to-us", ""), true);
assert.equal(isLatamLoginIntent("cobro", ""), true);
assert.equal(isLatamLoginIntent("", "/es/kit-llegar-eeuu"), true);
assert.equal(isLatamLoginIntent("", "/es/precios?checkout=1"), true);
assert.equal(isLatamLoginIntent("prepare-sent", "/dashboard"), false);

assert.equal(
  loginWithCheckout("/es/kit-llegar-eeuu", "latam-to-us"),
  "/login?next=%2Fes%2Fkit-llegar-eeuu%3Fcheckout%3D1&ref=latam-to-us"
);
assert.equal(pricingCheckoutPath("es"), "/es/precios?checkout=1");
assert.equal(pricingUpgradeHref({ id: "a" }, "es", "prepare-cap"), "/es/precios?checkout=1");
assert.match(pricingUpgradeHref(null, "es", "prepare-cap"), /ref=prepare-cap/);

fs.unlinkSync(out);
console.log("latamCheckout.test.mjs: ok");

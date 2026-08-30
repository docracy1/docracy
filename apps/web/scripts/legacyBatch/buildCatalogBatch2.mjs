#!/usr/bin/env node
/**
 * Batch 2 catalog: template_topic_queue editorial briefs (docracy.com taxonomy)
 * plus docracy.com URL cluster briefs — expanded to full FreeTemplate SEO fields.
 * No Workers AI. Run: node apps/web/scripts/legacyBatch/buildCatalogBatch2.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOPIC_QUEUE_SPECS } from "./extractTopicQueue.mjs";
import { pickDocracyClusterSpecs } from "./pickDocracyClusters.mjs";
import { expandSpec } from "./expandSpec.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../../..");
const OUT = path.join(__dirname, "catalog-batch2.json");
const TARGET = 500;

function loadExistingSlugs() {
  const s = new Set();
  for (const f of [
    "apps/web/src/lib/freeTemplates.ts",
    "apps/web/src/lib/freeTemplatesLegacyBatch.ts",
  ]) {
    for (const m of fs.readFileSync(path.join(ROOT, f), "utf8").matchAll(/slug: "([^"]+)"/g)) s.add(m[1]);
  }
  if (fs.existsSync(path.join(__dirname, "catalog.json"))) {
    for (const t of JSON.parse(fs.readFileSync(path.join(__dirname, "catalog.json"), "utf8"))) s.add(t.slug);
  }
  return s;
}

const existing = loadExistingSlugs();
const redirects = JSON.parse(
  fs.readFileSync(path.join(ROOT, "apps/web/src/lib/templateLegacyRedirects.json"), "utf8")
);

/** @type {Array<{ slug: string }>} */
const catalog = [];
const used = new Set(existing);

for (const spec of TOPIC_QUEUE_SPECS) {
  if (catalog.length >= TARGET) break;
  if (used.has(spec.slug)) continue;
  catalog.push(expandSpec(spec));
  used.add(spec.slug);
}

const need = TARGET - catalog.length;
const clusterSpecs = pickDocracyClusterSpecs(used, redirects, need + 50);
for (const spec of clusterSpecs) {
  if (catalog.length >= TARGET) break;
  if (used.has(spec.slug)) continue;
  catalog.push(expandSpec(spec));
  used.add(spec.slug);
}

if (catalog.length < TARGET) {
  console.error(`Warning: only ${catalog.length} entries (target ${TARGET})`);
  process.exit(1);
}

// Strip internal fields before writing
const out = catalog.map(({ source, docracyHits, ...rest }) => rest);
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

const byCat = {};
for (const e of out) byCat[e.recurringCategory] = (byCat[e.recurringCategory] || 0) + 1;
console.log(`Wrote ${out.length} entries to catalog-batch2.json`);
console.log("By category:", byCat);
console.log("First 5 slugs:", out.slice(0, 5).map((e) => e.slug).join(", "));

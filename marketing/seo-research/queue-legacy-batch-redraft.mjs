#!/usr/bin/env node
/**
 * Queue the ~500 thin freeTemplatesLegacyBatch2.ts titles for a real AI redraft via the existing
 * weekly-template pipeline (apps/worker/src/lib/templateWeekly.ts). Their current text (both the
 * on-page SEO fields and the PDF body) is stamped from a fixed archetype/sentence-template with
 * only the clause list swapped in — see scripts/legacyBatch/archetypes.mjs — which is why these
 * pages don't get indexed. Reusing the existing slug means the republished dynamic template takes
 * over the exact same URL once the static entry is removed (see FreeTemplateDetail.tsx /
 * getFreeTemplate) — no redirects needed.
 *
 * Run: node marketing/seo-research/queue-legacy-batch-redraft.mjs
 * Writes: apps/worker/migrations/0035_legacy_batch_redraft_queue.sql
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");

const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "apps/web/scripts/legacyBatch/catalog-batch2.json"), "utf8")
);

function esc(s) {
  return s.replace(/'/g, "''");
}

// Continue past the existing highest ttq_/sort_order in migrations 0026 (108 rows, sort_order up
// to 1080) plus the ttq_109..ttq_128 LATAM rows added later — start comfortably clear at 2000+.
let sortOrder = 2000;
const lines = catalog.map((tpl, i) => {
  const id = `ttqlb2_${String(i + 1).padStart(3, "0")}`;
  const angle =
    `${tpl.signerLabels.length} signers: ${tpl.signerLabels.join(", ")}. ${tpl.description} ` +
    `Placeholders: ${tpl.fillInFields.join(", ")}. Clauses: ${tpl.keyClauses.join(", ")}.`;
  sortOrder += 10;
  return (
    `('${id}', '${esc(tpl.slug)}', '${esc(tpl.name)}', '${esc(tpl.recurringCategory)}', ` +
    `'${esc(angle)}', 'queued', ${sortOrder}, '2026-09-11T00:00:00.000Z')`
  );
});

// One statement per this many rows — a single 500-row INSERT trips D1's statement-size limit
// (SQLITE_TOOBIG), confirmed live against production.
const CHUNK_SIZE = 50;
const chunks = [];
for (let i = 0; i < lines.length; i += CHUNK_SIZE) chunks.push(lines.slice(i, i + CHUNK_SIZE));

const sql =
  `-- Requeue the ~500 thin freeTemplatesLegacyBatch2.ts titles for a real AI redraft via the\n` +
  `-- existing weekly-template pipeline (lib/templateWeekly.ts) — see\n` +
  `-- marketing/seo-research/queue-legacy-batch-redraft.mjs. Same slugs as the current static\n` +
  `-- entries in apps/web/src/lib/freeTemplatesLegacyBatch2.ts; once a row here reaches\n` +
  `-- status='published', that slug's static entry is removed so the URL falls through to the\n` +
  `-- richer, dynamic marketplace_templates row instead (see FreeTemplateDetail.tsx).\n` +
  `-- Chunked into ${CHUNK_SIZE}-row statements — a single 500-row INSERT exceeds D1's per-statement\n` +
  `-- size limit (SQLITE_TOOBIG).\n` +
  chunks
    .map(
      (chunk) =>
        `INSERT OR IGNORE INTO template_topic_queue (id, slug, title, category, angle, status, sort_order, created_at) VALUES\n` +
        chunk.join(",\n") +
        ";\n"
    )
    .join("\n");

const outFile = path.join(ROOT, "apps/worker/migrations/0035_legacy_batch_redraft_queue.sql");
fs.writeFileSync(outFile, sql);
console.log(`Wrote ${catalog.length} rows to ${path.relative(ROOT, outFile)}`);

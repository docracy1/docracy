#!/usr/bin/env node
/** Parse hand-authored template_topic_queue rows from migration 0026. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../../..");
const sql = fs.readFileSync(
  path.join(ROOT, "apps/worker/migrations/0026_template_topic_queue.sql"),
  "utf8"
);

const rows = [...sql.matchAll(/\('ttq_\d+', '([^']+)', '([^']+)', '([^']+)',\s*\n?\s*'([^']*(?:''[^']*)*)'/gs)];

/** @type {Array<{ slug: string, title: string, category: string, angle: string, source: string }>} */
export const TOPIC_QUEUE_SPECS = rows.map((m) => ({
  slug: m[1],
  title: m[2],
  category: m[3],
  angle: m[4].replace(/''/g, "'"),
  source: "template_topic_queue",
}));

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(TOPIC_QUEUE_SPECS, null, 2));
  console.error("count:", TOPIC_QUEUE_SPECS.length);
}

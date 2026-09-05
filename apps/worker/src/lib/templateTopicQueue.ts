import type { Env } from "@docracy/shared";
import { LATAM_JOB_PHRASE_TEMPLATE_PRIORITY_SQL } from "./latamJobPhrasePriority";
import { TEMPLATE_TOPIC_QUEUE_SEED_SQL } from "./templateTopicQueueSeed";

/** Same shape as migrations/0026_template_topic_queue.sql — IF NOT EXISTS so we don't depend on CI D1:Edit. */
const QUEUE_DDL = `
CREATE TABLE IF NOT EXISTS template_topic_queue (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  angle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  published_template_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_template_topic_queue_status_order
  ON template_topic_queue(status, sort_order, created_at);
`;

/** origin/seo_title/use_case live in 0026; the rest in 0025. Each ALTER is ignored if the column exists. */
const MARKETPLACE_COLUMN_ALTERS = [
  "ALTER TABLE marketplace_templates ADD COLUMN origin TEXT NOT NULL DEFAULT 'community'",
  "ALTER TABLE marketplace_templates ADD COLUMN seo_title TEXT",
  "ALTER TABLE marketplace_templates ADD COLUMN use_case TEXT",
  "ALTER TABLE marketplace_templates ADD COLUMN definition TEXT",
  "ALTER TABLE marketplace_templates ADD COLUMN key_clauses TEXT",
  "ALTER TABLE marketplace_templates ADD COLUMN fill_in_fields TEXT",
  "ALTER TABLE marketplace_templates ADD COLUMN legal_summary TEXT",
  "ALTER TABLE marketplace_templates ADD COLUMN chatgpt_prompts TEXT",
];

function isDuplicateColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /duplicate column/i.test(msg);
}

/**
 * Production CI often cannot `wrangler d1 migrations apply` (token lacks D1:Edit).
 * The Worker binding can still write D1, so the Monday/hourly jobs create the queue
 * and add missing marketplace_templates columns themselves.
 */
export async function ensureWeeklyTemplateInfra(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const db = env.DOCRACY_DB;
  await db.exec(QUEUE_DDL);
  for (const sql of MARKETPLACE_COLUMN_ALTERS) {
    try {
      await db.prepare(sql).run();
    } catch (err) {
      if (isDuplicateColumnError(err)) continue;
      console.log(
        `Weekly templates: alter skipped (${err instanceof Error ? err.message : err})`
      );
    }
  }
  await db.exec(TEMPLATE_TOPIC_QUEUE_SEED_SQL);
  await db.exec(LATAM_JOB_PHRASE_TEMPLATE_PRIORITY_SQL);
}

/** True when /api/marketplace?origin=weekly has nothing to show yet. */
export function shouldCatchUpWeeklyTemplates(weeklyCount: number): boolean {
  return weeklyCount === 0;
}

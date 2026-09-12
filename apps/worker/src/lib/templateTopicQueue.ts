import type { Env } from "@docracy/shared";
import { LATAM_JOB_PHRASE_TEMPLATE_PRIORITY_SQL } from "./latamJobPhrasePriority";
import { TEMPLATE_TOPIC_QUEUE_SEED_SQL } from "./templateTopicQueueSeed";

/** Same shape as migrations/0026_template_topic_queue.sql — IF NOT EXISTS so we don't depend on CI D1:Edit.
 *  Two separate statements (not one db.exec() string): D1's real (non-Miniflare) .exec() splits its
 *  input on newlines rather than semicolons, so a single pretty-printed multi-line statement like
 *  this CREATE TABLE gets shredded into invalid fragments — confirmed live against staging D1
 *  ("CREATE TABLE IF NOT EXISTS template_topic_queue (: incomplete input: SQLITE_ERROR"), which is
 *  why the queue-driven weekly cron has silently never published anything in production despite
 *  running for weeks. db.prepare(sql).run() parses the full string as one statement regardless of
 *  internal newlines, so each one runs individually below instead. */
const QUEUE_TABLE_DDL = `
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
)`;
const QUEUE_INDEX_DDL = `
CREATE INDEX IF NOT EXISTS idx_template_topic_queue_status_order
  ON template_topic_queue(status, sort_order, created_at)`;

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

// Per-isolate cache so a warm isolate serving several calls in quick succession (the admin
// drain-template-queue route, in particular) doesn't re-run the full DDL/seed batch every single
// time — each run re-attempts a ~130-row INSERT OR IGNORE plus 8 ALTER TABLE attempts, real D1
// read/write cost that's pure waste once this isolate has already ensured the infra exists. A cold
// isolate (new deploy, idle timeout, different colo) still runs it fresh, which is exactly the
// "don't depend on migrations having been applied" safety net this function exists for.
let infraEnsuredThisIsolate = false;

/**
 * Production CI often cannot `wrangler d1 migrations apply` (token lacks D1:Edit).
 * The Worker binding can still write D1, so the Monday/hourly jobs create the queue
 * and add missing marketplace_templates columns themselves.
 */
export async function ensureWeeklyTemplateInfra(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  if (infraEnsuredThisIsolate) return;
  const db = env.DOCRACY_DB;
  await db.prepare(QUEUE_TABLE_DDL).run();
  await db.prepare(QUEUE_INDEX_DDL).run();
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
  // A single INSERT OR IGNORE statement with ~130 VALUES tuples spread across many lines — same
  // newline-splitting hazard as QUEUE_TABLE_DDL above, so this also goes through prepare().run()
  // as one statement rather than db.exec().
  await db.prepare(TEMPLATE_TOPIC_QUEUE_SEED_SQL).run();
  // Each line here is already a complete, self-contained single-line UPDATE statement, so it's
  // genuinely compatible with db.exec()'s newline-splitting behavior — left as-is.
  await db.exec(LATAM_JOB_PHRASE_TEMPLATE_PRIORITY_SQL);
  infraEnsuredThisIsolate = true;
}

/** Test-only: reset the per-isolate cache between test cases. */
export function resetWeeklyTemplateInfraCacheForTests(): void {
  infraEnsuredThisIsolate = false;
}

/** True when /api/marketplace?origin=weekly has nothing to show yet. */
export function shouldCatchUpWeeklyTemplates(weeklyCount: number): boolean {
  return weeklyCount === 0;
}

import type { Env } from "@docracy/shared";
import { BLOG_TOPIC_QUEUE_LATAM_SEED_SQL } from "./blogTopicQueueSeed";
import { LATAM_JOB_PHRASE_BLOG_PRIORITY_SQL } from "./latamJobPhrasePriority";

/** Same shape as migrations/0018 — IF NOT EXISTS so CI D1:Edit is not required.
 *  Separate statements through prepare().run(), never one db.exec() string: real D1 .exec() splits its
 *  input on newlines, so a multi-line CREATE TABLE arrives as fragments ("CREATE TABLE IF NOT EXISTS
 *  blog_topic_queue (: incomplete input"). That error stopped every Monday blog run from 07.09 to
 *  02.11.2026; templateTopicQueue.ts had the same bug and the same fix earlier. */
const QUEUE_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS blog_topic_queue (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title TEXT NOT NULL,
  angle TEXT NOT NULL,
  cluster TEXT NOT NULL DEFAULT 'Signing',
  status TEXT NOT NULL DEFAULT 'queued',
  published_post_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  published_at TEXT
)`;

const QUEUE_INDEX_DDL = `
CREATE INDEX IF NOT EXISTS idx_blog_topic_queue_status_order
  ON blog_topic_queue(status, sort_order, created_at)`;

/**
 * Production often cannot apply D1 migrations. The Monday blog job can still INSERT OR IGNORE
 * new LATAM topics so the queue does not go empty after 0027 is exhausted.
 */
export async function ensureWeeklyBlogInfra(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const db = env.DOCRACY_DB;
  await db.prepare(QUEUE_TABLE_DDL).run();
  await db.prepare(QUEUE_INDEX_DDL).run();
  // One INSERT OR IGNORE statement spread over many lines: one prepare(), not exec().
  await db.prepare(BLOG_TOPIC_QUEUE_LATAM_SEED_SQL).run();
  // Each line is a complete single-line UPDATE, which is what exec() can handle.
  await db.exec(LATAM_JOB_PHRASE_BLOG_PRIORITY_SQL);
}

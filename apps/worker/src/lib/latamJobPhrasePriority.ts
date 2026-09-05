/** Pull already-routed job-phrase queue rows to the Monday head.
 *  INSERT OR IGNORE never reorders; this UPDATE is idempotent while status='queued'. */

export const LATAM_JOB_PHRASE_BLOG_PRIORITY_SQL = `
UPDATE blog_topic_queue SET sort_order = 1 WHERE id = 'btq_37' AND status = 'queued';
UPDATE blog_topic_queue SET sort_order = 2 WHERE id = 'btq_38' AND status = 'queued';
UPDATE blog_topic_queue SET sort_order = 3 WHERE id = 'btq_39' AND status = 'queued';
UPDATE blog_topic_queue SET sort_order = 4 WHERE id = 'btq_40' AND status = 'queued';
UPDATE blog_topic_queue SET sort_order = 5 WHERE id = 'btq_41' AND status = 'queued';
UPDATE blog_topic_queue SET sort_order = 6 WHERE id = 'btq_42' AND status = 'queued';
UPDATE blog_topic_queue SET sort_order = 7 WHERE id = 'btq_43' AND status = 'queued';
UPDATE blog_topic_queue SET sort_order = 8 WHERE id = 'btq_44' AND status = 'queued';
`;

export const LATAM_JOB_PHRASE_TEMPLATE_PRIORITY_SQL = `
UPDATE template_topic_queue SET sort_order = 1 WHERE id = 'ttq_119' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 2 WHERE id = 'ttq_120' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 3 WHERE id = 'ttq_121' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 4 WHERE id = 'ttq_122' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 5 WHERE id = 'ttq_123' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 6 WHERE id = 'ttq_124' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 7 WHERE id = 'ttq_125' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 8 WHERE id = 'ttq_126' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 9 WHERE id = 'ttq_127' AND status = 'queued';
UPDATE template_topic_queue SET sort_order = 10 WHERE id = 'ttq_128' AND status = 'queued';
`;

const JOB_PHRASE_TEMPLATE_IDS = new Set([
  "ttq_119",
  "ttq_120",
  "ttq_121",
  "ttq_122",
  "ttq_123",
  "ttq_124",
  "ttq_125",
  "ttq_126",
  "ttq_127",
  "ttq_128",
]);

export function isLatamJobPhraseTemplate(id: string): boolean {
  return JOB_PHRASE_TEMPLATE_IDS.has(id);
}

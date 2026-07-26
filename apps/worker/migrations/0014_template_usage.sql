-- Per-workspace, per-template completion counts, driving the "recurring template" detection
-- (recurring badge at 3, suggest-saving at 5, team-plan upsell at 10 — see lib/templateUsage.ts).
-- template_id is either a paid workspace's saved-template id (templates.id) or a free-template
-- slug (lib/freeTemplates.ts) — this table doesn't distinguish the two, since both are just
-- opaque strings from this table's point of view. Necessarily workspace-scoped: an anonymous,
-- account-less document creation has no persistent identity to key a count against at all.
CREATE TABLE template_usage (
  workspace_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  last_completed_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, template_id)
);

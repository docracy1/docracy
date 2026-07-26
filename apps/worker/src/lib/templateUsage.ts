import type { Env } from "@docracy/shared";

/** Thresholds for the "Recurring Templates" feature (see lib/freeTemplates.ts's recurringCategory
 *  and the UI surfaces in Dashboard.tsx/Prepare.tsx/FreeTemplates.tsx): a template a workspace
 *  has completed this many times crosses into "recurring," then "worth saving," then "worth the
 *  team plan" territory. Counts are per (workspace, template) pair — sending the same template 3
 *  times is what counts as recurring, not 3 sends of 3 different templates. */
export const RECURRING_THRESHOLD = 3;
export const SUGGEST_SAVING_THRESHOLD = 5;
export const TEAM_UPSELL_THRESHOLD = 10;

export interface TemplateUsage {
  templateId: string;
  completedCount: number;
  lastCompletedAt: string;
}

interface TemplateUsageRow {
  template_id: string;
  completed_count: number;
  last_completed_at: string;
}

/** Increments (or creates) a workspace's completion count for one template, returning the new
 *  count. Anonymous/free-tier document creation never calls this — there's no workspaceId to key
 *  a count against without a paid account. */
export async function incrementTemplateUsage(env: Env, workspaceId: string, templateId: string): Promise<number> {
  if (!env.DOCRACY_DB) return 0;
  const now = new Date().toISOString();
  await env.DOCRACY_DB.prepare(
    `INSERT INTO template_usage (workspace_id, template_id, completed_count, last_completed_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(workspace_id, template_id) DO UPDATE SET
       completed_count = completed_count + 1, last_completed_at = excluded.last_completed_at`
  )
    .bind(workspaceId, templateId, now)
    .run();

  const row = (await env.DOCRACY_DB.prepare(`SELECT completed_count FROM template_usage WHERE workspace_id = ? AND template_id = ?`)
    .bind(workspaceId, templateId)
    .first()) as { completed_count: number } | null;
  return row?.completed_count ?? 0;
}

export async function getTemplateUsage(env: Env, workspaceId: string, templateId: string): Promise<number> {
  if (!env.DOCRACY_DB) return 0;
  const row = (await env.DOCRACY_DB.prepare(`SELECT completed_count FROM template_usage WHERE workspace_id = ? AND template_id = ?`)
    .bind(workspaceId, templateId)
    .first()) as { completed_count: number } | null;
  return row?.completed_count ?? 0;
}

/** Every template this workspace has ever completed at least once, most-used first — the source
 *  list for the Dashboard Quick Actions / editor template picker's "recurring" surfacing. */
export async function listTemplateUsage(env: Env, workspaceId: string): Promise<TemplateUsage[]> {
  if (!env.DOCRACY_DB) return [];
  const { results } = await env.DOCRACY_DB.prepare(
    `SELECT template_id, completed_count, last_completed_at FROM template_usage
     WHERE workspace_id = ? ORDER BY completed_count DESC, last_completed_at DESC`
  )
    .bind(workspaceId)
    .all<TemplateUsageRow>();
  return results.map((r) => ({ templateId: r.template_id, completedCount: r.completed_count, lastCompletedAt: r.last_completed_at }));
}

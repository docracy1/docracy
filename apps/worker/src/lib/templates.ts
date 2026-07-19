import type { DocField, Env } from "@docracy/shared";

export interface TemplateSummary {
  id: string;
  name: string;
  signerCount: number;
  pageCount: number;
  createdAt: string;
}

interface TemplateRow {
  id: string;
  name: string;
  signer_count: number;
  page_count: number;
  fields: string;
  created_at: string;
}

function rowToSummary(row: TemplateRow): TemplateSummary {
  return { id: row.id, name: row.name, signerCount: row.signer_count, pageCount: row.page_count, createdAt: row.created_at };
}

function r2Key(templateId: string): string {
  return `templates/${templateId}/original.pdf`;
}

/** Templates only ever belong to a paid account — every caller has already gone through
 *  requirePaidAccount, so a missing D1 binding here means the deployment simply hasn't been
 *  configured for it yet, not a real runtime state to recover from. */
function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

export async function createTemplate(
  env: Env,
  accountId: string,
  pdfBytes: Uint8Array,
  name: string,
  signerCount: number,
  pageCount: number,
  fields: DocField[]
): Promise<{ templateId: string }> {
  const db = requireDb(env);
  const templateId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO templates (id, account_id, name, signer_count, page_count, fields, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(templateId, accountId, name, signerCount, pageCount, JSON.stringify(fields), new Date().toISOString())
    .run();
  await env.DOCRACY_DOCS.put(r2Key(templateId), pdfBytes);
  return { templateId };
}

export async function listTemplates(env: Env, accountId: string): Promise<TemplateSummary[]> {
  const db = requireDb(env);
  const { results } = await db
    .prepare(`SELECT * FROM templates WHERE account_id = ? ORDER BY created_at DESC`)
    .bind(accountId)
    .all<TemplateRow>();
  return results.map(rowToSummary);
}

export async function getTemplate(
  env: Env,
  accountId: string,
  templateId: string
): Promise<{ summary: TemplateSummary; fields: DocField[]; pdfBytes: Uint8Array } | null> {
  const db = requireDb(env);
  // Scoped by account_id in the same query (not a separate ownership check after the fact) so a
  // template belonging to another account resolves as "not found" — never distinguishable from a
  // template that doesn't exist at all.
  const row = await db
    .prepare(`SELECT * FROM templates WHERE id = ? AND account_id = ?`)
    .bind(templateId, accountId)
    .first<TemplateRow>();
  if (!row) return null;

  const obj = await env.DOCRACY_DOCS.get(r2Key(templateId));
  if (!obj) return null;
  const pdfBytes = new Uint8Array(await obj.arrayBuffer());

  return { summary: rowToSummary(row), fields: JSON.parse(row.fields) as DocField[], pdfBytes };
}

export async function deleteTemplate(env: Env, accountId: string, templateId: string): Promise<boolean> {
  const db = requireDb(env);
  // A SELECT-then-DELETE rather than trusting a row-count from the DELETE itself, so ownership is
  // checked the same way (and as portably) as getTemplate above.
  const row = await db.prepare(`SELECT id FROM templates WHERE id = ? AND account_id = ?`).bind(templateId, accountId).first();
  if (!row) return false;
  await db.prepare(`DELETE FROM templates WHERE id = ?`).bind(templateId).run();
  await env.DOCRACY_DOCS.delete(r2Key(templateId));
  return true;
}

import type { DocField, Env } from "@docracy/shared";
import { slugify } from "./blogPosts";

export interface MarketplaceTemplateSummary {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string;
  signerCount: number;
  pageCount: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

interface MarketplaceTemplateRow {
  id: string;
  account_id: string;
  source_template_id: string | null;
  slug: string;
  title: string;
  category: string | null;
  description: string;
  signer_count: number;
  page_count: number;
  fields: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

function rowToSummary(row: MarketplaceTemplateRow): MarketplaceTemplateSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
    signerCount: row.signer_count,
    pageCount: row.page_count,
    status: row.status,
    rejectionReason: row.rejection_reason,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

function r2Key(id: string): string {
  return `marketplace/${id}/template.pdf`;
}

function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

const MAX_PENDING_PER_ACCOUNT = 5;

/** A slug clash (same title submitted twice, or colliding with an existing one) appends a short
 *  random suffix rather than erroring — submitters shouldn't have to pick a unique slug by hand. */
async function uniqueSlug(env: Env, title: string): Promise<string> {
  const db = requireDb(env);
  const base = slugify(title) || "template";
  let candidate = base;
  let attempt = 0;
  while (await db.prepare(`SELECT id FROM marketplace_templates WHERE slug = ?`).bind(candidate).first()) {
    attempt += 1;
    candidate = `${base}-${crypto.randomUUID().slice(0, 6)}`;
    if (attempt > 5) break;
  }
  return candidate;
}

export async function countPendingForAccount(env: Env, accountId: string): Promise<number> {
  const db = requireDb(env);
  const row = await db
    .prepare(`SELECT COUNT(*) as n FROM marketplace_templates WHERE account_id = ? AND status = 'pending'`)
    .bind(accountId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function submitTemplate(
  env: Env,
  accountId: string | null,
  input: {
    sourceTemplateId: string | null;
    title: string;
    category: string | null;
    description: string;
    signerCount: number;
    pageCount: number;
    fields: DocField[];
    pdfBytes: Uint8Array;
  }
): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  // Anonymous submitters have no account to cap by — the route layer enforces a per-IP rate
  // limit instead (see checkMarketplaceSubmitRateLimit).
  if (accountId) {
    const pending = await countPendingForAccount(env, accountId);
    if (pending >= MAX_PENDING_PER_ACCOUNT) {
      return { ok: false, error: `You already have ${MAX_PENDING_PER_ACCOUNT} submissions awaiting review.` };
    }
  }

  const db = requireDb(env);
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(env, input.title);

  await db
    .prepare(
      `INSERT INTO marketplace_templates
        (id, account_id, source_template_id, slug, title, category, description, signer_count, page_count, fields, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
    .bind(
      id,
      accountId,
      input.sourceTemplateId,
      slug,
      input.title,
      input.category,
      input.description,
      input.signerCount,
      input.pageCount,
      JSON.stringify(input.fields),
      new Date().toISOString()
    )
    .run();
  await env.DOCRACY_DOCS.put(r2Key(id), input.pdfBytes);

  return { ok: true, id, slug };
}

export async function listSubmissionsForAccount(env: Env, accountId: string): Promise<MarketplaceTemplateSummary[]> {
  const db = requireDb(env);
  const { results } = await db
    .prepare(`SELECT * FROM marketplace_templates WHERE account_id = ? ORDER BY submitted_at DESC`)
    .bind(accountId)
    .all<MarketplaceTemplateRow>();
  return results.map(rowToSummary);
}

export async function listPending(env: Env): Promise<MarketplaceTemplateSummary[]> {
  const db = requireDb(env);
  const { results } = await db
    .prepare(`SELECT * FROM marketplace_templates WHERE status = 'pending' ORDER BY submitted_at ASC`)
    .all<MarketplaceTemplateRow>();
  return results.map(rowToSummary);
}

export async function listApproved(env: Env, category?: string): Promise<MarketplaceTemplateSummary[]> {
  const db = requireDb(env);
  const { results } = category
    ? await db
        .prepare(`SELECT * FROM marketplace_templates WHERE status = 'approved' AND category = ? ORDER BY reviewed_at DESC`)
        .bind(category)
        .all<MarketplaceTemplateRow>()
    : await db.prepare(`SELECT * FROM marketplace_templates WHERE status = 'approved' ORDER BY reviewed_at DESC`).all<MarketplaceTemplateRow>();
  return results.map(rowToSummary);
}

export async function getApprovedBySlug(
  env: Env,
  slug: string
): Promise<{ summary: MarketplaceTemplateSummary; fields: DocField[]; pdfBytes: Uint8Array } | null> {
  const db = requireDb(env);
  const row = await db
    .prepare(`SELECT * FROM marketplace_templates WHERE slug = ? AND status = 'approved'`)
    .bind(slug)
    .first<MarketplaceTemplateRow>();
  if (!row) return null;
  const obj = await env.DOCRACY_DOCS.get(r2Key(row.id));
  if (!obj) return null;
  return { summary: rowToSummary(row), fields: JSON.parse(row.fields) as DocField[], pdfBytes: new Uint8Array(await obj.arrayBuffer()) };
}

/** Admin-only: fetch any submission regardless of status, with its PDF, for the review panel. */
export async function getSubmissionForReview(
  env: Env,
  id: string
): Promise<{ summary: MarketplaceTemplateSummary; fields: DocField[]; pdfBytes: Uint8Array } | null> {
  const db = requireDb(env);
  const row = await db.prepare(`SELECT * FROM marketplace_templates WHERE id = ?`).bind(id).first<MarketplaceTemplateRow>();
  if (!row) return null;
  const obj = await env.DOCRACY_DOCS.get(r2Key(row.id));
  if (!obj) return null;
  return { summary: rowToSummary(row), fields: JSON.parse(row.fields) as DocField[], pdfBytes: new Uint8Array(await obj.arrayBuffer()) };
}

export async function reviewSubmission(
  env: Env,
  id: string,
  decision: { status: "approved" | "rejected"; reviewedBy: string; rejectionReason?: string }
): Promise<boolean> {
  const db = requireDb(env);
  const row = await db.prepare(`SELECT id FROM marketplace_templates WHERE id = ? AND status = 'pending'`).bind(id).first();
  if (!row) return false;
  await db
    .prepare(
      `UPDATE marketplace_templates SET status = ?, rejection_reason = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?`
    )
    .bind(decision.status, decision.rejectionReason ?? null, new Date().toISOString(), decision.reviewedBy, id)
    .run();
  return true;
}

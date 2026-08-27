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
  /** 'community' = human Marketplace submit; 'weekly' = Monday cron (FreeTemplate-parity). */
  origin: "community" | "weekly";
  /** Same optional LLM/ChatGPT-optimization fields as FreeTemplate (freeTemplates.ts) — see the
   *  0025/0026 migrations. Required on weekly-cron rows; often null on human submissions. */
  seoTitle: string | null;
  useCase: string | null;
  definition: string | null;
  keyClauses: string[] | null;
  fillInFields: string[] | null;
  legalSummary: string | null;
  chatgptPrompts: string[] | null;
}

interface MarketplaceTemplateRow {
  id: string;
  account_id: string | null;
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
  origin: "community" | "weekly" | null;
  seo_title: string | null;
  use_case: string | null;
  definition: string | null;
  key_clauses: string | null;
  fill_in_fields: string | null;
  legal_summary: string | null;
  chatgpt_prompts: string | null;
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
    origin: row.origin === "weekly" ? "weekly" : "community",
    seoTitle: row.seo_title,
    useCase: row.use_case,
    definition: row.definition,
    keyClauses: row.key_clauses ? JSON.parse(row.key_clauses) : null,
    fillInFields: row.fill_in_fields ? JSON.parse(row.fill_in_fields) : null,
    legalSummary: row.legal_summary,
    chatgptPrompts: row.chatgpt_prompts ? JSON.parse(row.chatgpt_prompts) : null,
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
    definition?: string | null;
    keyClauses?: string[] | null;
    fillInFields?: string[] | null;
    legalSummary?: string | null;
    chatgptPrompts?: string[] | null;
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
        (id, account_id, source_template_id, slug, title, category, description, signer_count, page_count, fields,
         status, submitted_at, definition, key_clauses, fill_in_fields, legal_summary, chatgpt_prompts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
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
      new Date().toISOString(),
      input.definition ?? null,
      input.keyClauses ? JSON.stringify(input.keyClauses) : null,
      input.fillInFields ? JSON.stringify(input.fillInFields) : null,
      input.legalSummary ?? null,
      input.chatgptPrompts ? JSON.stringify(input.chatgptPrompts) : null
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
  // Human community submissions only — Monday-cron official rows use listWeeklyOfficial / ?origin=weekly.
  const { results } = category
    ? await db
        .prepare(
          `SELECT * FROM marketplace_templates
           WHERE status = 'approved' AND origin = 'community' AND category = ?
           ORDER BY reviewed_at DESC`
        )
        .bind(category)
        .all<MarketplaceTemplateRow>()
    : await db
        .prepare(
          `SELECT * FROM marketplace_templates
           WHERE status = 'approved' AND origin = 'community'
           ORDER BY reviewed_at DESC`
        )
        .all<MarketplaceTemplateRow>();
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

/**
 * Monday-cron path: insert already-approved with origin='weekly' and the full FreeTemplate SEO
 * catalog (seoTitle, useCase, definition, …). Never used for human Marketplace submits.
 */
export async function publishOfficialTemplate(
  env: Env,
  input: {
    slugHint: string;
    title: string;
    seoTitle: string;
    category: string;
    description: string;
    useCase: string;
    signerCount: number;
    pageCount: number;
    fields: DocField[];
    pdfBytes: Uint8Array;
    definition: string;
    keyClauses: string[];
    fillInFields: string[];
    legalSummary: string;
    chatgptPrompts: string[];
  }
): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const db = requireDb(env);
  const id = crypto.randomUUID();
  // Prefer the queue slug when free; uniqueSlug() still dedupes on collision.
  const base = slugify(input.slugHint) || slugify(input.title) || "template";
  let slug = base;
  if (await db.prepare(`SELECT id FROM marketplace_templates WHERE slug = ?`).bind(slug).first()) {
    slug = await uniqueSlug(env, input.title);
  }
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO marketplace_templates
        (id, account_id, source_template_id, slug, title, category, description, signer_count, page_count, fields,
         status, submitted_at, reviewed_at, reviewed_by, origin, seo_title, use_case,
         definition, key_clauses, fill_in_fields, legal_summary, chatgpt_prompts)
       VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, 'weekly-cron', 'weekly', ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      slug,
      input.title,
      input.category,
      input.description,
      input.signerCount,
      input.pageCount,
      JSON.stringify(input.fields),
      now,
      now,
      input.seoTitle,
      input.useCase,
      input.definition,
      JSON.stringify(input.keyClauses),
      JSON.stringify(input.fillInFields),
      input.legalSummary,
      JSON.stringify(input.chatgptPrompts)
    )
    .run();
  await env.DOCRACY_DOCS.put(r2Key(id), input.pdfBytes);
  return { ok: true, id, slug };
}

/** Newest Monday-cron (origin=weekly) templates — powers /free-templates#newest. */
export async function listWeeklyOfficial(env: Env, limit = 10): Promise<MarketplaceTemplateSummary[]> {
  const db = requireDb(env);
  const { results } = await db
    .prepare(
      `SELECT * FROM marketplace_templates
       WHERE status = 'approved' AND origin = 'weekly'
       ORDER BY reviewed_at DESC LIMIT ?`
    )
    .bind(limit)
    .all<MarketplaceTemplateRow>();
  return results.map(rowToSummary);
}

/** All weekly official templates for the public sitemap (capped). */
export async function listWeeklyOfficialForSitemap(
  env: Env,
  limit = 500
): Promise<Array<{ slug: string; lastmod: string }>> {
  if (!env.DOCRACY_DB) return [];
  const db = env.DOCRACY_DB;
  const { results } = await db
    .prepare(
      `SELECT slug, reviewed_at, submitted_at FROM marketplace_templates
       WHERE status = 'approved' AND origin = 'weekly'
       ORDER BY reviewed_at DESC LIMIT ?`
    )
    .bind(limit)
    .all<{ slug: string; reviewed_at: string | null; submitted_at: string }>();
  return results.map((r) => ({
    slug: r.slug,
    lastmod: (r.reviewed_at ?? r.submitted_at).slice(0, 10),
  }));
}

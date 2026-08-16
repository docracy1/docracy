import { Hono } from "hono";
import { requirePaidAccount, requireAdminAccount, type AccountContext } from "../lib/auth";
import { getTemplate } from "../lib/templates";
import {
  submitTemplate,
  listSubmissionsForAccount,
  listPending,
  listApproved,
  getApprovedBySlug,
  getSubmissionForReview,
  reviewSubmission,
} from "../lib/marketplaceTemplates";
import { bytesToBase64 } from "../lib/base64";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 400;

// Mounted at /api/account/marketplace — paid accounts submitting/checking their own submissions.
export const marketplaceAccount = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SubmitBody {
  templateId: string;
  title?: string;
  category?: string;
  description?: string;
}

marketplaceAccount.post("/submit", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  const account = c.get("account")!;

  let body: SubmitBody;
  try {
    body = await c.req.json<SubmitBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.templateId) return c.json({ error: "templateId is required" }, 400);

  const source = await getTemplate(c.env, account.workspaceId, body.templateId);
  if (!source) return c.json({ error: "Template not found" }, 404);

  const title = body.title?.trim() || source.summary.name;
  if (title.length > MAX_TITLE_LENGTH) return c.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters` }, 400);
  const description = (body.description ?? "").trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return c.json({ error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters` }, 400);
  }

  const result = await submitTemplate(c.env, account.workspaceId, {
    sourceTemplateId: body.templateId,
    title,
    category: body.category?.trim() || null,
    description,
    signerCount: source.summary.signerCount,
    pageCount: source.summary.pageCount,
    fields: source.fields,
    pdfBytes: source.pdfBytes,
  });
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true, id: result.id, slug: result.slug });
});

marketplaceAccount.get("/submissions", requirePaidAccount, async (c) => {
  const account = c.get("account")!;
  const submissions = await listSubmissionsForAccount(c.env, account.workspaceId);
  return c.json({ submissions });
});

// Mounted at /api/marketplace — public, no auth.
export const marketplacePublic = new Hono<{ Bindings: Env; Variables: Variables }>();

marketplacePublic.get("/", async (c) => {
  const category = c.req.query("category") || undefined;
  const templates = await listApproved(c.env, category);
  return c.json({ templates });
});

marketplacePublic.get("/:slug/pdf", async (c) => {
  const result = await getApprovedBySlug(c.env, c.req.param("slug"));
  if (!result) return c.json({ error: "Not found" }, 404);
  return new Response(result.pdfBytes, { headers: { "Content-Type": "application/pdf" } });
});

marketplacePublic.get("/:slug", async (c) => {
  const result = await getApprovedBySlug(c.env, c.req.param("slug"));
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json({
    title: result.summary.title,
    category: result.summary.category,
    description: result.summary.description,
    signerCount: result.summary.signerCount,
    fields: result.fields,
    pdfBase64: bytesToBase64(result.pdfBytes),
  });
});

// Mounted at /api/admin/marketplace — review queue.
export const marketplaceAdmin = new Hono<{ Bindings: Env; Variables: Variables }>();

marketplaceAdmin.get("/pending", requireAdminAccount, async (c) => {
  const pending = await listPending(c.env);
  return c.json({ pending });
});

marketplaceAdmin.get("/:id/preview", requireAdminAccount, async (c) => {
  const result = await getSubmissionForReview(c.env, c.req.param("id"));
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json({
    summary: result.summary,
    fields: result.fields,
    pdfBase64: bytesToBase64(result.pdfBytes),
  });
});

interface ReviewBody {
  rejectionReason?: string;
}

marketplaceAdmin.post("/:id/approve", requireAdminAccount, async (c) => {
  const account = c.get("account")!;
  // Every PDF must be checked for real names/addresses/company info baked into the document body
  // (not just its field placeholders) before approval — a submission going public under Docracy's
  // name is a privacy/liability surface, not just a content-quality one.
  const ok = await reviewSubmission(c.env, c.req.param("id"), { status: "approved", reviewedBy: account.email });
  if (!ok) return c.json({ error: "Submission not found or already reviewed" }, 404);
  return c.json({ ok: true });
});

marketplaceAdmin.post("/:id/reject", requireAdminAccount, async (c) => {
  const account = c.get("account")!;
  let body: ReviewBody = {};
  try {
    body = await c.req.json<ReviewBody>();
  } catch {
    // Rejection reason is optional — an empty/invalid body just means none was given.
  }
  const ok = await reviewSubmission(c.env, c.req.param("id"), {
    status: "rejected",
    reviewedBy: account.email,
    rejectionReason: body.rejectionReason?.trim() || undefined,
  });
  if (!ok) return c.json({ error: "Submission not found or already reviewed" }, 404);
  return c.json({ ok: true });
});

import { Hono } from "hono";
import { PDFDocument } from "pdf-lib";
import { requirePaidAccount, requireAdminAccount, optionalAccount, type AccountContext } from "../lib/auth";
import { getTemplate } from "../lib/templates";
import { checkMarketplaceSubmitRateLimit } from "../lib/ratelimit";
import { verifyTurnstile } from "../lib/turnstile";
import {
  submitTemplate,
  listSubmissionsForAccount,
  listPending,
  listApproved,
  listWeeklyOfficial,
  listWeeklyOfficialForSitemap,
  getApprovedBySlug,
  getSubmissionForReview,
  reviewSubmission,
} from "../lib/marketplaceTemplates";
import { bytesToBase64 } from "../lib/base64";
import type { DocField, Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 400;
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB, same limit as document creation and saved templates

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

marketplacePublic.get("/sitemap.xml", async (c) => {
  const rows = await listWeeklyOfficialForSitemap(c.env);
  const urls = rows
    .map(
      (r) =>
        `  <url>\n    <loc>https://docracy.io/free-templates/${r.slug}</loc>\n    <lastmod>${r.lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
});

marketplacePublic.get("/", async (c) => {
  const category = c.req.query("category") || undefined;
  const origin = c.req.query("origin");
  if (origin === "weekly") {
    const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") || 10) || 10));
    const templates = await listWeeklyOfficial(c.env, limit);
    return c.json({ templates });
  }
  const templates = await listApproved(c.env, category);
  return c.json({ templates });
});

interface AnonymousSubmitMeta {
  title: string;
  category?: string;
  description?: string;
  signerCount: number;
  fields: DocField[];
  turnstileToken?: string;
}

/** Open to everyone — signed in or not — unlike POST /api/account/marketplace/submit above,
 *  which only works from an *existing* paid-tier saved template. This takes a document straight
 *  out of Prepare.tsx (any user, any tier) and submits it for review directly, using the same
 *  geometry/signer validation as apps/worker/src/routes/templates.ts's save-a-template endpoint. */
marketplacePublic.post("/submit", optionalAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);

  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkMarketplaceSubmitRateLimit(c.env, ip);
  if (!allowed) return c.json({ error: "Too many submissions from this address. Try again later." }, 429);

  const form = await c.req.parseBody();
  const pdfFile = form["pdf"];
  const metaRaw = form["meta"];
  if (!(pdfFile instanceof File) || typeof metaRaw !== "string") {
    return c.json({ error: "Expected multipart form with 'pdf' file and 'meta' JSON field" }, 400);
  }
  if (pdfFile.size > MAX_PDF_BYTES) {
    return c.json({ error: `PDF must be under ${MAX_PDF_BYTES / (1024 * 1024)}MB` }, 400);
  }

  const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
  const header = new TextDecoder().decode(pdfBytes.slice(0, 5));
  if (header !== "%PDF-") {
    return c.json({ error: "That file doesn't look like a valid PDF" }, 400);
  }

  let pageCount: number;
  try {
    const probe = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pageCount = probe.getPageCount();
  } catch {
    return c.json({ error: "That PDF couldn't be read — it may be corrupted" }, 400);
  }

  let meta: AnonymousSubmitMeta;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return c.json({ error: "Invalid 'meta' JSON" }, 400);
  }

  const turnstileOk = await verifyTurnstile(c.env, meta.turnstileToken, ip);
  if (!turnstileOk) return c.json({ error: "Verification failed — please try again." }, 400);

  const title = meta.title?.trim() ?? "";
  if (!title) return c.json({ error: "A title is required" }, 400);
  if (title.length > MAX_TITLE_LENGTH) return c.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters` }, 400);
  const description = (meta.description ?? "").trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return c.json({ error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters` }, 400);
  }
  if (!Number.isInteger(meta.signerCount) || meta.signerCount < 1) {
    return c.json({ error: "signerCount must be a positive integer" }, 400);
  }
  if (!meta.fields?.every((f) => f.signerOrder >= 1 && f.signerOrder <= meta.signerCount)) {
    return c.json({ error: "A field is assigned to a signer that doesn't exist" }, 400);
  }
  const isFrac = (n: unknown): n is number => typeof n === "number" && n >= 0 && n <= 1;
  const geometryOk = meta.fields?.every(
    (f) =>
      Number.isInteger(f.page) &&
      f.page >= 0 &&
      f.page < pageCount &&
      isFrac(f.xFrac) &&
      isFrac(f.yFrac) &&
      isFrac(f.wFrac) &&
      isFrac(f.hFrac) &&
      f.xFrac + f.wFrac <= 1 &&
      f.yFrac + f.hFrac <= 1
  );
  if (!geometryOk) {
    return c.json({ error: "A signature field is positioned outside the document" }, 400);
  }
  const signerOrdersWithFields = new Set(meta.fields.map((f) => f.signerOrder));
  for (let order = 1; order <= meta.signerCount; order++) {
    if (!signerOrdersWithFields.has(order)) {
      return c.json({ error: `Signer ${order} doesn't have a signature field placed yet` }, 400);
    }
  }

  const account = c.get("account");
  const result = await submitTemplate(c.env, account?.workspaceId ?? null, {
    sourceTemplateId: null,
    title,
    category: meta.category?.trim() || null,
    description,
    signerCount: meta.signerCount,
    pageCount,
    fields: meta.fields,
    pdfBytes,
  });
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true, id: result.id, slug: result.slug });
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
    origin: result.summary.origin,
    seoTitle: result.summary.seoTitle,
    useCase: result.summary.useCase,
    definition: result.summary.definition,
    keyClauses: result.summary.keyClauses,
    fillInFields: result.summary.fillInFields,
    legalSummary: result.summary.legalSummary,
    chatgptPrompts: result.summary.chatgptPrompts,
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

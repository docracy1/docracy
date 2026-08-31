import { Hono } from "hono";
import { PDFDocument } from "pdf-lib";
import { requireAutomationToken } from "../lib/auth";
import { runWeeklyBlogPublish } from "../lib/blogWeekly";
import { createBlogPost, slugify } from "../lib/blogPosts";
import { submitTemplate } from "../lib/marketplaceTemplates";
import { runWeeklyTemplatePublish } from "../lib/templateWeekly";
import type { DocField, Env } from "@docracy/shared";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 400;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

/** Headless-caller-only routes for the scheduled weekly content routine — see
 *  requireAutomationToken's doc comment for why these are token-gated rather than session-based.
 *  Draft-submit routes land in review queues; run-weekly-content mirrors the Monday cron.
 *  Mounted at /api/automation. */
export const automation = new Hono<{ Bindings: Env }>();

/** Same as the Monday 08:22 UTC cron — publish one blog post + up to 10 FreeTemplate templates.
 *  Returns immediately; AI drafting runs in waitUntil (can take several minutes). */
automation.post("/run-weekly-content", requireAutomationToken, async (c) => {
  c.executionCtx.waitUntil(
    Promise.all([
      runWeeklyBlogPublish(c.env).catch((err) => console.error("Weekly blog publish failed:", err)),
      runWeeklyTemplatePublish(c.env).catch((err) => console.error("Weekly template publish failed:", err)),
    ])
  );
  return c.json({ ok: true, started: true });
});

interface DraftBlogPostBody {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

automation.post("/blog-posts", requireAutomationToken, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  let body: DraftBlogPostBody;
  try {
    body = await c.req.json<DraftBlogPostBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.title?.trim()) return c.json({ error: "Title is required" }, 400);
  if (!body.body?.trim()) return c.json({ error: "Body is required" }, 400);

  const slug = body.slug?.trim() || slugify(body.title);
  // publish is deliberately never accepted from the caller — every automated post lands as a
  // draft, full stop, so it always shows up in the admin "Blog posts" tab awaiting a human click.
  const result = await createBlogPost(c.env, {
    slug,
    title: body.title,
    description: body.description ?? "",
    body: body.body,
    publish: false,
  });
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true, id: result.id, slug });
});

interface SubmitTemplateMeta {
  title: string;
  category?: string;
  description?: string;
  signerCount: number;
  fields: DocField[];
  definition?: string;
  keyClauses?: string[];
  fillInFields?: string[];
  legalSummary?: string;
  chatgptPrompts?: string[];
}

automation.post("/marketplace-templates", requireAutomationToken, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);

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
  if (header !== "%PDF-") return c.json({ error: "That file doesn't look like a valid PDF" }, 400);

  let pageCount: number;
  try {
    const probe = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pageCount = probe.getPageCount();
  } catch {
    return c.json({ error: "That PDF couldn't be read — it may be corrupted" }, 400);
  }

  let meta: SubmitTemplateMeta;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return c.json({ error: "Invalid 'meta' JSON" }, 400);
  }

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
  if (!geometryOk) return c.json({ error: "A signature field is positioned outside the document" }, 400);
  const signerOrdersWithFields = new Set(meta.fields.map((f) => f.signerOrder));
  for (let order = 1; order <= meta.signerCount; order++) {
    if (!signerOrdersWithFields.has(order)) {
      return c.json({ error: `Signer ${order} doesn't have a signature field placed yet` }, 400);
    }
  }

  // account_id is null here (same as an anonymous Marketplace submission) — this isn't tied to
  // any workspace, it's the automation identity, and it always lands as 'pending' regardless.
  const result = await submitTemplate(c.env, null, {
    sourceTemplateId: null,
    title,
    category: meta.category?.trim() || null,
    description,
    signerCount: meta.signerCount,
    pageCount,
    fields: meta.fields,
    pdfBytes,
    definition: meta.definition?.trim() || null,
    keyClauses: meta.keyClauses?.length ? meta.keyClauses : null,
    fillInFields: meta.fillInFields?.length ? meta.fillInFields : null,
    legalSummary: meta.legalSummary?.trim() || null,
    chatgptPrompts: meta.chatgptPrompts?.length ? meta.chatgptPrompts : null,
  });
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true, id: result.id, slug: result.slug });
});

import { Hono } from "hono";
import { PDFDocument } from "pdf-lib";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { createTemplate, listTemplates, getTemplate, deleteTemplate } from "../lib/templates";
import { bytesToBase64 } from "../lib/base64";
import type { DocField, Env } from "@docracy/shared";

interface CreateTemplateBody {
  name: string;
  signerCount: number;
  fields: DocField[];
}

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB, same limit as document creation
const MAX_NAME_LENGTH = 100;

type Variables = { account: AccountContext | null };
const templates = new Hono<{ Bindings: Env; Variables: Variables }>();

templates.post("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;

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

  let meta: CreateTemplateBody;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return c.json({ error: "Invalid 'meta' JSON" }, 400);
  }

  const name = meta.name?.trim() ?? "";
  if (!name) {
    return c.json({ error: "A template name is required" }, 400);
  }
  if (name.length > MAX_NAME_LENGTH) {
    return c.json({ error: `Template name must be under ${MAX_NAME_LENGTH} characters` }, 400);
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

  const { templateId } = await createTemplate(c.env, account.workspaceId, pdfBytes, name, meta.signerCount, pageCount, meta.fields);
  return c.json({ templateId });
});

templates.get("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ templates: [] });
  }
  const account = c.get("account")!;
  const templateList = await listTemplates(c.env, account.workspaceId);
  return c.json({ templates: templateList });
});

templates.get("/:id", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  const result = await getTemplate(c.env, account.workspaceId, c.req.param("id"));
  if (!result) {
    return c.json({ error: "Template not found" }, 404);
  }
  return c.json({
    name: result.summary.name,
    signerCount: result.summary.signerCount,
    fields: result.fields,
    pdfBase64: bytesToBase64(result.pdfBytes),
  });
});

templates.delete("/:id", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  const deleted = await deleteTemplate(c.env, account.workspaceId, c.req.param("id"));
  if (!deleted) {
    return c.json({ error: "Template not found" }, 404);
  }
  return c.json({ ok: true });
});

export default templates;

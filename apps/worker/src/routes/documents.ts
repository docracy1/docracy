import { Hono } from "hono";
import { createDocumentCore } from "../lib/documentCreation";
import { checkRateLimit } from "../lib/ratelimit";
import type { DocField, Env } from "@docracy/shared";

interface CreateDocumentBody {
  preparerSigns: boolean;
  preparerEmail?: string;
  signers: Array<{ order: number; name: string; email: string }>;
  fields: DocField[];
}

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const documents = new Hono<{ Bindings: Env }>();

documents.post("/", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env, ip);
  if (!allowed) {
    return c.json({ error: "Too many documents created recently. Please try again later." }, 429);
  }

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

  let meta: CreateDocumentBody;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return c.json({ error: "Invalid 'meta' JSON" }, 400);
  }

  const maxSigners = Number(c.env.FREE_TIER_MAX_SIGNERS);
  if (meta.signers.length === 0) {
    return c.json({ error: "At least one signer is required" }, 400);
  }
  if (meta.signers.length > maxSigners) {
    return c.json(
      { error: `Free plan supports up to ${maxSigners} signers. Paid plan (unlimited signers) is coming soon.` },
      402
    );
  }
  const seenEmails = new Set<string>();
  for (const s of meta.signers) {
    if (!s.name?.trim()) {
      return c.json({ error: "Every signer needs a name" }, 400);
    }
    const email = s.email?.trim().toLowerCase() ?? "";
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: `"${s.email}" doesn't look like a valid email address` }, 400);
    }
    if (seenEmails.has(email)) {
      return c.json({ error: `${s.email} is used for more than one signer` }, 400);
    }
    seenEmails.add(email);
  }
  if (!meta.fields?.every((f) => f.signerOrder >= 1 && f.signerOrder <= meta.signers.length)) {
    return c.json({ error: "A field is assigned to a signer that doesn't exist" }, 400);
  }
  if (meta.preparerEmail && !EMAIL_RE.test(meta.preparerEmail.trim())) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }

  const { docId, statusToken } = await createDocumentCore({
    env: c.env,
    ctx: c.executionCtx,
    pdfBytes,
    filename: pdfFile.name || "document.pdf",
    preparerSigns: meta.preparerSigns,
    preparerEmail: meta.preparerEmail,
    signers: meta.signers,
    fields: meta.fields,
    accountId: null, // the free-tier /prepare flow is always anonymous
  });

  return c.json({ docId, statusToken });
});

export default documents;

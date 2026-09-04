import { Hono } from "hono";
import { PDFDocument } from "pdf-lib";
import { requireAccount, requirePaidAccount, type AccountContext } from "../lib/auth";
import { issueApiToken, hasApiToken } from "../lib/apiTokens";
import { getDoc, putDoc } from "../lib/kv";
import { sendSigningInvite, sendDocumentVoidedNotice } from "../lib/email";
import { indexDocumentCreated, indexVoided, indexSignerReassigned, indexInviteSent } from "../lib/index-d1";
import { deliverWebhookEvent } from "../lib/webhooks";
import { upsertContact } from "../lib/contacts";
import { documentClaimKvKey, type DocumentClaimRecord } from "../lib/documentCreation";
import { signToken, hashOpaqueToken } from "@docracy/shared";
import type { Env, Locale } from "@docracy/shared";
import { checkRateLimit } from "../lib/ratelimit";
import { parsePaymentRequest } from "../lib/paymentRequest";
import { normalizeE164 } from "../lib/whatsapp";
import { resolveTtlDays } from "../lib/docTtl";
import {
  createCobroDocument,
  consumeCobroWhatsapp,
  reportCobroWhatsappOverage,
  sendCobroAgain,
  markCobroPaid,
  getCobroPrefs,
  putCobroPrefs,
  DEFAULT_COBRO_REMIND_DAYS,
  MIN_COBRO_REMIND_DAYS,
  MAX_COBRO_REMIND_DAYS,
} from "../lib/cobro";
import { parseTaxYear, taxYearBounds, hydrateTaxYearRow } from "../lib/taxYear";
import {
  getConstanciaProfile,
  isPdfBytes,
  listCompletedInYear,
  listConstanciaReceipts,
  MAX_CONSTANCIA_RECEIPTS,
  MAX_RECEIPT_BYTES,
  mintConstanciaShare,
  normalizeSubjectName,
  putConstanciaProfile,
  putConstanciaReceipts,
  receiptObjectKey,
  sanitizeReceiptFilename,
  totalsByCurrency,
} from "../lib/constancia";
import { mintPayerShare } from "../lib/payer";

type Variables = { account: AccountContext | null };
const account = new Hono<{ Bindings: Env; Variables: Variables }>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^\d{4,8}$/;
const MAX_REASON_LENGTH = 500;

interface DocumentRow {
  doc_id: string;
  title: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  expires_at: string;
  preparer_signs: number;
  order1_status: string | null;
}

account.get("/documents", requireAccount, async (c) => {
  const acct = c.get("account")!;
  if (!c.env.DOCRACY_DB) {
    return c.json({ documents: [] });
  }

  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT d.doc_id, d.title, d.status, d.created_at, d.completed_at, d.expires_at, d.preparer_signs, s1.status AS order1_status
     FROM documents d
     LEFT JOIN signers s1 ON s1.doc_id = d.doc_id AND s1."order" = 1
     WHERE d.account_id = ?
     ORDER BY d.created_at DESC`
  )
    .bind(acct.workspaceId)
    .all<DocumentRow>();

  const documents = await Promise.all(
    results.map(async (r) => {
      const awaitingYou = r.status === "pending" && !!r.preparer_signs && r.order1_status === "pending";
      const doc = await getDoc(c.env, r.doc_id);
      let signTok: string | null = null;
      if (awaitingYou) {
        const signer = doc?.signers.find((s) => s.order === 1);
        signTok = await signToken(r.doc_id, 1, c.env.TOKEN_SECRET, signer?.linkNonce);
      }
      return {
        docId: r.doc_id,
        title: r.title,
        status: r.status,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        expiresAt: r.expires_at,
        statusToken: await signToken(r.doc_id, 0, c.env.TOKEN_SECRET),
        awaitingYou,
        signToken: signTok,
        kind: doc?.kind === "cobro" ? "cobro" : undefined,
        cobroPaidAt: doc?.cobroPaidAt ?? null,
      };
    })
  );

  return c.json({ documents });
});

/**
 * Attach an anonymous (no accountId) document to the signed-in account using the one-time
 * claimToken returned only to the browser that created it. KV is source of truth; D1 is backfilled.
 */
account.post("/documents/claim", requireAccount, async (c) => {
  const acct = c.get("account")!;
  let body: { claimToken?: string };
  try {
    body = await c.req.json<{ claimToken?: string }>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const claimToken = body.claimToken?.trim();
  if (!claimToken) {
    return c.json({ error: "claimToken is required" }, 400);
  }

  const claimHash = await hashOpaqueToken(claimToken, c.env.TOKEN_SECRET);
  const claimKey = documentClaimKvKey(claimHash);
  const claim = (await c.env.DOCRACY_KV.get(claimKey, "json")) as DocumentClaimRecord | null;
  if (!claim?.docId) {
    return c.json({ error: "Claim not found or expired" }, 404);
  }

  const doc = await getDoc(c.env, claim.docId);
  if (!doc) {
    await c.env.DOCRACY_KV.delete(claimKey);
    return c.json({ error: "Document not found or expired" }, 404);
  }

  if (doc.accountId && doc.accountId !== acct.workspaceId) {
    await c.env.DOCRACY_KV.delete(claimKey);
    return c.json({ error: "Document already claimed by another account" }, 409);
  }

  if (doc.accountId === acct.workspaceId) {
    // Idempotent: already ours — drop the claim token and return success.
    await c.env.DOCRACY_KV.delete(claimKey);
    return c.json({ ok: true, docId: doc.docId, title: doc.title ?? claim.title, alreadyClaimed: true });
  }

  doc.accountId = acct.workspaceId;
  doc.title = doc.title?.trim() || claim.title || "Untitled document";
  await putDoc(c.env, doc);
  await c.env.DOCRACY_KV.delete(claimKey);

  const original = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/original.pdf`);
  if (original) {
    const pdfBytes = new Uint8Array(await original.arrayBuffer());
    c.executionCtx.waitUntil(
      indexDocumentCreated(c.env, doc, pdfBytes).catch((err) =>
        console.error(`D1 indexing (claim) failed for doc ${doc.docId} (non-fatal):`, err)
      )
    );
  } else {
    console.error(`Claim: original.pdf missing for doc ${doc.docId} — KV updated, D1 skipped`);
  }

  return c.json({ ok: true, docId: doc.docId, title: doc.title });
});

account.post("/documents/:docId/void", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const doc = await getDoc(c.env, c.req.param("docId"));
  if (!doc || doc.accountId !== acct.workspaceId) {
    return c.json({ error: "Document not found" }, 404);
  }
  if (doc.status !== "pending") {
    return c.json({ error: "This document is no longer pending" }, 409);
  }

  let body: { reason?: string };
  try {
    body = await c.req.json<{ reason?: string }>();
  } catch {
    body = {};
  }
  const reason = body.reason?.trim();
  if (reason && reason.length > MAX_REASON_LENGTH) {
    return c.json({ error: `Reason must be under ${MAX_REASON_LENGTH} characters` }, 400);
  }

  const now = new Date().toISOString();
  doc.status = "voided";
  doc.voidedAt = now;
  doc.voidedBy = "preparer";
  if (reason) doc.voidReason = reason;
  doc.events = [
    ...(doc.events ?? []),
    {
      type: "voided",
      signerOrder: null,
      ip: c.req.header("CF-Connecting-IP") ?? null,
      userAgent: c.req.header("User-Agent") ?? null,
      timestamp: now,
      pdfSha256: null,
    },
  ];
  await putDoc(c.env, doc);

  c.executionCtx.waitUntil(
    indexVoided(c.env, doc, reason ? { reason } : null).catch((err) =>
      console.error(`D1 indexing (voided) failed for doc ${doc.docId} (non-fatal):`, err)
    )
  );
  c.executionCtx.waitUntil(
    deliverWebhookEvent(c.env, acct.workspaceId, "document.voided", { docId: doc.docId }).catch((err) =>
      console.error(`Webhook delivery (document.voided) failed for doc ${doc.docId} (non-fatal):`, err)
    )
  );

  const statusToken = await signToken(doc.docId, 0, c.env.TOKEN_SECRET);
  const recipients = new Set<string>();
  if (doc.preparerEmail) recipients.add(doc.preparerEmail.trim());
  for (const s of doc.signers) recipients.add(s.email.trim());
  for (const cc of doc.ccRecipients ?? []) recipients.add(cc.email.trim());
  for (const to of recipients) {
    c.executionCtx.waitUntil(
      sendDocumentVoidedNotice(c.env, to, doc, statusToken, reason).catch((err) =>
        console.error(`Void notice email failed for doc ${doc.docId} (non-fatal):`, err)
      )
    );
  }

  return c.json({ ok: true, status: doc.status });
});

account.post("/documents/:docId/signers/:order/reassign", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const order = Number(c.req.param("order"));
  if (!Number.isInteger(order) || order < 1) {
    return c.json({ error: "Invalid signer order" }, 400);
  }

  const doc = await getDoc(c.env, c.req.param("docId"));
  if (!doc || doc.accountId !== acct.workspaceId) {
    return c.json({ error: "Document not found" }, 404);
  }
  if (doc.status !== "pending") {
    return c.json({ error: "This document is no longer pending" }, 409);
  }

  const signer = doc.signers.find((s) => s.order === order);
  if (!signer) return c.json({ error: "Signer not found" }, 404);
  if (signer.status !== "pending") {
    return c.json({ error: "Only a pending signer can be reassigned" }, 409);
  }

  let body: { name?: string; email?: string; pin?: string; saveContact?: boolean; company?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  if (!name) return c.json({ error: "A name is required" }, 400);
  if (!EMAIL_RE.test(email)) return c.json({ error: "That doesn't look like a valid email address" }, 400);
  if (body.pin && !PIN_RE.test(body.pin)) {
    return c.json({ error: "A signer's PIN must be 4-8 digits" }, 400);
  }

  const emailLower = email.toLowerCase();
  if (doc.signers.some((s) => s.order !== order && s.email.trim().toLowerCase() === emailLower)) {
    return c.json({ error: "That email is already used by another signer" }, 400);
  }

  const prior = { name: signer.name, email: signer.email, replacedAt: new Date().toISOString() };
  signer.priorAssignees = [...(signer.priorAssignees ?? []), prior];
  signer.name = name;
  signer.email = email;
  signer.linkNonce = crypto.randomUUID();
  signer.viewedAt = null;
  signer.remindersSent = [];
  signer.completionNudgesSent = [];
  signer.pinHash = body.pin ? await hashOpaqueToken(body.pin, c.env.TOKEN_SECRET) : undefined;

  const shouldInvite =
    (doc.signingMode ?? "sequential") === "parallel" || Boolean(signer.linkSentAt);
  if (shouldInvite) {
    signer.linkSentAt = new Date().toISOString();
  }

  doc.events = [
    ...(doc.events ?? []),
    {
      type: "reassigned",
      signerOrder: order,
      ip: c.req.header("CF-Connecting-IP") ?? null,
      userAgent: c.req.header("User-Agent") ?? null,
      timestamp: prior.replacedAt,
      pdfSha256: null,
    },
    ...(shouldInvite
      ? [
          {
            type: "invite_sent" as const,
            signerOrder: order,
            ip: null,
            userAgent: null,
            timestamp: signer.linkSentAt!,
            pdfSha256: null,
          },
        ]
      : []),
  ];
  await putDoc(c.env, doc);

  c.executionCtx.waitUntil(
    indexSignerReassigned(c.env, doc, order, { name: prior.name, email: prior.email }).catch((err) =>
      console.error(`D1 indexing (reassigned) failed for doc ${doc.docId} (non-fatal):`, err)
    )
  );
  c.executionCtx.waitUntil(
    deliverWebhookEvent(c.env, acct.workspaceId, "document.signer.reassigned", {
      docId: doc.docId,
      signerOrder: order,
    }).catch((err) =>
      console.error(`Webhook delivery (document.signer.reassigned) failed for doc ${doc.docId} (non-fatal):`, err)
    )
  );

  if (shouldInvite) {
    const token = await signToken(doc.docId, order, c.env.TOKEN_SECRET, signer.linkNonce);
    c.executionCtx.waitUntil(
      sendSigningInvite(c.env, doc, order, token).catch((err) =>
        console.error(`Reassign invite email failed for doc ${doc.docId} (non-fatal):`, err)
      )
    );
    c.executionCtx.waitUntil(
      indexInviteSent(c.env, doc, order).catch((err) =>
        console.error(`D1 indexing (invite_sent) failed for doc ${doc.docId} (non-fatal):`, err)
      )
    );
  }

  if (body.saveContact && c.env.DOCRACY_DB) {
    c.executionCtx.waitUntil(
      upsertContact(c.env, acct.workspaceId, { name, email, company: body.company }).catch((err) =>
        console.error(`Contact upsert failed for workspace ${acct.workspaceId} (non-fatal):`, err)
      )
    );
  }

  return c.json({ ok: true, signer: { order: signer.order, name: signer.name, email: signer.email, status: signer.status } });
});

interface MarketingOptInBody {
  optIn?: boolean;
}

// Session-authenticated (any signed-in account, paid or free) — this is a per-person email
// preference, not a workspace/billing setting, so it's keyed on the account's own id (acct.id),
// never acct.workspaceId. See migration 0021 and lib/marketingEmail.ts for the rest of the flow.
account.patch("/marketing-opt-in", requireAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  const acct = c.get("account")!;
  let body: MarketingOptInBody;
  try {
    body = await c.req.json<MarketingOptInBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (typeof body.optIn !== "boolean") {
    return c.json({ error: "optIn must be a boolean" }, 400);
  }

  await c.env.DOCRACY_DB.prepare(`UPDATE accounts SET marketing_opt_in = ? WHERE id = ?`)
    .bind(body.optIn ? 1 : 0, acct.id)
    .run();

  return c.json({ ok: true, marketingOptIn: body.optIn });
});

account.get("/token", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const hasToken = await hasApiToken(c.env, acct.workspaceId);
  return c.json({ hasToken });
});

account.post("/token/regenerate", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const acct = c.get("account")!;
  const token = await issueApiToken(c.env, acct.workspaceId);
  return c.json({ token, connectorUrl: `${c.env.PUBLIC_CONNECTOR_URL}/mcp?token=${token}` });
});

/** Download a signer attachment uploaded during signing — paid workspace members only. */
account.get("/documents/:docId/attachments", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const doc = await getDoc(c.env, c.req.param("docId"));
  if (!doc || doc.accountId !== acct.workspaceId) {
    return c.json({ error: "Document not found" }, 404);
  }
  const signers = [...doc.signers]
    .sort((a, b) => a.order - b.order)
    .filter((s) => (s.attachments ?? []).length > 0)
    .map((s) => ({
      order: s.order,
      name: s.name,
      attachments: (s.attachments ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        sizeBytes: a.sizeBytes,
        uploadedAt: a.uploadedAt,
      })),
    }));
  return c.json({ signers });
});

account.get("/documents/:docId/attachments/:signerOrder/:attachmentId", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const doc = await getDoc(c.env, c.req.param("docId"));
  if (!doc || doc.accountId !== acct.workspaceId) {
    return c.json({ error: "Document not found" }, 404);
  }
  const signerOrder = Number(c.req.param("signerOrder"));
  const attachmentId = c.req.param("attachmentId");
  const signer = doc.signers.find((s) => s.order === signerOrder);
  const attachment = signer?.attachments?.find((a) => a.id === attachmentId);
  if (!attachment) {
    return c.json({ error: "Attachment not found" }, 404);
  }
  const obj = await c.env.DOCRACY_DOCS.get(attachment.r2Key);
  if (!obj) return c.json({ error: "Attachment file missing" }, 404);
  return new Response(await obj.arrayBuffer(), {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${attachment.name.replace(/[^\w.\-() ]+/g, "_")}"`,
    },
  });
});

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_COBRO_TITLE = 200;
const MAX_COBRO_NAME = 200;

account.get("/tax-year", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const parsed = parseTaxYear(c.req.query("year"));
  if (typeof parsed === "object") return c.json(parsed, 400);
  const year = parsed;
  const locale: Locale = c.req.query("locale") === "es" ? "es" : "en";
  if (!c.env.DOCRACY_DB) {
    const share = await mintPayerShare(c.env, acct.workspaceId, year, locale);
    return c.json({ year, documents: [], shareToken: share.shareToken, shareUrl: share.shareUrl });
  }

  const { start, end } = taxYearBounds(year);
  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT doc_id, title, completed_at, expires_at
     FROM documents
     WHERE account_id = ?
       AND status = 'completed'
       AND completed_at IS NOT NULL
       AND completed_at >= ?
       AND completed_at < ?
     ORDER BY completed_at ASC`
  )
    .bind(acct.workspaceId, start, end)
    .all<{ doc_id: string; title: string; completed_at: string; expires_at: string }>();

  const documents = await Promise.all(results.map((r) => hydrateTaxYearRow(c.env, r, locale)));
  const share = await mintPayerShare(c.env, acct.workspaceId, year, locale);
  return c.json({ year, documents, shareToken: share.shareToken, shareUrl: share.shareUrl });
});

account.get("/constancia", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const parsed = parseTaxYear(c.req.query("year"));
  if (typeof parsed === "object") return c.json(parsed, 400);
  const year = parsed;
  const locale: Locale = c.req.query("locale") === "es" ? "es" : "en";
  const [profile, documents, share, receipts] = await Promise.all([
    getConstanciaProfile(c.env, acct.workspaceId),
    listCompletedInYear(c.env, acct.workspaceId, year, locale),
    mintConstanciaShare(c.env, acct.workspaceId, year, locale),
    listConstanciaReceipts(c.env, acct.workspaceId, year),
  ]);
  return c.json({
    year,
    subjectName: profile?.subjectName ?? "",
    shareToken: share.shareToken,
    shareUrl: share.shareUrl,
    documents,
    totals: totalsByCurrency(documents),
    receipts,
  });
});

account.post("/constancia/profile", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  let body: { subjectName?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const name = normalizeSubjectName(body.subjectName);
  if (typeof name === "object") return c.json(name, 400);
  const profile = await putConstanciaProfile(c.env, acct.workspaceId, name);
  return c.json({ subjectName: profile.subjectName });
});

account.post("/constancia/receipts", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const form = await c.req.parseBody();
  const pdfFile = form["pdf"];
  const yearRaw = form["year"];
  if (!(pdfFile instanceof File) || typeof yearRaw !== "string") {
    return c.json({ error: "Expected multipart form with 'pdf' file and 'year'" }, 400);
  }
  const parsed = parseTaxYear(yearRaw);
  if (typeof parsed === "object") return c.json(parsed, 400);
  const year = parsed;
  if (pdfFile.size > MAX_RECEIPT_BYTES) {
    return c.json({ error: `PDF must be under ${MAX_RECEIPT_BYTES / (1024 * 1024)}MB` }, 400);
  }
  const filename = sanitizeReceiptFilename(pdfFile.name);
  if (typeof filename === "object") return c.json(filename, 400);
  const bytes = new Uint8Array(await pdfFile.arrayBuffer());
  if (!isPdfBytes(bytes)) return c.json({ error: "Upload a PDF (PayPal, Mercado Pago, or bank export)" }, 400);

  const existing = await listConstanciaReceipts(c.env, acct.workspaceId, year);
  if (existing.length >= MAX_CONSTANCIA_RECEIPTS) {
    return c.json({ error: `At most ${MAX_CONSTANCIA_RECEIPTS} extra PDFs per year` }, 400);
  }
  const id = crypto.randomUUID();
  const meta = { id, filename, uploadedAt: new Date().toISOString(), size: bytes.byteLength };
  await c.env.DOCRACY_DOCS.put(receiptObjectKey(acct.workspaceId, year, id), bytes, {
    httpMetadata: { contentType: "application/pdf" },
  });
  const files = [...existing, meta];
  await putConstanciaReceipts(c.env, acct.workspaceId, year, files);
  return c.json({ receipts: files });
});

account.delete("/constancia/receipts/:id", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const id = c.req.param("id");
  const parsed = parseTaxYear(c.req.query("year"));
  if (typeof parsed === "object") return c.json(parsed, 400);
  const year = parsed;
  const existing = await listConstanciaReceipts(c.env, acct.workspaceId, year);
  const next = existing.filter((f) => f.id !== id);
  if (next.length === existing.length) return c.json({ error: "Not found" }, 404);
  await c.env.DOCRACY_DOCS.delete(receiptObjectKey(acct.workspaceId, year, id));
  await putConstanciaReceipts(c.env, acct.workspaceId, year, next);
  return c.json({ receipts: next });
});

account.post("/cobro", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
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
  try {
    await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  } catch {
    return c.json({ error: "That PDF couldn't be read — it may be corrupted" }, 400);
  }

  let meta: {
    title?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientWhatsapp?: string;
    remindEveryDays?: number;
    locale?: Locale;
    paymentRequest?: { amount: string; currency: string; url: string };
  };
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return c.json({ error: "Invalid 'meta' JSON" }, 400);
  }

  const title = meta.title?.trim() ?? "";
  if (!title || title.length > MAX_COBRO_TITLE) {
    return c.json({ error: `A title is required (max ${MAX_COBRO_TITLE} characters)` }, 400);
  }
  const recipientName = meta.recipientName?.trim() ?? "";
  if (!recipientName || recipientName.length > MAX_COBRO_NAME) {
    return c.json({ error: `Recipient name is required (max ${MAX_COBRO_NAME} characters)` }, 400);
  }

  const recipientEmail = meta.recipientEmail?.trim() || undefined;
  if (recipientEmail && !EMAIL_RE.test(recipientEmail)) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }
  const whatsappRaw = meta.recipientWhatsapp?.trim() || "";
  const whatsappPhone = whatsappRaw ? normalizeE164(whatsappRaw) : null;
  if (whatsappRaw && !whatsappPhone) {
    return c.json({ error: "WhatsApp number must be a valid international number" }, 400);
  }
  if (!recipientEmail && !whatsappPhone) {
    return c.json({ error: "Add a recipient email or WhatsApp number" }, 400);
  }

  const parsedPayment = parsePaymentRequest(meta.paymentRequest);
  if (parsedPayment.error) return c.json({ error: parsedPayment.error }, 400);
  if (!parsedPayment.paymentRequest) {
    return c.json({ error: "A payment amount, currency, and https checkout URL are required" }, 400);
  }

  let remindEveryDays = DEFAULT_COBRO_REMIND_DAYS;
  if (meta.remindEveryDays !== undefined) {
    if (
      !Number.isInteger(meta.remindEveryDays) ||
      meta.remindEveryDays < MIN_COBRO_REMIND_DAYS ||
      meta.remindEveryDays > MAX_COBRO_REMIND_DAYS
    ) {
      return c.json(
        { error: `Remind every must be ${MIN_COBRO_REMIND_DAYS}–${MAX_COBRO_REMIND_DAYS} days` },
        400
      );
    }
    remindEveryDays = meta.remindEveryDays;
  }

  const ttl = resolveTtlDays(c.env, { isPaid: true });
  if ("error" in ttl) return c.json({ error: ttl.error }, 400);

  if (whatsappPhone) {
    const quota = await consumeCobroWhatsapp(c.env, acct, 1);
    if (!quota.ok) return c.json({ error: quota.error }, 402);
    reportCobroWhatsappOverage(c.env, c.executionCtx, acct, quota.overageUnits);
  }

  const { docId, statusToken } = await createCobroDocument({
    env: c.env,
    ctx: c.executionCtx,
    pdfBytes,
    filename: pdfFile.name || "document.pdf",
    accountId: acct.workspaceId,
    preparerEmail: acct.email,
    title,
    paymentRequest: parsedPayment.paymentRequest,
    recipient: {
      name: recipientName,
      email: recipientEmail,
      whatsappPhone: whatsappPhone ?? undefined,
    },
    remindEveryDays,
    locale: meta.locale === "es" ? "es" : "en",
    creatorIp: ip,
    ttlDays: ttl.ttlDays,
  });

  await putCobroPrefs(c.env, acct.workspaceId, parsedPayment.paymentRequest.url, parsedPayment.paymentRequest.currency);

  return c.json({ docId, statusToken });
});

account.get("/cobro/prefs", requireAccount, async (c) => {
  const acct = c.get("account")!;
  const prefs = await getCobroPrefs(c.env, acct.workspaceId);
  return c.json({ prefs: prefs ? { url: prefs.url, currency: prefs.currency } : null });
});

account.post("/cobro/:docId/paid", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const doc = await getDoc(c.env, c.req.param("docId"));
  if (!doc || doc.accountId !== acct.workspaceId || doc.kind !== "cobro") {
    return c.json({ error: "Document not found" }, 404);
  }
  const next = await markCobroPaid(c.env, doc);
  return c.json({ ok: true, cobroPaidAt: next.cobroPaidAt });
});

account.post("/cobro/:docId/remind", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const doc = await getDoc(c.env, c.req.param("docId"));
  if (!doc || doc.accountId !== acct.workspaceId || doc.kind !== "cobro") {
    return c.json({ error: "Document not found" }, 404);
  }
  if (doc.cobroPaidAt) {
    return c.json({ error: "This cobro is already marked paid" }, 409);
  }

  let skipWhatsApp = false;
  if (doc.cobroRecipient?.whatsappPhone) {
    const quota = await consumeCobroWhatsapp(c.env, acct, 1);
    if (!quota.ok) {
      if (!doc.cobroRecipient.email) return c.json({ error: quota.error }, 402);
      skipWhatsApp = true;
    } else {
      reportCobroWhatsappOverage(c.env, c.executionCtx, acct, quota.overageUnits);
    }
  }

  await sendCobroAgain(c.env, doc, { skipWhatsApp });
  return c.json({ ok: true, skipWhatsApp, nextRemindAt: doc.cobroNextRemindAt });
});

export default account;

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getDoc, putDoc, isSignerOnTurn, currentTurnOrder } from "../lib/kv";
import {
  burnFields,
  decodedByteLength,
  generateCertificate,
  stampPageFooters,
  MAX_SIGNATURE_IMAGE_BYTES,
  type FieldValue,
} from "../lib/pdf";
import {
  sendSigningInvite,
  sendCompletionEmails,
  sendCompletionEmailSigned,
  sendDocumentVoidedNotice,
  sendSignerDeclinedNotice,
} from "../lib/email";
import { recordViewedOnce, indexSignerSigned, indexInviteSent, indexCompleted, indexVoided } from "../lib/index-d1";
import { checkTokenAccessRateLimit, checkPinAttemptRateLimit } from "../lib/ratelimit";
import { sha256Hex } from "../lib/hash";
import { recordVerification, recordOtsProof } from "../lib/verification";
import { stampHash } from "../lib/opentimestamps";
import { requestTimestamp } from "../lib/timestamp";
import { verifyPin, issueUnlockToken, verifyUnlockToken } from "../lib/signUnlock";
import { deliverWebhookEvent } from "../lib/webhooks";
import { uploadCompletedDocument } from "../lib/cloudConnectors";
import { trackEvent, NOTRACK_COOKIE_NAME } from "../lib/analytics";
import { getWorkspaceSlug, getLogoObject, hasCustomLogo, logoPath } from "../lib/branding";
import { authenticateDocToken } from "../lib/docTokenAuth";
import { sendWhatsAppCompletedReceipts } from "../lib/whatsapp";
import { signToken } from "@docracy/shared";
import {
  attachmentLimits,
  isAllowedAttachmentType,
  storeSignerAttachment,
} from "../lib/signerAttachments";
import type { AuditEvent, DocField, DocState, Env } from "@docracy/shared";

const MAX_TEXT_FIELD_LENGTH = 500;
const MAX_REASON_LENGTH = 500;

function fieldSatisfied(f: DocField, raw: string | undefined): boolean {
  const type = f.type ?? "signature";
  if (type === "checkbox") {
    if (f.required === false) return raw === "true" || raw === "false" || raw === "1" || raw === "0";
    return raw === "true" || raw === "1";
  }
  if (type === "dropdown") {
    const opts = f.options ?? [];
    return Boolean(raw && opts.includes(raw));
  }
  return Boolean(raw?.trim());
}

function indexNonFatal(
  ctx: { waitUntil(promise: Promise<unknown>): void },
  docId: string,
  label: string,
  work: Promise<void>
) {
  ctx.waitUntil(work.catch((err) => console.error(`D1 indexing (${label}) failed for doc ${docId} (non-fatal):`, err)));
}

function webhookNonFatal(
  ctx: { waitUntil(promise: Promise<unknown>): void },
  docId: string,
  eventType: string,
  work: Promise<void>
) {
  ctx.waitUntil(work.catch((err) => console.error(`Webhook delivery (${eventType}) failed for doc ${docId} (non-fatal):`, err)));
}

function connectorNonFatal(ctx: { waitUntil(promise: Promise<unknown>): void }, docId: string, work: Promise<void>) {
  ctx.waitUntil(work.catch((err) => console.error(`Cloud connector upload failed for doc ${docId} (non-fatal):`, err)));
}

function emailNonFatal(ctx: { waitUntil(promise: Promise<unknown>): void }, docId: string, label: string, work: Promise<void>) {
  ctx.waitUntil(work.catch((err) => console.error(`${label} email failed for doc ${docId} (non-fatal):`, err)));
}

// Calendar submission is a few external round-trips (a handful of seconds) — never worth making a
// signer wait for it, and a slow/unreachable calendar must never affect document completion.
function otsNonFatal(ctx: { waitUntil(promise: Promise<unknown>): void }, env: Env, docId: string, hash: string) {
  ctx.waitUntil(
    stampHash(hash)
      .then((proofBytes) => (proofBytes ? recordOtsProof(env, hash, proofBytes) : undefined))
      .catch((err) => console.error(`OpenTimestamps stamping failed for doc ${docId} (non-fatal):`, err))
  );
}

const sign = new Hono<{ Bindings: Env }>();

async function brandLogoPathFor(env: Env, accountId: string | null): Promise<string | null> {
  if (!accountId) return null;
  return (await hasCustomLogo(env, accountId)) ? logoPath(accountId) : null;
}

async function brandWorkspaceSlugFor(env: Env, accountId: string | null): Promise<string | null> {
  if (!accountId) return null;
  return getWorkspaceSlug(env, accountId);
}

function statusPayload(doc: Awaited<ReturnType<typeof getDoc>>) {
  if (!doc) return null;
  const signerAttachmentGroups = [...doc.signers]
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
  return {
    docId: doc.docId,
    status: doc.status,
    signers: [...doc.signers]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        order: s.order,
        name: s.name,
        status: s.status,
        signedAt: s.signedAt,
        declinedAt: s.declinedAt ?? null,
      })),
    ccRecipients: (doc.ccRecipients ?? []).map((cc) => ({ name: cc.name, email: cc.email })),
    voidedAt: doc.voidedAt ?? null,
    voidReason: doc.voidReason,
    voidedBy: doc.voidedBy ?? null,
    signerAttachmentGroups: signerAttachmentGroups.length > 0 ? signerAttachmentGroups : undefined,
    paymentRequest: doc.paymentRequest,
    title: doc.title,
    expiresAt: doc.expiresAt,
    completedAt: doc.completedAt,
    kind: doc.kind,
    cobroPaidAt: doc.cobroPaidAt,
  };
}

async function attachmentDownloadResponse(
  env: Env,
  doc: DocState,
  signerOrder: number,
  attachmentId: string
): Promise<Response | null> {
  const signer = doc.signers.find((s) => s.order === signerOrder);
  const attachment = signer?.attachments?.find((a) => a.id === attachmentId);
  if (!attachment) return null;
  const obj = await env.DOCRACY_DOCS.get(attachment.r2Key);
  if (!obj) return null;
  return new Response(await obj.arrayBuffer(), {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${attachment.name.replace(/[^\w.\-() ]+/g, "_")}"`,
    },
  });
}

async function notifyDocCancelled(
  env: Env,
  ctx: { waitUntil(promise: Promise<unknown>): void },
  doc: DocState,
  kind: "voided" | "declined",
  declinerName?: string
) {
  const statusToken = await signToken(doc.docId, 0, env.TOKEN_SECRET);
  const recipients = new Set<string>();
  if (doc.preparerEmail) recipients.add(doc.preparerEmail.trim().toLowerCase());
  for (const s of doc.signers) recipients.add(s.email.trim().toLowerCase());
  for (const cc of doc.ccRecipients ?? []) recipients.add(cc.email.trim().toLowerCase());

  const emailByLower = new Map<string, string>();
  if (doc.preparerEmail) emailByLower.set(doc.preparerEmail.trim().toLowerCase(), doc.preparerEmail.trim());
  for (const s of doc.signers) emailByLower.set(s.email.trim().toLowerCase(), s.email.trim());
  for (const cc of doc.ccRecipients ?? []) emailByLower.set(cc.email.trim().toLowerCase(), cc.email.trim());

  for (const lower of recipients) {
    const to = emailByLower.get(lower)!;
    if (kind === "declined" && declinerName) {
      emailNonFatal(
        ctx,
        doc.docId,
        "decline notice",
        sendSignerDeclinedNotice(env, to, doc, declinerName, statusToken, doc.voidReason)
      );
    } else {
      emailNonFatal(ctx, doc.docId, "void notice", sendDocumentVoidedNotice(env, to, doc, statusToken, doc.voidReason));
    }
  }
}

async function voidDocument(
  env: Env,
  ctx: { waitUntil(promise: Promise<unknown>): void },
  doc: DocState,
  opts: {
    voidedBy: "preparer" | "decline";
    reason?: string;
    declinedSignerOrder?: number;
    ip: string | null;
    userAgent: string | null;
  }
): Promise<DocState> {
  const now = new Date().toISOString();
  if (opts.declinedSignerOrder != null) {
    const signer = doc.signers.find((s) => s.order === opts.declinedSignerOrder)!;
    signer.status = "declined";
    signer.declinedAt = now;
    if (opts.reason) signer.declineReason = opts.reason;
  }
  doc.status = "voided";
  doc.voidedAt = now;
  doc.voidedBy = opts.voidedBy;
  if (opts.reason) doc.voidReason = opts.reason;
  doc.events = [
    ...(doc.events ?? []),
    {
      type: opts.voidedBy === "decline" ? "declined" : "voided",
      signerOrder: opts.declinedSignerOrder ?? null,
      ip: opts.ip,
      userAgent: opts.userAgent,
      timestamp: now,
      pdfSha256: null,
    },
  ];
  await putDoc(env, doc);

  if (doc.accountId) {
    indexNonFatal(ctx, doc.docId, "voided", indexVoided(env, doc, opts.reason ? { reason: opts.reason } : null));
    webhookNonFatal(
      ctx,
      doc.docId,
      opts.voidedBy === "decline" ? "document.signer.declined" : "document.voided",
      deliverWebhookEvent(
        env,
        doc.accountId,
        opts.voidedBy === "decline" ? "document.signer.declined" : "document.voided",
        {
          docId: doc.docId,
          ...(opts.declinedSignerOrder != null ? { signerOrder: opts.declinedSignerOrder } : {}),
        }
      )
    );
  }

  const decliner = opts.declinedSignerOrder != null ? doc.signers.find((s) => s.order === opts.declinedSignerOrder) : null;
  await notifyDocCancelled(env, ctx, doc, opts.voidedBy === "decline" ? "declined" : "voided", decliner?.name);
  return doc;
}

sign.get("/status/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { verified, doc } = auth;

  return c.json({
    ...statusPayload(doc),
    canVoid: verified.order === 0,
    brandLogoPath: await brandLogoPathFor(c.env, doc.accountId),
    brandWorkspaceSlug: await brandWorkspaceSlugFor(c.env, doc.accountId),
  });
});

sign.get("/status/:token/download", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { doc } = auth;
  if (doc.status !== "completed") return c.json({ error: "This document hasn't been fully signed yet" }, 409);

  const pdfObj = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/final.pdf`);
  if (!pdfObj) return c.json({ error: "Signed document is missing" }, 404);

  if (getCookie(c, NOTRACK_COOKIE_NAME) !== "1") {
    trackEvent(c.env, {
      event: "document_downloaded",
      route: "status",
      userAgent: c.req.header("user-agent"),
      country: c.req.header("CF-IPCountry"),
      userId: doc.accountId,
      documentId: doc.docId,
    });
  }

  return new Response(await pdfObj.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${(doc.title ?? "signed-document").replace(/[^\w.-]+/g, "_")}.pdf"`,
    },
  });
});

sign.get("/status/:token/attachments/:signerOrder/:attachmentId", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { doc } = auth;

  const signerOrder = Number(c.req.param("signerOrder"));
  const attachmentId = c.req.param("attachmentId");
  const response = await attachmentDownloadResponse(c.env, doc, signerOrder, attachmentId);
  if (!response) return c.json({ error: "Attachment not found" }, 404);
  return response;
});

sign.post("/status/:token/void", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { verified, doc } = auth;

  if (verified.order !== 0) {
    return c.json({ error: "Only the preparer can cancel this document" }, 403);
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

  const voided = await voidDocument(c.env, c.executionCtx, doc, {
    voidedBy: "preparer",
    reason: reason || undefined,
    ip: c.req.header("CF-Connecting-IP") ?? null,
    userAgent: c.req.header("User-Agent") ?? null,
  });

  return c.json({ ok: true, status: statusPayload(voided) });
});

sign.get("/sign/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { verified, doc } = auth;
  const brandLogoPath = await brandLogoPathFor(c.env, doc.accountId);
  const brandWorkspaceSlug = await brandWorkspaceSlugFor(c.env, doc.accountId);

  if (doc.status !== "pending") {
    return c.json({ onTurn: false, status: statusPayload(doc), brandLogoPath, brandWorkspaceSlug });
  }

  if (!isSignerOnTurn(doc, verified.order)) {
    return c.json({ onTurn: false, status: statusPayload(doc), brandLogoPath, brandWorkspaceSlug });
  }

  const signerForPinCheck = doc.signers.find((s) => s.order === verified.order);
  if (signerForPinCheck?.pinHash) {
    const unlockToken = c.req.header("X-Sign-Unlock");
    if (!(await verifyUnlockToken(c.env, unlockToken, doc.docId, verified.order))) {
      return c.json({ onTurn: true, needsPin: true, status: statusPayload(doc), brandLogoPath, brandWorkspaceSlug });
    }
  }

  if (doc.accountId) {
    indexNonFatal(c.executionCtx, doc.docId, "viewed", recordViewedOnce(c.env, doc, verified.order));
  }

  const viewedSigner = doc.signers.find((s) => s.order === verified.order);
  if (viewedSigner && !viewedSigner.viewedAt) {
    viewedSigner.viewedAt = new Date().toISOString();
    try {
      await putDoc(c.env, doc);
    } catch (err) {
      console.error(`Marking signer viewed failed for doc ${doc.docId} (non-fatal):`, err);
    }
    if (getCookie(c, NOTRACK_COOKIE_NAME) !== "1") {
      trackEvent(c.env, {
        event: "document_viewed",
        route: "sign",
        userAgent: c.req.header("user-agent"),
        country: c.req.header("CF-IPCountry"),
        userId: doc.accountId,
        documentId: doc.docId,
      });
    }
  }

  const pdfObj = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/working.pdf`);
  if (!pdfObj) return c.json({ error: "Document blob missing" }, 404);
  const pdfBase64 = arrayBufferToBase64(await pdfObj.arrayBuffer());

  return c.json({
    onTurn: true,
    docId: doc.docId,
    pdfBase64,
    fields: doc.fields.filter((f) => f.signerOrder === verified.order),
    signerName: signerForPinCheck?.name ?? viewedSigner?.name ?? "",
    signerAttachments: doc.signerAttachments?.enabled
      ? {
          ...attachmentLimits(doc),
          uploaded: (signerForPinCheck?.attachments ?? []).map((a) => ({
            id: a.id,
            name: a.name,
            sizeBytes: a.sizeBytes,
          })),
        }
      : undefined,
    status: statusPayload(doc),
    brandLogoPath,
    brandWorkspaceSlug,
  });
});

sign.post("/sign/:token/unlock", async (c) => {
  const token = c.req.param("token");
  if (!(await checkPinAttemptRateLimit(c.env, token))) {
    return c.json({ error: "Too many attempts. Please try again later." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { verified, doc } = auth;

  const signer = doc.signers.find((s) => s.order === verified.order);
  if (!signer?.pinHash) {
    return c.json({ error: "No PIN is set for this signer" }, 400);
  }

  let body: { pin?: string };
  try {
    body = await c.req.json<{ pin?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.pin || !(await verifyPin(c.env, body.pin, signer.pinHash))) {
    return c.json({ error: "Incorrect PIN" }, 401);
  }

  const unlockToken = await issueUnlockToken(c.env, doc.docId, verified.order);
  return c.json({ unlockToken });
});

sign.post("/sign/:token/attachments", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { verified, doc } = auth;

  if (doc.status !== "pending" || !isSignerOnTurn(doc, verified.order)) {
    return c.json({ error: "You're not able to upload attachments right now" }, 409);
  }
  if (!doc.signerAttachments?.enabled) {
    return c.json({ error: "This document does not accept attachments" }, 400);
  }

  const signer = doc.signers.find((s) => s.order === verified.order)!;
  const limits = attachmentLimits(doc);
  const existing = signer.attachments ?? [];
  if (existing.length >= limits.maxFiles) {
    return c.json({ error: `You can upload at most ${limits.maxFiles} file(s)` }, 400);
  }

  const form = await c.req.parseBody();
  const file = form["file"];
  if (!(file instanceof File)) {
    return c.json({ error: "Expected multipart form with a 'file' field" }, 400);
  }
  if (file.size === 0) {
    return c.json({ error: "That file is empty" }, 400);
  }
  if (file.size > limits.maxBytesPerFile) {
    return c.json(
      { error: `Each attachment must be under ${Math.round(limits.maxBytesPerFile / (1024 * 1024))}MB` },
      400
    );
  }
  const mime = file.type || "application/octet-stream";
  if (!isAllowedAttachmentType(mime)) {
    return c.json({ error: "That file type is not allowed — use PDF or common image formats" }, 400);
  }

  const stored = await storeSignerAttachment(c.env, doc.docId, verified.order, file);
  signer.attachments = [...existing, stored];

  const uploadedAt = stored.uploadedAt;
  const events: AuditEvent[] = [
    ...(doc.events ?? []),
    {
      type: "attachment_uploaded",
      signerOrder: verified.order,
      ip: c.req.header("CF-Connecting-IP") ?? null,
      userAgent: c.req.header("User-Agent") ?? null,
      timestamp: uploadedAt,
      pdfSha256: null,
    },
  ];
  doc.events = events;
  await putDoc(c.env, doc);

  return c.json({
    ok: true,
    attachment: { id: stored.id, name: stored.name, sizeBytes: stored.sizeBytes },
    uploadedCount: signer.attachments.length,
  });
});

sign.post("/sign/:token/decline", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { verified, doc } = auth;

  if (verified.order === 0 || verified.order === -1) {
    return c.json({ error: "Use cancel instead of decline for the preparer status link" }, 400);
  }
  if (doc.status !== "pending") {
    return c.json({ error: "This document is no longer available for signing" }, 409);
  }
  if (!isSignerOnTurn(doc, verified.order)) {
    return c.json({ error: "It's not your turn to sign yet" }, 409);
  }

  const signerForPinCheck = doc.signers.find((s) => s.order === verified.order);
  if (signerForPinCheck?.pinHash) {
    const unlockToken = c.req.header("X-Sign-Unlock");
    if (!(await verifyUnlockToken(c.env, unlockToken, doc.docId, verified.order))) {
      return c.json({ needsPin: true, error: "PIN required" }, 401);
    }
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

  const voided = await voidDocument(c.env, c.executionCtx, doc, {
    voidedBy: "decline",
    reason: reason || undefined,
    declinedSignerOrder: verified.order,
    ip: c.req.header("CF-Connecting-IP") ?? null,
    userAgent: c.req.header("User-Agent") ?? null,
  });

  return c.json({ ok: true, status: statusPayload(voided) });
});

sign.post("/sign/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const auth = await authenticateDocToken(c.env, token);
  if (!auth) return c.json({ error: "Invalid or tampered link" }, 403);
  const { verified, doc } = auth;

  if (doc.status !== "pending") {
    return c.json({ error: "This document is no longer available for signing" }, 409);
  }

  if (!isSignerOnTurn(doc, verified.order)) {
    return c.json({ error: "It's not your turn to sign yet" }, 409);
  }

  const signerForPinCheck = doc.signers.find((s) => s.order === verified.order);
  if (signerForPinCheck?.pinHash) {
    const unlockToken = c.req.header("X-Sign-Unlock");
    if (!(await verifyUnlockToken(c.env, unlockToken, doc.docId, verified.order))) {
      return c.json({ needsPin: true, error: "PIN required" }, 401);
    }
  }

  let body: { values: FieldValue[]; consent?: boolean };
  try {
    body = await c.req.json<{ values: FieldValue[]; consent?: boolean }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (body.consent !== true) {
    return c.json({ error: "You must confirm you agree to sign electronically before submitting" }, 400);
  }

  const myFields = doc.fields.filter((f) => f.signerOrder === verified.order);

  if (myFields.length === 0) {
    return c.json({ error: "This signer has no signature field to sign — contact whoever prepared this document" }, 400);
  }

  const valueById = new Map(body.values?.map((v) => [v.fieldId, v.value]) ?? []);
  const missing = myFields.some((f) => !fieldSatisfied(f, valueById.get(f.id)));
  if (missing) {
    return c.json({ error: "Please fill in every field before submitting" }, 400);
  }

  const signerForAttachments = doc.signers.find((s) => s.order === verified.order)!;
  if (doc.signerAttachments?.enabled && (signerForAttachments.attachments ?? []).length === 0) {
    return c.json({ error: "Please upload the required attachment(s) before signing" }, 400);
  }

  const isImageField = (type: DocField["type"]) => type === undefined || type === "signature" || type === "initials";
  const oversized = myFields.some((f) => {
    const value = valueById.get(f.id)!;
    if (f.type === "checkbox" || f.type === "dropdown") return false;
    return isImageField(f.type) ? decodedByteLength(value) > MAX_SIGNATURE_IMAGE_BYTES : value.length > MAX_TEXT_FIELD_LENGTH;
  });
  if (oversized) {
    return c.json({ error: "One of the submitted values is too large" }, 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const userAgent = c.req.header("User-Agent") ?? null;

  const workingObj = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/working.pdf`);
  if (!workingObj) return c.json({ error: "Document blob missing" }, 404);
  const workingBytes = new Uint8Array(await workingObj.arrayBuffer());

  const signer = doc.signers.find((s) => s.order === verified.order)!;
  const signedAt = new Date().toISOString();

  let updatedBytes: Uint8Array;
  try {
    updatedBytes = await burnFields(workingBytes, myFields, body.values, signer.email, signedAt);
  } catch (err) {
    trackEvent(c.env, {
      event: "signature_error",
      route: "sign",
      userAgent: c.req.header("user-agent"),
      country: c.req.header("CF-IPCountry"),
      userId: doc.accountId,
      documentId: doc.docId,
      errorCode: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    });
    throw err;
  }
  const signedHash = await sha256Hex(updatedBytes);

  const freshDoc = await getDoc(c.env, verified.docId);
  if (!freshDoc || freshDoc.status !== "pending" || !isSignerOnTurn(freshDoc, verified.order)) {
    return c.json({ error: "This submission was already received" }, 409);
  }

  await c.env.DOCRACY_DOCS.put(`docs/${freshDoc.docId}/working.pdf`, updatedBytes);

  const freshSigner = freshDoc.signers.find((s) => s.order === verified.order)!;
  freshSigner.status = "signed";
  freshSigner.signedAt = signedAt;

  if (getCookie(c, NOTRACK_COOKIE_NAME) !== "1") {
    trackEvent(c.env, {
      event: "document_signed",
      route: "sign",
      userAgent,
      country: c.req.header("CF-IPCountry"),
      userId: freshDoc.accountId,
      documentId: freshDoc.docId,
    });
  }

  const events: AuditEvent[] = [
    ...(freshDoc.events ?? []),
    { type: "consented", signerOrder: verified.order, ip, userAgent, timestamp: signedAt, pdfSha256: null },
    { type: "signed", signerOrder: verified.order, ip, userAgent, timestamp: signedAt, pdfSha256: signedHash },
  ];

  if (freshDoc.accountId) {
    indexNonFatal(c.executionCtx, freshDoc.docId, "signed", indexSignerSigned(c.env, freshDoc, verified.order, updatedBytes, ip));
    webhookNonFatal(
      c.executionCtx,
      freshDoc.docId,
      "document.signer.signed",
      deliverWebhookEvent(c.env, freshDoc.accountId, "document.signer.signed", {
        docId: freshDoc.docId,
        signerOrder: verified.order,
      })
    );
  }

  if (freshDoc.preparerEmail) {
    const statusToken = await signToken(freshDoc.docId, 0, c.env.TOKEN_SECRET);
    c.executionCtx.waitUntil(
      sendCompletionEmailSigned(c.env, freshDoc.preparerEmail, freshDoc, freshSigner.name, statusToken).catch((err) =>
        console.error(`Completion-email (signed) failed for doc ${freshDoc.docId} signer ${verified.order} (non-fatal):`, err)
      )
    );
  }

  const remainingPending = freshDoc.signers.some((s) => s.status === "pending");
  if (remainingPending && (freshDoc.signingMode ?? "sequential") === "sequential") {
    const nextOrder = currentTurnOrder(freshDoc)!;
    const nextSigner = freshDoc.signers.find((s) => s.order === nextOrder)!;
    nextSigner.linkSentAt = new Date().toISOString();
    events.push({
      type: "invite_sent",
      signerOrder: nextOrder,
      ip: null,
      userAgent: null,
      timestamp: nextSigner.linkSentAt,
      pdfSha256: null,
    });
    freshDoc.events = events;
    await putDoc(c.env, freshDoc);

    const nextToken = await signToken(freshDoc.docId, nextOrder, c.env.TOKEN_SECRET, nextSigner.linkNonce);
    await sendSigningInvite(c.env, freshDoc, nextOrder, nextToken);

    if (freshDoc.accountId) {
      indexNonFatal(c.executionCtx, freshDoc.docId, "invite_sent", indexInviteSent(c.env, freshDoc, nextOrder));
    }
  } else if (remainingPending) {
    freshDoc.events = events;
    await putDoc(c.env, freshDoc);
  } else {
    freshDoc.status = "completed";
    freshDoc.completedAt = new Date().toISOString();

    // Platform audit footer on every page of the final PDF — applied after the last signature
    // burn so the signer's "signed" event hash still reflects what they submitted, while the
    // completed hash / timestamp / certificate cover the stamped deliverable.
    let finalBytes = updatedBytes;
    try {
      const logo = freshDoc.accountId ? await getLogoObject(c.env, freshDoc.accountId) : null;
      finalBytes = await stampPageFooters(updatedBytes, {
        docId: freshDoc.docId,
        completedAt: freshDoc.completedAt,
        brand: logo ? { logoBytes: logo.bytes, logoContentType: logo.contentType } : null,
      });
    } catch (err) {
      trackEvent(c.env, {
        event: "pdf_generation_failed",
        route: "sign",
        userAgent,
        country: c.req.header("CF-IPCountry"),
        userId: freshDoc.accountId,
        documentId: freshDoc.docId,
        errorCode: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      });
      throw err;
    }
    const finalHash = await sha256Hex(finalBytes);
    // Independent of putDoc below — this record deliberately outlives the document itself (see
    // lib/verification.ts) so /verify keeps working after the source document's retention TTL
    // has passed and deleted the rest of this doc's state.
    await recordVerification(c.env, finalHash, {
      signerCount: freshDoc.signers.length,
      completedAt: freshDoc.completedAt,
    });
    // Anchors the same hash to Bitcoin via the free OpenTimestamps calendar network — independent
    // of Docracy's own KV record above, so verification doesn't have to rely on trusting us at
    // all. Background/best-effort: see otsNonFatal.
    otsNonFatal(c.executionCtx, c.env, freshDoc.docId, finalHash);

    events.push({
      type: "completed",
      signerOrder: null,
      ip: null,
      userAgent: null,
      timestamp: freshDoc.completedAt,
      pdfSha256: finalHash,
    });
    freshDoc.events = events;

    const timestamp = await requestTimestamp(finalHash);
    if (timestamp) {
      freshDoc.timestampToken = timestamp.tokenBase64;
      freshDoc.timestampGenTime = timestamp.genTime;
    }

    await c.env.DOCRACY_DOCS.put(`docs/${freshDoc.docId}/final.pdf`, finalBytes);
    let certificateBytes: Uint8Array;
    try {
      certificateBytes = await generateCertificate(freshDoc, finalHash);
    } catch (err) {
      trackEvent(c.env, {
        event: "pdf_generation_failed",
        route: "sign",
        userAgent,
        country: c.req.header("CF-IPCountry"),
        userId: freshDoc.accountId,
        documentId: freshDoc.docId,
        errorCode: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      });
      throw err;
    }
    await c.env.DOCRACY_DOCS.put(`docs/${freshDoc.docId}/certificate.pdf`, certificateBytes);

    await putDoc(c.env, freshDoc);
    await sendCompletionEmails(c.env, freshDoc, finalBytes, finalHash, certificateBytes);
    c.executionCtx.waitUntil(
      sendWhatsAppCompletedReceipts(c.env, freshDoc).catch((err) =>
        console.error(`WhatsApp completion receipts failed for doc ${freshDoc.docId} (non-fatal):`, err)
      )
    );

    if (freshDoc.accountId) {
      indexNonFatal(c.executionCtx, freshDoc.docId, "completed", indexCompleted(c.env, freshDoc));
      webhookNonFatal(
        c.executionCtx,
        freshDoc.docId,
        "document.completed",
        deliverWebhookEvent(c.env, freshDoc.accountId, "document.completed", { docId: freshDoc.docId })
      );
      connectorNonFatal(
        c.executionCtx,
        freshDoc.docId,
        uploadCompletedDocument(c.env, freshDoc.accountId, freshDoc.docId, `${freshDoc.docId}.pdf`, finalBytes)
      );
    }
  }

  return c.json({ ok: true, status: statusPayload(freshDoc) });
});

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export default sign;

import { createDocumentCore } from "./documentCreation";
import { getTemplate } from "./templates";
import { checkInviteRateLimit } from "./ratelimit";
import { resolveTtlDays } from "./docTtl";
import type { Env } from "@docracy/shared";

export const BULK_SEND_MAX_RECIPIENTS = 50;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BulkRecipient {
  /** Full signer set matching the template's signerCount. */
  signers: Array<{ name: string; email: string }>;
  title?: string;
}

export interface BulkSendParams {
  env: Env;
  ctx: { waitUntil(promise: Promise<unknown>): void };
  workspaceId: string;
  templateId: string;
  recipients: BulkRecipient[];
  ttlDays?: number;
  customSubject?: string;
  customMessage?: string;
  signingMode?: "sequential" | "parallel";
  preparerEmail?: string;
}

export interface BulkSendResultDoc {
  docId: string;
  statusToken: string;
  statusUrl: string;
  title: string;
  recipientLabel: string;
}

/**
 * Creates one independent DocState per recipient row from a saved template.
 * Does not bypass invite rate limits — each recipient email is checked.
 */
export async function bulkSendFromTemplate(
  params: BulkSendParams
): Promise<{ batchId: string; documents: BulkSendResultDoc[] } | { error: string; status: 400 | 404 | 429 }> {
  const { env, ctx, workspaceId } = params;

  if (params.recipients.length === 0) {
    return { error: "At least one recipient is required", status: 400 };
  }
  if (params.recipients.length > BULK_SEND_MAX_RECIPIENTS) {
    return { error: `Bulk send supports up to ${BULK_SEND_MAX_RECIPIENTS} recipients per request`, status: 400 };
  }

  const template = await getTemplate(env, workspaceId, params.templateId);
  if (!template) {
    return { error: "Template not found", status: 404 };
  }

  const ttl = resolveTtlDays(env, { isPaid: true, ttlDays: params.ttlDays });
  if ("error" in ttl) {
    return { error: ttl.error, status: 400 };
  }

  const seenEmails = new Set<string>();
  for (const row of params.recipients) {
    if (row.signers.length !== template.summary.signerCount) {
      return {
        error: `Each recipient needs exactly ${template.summary.signerCount} signer(s)`,
        status: 400,
      };
    }
    for (const s of row.signers) {
      if (!s.name?.trim()) return { error: "Every signer needs a name", status: 400 };
      const email = s.email?.trim().toLowerCase() ?? "";
      if (!EMAIL_RE.test(email)) {
        return { error: `"${s.email}" doesn't look like a valid email address`, status: 400 };
      }
      if (seenEmails.has(email)) {
        return { error: `${s.email} appears more than once in this batch`, status: 400 };
      }
      seenEmails.add(email);
    }
  }

  for (const email of seenEmails) {
    if (!(await checkInviteRateLimit(env, email))) {
      return {
        error: "Too many documents have recently been sent to one of these email addresses. Please try again later.",
        status: 429,
      };
    }
  }
  if (params.preparerEmail) {
    const pe = params.preparerEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(pe)) {
      return { error: "That doesn't look like a valid email address", status: 400 };
    }
    if (!(await checkInviteRateLimit(env, pe))) {
      return {
        error: "Too many documents have recently been sent to one of these email addresses. Please try again later.",
        status: 429,
      };
    }
  }

  const batchId = crypto.randomUUID();
  const documents: BulkSendResultDoc[] = [];

  for (const row of params.recipients) {
    const title = row.title?.trim() || template.summary.name;
    const { docId, statusToken } = await createDocumentCore({
      env,
      ctx,
      pdfBytes: template.pdfBytes,
      filename: `${title}.pdf`,
      preparerSigns: false,
      preparerEmail: params.preparerEmail,
      signers: row.signers.map((s) => ({ name: s.name.trim(), email: s.email.trim() })),
      fields: template.fields,
      accountId: workspaceId,
      title,
      customSubject: params.customSubject,
      customMessage: params.customMessage,
      signingMode: params.signingMode,
      templateId: params.templateId,
      ttlDays: ttl.ttlDays,
      batchId,
    });
    documents.push({
      docId,
      statusToken,
      statusUrl: `${env.PUBLIC_APP_URL}/status/${statusToken}`,
      title,
      recipientLabel: row.signers.map((s) => s.name.trim()).join(", "),
    });
  }

  return { batchId, documents };
}

import { putDoc } from "./kv";
import { sendSigningInvite, sendPreparerStatusLink, sendCcInvite } from "./email";
import { indexDocumentCreated } from "./index-d1";
import { sha256Hex } from "./hash";
import { deliverWebhookEvent } from "./webhooks";
import { trackEvent } from "./analytics";
import { incrementTemplateUsage } from "./templateUsage";
import { signToken, hashOpaqueToken } from "@docracy/shared";
import type { AuditEvent, CcRecipient, DocField, DocState, Env, Signer } from "@docracy/shared";

export interface CreateDocumentCoreParams {
  env: Env;
  ctx: { waitUntil(promise: Promise<unknown>): void };
  pdfBytes: Uint8Array;
  filename: string;
  preparerSigns: boolean;
  preparerEmail?: string;
  /** Already validated by the caller (name/email format, no duplicates, PIN is 4-8 digits if
   *  present). Order is assigned here from array position, never trusted from a client-supplied
   *  value. `pin`, if given, is hashed here and never stored in its raw form. */
  signers: Array<{ name: string; email: string; company?: string; pin?: string }>;
  fields: DocField[];
  /** Notify-only recipients — validated by the caller. */
  ccRecipients?: Array<{ name?: string; email: string }>;
  /** null for the anonymous free-tier flow (100% of documents today) — every D1/index write
   *  below is skipped in that case, so this function's KV/R2 behavior is byte-for-byte identical
   *  to before this helper existed. Only set for a logged-in paid account's connector upload. */
  accountId: string | null;
  title?: string;
  /** IP of whoever submitted the /api/documents request, for the "created" audit event. Optional
   *  (defaults to null) so existing callers/tests that don't pass it keep compiling unchanged. */
  creatorIp?: string | null;
  /** CF-IPCountry of whoever submitted the request, for funnel analytics. */
  creatorCountry?: string | null;
  /** Set when the submitter's browser has the notrack opt-out cookie (see lib/analytics.ts) —
   *  skips the document_sent funnel event entirely, e.g. for the site owner's own QA testing. */
  skipFunnelTracking?: boolean;
  /** Preparer-supplied overrides for the signing-invite email — stored on the doc (not just used
   *  once here) since sign.ts's chain-advance re-sends sendSigningInvite for later signers too. */
  customSubject?: string;
  customMessage?: string;
  /** "sequential" (default) invites only the first signer, exactly as this app has always worked;
   *  "parallel" invites every signer at once, and any of them may sign in any order. */
  signingMode?: "sequential" | "parallel";
  /** Set only when this document's fields were loaded from a saved template (see
   *  routes/templates.ts's GET /:id, which fires the matching template_started event) — purely for
   *  the Template funnel's completion step (template_completed), never persisted on the doc itself. */
  templateId?: string;
  /** Retention in days. Callers must already have validated paid-only overrides via resolveTtlDays.
   *  When omitted, falls back to env.DOC_TTL_DAYS. */
  ttlDays?: number;
  /** Optional bulk-send group id — stamped on every DocState in the batch. */
  batchId?: string;
}

export async function createDocumentCore(
  params: CreateDocumentCoreParams
): Promise<{ docId: string; statusToken: string }> {
  const { env, ctx, pdfBytes, filename, preparerSigns, preparerEmail, fields, accountId } = params;
  const signingMode = params.signingMode ?? "sequential";

  const docId = crypto.randomUUID();
  const now = new Date();
  const ttlDays = params.ttlDays ?? Number(env.DOC_TTL_DAYS);
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  await env.DOCRACY_DOCS.put(`docs/${docId}/original.pdf`, pdfBytes);
  await env.DOCRACY_DOCS.put(`docs/${docId}/working.pdf`, pdfBytes);

  const signers: Signer[] = await Promise.all(
    params.signers.map(async (s, i) => ({
      order: i + 1,
      name: s.name.trim(),
      email: s.email.trim(),
      company: s.company?.trim() || undefined,
      status: "pending" as const,
      signedAt: null,
      linkSentAt: null,
      remindersSent: [],
      linkNonce: crypto.randomUUID(),
      pinHash: s.pin ? await hashOpaqueToken(s.pin, env.TOKEN_SECRET) : undefined,
    }))
  );

  const nowIso = now.toISOString();
  const ccRecipients: CcRecipient[] = (params.ccRecipients ?? []).map((cc) => ({
    email: cc.email.trim(),
    name: cc.name?.trim() || undefined,
    notifiedAt: nowIso,
  }));

  // Sequential invites only the first signer (this app's original behavior); parallel invites
  // everyone at once, since there's no "next" signer to wait for.
  const signersToInvite = signingMode === "parallel" ? signers : [signers[0]];
  const createdHash = await sha256Hex(pdfBytes);
  const events: AuditEvent[] = [
    {
      type: "created",
      signerOrder: null,
      ip: params.creatorIp ?? null,
      userAgent: null,
      timestamp: now.toISOString(),
      pdfSha256: createdHash,
    },
    ...signersToInvite.map((s) => ({
      type: "invite_sent" as const,
      signerOrder: s.order,
      ip: null,
      userAgent: null,
      timestamp: now.toISOString(),
      pdfSha256: null,
    })),
    ...ccRecipients.map(() => ({
      type: "cc_invite_sent" as const,
      signerOrder: null,
      ip: null,
      userAgent: null,
      timestamp: now.toISOString(),
      pdfSha256: null,
    })),
  ];

  const doc: DocState = {
    docId,
    accountId,
    title: accountId ? params.title?.trim() || filename : null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    preparerSigns,
    status: "pending",
    completedAt: null,
    signingMode,
    signers,
    fields,
    ccRecipients: ccRecipients.length > 0 ? ccRecipients : undefined,
    batchId: params.batchId,
    events,
    customSubject: params.customSubject,
    customMessage: params.customMessage,
    preparerEmail: preparerEmail?.trim() || undefined,
  };

  for (const s of signersToInvite) s.linkSentAt = now.toISOString();
  await putDoc(env, doc);
  // No user agent here on purpose — filling out and submitting this form isn't something a
  // non-interactive crawler can do, so this funnel stage is always effectively human.
  if (!params.skipFunnelTracking) {
    trackEvent(env, {
      event: "document_sent",
      route: "prepare",
      country: params.creatorCountry,
      userId: accountId,
      documentId: docId,
      templateId: params.templateId,
    });
    if (params.templateId) {
      trackEvent(env, {
        event: "template_completed",
        route: "prepare",
        country: params.creatorCountry,
        userId: accountId,
        documentId: docId,
        templateId: params.templateId,
      });
    }
  }

  // Recurring-template usage counting — always runs (independent of skipFunnelTracking, which is
  // an analytics opt-out, not a product-feature opt-out) but only for paid workspaces, since an
  // anonymous document creation has no workspaceId to key a count against at all.
  if (params.templateId && accountId) {
    const templateId = params.templateId;
    ctx.waitUntil(
      incrementTemplateUsage(env, accountId, templateId).catch((err) =>
        console.error(`Template usage increment failed for doc ${docId} (non-fatal):`, err)
      )
    );
  }

  // Fire-and-forget, like the D1 indexing below — a stalled or failing outbound email call must
  // never block (or hang) the response to the person who just created the document.
  for (const s of signersToInvite) {
    const token = await signToken(docId, s.order, env.TOKEN_SECRET, s.linkNonce);
    ctx.waitUntil(
      sendSigningInvite(env, doc, s.order, token).catch((err) =>
        console.error(`Signing invite email failed for doc ${docId} signer ${s.order} (non-fatal):`, err)
      )
    );
  }

  // A generic viewer token (order 0, no matching signer) so the preparer can bookmark a status page
  // even if they opted not to sign themselves. Shared with CC recipients for view-only access.
  const statusToken = await signToken(docId, 0, env.TOKEN_SECRET);

  if (preparerEmail) {
    const trimmedPreparerEmail = preparerEmail.trim();
    ctx.waitUntil(
      sendPreparerStatusLink(env, trimmedPreparerEmail, statusToken).catch((err) =>
        console.error(`Preparer status-link email failed for doc ${docId} (non-fatal):`, err)
      )
    );
  }

  for (const cc of ccRecipients) {
    ctx.waitUntil(
      sendCcInvite(env, doc, cc, statusToken).catch((err) =>
        console.error(`CC invite email failed for doc ${docId} to ${cc.email} (non-fatal):`, err)
      )
    );
  }

  if (accountId) {
    ctx.waitUntil(
      indexDocumentCreated(env, doc, pdfBytes).catch((err) =>
        console.error(`D1 indexing failed for doc ${docId} (non-fatal):`, err)
      )
    );
    ctx.waitUntil(
      deliverWebhookEvent(env, accountId, "document.created", { docId, title: doc.title }).catch((err) =>
        console.error(`Webhook delivery (document.created) failed for doc ${docId} (non-fatal):`, err)
      )
    );
  }

  return { docId, statusToken };
}

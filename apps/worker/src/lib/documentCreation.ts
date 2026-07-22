import { putDoc } from "./kv";
import { sendSigningInvite, sendPreparerStatusLink } from "./email";
import { indexDocumentCreated } from "./index-d1";
import { sha256Hex } from "./hash";
import { deliverWebhookEvent } from "./webhooks";
import { logFunnelEvent } from "./analytics";
import { signToken, hashOpaqueToken } from "@docracy/shared";
import type { AuditEvent, DocField, DocState, Env, Signer } from "@docracy/shared";

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
  /** null for the anonymous free-tier flow (100% of documents today) — every D1/index write
   *  below is skipped in that case, so this function's KV/R2 behavior is byte-for-byte identical
   *  to before this helper existed. Only set for a logged-in paid account's connector upload. */
  accountId: string | null;
  title?: string;
  /** IP of whoever submitted the /api/documents request, for the "created" audit event. Optional
   *  (defaults to null) so existing callers/tests that don't pass it keep compiling unchanged. */
  creatorIp?: string | null;
  /** Preparer-supplied overrides for the signing-invite email — stored on the doc (not just used
   *  once here) since sign.ts's chain-advance re-sends sendSigningInvite for later signers too. */
  customSubject?: string;
  customMessage?: string;
  /** "sequential" (default) invites only the first signer, exactly as this app has always worked;
   *  "parallel" invites every signer at once, and any of them may sign in any order. */
  signingMode?: "sequential" | "parallel";
}

export async function createDocumentCore(
  params: CreateDocumentCoreParams
): Promise<{ docId: string; statusToken: string }> {
  const { env, ctx, pdfBytes, filename, preparerSigns, preparerEmail, fields, accountId } = params;
  const signingMode = params.signingMode ?? "sequential";

  const docId = crypto.randomUUID();
  const now = new Date();
  const ttlDays = Number(env.DOC_TTL_DAYS);
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
      pinHash: s.pin ? await hashOpaqueToken(s.pin, env.TOKEN_SECRET) : undefined,
    }))
  );

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
    events,
    customSubject: params.customSubject,
    customMessage: params.customMessage,
  };

  for (const s of signersToInvite) s.linkSentAt = now.toISOString();
  await putDoc(env, doc);
  // No user agent here on purpose — filling out and submitting this form isn't something a
  // non-interactive crawler can do, so this funnel stage is always effectively human.
  logFunnelEvent(env, "document_created", "prepare", null);

  // Fire-and-forget, like the D1 indexing below — a stalled or failing outbound email call must
  // never block (or hang) the response to the person who just created the document.
  for (const s of signersToInvite) {
    const token = await signToken(docId, s.order, env.TOKEN_SECRET);
    ctx.waitUntil(
      sendSigningInvite(env, doc, s.order, token).catch((err) =>
        console.error(`Signing invite email failed for doc ${docId} signer ${s.order} (non-fatal):`, err)
      )
    );
  }

  // A generic viewer token (order 0, no matching signer) so the preparer can bookmark a status page
  // even if they opted not to sign themselves.
  const statusToken = await signToken(docId, 0, env.TOKEN_SECRET);

  if (preparerEmail) {
    const trimmedPreparerEmail = preparerEmail.trim();
    ctx.waitUntil(
      sendPreparerStatusLink(env, trimmedPreparerEmail, statusToken).catch((err) =>
        console.error(`Preparer status-link email failed for doc ${docId} (non-fatal):`, err)
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

import { putDoc } from "./kv";
import { sendSigningInvite, sendPreparerStatusLink } from "./email";
import { indexDocumentCreated } from "./index-d1";
import { signToken } from "@docracy/shared";
import type { DocField, DocState, Env, Signer } from "@docracy/shared";

export interface CreateDocumentCoreParams {
  env: Env;
  ctx: { waitUntil(promise: Promise<unknown>): void };
  pdfBytes: Uint8Array;
  filename: string;
  preparerSigns: boolean;
  preparerEmail?: string;
  /** Already validated by the caller (name/email format, no duplicates). Order is assigned here
   *  from array position, never trusted from a client-supplied value. */
  signers: Array<{ name: string; email: string; company?: string }>;
  fields: DocField[];
  /** null for the anonymous free-tier flow (100% of documents today) — every D1/index write
   *  below is skipped in that case, so this function's KV/R2 behavior is byte-for-byte identical
   *  to before this helper existed. Only set for a logged-in paid account's connector upload. */
  accountId: string | null;
  title?: string;
}

export async function createDocumentCore(
  params: CreateDocumentCoreParams
): Promise<{ docId: string; statusToken: string }> {
  const { env, ctx, pdfBytes, filename, preparerSigns, preparerEmail, fields, accountId } = params;

  const docId = crypto.randomUUID();
  const now = new Date();
  const ttlDays = Number(env.DOC_TTL_DAYS);
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  await env.DOCRACY_DOCS.put(`docs/${docId}/original.pdf`, pdfBytes);
  await env.DOCRACY_DOCS.put(`docs/${docId}/working.pdf`, pdfBytes);

  const signers: Signer[] = params.signers.map((s, i) => ({
    order: i + 1,
    name: s.name.trim(),
    email: s.email.trim(),
    company: s.company?.trim() || undefined,
    status: "pending",
    signedAt: null,
    linkSentAt: null,
    remindersSent: [],
  }));

  const doc: DocState = {
    docId,
    accountId,
    title: accountId ? params.title?.trim() || filename : null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    preparerSigns,
    status: "pending",
    completedAt: null,
    signers,
    fields,
  };

  const firstSigner = signers[0];
  firstSigner.linkSentAt = now.toISOString();
  await putDoc(env, doc);

  const firstToken = await signToken(docId, firstSigner.order, env.TOKEN_SECRET);
  await sendSigningInvite(env, doc, firstSigner.order, firstToken);

  // A generic viewer token (order 0, no matching signer) so the preparer can bookmark a status page
  // even if they opted not to sign themselves.
  const statusToken = await signToken(docId, 0, env.TOKEN_SECRET);

  if (preparerEmail) {
    await sendPreparerStatusLink(env, preparerEmail.trim(), statusToken);
  }

  if (accountId) {
    ctx.waitUntil(
      indexDocumentCreated(env, doc, pdfBytes).catch((err) =>
        console.error(`D1 indexing failed for doc ${docId} (non-fatal):`, err)
      )
    );
  }

  return { docId, statusToken };
}

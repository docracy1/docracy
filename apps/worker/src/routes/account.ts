import { Hono } from "hono";
import { requireAccount, requirePaidAccount, type AccountContext } from "../lib/auth";
import { issueApiToken, hasApiToken } from "../lib/apiTokens";
import { getDoc, putDoc } from "../lib/kv";
import { sendSigningInvite, sendDocumentVoidedNotice } from "../lib/email";
import { indexDocumentCreated, indexVoided, indexSignerReassigned, indexInviteSent } from "../lib/index-d1";
import { deliverWebhookEvent } from "../lib/webhooks";
import { upsertContact } from "../lib/contacts";
import { documentClaimKvKey, type DocumentClaimRecord } from "../lib/documentCreation";
import { signToken, hashOpaqueToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

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
  preparer_signs: number;
  order1_status: string | null;
}

account.get("/documents", requireAccount, async (c) => {
  const acct = c.get("account")!;
  if (!c.env.DOCRACY_DB) {
    return c.json({ documents: [] });
  }

  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT d.doc_id, d.title, d.status, d.created_at, d.completed_at, d.preparer_signs, s1.status AS order1_status
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
      let signTok: string | null = null;
      if (awaitingYou) {
        // Prefer KV so we can include linkNonce; if the doc isn't in KV (rare race / test fixture
        // with D1-only rows), fall back to a legacy token without a nonce.
        const doc = await getDoc(c.env, r.doc_id);
        const signer = doc?.signers.find((s) => s.order === 1);
        signTok = await signToken(r.doc_id, 1, c.env.TOKEN_SECRET, signer?.linkNonce);
      }
      return {
        docId: r.doc_id,
        title: r.title,
        status: r.status,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        statusToken: await signToken(r.doc_id, 0, c.env.TOKEN_SECRET),
        awaitingYou,
        signToken: signTok,
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

export default account;

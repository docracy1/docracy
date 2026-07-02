import { listActiveDocIds, getDoc } from "./kv";
import type { DocState, Signer } from "@docracy/shared";
import type { Env } from "@docracy/shared";

/**
 * All functions here assume `doc.accountId` is non-null — callers are responsible for gating
 * on that (see documentCreation.ts, routes/sign.ts, lib/reminders.ts) and for wrapping the call
 * in `ctx.waitUntil(...).catch(...)` so a D1 hiccup never affects the signer-facing response.
 * The two exceptions are the connector's `send_reminder`/`resend_link` action tools (Phase 2),
 * which should await these directly since the D1 write there *is* the deliverable.
 */

function nowIso(): string {
  return new Date().toISOString();
}

export async function indexDocumentCreated(env: Env, doc: DocState, originalPdfBytes: Uint8Array): Promise<void> {
  if (!doc.accountId || !env.DOCRACY_DB) return;
  const accountId = doc.accountId;
  const title = doc.title ?? "Untitled document";

  await env.DOCRACY_DB.batch([
    env.DOCRACY_DB.prepare(
      `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(doc.docId, accountId, title, doc.status, doc.preparerSigns ? 1 : 0, doc.createdAt, doc.expiresAt),
    env.DOCRACY_DB.prepare(`INSERT INTO documents_fts (doc_id, title) VALUES (?, ?)`).bind(doc.docId, title),
    ...doc.signers.map((s) => insertSignerStmt(env, doc.docId, s)),
    env.DOCRACY_DB.prepare(
      `INSERT INTO document_versions (id, doc_id, version_number, r2_key, created_at, triggered_by_signer_order, byte_size)
       VALUES (?, ?, 0, ?, ?, NULL, ?)`
    ).bind(crypto.randomUUID(), doc.docId, `docs/${doc.docId}/versions/v0.pdf`, doc.createdAt, originalPdfBytes.byteLength),
    insertAuditStmt(env, doc.docId, accountId, "created", null, null, null),
    insertAuditStmt(env, doc.docId, accountId, "invite_sent", doc.signers[0]?.order ?? null, doc.signers[0]?.name ?? null, null),
  ]);

  await env.DOCRACY_DOCS.put(`docs/${doc.docId}/versions/v0.pdf`, originalPdfBytes);
}

function insertSignerStmt(env: Env, docId: string, s: Signer) {
  return env.DOCRACY_DB!.prepare(
    `INSERT INTO signers (id, doc_id, "order", name, email, company, status, signed_at, link_sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(`${docId}:${s.order}`, docId, s.order, s.name, s.email, s.company ?? null, s.status, s.signedAt, s.linkSentAt);
}

function insertAuditStmt(
  env: Env,
  docId: string,
  accountId: string,
  eventType: string,
  signerOrder: number | null,
  actorLabel: string | null,
  detail: Record<string, unknown> | null,
  ip?: string | null
) {
  return env.DOCRACY_DB!.prepare(
    `INSERT INTO audit_events (id, doc_id, account_id, event_type, signer_order, actor_label, detail, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    docId,
    accountId,
    eventType,
    signerOrder,
    actorLabel,
    detail ? JSON.stringify(detail) : null,
    ip ?? null,
    nowIso()
  );
}

/** Only logs the *first* view per signer, so a page refresh doesn't flood the audit trail. */
export async function recordViewedOnce(env: Env, doc: DocState, signerOrder: number): Promise<void> {
  if (!doc.accountId || !env.DOCRACY_DB) return;
  const signer = doc.signers.find((s) => s.order === signerOrder);
  const existing = await env.DOCRACY_DB.prepare(
    `SELECT 1 FROM audit_events WHERE doc_id = ? AND signer_order = ? AND event_type = 'viewed' LIMIT 1`
  )
    .bind(doc.docId, signerOrder)
    .first();
  if (existing) return;
  await env.DOCRACY_DB.prepare(insertAuditSql()).bind(
    crypto.randomUUID(),
    doc.docId,
    doc.accountId,
    "viewed",
    signerOrder,
    signer?.name ?? null,
    null,
    null,
    nowIso()
  ).run();
}

function insertAuditSql(): string {
  return `INSERT INTO audit_events (id, doc_id, account_id, event_type, signer_order, actor_label, detail, ip, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
}

export async function indexSignerSigned(
  env: Env,
  doc: DocState,
  signerOrder: number,
  updatedPdfBytes: Uint8Array,
  ip: string | null
): Promise<void> {
  if (!doc.accountId || !env.DOCRACY_DB) return;
  const signer = doc.signers.find((s) => s.order === signerOrder)!;
  const versionKey = `docs/${doc.docId}/versions/v${signerOrder}.pdf`;

  await env.DOCRACY_DB.batch([
    env.DOCRACY_DB.prepare(`UPDATE signers SET status = 'signed', signed_at = ? WHERE doc_id = ? AND "order" = ?`).bind(
      signer.signedAt,
      doc.docId,
      signerOrder
    ),
    env.DOCRACY_DB.prepare(
      `INSERT INTO document_versions (id, doc_id, version_number, r2_key, created_at, triggered_by_signer_order, byte_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), doc.docId, signerOrder, versionKey, nowIso(), signerOrder, updatedPdfBytes.byteLength),
    insertAuditStmt(env, doc.docId, doc.accountId, "signed", signerOrder, signer.name, null, ip),
  ]);

  await env.DOCRACY_DOCS.put(versionKey, updatedPdfBytes);
}

export async function indexInviteSent(env: Env, doc: DocState, signerOrder: number): Promise<void> {
  if (!doc.accountId || !env.DOCRACY_DB) return;
  const signer = doc.signers.find((s) => s.order === signerOrder);
  await env.DOCRACY_DB.batch([
    env.DOCRACY_DB.prepare(`UPDATE signers SET link_sent_at = ? WHERE doc_id = ? AND "order" = ?`).bind(
      signer?.linkSentAt ?? nowIso(),
      doc.docId,
      signerOrder
    ),
    insertAuditStmt(env, doc.docId, doc.accountId, "invite_sent", signerOrder, signer?.name ?? null, null),
  ]);
}

export async function indexCompleted(env: Env, doc: DocState): Promise<void> {
  if (!doc.accountId || !env.DOCRACY_DB) return;
  await env.DOCRACY_DB.batch([
    env.DOCRACY_DB.prepare(`UPDATE documents SET status = 'completed', completed_at = ? WHERE doc_id = ?`).bind(
      doc.completedAt,
      doc.docId
    ),
    insertAuditStmt(env, doc.docId, doc.accountId, "completed", null, null, null),
  ]);
}

export async function indexReminderSent(env: Env, doc: DocState, signerOrder: number, daysWaiting: number): Promise<void> {
  if (!doc.accountId || !env.DOCRACY_DB) return;
  const signer = doc.signers.find((s) => s.order === signerOrder);
  await env.DOCRACY_DB.prepare(insertAuditSql())
    .bind(
      crypto.randomUUID(),
      doc.docId,
      doc.accountId,
      "reminder_sent",
      signerOrder,
      signer?.name ?? null,
      JSON.stringify({ daysWaiting }),
      null,
      nowIso()
    )
    .run();
}

/**
 * Drift-safety net: a `waitUntil` write above can silently fail (D1 outage, thrown exception
 * swallowed by the caller's `.catch`), leaving D1 stale relative to KV. This walks every
 * account-linked document in KV and re-upserts the `documents`/`signers` rows from the current
 * `DocState` — the part most visible to a paid user (find_documents/list_pending_by_counterparty
 * showing wrong status). It deliberately does NOT attempt to reconstruct missed
 * `document_versions`/`audit_events` rows retroactively — those represent point-in-time events
 * (and, for versions, PDF bytes) that a status-only reconciliation pass can't recover after the
 * fact. Runs once daily alongside the reminder sweep; safe to run repeatedly (pure upsert).
 */
export async function reconcileD1Index(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const docIds = await listActiveDocIds(env);
  for (const docId of docIds) {
    const doc = await getDoc(env, docId);
    if (!doc || !doc.accountId) continue;
    try {
      await upsertDocumentAndSigners(env, doc);
    } catch (err) {
      console.error(`D1 reconciliation failed for doc ${docId} (non-fatal):`, err);
    }
  }
}

async function upsertDocumentAndSigners(env: Env, doc: DocState): Promise<void> {
  const title = doc.title ?? "Untitled document";
  await env.DOCRACY_DB!.batch([
    env.DOCRACY_DB!.prepare(
      `INSERT INTO documents (doc_id, account_id, title, status, preparer_signs, created_at, completed_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(doc_id) DO UPDATE SET status = excluded.status, completed_at = excluded.completed_at`
    ).bind(
      doc.docId,
      doc.accountId,
      title,
      doc.status,
      doc.preparerSigns ? 1 : 0,
      doc.createdAt,
      doc.completedAt,
      doc.expiresAt
    ),
    ...doc.signers.map((s) =>
      env.DOCRACY_DB!.prepare(
        `INSERT INTO signers (id, doc_id, "order", name, email, company, status, signed_at, link_sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(doc_id, "order") DO UPDATE SET
           status = excluded.status, signed_at = excluded.signed_at, link_sent_at = excluded.link_sent_at`
      ).bind(`${doc.docId}:${s.order}`, doc.docId, s.order, s.name, s.email, s.company ?? null, s.status, s.signedAt, s.linkSentAt)
    ),
    // FTS5 has no natural upsert — delete-then-insert avoids duplicate rows if this doc was
    // never indexed on creation (the failure case reconciliation exists to correct).
    env.DOCRACY_DB!.prepare(`DELETE FROM documents_fts WHERE doc_id = ?`).bind(doc.docId),
    env.DOCRACY_DB!.prepare(`INSERT INTO documents_fts (doc_id, title) VALUES (?, ?)`).bind(doc.docId, title),
  ]);
}

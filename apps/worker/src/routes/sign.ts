import { Hono } from "hono";
import { getDoc, putDoc, isSignerOnTurn, currentTurnOrder } from "../lib/kv";
import { burnFields, type FieldValue } from "../lib/pdf";
import { sendSigningInvite, sendCompletionEmails } from "../lib/email";
import { recordViewedOnce, indexSignerSigned, indexInviteSent, indexCompleted } from "../lib/index-d1";
import { verifyToken, signToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

function indexNonFatal(
  ctx: { waitUntil(promise: Promise<unknown>): void },
  docId: string,
  label: string,
  work: Promise<void>
) {
  ctx.waitUntil(work.catch((err) => console.error(`D1 indexing (${label}) failed for doc ${docId} (non-fatal):`, err)));
}

const sign = new Hono<{ Bindings: Env }>();

function statusPayload(doc: Awaited<ReturnType<typeof getDoc>>) {
  if (!doc) return null;
  return {
    docId: doc.docId,
    status: doc.status,
    signers: [...doc.signers]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ order: s.order, name: s.name, status: s.status, signedAt: s.signedAt })),
  };
}

sign.get("/status/:token", async (c) => {
  const verified = await verifyToken(c.req.param("token"), c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 403);

  const doc = await getDoc(c.env, verified.docId);
  if (!doc) return c.json({ error: "This document has expired or doesn't exist" }, 404);

  return c.json(statusPayload(doc));
});

sign.get("/sign/:token", async (c) => {
  const verified = await verifyToken(c.req.param("token"), c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 403);

  const doc = await getDoc(c.env, verified.docId);
  if (!doc) return c.json({ error: "This document has expired or doesn't exist" }, 404);

  if (!isSignerOnTurn(doc, verified.order)) {
    return c.json({ onTurn: false, status: statusPayload(doc) });
  }

  if (doc.accountId) {
    indexNonFatal(c.executionCtx, doc.docId, "viewed", recordViewedOnce(c.env, doc, verified.order));
  }

  const pdfObj = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/working.pdf`);
  if (!pdfObj) return c.json({ error: "Document blob missing" }, 404);
  const pdfBase64 = arrayBufferToBase64(await pdfObj.arrayBuffer());

  return c.json({
    onTurn: true,
    docId: doc.docId,
    pdfBase64,
    fields: doc.fields.filter((f) => f.signerOrder === verified.order),
    status: statusPayload(doc),
  });
});

sign.post("/sign/:token", async (c) => {
  const verified = await verifyToken(c.req.param("token"), c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 403);

  const doc = await getDoc(c.env, verified.docId);
  if (!doc) return c.json({ error: "This document has expired or doesn't exist" }, 404);

  if (!isSignerOnTurn(doc, verified.order)) {
    return c.json({ error: "It's not your turn to sign yet" }, 409);
  }

  const body = await c.req.json<{ values: FieldValue[] }>();
  const myFields = doc.fields.filter((f) => f.signerOrder === verified.order);

  const valueById = new Map(body.values?.map((v) => [v.fieldId, v.value]) ?? []);
  const missing = myFields.some((f) => !valueById.get(f.id)?.trim());
  if (missing) {
    return c.json({ error: "Please fill in every field before submitting" }, 400);
  }

  const workingObj = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/working.pdf`);
  if (!workingObj) return c.json({ error: "Document blob missing" }, 404);
  const workingBytes = new Uint8Array(await workingObj.arrayBuffer());

  const signer = doc.signers.find((s) => s.order === verified.order)!;
  const signedAt = new Date().toISOString();

  const updatedBytes = await burnFields(workingBytes, myFields, body.values, signer.email, signedAt);
  await c.env.DOCRACY_DOCS.put(`docs/${doc.docId}/working.pdf`, updatedBytes);

  signer.status = "signed";
  signer.signedAt = signedAt;

  if (doc.accountId) {
    const ip = c.req.header("CF-Connecting-IP") ?? null;
    indexNonFatal(c.executionCtx, doc.docId, "signed", indexSignerSigned(c.env, doc, verified.order, updatedBytes, ip));
  }

  const nextOrder = currentTurnOrder(doc);
  if (nextOrder !== null) {
    const nextSigner = doc.signers.find((s) => s.order === nextOrder)!;
    nextSigner.linkSentAt = new Date().toISOString();
    await putDoc(c.env, doc);

    const nextToken = await signToken(doc.docId, nextOrder, c.env.TOKEN_SECRET);
    await sendSigningInvite(c.env, doc, nextOrder, nextToken);

    if (doc.accountId) {
      indexNonFatal(c.executionCtx, doc.docId, "invite_sent", indexInviteSent(c.env, doc, nextOrder));
    }
  } else {
    doc.status = "completed";
    doc.completedAt = new Date().toISOString();
    await c.env.DOCRACY_DOCS.put(`docs/${doc.docId}/final.pdf`, updatedBytes);
    await putDoc(c.env, doc);
    await sendCompletionEmails(c.env, doc, updatedBytes);

    if (doc.accountId) {
      indexNonFatal(c.executionCtx, doc.docId, "completed", indexCompleted(c.env, doc));
    }
  }

  return c.json({ ok: true, status: statusPayload(doc) });
});

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export default sign;
